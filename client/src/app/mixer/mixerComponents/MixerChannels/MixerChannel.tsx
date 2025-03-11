import React, { useState, useRef, useEffect } from 'react';
import "./MixerChannel.css";

type MixerChannelProps = {
  audioSrc: string;
  label: string;
};

const MixerChannel: React.FC<MixerChannelProps> = ({ audioSrc, label }) => {
  const [volume, setVolume] = useState<number>(50);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isRandom, setIsRandom] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePlay = () => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const playSound = () => {
    isPlaying ? handlePause() : handlePlay();
  };

  const getDecibels = (value: number): string => {
    const minDb = 60;
    const maxDb = 100;
    const dbValue = ((value / 100) * (maxDb - minDb)) + minDb;
    return `${dbValue.toFixed(1)} dB`;
  };

  const handleChangeVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(Number(e.target.value));
  };

  const handleMute = () => {
    setIsMuted((prev) => !prev);
  };

  const handleRandom = () => {
    setIsRandom((prev) => !prev);
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted]);

  return (
    <div className='mixer-channel-container'>

      <div className="mixer-btn">
        <div className="display-screen">
          <p>{isMuted ? "0 dB" : getDecibels(volume)}</p>
        </div>

        <div className="knob-container">
          <div className="track-knob"></div>
          <div className="knob" onClick={playSound}>
            {isPlaying ?
                    <svg id="Play-Filled-Alt--Streamline-Carbon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" height="14" width="14">
                        <desc>Play Filled Alt Streamline Icon: https://streamlinehq.com</desc>
                        <defs></defs>
                        <path d="M3.5 14a0.5 0.5 0 0 1 -0.5 -0.5V2.5a0.5 0.5 0 0 1 0.74095 -0.43815l10 5.5a0.5 0.5 0 0 1 0 0.87625l-10 5.5A0.50025 0.50025 0 0 1 3.5 14Z" fill="#adadad" stroke-width="0.5"></path>
                        <path id="_Transparent_Rectangle_" d="M0 0h16v16H0Z" fill="none" stroke-width="0.5"></path>
                    </svg>
                    :
                    <svg id="Pause-Filled--Streamline-Carbon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" height="14" width="14">
                        <desc>Pause Filled Streamline Icon: https://streamlinehq.com</desc>
                        <defs></defs>
                        <title>pause--filled</title>
                        <path d="M4.5 2.25h-0.75a0.75 0.75 0 0 0 -0.75 0.75v6a0.75 0.75 0 0 0 0.75 0.75h0.75a0.75 0.75 0 0 0 0.75 -0.75V3a0.75 0.75 0 0 0 -0.75 -0.75Z" fill="#adadad" stroke-width="0.375"></path><path d="M8.25 2.25h-0.75a0.75 0.75 0 0 0 -0.75 0.75v6a0.75 0.75 0 0 0 0.75 0.75h0.75a0.75 0.75 0 0 0 0.75 -0.75V3a0.75 0.75 0 0 0 -0.75 -0.75Z" fill="#adadad" stroke-width="0.375"></path>
                        <path id="_Transparent_Rectangle_" d="M0 0h12v12H0Z" fill="none" stroke-width="0.375"></path>
                    </svg>
            }
          </div>
        </div>

        <div className="buttons-container">
          <div className="mute button">
            <div className='btn' onClick={handleMute}>
              <button className={`mute ${isMuted ? 'active' : ''}`}>MUTE</button>
            </div>
          </div>

          <div className="random button">
            <div className='btn' onClick={handleRandom}>
              <button className={`mute ${isRandom ? 'active' : ''}`}>Random</button>
            </div>
          </div>
        </div>

      </div>

      <div className="mixer-controls">

        <div className='volume-meter-container'>
          {isMuted ? <div className="led-indicator red"></div> : <div className="led-indicator"></div>}
          <div className="volume-meter">
            <div className="meter-fill" style={{ height: `${isMuted ? 0 : volume}%` }}></div>
          </div>
        </div>

        <div className="volume-container">
          <div className="control-container">
            <input
              type="range"
              min={1}
              max={100}
              value={isMuted ? 0 : volume}
              onChange={handleChangeVolume}
              className='control-volume'
            />
            <audio ref={audioRef} src={audioSrc} />
          </div>
        </div>

      </div>

      <div className="channel-label">
        <p className='label'>{label}</p>
      </div>
    </div>
  );
};

export default MixerChannel;