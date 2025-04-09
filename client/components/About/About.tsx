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
        create custom soundscapes by entering descriptive phrases. We do this using the FreeSound API and a Mistral model. The application is built with React, Next.js, and Node.js.

        <br />

        We made this project because we used the soundsccapes website and it felt difficult to put together soundscapes, since you had to manually find each sound and add it and tune it manually. The aim with SoundscapeGen
        is to make it accessible and easy for anyone to type in what they want to hear and be able to listen to it immediately, and share it with others.
      </p>

      <div className="team-members">
        <h3>The Team</h3>
        <div className="team-grid">
          <div className="team-member">
            <div className="member-avatar">TJP</div>
            <h4>Tyler Jaramillo-Pritchard</h4>
          </div>
          <div className="team-member">
            <div className="member-avatar">BW</div>
            <h4>Brandon Wilner</h4>
          </div>
          <div className="team-member">
            <div className="member-avatar">RA</div>
            <h4>Rosey Angina</h4>
          </div>
          <div className="team-member">
            <div className="member-avatar">TT</div>
            <h4>True Tran</h4>
          </div>
        </div>
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
