require('dotenv').config();
const fs = require('fs')
const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const session = require('express-session')
const app = express()
const port = 3001;
const redisClient = require('./db/redis');
const freesoundService = require('./services/freesoundService');
const { cacheFetch } = require('./db/cache');

//changed ** for combined audio download
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const authService = require('./services/authService');

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
app.use(express.static('public'));

// Add session middleware BEFORE passport initialization
app.use(session({
  secret: process.env.SESSION_SECRET || 'test-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax', // Allows cookies to be sent in cross-origin requests
    httpOnly: true // for security
  }
}));

// Initialize Passport AFTER session middleware
app.use(passport.initialize());
app.use(passport.session());

// Add this after passport initialization
passport.serializeUser((user, done) => {
  done(null, user.user_id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const db = require('./db/config');
    const result = await db.query(
      'SELECT * FROM "User" WHERE user_id = $1',
      [id]
    );
    
    // Get the first user from the result
    const user = result.rows[0];
    
    done(null, user);
  } catch (error) {
    console.error('Error deserializing user:', error);
    done(error, null);
  }
});

// Configure Passport
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3001/api/auth/google/callback"
  },
  async function(accessToken, refreshToken, profile, cb) {
    try {
      console.log('Google profile received:', profile);
      const db = require('./db/config');
      
      // Check if user exists
      let user = await db.query(
        'SELECT * FROM "User" WHERE email = $1',
        [profile.emails[0].value]
      );

      if (user.rows.length === 0) {
        console.log('Creating new user for:', profile.emails[0].value);
        // Create new user if doesn't exist
        user = await db.query(
          'INSERT INTO "User" (username, email) VALUES ($1, $2) RETURNING *',
          [profile.displayName, profile.emails[0].value]
        );
      }

      console.log('User found/created:', user.rows[0]);
      return cb(null, user.rows[0]);
    } catch (error) {
      console.error('Error in Google Strategy:', error);
      return cb(error, null);
    }
  }
));

