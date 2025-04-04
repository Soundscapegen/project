import { useState, useRef, useEffect } from 'react';
import './TrackCard.css';

// import { Eye, Download, Share2, Play } from "lucide-react";
// Define the props interface with default values in mind.
interface TrackCardProps {
  imageUrl?: string;
  altText?: string;
  date?: string;
  name?: string;
  description?: string;
  previewUrl?: string;
}
const TrackCard: React.FC<TrackCardProps> = ({
  imageUrl,  
  altText,   
  date,      
  name,      
  description, 
  previewUrl 
}) => {

  const audioRef = useRef<HTMLAudioElement>(null);
  const progressContainerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const duration = audioRef.current.duration;
      const percent = (current / duration) * 100;
      setProgress(percent);
    }
  };

  // Function to play the audio when the image is clicked
  const handleImageClick = () => {
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

    const rect = progressContainerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newProgress = (clickX / rect.width);
    const newTime = newProgress * audioRef.current.duration;
    audioRef.current.currentTime = newTime;
    setProgress(newProgress * 100);
  };

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
    <div className="track-card">
      <div className="track-control"
          onClick={handleImageClick} 
          style={{ position: 'relative', cursor: 'pointer' }}
      >
      <img src={imageUrl} alt={altText} />
        <div className="play-icon-overlay">
          {isPlaying ? '❚❚' : '►'}
        </div>
        {/* The progress bar appears on hover */}
        {previewUrl && (
          <div 
            className="progress-bar-container" 
            ref={progressContainerRef}
            onClick={handleProgressClick}
          >
            <div className="progress-bar" style={{ width: `${progress}%` }} />
          </div>
        )}
        {/* <Play className="statsIcon" /> */}
        <span className='icon'>U</span>
        {/* 
          <audio controls>
            <source src="" type="audio/mp3" className="audio" />
            Your browser does not support the audio element..
          </audio> 
        */}
      </div>
      <div className="info-track">
        <span className="date">{date}</span>
        <h3>{name}</h3>
        <p className="track-description">{description}</p>
        <div className="tags">
          <span className="tag">
            <strong>Tags: </strong>
          </span>
          <span className="tag">Deep Wave,</span>
          <span className="tag"> Open Sea, </span>
          <span className="tag"> Continuous Flow, </span>
          <span className="tag"> Distant Rumble, </span>
          <span className="tag"> Slow Cresting</span>
        </div>
        <div className="stats">
          <span className="stat">
            {/* <Eye className="statsIcon" /> 250 */}
            <span className='icon'>U</span> 250
          </span>
          <span className="stat">
            {/* <Download className="statsIcon" /> 53 */}
            <span className='icon'>U</span> 53
          </span>
          <span className="stat">
            {/* <Share2 className="statsIcon" /> 112 */}
            <span className='icon'>U</span> 112

          </span>
        </div>
      </div>
      {/* Hidden audio element; play/pause is controlled via image click */}
      {previewUrl && (
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
