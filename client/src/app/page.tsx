"use client";
import { useState } from "react";

// import { Search, AudioLines, SlidersHorizontal } from "lucide-react";

import Navbar from "../../components/Navbar/Navbar";
import RecentlyCard from "../../components/RecentlyCards/RecentlyCard";
import TrackCard from "../../components/TrackCards/TrackCard";
import Category from "../../components/Category/Category";
import About from "../../components/About/About";

import { KeywordResponse, SoundscapeDetails, SoundscapeResponse } from "./types/soundscape";
import { getKeywords, downloadSound, createSoundscape, getSoundscapeById } from "./services/soundscapeService";
import { useRouter } from "next/navigation"; // Correct for App Router

export default function Home() {
  // Inside Home function
  const router = useRouter();
  const [user, setUser] = useState(false);

  const [inputString, setInputString] = useState("");
  const [response, setResponse] = useState<KeywordResponse | null>(null);
  const [isCreatingSoundscape, setIsCreatingSoundscape] = useState(false);
  const [soundscapeResult, setSoundscapeResult] = useState<SoundscapeResponse | null>(null);
  const [activeTab, setActiveTab] = useState<"create" | "view">("create");
  const [soundscapeId, setSoundscapeId] = useState("");
  const [soundscapeDetails, setSoundscapeDetails] = useState<SoundscapeDetails | null>(null);
  const [isLoadingSoundscape, setIsLoadingSoundscape] = useState(false);

  async function handleSubmit(e: React.MouseEvent<HTMLButtonElement>) {
    try {
      const response = await fetch("http://localhost:3001/api/keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ str: inputString }),
      });
  
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
  
      const data = await response.json();
       // checking for keywords
      console.log("Extracted Keywords:", data.keywords);
      if (data?.sounds?.length) {
        const extractedSounds = data.sounds.map((sound: any) => sound.preview_url); // extract preview sound to route
  
    
        console.log("Extracted Sound Paths:", extractedSounds); 
        const invalidSounds = extractedSounds.filter((url: string) => !url || url === ""); // identify sounds with missing or invalid URLs

        if (invalidSounds.length > 0) {
          console.warn("Some sounds are missing preview URLs:", invalidSounds);
        }
  
        const soundsParam = encodeURIComponent(JSON.stringify(extractedSounds));
        router.push(`/mixer?sounds=${soundsParam}`); // passing sounds to mixer
      }
    } catch (err) {
      console.error("Error fetching sounds:", err);
    }
  }

  async function handleCreateSoundscape() { // create soundscape for each sound we get from response
    if (!response?.sounds || response.sounds.length === 0) {
      return;
    }

    setIsCreatingSoundscape(true);
    try {
      const downloadedSounds = await Promise.all(
        response.sounds.map(async (sound) => {
          return await downloadSound(sound);
        })
      );
      const soundIds = downloadedSounds.map(result => ({
        sound_id: result.sound.sound_id,
        volume: 1.0,
        pan: 0.0
      }));

      const result = await createSoundscape(inputString, inputString, soundIds);
      setSoundscapeResult(result);
    } catch (err) {
      console.error("Error creating soundscape:", (err as Error).message);
    } finally {
      setIsCreatingSoundscape(false);
    }
  }

  async function fetchSoundscape(e: React.FormEvent<HTMLFormElement>) { // fetch soundscape from db
    e.preventDefault();
    if (!soundscapeId) return;

    setIsLoadingSoundscape(true);
    setSoundscapeDetails(null);

    try {
      const data = await getSoundscapeById(soundscapeId);
      setSoundscapeDetails(data);
    } catch (err) {
      console.error("Error fetching soundscape:", (err as Error).message);
    } finally {
      setIsLoadingSoundscape(false);
    }
  }

  return (
    <div>
      <Navbar user={user} setUser={setUser} />

      <div className="introduction">
        {/* <AudioLines className="sound-icon" /> */}
        <img src="/sound-waves.svg" alt="Sound Waves" className="sound-icon" />
        <p className="description">
          <strong>SoundscapeGen</strong> lets you create custom <br />
          soundscapes by  simply describing what you want to <br /> hear.
        </p>
      </div>

      <div className="search-box">
        <input
          type="text"
          value={inputString}
          onChange={(e) => setInputString(e.target.value)}
          placeholder="Enter what you want to hear"
        />
        <button onClick={handleSubmit}>
          <span className="search-icon">S</span>
        </button>
      </div>

      {activeTab === "create" ? (
        <div>
          {response?.sounds && response.sounds.length > 0 && (
            <div>
              <h2>Found {response.sounds.length} sounds</h2>
              <button 
                onClick={handleCreateSoundscape} 
                disabled={isCreatingSoundscape}
              >
                {isCreatingSoundscape ? 'Creating Soundscape...' : 'Create Soundscape'}
              </button>
            </div>
          )}

          {soundscapeResult && (
            <div>
              <h2>Soundscape Created!</h2>
              <p>Name: {soundscapeResult.soundscape.name}</p>
              <p>ID: {soundscapeResult.soundscape.soundscape_id}</p>
            </div>
          )}

          {response?.keywords?.length ? <pre>{JSON.stringify(response, null, 2)}</pre> : null}
        </div>
      ) : (
        <div>
          <form onSubmit={fetchSoundscape}>
            <input
              type="text"
              value={soundscapeId}
              onChange={(e) => setSoundscapeId(e.target.value)}
              placeholder="Enter Soundscape ID..."
            />
            <button type="submit" disabled={isLoadingSoundscape}>
              {isLoadingSoundscape ? 'Loading...' : 'View Soundscape'}
            </button>
          </form>

          {soundscapeDetails && (
            <div>
              <h2>Soundscape: {soundscapeDetails.soundscape.name}</h2>
              <p>Description: {soundscapeDetails.soundscape.description}</p>
              <h3>Sounds:</h3>
              <ul>
                {soundscapeDetails.sounds.map((sound) => (
                  <li key={sound.sound_id}>
                    <h4>{sound.name}</h4>
                    <p>{sound.description}</p>
                    {sound.file_path && (
                      <audio controls src={`http://localhost:3001${sound.file_path}`} />
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {user && (
        <div className="recently-listen">
          <h2>Recently Listen</h2>
          <div className="dash3"></div>
          <div className="listen-container">
            <RecentlyCard />
            <RecentlyCard />
            <RecentlyCard />
          </div>
        </div>
      )}

      <div className="popular">
        <h2>Popular Sounds</h2>
        <div className="dash3"></div>
        <h3 className="category-title">Category</h3>
        <div className="popular-container">
          <Category />
          <div className="category-tracks">
            <div className="track-subcate-container">
              <div className="chosenCategory">
                <p className="chosen">Nature</p>
                <p className="chosen">Ocean Waves</p>
              </div>
              {/* <SlidersHorizontal className="filterIcon" /> */}
              <span className="filterIcon">I</span>
            </div>
            <div className="tracks">
              <TrackCard />
              <TrackCard />
              <TrackCard />
              <TrackCard />
              <TrackCard />
            </div>
          </div>
        </div>
      </div>

      <About />
    </div>
  );
}