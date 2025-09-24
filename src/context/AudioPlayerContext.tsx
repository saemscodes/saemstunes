import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useMediaState } from '@/components/idle-state/mediaStateContext';

interface AudioTrack {
  id: string | number;
  src: string;
  name: string;
  artist?: string;
  artwork?: string;
  album?: string;
  duration?: number;
}

interface AudioPlayerState {
  currentTrack: AudioTrack | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  lastPlayedTime: number;
  lastPlayedTimestamp: number | null;
  playlist: AudioTrack[];
  currentIndex: number;
  shuffle: boolean;
  repeat: 'off' | 'all' | 'one';
  currentPlaylistId?: string | null;
}

interface AudioPlayerContextType {
  state: AudioPlayerState;
  playTrack: (track: AudioTrack, startTime?: number) => void;
  pauseTrack: () => void;
  resumeTrack: () => void;
  stopTrack: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  clearPlayer: () => void;
  playNext: () => void;
  playPrevious: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  setPlaylist: (playlist: AudioTrack[], playlistId?: string) => void;
  setCurrentIndex: (index: number) => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

const MEMORY_DURATION = 5 * 60 * 1000;

export const AudioPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { setMediaPlaying } = useMediaState();
  const [state, setState] = useState<AudioPlayerState>({
    currentTrack: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.8,
    isMuted: false,
    lastPlayedTime: 0,
    lastPlayedTimestamp: null,
    playlist: [],
    currentIndex: -1,
    shuffle: false,
    repeat: 'off',
    currentPlaylistId: null
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const memoryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const shuffleHistoryRef = useRef<number[]>([]);

  useEffect(() => {
    const savedState = localStorage.getItem('audioPlayerState');
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        const now = Date.now();
        
        if (parsedState.lastPlayedTimestamp && (now - parsedState.lastPlayedTimestamp) > MEMORY_DURATION) {
          localStorage.removeItem('audioPlayerState');
          return;
        }
        
        setState(prevState => ({
          ...prevState,
          ...parsedState,
          isPlaying: false,
        }));
      } catch (error) {
        localStorage.removeItem('audioPlayerState');
      }
    }
  }, []);

  useEffect(() => {
    if (state.currentTrack) {
      const stateToSave = {
        ...state,
        lastPlayedTimestamp: Date.now(),
      };
      localStorage.setItem('audioPlayerState', JSON.stringify(stateToSave));
    }
  }, [state]);

  useEffect(() => {
    if (memoryTimeoutRef.current) {
      clearTimeout(memoryTimeoutRef.current);
    }

    if (!state.isPlaying && state.currentTrack) {
      memoryTimeoutRef.current = setTimeout(() => {
        clearPlayer();
      }, MEMORY_DURATION);
    }

    return () => {
      if (memoryTimeoutRef.current) {
        clearTimeout(memoryTimeoutRef.current);
      }
    };
  }, [state.isPlaying, state.currentTrack]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (audioRef.current) {
        setState(prev => ({
          ...prev,
          lastPlayedTime: audioRef.current?.currentTime || 0,
          lastPlayedTimestamp: Date.now(),
        }));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const initializeAudio = (track: AudioTrack) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.remove();
    }

    const audio = new Audio(track.src);
    audioRef.current = audio;

    audio.addEventListener('loadedmetadata', () => {
      setState(prevState => ({
        ...prevState,
        duration: audio.duration,
      }));
    });

    audio.addEventListener('timeupdate', () => {
      setState(prevState => ({
        ...prevState,
        currentTime: audio.currentTime,
        lastPlayedTime: audio.currentTime,
      }));
    });

    audio.addEventListener('ended', handleTrackEnd);

    audio.addEventListener('error', () => {
      setMediaPlaying(false);
      setState(prevState => ({
        ...prevState,
        isPlaying: false,
      }));
    });

    audio.volume = state.isMuted ? 0 : state.volume;
  };