async function waitForPythonService(maxAttempts = 10) {
    for (let i = 0; i < maxAttempts; i++) {
        try {
            const response = await fetch("http://soundscape-python:3002/health", {
                method: "GET"
            });
            if (response.ok) {
                console.log("Python service is ready");
                return true;
            }
        } catch (error) {
            console.log(`Waiting for Python service... attempt ${i + 1}/${maxAttempts}`);
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
    console.log("Warning: Python service not ready after all attempts, but continuing startup...");
    return false;
}

app.post('/api/keywords', async (req, res) => {
    console.log("Receiving POST request to /keywords endpoint")
    const { str } = req.body 
    console.log(req.body)

    try {
        if (!redisClient.isReady) {
            console.error("Redis client not ready");
            return res.status(500).json({
                success: false,
                message: "Internal server error: Cache service unavailable. Please try again later."
            });
        }

        console.log("Checking Redis cache for:", `keywords:${str}`);
        const cachedResult = await redisClient.get(`keywords:${str}`);
        
        if (cachedResult){
            console.log("Cache HIT - Returning cached result");
            return res.status(200).json(JSON.parse(cachedResult));
        }
        console.log("Cache MISS - Fetching from Python service");

        // Attempt up to 3 times
        let retries = 3;
        let response;
        while (retries > 0) {
            try {
                response = await fetch("http://soundscape-python:3002/api/keywords", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ str })
                });
                break; // If successful, stop retry loop
            } catch (error) {
                retries--;
                if (retries === 0) {
                    console.error("Failed to reach Python service after multiple attempts:", error);
                    return res.status(503).json({
                        success: false, 
                        message: "Service temporarily unavailable. Please try again later."
                    });
                }
                console.log(`Retrying Python service request... ${retries} attempts remaining`);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        // Parse JSON response once
        let jsonResponse;
        try {
            jsonResponse = await response.json();
        } catch (error) {
            console.error("Failed to parse Python service response:", error);
            return res.status(500).json({
                success: false,
                message: "Error processing the soundscape request. Please try again."
            });
        }

        if (response.ok) {
            if (!jsonResponse.success) {
                console.log("Error in python response, success=false");
                return res.status(400).json({
                    success: false,
                    message: jsonResponse.message || "Unable to process your soundscape request.",
                    is_valid_input: jsonResponse.is_valid_input || false,
                    suggestions: jsonResponse.suggestions || [
                        "forest with birds and a stream",
                        "busy cafe with people talking",
                        "thunderstorm at night",
                        "ocean waves on a beach",
                        "spaceship engine room humming"
                    ]
                });
            }

            // Check if preview URLs are present
            if (jsonResponse && jsonResponse.success && jsonResponse.sounds) {
                console.log("Checking preview URLs in sounds:");
                jsonResponse.sounds.forEach((sound, index) => {
                    console.log(`Sound ${index} preview_url:`, sound.preview_url);
                });
            }

            // Cache result if success
            console.log("got keywords:");
            console.log(jsonResponse);
            
            if (jsonResponse && jsonResponse.success) {
                await redisClient.set(`keywords:${str}`, JSON.stringify(jsonResponse));
            }
            
            return res.status(200).json(jsonResponse);
        } else {
            // Non-OK response
            console.log("Python service returned non-OK response:", response.status);
            
            // Use the error message from the Python service if available
            return res.status(400).json({
                success: false,
                message: jsonResponse?.message || "Failed to process your soundscape request.",
                suggestions: [
                    "forest with birds and a stream",
                    "busy cafe with people talking",
                    "thunderstorm at night",
                    "ocean waves on a beach",
                    "spaceship engine room humming"
                ]
            });
        }
    } catch (error) {
        console.log("Error: ", error);
        return res.status(500).json({
            success: false, 
            message: "Server error processing the soundscape request. Please try again later.",
            suggestions: [
                "forest with birds and a stream",
                "busy cafe with people talking",
                "thunderstorm at night",
                "ocean waves on a beach",
                "spaceship engine room humming"
            ]
        });
    }
});

// Add track names endpoint
app.post('/api/track-names', async (req, res) => {
    console.log("Receiving POST request to /track-names endpoint");
    const { sounds } = req.body;
    console.log(`Request to generate names for ${sounds.length} sounds`);

    try {
        if (!redisClient.isReady) {
            console.error("Redis client not ready");
            return res.status(500).json({
                success: false,
                message: "Internal server error: Cache service unavailable. Please try again later."
            });
        }
        
        // Create a cache key based on sound names and descriptions
        const cacheKey = `track-names:${sounds.map(s => `${s.name}-${s.description?.substring(0, 50)}`).join('|')}`;
        console.log("Checking Redis cache for:", cacheKey);
        const cachedResult = await redisClient.get(cacheKey);
        
        if (cachedResult) {
            console.log("Cache HIT - Returning cached track names");
            return res.status(200).json(JSON.parse(cachedResult));
        }
        console.log("Cache MISS - Fetching from Python service");

        // Attempt up to 3 times
        let retries = 3;
        let response;
        while (retries > 0) {
            try {
                response = await fetch("http://soundscape-python:3002/api/track-names", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ sounds })
                });
                break; // If successful, stop retry loop
            } catch (error) {
                retries--;
                if (retries === 0) {
                    console.error("Failed to reach Python service after multiple attempts:", error);
                    return res.status(503).json({
                        success: false, 
                        message: "Service temporarily unavailable. Please try again later."
                    });
                }
                console.log(`Retrying Python service request... ${retries} attempts remaining`);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        // Parse JSON response once
        let jsonResponse;
        try {
            jsonResponse = await response.json();
        } catch (error) {
            console.error("Failed to parse Python service response:", error);
            return res.status(500).json({
                success: false,
                message: "Error processing the track names request. Please try again."
            });
        }

        if (response.ok) {
            // Cache successful result
            if (jsonResponse && jsonResponse.success) {
                console.log("Got track names:", jsonResponse);
                await redisClient.set(cacheKey, JSON.stringify(jsonResponse));
            }
            
            return res.status(200).json(jsonResponse);
        } else {
            console.error("Python service returned error:", jsonResponse);
            return res.status(response.status || 500).json({
                success: false,
                message: jsonResponse.message || "Failed to generate track names."
            });
        }
    } catch (error) {
        console.error("Error handling track names request:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error. Please try again later."
        });
    }
});

