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

// Deserialize the user from the database
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

// Wait for the Python service to be ready before starting the server
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

// This endpoint is used to get the keywords for the soundscape
app.post('/api/keywords', async (req, res) => {
    console.log("Receiving POST request to /keywords endpoint")
    const { str } = req.body 
    console.log(req.body)

    try { // If there is an error, print an error message
        if (!redisClient.isReady) {
            console.error("Redis client not ready");
            return res.status(500).json({
                success: false,
                message: "Internal server error: Cache service unavailable. Please try again later."
            });
        }

        console.log("Checking Redis cache for:", `keywords:${str}`);
        const cachedResult = await redisClient.get(`keywords:${str}`);
        
        if (cachedResult){ // If the result is in the cache, return the result
            console.log("Cache HIT - Returning cached result");
            return res.status(200).json(JSON.parse(cachedResult));
        }
        console.log("Cache MISS - Fetching from Python service");

        // Attempt up to 3 times
        let retries = 3;
        let response;
        while (retries > 0) { // If the result is not in the cache, attempt to fetch from the Python service
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

        if (response.ok) { // If the response is successful
            if (!jsonResponse.success) { // If the response is not successful, print an error message
                console.log("Error in python response, success=false");
                return res.status(400).json({ // Return a JSON with success = false, message = ...
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
            
            if (jsonResponse && jsonResponse.success) { // If the response is successful, cache the result
                await redisClient.set(`keywords:${str}`, JSON.stringify(jsonResponse));
            }
            
            return res.status(200).json(jsonResponse); // Return the result
        } else {
            // Non-OK response
            console.log("Python service returned non-OK response:", response.status);
            
            // Use the error message from the Python service if available
            return res.status(400).json({ // Return a JSON with success = false, message = ...
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
    } catch (error) { // If there is an error, print an error message
        console.log("Error: ", error);
        return res.status(500).json({ // Return a JSON with success = false, message = ...
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

app.get('/api/autogen-prompt', async (req, res) => {
  console.log(" Receiving GET request to /autogen-prompt");

  try {
      // Fetching from backend
      console.log("no cache: Fetching from Python /api/auto-keywords");
      const response = await fetch("http://soundscape-python:3002/api/auto-keywords");

      const jsonResponse = await response.json();

      if (!response.ok || !jsonResponse.success) {
          console.error(" Unsuccessful response");
          return res.status(400).json({
              success: false,
              message: jsonResponse.message || "Failed to generate soundscape."
          });
      }

      // Log sound URLs (optional for debugging)
      if (jsonResponse.sounds) {
          jsonResponse.sounds.forEach((sound, i) =>
              console.log(`Sound ${i + 1}:`, sound.preview_url)
          );
      }

      // No caching every call is unique

      // Propagate to frontend
      return res.status(200).json(jsonResponse);

  } catch (error) {
      console.error("Error in /api/autogen-prompt:", error);
      return res.status(500).json({
          success: false,
          message: "Server error while generating surprise soundscape."
      });
  }
});

// Add track names endpoint
app.post('/api/track-names', async (req, res) => {
    console.log("Receiving POST request to /track-names endpoint");
    const { sounds } = req.body;
    console.log(`Request to generate names for ${sounds.length} sounds`);

    try { // If there is an error, print an error message
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
        } catch (error) { // If there is an error, print an error message
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
        } else { // If the response is not successful, print an error message
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
        
        if (existingSound) { // If the sound already exists in the database, return the sound
            console.log("Sound already exists in database:", existingSound);
            
            // Return the existing sound immediately
            return res.status(200).json({ 
                success: true, 
                message: 'Sound already exists in database',
                sound: existingSound,
                isExisting: true
            });
        }
        
        // If sound doesn't exist, download and save it
        const sound = await freesoundService.downloadAndSaveSound(
            freesoundId, 
            sourceUrl, 
            name || 'Unnamed Sound', 
            description || '',
            previewUrl
        );
        
        console.log("Sound downloaded and saved successfully:", sound);
        return res.status(201).json({ // Return a JSON with success = true, message = ...
            success: true, 
            message: 'Sound downloaded and saved successfully',
            sound
        });
    } catch (error) { // If there is an error, print an error message
        console.error('Error downloading sound:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Error downloading sound: ' + error.message 
        });
    }
});

// Search for a single sound using a query
app.post('/api/sounds/search', async (req, res) => {
    const { query, filter } = req.body;
    
    if (!query) {
        return res.status(400).json({
            success: false,
            message: 'Query is required'
        });
    }
    
    try {
        // Use the freesoundService to search directly with advanced options
        const searchOptions = {
            // Default to prioritizing shorter sounds (under 60 seconds)
            filter: filter || "duration:[0 TO 60]",
            // Sort by relevance (score)
            sort: "score"
        };
        
        const freesoundResult = await freesoundService.searchFreesound(query, 1, searchOptions);
        
        if (!freesoundResult.results || freesoundResult.results.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No sound found for the given query'
            });
        }
        
        // Get the first result
        const sound = freesoundResult.results[0];
        
        // Format the response to match what our front-end expects
        const soundResponse = {
            sound_number: "Sound 1",
            name: sound.name || "Unnamed Sound",
            description: sound.description || "No description available",
            sound_url: sound.download || "",
            preview_url: sound.preview_url || "",
            freesound_id: sound.id,
            duration: sound.duration || 0,
            license: sound.license || ""
        };
        
        return res.status(200).json({
            success: true,
            sound: soundResponse
        });
    } catch (error) { // If there is an error, print an error message
        console.error('Error searching for sound:', error);
        return res.status(500).json({
            success: false,
            message: 'Error searching for sound: ' + error.message
        });
    }
});

// Retrieve all sounds from the database
app.get('/api/sounds', async (req, res) => {
    try { // If there is an error, print an error message
        const db = require('./db/config');
        const result = await db.query('SELECT * FROM "Sound" ORDER BY created_at DESC');
        
        return res.status(200).json({ 
            success: true, 
            sounds: result.rows 
        });
    } catch (error) { // If there is an error, print an error message
        console.error('Error getting sounds:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Error getting sounds: ' + error.message 
        });
    }
});

// Create a new soundscape
app.post('/api/soundscapes', async (req, res) => {
    const { name, description, user_id, sound_ids, image_url } = req.body; // added to accept image
    
    if (!name || !sound_ids || !Array.isArray(sound_ids)) { // If the name or sound_ids are not provided, print an error message
        return res.status(400).json({
            success: false,
            message: 'Missing required parameters: name and sound_ids array are required'
        });
    }
    
    const db = require('./db/config');
    
    try { // If there is an error, print an error message
        await db.query('BEGIN');
        
        // Check if the soundscape exists with the same name/description
        let soundscape;
        const existingResult = await db.query(
            'SELECT * FROM "Soundscape" WHERE name = $1 AND description = $2',
            [name, description || '']
        );
        
        if (existingResult.rows.length > 0) { // If the soundscape exists, use it
            // Soundscape exists, use it
            soundscape = existingResult.rows[0];
            
            // Delete any existing sound associations for this soundscape
            await db.query(
                'DELETE FROM "SoundscapeSound" WHERE soundscape_id = $1',
                [soundscape.soundscape_id]
            );
        } else { // If the soundscape does not exist, create a new soundscape
            // Create a new soundscape, ensuring we don't conflict with existing IDs
            try {
                const soundscapeResult = await db.query(
                    'INSERT INTO "Soundscape" (name, description, user_id, image_url) VALUES ($1, $2, $3, $4) RETURNING *',
                    [name, description || '', user_id || null, image_url || null]
                );
                soundscape = soundscapeResult.rows[0];
            } catch (insertError) { // If there is an error, print an error message
                if (insertError.code === '23505' && insertError.constraint === 'Soundscape_pkey') {
                    // Primary key violation - try to get a valid ID by checking the sequence
                    const seqResult = await db.query('SELECT last_value FROM "Soundscape_soundscape_id_seq"');
                    const lastSeqValue = seqResult.rows[0].last_value;
                    
                    // Get the max ID to ensure we're ahead of any manually inserted values
                    const maxIdResult = await db.query('SELECT MAX(soundscape_id) FROM "Soundscape"');
                    const maxId = maxIdResult.rows[0].max || 0;
                    
                    // Use whichever is higher and add 1
                    const nextId = Math.max(lastSeqValue, maxId) + 1;
                    
                    // Update the sequence
                    await db.query(`SELECT setval('"Soundscape_soundscape_id_seq"', ${nextId - 1}, true)`);
                    
                    // Try insert again
                    const soundscapeResult = await db.query(
                        'INSERT INTO "Soundscape" (name, description, user_id, image_url) VALUES ($1, $2, $3, $4) RETURNING *',
                        [name, description || '', user_id || null, image_url || null]
                    );
                    soundscape = soundscapeResult.rows[0];
                } else { // If there is an error, print an error message
                    throw insertError;
                }
            }
        }
        
        // Filter out duplicate sound_ids
        const uniqueSounds = {};
        for (const soundItem of sound_ids) { // For each sound in the sound_ids array
            const { sound_id, volume = 1.0, pan = 0.0 } = soundItem;
            if (!uniqueSounds[sound_id]) { // If the sound_id is not in the uniqueSounds object, add it
                uniqueSounds[sound_id] = { sound_id, volume, pan };
            }
        }
        
        // Insert each unique sound into the soundscape
        for (const soundId in uniqueSounds) {
            const { sound_id, volume, pan } = uniqueSounds[soundId];
            
            await db.query(
                'INSERT INTO "SoundscapeSound" (soundscape_id, sound_id, volume, pan) VALUES ($1, $2, $3, $4)',
                [soundscape.soundscape_id, sound_id, Math.round(volume), pan]
            );
        }
        
        await db.query('COMMIT');
        
        return res.status(201).json({
            success: true,
            message: existingResult?.rows.length > 0 ? 'Soundscape updated successfully' : 'Soundscape created successfully',
            soundscape,
            isUpdate: existingResult?.rows.length > 0
        });
    } catch (error) { // If there is an error, print an error message
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
    
    if (!soundscapeId) { // If the soundscapeId is not provided, print an error message
        return res.status(400).json({
            success: false,
            message: 'Soundscape ID is required'
        });
    }
    
    const db = require('./db/config');
    
    try { // If there is an error, print an error message
        const result = await cacheFetch(redisKey, async () => { 
            
            const soundscapeResult = await db.query( // retrieve soundscape from db
                'SELECT * FROM "Soundscape" WHERE soundscape_id = $1',
                [soundscapeId]
            );
            
            if (soundscapeResult.rows.length === 0) { // if soundscape not found
                throw new Error ('Soundscape not found')
            }
            
            const soundscape = soundscapeResult.rows[0]; // retrieve soundscape from db
            
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

    } catch (error) { // If there is an error, print an error message
        console.error('Error getting soundscape:', error);
        return res.status(500).json({
            success: false,
            message: 'Error getting soundscape: ' + error.message
        });
    }
});

// Add a sound to an existing soundscape
app.post('/api/soundscapes/:id/sounds', async (req, res) => {
    const soundscapeId = req.params.id;
    const { sound } = req.body;
     
    if (!sound || !sound.sound_id) { // If the sound or sound_id is not provided, print an error message
        return res.status(400).json({
            success: false,
            message: 'Sound ID is required'
        });
    }
    
    const db = require('./db/config');
    
    try { // If there is an error, print an error message
        await db.query('BEGIN');
        
        // Check if the soundscape exists
        const soundscapeResult = await db.query(
            'SELECT * FROM "Soundscape" WHERE soundscape_id = $1',
            [soundscapeId]
        );
        
        if (soundscapeResult.rows.length === 0) { // If the soundscape does not exist, print an error message
            await db.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                message: 'Soundscape not found'
            });
        }
        
        // Count how many sounds the soundscape currently has
        const countResult = await db.query(
            'SELECT COUNT(*) FROM "SoundscapeSound" WHERE soundscape_id = $1',
            [soundscapeId]
        );
        
        const soundCount = parseInt(countResult.rows[0].count);
        
        if (soundCount >= 6) {
            await db.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: 'Soundscape already has the maximum of 6 sounds'
            });
        }
        
        // Check if the sound exists
        const soundResult = await db.query(
            'SELECT * FROM "Sound" WHERE sound_id = $1',
            [sound.sound_id]
        );
        
        if (soundResult.rows.length === 0) {
            await db.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                message: 'Sound not found'
            });
        }
        
        // Check if the sound is already in the soundscape
        const existingResult = await db.query(
            'SELECT * FROM "SoundscapeSound" WHERE soundscape_id = $1 AND sound_id = $2',
            [soundscapeId, sound.sound_id]
        );
        
        if (existingResult.rows.length > 0) {
            // Update the existing relationship with new volume and pan
            await db.query(
                'UPDATE "SoundscapeSound" SET volume = $1, pan = $2 WHERE soundscape_id = $3 AND sound_id = $4',
                [Math.round(sound.volume || 1.0), sound.pan || 0.0, soundscapeId, sound.sound_id]
            );
        } else {
            // Add the new sound to the soundscape
            await db.query(
                'INSERT INTO "SoundscapeSound" (soundscape_id, sound_id, volume, pan) VALUES ($1, $2, $3, $4)',
                [soundscapeId, sound.sound_id, Math.round(sound.volume || 1.0), sound.pan || 0.0]
            );
        }
        
        await db.query('COMMIT');
        
        // Get the updated soundscape details
        const soundscapeData = await db.query(
            'SELECT * FROM "Soundscape" WHERE soundscape_id = $1',
            [soundscapeId]
        );
        
        const soundsData = await db.query( // retrieve each sound in the soundscape
            `SELECT s.*, ss.volume, ss.pan 
            FROM "Sound" s
            JOIN "SoundscapeSound" ss ON s.sound_id = ss.sound_id
            WHERE ss.soundscape_id = $1`,
            [soundscapeId]
        );
        
        return res.status(200).json({ // Return a JSON with success = true, message = ...
            success: true,
            message: 'Sound added to soundscape successfully',
            soundscape: soundscapeData.rows[0],
            sounds: soundsData.rows
        });
    } catch (error) { // If there is an error, print an error message
        await db.query('ROLLBACK');
        console.error('Error adding sound to soundscape:', error);
        return res.status(500).json({
            success: false,
            message: 'Error adding sound to soundscape: ' + error.message
        });
    }
});

// To download tracks and finalized as one mp3
app.get('/api/soundscapes/:id/download', async (req, res) => {

    const soundscapeId = req.params.id; // get the soundscapeId from the request
    // check if hit
    console.log(`Download route; Hit with soundscape ID: ${soundscapeId}`)

    if (!soundscapeId) { // If the soundscapeId is not provided, print an error message
      return res.status(400).json({ success: false, message: 'Soundscape ID is required' });
    }
  
    const db = require('./db/config');
  
    try { // If there is an error, print an error message
      const soundsResult = await db.query( // retrieve each sound in the soundscape
        `SELECT s.file_path, s.name, ss.volume, ss.pan
         FROM "Sound" s
         JOIN "SoundscapeSound" ss ON s.sound_id = ss.sound_id
         WHERE ss.soundscape_id = $1`,
        [soundscapeId]
      );
  
      const rows = soundsResult.rows;
      if (rows.length === 0) { // If there are no sounds found for this soundscape, print an error message
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

      if (existingFiles.length === 0) { // If there are no valid sounds found for merging, print an error message
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
       .on('start', cmd => { // When the merge starts, print the command
           console.log("FFmpeg command:", cmd);
        })
       .on('error', err => { // If there is an error, print an error message
            console.error('FFmpeg error:', err.message);
            if (!res.headersSent) {
              return res.status(500).json({ success: false, message: "Error mixing audio." });
            }
        })
       .on('end', () => { // When the merge is finished, download the output path
           console.log('Merge finished');
           res.download(outputPath, `soundscape_${soundscapeId}.mp3`, err => {
             if (err) console.error('Send error:', err);
             fs.unlink(outputPath, () => {});
           });
        })

      console.log("Running FFmpeg");
      command.run();

    } catch (error) { // If there is an error, print an error message
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
  passport.authenticate('google', {  // Authenticate the user with Google
    scope: ['profile', 'email'],
    failureRedirect: 'http://localhost:3000/login?error=auth_failed'
  })
);

app.get('/api/auth/google/callback',  // Callback for Google OAuth, allows user to login with Google
  (req, res, next) => {
    console.log('Received Google OAuth callback');
    next();
  },
  passport.authenticate('google', {  // Authenticate the user with Google
    failureRedirect: 'http://localhost:3000/login?error=auth_failed' 
  }),
  (req, res) => { // Send token and user data to the client via postMessage
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
    } catch (error) { // If there is an error, print an error message
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
    const cacheKey = 'homepage:preset_soundscapes';
    const tagFilter = req.query.tag ? req.query.tag : null;
    
    console.log(`[Homepage] Received request with tag filter: ${tagFilter || 'none'}`);
    
    try {
      // Only check cache if no tag filter is applied
      if (!tagFilter && redisClient.isReady) {
        const cachedSoundscapes = await redisClient.get(cacheKey);
        if (cachedSoundscapes) {
          console.log('Cache hit for homepage preset soundscapes');
          return res.status(200).json({ success: true, soundscapes: JSON.parse(cachedSoundscapes) });
        }
      } else {
        console.warn('Redis client not ready or tag filter applied, skipping cache check');
      }
  
      // If not cached, query the database for preset soundscapes
      const db = require('./db/config');
      
      // Construct query based on whether there's a tag filter
      let soundscapesResult;
      if (tagFilter) {
        console.log(`[Homepage] Filtering soundscapes by tag: ${tagFilter}`);
        
        // Log all soundscape tags before filtering to help debug
        const allSoundscapes = await db.query(`
          SELECT soundscape_id, name, tags
          FROM "Soundscape"
          WHERE is_preset = true
        `);
        
        console.log('[Homepage] All soundscapes and their tags:');
        allSoundscapes.rows.forEach(s => {
          console.log(`- Soundscape ${s.soundscape_id}: ${s.name}, Tags: ${JSON.stringify(s.tags)}`);
        });
        
        // Use array_to_string to do case-insensitive comparison
        soundscapesResult = await db.query(`
          SELECT * FROM "Soundscape" 
          WHERE is_preset = true 
          AND (
            array_to_string(tags, ',') ILIKE $1
            OR
            EXISTS (SELECT 1 FROM unnest(tags) tag WHERE LOWER(tag) = LOWER($2))
          )
          ORDER BY created_at DESC
        `, [`%${tagFilter}%`, tagFilter]);
        
        console.log(`[Homepage] Found ${soundscapesResult.rowCount} soundscapes matching tag: ${tagFilter}`);
      } else { // If there is no tag filter, retrieve all preset soundscapes
        soundscapesResult = await db.query(`
          SELECT * FROM "Soundscape" 
          WHERE is_preset = true 
          ORDER BY created_at DESC
        `);
        
        console.log(`[Homepage] Found ${soundscapesResult.rowCount} total preset soundscapes`);
      }
      
      // For each soundscape, also get its associated sounds
      const soundscapesWithSounds = await Promise.all(
        soundscapesResult.rows.map(async (soundscape) => {
          const soundsResult = await db.query(`
            SELECT s.*, ss.volume, ss.pan 
            FROM "Sound" s
            JOIN "SoundscapeSound" ss ON s.sound_id = ss.sound_id
            WHERE ss.soundscape_id = $1`,
            [soundscape.soundscape_id]
          );
          
          // Log the tags for each soundscape to help with debugging
          console.log(`[Homepage] Soundscape ${soundscape.name} has tags: ${JSON.stringify(soundscape.tags || [])}`);
          
          return {
            ...soundscape,
            sounds: soundsResult.rows
          };
        })
      );
      
      // Cache the result in Redis for one hour (3600 seconds) if no tag filter
      if (!tagFilter && redisClient.isReady) {
        await redisClient.set(cacheKey, JSON.stringify(soundscapesWithSounds), { EX: 3600 });
      }
      
      return res.status(200).json({ success: true, soundscapes: soundscapesWithSounds });
    } catch (error) {
      console.error('Error fetching homepage preset soundscapes:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Error fetching homepage preset soundscapes: ' + error.message 
      });
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
  

// Updated: Add description end point
app.post('/api/description', async (req, res) => {
    const { str } = req.body;
    console.log("[/api/description] Received str:", str); // debug log
    if (!str) {
      return res.status(400).json({ success: false, message: "Missing 'str' parameter" });
    }
  
    // Then forward to your Python service
    try {
      const pythonRes = await fetch("http://soundscape-python:3002/api/description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ str })
      });
  
      const jsonResponse = await pythonRes.json(); // Parse the response as JSON
      if (!pythonRes.ok || !jsonResponse.success) { // If the response is not successful, print an error message
        return res.status(400).json({
          success: false,
          message: jsonResponse.message || "Failed to generate description."
        });
      }
  
      return res.status(200).json(jsonResponse);
  
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Server error generating description."
      });
    }
});

// Updated: Add url image end point
app.post('/api/get-image', async (req, res) => {

    const { str } = req.body; // Get the str from the request
    if (!str) { // If the str is not provided, print an error message
      return res.status(400).json({
        success: false,
        message: "Missing 'str' parameter in the request."
      });
    }
  
    try {
      const response = await fetch("http://soundscape-python:3002/api/get-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ str })
      });

      const data = await response.json();
      console.log("Response from Python service:", data);
  
      if (!response.ok || !data.success) { // If the response is not successful, print an error message
        return res.status(400).json({
          success: false,
          message: data.message || "Failed to generate image URL."
        });
      }
      
      return res.status(200).json(data);
    } catch (error) { // If there is an error, print an error message
      return res.status(500).json({
        success: false,
        message: "Internal server error while generating image."
      });
    }
});

// Chat endpoint for the chatbot
app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  
  if (!message) { // If the message is not provided, print an error message
    return res.status(400).json({
      success: false,
      message: 'Message is required'
    });
  }

  try { // If there is an error, print an error message
    console.log('Forwarding chat request to Python service...');
    // Forward the request to the Python service
    const response = await fetch("http://soundscape-python:3002/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });

    console.log('Python service response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Python service error response:', errorText);
      throw new Error(`Failed to get response from Python service: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('Python service response:', data);
    return res.status(200).json(data);
  } catch (error) {
    console.error('Chat error details:', error);
    return res.status(500).json({
      success: false,
      message: `Error processing chat message: ${error.message}`
    });
  }
});

// Run fix_sound_sequence
async function fixSoundSequence() {
  try {
    const db = require('./db/config');
    
    // Fix Sound table sequence
    const soundSeqResult = await db.query('SELECT last_value FROM "Sound_sound_id_seq"');
    const currentSoundSeqValue = soundSeqResult.rows[0].last_value;
    
    const maxSoundIdResult = await db.query('SELECT MAX(sound_id) FROM "Sound"');
    const maxSoundId = maxSoundIdResult.rows[0].max || 0;
    
    console.log(`[Database] Sound: Current sequence value: ${currentSoundSeqValue}, Maximum ID: ${maxSoundId}`);
    
    if (currentSoundSeqValue <= maxSoundId) { // If the current sequence value is less than the maximum ID, print a message
      console.log('[Database] Fixing Sound_sound_id_seq...');
      await db.query(`SELECT setval('"Sound_sound_id_seq"', ${maxSoundId}, true)`);
      console.log(`[Database] Sound sequence has been reset to ${maxSoundId}`);
    }
    
    // Fix Soundscape table sequence
    const soundscapeSeqResult = await db.query('SELECT last_value FROM "Soundscape_soundscape_id_seq"');
    const currentSoundscapeSeqValue = soundscapeSeqResult.rows[0].last_value;
    
    const maxSoundscapeIdResult = await db.query('SELECT MAX(soundscape_id) FROM "Soundscape"');
    const maxSoundscapeId = maxSoundscapeIdResult.rows[0].max || 0;
    
    console.log(`[Database] Soundscape: Current sequence value: ${currentSoundscapeSeqValue}, Maximum ID: ${maxSoundscapeId}`);
    
    if (currentSoundscapeSeqValue <= maxSoundscapeId) {
      console.log('[Database] Fixing Soundscape_soundscape_id_seq...');
      await db.query(`SELECT setval('"Soundscape_soundscape_id_seq"', ${maxSoundscapeId}, true)`);
      console.log(`[Database] Soundscape sequence has been reset to ${maxSoundscapeId}`);
    }
  } catch (error) {
    console.error('[Database] Error fixing sequences:', error);
  }
}
