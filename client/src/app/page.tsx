"use client";
import { useState, useEffect } from "react";

import Navbar from "../../components/Navbar/Navbar";
import RecentlyCard from "../../components/RecentlyCards/RecentlyCard";
import TrackCard from "../../components/TrackCards/TrackCard";
import Category from "../../components/Category/Category";
import About from "../../components/About/About";

import { AuthProvider } from '../../components/AuthContext';

import { KeywordResponse, SoundscapeDetails, SoundscapeResponse } from "./types/soundscape";
import { getKeywords, downloadSound, createSoundscape, getSoundscapeById } from "./services/soundscapeService";
import { useRouter } from "next/navigation"; // Correct for App Router

export default function Home() {
  return (
    <AuthProvider>
      <HomeContent />
    </AuthProvider>
  );
}

// Separate component for the main content
function HomeContent() {
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
  const [isLoading, setIsLoading] = useState(false);
  const [inputError, setInputError] = useState<{message: string, suggestions: string[]} | null>(null);

  function generateTitleFromKeywords(keywords: string[]): string {
    if (!keywords.length) return "My Soundscape";
    return keywords
      .slice(0, 2)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" - ");
  }

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
    // Clear previous errors and set loading state
    setInputError(null);
    setIsLoading(true);
    
    try {
      const response = await fetch("http://localhost:3001/api/keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ str: inputString }),
      });
  
      if (!response.ok) {
        // Try to parse the error response first
        let errorMessage = `Request failed with status: ${response.status}`;
        try {
          const errorData = await response.json();
          // Use the server's error message if available
          errorMessage = errorData.message || errorMessage;
        } catch {
          // If parsing fails, use the status text
          errorMessage = `API request failed: ${response.status} ${response.statusText}`;
        }
        
        setInputError({
          message: errorMessage,
          suggestions: [
            "forest with birds and a stream",
            "busy cafe with people talking",
            "thunderstorm at night",
            "ocean waves on a beach",
            "spaceship engine room humming"
          ]
        });
        return;
      }
  
      const data = await response.json();
      // setResponse(data);
      
      // Check if the input was invalid (not related to soundscape)
      if (!data.success && data.is_valid_input === false) {
        setInputError({
          message: data.message || "Your input does not appear to be a soundscape request.",
          suggestions: data.suggestions || []
        });
        return;
      }
      
      // checking for keywords
      console.log("Extracted Keywords:", data.keywords);
      if (data?.sounds?.length) {
        // Pass both URLs and names to mixer
        const extractedSounds = data.sounds.map((sound: any) => sound.preview_url);
        const soundNames = data.sounds.map((sound: any) => sound.name);

        const generatedTitle = generateTitleFromKeywords(data.keywords || []);

        console.log("Extracted Sounds:", extractedSounds); 
        console.log("Sound Names:", soundNames);
        
        const invalidSounds = extractedSounds.filter((url: string) => !url || url === "");

        if (invalidSounds.length > 0) {
          console.warn("Some sounds are missing preview URLs:", invalidSounds);
        }
  
        const soundsParam = encodeURIComponent(JSON.stringify(extractedSounds));
        const namesParam = encodeURIComponent(JSON.stringify(soundNames));
        const titleParam = encodeURIComponent(generatedTitle);

        router.push(`/mixer?sounds=${soundsParam}&names=${namesParam}&title=${titleParam}`);
      } else if (data.keywords && data.keywords.length > 0) {
        // We have keywords but no sounds
        setInputError({
          message: "We found keywords related to your soundscape, but couldn't find any matching sounds.",
          suggestions: []
        });
      } else {
        // No keywords and no sounds
        setInputError({
          message: "We couldn't process your request. Please try a different description.",
          suggestions: [
            "forest with birds and a stream",
            "busy cafe with people talking",
            "thunderstorm at night",
            "ocean waves on a beach",
            "spaceship engine room humming"
          ]
        });
      }
    } catch (err) {
      console.error("Error fetching sounds:", err);
      setInputError({
        message: "There was an error processing your request. Please try again.",
        suggestions: [
          "forest with birds and a stream",
          "busy cafe with people talking",
          "thunderstorm at night",
          "ocean waves on a beach",
          "spaceship engine room humming"
        ]
      });
    } finally {
      setIsLoading(false);
    }
  }
  
  // Function to set input string from suggestion
  const handleUseSuggestion = (suggestion: string) => {
    setInputString(suggestion);
  };

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
        <button onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? 'Processing...' : (
            <svg id="Search--Streamline-Carbon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" height="24" width="24">
              <desc>Search Streamline Icon: https://streamlinehq.com</desc>
              <defs></defs>
              <path d="m21.75 20.689425 -5.664075 -5.664075a8.263275 8.263275 0 1 0 -1.060575 1.060575L20.689425 21.75ZM3 9.75a6.75 6.75 0 1 1 6.75 6.75 6.7575 6.7575 0 0 1 -6.75 -6.75Z" fill="#f4671f" strokeWidth="0.75"></path>
              <path id="_Transparent_Rectangle_" d="M0 0h24v24H0Z" fill="none" strokeWidth="0.75"></path>
            </svg>
          )}
        </button>
      </div>
      
      {/* Error message display */}
      {inputError && (
        <div className="error-container">
          <div className="error-message">
            <div className="error-header">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <h3>Invalid Soundscape Prompt</h3>
            </div>
            {inputError.suggestions.length > 0 && (
              <>
                <p className="suggestion-title">Try one of these examples instead:</p>
                <div className="suggestion-buttons">
                  {inputError.suggestions.map((suggestion, index) => (
                    <button 
                      key={index} 
                      className="suggestion-button"
                      onClick={() => handleUseSuggestion(suggestion)}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

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
      <div id="popular" className="popular">
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

      <div id="about">        
        <About />
      </div>    
    </div>
  );
}