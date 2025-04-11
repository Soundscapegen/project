
import './About.css';

const About = () => {
  return (
    <div className="about-container">
      <h2>About Us</h2>
      <div className="about-information">
        <div className="logo-container">
          <img src="/logo.png" alt="logo" />
          <h3>SoundscapeGen</h3>
        </div>
        <div className='about-description'>
          <p>
            This is a senior project about a web application that allows users to
            create custom soundscapes by entering descriptive phrases.
          </p>
        </div>
      </div>

      <div className="team-members">
        <h5>Members</h5>
        <ul>
          <li>Brandon Wilner</li>
          <li>Tyler Jaramillo-Pritchard</li>
          <li>Rosey Angina</li>
          <li> Tue Tran</li>
        </ul>
      </div>

      <div className="contact">
        <h5>Contact Us</h5>
        <p>
          For questions, support, or feedback, reach us at <a href="">link</a>
        </p>
      </div>
    </div>
  );
};

export default About;
