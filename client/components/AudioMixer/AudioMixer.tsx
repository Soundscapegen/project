"use client";

import React, { useState, useRef, useEffect,  } from 'react';
import * as Tone from "tone";
import "./AudioMixer.css";
import { getContext } from "tone";

import { AudioTrack, AudioMixexProps } from './types';
import { SoundscapeResponse, Sound } from '@/app/types/soundscape';
import { createSoundscape, getImage, downloadSound, searchSingleSound, addSoundToSoundscape } from '@/app/services/soundscapeService';

// We create a cache to store Tone.Player instances keyed by their URL. This is to ensure that each sound loads exactly once
const playerCache = new Map<string, Tone.Player>();

// Provides a Tone.Player instance for a given URL
const getPlayer = (
  url: string,
  index: number,
  onLoadCallback: () => void
): Tone.Player => {
  if (playerCache.has(url)) {
    return playerCache.get(url)!;
  }
  const player = new Tone.Player({ // Create a new Tone.Player instance
    url,
    loop: true,
    autostart: false,
    onload: () => {
      console.log(`Track ${index} loaded`);
      onLoadCallback();
    },
  });
  playerCache.set(url, player);
  return player;
};

// Analyzes audio buffer to determine its peak amplitude for audio normalization
const analyzeAudioLevel = (buffer: AudioBuffer): number => {
  const channelData = buffer.getChannelData(0);
  let max = 0;
  
  for (let i = 0; i < channelData.length; i++) { // Iterate through the buffer to find the maximum amplitude
    const absValue = Math.abs(channelData[i]);
    if (absValue > max) {
      max = absValue;
    }
  }
  
  // Convert to dB (using 1.0 as reference) and avoid log(0) by using a small value for silent tracks
  const dbValue = 20 * Math.log10(Math.max(max, 0.0001));
  return Math.round(dbValue);
};

// Normalization of audio levels to a target level around -12dB
const calculateNormalizedVolume = (peakDb: number): number => {
  const targetDb = -12;

  let adjustment = targetDb - peakDb;
  adjustment = Math.max(-20, Math.min(18, adjustment));
  
  return Math.round(adjustment);
};

