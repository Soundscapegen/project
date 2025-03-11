import React, { useState, useRef, useEffect, ChangeEvent } from 'react';
import './MasterChannel.css';

// interface MasterProps {
//   audioSrc: string;
// }

const MasterChannel = () => {
  const [volume, setVolume] = useState<number>(50);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const getDecibels = (value: number): string => {
    const minDb = 60;
    const maxDb = 100;
    const dbValue = (value / 100) * (maxDb - minDb) + minDb;
    return `${dbValue.toFixed(1)} dB`;
  };

  const handleChangeVolume = (e: ChangeEvent<HTMLInputElement>) => {
    setVolume(Number(e.target.value));
  };

  const handleMute = () => {
    setIsMuted((prev) => !prev);
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted]);

  return (
    <div className="mixer-channel-container">
      <div className="mixer-btn">
        <div className="display-screen master-digital">
          <p>{isMuted ? '0 dB' : getDecibels(volume)}</p>
        </div>

        <div className="knob-container">
          <div className="track-knob"></div>
          <div className="knob"></div>
        </div>

        <div className="buttons-container">
          <div className="mute button master-mute">
            <div className="btn master-btn" onClick={handleMute}>
              <button className={`mute ${isMuted ? 'active' : ''}`}>
                MUTE ALL
              </button>
            </div>
          </div>
        </div>

      </div>

      <div className="mixer-controls">
        <div className="volume-meter-container">
          {isMuted ? (
            <div className="led-indicator red"></div>
          ) : (
            <div className="led-indicator"></div>
          )}

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
              className="control-volume master-control"
            />
            <audio ref={audioRef} src="" />
          </div>
        </div>

      </div>

      <div className="channel-label master-label">
        <p className="label">Master</p>
      </div>
    </div>
  );
};

export default MasterChannel;
