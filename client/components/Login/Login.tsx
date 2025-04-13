import React from 'react';
import { useRouter } from 'next/navigation';
import './Login.css';

interface LoginProps {
  setUser: React.Dispatch<React.SetStateAction<boolean>>;
}

const Login: React.FC<LoginProps> = ({ setUser }) => {
  const router = useRouter();

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

      // Listen for messages from the popup
      const messageHandler = (event: MessageEvent) => {
        // Only accept messages from our server domain
        if (event.origin !== 'http://localhost:3001') return;
        
        if (event.data.token && event.data.user) {
          // Store the token and user data
          localStorage.setItem('token', event.data.token);
          localStorage.setItem('user', JSON.stringify(event.data.user));
          
          // Close the popup
          if (popup) popup.close();
          
          // Remove the event listener
          window.removeEventListener('message', messageHandler);
          
          // Force a page reload
          setTimeout(() => {
            window.location.href = window.location.href;
          }, 100);
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