// Download a sound from Freesound API
app.post('/api/sounds/download', async (req, res) => {
    console.log("Received download request with body:", req.body);
    const { freesoundId, sourceUrl, name, description, previewUrl } = req.body;
    
    if (!sourceUrl) {
        console.error("Missing required parameters:", { sourceUrl });
        return res.status(400).json({ 
            success: false, 
            message: 'Missing required parameter: sourceUrl is required' 
        });
    }
    
    try {
        // Check if the sound already exists in the database
        const existingSound = await freesoundService.getSoundByFreesoundId(freesoundId, sourceUrl);
        
        if (existingSound) {
            console.log("Sound already exists in database:", existingSound);
            
            // Update the name and preview_url if provided and different from existing
            if ((name && name !== existingSound.name) || 
                (previewUrl && previewUrl !== existingSound.preview_url)) {
                
                const db = require('./db/config');
                const updateFields = [];
                const updateValues = [];
                let valueIndex = 1;
                
                if (name && name !== existingSound.name) {
                    updateFields.push(`name = $${valueIndex}`);
                    updateValues.push(name);
                    valueIndex++;
                }
                
                if (previewUrl && previewUrl !== existingSound.preview_url) {
                    updateFields.push(`preview_url = $${valueIndex}`);
                    updateValues.push(previewUrl);
                    valueIndex++;
                }
                
                if (updateFields.length > 0) {
                    updateValues.push(existingSound.sound_id);
                    const updateQuery = `UPDATE "Sound" SET ${updateFields.join(', ')}, updated_at = NOW() WHERE sound_id = $${valueIndex} RETURNING *`;
                    
                    console.log(`Updating sound ${existingSound.sound_id} with new name/preview URL`);
                    const result = await db.query(updateQuery, updateValues);
                    
                    if (result.rows.length > 0) {
                        console.log("Sound updated successfully:", result.rows[0]);
                        return res.status(200).json({
                            success: true,
                            message: 'Sound exists and was updated with new information',
                            sound: result.rows[0]
                        });
                    }
                }
            }
            
            return res.status(200).json({ 
                success: true, 
                message: 'Sound already exists in the database',
                sound: existingSound
            });
        }
        
        console.log("Downloading sound:", { freesoundId, sourceUrl, name, previewUrl });
        const sound = await freesoundService.downloadAndSaveSound(
            freesoundId, 
            sourceUrl, 
            name || 'Unnamed Sound', 
            description || '',
            previewUrl
        );
        
        console.log("Sound downloaded and saved successfully:", sound);
        return res.status(201).json({ 
            success: true, 
            message: 'Sound downloaded and saved successfully',
            sound
        });
    } catch (error) {
        console.error('Error downloading sound:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Error downloading sound: ' + error.message 
        });
    }
});

// Retrieve all sounds from the database
app.get('/api/sounds', async (req, res) => {
    try {
        const db = require('./db/config');
        const result = await db.query('SELECT * FROM "Sound" ORDER BY created_at DESC');
        
        return res.status(200).json({ 
            success: true, 
            sounds: result.rows 
        });
    } catch (error) {
        console.error('Error getting sounds:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Error getting sounds: ' + error.message 
        });
    }
});

