"use client";

import Image from "next/image";
import Link from "next/link";

import React, {
    useState,
    useEffect,
    useRef,
    MouseEvent as ReactMouseEvent,
  } from 'react';
  import './Navbar.css';
  import Login from '../Login/Login';
  import Signup from '../Signup/Signup';
  
  
  interface NavbarProps {
    user: boolean;
    setUser: React.Dispatch<React.SetStateAction<boolean>>;
  }
  
  // Possible screen types for controlling the overlay
  type ScreenType = 'login' | 'signup' | null;
  
  const Navbar: React.FC<NavbarProps> = ({ user, setUser }) => {
    const [screen, setScreen] = useState<ScreenType>(null);
    const [dropdown, setDropdown] = useState<boolean>(false);
  
    // Use a ref to detect clicks outside of the dropdown
    const dropdownRef = useRef<HTMLDivElement>(null);
  
    const closeScreen = () => setScreen(null);
  
    const handleLogout = () => {
      setUser(false);
      setDropdown(false);
    };

    const scrollToSection = (sectionId) => {
      const section = document.getElementById(sectionId);
      if (section) {
        section.scrollIntoView({ behavior: "smooth" });
      }
    };
  
    useEffect(() => {
      // Generic Event is enough since we’re attaching to document
      function handleClickOutside(event: Event) {
        // Type cast event.target so that .contains(...) is recognized
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node)
        ) {
          setDropdown(false);
        }
      }
  
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
  
    return (
      <>
        <header className={screen ? 'blurred' : ''}>
          <Image src="/logo.png" alt="logo" width={144} height={30} />
  
          <nav className="navLinks">
            <ul>
              <li> {/* home page is both / and /home */}
                <Link href="/" className="nav-btn">Home</Link>
              </li>
              <li>
                <button onClick={() => scrollToSection("popular")} className="nav-btn">
                  Popular
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection("about")} className="nav-btn">
                  About Us
                </button>
              </li>
            </ul>
          </nav>
  
          {user ? (
            <div
              className="user-info"
              ref={dropdownRef}
              onClick={() => setDropdown(!dropdown)}
            >
              <span className="username">Alex Sandara</span>
              {dropdown && (
                <div className="dropdown-menu">
                  <p className="username">Profile</p>
                  <button className="logout-btn" onClick={handleLogout}>
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <nav className="profile">
              <ul>
                <li className="login" onClick={() => setScreen('login')}>
                  Log in
                </li>
                <li>
                  <div className="dash"></div>
                </li>
                <li className="signup" onClick={() => setScreen('signup')}>
                  <div className="register">Register</div>
                </li>
              </ul>
            </nav>
          )}
        </header>
  
        {/* Screen for Login/Signup overlay */}
        {screen && (
          <div className="screenOverlay" onClick={closeScreen}>
            <div
              className="content"
              onClick={(e: ReactMouseEvent<HTMLDivElement>) => e.stopPropagation()}
            >
              {screen === 'login' ? (
                <Login setUser={setUser} />
              ) : (
                <Signup setUser={setUser} />
              )}
              <button className="xClose" onClick={closeScreen}>
                ×
              </button>
            </div>
          </div>
        )}
      </>
    );
  };
  
  export default Navbar;
  