import * as Tone from "tone";

// AudioTrack is a single audio track that can be played, stopped, and has a volume and pan
export interface AudioTrack {
    id: number;
    url: string;
    player: Tone.Player;
    panner: Tone.Panner;
    volume: Tone.Volume;
    isPlaying: boolean;
    volumeLevel: number;
    panValue: number;
    pendingStartTimer: number | null;
    isMuted: boolean;
}

// The props for the AudioMixer component
export interface AudioMixexProps {
    soundUrls: string[]; // Array of sound URLs to play
    soundIds?: number[]; // Array of sound IDs from the database
    initialVolumes?: number[]; // Initial volume settings for each track
    initialPans?: number[]; // Initial pan settings for each track
    title?: string | null; // Optional title for the mixer
    readOnly?: boolean; // Whether the mixer is in read-only mode
    trackNames?: string[]; // Array of descriptive names for each track
} 