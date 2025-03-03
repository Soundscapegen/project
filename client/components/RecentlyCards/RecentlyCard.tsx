
import './RecentlyCard.css';

const RecentlyCard = () => {
  return (
    <div className="sound-card">
      <img src="/pexels-pixabay-355328.jpg" alt="Spaceship flying" />
      <div className="info-container">
        <div className="sound-info">
          <span className="date">Feb 31</span>
          <h3>The Sound of spaceship flying</h3>
          <p>
            The spaceship produces a deep, vibrating hum with rhythmic pulses,
            occasional whooshing bursts of propulsion, and faint electronic
            beeps echoing...
          </p>
        </div>
        <div className="audio-control">
          <audio controls>
            <source src="" type="audio/mp3" />
            Your browser does not support the audio element..
          </audio>
          {/* <span className="duration">30 min</span> */}
        </div>
      </div>
    </div>
  );
};

export default RecentlyCard;
