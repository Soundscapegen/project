const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const db = require('../db/config');

const FREESOUND_API_KEY = process.env.FREESOUND_API_KEY;

const SOUNDS_DIR = '/app/public/sounds';

try { // Creating soound dir incase it doesn't exist
  if (!fs.existsSync(SOUNDS_DIR)) {
    console.log(`Creating sounds directory at: ${SOUNDS_DIR}`);
    fs.mkdirSync(SOUNDS_DIR, { recursive: true });
    console.log('Sounds directory created successfully');
  } else {
    console.log('Sounds directory already exists');
  }
  fs.accessSync(SOUNDS_DIR, fs.constants.W_OK);
  console.log('Sounds directory is writable');
} catch (error) {
  console.error(`Error with sounds directory: ${error.message}`);
}

// Helper function to download a file from a URL and save it to a local file path
function downloadFile(url, filePath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filePath);
    const protocol = url.startsWith('https') ? https : http;
    const request = protocol.get(url, (response) => {
      if (response.statusCode !== 200) { // delete the file if the status code is not 200
        file.close();
        fs.unlink(filePath, () => {});
        const err = new Error(`HTTP error! status: ${response.statusCode}`);
        err.status = response.statusCode;
        return reject(err);
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    });
    request.on('error', (err) => {
      fs.unlink(filePath, () => {});
      reject(err);
    });
    file.on('error', (err) => {
      fs.unlink(filePath, () => {});
      reject(err);
    });
  });
}

// Download a sound from the Freesound API and save it to the local filesystem.
async function downloadAndSaveSound(freesoundId, sourceUrl, name, description, previewUrl) {
  console.log(`Downloading sound: ${JSON.stringify({
    freesoundId,
    sourceUrl,
    name,
    previewUrl
  })}`);

  // First check if this sound already exists in the database by source URL
  const existingSound = await getSoundByFreesoundId(freesoundId, sourceUrl);
  if (existingSound) {
    console.log(`Sound already exists in database with ID ${existingSound.sound_id}`);
    return existingSound;
  }

  const filename = `${freesoundId}_${Date.now()}.mp3`;
  const filePath = path.join(SOUNDS_DIR, filename);
  console.log(`Will save to file path: ${filePath}`);

  let downloadUrl = `https://freesound.org/apiv2/sounds/${freesoundId}/download/?token=${FREESOUND_API_KEY}`;
  let downloaded = false;
  try {
    console.log(`Attempting to download full sound from: ${downloadUrl}`);
    await downloadFile(downloadUrl, filePath);
    console.log(`Full sound download successful`);
    downloaded = true;
  } catch (error) {
    console.error(`Error downloading full sound: ${error.message}`);
  }

  // We try preview URL if full download failed
  if (!downloaded && previewUrl) { 
    if (previewUrl) {
      console.log(`Full sound download failed. Using preview URL instead: ${previewUrl}`);
      downloadUrl = previewUrl;
      try {
        await downloadFile(previewUrl, filePath); 
        console.log(`Preview download successful`);
        downloaded = true;
      } catch (error) {
        console.error(`Error downloading preview sound: ${error.message}`);
        throw new Error('Both full download and preview URL failed');
      }
    } else {
      throw new Error('Both full download and preview URL failed or preview URL not provided');
    }
  }

  // Store sound in db
  return new Promise((resolve, reject) => {
    fs.stat(filePath, async (err, stats) => {
      if (err) {
        return reject(err);
      }
      try {
        // If not exists, insert new record
        const result = await db.query(
          'INSERT INTO "Sound" (source_url, freesound_id, file_path, name, description, preview_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
          [sourceUrl, freesoundId, `/sounds/${filename}`, name, description, previewUrl]
        );
        console.log(`Sound saved to database with ID ${result.rows[0].sound_id}`);
        resolve(result.rows[0]);
      } catch (error) {
        console.error(`Error after download: ${error.message}`);
        try { // If there is an error, delete the file
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`Deleted file ${filePath} due to error`);
          }
        } catch (unlinkError) { // If there is an error deleting the file, print an error message
          console.error(`Error deleting file: ${unlinkError.message}`);
        }
        reject(error);
      }
    });
  });
}

// Get sound details from Freesound API using Node's HTTPS module.
async function getSoundDetails(freesoundId) {
  return new Promise((resolve, reject) => { // Return a promise to get the sound details
    const url = `https://freesound.org/apiv2/sounds/${freesoundId}/?token=${FREESOUND_API_KEY}`;
    const protocol = url.startsWith('https') ? https : http;
    protocol.get(url, (response) => { // Get the sound details from the Freesound API
      let data = '';
      response.on('data', (chunk) => { // Add the data to the data variable
        data += chunk;
      });
      response.on('end', () => { // When the response is finished, parse the data
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (error) { // If there is an error, reject the promise
          reject(error);
        }
      });
    }).on('error', (err) => { // If there is an error, reject the promise
      reject(err);
    });
  });
}

// Search for sounds using the Freesound API
async function searchFreesound(query, maxResults = 1, options = {}) {
  return new Promise((resolve, reject) => {
    // Build the URL with query parameters
    const params = new URLSearchParams({
      query: query,
      fields: "id,name,description,download,previews,duration,license",
      sort: options.sort || "score",
      filter: options.filter || "",
      page_size: maxResults.toString(),
      token: FREESOUND_API_KEY
    });
    
    const url = `https://freesound.org/apiv2/search/text/?${params.toString()}`;
    
    https.get(url, (response) => { // Get the sound details from the Freesound API
      let data = '';
      response.on('data', (chunk) => { // Add the data to the data variable
        data += chunk;
      });
      
      response.on('end', () => { // When the response is finished, parse the data
        try {
          const result = JSON.parse(data);
          
          if (!result.results || result.results.length === 0) { // If there are no results, resolve the promise
            resolve({ results: [] });
            return;
          }
          
          // Process the results similar to Python code
          const processedResults = result.results.map(sound => {
            // Add token to download URL
            if (sound.download) {
              sound.download = `${sound.download}?token=${FREESOUND_API_KEY}`;
            }
            
            // Extract preview URL
            if (sound.previews && sound.previews['preview-hq-mp3']) {
              sound.preview_url = sound.previews['preview-hq-mp3'];
            }
            
            return sound;
          });
          
          resolve({ results: processedResults });
        } catch (error) { // If there is an error, reject the promise
          reject(error);
        }
      });
    }).on('error', (err) => { // If there is an error, reject the promise
      reject(err);
    });
  });
}

// Look up a sound in the db by freesoundId and sourceUrl
async function getSoundByFreesoundId(freesoundId, sourceUrl) {
  try {
    // Always check by sourceUrl since most freesoundIds are 0
    if (sourceUrl) {
      const result = await db.query(
        'SELECT * FROM "Sound" WHERE source_url = $1',
        [sourceUrl]
      );
      return result.rows.length > 0 ? result.rows[0] : null;
    }
    
    // Fallback to checking by freesoundId if sourceUrl not provided
    if (freesoundId && freesoundId !== '0') {
      const result = await db.query(
        'SELECT * FROM "Sound" WHERE freesound_id = $1',
        [freesoundId]
      );
      return result.rows.length > 0 ? result.rows[0] : null; // If there is a result, return the first row
    }
    
    return null; // If there is no result, return null
  } catch (error) {
    console.error('Error checking if sound exists:', error); // If there is an error, print an error message
    throw error;
  }
}

module.exports = {
  downloadAndSaveSound,
  getSoundDetails,
  getSoundByFreesoundId,
  searchFreesound
};
