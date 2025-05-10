import { useState, useRef, useEffect } from 'react';
import './TrackCard.css';
import Link from 'next/link';

// import { Eye, Download, Share2, Play } from "lucide-react";
// Redefine the props interface to handle soundscapes
interface TrackCardProps {
  soundscape_id?: number;
  sound_id?: number;
  imageUrl?: string;
  altText?: string;
  date?: string;
  name?: string;
  description?: string;
  previewUrl?: string;
  tags?: string[];
  isSoundscape?: boolean;
}

const TrackCard: React.FC<TrackCardProps> = ({
  soundscape_id,
  sound_id,
  imageUrl,  
  altText,   
  date,      
  name,      
  description, 
  previewUrl,
  tags = [],
  isSoundscape = false
}) => {
  // Add console.log to debug the tags
  console.log(`TrackCard for ${name}, tags:`, tags);

  const audioRef = useRef<HTMLAudioElement>(null);
  const progressContainerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  // Handle time update
  const handleTimeUpdate = () => {
    if (audioRef.current) { // If the audio reference is current
      const current = audioRef.current.currentTime; // Get the current time
      const duration = audioRef.current.duration; // Get the duration
      const percent = (current / duration) * 100; // Calculate the percentage
      setProgress(percent); // Set the progress
    }
  };

  // Function to handle the card click
  const handleCardClick = () => {
    if (isSoundscape && soundscape_id) {
      // If it's a soundscape, navigate to the soundscape page
      window.location.href = `/soundscape/${soundscape_id}`;
    } else {
      // Otherwise just play/pause the sound
      handleAudioToggle();
    }
  };

  // Function to play/pause the audio
  const handleAudioToggle = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  // Handle click on progress bar container to seek audio
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (!audioRef.current || !progressContainerRef.current) return;

    // Prevent the click from propagating to the parent container
    e.stopPropagation();

    const rect = progressContainerRef.current.getBoundingClientRect(); // Get the bounding client rect
    const clickX = e.clientX - rect.left; // Get the click x
    const newProgress = (clickX / rect.width); // Calculate the new progress
    const newTime = newProgress * audioRef.current.duration; // Calculate the new time
    audioRef.current.currentTime = newTime; // Set the current time
    setProgress(newProgress * 100); // Set the progress
  };

  // Use effect to handle time update
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.addEventListener('timeupdate', handleTimeUpdate);
      return () => {
        audio.removeEventListener('timeupdate', handleTimeUpdate);
      };
    }
  }, []);

  return (
    <div className={`track-card ${isSoundscape ? 'soundscape-card' : ''}`} onClick={handleCardClick}>
      <div className="track-control" style={{ position: 'relative', cursor: 'pointer' }}>
        <img src={imageUrl} alt={altText} />
        <div className="play-icon-overlay">
          {isSoundscape ? '' : (isPlaying ? '❚❚' : '►')}
        </div>
        {/* The progress bar appears on hover for regular sounds */}
        {!isSoundscape && previewUrl && (
          <div 
            className="progress-bar-container" 
            ref={progressContainerRef}
            onClick={handleProgressClick}
          >
            <div className="progress-bar" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>
      <div className="info-track">
        <span className="date">{date}</span>
        <h3>{name}</h3>
        {/* Only show description for non-soundscape items */}
        {!isSoundscape && description && (
          <p className="track-description">{description}</p>
        )}
        {tags && tags.length > 0 && (
          <div className="tags">
            <span className="tag-label"><strong>Tags:</strong></span>
              {tags.map((tag, index) => (
                <span className="tag-pill" key={index}>
                  {tag}
              </span>
            ))}
          </div>
        )}
      </div>
      {/* Hidden audio element; play/pause is controlled via image click */}
      {!isSoundscape && previewUrl && (
          <audio 
          ref={audioRef} 
          src={previewUrl} 
          controls={false} 
          style={{ display: 'none' }} 
          onEnded={() => setIsPlaying(false)}
        />
       )}
    </div>
  );
};

export default TrackCard;
