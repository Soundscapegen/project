import React from 'react';
import './Signup.css';

// import { CircleUserRound, Lock, Laugh, Mail } from "lucide-react";

interface SignupProps {
  setUser: React.Dispatch<React.SetStateAction<boolean>>;
}

// Signup component
const Signup: React.FC<SignupProps> = ({ setUser }) => {
  const handleGoogleLogin = () => {
    setUser(true);
  };

  return (
    <div className="container">
      <div className="header">
        <div className="text">Create an Account:</div>
        <div className="underline"></div>
      </div>
      
      <div className="google" onClick={handleGoogleLogin}>
        <img src="/signup.png" alt="signup-logo" />
      </div>
    </div>
  );
};

export default Signup;
