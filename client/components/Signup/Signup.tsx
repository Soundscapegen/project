import React from 'react';
import './Signup.css';

// import { CircleUserRound, Lock, Laugh, Mail } from "lucide-react";

interface SignupProps {
  setUser: React.Dispatch<React.SetStateAction<boolean>>;
}

const Signup: React.FC<SignupProps> = ({ setUser }) => {
  const handleGoogleLogin = () => {
    setUser(true);
  };

  return (
    <div className="container">
      <div className="header">
        <div className="text">Register</div>
        <div className="underline"></div>
      </div>
      <div className="inputs">
        <div className="input">
          {/* <CircleUserRound className="icon" /> */}
          <span className='icon'>U</span>
          <input type="text" className="email" placeholder="Username" />
        </div>
        <div className="input">
          {/* <Mail className="icon" /> */}
          <span className='icon'>U</span>
          <input type="email" className="email" placeholder="Email" />
        </div>
        <div className="input">
          {/* <Lock className="icon" /> */}
          <span className='icon'>U</span>
          <input type="password" placeholder="Password" />
        </div>
        <div className="input">
          {/* <Lock className="icon" /> */}
          <span className='icon'>U</span>
          <input type="password" placeholder="Confirm Password" />
        </div>
      </div>
      <div className="forgotPass">
        Already have an account? <span>Log In</span>
      </div>
      <div className="submitContainer">
        <button className="submit">Sign Up</button>
      </div>
      <div className="another">
        <div className="dash2"></div>
        <p>or sign up with</p>
        <div className="dash2"></div>
      </div>
      <div className="google" onClick={handleGoogleLogin}>
        {/* <Laugh /> */}
        Google
      </div>
    </div>
  );
};

export default Signup;
