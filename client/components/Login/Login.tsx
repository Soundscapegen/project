import React from 'react';
import { useRouter } from 'next/navigation';
import './Login.css';

import Image from "next/image";

interface LoginProps {
  setUser: React.Dispatch<React.SetStateAction<boolean>>;
}

const Login: React.FC<LoginProps> = ({ setUser }) => {
  const router = useRouter();

  // Handle Google login
  const handleGoogleLogin = async () => {
    try {
      // Open a popup window for Google OAuth
      const width = 500;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      const popup = window.open(
        'http://localhost:3001/api/auth/google',
        'Google Login',
        `width=${width},height=${height},left=${left},top=${top}`
      );
      
      if (!popup) {
        console.error('Popup blocked. Please allow popups for this site.');
        return;
      }

      const messageHandler = (event: MessageEvent) => {
        if (event.origin !== 'http://localhost:3001') return;
        
        if (event.data.token && event.data.user) {
          localStorage.setItem('token', event.data.token);
          localStorage.setItem('user', JSON.stringify(event.data.user));
          
          if (popup) popup.close();
          window.removeEventListener('message', messageHandler);
          window.location.reload();
        }
      };

      window.addEventListener('message', messageHandler);
    } catch (err) {
      console.error('Google login error:', err);
    }
  };

  return (
    <div className="container">
      <div className="header">
        <div className="text">Log In:</div>
        <div className="underline"></div>
      </div>
      
      
      <div className="google" onClick={handleGoogleLogin}>
        <img src="/login.png" alt="login-logo" />
      </div>
    </div>
  );
};

export default Login;
