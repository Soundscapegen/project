import React from 'react';
import './Signup.css';

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
          <svg className="icon" id="User--Streamline-Carbon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" height="24" width="24"><desc>User Streamline Icon: https://streamlinehq.com</desc><defs></defs><title>user</title><path d="M12 3a3.75 3.75 0 1 1 -3.75 3.75 3.75 3.75 0 0 1 3.75 -3.75m0 -1.5a5.25 5.25 0 1 0 5.25 5.25 5.25 5.25 0 0 0 -5.25 -5.25Z" fill="#000000" stroke-width="0.75"></path><path d="M19.5 22.5h-1.5v-3.75a3.75 3.75 0 0 0 -3.75 -3.75h-4.5a3.75 3.75 0 0 0 -3.75 3.75v3.75H4.5v-3.75a5.25 5.25 0 0 1 5.25 -5.25h4.5a5.25 5.25 0 0 1 5.25 5.25Z" fill="#000000" stroke-width="0.75"></path><path id="_Transparent_Rectangle_" d="M0 0h24v24H0Z" fill="none" stroke-width="0.75"></path></svg>
          <input type="text" className="username" placeholder="Username" />
        </div>

        <div className="input">
          <svg className='icon' id="Email--Streamline-Carbon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" height="24" width="24"><desc>Email Streamline Icon: https://streamlinehq.com</desc><defs></defs><title>email</title><path d="M21 4.5H3a1.5 1.5 0 0 0 -1.5 1.5v12a1.5 1.5 0 0 0 1.5 1.5h18a1.5 1.5 0 0 0 1.5 -1.5V6a1.5 1.5 0 0 0 -1.5 -1.5Zm-1.6500000000000001 1.5L12 11.084999999999999 4.65 6ZM3 18V6.6825l8.5725 5.9325a0.75 0.75 0 0 0 0.855 0L21 6.6825V18Z" fill="#000000" stroke-width="0.75"></path><path id="_Transparent_Rectangle_" d="M0 0h24v24H0Z" fill="none" stroke-width="0.75"></path></svg>
          <input type="email" className="email" placeholder="Email" />
        </div>

        <div className="input">
          <svg className="icon" id="Locked--Streamline-Carbon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" height="24" width="24"><desc>Locked Streamline Icon: https://streamlinehq.com</desc><defs></defs><title>locked</title><path d="M18 10.5h-1.5V6a4.5 4.5 0 0 0 -9 0v4.5H6a1.5 1.5 0 0 0 -1.5 1.5v9a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5 -1.5V12a1.5 1.5 0 0 0 -1.5 -1.5ZM9 6a3 3 0 0 1 6 0v4.5h-6Zm9 15H6V12h12Z" fill="#000000" stroke-width="0.75"></path><path id="_Transparent_Rectangle_" d="M0 0h24v24H0Z" fill="none" stroke-width="0.75"></path></svg>
          <input type="password" placeholder="Password" />
        </div>

        <div className="input">
          <svg className="icon" id="Locked--Streamline-Carbon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" height="24" width="24"><desc>Locked Streamline Icon: https://streamlinehq.com</desc><defs></defs><title>locked</title><path d="M18 10.5h-1.5V6a4.5 4.5 0 0 0 -9 0v4.5H6a1.5 1.5 0 0 0 -1.5 1.5v9a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5 -1.5V12a1.5 1.5 0 0 0 -1.5 -1.5ZM9 6a3 3 0 0 1 6 0v4.5h-6Zm9 15H6V12h12Z" fill="#000000" stroke-width="0.75"></path><path id="_Transparent_Rectangle_" d="M0 0h24v24H0Z" fill="none" stroke-width="0.75"></path></svg>
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
        <svg  xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="50" height="50" viewBox="0 0 48 48">
          <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
        </svg>
      </div>
    </div>
  );
};

export default Signup;
