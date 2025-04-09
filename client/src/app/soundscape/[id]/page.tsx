"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Navbar from "../../../../components/Navbar/Navbar";
import AudioMixer from "../../../../components/AudioMixer/AudioMixer";
import { getSoundscapeById } from "../../services/soundscapeService";
import { SoundscapeDetails } from "../../types/soundscape";
import Link from "next/link";
import "./soundscape.css";

export default function SoundscapePage() {
  const params = useParams();
  const soundscapeId = params.id as string;
  
  const [user, setUser] = useState(false);
  const [soundscapeDetails, setSoundscapeDetails] = useState<SoundscapeDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Prepare data for AudioMixer
  const [soundUrls, setSoundUrls] = useState<string[]>([]);
  const [soundIds, setSoundIds] = useState<number[]>([]);
  const [soundVolumes, setSoundVolumes] = useState<number[]>([]);
  const [soundPans, setSoundPans] = useState<number[]>([]);
  const [trackNames, setTrackNames] = useState<string[]>([]);
  //**change to track 
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    async function fetchSoundscapeDetails() {
      try {
        setIsLoading(true);
        const data = await getSoundscapeById(soundscapeId);
        
        if (data.success) {
          setSoundscapeDetails(data);
          
          // Extract data for AudioMixer
          const urls = data.sounds.map(sound => sound.file_path ? `http://localhost:3001${sound.file_path}` : (sound.preview_url || ''));
          const ids = data.sounds.map(sound => sound.sound_id);
          const volumes = data.sounds.map(sound => sound.volume || 1.0);
          const pans = data.sounds.map(sound => sound.pan || 0.0);
          const names = data.sounds.map(sound => sound.name || `Sound ${sound.sound_id}`);
          
          setSoundUrls(urls);
          setSoundIds(ids);
          setSoundVolumes(volumes);
          setSoundPans(pans);
          setTrackNames(names);
        } else {
          setError("Failed to load soundscape");
        }
      } catch (err) {
        console.error("Error fetching soundscape:", err);
        setError("Error loading soundscape. It may not exist or has been deleted.");
      } finally {
        setIsLoading(false);
      }
    }
    
    if (soundscapeId) {
      fetchSoundscapeDetails();
    }
  }, [soundscapeId]);

  //function for Dowloand feature
  async function downloadCombinedAudio() {
    setDownloading(true);
    try {
      const res = await fetch(`http://localhost:3001/api/soundscapes/${soundscapeId}/download`);

      if (!res.ok) throw new Error("Failed to generate merged combined audio");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `soundscape_${soundscapeId}.mp3`;
      a.click();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading merged soundscape:", err);
      alert("Error downloading merged soundscape.");
    } finally {
      setDownloading(false); // track state
    }
  }
  

  return (
    <div className="soundscape-page">
      <Navbar user={user} setUser={setUser} />

      <div className="soundscape-container">
        {isLoading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading soundscape...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <h2>Error</h2>
            <p>{error}</p>
            <Link href="/" className="back-button">
              Back to Home
            </Link>
          </div>
        ) : soundscapeDetails ? (
          <div className="soundscape-details">
            <h1>{soundscapeDetails.soundscape.name}</h1>
            
            {soundscapeDetails.soundscape.description && (
              <p className="description">{soundscapeDetails.soundscape.description}</p>
            )}
            
            <div className="actions">
              <button 
                className={`download-button ${downloading ? 'downloading' : ''}`}
                onClick={downloadCombinedAudio}
                disabled={downloading}
              >
                {downloading ? "Preparing..." : "Download"}
              </button>
              <Link 
                href={`/mixer?soundscapeId=${soundscapeDetails.soundscape.soundscape_id}`} 
                className="edit-button"
              >
                Edit in Mixer
              </Link>
              <button 
                className="share-button" 
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert("Link copied to clipboard!");
                }}
              >
                Share Soundscape
              </button>
            </div>
            
            <div className="mixer-container">
              {soundUrls.length > 0 ? (
                <AudioMixer 
                  soundUrls={soundUrls} 
                  soundIds={soundIds} 
                  initialVolumes={soundVolumes} 
                  initialPans={soundPans}
                  trackNames={trackNames}
                  readOnly={true}
                />
              ) : (
                <p>No sounds available in this soundscape.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="not-found">
            <h2>Soundscape Not Found</h2>
            <p>The soundscape you're looking for doesn't exist or has been removed.</p>
            <Link href="/" className="back-button">
              Back to Home
            </Link>
          </div>
        )}
      </div>
    </div>
  );
} 