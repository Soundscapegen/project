
import './About.css';

const About = () => {
  return (
    <div className="about-container">
      <h2>About Us</h2>
      <div className="logo-container">
        <img src="/logo.png" alt="logo" />
        <h3>SoundscapeGen</h3>
      </div>
      <p>
        This is a senior project about a web application that allows users to
        create custom soundscapes by entering descriptive phrases.
      </p>

      <div className="team-members">
        <h3>The Team</h3>
      </div>

      <h3>Contact Us</h3>
      <p>
        For questions, support, or feedback, reach us at <a href="">link</a>
      </p>

      <footer>
        <p>This is a footer</p>
      </footer>
    </div>
  );
};

export default About;