  const handleTrackEnd = () => {
    setMediaPlaying(false);
    
    if (state.repeat === 'one') {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(console.error);
      }
    } else if (state.playlist.length > 0 && state.currentIndex !== -1) {
      playNext();
    } else {
      setState(prev => ({
        ...prev,
        isPlaying: false,
        currentTime: 0,
        lastPlayedTime: 0,
      }));
    }
  };

  const playTrack = (track: AudioTrack, startTime: number = 0) => {
    setMediaPlaying(true);
    if (state.currentTrack?.id === track.id && audioRef.current) {
      audioRef.current.currentTime = startTime || state.lastPlayedTime;
      audioRef.current.play().catch(console.error);
      setState(prev => ({
        ...prev,
        isPlaying: true,
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      currentTrack: track,
      isPlaying: false,
      currentTime: startTime,
      lastPlayedTime: startTime,
    }));

    initializeAudio(track);
    
    if (audioRef.current) {
      audioRef.current.currentTime = startTime;
      audioRef.current.play().then(() => {
        setState(prev => ({
          ...prev,
          isPlaying: true,
        }));
      }).catch(console.error);
    }
  };

  const pauseTrack = () => {
    setMediaPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      setState(prev => ({
        ...prev,
        isPlaying: false,
        lastPlayedTime: audioRef.current?.currentTime || 0,
      }));
    }
  };

  const resumeTrack = () => {
    setMediaPlaying(true);
    if (audioRef.current) {
      audioRef.current.play().then(() => {
        setState(prev => ({
          ...prev,
          isPlaying: true,
        }));
      }).catch(console.error);
    }
  };

  const stopTrack = () => {
    setMediaPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setState(prev => ({
      ...prev,
      isPlaying: false,
      currentTime: 0,
      lastPlayedTime: 0,
    }));
  };

  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setState(prev => ({
        ...prev,
        currentTime: time,
        lastPlayedTime: time,
      }));
    }
  };

  const setVolume = (volume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
    setState(prev => ({
      ...prev,
      volume,
      isMuted: volume === 0,
    }));
  };

  const toggleMute = () => {
    const newMutedState = !state.isMuted;
    if (audioRef.current) {
      audioRef.current.volume = newMutedState ? 0 : state.volume;
    }
    setState(prev => ({
      ...prev,
      isMuted: newMutedState,
    }));
  };

  const clearPlayer = () => {
    setMediaPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.remove();
      audioRef.current = null;
    }
    setState({
      currentTrack: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      volume: 0.8,
      isMuted: false,
      lastPlayedTime: 0,
      lastPlayedTimestamp: null,
      playlist: [],
      currentIndex: -1,
      shuffle: false,
      repeat: 'off',
      currentPlaylistId: null
    });
    localStorage.removeItem('audioPlayerState');
    if (memoryTimeoutRef.current) {
      clearTimeout(memoryTimeoutRef.current);
    }
  };

  const playNext = () => {
    if (state.playlist.length === 0 || state.currentIndex === -1) return;
    
    let nextIndex;
    
    if (state.shuffle) {
      do {
        nextIndex = Math.floor(Math.random() * state.playlist.length);
      } while (nextIndex === state.currentIndex && state.playlist.length > 1);
      
      shuffleHistoryRef.current = [...shuffleHistoryRef.current, state.currentIndex];
    } else {
      nextIndex = (state.currentIndex + 1) % state.playlist.length;
    }
    
    const nextTrack = state.playlist[nextIndex];
    setState(prev => ({
      ...prev,
      currentIndex: nextIndex,
    }));
    playTrack(nextTrack);
  };

  const playPrevious = () => {
    if (state.playlist.length === 0 || state.currentIndex === -1) return;
    
    let prevIndex;
    
    if (state.shuffle && shuffleHistoryRef.current.length > 0) {
      prevIndex = shuffleHistoryRef.current.pop()!;
    } else {
      prevIndex = state.currentIndex - 1;
      if (prevIndex < 0) prevIndex = state.playlist.length - 1;
    }
    
    const prevTrack = state.playlist[prevIndex];
    setState(prev => ({
      ...prev,
      currentIndex: prevIndex,
    }));
    playTrack(prevTrack);
  };

  const toggleShuffle = () => {
    setState(prev => ({
      ...prev,
      shuffle: !prev.shuffle,
    }));
    shuffleHistoryRef.current = [];
  };

  const toggleRepeat = () => {
    setState(prev => ({
      ...prev,
      repeat: prev.repeat === 'off' ? 'all' : prev.repeat === 'all' ? 'one' : 'off',
    }));
  };

  const setPlaylist = (playlist: AudioTrack[], playlistId?: string) => {
    setState(prev => ({
      ...prev,
      playlist,
      currentPlaylistId: playlistId || null
    }));
  };

  const setCurrentIndex = (index: number) => {
    setState(prev => ({
      ...prev,
      currentIndex: index,
    }));
  };

  return (
    <AudioPlayerContext.Provider
      value={{
        state,
        playTrack,
        pauseTrack,
        resumeTrack,
        stopTrack,
        seek,
        setVolume,
        toggleMute,
        clearPlayer,
        playNext,
        playPrevious,
        toggleShuffle,
        toggleRepeat,
        setPlaylist,
        setCurrentIndex,
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
};

export const useAudioPlayer = () => {
  const context = useContext(AudioPlayerContext);
  if (context === undefined) {
    throw new Error('useAudioPlayer must be used within an AudioPlayerProvider');
  }
  return context;
};
