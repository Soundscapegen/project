"use client";

import Navbar from "../../../components/Navbar/Navbar";
import AudioMixer from "../../../components/AudioMixer/AudioMixer";
import "./mixer.css"; 

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getSoundscapeById } from "../services/soundscapeService";
import Link from "next/link";
import About from "../../../components/About/About";
import { Sound } from "../types/soundscape";


const Mixer = () => {
  const searchParams = useSearchParams(); //get url parameters
  const [sounds, setSounds] = useState<string[]>([]);
  const [soundIds, setSoundIds] = useState<number []>([]);
  const [soundVolumes, setSoundVolumes] = useState<number []>([]);
  const [soundPans, setSoundPans] = useState<number []>([]);
  const [trackNames, setTrackNames] = useState<string[]>([]);
  const [user, setUser] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [soundscapeName, setSoundscapeName] = useState<string | null>(null);
  const [title, setTitle] = useState<string | null>(null);
  const [soundscapeId, setSoundscapeId] = useState<string | null>(null);

  useEffect(() => {
    const soundsQueryParam = searchParams.get("sounds"); //get sounds from the urls
    const soundIdsQueryParam = searchParams.get("soundIds"); //get sound ids from the urls
    const soundscapeIdParam = searchParams.get("soundscapeId"); // get soundscape id from url
    const titleParam = searchParams.get("title");
    const namesParam = searchParams.get("names"); // get track names from url

    // If we have a soundscape ID, load the soundscape
    if (soundscapeIdParam) {
        loadSoundscapeById(soundscapeIdParam);
        return;
    }

    if (titleParam) {
        setTitle(decodeURIComponent(titleParam));
    }

    // Otherwise, load from URL parameters as before
    if (soundsQueryParam) {
      try {
        const parsedSounds = JSON.parse(decodeURIComponent(soundsQueryParam)); // decode and parse sound urls
        console.log("Loaded Sounds:", parsedSounds); 
        setSounds(parsedSounds.filter((sound: string) => sound)); // store sounds without null values
      } catch (err) {
        console.error("Error loading sound data:", err);
      }
    }

    // Load track names from URL if available
    if (namesParam) {
      try {
        const parsedNames = JSON.parse(decodeURIComponent(namesParam));
        console.log("Loaded Track Names:", parsedNames);
        setTrackNames(parsedNames);
      } catch (err) {
        console.error("Error loading track name data:", err);
      }
    }

    if (soundIdsQueryParam) {
        try {
            const parsedSoundIds = JSON.parse(decodeURIComponent(soundIdsQueryParam)); // decode and parse sound urls
            console.log("Loaded Sound IDs:", parsedSoundIds);
            setSoundIds(parsedSoundIds); // store sound ids
        } catch (err) {
            console.error("Error loading sound ID data:", err);
        }
    }
  }, [searchParams]);  

  // Function to load a soundscape by ID
  const loadSoundscapeById = async (soundscapeId: string) => {
    setIsLoading(true);
    setError(null); 

    try {
        const data = await getSoundscapeById(soundscapeId);

        if (!data.success) {
            throw new Error("Failed to load soundscape")
        }

        // Set the soundscape name
        setSoundscapeName(data.soundscape.name);

        // Extract sound file paths, IDs, volumes, pans, and names
        const soundPaths = data.sounds.map(sound => `http://localhost:3001${sound.file_path}`);
        const soundIds = data.sounds.map(sound => sound.sound_id);
        const volumes = data.sounds.map(sound => Math.round(sound.volume || 1.0));
        const pans = data.sounds.map(sound => sound.pan || 0.0);
        const names = data.sounds.map(sound => sound.name || `Sound ${sound.sound_id}`);

        // Update state with the soundscape data
        setSounds(soundPaths);
        setSoundIds(soundIds);
        setSoundVolumes(volumes);
        setSoundPans(pans);
        setTrackNames(names);
        setSoundscapeId(soundscapeId);
    } catch (err) {
        console.error("Error loading soundscape:", err);
        setError("Failed to load soundscape. It may not exist or has been removed.");
    } finally {
        setIsLoading(false);
    }
  };


  return (
    <div>
      <Navbar user={user} setUser={setUser} />

      <div className="mixer-container">
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
                    Back to home
                </Link>
            </div>
        ) : sounds.length > 0 ? (
            <div className="audio-mixer-container">
                {sounds.length > 0 ? (
                    <AudioMixer
                        soundUrls={sounds}
                        soundIds={soundIds}
                        initialVolumes={soundVolumes}
                        initialPans={soundPans}
                        title={title}
                        trackNames={trackNames}
                        soundscapeId={soundscapeId || undefined}
                    />
                ) : (
                    <p>Loading sounds...</p>
                )}    
            </div>
        ) : (
            <div className="no-sound-message">
                <p>No sound selected. Please go back and select some sounds to mix</p>
                <Link href="/" className="back-button">
                    Back to Home
                </Link>
            </div>
        )}
      </div>
      <About />
    </div>
  );
};

export default Mixer;