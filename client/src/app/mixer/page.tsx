"use client";

import Navbar from "../../../components/Navbar/Navbar";
import "./mixer.css"; 

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import AudioPlayer from "./mixerComponents/AudioPlayer/AudioPlayer";
import MixerChannel from "./mixerComponents/MixerChannels/MixerChannel";
import MasterChannel from "./mixerComponents/MasterChannel/MasterChannel";

const Mixer = () => {
  const searchParams = useSearchParams(); //get url parameters
  const [sounds, setSounds] = useState<string[]>([]);
  const [user, setUser] = useState(false);
  useEffect(() => {
    const soundsQueryParam = searchParams.get("sounds"); //get sounds from the urls
    if (soundsQueryParam) {
      try {
        const parsedSounds = JSON.parse(decodeURIComponent(soundsQueryParam)); // decode and parse sound urls
        console.log("Loaded Sounds:", parsedSounds); 
        setSounds(parsedSounds.filter((sound: string) => sound)); // store sounds without null values
      } catch (err) {
        console.error("Error loading sound data:", err);
      }
    }
  }, [searchParams]);  



  return (
    <div>
      <Navbar user={user} setUser={setUser} />

      <div className='mixer-page'>

        <AudioPlayer />

        <div className="audio-mixer-container">

          <div className="header-audio-mixer">
            <div className="mixer-icon">
              <img src="/logoMixer.png" alt="logo mixer" className="logo-mixer" />
            </div>

            <div className="mix-button-container">
              <div className="mix-button">
                <p className="mix-title"> MIX </p>
              </div>
            </div>

            <div className="display-text">
              <p>Main</p>
            </div>
          </div>

          <div className="mixer-channels-container">
            {/* The function works */}
            {/* {sounds.length > 0 ? (
              sounds.map((sound, index) => (
                <MixerChannel key={index} audioSrc={sound} label={`CH ${index + 1}`} />
              ))
            ) : (
              <p>Loading sounds...</p>
            )} */}

                {/* Testing audio mixer layout */}
                <MixerChannel key="0" audioSrc="" label={`CH 1`} />
                <MixerChannel key="1" audioSrc="" label={`CH 2`} />
                <MixerChannel key="2" audioSrc="" label={`CH 3`} />
                <MixerChannel key="3" audioSrc="" label={`CH 4`} />
                <MixerChannel key="4" audioSrc="" label={`CH 5`} />
                <MixerChannel key="5" audioSrc="" label={`CH 6`} />


            <div className="mixer-master">
              <MasterChannel />
            </div>

          </div>
        </div>
      </div>
    </div>



    //   {/* <h1 className="mixer-heading">Finalize Your Mixer</h1> */}
    //   {/* <div className="mixer-container">
    //     {sounds.length > 0 ? (
    //       sounds.map((sound, index) => (
    //         <div key={index} className="sound-item">
    //           <h3>Sound {index + 1}</h3>
    //           <audio controls src={sound || ""} />
    //         </div>
    //       ))
    //     ) : (
    //       <p>Loading sounds...</p> //replzce with loading spinner react icon
    //     )}
    //   </div>
    // </div> */}
  );
};

export default Mixer;