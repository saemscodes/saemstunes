// src/context/AudioPlayerContext.tsx
import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { usePlaylist } from './PlaylistContext';

interface AudioPlayerContextType {
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isPlaying: boolean;
  setCurrentTime: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
  loadAudio: (src: string) => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | null>(null);

export const AudioPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const audioRef = useRef<HTMLAudioElement>(new Audio());
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const { queue, playNext, setIsPlaying: setPlaylistPlaying } = usePlaylist();

  useEffect(() => {
    const audio = audioRef.current;
    
    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      setPlaylistPlaying(false);
      if (queue.repeat === 'one') {
        audio.currentTime = 0;
        audio.play();
        setIsPlaying(true);
        setPlaylistPlaying(true);
      } else {
        playNext();
      }
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [queue.repeat, playNext, setPlaylistPlaying]);

  useEffect(() => {
    audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    audioRef.current.muted = isMuted;
  }, [isMuted]);

  const play = useCallback(() => {
    audioRef.current.play().then(() => {
      setIsPlaying(true);
      setPlaylistPlaying(true);
    }).catch(console.error);
  }, [setPlaylistPlaying]);

  const pause = useCallback(() => {
    audioRef.current.pause();
    setIsPlaying(false);
    setPlaylistPlaying(false);
  }, [setPlaylistPlaying]);

  const seek = useCallback((time: number) => {
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  }, []);

  const loadAudio = useCallback((src: string) => {
    audioRef.current.src = src;
    audioRef.current.load();
    setCurrentTime(0);
    setIsPlaying(false);
  }, []);

  const value: AudioPlayerContextType = {
    currentTime,
    duration,
    volume,
    isMuted,
    isPlaying,
    setCurrentTime: seek,
    setVolume,
    toggleMute: () => setIsMuted(!isMuted),
    play,
    pause,
    seek,
    loadAudio
  };

  return (
    <AudioPlayerContext.Provider value={value}>
      {children}
    </AudioPlayerContext.Provider>
  );
};

export const useAudioPlayer = () => {
  const context = useContext(AudioPlayerContext);
  if (!context) throw new Error('useAudioPlayer must be used within AudioPlayerProvider');
  return context;
};
