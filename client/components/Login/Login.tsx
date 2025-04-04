import React from 'react';
import './Login.css';

interface LoginProps {
  setUser: React.Dispatch<React.SetStateAction<boolean>>;
}

const Login: React.FC<LoginProps> = ({ setUser }) => {
  const handleGoogleLogin = () => {
    setUser(true);
  };

  return (
    <div className="container">
      <div className="header">
        <div className="text">Log In</div>
        <div className="underline"></div>
      </div>
      <div className="inputs">
        <div className="input">
          {/* <CircleUserRound className="icon" /> */}
          <span className='icon'>U</span>
          <input
            type="email"
            className="email"
            placeholder="Enter your email or username"
          />
        </div>
        <div className="input">
          {/* <Lock className="icon" /> */}
          <span className='icon'>U</span>
          <input type="password" placeholder="Enter your password" />
        </div>
      </div>
      <div className="forgotPass">
        Lost Password? <span>Click Here!</span>
      </div>
      <div className="submitContainer">
        <button className="submit signupButton">Sign Up</button>
        <button className="submit">Log in</button>
      </div>
      <div className="another">
        <div className="dash2"></div>
        <p>or log in with</p>
        <div className="dash2"></div>
      </div>
      <div className="google" onClick={handleGoogleLogin}>
        {/* <Laugh /> */}
        Google
      </div>
    </div>
  );
};

export default Login;