// AudioMixer component
const AudioMixer: React.FC<AudioMixexProps> = ({
  soundUrls,
  soundIds = [],
  initialVolumes = [],
  initialPans = [],
  title,
  readOnly = false,
  trackNames : initialTrackNames = [], // renamed prop
  soundscapeId,
  imageUrl,
  description
}) => {

  const [tracks, setTracks] = useState<AudioTrack[]>([]);
  const [trackNames, setTrackNames] = useState<string[]>(initialTrackNames); // local state 
  const [masterVolume, setMasterVolume] = useState<number>(0);
  const [loadedCount, setLoadedCount] = useState<number>(0);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [showSaveModal, setShowSaveModal] = useState<boolean>(false);
  const [showAddSoundModal, setShowAddSoundModal] = useState<boolean>(false);
  const [soundQuery, setSoundQuery] = useState<string>("");
  const [isSearchingSound, setIsSearchingSound] = useState<boolean>(false);
  const [searchedSound, setSearchedSound] = useState<Sound | null>(null);
  const [isAddingSound, setIsAddingSound] = useState<boolean>(false);
  const [soundscapeName, setSoundscapeName] = useState<string>("");
  const [soundscapeDescription, setSoundscapeDescription] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<SoundscapeResponse | null>(null);

  const [localImageUrl, setLocalImageUrl] = useState<string>(imageUrl || "");

  const [play, setPlay] = useState<boolean>(true);
  const [muted, setMuted] = useState<boolean>(false);
  const [timer, setTimer] = useState<number>(0);

  const didInitialize = useRef(false);
  const masterVolumeNode = useRef<Tone.Volume | null>(null);
  const analyzerRef = useRef<Tone.Analyser | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (didInitialize.current) return;
    didInitialize.current = true;

    const initAudio = () => { // Initialize the audio context
      masterVolumeNode.current = new Tone.Volume(0).toDestination();

      analyzerRef.current = new Tone.Analyser("waveform", 256);
      masterVolumeNode.current.connect(analyzerRef.current);

      const newTracks: AudioTrack[] = soundUrls.map((url, index) => {
        // get initial volume and pan values if available
        const initialVolume = initialVolumes[index] !== undefined ? initialVolumes[index] : 0;
        const initialPan = initialPans[index] !== undefined ? initialPans[index] : 0;
        
        const player = getPlayer(url, index, () => { // Get a player instance
          try {
            const playerAny = player as any;
            if (playerAny.buffer && playerAny.buffer.get) { // checking buffer is loaded
              const buffer = playerAny.buffer.get();
              if (buffer) {
                // analyze when initival vol is not set
                if (initialVolumes[index] === undefined) {
                  const peakDb = analyzeAudioLevel(buffer); // analyze audio level
                  const normalizedVolume = calculateNormalizedVolume(peakDb); // normalize volume
                  
                  setTracks(prev => 
                    prev.map(track => {
                      if (track.id === index) {
                        track.volume.volume.value = normalizedVolume;
                        return { ...track, volumeLevel: normalizedVolume };
                      }
                      return track;
                    })
                  );
                }
              }
            }
          } catch (error) {
            console.error("Error analyzing audio:", error);
          }
          
          setLoadedCount((prev) => prev + 1); // Increment the loaded count
        });

        const panner = new Tone.Panner(initialPan); // Create a new Tone.Panner instance
        const volume = new Tone.Volume(initialVolume); // Create a new Tone.Volume instance

        player.connect(panner); // Connect the player to the panner
        panner.connect(volume); // Connect the panner to the volume
        volume.connect(masterVolumeNode.current!); // Connect the volume to the master volume node

        return {
          id: index,
          url,
          player,
          panner,
          volume,
          isPlaying: false,
          volumeLevel: initialVolume,
          panValue: initialPan,
          pendingStartTimer: null,
          isMuted: false,
          lastOffset: 0, 
        };
      });

      setTracks(newTracks);
    };

    initAudio(); // Initialize the audio

    return () => { // Cleanup the audio context by disposing of the master volume node, analyzer, and animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setTracks([]);
      masterVolumeNode.current?.dispose();
      analyzerRef.current?.dispose();
      didInitialize.current = false;
    };
  }, [soundUrls, initialVolumes, initialPans]);

  useEffect(() => { // All tracks loaded, set isLoaded to true so mixer can render
    if (loadedCount >= soundUrls.length && soundUrls.length > 0) {
      setIsLoaded(true);
    }
  }, [loadedCount, soundUrls.length]);

  useEffect(() => { // Waveform figure drawing
    if (!isLoaded || !canvasRef.current || !analyzerRef.current) return;
    const canvas = canvasRef.current; // Get the canvas element
    const ctx = canvas.getContext("2d"); // Get the 2D context
    if (!ctx) return; // If the context is not available, return

    const drawWaveform = () => {
      const data = analyzerRef.current!.getValue() as Float32Array; // Get the value of the analyzer
      const width = canvas.width; // Get the width of the canvas
      const height = canvas.height; // Get the height of the canvas

      ctx.clearRect(0, 0, width, height); // Clear the canvas
      ctx.beginPath(); // Begin the path
      ctx.lineWidth = 2; // Set the line width
      ctx.strokeStyle = "#278F7C"; // Set the stroke style

      // We amplify waveform so that it's louder
      const amplification = 1.5;
      const sliceWidth = width / data.length;
      let x = 0;

      for (let i = 0; i < data.length; i++) { // Iterate through the data
        const sample = Math.max(-1, Math.min(1, data[i] * amplification)); // Calculate the sample
        const y = ((sample + 1) / 2) * height; // Calculate the y coordinate
        if (i === 0) ctx.moveTo(x, y); // Move to the start of the path
        else ctx.lineTo(x, y); // Draw a line to the next point
        x += sliceWidth; // Increment the x coordinate
      }

      ctx.stroke(); // Stroke the path
      animationFrameRef.current = requestAnimationFrame(drawWaveform); // Request the next animation frame
    };

    drawWaveform();

    return () => { // Cleanup the animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isLoaded]);

  useEffect(() => { // Update the timer every second
    let counter: NodeJS.Timeout; 
    if (!play) {
      //counter = setInterval(() => setTimer(timer => timer + 1), 1000);
      // Use the first track's offset as the base
      const baseOffset = tracks[0]?.lastOffset ?? 0;
      setTimer(baseOffset);

      counter = setInterval(() => {
        setTimer((prev) => prev + 1); // Increment the timer
      }, 1000);
    }
    return () => { // Cleanup the timer
      clearInterval(counter);
    };
  }, [play, tracks])

  useEffect(() => { // Fetch the image
    if (!title) return;

    const fetchImage = async () => {
      // Fetch image if not already set
      if (!localImageUrl && title) {
        try {
          const imageResult = await getImage(title);
          setLocalImageUrl(imageResult);
        } catch (error) {
          console.error("Failed to fetch image:", error);
        }
      }

    };

    fetchImage(); // Fetch the image and 
  }, [title, localImageUrl]);

  const formatTimer = (seconds: number) => { // Format the timer
    const mins = Math.floor(seconds / 60); // Calculate the minutes
    const secs = seconds % 60; // Calculate the seconds
    return `${mins < 10 ? "0" : ""}${mins}:${secs < 10 ? "0" : ""}${secs}`; // Return the formatted timer
  };

  const scheduleStartWithDelay = (trackId: number, delayMs: number) => { // add small delay so that we have all tracks loaded before starting
    setTracks((prev) =>
      prev.map((track) => {
        if (track.id !== trackId) return track;
        track.player.stop();
        if (track.pendingStartTimer !== null) { // If the pending start timer is not null
          clearTimeout(track.pendingStartTimer);
          track.pendingStartTimer = null;
        }
        const timerId = window.setTimeout(() => { // Set a timeout to start the track
          try {
            //track.player.start();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (track.player as any).start(undefined, track.lastOffset ?? 0); // Starts from offset
          } catch (err) {
            console.error(`Error .start() track ${track.id}:`, err);
          }
        }, delayMs);
        return { ...track, pendingStartTimer: timerId };
      })
    );
  };

  const togglePlay = (trackId: number) => { // play/stop any singular track
    setTracks((prev) =>
      prev.map((track) => {
        if (track.id !== trackId) return track;
        const willPlay = !track.isPlaying;
        if (willPlay) {
          if (Tone.context.state !== "running") {
            Tone.start().catch((err) =>
              console.error("Error starting Tone:", err)
            );
          }
          return { ...track, isPlaying: true };
        } else {
          track.player.stop();
          if (track.pendingStartTimer) {
            clearTimeout(track.pendingStartTimer);
          }
          return { ...track, isPlaying: false, pendingStartTimer: null };
        }
      })
    );

    setTracks((prev) => // track is set to play, so we schedule it to start with a small delay
      prev.map((track) => {
        if (track.id === trackId && track.isPlaying) {
          scheduleStartWithDelay(trackId, 200);
        }
        return track;
      })
    );
  };

  const handleVolumeChange = (trackId: number, value: number) => { // handle change in volume for any singular track
    setTracks((prev) =>
      prev.map((track) => { // Map through the tracks and update the volume
        if (track.id === trackId) {
          const roundedValue = Math.round(value); // Round the value to the nearest integer
          track.volume.volume.value = roundedValue; // Update the volume
          return { ...track, volumeLevel: roundedValue}; // Return the updated track
        }
        return track;
      })
    );
  };

  const handleMute = (trackId: number) => { // Handle mute for any singular track
    setTracks((prev) =>
      prev.map((track) => { // Map through the tracks and update the mute
        if (track.id === trackId) {
          track.volume.mute = !track.isMuted;
          return { ...track, isMuted: !track.isMuted };
        }
        return track;
      })
    );
  };

  const handleDeleteTrack = (trackId: number) => {
    // Stop the track if it's playing
    const trackToDelete = tracks.find(track => track.id === trackId);
    if (trackToDelete) {
      trackToDelete.player.stop();
      if (trackToDelete.pendingStartTimer) {
        clearTimeout(trackToDelete.pendingStartTimer);
      }
      
      // Disconnect from audio graph - use dispose which handles disconnection in Tone.js
      trackToDelete.volume.dispose();
      trackToDelete.panner.dispose();
      trackToDelete.player.dispose();
      
      // Remove from tracks state
      // Rebuild tracks array with re-indexed IDs
      setTracks(prev => {
        const updated = prev
          .filter(track => track.id !== trackId)
          .map((track, i) => ({
            ...track,
            id: i,
            lastOffset: track.lastOffset ?? 0
          }));

        console.log("Track deleted. Remaining tracks:", updated);

        return updated;
      });
      // Also update trackNames state
      setTrackNames(prev => {
        const updatedNames = [...prev];
        updatedNames.splice(trackId, 1); // remove the deleted track's name
        return updatedNames;
      });
    }
  };

  // Mute all tracks
  const handleMuteAll = () => {
    setMuted(prevMuted => {
      const newMuted = !prevMuted;
  
      setTracks(prev =>
        prev.map(track => {
          track.volume.mute = newMuted;
          return { ...track, isMuted: newMuted };
        })
      );
  
      return newMuted;
    });
  };
  
  // Handle pan change for any singular track
  const handlePanChange = (trackId: number, value: number) => {
    setTracks((prev) =>
      prev.map((track) => {
        if (track.id === trackId) {
          track.panner.pan.value = value;
          return { ...track, panValue: value };
        }
        return track;
      })
    );
  };

  // Handle master volume change
  const handleMasterVolumeChange = (value: number) => {
    if (masterVolumeNode.current) { // If the master volume node is current
      const roundedValue = Math.round(value); // Round the value to the nearest integer
      masterVolumeNode.current.volume.value = roundedValue; // Update the master volume
      setMasterVolume(roundedValue); // Set the master volume
    }
  };

  // Sync lastOffset with timer every second while playing
  // Ensures each track remembers the current position for accurate seeking when paused or resumed
  useEffect(() => {
    if (!play) return; // Only update offsets while playing
  
    const interval = setInterval(() => {
      setTracks((prev) =>
        prev.map((track) => ({
          ...track,
          lastOffset: timer,
        }))
      );
    }, 1000);
  
    return () => clearInterval(interval);
  }, [play, timer]);

  const playAll = async () => { // play all tracks at once
    if (Tone.context.state !== "running") {
      await Tone.start().catch((err) =>
        console.error("Error starting audio context:", err)
      );
    }
    setPlay(false);
    setTimer(tracks[0]?.lastOffset ?? 0); // sync timer before playing 
    setTracks((prev) => {
      return prev.map((t) => {
        t.player.stop();
        if (t.pendingStartTimer) {
          clearTimeout(t.pendingStartTimer);
        }
    
        // Schedule playback
        scheduleStartWithDelay(t.id, 200);

        return {
          ...t,
          isPlaying: true,
          pendingStartTimer: null,
        };
      });
    });
  };

  const stopAll = () => { // stop all tracks at once
    setPlay(true);
    setTracks((prev) => {
      prev.forEach((t) => {
        t.player.stop();
        if (t.pendingStartTimer) {
          clearTimeout(t.pendingStartTimer);
        }
      });
      return prev.map((t) => ({
        ...t,
        isPlaying: false,
        pendingStartTimer: null,
        lastOffset: timer, // capture where it stopped 
      }));
    });
  };

  //to rewind and fast forward by 10
  const seekAll = (offsetSeconds: number) => {
    let updatedOffset = 0; // captured from the first track
    setTracks((prevTracks) => {
      
      const updated = prevTracks.map((track, index) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const typedPlayer = track.player as any;
        const duration = typedPlayer.buffer?.duration ?? 0;

        const baseOffset = timer; // use timer as base
        const newOffset = Math.max(0, Math.min(baseOffset + offsetSeconds, duration - 0.01));
        const adjustedOffset = newOffset === 0 ? 0.001 : newOffset;

        // debug
        console.log(`Seek Track ${track.id} – Playing: ${track.isPlaying}, Timer: ${timer}, NewOffset: ${newOffset}, Duration: ${duration}`);

        if (track.isPlaying) {
            typedPlayer.stop();
            setTimeout(() => {
              try {
                const context = Tone.getContext() as unknown as AudioContext;
                const startTime = context.currentTime + 0.05;
                const adjustedOffset = newOffset === 0 ? 0.001 : newOffset;
                
                // prevent overlap in rewind and forward
                if (adjustedOffset > 0) {
                  typedPlayer.stop();
                  typedPlayer.start(startTime, adjustedOffset);
                }

              } catch (e) {
                console.error(`Seek error: Track ${track.id} failed to start:`, e);
              }
            }, 150); 
        }
        // Capture the offset from the first track only
        if (index === 0) {
          updatedOffset = newOffset;
        }

        return {
          ...track,
          lastOffset: newOffset,
        };
      });
      // Use first *valid* track's offset
      const firstWithOffset = updated.find(t => typeof t.lastOffset === "number");
      updatedOffset = firstWithOffset?.lastOffset ?? 0;
      
      return updated;
    });
    // Update the progress UI and reflect new offset in timer
    setTimeout(() => {
      setTimer(Math.round(updatedOffset));
      console.log(`Check seek all ${play ? 'Playing' : 'Paused'} – offsetSeconds: ${offsetSeconds}, updatedOffset: ${updatedOffset}`);
    }, 0); // ensures it runs after state update
  };  

  // Rewind and forward by 10
  const rewind10 = () => seekAll(-10);
  const forward10 = () => seekAll(10);

  // Finalize the soundscape and show the save modal
  const handleFinalize = () => {
    setShowSaveModal(true);
  };

  const handleSaveSoundscape = async () => {
    if (!soundscapeName.trim()) {
      alert("Please enter a name for your soundscape");
      return;
    }

    setIsSaving(true);
    setSaveSuccess(null);

    try {
      // Map over the current tracks state to download sounds and get settings
      const downloadPromises = tracks.map(async (track) => {
        const originalSoundId = soundIds[track.id] || 0; // Find original ID based on track index
        // Use the track name from trackNames prop if available, otherwise use default "Track N"
        const trackName = trackNames[track.id] || `Track ${track.id + 1}`;
        
        const soundObj: Sound = {
          sound_number: String(track.id + 1), // Use current track info
          name: trackName,
          description: `Sound from ${track.url}`,
          sound_url: track.url,
          preview_url: track.url,
          freesound_id: String(originalSoundId)
        };
        
        try { 
          // Download sound if it's not already downloaded/created in the backend
          // The downloadSound service should handle checking if it exists first
          const downloadResult = await downloadSound(soundObj);
          return {
            downloaded_id: downloadResult.sound.sound_id, // Use the ID from the backend
            volume: track.volumeLevel,
            pan: track.panValue
          };
        } catch (error) {
          console.error(`Error downloading/fetching sound for track ${track.id}:`, error);
          return null; 
        }
      });
      
      const downloadedResults = await Promise.all(downloadPromises);
      
      // Filter out any null results (failed downloads) and map to the expected structure
      const soundsWithSettings = downloadedResults
        .filter(result => result !== null) // Filter out any null results (failed downloads)
        .map(result => ({
          sound_id: result!.downloaded_id, // Map to the expected structure 
          volume: result!.volume, // Volume from the track
          pan: result!.pan // Pan from the track
        }));

      if (soundsWithSettings.length === 0) {
        alert("No valid sounds to save. Please ensure tracks are loaded properly.");
        throw new Error("No sounds to save");
      }

      // Call the soundscape service to save the soundscape
      const result = await createSoundscape(
        soundscapeName,
        soundscapeDescription,
        soundsWithSettings
      );
      
      console.log('Soundscape saved successfully:', result);
      setSaveSuccess(result);
      
      // Keep the modal open to show success message
    } catch (error) {
      console.error('Error saving soundscape:', error);
      setSaveSuccess(null); // Indicates failure
      alert(`Failed to save soundscape: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Save is cancelled
  const handleCancelSave = () => {
    setShowSaveModal(false);
    setSoundscapeName("");
    setSoundscapeDescription("");
    setSaveSuccess(null);
  };

  // Show the add sound modal
  const handleShowAddSoundModal = () => {
    setShowAddSoundModal(true);
    setSoundQuery("");
  };

  // Cancel the add sound modal
  const handleCancelAddSound = () => {
    setShowAddSoundModal(false);
    setSoundQuery("");
    setIsSearchingSound(false);
    setSearchedSound(null);
    setIsAddingSound(false);
  };

  // Search for a sound
  const handleSearchSound = async () => {
    if (!soundQuery.trim()) {
      alert("Please enter a search term");
      return;
    }

    setIsSearchingSound(true);
    setSearchedSound(null);
    
    try {
      // Search for a sound using the query
      const sound = await searchSingleSound(soundQuery);
      
      if (!sound) {
        // This is expected when no sound is found
        alert(`No sound found for "${soundQuery}". Please try a different search term.`);
        setIsSearchingSound(false);
        return;
      }
      
      // Store the found sound in state
      setSearchedSound(sound);
      
    } catch (error) {
      console.error("Error searching for sound:", error);
      alert(`Error searching for sound: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSearchingSound(false);
    }
  };

  // Add a sound
  const handleAddSound = async () => {
    if (!searchedSound) {
      return;
    }
    
    setIsAddingSound(true);
    
    try {
      // Download the sound
      const downloadResult = await downloadSound(searchedSound);
      
      if (!downloadResult.success) {
        throw new Error("Failed to download sound");
      }
      
      // Get the soundscape ID from props or URL
      let scapeId = soundscapeId;
      
      // If not provided in props, try to get from URL
      if (!scapeId) {
        const urlParams = new URLSearchParams(window.location.search);
        const urlScapeId = urlParams.get('soundscapeId');
        if (urlScapeId) {
          scapeId = urlScapeId;
        }
      }
      
      // If we're editing an existing soundscape, add the sound to it in the database
      if (scapeId) {
        try {
          // Add the sound to the soundscape
          const addResult = await addSoundToSoundscape(parseInt(scapeId), {
            sound_id: downloadResult.sound.sound_id,
            volume: 1.0,
            pan: 0.0
          });
          
          if (!addResult.success) {
            throw new Error("Failed to add sound to soundscape");
          }
        } catch (error) {
          console.error("Error adding sound to existing soundscape:", error);
          // Continue even if this fails - we'll add it to the UI directly
        }
      }
      
      // Either way, add the sound to the UI
      // Create a new Tone.Player
      const newPlayer = new Tone.Player({
        url: downloadResult.sound.file_path ? `http://localhost:3001${downloadResult.sound.file_path}` : (searchedSound.preview_url || ''),
        loop: true,
        autostart: false,
        onload: () => {
          setLoadedCount(prev => prev + 1);
        }
      });
      
      // Create new panner and volume nodes
      const newPanner = new Tone.Panner(0);
      const newVolume = new Tone.Volume(0);
      
      // Connect the audio nodes
      newPlayer.connect(newPanner);
      newPanner.connect(newVolume);
      if (masterVolumeNode.current) {
        newVolume.connect(masterVolumeNode.current);
      }
      
      // Add to the tracklist
      const newTrack: AudioTrack = {
        id: tracks.length,
        url: downloadResult.sound.file_path ? `http://localhost:3001${downloadResult.sound.file_path}` : (searchedSound.preview_url || ''),
        player: newPlayer,
        panner: newPanner,
        volume: newVolume,
        isPlaying: false,
        volumeLevel: 0,
        panValue: 0,
        pendingStartTimer: null,
        isMuted: false,
        lastOffset: 0
      };
      
      // Add the new track to tracks state
      setTracks(prev => [...prev, newTrack]);
      
      // Add the track name
      setTrackNames(prev => [...prev, searchedSound.name]);
      
      // Add to the soundIds list
      if (downloadResult.sound.sound_id) {
        const newSoundId = downloadResult.sound.sound_id;
        soundIds.push(newSoundId);
      }
      
      // Close the modal
      setShowAddSoundModal(false);
      setSearchedSound(null);
      
      // Let the user know the sound was added successfully
      alert(`"${searchedSound.name}" added to your soundscape!`);
      
    } catch (error) {
      console.error("Error adding sound:", error);
      alert(`Error adding sound: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsAddingSound(false);
    }
  };

  // If the tracks are not loaded, show the loading screen
  if (!isLoaded) {
    return (
      <div className="audio-mixer-loading">
        <div className="spinner"></div>
        <p>Loading tracks: {loadedCount} of {soundUrls.length}</p>
      </div>
    );
  }

  return (
    // Mixer Component
  <div className='mixer-page'>
    <div className="mixer-component">

      {/* Audio Player Section */}
      <div className="music-player-container">
        <div className="player-screen">
          <div className="title-container">
            <p className="title">{title}</p>
          </div>

          <div className="img-container">
            {localImageUrl ? (
              <div className="player-image-container">
                <img 
                  src={localImageUrl} 
                  alt={title || "Soundscape"} 
                  className="player-image"
                />
                <canvas
                  ref={canvasRef}
                  width={200}
                  height={30}
                  className="waveform-overlay"
                />
              </div>
            ) : (
              <canvas
                ref={canvasRef}
                width={200}
                height={100}
                className="waveform"
              />
            )}
          </div> 
  
          <div className="audio-progress ">
            <input
              type="range"
              className='audio-range'
              min={0}
              max={2000}
              value={timer}
              readOnly
            />
            <p>{formatTimer(timer)}</p>
          </div>
  
          <div className="audio-waveform">
            <div className="wave">
              <canvas
                ref={canvasRef}
                className='waveform-display'
              />
            </div>
          </div>
        </div>
  
        <div className="player-controls-container">
          <div className="change-function">
            <div className="change-btn">
              <button className='change'>
                CHANGE
              </button>
            </div>
          </div>
          
          <div className="player-controls">
            <button className="btn-icon" onClick={rewind10}>
                <svg id="Rewind-10--Streamline-Carbon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" height="32" width="32">
                    <desc>Rewind 10 Streamline Icon: https://streamlinehq.com</desc>
                    <defs></defs>
                    <title>rewind--10</title>
                    <path d="M4 18A12 12 0 1 0 16 6h-4V1L6 7l6 6V8h4A10 10 0 1 1 6 18Z" fill="#000000" strokeWidth="1"></path>
                    <path d="M19.63 22.13a2.84 2.84 0 0 1 -1.28 -0.27 2.44 2.44 0 0 1 -0.89 -0.77 3.57 3.57 0 0 1 -0.52 -1.25 7.69 7.69 0 0 1 -0.17 -1.68 7.83 7.83 0 0 1 0.17 -1.68 3.65 3.65 0 0 1 0.52 -1.25 2.44 2.44 0 0 1 0.89 -0.77 2.84 2.84 0 0 1 1.28 -0.27 2.44 2.44 0 0 1 2.16 1 5.23 5.23 0 0 1 0.7 2.93 5.23 5.23 0 0 1 -0.7 2.93 2.44 2.44 0 0 1 -2.16 1.08Zm0 -1.22a1.07 1.07 0 0 0 1 -0.55 3.38 3.38 0 0 0 0.37 -1.51v-1.38a3.31 3.31 0 0 0 -0.29 -1.5 1.23 1.23 0 0 0 -2.06 0 3.31 3.31 0 0 0 -0.29 1.5v1.38a3.38 3.38 0 0 0 0.29 1.51 1.06 1.06 0 0 0 0.98 0.55Z" fill="#000000" strokeWidth="1"></path>
                    <path d="M10.63 22v-1.18h2v-5.19l-1.86 1 -0.55 -1.06 2.32 -1.3H14v6.5h1.78V22Z" fill="#000000" strokeWidth="1"></path><path id="_Transparent_Rectangle_" d="M0 0h32v32H0Z" fill="none" strokeWidth="1"></path>
                </svg>
            </button>
  
            {play ? 
              <button className="btn-icon large" onClick={playAll}>
                <svg id="Play-Filled-Alt--Streamline-Carbon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60" height="60" width="60">
                    <desc>Play Filled Alt Streamline Icon: https://streamlinehq.com</desc>
                    <defs></defs>
                    <path d="M13.125 52.5a1.875 1.875 0 0 1 -1.875 -1.875V9.375a1.875 1.875 0 0 1 2.7785625 -1.6430624999999999l37.5 20.625a1.875 1.875 0 0 1 0 3.2859374999999997l-37.5 20.625A1.8759374999999998 1.8759374999999998 0 0 1 13.125 52.5Z" fill="#000000" strokeWidth="1.875"></path>
                    <path id="_Transparent_Rectangle_" d="M0 0h60v60H0Z" fill="none" strokeWidth="1.875"></path>
                </svg>
              </button>
            :
              <button className="btn-icon large" onClick={stopAll}> 
                <svg id="Pause-Filled--Streamline-Carbon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60" height="60" width="60">
                  <desc>Pause Filled Streamline Icon: https://streamlinehq.com</desc>
                  <defs></defs>
                  <title>pause--filled</title>
                  <path d="M22.5 11.25h-3.75a3.75 3.75 0 0 0 -3.75 3.75v30a3.75 3.75 0 0 0 3.75 3.75h3.75a3.75 3.75 0 0 0 3.75 -3.75V15a3.75 3.75 0 0 0 -3.75 -3.75Z" fill="#000000" strokeWidth="1.875"></path>
                  <path d="M41.25 11.25h-3.75a3.75 3.75 0 0 0 -3.75 3.75v30a3.75 3.75 0 0 0 3.75 3.75h3.75a3.75 3.75 0 0 0 3.75 -3.75V15a3.75 3.75 0 0 0 -3.75 -3.75Z" fill="#000000" strokeWidth="1.875"></path>
                  <path id="_Transparent_Rectangle_" d="M0 0h60v60H0Z" fill="none" strokeWidth="1.875"></path>
                </svg>
              </button>
            }
  
            <button className="btn-icon" onClick={forward10}>
                <svg id="Forward-10--Streamline-Carbon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" height="32" width="32">
                    <desc>Forward 10 Streamline Icon: https://streamlinehq.com</desc>
                    <defs></defs>
                    <title>forward--10</title>
                    <path d="M26 18A10 10 0 1 1 16 8h4v5l6 -6 -6 -6v5h-4a12 12 0 1 0 12 12Z" fill="#000000" strokeWidth="1"></path>
                    <path d="M19.63 22.13a2.84 2.84 0 0 1 -1.28 -0.27 2.44 2.44 0 0 1 -0.89 -0.77 3.57 3.57 0 0 1 -0.52 -1.25 7.69 7.69 0 0 1 -0.17 -1.68 7.83 7.83 0 0 1 0.17 -1.68 3.65 3.65 0 0 1 0.52 -1.25 2.44 2.44 0 0 1 0.89 -0.77 2.84 2.84 0 0 1 1.28 -0.27 2.44 2.44 0 0 1 2.16 1 5.23 5.23 0 0 1 0.7 2.93 5.23 5.23 0 0 1 -0.7 2.93 2.44 2.44 0 0 1 -2.16 1.08Zm0 -1.22a1.07 1.07 0 0 0 1 -0.55 3.38 3.38 0 0 0 0.37 -1.51v-1.38a3.31 3.31 0 0 0 -0.29 -1.5 1.23 1.23 0 0 0 -2.06 0 3.31 3.31 0 0 0 -0.29 1.5v1.38a3.38 3.38 0 0 0 0.29 1.51 1.06 1.06 0 0 0 0.98 0.55Z" fill="#000000" strokeWidth="1"></path>
                    <path d="M10.63 22v-1.18h2v-5.19l-1.86 1 -0.55 -1.06 2.32 -1.3H14v6.5h1.78V22Z" fill="#000000" strokeWidth="1"></path><path id="_Transparent_Rectangle_" d="M0 0h32v32H0Z" fill="none" strokeWidth="1"></path>
                </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mixer Audio  */}
      <div className='mixer'>
        <div className="header-audio-mixer">
          <div className="mixer-icon">
            <img src="/logoMixer.png" alt="logo mixer" className="logo-mixer" />
          </div>
                            
          <div className="mix-button-container">
            <div className="mix-button">
              <p className="mix-title"> MIX </p>
            </div>
          </div>
        </div>

        <div className="mixer-channels-container">            
              {tracks.map((track, index) => (
                <div key={track.id} className='channel-container'>

                  <div className="mixer-btn">
                    <div className="display-screen">
                      <p>{track.isMuted ? "∞ dB" : `${track.volumeLevel} dB`}</p>
                    </div>

                    <div className="knob-container">
                      <div className="track-wrapper">
                        <span className='pan-label'>L</span>
                        <input 
                          type="range"
                          min={-1}
                          max={1}
                          step={0.01}
                          value={track.panValue}
                          onChange={(e) => handlePanChange(track.id, Number(e.target.value))}
                          className='track-slider'
                        />
                        <span className='pan-label'>R</span>
                      </div>
                    </div>

                    <div className="buttons-container">
                      <div className="play button">
                        <div className='btn'>
                          <button onClick={() => togglePlay(track.id)}>
                            {track.isPlaying ? 
                              <svg id="Pause-Filled--Streamline-Carbon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" height="14" width="14">
                                <desc>Pause Filled Streamline Icon: https://streamlinehq.com</desc>
                                <defs></defs>
                                <title>pause--filled</title>
                                <path d="M4.5 2.25h-0.75a0.75 0.75 0 0 0 -0.75 0.75v6a0.75 0.75 0 0 0 0.75 0.75h0.75a0.75 0.75 0 0 0 0.75 -0.75V3a0.75 0.75 0 0 0 -0.75 -0.75Z" fill="#5C5C5C" strokeWidth="0.375"></path><path d="M8.25 2.25h-0.75a0.75 0.75 0 0 0 -0.75 0.75v6a0.75 0.75 0 0 0 0.75 0.75h0.75a0.75 0.75 0 0 0 0.75 -0.75V3a0.75 0.75 0 0 0 -0.75 -0.75Z" fill="#5C5C5C" strokeWidth="0.375"></path>
                                <path id="_Transparent_Rectangle_" d="M0 0h12v12H0Z" fill="none" strokeWidth="0.375"></path>
                              </svg>
                            :
                              <svg id="Play-Filled-Alt--Streamline-Carbon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" height="13" width="13">
                                <desc>Play Filled Alt Streamline Icon: https://streamlinehq.com</desc>
                                <defs></defs>
                                <path d="M3.5 14a0.5 0.5 0 0 1 -0.5 -0.5V2.5a0.5 0.5 0 0 1 0.74095 -0.43815l10 5.5a0.5 0.5 0 0 1 0 0.87625l-10 5.5A0.50025 0.50025 0 0 1 3.5 14Z" fill="#5C5C5C" strokeWidth="0.5"></path>
                                <path id="_Transparent_Rectangle_" d="M0 0h16v16H0Z" fill="none" strokeWidth="0.5"></path>
                              </svg>
                            }
                            </button>                   
                        </div>
                      </div>

                      <div className="mute button">
                        <div className='btn' onClick={() => handleMute(track.id)}>
                          <button className={`mute ${track.isMuted ? 'active' : ''}`}>
                            MUTE
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>  

                  <div className="mixer-controls">
                    <div className='volume-meter-container'>
                      {track.isMuted ? <div className="led-indicator red"></div> : <div className="led-indicator"></div>}
                      
                      <div className="volume-meter">
                        <div className="meter-fill" style={{ height: `${track.isMuted ? 0 : ((track.volumeLevel + 41) / 59) * 100}%`, transition: 'height 0.3s ease' }}></div>
                      </div>
                    </div>

                    <div className="volume-container">
                      <div className="control-container">
                        <input
                          type="range"
                          min="-41"
                          max="18"
                          step="0.5"
                          value={track.isMuted ? -44: track.volumeLevel}
                          onChange={(e) => 
                            handleVolumeChange(track.id, Number(e.target.value))
                          }
                          className='control-volume'
                        />
                      </div>
                    </div>
                  </div>

                  <div className="channel-label">
                    <p className='label' title={trackNames[index] || `Track ${index + 1}`}>
                      {trackNames[index] ? trackNames[index] : `Track ${index + 1}`}
                    </p>
                    {!readOnly && (
                      <button 
                        className="delete-track-btn" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTrack(track.id);
                        }}
                        title="Delete track"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
                          <path fill="#f4671f" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
            ))}

            {/* Master Channel Section */}
            <div className="channel-container">
              <div className="mixer-btn">
                  <div className="display-screen master-digital">
                    <p>{muted ? "∞ dB" : `${masterVolume} dB`}</p>
                  </div>
                      
                  <div className="buttons-container" onClick={handleMuteAll}>
                    
                    <div className="mute button master-mute">
                      <div className='btn master-btn' >
                        <button className={`mute ${muted ? 'active' : ''}`}>
                          MUTE ALL
                        </button>
                      </div>
                    </div>
                    </div>
                  </div>  

                  <div className="mixer-controls">
                    <div className='volume-meter-container'>
                      {muted ?
                        <div className="led-indicator red"></div>
                        :
                        <div className="led-indicator"></div>
                      }

                      <div className="volume-meter">
                        <div className="meter-fill" style={{ height: `${muted ? 0 : ((masterVolume + 41) / 59) * 100}%`, transition: 'height 0.3s ease' }}></div>
                      </div>
                    </div>

                    <div className="volume-container">
                      <div className="control-container">
                        <input
                          type="range"
                          min="-41"
                          max="18"
                          step="0.5"
                          value={muted ? -44 : masterVolume}
                          onChange={(e) => handleMasterVolumeChange(Number(e.target.value))}
                          className='control-volume master-control'
                        />
                      </div>
                    </div>
                  </div>

                  <div className="channel-label master-label">
                    <p className='label'>Master</p>
                  </div>
              </div>
            </div>
      </div>
    </div>

    {/* Information component */}
    <div className='information-container'>

      <div className='mixer-dash'></div>
      
      <div className='information-wrapper'>
        <div className="information">
          <p className='infor-title'>{title}</p>
          <p className='infor-description'>{description}</p>
          <p className='infor-tags'>Included sound tracks: </p>
          <ul className="infor-sounds-list">
            {tracks.map((track) => {
              const name = trackNames[track.id] || `Track ${track.id + 1}`;
              return (
                <li key={track.id}>{name}</li>
              );
            })}
          </ul>
        </div>
        <div className="functions">
          <div className='credit'>
            <div className='credit-icon'>
              <svg id="Location-Hazard--Streamline-Carbon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><desc>Location Hazard Streamline Icon: https://streamlinehq.com</desc><defs></defs><path d="M14.5 20.5a1.5 1.5 0 1 0 3 0 1.5 1.5 0 1 0 -3 0" fill="#f4671f" strokeWidth="1"></path><path d="M15 7h2v9h-2Z" fill="#f4671f" strokeWidth="1"></path><path d="m16 30 -8.4355 -9.9487c-0.0479 -0.0571 -0.3482 -0.4515 -0.3482 -0.4515A10.8888 10.8888 0 0 1 5 13a11 11 0 0 1 22 0 10.8844 10.8844 0 0 1 -2.2148 6.5973l-0.0015 0.0025s-0.3 0.3944 -0.3447 0.4474ZM8.8125 18.395c0.001 0.0007 0.2334 0.3082 0.2866 0.3744L16 26.9079l6.91 -8.15c0.0439 -0.0552 0.2783 -0.3649 0.2788 -0.3657A8.901 8.901 0 0 0 25 13a9 9 0 0 0 -18 0 8.9054 8.9054 0 0 0 1.8125 5.395Z" fill="#f4671f" strokeWidth="1"></path><path id="_Transparent_Rectangle_" d="M0 0h32v32H0Z" fill="none" strokeWidth="1"></path></svg>
            </div>
            <p>You can share (copy, distribute, and transmit) and remix (adapt and change) the sound as long as you acknowledge the author.</p>
          </div>
          {!readOnly && (
            <div className='func-container final' onClick={handleFinalize}>
              <svg id="Save-Annotation--Streamline-Carbon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><desc>Save Annotation Streamline Icon: https://streamlinehq.com</desc><defs></defs><title>watson-health--save--annotation</title><path d="m21.56 15.1 -3.48 -4.35a2 2 0 0 0 -1.56 -0.75H4a2 2 0 0 0 -2 2v16a2 2 0 0 0 2 2h16a2 2 0 0 0 2 -2V16.35a2 2 0 0 0 -0.44 -1.25ZM9 12h6v3H9Zm6 16H9v-6h6Zm2 0v-6a2 2 0 0 0 -2 -2H9a2 2 0 0 0 -2 2v6H4V12h3v3a2 2 0 0 0 2 2h6a2 2 0 0 0 2 -2v-2.4l3 3.75V28Z" fill="#f4671f" strokeWidth="1"></path><path d="M28 20h-3v-2h3V4H8v3H6V4a2 2 0 0 1 2 -2h20a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2Z" fill="#f4671f" strokeWidth="1"></path><path d="M20 6h6v2h-6Z" fill="#f4671f" strokeWidth="1"></path><path d="M22 10h4v2h-4Z" fill="#f4671f" strokeWidth="1"></path><path id="_Transparent_Rectangle_" d="M0 0h32v32H0Z" fill="none" strokeWidth="1"></path></svg>
              <button >Finalize</button>
            </div>
          )}
          <div className='func-container'>
            <svg id="Share--Streamline-Carbon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><desc>Share Streamline Icon: https://streamlinehq.com</desc><defs></defs><title>share</title><path d="M23 20a5 5 0 0 0-3.89 1.89l-7.31-4.57a4.46 4.46 0 0 0 0-2.64l7.31-4.57A5 5 0 1 0 18 7a4.79 4.79 0 0 0 .2 1.32l-7.31 4.57a5 5 0 1 0 0 6.22l7.31 4.57A4.79 4.79 0 0 0 18 25a5 5 0 1 0 5-5Zm0-16a3 3 0 1 1-3 3 3 3 0 0 1 3-3ZM7 19a3 3 0 1 1 3-3 3 3 0 0 1-3 3Zm16 9a3 3 0 1 1 3-3 3 3 0 0 1-3 3Z" fill="#f4671f"></path><path id="_Transparent_Rectangle_" transform="rotate(-90 16 16)" d="M0 0h32v32H0Z" fill="none"></path></svg>
            <button>Share</button>
          </div>
          
          {!readOnly && tracks.length < 6 && (
            <div className='func-container add-sound' onClick={handleShowAddSoundModal}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
                <path d="M16 4c6.6 0 12 5.4 12 12s-5.4 12-12 12S4 22.6 4 16 9.4 4 16 4m0-2C8.3 2 2 8.3 2 16s6.3 14 14 14 14-6.3 14-14S23.7 2 16 2z" fill="#f4671f"/>
                <path d="M24 15h-7V8h-2v7H8v2h7v7h2v-7h7z" fill="#f4671f"/>
              </svg>
              <button>Add Sound {`(${tracks.length}/6)`}</button>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Save Soundscape Modal - Only show in edit mode */}
    {!readOnly && showSaveModal && (
         <div className="modal-overlay">
           <div className="modal-content">
             <h2>Save Your Soundscape</h2>
             
             {saveSuccess === null ? (
               <>
                 <div className="form-group">
                   <label htmlFor="soundscape-name">Name</label>
                   <input
                     id="soundscape-name"
                     type="text"
                     value={soundscapeName}
                     onChange={(e) => setSoundscapeName(e.target.value)}
                     placeholder="Enter a name for your soundscape"
                     disabled={isSaving}
                   />
                 </div>
                 
                 <div className="form-group">
                   <label htmlFor="soundscape-description">Description (optional)</label>
                   <textarea
                     id="soundscape-description"
                     value={soundscapeDescription}
                     onChange={(e) => setSoundscapeDescription(e.target.value)}
                     placeholder="Describe your soundscape"
                     disabled={isSaving}
                   />
                 </div>
                 
                 <div className="modal-actions">
                   <button 
                     className="modal-button cancel" 
                     onClick={handleCancelSave}
                     disabled={isSaving}
                   >
                     Cancel
                   </button>
                   <button 
                     className="modal-button save" 
                     onClick={handleSaveSoundscape}
                     disabled={isSaving}
                   >
                     {isSaving ? 'Saving...' : 'Save Soundscape'}
                   </button>
                 </div>
               </>
             ) : saveSuccess ? (
               <div className="success-message">
                 <p>Soundscape saved successfully!</p>
                 {saveSuccess.soundscape && (
                   <div className="soundscape-info">
                     <p>Soundscape ID: <strong>{saveSuccess.soundscape.soundscape_id}</strong></p>
                     <p>You can access your soundscape at:</p>
                     <div className="soundscape-link">
                       <a 
                         href={`/soundscape/${saveSuccess.soundscape.soundscape_id}`}
                         target="_blank"
                         rel="noopener noreferrer"
                       >
                         {window.location.origin}/soundscape/{saveSuccess.soundscape.soundscape_id}
                       </a>
                       <button 
                         className="copy-button"
                         onClick={() => {
                           navigator.clipboard.writeText(
                             `${window.location.origin}/soundscape/${saveSuccess.soundscape.soundscape_id}`
                           );
                           alert('Link copied to clipboard!');
                         }}
                       >
                         Copy
                       </button>
                     </div>
                     <div className="modal-actions">
                       <button 
                         className="modal-button view" 
                         onClick={() => {
                           window.open(
                             `/soundscape/${saveSuccess.soundscape.soundscape_id}`,
                             '_blank'
                           );
                         }}
                       >
                         View Soundscape
                       </button>
                       <button 
                         className="modal-button close" 
                         onClick={handleCancelSave}
                       >
                         Close
                       </button>
                     </div>
                   </div>
                 )}
               </div>
             ) : (
               <div className="error-message">
                 <p>Failed to save soundscape. Please try again.</p>
                 <button 
                   className="modal-button retry" 
                   onClick={() => setSaveSuccess(null)}
                 >
                   Try Again
                 </button>
               </div>
             )}
           </div>
         </div>
       )}

    {/* Add Sound Modal - Only show in edit mode */}
    {!readOnly && showAddSoundModal && (
      <div className="modal-overlay">
        <div className="modal-content">
          <h2>Add Sound to Soundscape</h2>
          <p>You have {tracks.length}/6 sounds in your soundscape.</p>
          
          {!searchedSound ? (
            <>
              <div className="form-group">
                <label htmlFor="sound-query">What sound are you looking for?</label>
                <input
                  id="sound-query"
                  type="text"
                  value={soundQuery}
                  onChange={(e) => setSoundQuery(e.target.value)}
                  placeholder="E.g. forest birds, ocean waves, rain"
                  disabled={isSearchingSound}
                />
              </div>
              
              <div className="modal-actions">
                <button 
                  className="modal-button cancel" 
                  onClick={handleCancelAddSound}
                  disabled={isSearchingSound}
                >
                  Cancel
                </button>
                <button 
                  className="modal-button search" 
                  onClick={handleSearchSound}
                  disabled={isSearchingSound}
                >
                  {isSearchingSound ? 'Searching...' : 'Find Sound'}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="sound-result">
                <h3>{searchedSound.name}</h3>
                <div className="sound-meta">
                  {searchedSound.duration && (
                    <span className="sound-duration">Duration: {Math.round(searchedSound.duration)} seconds</span>
                  )}
                  {searchedSound.license && (
                    <span className="sound-license">License: {searchedSound.license}</span>
                  )}
                </div>
                <p>{searchedSound.description.length > 150 
                  ? `${searchedSound.description.substring(0, 150)}...` 
                  : searchedSound.description}
                </p>
                {searchedSound.preview_url && (
                  <div className="preview-audio">
                    <label className="preview-label">Preview:</label>
                    <audio 
                      src={searchedSound.preview_url} 
                      controls 
                      controlsList="nodownload"
                      style={{ width: '100%', marginTop: '10px' }}
                      autoPlay
                    />
                  </div>
                )}
              </div>
              
              <div className="modal-actions">
                <button 
                  className="modal-button cancel" 
                  onClick={handleCancelAddSound}
                  disabled={isAddingSound}
                >
                  Cancel
                </button>
                <button 
                  className="modal-button save" 
                  onClick={handleAddSound}
                  disabled={isAddingSound}
                >
                  {isAddingSound ? 'Adding Sound...' : 'Add to Soundscape'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    )}
  </div>
  );
};

export default AudioMixer;