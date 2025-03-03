import { KeywordResponse, Sound, SoundscapeDetails, SoundscapeResponse } from '../types/soundscape';

const API_BASE_URL = 'http://localhost:3001';

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
      previewUrl: sound.preview_url
    })
  });

  if (!downloadRes.ok) {
    throw new Error(`Failed to download sound: ${sound.name}`);
  }

  return await downloadRes.json();
}

export async function createSoundscape(name: string, description: string, soundIds: Array<{ sound_id: number, volume: number, pan: number }>): Promise<SoundscapeResponse> {
  const createRes = await fetch(`${API_BASE_URL}/api/soundscapes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name,
      description,
      sound_ids: soundIds
    })
  });

  if (!createRes.ok) {
    throw new Error(`Failed to create soundscape: ${createRes.status}`);
  }

  return await createRes.json();
}

export async function getSoundscapeById(id: string): Promise<SoundscapeDetails> {
  const res = await fetch(`${API_BASE_URL}/api/soundscapes/${id}`);
  
  if (!res.ok) {
    throw new Error(`Failed to fetch soundscape: ${res.status}`);
  }

  return await res.json();
} 