// Create a new soundscape
app.post('/api/soundscapes', async (req, res) => {
    const { name, description, user_id, sound_ids } = req.body;
    
    if (!name || !sound_ids || !Array.isArray(sound_ids)) {
        return res.status(400).json({
            success: false,
            message: 'Missing required parameters: name and sound_ids array are required'
        });
    }
    
    const db = require('./db/config');
    
    try {
        await db.query('BEGIN');
        
        // Check if the soundscape exists
        let soundscape;
        const existingResult = await db.query(
            'SELECT * FROM "Soundscape" WHERE name = $1 AND description = $2',
            [name, description || '']
        );
        
        if (existingResult.rows.length > 0) {
            // Soundscape exists, use it
            soundscape = existingResult.rows[0];
            
            // Delete any existing sound associations for this soundscape
            await db.query(
                'DELETE FROM "SoundscapeSound" WHERE soundscape_id = $1',
                [soundscape.soundscape_id]
            );
        } else {
            // Create a new soundscape
            const soundscapeResult = await db.query(
                'INSERT INTO "Soundscape" (name, description, user_id) VALUES ($1, $2, $3) RETURNING *',
                [name, description || '', user_id || null]
            );
            soundscape = soundscapeResult.rows[0];
        }
        
        // Filter out duplicate sound_ids
        const uniqueSounds = {};
        for (const soundItem of sound_ids) {
            const { sound_id, volume = 1.0, pan = 0.0 } = soundItem;
            if (!uniqueSounds[sound_id]) {
                uniqueSounds[sound_id] = { sound_id, volume, pan };
            }
        }
        
        // Insert each unique sound into the soundscape
        for (const soundId in uniqueSounds) {
            const { sound_id, volume, pan } = uniqueSounds[soundId];
            
            await db.query(
                'INSERT INTO "SoundscapeSound" (soundscape_id, sound_id, volume, pan) VALUES ($1, $2, $3, $4)',
                [soundscape.soundscape_id, sound_id, volume, pan]
            );
        }
        
        await db.query('COMMIT');
        
        return res.status(201).json({
            success: true,
            message: existingResult?.rows.length > 0 ? 'Soundscape updated successfully' : 'Soundscape created successfully',
            soundscape,
            isUpdate: existingResult?.rows.length > 0
        });
    } catch (error) {
        await db.query('ROLLBACK');
        console.error('Error creating soundscape:', error);
        return res.status(500).json({
            success: false,
            message: 'Error with soundscape: ' + error.message,
            error_code: error.code
        });
    }
});

// Get a soundscape by ID with its associated sounds
app.get('/api/soundscapes/:id', async (req, res) => {
    const soundscapeId = req.params.id;
    const redisKey = `soundscape:${soundscapeId}`;
    
    if (!soundscapeId) {
        return res.status(400).json({
            success: false,
            message: 'Soundscape ID is required'
        });
    }
    
    const db = require('./db/config');
    
    try {
        const result = await cacheFetch(redisKey, async () => {
            
            const soundscapeResult = await db.query( // retrieve soundscape from db
                'SELECT * FROM "Soundscape" WHERE soundscape_id = $1',
                [soundscapeId]
            );
            
            if (soundscapeResult.rows.length === 0) { // if soundscape not found
                throw new Error ('Soundscape not found')
            }
            
            const soundscape = soundscapeResult.rows[0];
            
            const soundsResult = await db.query( // retrieve each sound in the soundscape
                `SELECT s.*, ss.volume, ss.pan 
                FROM "Sound" s
                JOIN "SoundscapeSound" ss ON s.sound_id = ss.sound_id
                WHERE ss.soundscape_id = $1`,
                [soundscapeId]
            );
        
            return {
                success: true,
                soundscape,
                sounds: soundsResult.rows
            };
        });

        res.status(200).json(result);

    } catch (error) {
        console.error('Error getting soundscape:', error);
        return res.status(500).json({
            success: false,
            message: 'Error getting soundscape: ' + error.message
        });
    }
});

