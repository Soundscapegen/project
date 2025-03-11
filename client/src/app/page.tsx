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
          <svg id="Search--Streamline-Carbon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" height="24" width="24">
            <desc>Search Streamline Icon: https://streamlinehq.com</desc>
            <defs></defs>
            <path d="m21.75 20.689425 -5.664075 -5.664075a8.263275 8.263275 0 1 0 -1.060575 1.060575L20.689425 21.75ZM3 9.75a6.75 6.75 0 1 1 6.75 6.75 6.7575 6.7575 0 0 1 -6.75 -6.75Z" fill="#f4671f" stroke-width="0.75"></path>
            <path id="_Transparent_Rectangle_" d="M0 0h24v24H0Z" fill="none" stroke-width="0.75"></path>
          </svg>
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

      <div id="popular" className="popular">
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
              <div>
                <svg id="Filter--Streamline-Carbon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" height="32" width="32">
                  <desc>Filter Streamline Icon: https://streamlinehq.com</desc>
                  <defs></defs>
                  <title>filter</title>
                  <path d="M18 28h-4a2 2 0 0 1 -2 -2v-7.59L4.59 11A2 2 0 0 1 4 9.59V6a2 2 0 0 1 2 -2h20a2 2 0 0 1 2 2v3.59a2 2 0 0 1 -0.59 1.41L20 18.41V26a2 2 0 0 1 -2 2ZM6 6v3.59l8 8V26h4v-8.41l8 -8V6Z" fill="#f4671f" stroke-width="1"></path><path id="_Transparent_Rectangle_" d="M0 0h32v32H0Z" fill="none" stroke-width="1"></path>
                </svg>
              </div>
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

      <div id="about">
        <About />
      </div>
    </div>
  );
}