"use client";
import { useState, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { AiSearch02Icon } from "@hugeicons/core-free-icons";

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
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // ****New state for homepage sounds:***
  const [homepageSounds, setHomepageSounds] = useState<any[]>([]);
  // Fetch homepage sounds when component mounts:
  useEffect(() => {
    async function fetchHomepageSounds() {
      try {
        const res = await fetch("http://localhost:3001/api/homepage-sounds");
        if (!res.ok) {
          throw new Error("Failed to fetch homepage sounds");
        }
        const data = await res.json();
        if (data.success) {
          setHomepageSounds(data.sounds);
        }
      } catch (error) {
        console.error("Error fetching homepage sounds:", error);
      }
    }
    fetchHomepageSounds();
  }, []);

  async function fetchHomepageSounds() {
    try {
      const res = await fetch("http://localhost:3001/api/homepage-sounds");
      console.log("Response status:", res.status);
      const text = await res.text();
      console.log("Response text:", text);
      if (!res.ok) {
        throw new Error("Failed to fetch homepage sounds");
      }
      const data = JSON.parse(text);
      if (data.success) {
        setHomepageSounds(data.sounds);
      }
    } catch (error) {
      console.error("Error fetching homepage sounds:", error);
    }
  }  

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
        // Pass both URL and name to mixer
        const extractedSounds = data.sounds.map((sound: any) => ({
          url: sound.preview_url,
          name: sound.name
        }));
  
        console.log("Extracted Sounds:", extractedSounds); 
        const invalidSounds = extractedSounds.filter((sound: {url: string, name: string}) => !sound.url || sound.url === "");

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

  // Handle category selection
  const handleCategorySelect = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(cat => cat !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  // Filter sounds based on selected categories
  // Need to add fetching from backend in future
  const filteredSounds = homepageSounds.filter(sound => {
    if (selectedCategories.length === 0) return true;
    
    // TODO: Add checking sound tags
    const soundTags = sound.tags || [];
    return selectedCategories.some(category => 
      soundTags.includes(category) || 
      sound.name?.toLowerCase().includes(category.toLowerCase()) ||
      sound.description?.toLowerCase().includes(category.toLowerCase())
    );
  });

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
          placeholder="Describe a soundscape to generate (e.g., rainy forest, busy cafe)"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && inputString.trim()) {
              handleSubmit(e as any);
            }
          }}
        />
        <button onClick={handleSubmit}>
          <HugeiconsIcon icon={AiSearch02Icon} size={24} className="search-icon" />
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


      {/* ------------------ Updated Popular Sounds Section ------------------ */}
      <div className="popular">
        <h2>Popular Sounds</h2>
        <div className="dash3"></div>
        <h3 className="category-title">Category</h3>
        <div className="popular-container">
          <Category 
            onCategorySelect={handleCategorySelect} 
            selectedCategories={selectedCategories}
          />
          <div className="category-tracks">
            <div className="track-subcate-container">
              <div className="chosenCategory">
                {selectedCategories.length > 0 ? (
                  selectedCategories.map((cat, index) => (
                    <div key={index} className="chosen-wrapper">
                      <p className="chosen">{cat}</p>
                      <button 
                        className="remove-category" 
                        onClick={() => handleCategorySelect(cat)}
                        aria-label={`Remove ${cat} filter`}
                      >
                        ×
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="chosen-default">All Categories</p>
                )}
              </div>
              {selectedCategories.length > 0 && (
                <button 
                  className="clearFilters" 
                  onClick={() => setSelectedCategories([])}
                  style={{ 
                    border: 'none', 
                    background: 'transparent', 
                    color: '#F4671F', 
                    cursor: 'pointer',
                    fontWeight: 'bold' 
                  }}
                >
                  Clear Filters
                </button>
              )}
            </div>
            <div className="tracks">
              {(filteredSounds.length > 0 ? filteredSounds : homepageSounds).map((sound, index) => (
                <TrackCard
                  key={index}
                  imageUrl={sound.image_url || "/spaceshipFlying.jpg"}
                  altText={sound.name}
                  name={sound.name}
                  description={sound.description}
                  previewUrl={sound.preview_url}
                  />
                ))
              }
              {filteredSounds.length === 0 && selectedCategories.length > 0 && (
                <div style={{ textAlign: 'center', padding: '30px', color: '#868686' }}>
                  No sounds match the selected categories.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* --------------------------------------------------------------------- */}

      <About />
    </div>
  );
}