"use client";
import { useState, useEffect } from "react";

import Navbar from "../../components/Navbar/Navbar";
import TrackCard from "../../components/TrackCards/TrackCard";
import Category from "../../components/Category/Category";
import About from "../../components/About/About";

import { AuthProvider } from '../../components/AuthContext';

import { KeywordResponse, SoundscapeDetails, SoundscapeResponse } from "./types/soundscape";
import { getKeywords, downloadSound, createSoundscape, getSoundscapeById } from "./services/soundscapeService";
import { useRouter } from "next/navigation"; // Correct for App Router

// Home component, wraps the content in the AuthProvider to provide authentication context
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
  const [presetSoundscapes, setPresetSoundscapes] = useState<any[]>([]);
  
  // Fetch homepage sounds when component mounts:
  useEffect(() => {
    fetchHomepageSoundscapes();
  }, [selectedCategories]);

  async function fetchHomepageSoundscapes() {
    try {
      // Construct URL with tag filter if categories are selected
      let url = "http://localhost:3001/api/homepage-sounds";
      
      // Add tag filter if a category is selected (we only support single selection for server-side filtering)
      if (selectedCategories.length === 1) {
        url += `?tag=${encodeURIComponent(selectedCategories[0])}`;
      }
      
      console.log(`Fetching soundscapes with URL: ${url}`);
      const res = await fetch(url);
      
      if (!res.ok) {
        throw new Error(`Failed to fetch homepage soundscapes: ${res.statusText}`);
      }
      
      const data = await res.json();
      
      if (data.success) {
        console.log(`Retrieved ${data.soundscapes.length} soundscapes from server`);
        
        // Debug each soundscape's tags
        data.soundscapes.forEach((soundscape: any) => {
          console.log(`Soundscape ${soundscape.name} has tags:`, soundscape.tags);
        });
        
        setPresetSoundscapes(data.soundscapes);
      } else {
        console.error("API returned success: false", data);
      }
    } catch (error) {
      console.error("Error fetching homepage soundscapes:", error);
      setPresetSoundscapes([]);
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
        
        // Set the input error
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
    try { // Download the sounds
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

    try { // Get the soundscape from the db
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
    console.log(`Category selected: ${category}, current selections: ${selectedCategories.join(', ')}`);
    
    // If this category is already selected, deselect it
    if (selectedCategories.includes(category)) {
      console.log(`Removing category: ${category}`);
      setSelectedCategories([]);
    } else {
      // Replace the current selection with this category (single select mode)
      console.log(`Setting new category: ${category}`);
      setSelectedCategories([category]);
    }
  };

  // Filter sounds is not used for the main soundscapes - filtering is done on server side now
  // But we keep this for other parts of the UI that might need client-side filtering
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
          {isLoading ? (
            <div className="spinner" style={{ width: '20px', height: '20px', margin: '0' }}></div>
          ) : (
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
            <div className="creating-soundscape-container">
              <h2>Found {response.sounds.length} sounds</h2>
              <button 
                className="create-soundscape-button"
                onClick={handleCreateSoundscape} 
                disabled={isCreatingSoundscape}
              >
                {isCreatingSoundscape ? (
                  <>
                    <div className="spinner" style={{ width: '20px', height: '20px', marginRight: '10px' }}></div>
                    Creating Soundscape...
                  </>
                ) : 'Create Soundscape'}
              </button>
            </div>
          )}

          {soundscapeResult && (
            <div className="creating-soundscape-container">
              <h2>Soundscape Created!</h2>
              <p>Name: {soundscapeResult.soundscape.name}</p>
              <p>ID: {soundscapeResult.soundscape.soundscape_id}</p>
              <button 
                className="create-soundscape-button" 
                onClick={() => window.location.href = `/soundscape/${soundscapeResult.soundscape.soundscape_id}`}
                style={{ marginTop: '15px' }}
              >
                View Soundscape
              </button>
            </div>
          )}

          {response?.keywords?.length ? <pre>{JSON.stringify(response, null, 2)}</pre> : null}
        </div>
      ) : (
        <div>
          <form onSubmit={fetchSoundscape} className="creating-soundscape-container">
            <h2>View Existing Soundscape</h2>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <input
                type="text"
                value={soundscapeId}
                onChange={(e) => setSoundscapeId(e.target.value)}
                placeholder="Enter Soundscape ID..."
                style={{ 
                  padding: '10px',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                  fontSize: '16px'
                }}
              />
              <button 
                type="submit" 
                disabled={isLoadingSoundscape}
                className="create-soundscape-button"
                style={{ minWidth: 'auto' }}
              >
                {isLoadingSoundscape ? (
                  <>
                    <div className="spinner" style={{ width: '20px', height: '20px', marginRight: '10px' }}></div>
                    Loading...
                  </>
                ) : 'View Soundscape'}
              </button>
            </div>
          </form>

          {soundscapeDetails && (
            <div className="creating-soundscape-container">
              <h2>Soundscape: {soundscapeDetails.soundscape.name}</h2>
              <button 
                className="create-soundscape-button" 
                onClick={() => window.location.href = `/soundscape/${soundscapeDetails.soundscape.soundscape_id}`}
                style={{ marginTop: '15px' }}
              >
                Go to Soundscape
              </button>
            </div>
          )}
        </div>
      )}

      {/* ------------------ Popular Sounds Section ------------------ */}
      <div id="popular" className="popular">
        <h2>Popular Soundscapes</h2>
        <div className="dash3"></div>
        <div className="popular-container">
          <div className="left-panel">
            <h3 className="category-title">Category</h3>
            <Category 
              onCategorySelect={handleCategorySelect} 
              selectedCategories={selectedCategories}
            />
          </div>
          <div className="right-panel">
            <div className="category-tracks">
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
                {selectedCategories.length > 0 && (
                  <button 
                    className="clearFilters" 
                    onClick={() => setSelectedCategories([])}
                    style={{ 
                      border: 'none', 
                      background: 'transparent', 
                      color: '#F4671F', 
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      marginLeft: '10px'
                    }}
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
            <div className="tracks">
              {(presetSoundscapes && presetSoundscapes.length > 0) ? (
                presetSoundscapes.map((soundscape, index) => (
                  <TrackCard
                    key={index}
                    soundscape_id={soundscape.soundscape_id}
                    imageUrl={soundscape.image_url || "/spaceshipFlying.jpg"}
                    altText={soundscape.name}
                    name={soundscape.name}
                    description={soundscape.description}
                    tags={soundscape.tags || []}
                    isSoundscape={true}
                  />
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '30px', color: '#868686' }}>
                  No soundscapes available for the selected category. Try selecting a different category.
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