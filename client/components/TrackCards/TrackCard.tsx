import './TrackCard.css';

// import { Eye, Download, Share2, Play } from "lucide-react";

const TrackCard = () => {
  return (
    <div className="track-card">
      <div className="track-control">
        <img src="/spaceshipFlying.jpg" alt="beach wave" />
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
        <span className="date">February 1st, 2025</span>
        <h3>Rolling Ocean Swells</h3>
        <p className="track-description">
          Deep, powerful waves rising and falling in the open sea, producing a soothing, continuous rumble.
        </p>
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
    </div>
  );
};

export default TrackCard;