// To download tracks and finalized as one mp3
app.get('/api/soundscapes/:id/download', async (req, res) => {

    const soundscapeId = req.params.id;
    // check if hit
    console.log(`Download route; Hit with soundscape ID: ${soundscapeId}`)

    if (!soundscapeId) {
      return res.status(400).json({ success: false, message: 'Soundscape ID is required' });
    }
  
    const db = require('./db/config');
  
    try {
      const soundsResult = await db.query(
        `SELECT s.file_path, s.name, ss.volume, ss.pan
         FROM "Sound" s
         JOIN "SoundscapeSound" ss ON s.sound_id = ss.sound_id
         WHERE ss.soundscape_id = $1`,
        [soundscapeId]
      );
  
      const rows = soundsResult.rows;
      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: "No sounds found for this soundscape." });
      }
      
      console.warn("No sounds found for this soundscape, skipping FFmpeg.");

      const files = rows.map(r => {
        // Using preview_url (since it's a local copy), fallback to file_path
        const relativePath = (r.preview_url || r.file_path || '').replace(/^\/?/, '');
        return path.join(__dirname, 'public', relativePath);
      })

      //  Filter out any missing files, e.g those deleted
      const existingRows = rows.filter((_, i) => fs.existsSync(files[i]));
      const existingFiles = files.filter(fs.existsSync);

      if (existingFiles.length === 0) {
        return res.status(404).json({ success: false, message: "No valid sounds found for merging" });
      }

      // check logs for any missing files
      console.log("Files fetched from DB:", files);

      existingFiles.forEach((filePath, idx) => {
        const exists = fs.existsSync(filePath);
        console.log(`File ${idx + 1}: ${filePath} -- ${exists ? 'File exists' : 'File is missing'}`);
        });

      // temp path for dowload
      const outputPath = `/tmp/soundscape_${soundscapeId}.mp3`;
      
      console.log("Final output path:", JSON.stringify(outputPath));

      const command = ffmpeg();
  
      const TARGET_DURATION = 90; // seconds
      existingFiles.forEach(file => {
        command.input(file)
          .inputOptions([
            `-stream_loop -1`,          // loop infinitely
            `-t ${TARGET_DURATION}`     // but clip total to 90 seconds
        ]);
      });

      // Generate per track filter chains for volume + pan
      const volumePanFilters = existingRows.map((row, i) => {
        const input = `[${i}:a]`;
 
        // Clamp dB between -30 (soft) and 0 (loud)
        const clampedDb = Math.max(-30, Math.min(0, row.volume ?? 0));
        const linearVolume = Math.pow(10, clampedDb / 20).toFixed(4);

        const pan = Math.max(-1.0, Math.min(1.0, row.pan ?? 0.0)); // Clamp pan to between -1 and 1

        const left = ((1 - pan) / 2).toFixed(2);
        const right = ((1 + pan) / 2).toFixed(2);
        
        console.log(`Track ${i} "${row.name}" volume: ${row.volume} dB → linear ${linearVolume}`); // check tracks

        return `${input}volume=${linearVolume},pan=stereo|c0=${left}*FL|c1=${right}*FR[out${i}]`;
      });

      // Combine all filtered outputs using amix
      const amixInputs = existingRows.map((_, i) => `[out${i}]`).join('');
      const fullFilter = [
        ...volumePanFilters,
        `${amixInputs}amix=inputs=${rows.length}:duration=longest[amixout]`, 
        `[amixout]volume=3.0[out]` // boost entire mix vol
      ];

      // Apply filter + save to temporary output path
      command
       .complexFilter(fullFilter, 'out')
       .audioCodec('libmp3lame')
       .output(outputPath)    
       .on('start', cmd => {
           console.log("FFmpeg command:", cmd);
        })
       .on('error', err => {
            console.error('FFmpeg error:', err.message);
            if (!res.headersSent) {
              return res.status(500).json({ success: false, message: "Error mixing audio." });
            }
        })
       .on('end', () => {
           console.log('Merge finished');
           res.download(outputPath, `soundscape_${soundscapeId}.mp3`, err => {
             if (err) console.error('Send error:', err);
             fs.unlink(outputPath, () => {});
           });
        })

      console.log("Running FFmpeg");
      command.run();

    } catch (error) {
      console.error('Download error:', error);
      res.status(500).json({ success: false, message: 'Error generating soundscape: ' + error.message });
    }
});

