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
  console.log(`Starting download for sound ${freesoundId} from ${sourceUrl}`);
  console.log(`Preview URL: ${previewUrl}`);

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
  if (!downloaded && previewUrl) { //**added && previewurl */
    if (previewUrl) {
      console.log(`Full sound download failed. Using preview URL instead: ${previewUrl}`);
      downloadUrl = previewUrl;
      try {
        await downloadFile(previewUrl, filePath); //changed** downloadurl to preview
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
        // Check if a record with this source_url or file_path already exists
        const existingResult = await db.query(
          'SELECT * FROM "Sound" WHERE source_url = $1 OR file_path = $2',
          [sourceUrl, `/sounds/${filename}`]
        );
        
        if (existingResult.rows.length > 0) {
          console.log(`Sound already exists in database with ID ${existingResult.rows[0].sound_id}`);
          return resolve(existingResult.rows[0]);
        }
        
        // If not exists, insert new record
        const result = await db.query(
          'INSERT INTO "Sound" (source_url, freesound_id, file_path, name, description, preview_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
          [sourceUrl, freesoundId, `/sounds/${filename}`, name, description, previewUrl]
        );
        console.log(`Sound saved to database with ID ${result.rows[0].sound_id}`);
        resolve(result.rows[0]);
      } catch (error) {
        console.error(`Error after download: ${error.message}`);
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`Deleted file ${filePath} due to error`);
          }
        } catch (unlinkError) {
          console.error(`Error deleting file: ${unlinkError.message}`);
        }
        reject(error);
      }
    });
  });
}

// Get sound details from Freesound API using Node's HTTPS module.
async function getSoundDetails(freesoundId) {
  return new Promise((resolve, reject) => {
    const url = `https://freesound.org/apiv2/sounds/${freesoundId}/?token=${FREESOUND_API_KEY}`;
    const protocol = url.startsWith('https') ? https : http;
    protocol.get(url, (response) => {
      let data = '';
      response.on('data', (chunk) => {
        data += chunk;
      });
      response.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', (err) => {
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
      return result.rows.length > 0 ? result.rows[0] : null;
    }
    
    return null;
  } catch (error) {
    console.error('Error checking if sound exists:', error);
    throw error;
  }
}

module.exports = {
  downloadAndSaveSound,
  getSoundDetails,
  getSoundByFreesoundId
};
