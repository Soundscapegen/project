import './TrackCard.css';

// import { Eye, Download, Share2, Play } from "lucide-react";

const TrackCard = () => {
  return (
    <div className="track-card">
      <div className="track-control">
        <img src="/spaceshipFlying.jpg" alt="beach wave" />
        <svg id="Triangle-Right-Solid--Streamline-Carbon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" height="20" width="20">
          <desc>Triangle Right Solid Streamline Icon: https://streamlinehq.com</desc>
          <defs></defs>
          <path d="M3 2.9806c0-.5692.4772-.979 1-.9806.1628-.0005.3299.0388.4885.1249l23.9867 13.0196c.3435.1865.5248.521.5248.8555s-.1812.6694-.5248.8559L4.4885 29.8754c-.1586.0861-.3257.1251-.4885.1246-.5228-.0016-1-.4111-1-.9803V2.9806Z" stroke-width="0" fill="#f4671f"></path>
          <path id="_Transparent_Rectangle_" transform="rotate(90 16 16)" d="M0 0h32v32H0Z" stroke-width="0" fill="none"></path>
        </svg>
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
            <svg className="statsIcon" id="View--Streamline-Carbon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 19 19" height="19" width="19">
              <desc>View Streamline Icon: https://streamlinehq.com</desc>
              <defs></defs>
              <title>view</title>
              <path d="M18.370625 9.298125A9.9096875 9.9096875 0 0 0 9.5 2.96875 9.9096875 9.9096875 0 0 0 0.629375 9.298125a0.59375 0.59375 0 0 0 0 0.40375000000000005A9.9096875 9.9096875 0 0 0 9.5 16.03125a9.9096875 9.9096875 0 0 0 8.870625 -6.329375 0.59375 0.59375 0 0 0 0 -0.40375000000000005ZM9.5 14.84375c-3.146875 0 -6.471875 -2.3334375 -7.6771875 -5.34375C3.0281249999999997 6.4896875 6.3531249999999995 4.15625 9.5 4.15625s6.471875 2.3334375 7.6771875 5.34375C15.971874999999999 12.5103125 12.646875 14.84375 9.5 14.84375Z" fill="#f4671f" stroke-width="0.5938"></path><path d="M9.5 5.9375a3.5625 3.5625 0 1 0 3.5625 3.5625 3.5625 3.5625 0 0 0 -3.5625 -3.5625Zm0 5.9375a2.375 2.375 0 1 1 2.375 -2.375 2.375 2.375 0 0 1 -2.375 2.375Z" fill="#f4671f" stroke-width="0.5938"></path><path id="_Transparent_Rectangle_" d="M0 0h19v19H0Z" fill="none" stroke-width="0.5938"></path>
            </svg> 250
          </span>
          <span className="stat">
            <svg className="statsIcon" id="Download--Streamline-Carbon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 19 19" height="19" width="19">
              <desc>Download Streamline Icon: https://streamlinehq.com</desc>
              <defs></defs>
              <path d="M15.4375 14.25v2.375H3.5625v-2.375H2.375v2.375a1.1875 1.1875 0 0 0 1.1875 1.1875h11.875a1.1875 1.1875 0 0 0 1.1875 -1.1875v-2.375Z" fill="#f4671f" stroke-width="0.5938"></path><path d="m15.4375 8.3125 -0.8371875 -0.8371875L10.09375 11.9759375 10.09375 1.1875l-1.1875 0 0 10.7884375 -4.5065625 -4.500625L3.5625 8.3125l5.9375 5.9375 5.9375 -5.9375z" fill="#f4671f" stroke-width="0.5938"></path><g id="_Transparent_Rectangle_"><path d="M0 0h19v19H0Z" fill="none" stroke-width="0.5938"></path></g>
            </svg> 53
          </span>
          <span className="stat">
            {/* <Share2 className="statsIcon" /> 112 */}
            <svg className="statsIcon" id="Share--Streamline-Carbon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" height="19" width="19">
              <desc>Share Streamline Icon: https://streamlinehq.com</desc>
              <defs></defs>
              <title>share</title>
              <path d="M23 20a5 5 0 0 0-3.89 1.89l-7.31-4.57a4.46 4.46 0 0 0 0-2.64l7.31-4.57A5 5 0 1 0 18 7a4.79 4.79 0 0 0 .2 1.32l-7.31 4.57a5 5 0 1 0 0 6.22l7.31 4.57A4.79 4.79 0 0 0 18 25a5 5 0 1 0 5-5Zm0-16a3 3 0 1 1-3 3 3 3 0 0 1 3-3ZM7 19a3 3 0 1 1 3-3 3 3 0 0 1-3 3Zm16 9a3 3 0 1 1 3-3 3 3 0 0 1-3 3Z" fill="#f4671f"></path><path id="_Transparent_Rectangle_" transform="rotate(-90 16 16)" d="M0 0h32v32H0Z" fill="none"></path>
            </svg> 112

          </span>
        </div>
      </div>
    </div>
  );
};

export default TrackCard;