// Google Auth routes with better error handling
app.get('/api/auth/google',
  (req, res, next) => {
    console.log('Starting Google OAuth flow');
    next();
  },
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    failureRedirect: 'http://localhost:3000/login?error=auth_failed'
  })
);

app.get('/api/auth/google/callback', 
  (req, res, next) => {
    console.log('Received Google OAuth callback');
    next();
  },
  passport.authenticate('google', { 
    failureRedirect: 'http://localhost:3000/login?error=auth_failed' 
  }),
  (req, res) => {
    try {
      console.log('Google authentication successful');
      const token = authService.generateToken(req.user);
      
      // Send token and user data to the client via postMessage
      res.send(`
        <html>
          <body>
            <script>
              try {
                window.opener.postMessage(
                  { 
                    token: "${token}", 
                    user: ${JSON.stringify(req.user)}
                  }, 
                  "http://localhost:3000"
                );
                window.close();
              } catch (error) {
                console.error('Error in postMessage:', error);
                window.location.href = 'http://localhost:3000/login?error=message_failed';
              }
            </script>
          </body>
        </html>
      `);
    } catch (error) {
      console.error('Error in Google callback:', error);
      res.redirect('http://localhost:3000/login?error=server_error');
    }
  }
);

// Add this route to check if user is authenticated
app.get('/api/auth/status', (req, res) => {
  if (req.isAuthenticated()) {
    // User is authenticated, return user info (excluding sensitive data)
    const user = { ...req.user };
    
    // Remove sensitive information
    if (user.password) delete user.password;
    
    res.json({
      isAuthenticated: true,
      user: user
    });
  } else {
    // User is not authenticated
    res.json({
      isAuthenticated: false,
      user: null
    });
  }
});

// Add a logout route
app.get('/api/auth/logout', (req, res) => {
  req.logout(function(err) {
    if (err) {
      return res.status(500).json({ error: 'Error during logout' });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized' });
};

// Example of a protected route
app.get('/api/user/profile', isAuthenticated, (req, res) => {
  res.json({ user: req.user });
});

// redis homepage

app.get('/api/homepage-sounds', async (req, res) => {
    const cacheKey = 'homepage:sounds';
    try {
      // Check if the sounds are cached in Redis
      if (redisClient.isReady) {
        const cachedSounds = await redisClient.get(cacheKey);
        if (cachedSounds) {
          console.log('Cache hit for homepage sounds');
          return res.status(200).json({ success: true, sounds: JSON.parse(cachedSounds) });
        }
      } else {
        console.warn('Redis client not ready, skipping cache check');
      }
  
      // If not cached, query the database.
      const db = require('./db/config');
      const result = await db.query('SELECT * FROM "Sound" LIMIT 3');
      
      // Cache the result in Redis for one hour (3600 seconds)
      if (redisClient.isReady) {
        await redisClient.set(cacheKey, JSON.stringify(result.rows), { EX: 3600 });
      }
      
      return res.status(200).json({ success: true, sounds: result.rows });
    } catch (error) {
      console.error('Error fetching homepage sounds:', error);
      return res.status(500).json({ success: false, message: 'Error fetching homepage sounds: ' + error.message });
    }
  });
  
// Add error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log('Environment:', process.env.NODE_ENV || 'development');
  console.log('CORS enabled for origins:', ['http://localhost:3000', 'http://localhost:3001']);
}).on('error', (err) => {
  console.error('Server failed to start:', err);
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Please choose a different port or close the application using it.`);
  }
});
  