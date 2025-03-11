"use client";

import React, {useState, useRef, useEffect, ChangeEvent,} from 'react';
import './AudioPlayer.css';
  
const AudioPlayer = () => {
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [currentTime, setCurrentTime] = useState<number>(0);
    const [duration, setDuration] = useState<number>(0);
    const [isRepeat, setIsRepeat] = useState<boolean>(false);
  
    const audioRef = useRef<HTMLAudioElement | null>(null);
  
    const handleSeek = (e: ChangeEvent<HTMLInputElement>) => {
      const newTime = Number(e.target.value);
      if (audioRef.current) {
        audioRef.current.currentTime = newTime;
      }
      setCurrentTime(newTime);
    };
  
    const handleTimeUpdate = () => {
      if (audioRef.current) {
        setCurrentTime(audioRef.current.currentTime);
        setDuration(audioRef.current.duration || 0);
      }
    };
  
    const handlePlay = () => {
      if (audioRef.current) {
        audioRef.current.play();
        setIsPlaying(true);
      }
    };
  
    const handlePause = () => {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    };
  
    const handlePlayPause = () => {
      if (isPlaying) {
        handlePause();
      } else {
        handlePlay();
      }
    };
  
    const handleBackward = () => {
      if (audioRef.current) {
        audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
      }
    };
  
    const handleForward = () => {
      if (audioRef.current) {
        audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime + 10);
      }
    };
  
    const handleRepeat = () => {
      setIsRepeat((prev) => !prev);
      if (audioRef.current) {
        audioRef.current.loop = !isRepeat;
      }
    };
  
    function formatDuration(durationSeconds: number): string {
      const min = Math.floor(durationSeconds / 60);
      const sec = Math.floor(durationSeconds % 60);
      const formattedSec = sec.toString().padStart(2, '0');
      return `${min}:${formattedSec}`;
    }
  
    useEffect(() => {
      const audio = audioRef.current;
      if (!audio) return;
  
      audio.addEventListener('timeupdate', handleTimeUpdate);
  
      return () => {
        audio.removeEventListener('timeupdate', handleTimeUpdate);
      };
    }, []);
  
    return (
      <div className="music-player-container">
        <div className="player-screen">
          <div className="title-container">
            <p className="title">THIS IS A TITLE</p>
          </div>

          <div className="img-container">
            <img
                src="/spaceshipFlying.jpg"
                alt="audioImage"
                className="audio-image"
            />
            <div className="zoom-icon">
                <svg id="Sync-Settings--Streamline-Carbon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" height="22" width="22">
                    <desc>Sync Settings Streamline Icon: https://streamlinehq.com</desc>
                    <defs></defs>
                    <path d="m15 24 0-2-3.6 0L22 11.4l0 3.6 2 0 0-7-7 0 0 2 3.6 0L10 20.6l0-3.6-2 0 0 7 7 0z" stroke-width="0" fill="#f4671f"></path>
                    <path d="M25 20v2h3c1.1 0 2-.9 2-2v-3h-2v3h-3Z" stroke-width="0" fill="#f4671f"></path><path d="M28 10h2v4h-2Z" stroke-width="0" fill="#f4671f"></path>
                    <path d="M25 2v2h3v3h2V4c0-1.1-.9-2-2-2h-3Z" stroke-width="0" fill="#f4671f"></path>
                    <path d="M18 2h4v2h-4Z" stroke-width="0" fill="#f4671f"></path>
                    <path d="M10 4v3h2V4h3V2h-3c-1.1 0-2 .9-2 2Z" stroke-width="0" fill="#f4671f"></path>
                    <path d="M12 10H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-8h-2v8H4V12h8v-2Z" stroke-width="0" fill="#f4671f"></path><path id="_Transparent_Rectangle_" transform="rotate(180 16 16)" d="M0 0h32v32H0Z" stroke-width="0" fill="none"></path>
                </svg>
            </div>
          </div> 
  
          <div className="audio-progress ">
            <p>{formatDuration(currentTime)}</p>
            <input
              type="range"
              min="0"
              max={duration}
              value={currentTime}
              onChange={handleSeek}
              className='audio-range'
            />
            <audio
              ref={audioRef}
              src=""
            />
            <p>{formatDuration(duration)}</p>
          </div>
  
          <div className="audio-waveform">
            <div className="wave"></div>
          </div>
        </div>
  
        <div className="player-controls-container">
          <div className="repeat-function">
            <div className="repeat-btn">
              <button
                className={`repeat ${isRepeat ? 'active' : ''}`}
                onClick={handleRepeat}>
                REPEAT
              </button>
            </div>
          </div>
          <div className="player-controls">
            <button className="btn-icon" onClick={handleBackward}>
                <svg id="Rewind-10--Streamline-Carbon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" height="32" width="32">
                    <desc>Rewind 10 Streamline Icon: https://streamlinehq.com</desc>
                    <defs></defs>
                    <title>rewind--10</title>
                    <path d="M4 18A12 12 0 1 0 16 6h-4V1L6 7l6 6V8h4A10 10 0 1 1 6 18Z" fill="#000000" stroke-width="1"></path>
                    <path d="M19.63 22.13a2.84 2.84 0 0 1 -1.28 -0.27 2.44 2.44 0 0 1 -0.89 -0.77 3.57 3.57 0 0 1 -0.52 -1.25 7.69 7.69 0 0 1 -0.17 -1.68 7.83 7.83 0 0 1 0.17 -1.68 3.65 3.65 0 0 1 0.52 -1.25 2.44 2.44 0 0 1 0.89 -0.77 2.84 2.84 0 0 1 1.28 -0.27 2.44 2.44 0 0 1 2.16 1 5.23 5.23 0 0 1 0.7 2.93 5.23 5.23 0 0 1 -0.7 2.93 2.44 2.44 0 0 1 -2.16 1.08Zm0 -1.22a1.07 1.07 0 0 0 1 -0.55 3.38 3.38 0 0 0 0.37 -1.51v-1.38a3.31 3.31 0 0 0 -0.29 -1.5 1.23 1.23 0 0 0 -2.06 0 3.31 3.31 0 0 0 -0.29 1.5v1.38a3.38 3.38 0 0 0 0.29 1.51 1.06 1.06 0 0 0 0.98 0.55Z" fill="#000000" stroke-width="1"></path>
                    <path d="M10.63 22v-1.18h2v-5.19l-1.86 1 -0.55 -1.06 2.32 -1.3H14v6.5h1.78V22Z" fill="#000000" stroke-width="1"></path><path id="_Transparent_Rectangle_" d="M0 0h32v32H0Z" fill="none" stroke-width="1"></path>
                </svg>
            </button>
  
            <button className="btn-icon large" onClick={handlePlayPause}>
              {isPlaying ? 
                <svg id="Play-Filled-Alt--Streamline-Carbon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60" height="60" width="60">
                    <desc>Play Filled Alt Streamline Icon: https://streamlinehq.com</desc>
                    <defs></defs>
                    <path d="M13.125 52.5a1.875 1.875 0 0 1 -1.875 -1.875V9.375a1.875 1.875 0 0 1 2.7785625 -1.6430624999999999l37.5 20.625a1.875 1.875 0 0 1 0 3.2859374999999997l-37.5 20.625A1.8759374999999998 1.8759374999999998 0 0 1 13.125 52.5Z" fill="#000000" stroke-width="1.875"></path>
                    <path id="_Transparent_Rectangle_" d="M0 0h60v60H0Z" fill="none" stroke-width="1.875"></path>
                </svg>
              : 
              <svg id="Pause-Filled--Streamline-Carbon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60" height="60" width="60">
                <desc>Pause Filled Streamline Icon: https://streamlinehq.com</desc>
                <defs></defs>
                <title>pause--filled</title>
                <path d="M22.5 11.25h-3.75a3.75 3.75 0 0 0 -3.75 3.75v30a3.75 3.75 0 0 0 3.75 3.75h3.75a3.75 3.75 0 0 0 3.75 -3.75V15a3.75 3.75 0 0 0 -3.75 -3.75Z" fill="#000000" stroke-width="1.875"></path>
                <path d="M41.25 11.25h-3.75a3.75 3.75 0 0 0 -3.75 3.75v30a3.75 3.75 0 0 0 3.75 3.75h3.75a3.75 3.75 0 0 0 3.75 -3.75V15a3.75 3.75 0 0 0 -3.75 -3.75Z" fill="#000000" stroke-width="1.875"></path>
                <path id="_Transparent_Rectangle_" d="M0 0h60v60H0Z" fill="none" stroke-width="1.875"></path>
              </svg>
              }
            </button>
  
            <button className="btn-icon" onClick={handleForward}>
                <svg id="Forward-10--Streamline-Carbon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" height="32" width="32">
                    <desc>Forward 10 Streamline Icon: https://streamlinehq.com</desc>
                    <defs></defs>
                    <title>forward--10</title>
                    <path d="M26 18A10 10 0 1 1 16 8h4v5l6 -6 -6 -6v5h-4a12 12 0 1 0 12 12Z" fill="#000000" stroke-width="1"></path>
                    <path d="M19.63 22.13a2.84 2.84 0 0 1 -1.28 -0.27 2.44 2.44 0 0 1 -0.89 -0.77 3.57 3.57 0 0 1 -0.52 -1.25 7.69 7.69 0 0 1 -0.17 -1.68 7.83 7.83 0 0 1 0.17 -1.68 3.65 3.65 0 0 1 0.52 -1.25 2.44 2.44 0 0 1 0.89 -0.77 2.84 2.84 0 0 1 1.28 -0.27 2.44 2.44 0 0 1 2.16 1 5.23 5.23 0 0 1 0.7 2.93 5.23 5.23 0 0 1 -0.7 2.93 2.44 2.44 0 0 1 -2.16 1.08Zm0 -1.22a1.07 1.07 0 0 0 1 -0.55 3.38 3.38 0 0 0 0.37 -1.51v-1.38a3.31 3.31 0 0 0 -0.29 -1.5 1.23 1.23 0 0 0 -2.06 0 3.31 3.31 0 0 0 -0.29 1.5v1.38a3.38 3.38 0 0 0 0.29 1.51 1.06 1.06 0 0 0 0.98 0.55Z" fill="#000000" stroke-width="1"></path>
                    <path d="M10.63 22v-1.18h2v-5.19l-1.86 1 -0.55 -1.06 2.32 -1.3H14v6.5h1.78V22Z" fill="#000000" stroke-width="1"></path><path id="_Transparent_Rectangle_" d="M0 0h32v32H0Z" fill="none" stroke-width="1"></path>
                </svg>
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  export default AudioPlayer;
  