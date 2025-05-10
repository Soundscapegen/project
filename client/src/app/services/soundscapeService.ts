import { KeywordResponse, Sound, SoundscapeDetails, SoundscapeResponse } from '../types/soundscape';

const API_BASE_URL = 'http://localhost:3001';

// Get keywords from the server
export async function getKeywords(inputString: string): Promise<KeywordResponse> {
  const res = await fetch(`${API_BASE_URL}/api/keywords`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ str: inputString })
  });

  if (!res.ok) {
    throw new Error(`HTTP Error Status: ${res.status}`);
  }

  return await res.json();
}

// autogenerate from server
export async function getAutoKeywords(): Promise<KeywordResponse> {
  const res = await fetch(`${API_BASE_URL}/api/autogen-prompt`);

  if (!res.ok) {
    throw new Error(`HTTP Error Status: ${res.status}`);
  }

  return await res.json(); 
}

// Download a sound from the server
export async function downloadSound(sound: Sound) {
  const downloadRes = await fetch(`${API_BASE_URL}/api/sounds/download`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      freesoundId: sound.freesound_id,
      sourceUrl: sound.sound_url,
      name: sound.name,
      description: sound.description,
      previewUrl: sound.preview_url || ''
    })
  });

  if (!downloadRes.ok) {
    throw new Error(`Failed to download sound: ${sound.name}`);
  }

  return await downloadRes.json();
}

// Search for a single sound from the server
export async function searchSingleSound(query: string): Promise<Sound | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/sounds/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query })
    });

    if (!res.ok) {
      if (res.status === 404) {
        console.log("No sound found for query:", query);
        return null;
      }
      throw new Error(`Failed to search for sound: ${res.status}`);
    }

    const data = await res.json();
    if (!data.success || !data.sound) {
      return null;
    }
    return data.sound;
  } catch (error) {
    console.error("Error searching for sound:", error);
    throw error;
  }
}

// Add a sound to a soundscape from the server
export async function addSoundToSoundscape(
  soundscapeId: number, 
  soundData: { sound_id: number, volume: number, pan: number }
): Promise<SoundscapeDetails> { // Add a sound to a soundscape from the server
  const res = await fetch(`${API_BASE_URL}/api/soundscapes/${soundscapeId}/sounds`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ sound: soundData })
  });

  if (!res.ok) {
    throw new Error(`Failed to add sound to soundscape: ${res.status}`);
  }

  return await res.json();
}

// Create a soundscape from the server
export async function createSoundscape(name: string, description: string, soundIds: Array<{ sound_id: number, volume: number, pan: number }>, imageUrl?: string ): Promise<SoundscapeResponse> {
  const createRes = await fetch(`${API_BASE_URL}/api/soundscapes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name,
      description,
      sound_ids: soundIds,
      image_url: imageUrl
    })
  });

  if (!createRes.ok) {
    throw new Error(`Failed to create soundscape: ${createRes.status}`);
  }

  return await createRes.json();
}

// Get a soundscape by ID from the server
export async function getSoundscapeById(id: string): Promise<SoundscapeDetails> {
  console.log(`Fetching soundscape with ID: ${id} from ${API_BASE_URL}/api/soundscapes/${id}`);
  try {
    const res = await fetch(`${API_BASE_URL}/api/soundscapes/${id}`);
    
    if (!res.ok) { // If the response is not successful, print an error message
      const errorText = await res.text();
      console.error(`Failed to fetch soundscape: HTTP ${res.status}, Response: ${errorText}`);
      throw new Error(`Failed to fetch soundscape: ${res.status} - ${errorText}`);
    }

    const data = await res.json();
    console.log('Received soundscape data:', data);
    return data;
  } catch (error) {
    console.error("Error in getSoundscapeById:", error);
    throw error;
  }
}

// Get track names from the server
export async function getTrackNames(sounds: Sound[]): Promise<Sound[]> {
  const res = await fetch(`${API_BASE_URL}/api/track-names`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ sounds })
  });

  if (!res.ok) {
    throw new Error(`Failed to get track names: HTTP Error Status: ${res.status}`);
  }

  const data = await res.json();
  return data.success ? data.sounds : sounds; // Return original sounds as fallback
} 

// Get a description from the server
export async function getDescription(inputString: string) {
  const res = await fetch(`${API_BASE_URL}/api/description`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json' 
    },
    body: JSON.stringify({ str: inputString })
  });

  if (!res.ok) {
    throw new Error(`Failed to get description: HTTP Error Status: ${res.status}`);
  }

  const data = await res.json();
  if (!data.success) {
    throw new Error(data.message || "No description generated.");
  }
  return data.description as string;
}

// Get an image from the server
export async function getImage(inputString: string): Promise<string> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/get-image`, { // Get an image from the server
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ str: inputString })
    });

    if (!res.ok) { // If the response is not successful, print an error message
      throw new Error(`Unsplash fetch failed: ${res.status}`);
    }
    
    const data = await res.json();
    if (data.success && data.image_url) { // If the response is successful and the image URL is provided, return the image URL
      return data.image_url;
    } else {
      console.warn("No image results found for query:", inputString);
      return "";
    }
  } catch (error) {
    console.error("Error fetching image from Unsplash:", error);
    return "";
  }
}