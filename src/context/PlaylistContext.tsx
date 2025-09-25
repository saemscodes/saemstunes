// src/context/PlaylistContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Track } from '@/types/music';

interface Playlist {
  id: string;
  name: string;
  description: string;
  cover_art_url: string;
  user_id: string;
  total_duration: number;
  track_count: number;
}

interface PlaylistTrack {
  id: string;
  playlist_id: string;
  track_id: string;
  position: number;
  added_at: string;
}

interface PlaylistState {
  currentPlaylist: Playlist | null;
  queue: Track[];
  currentIndex: number;
  shuffle: boolean;
  repeat: 'none' | 'all' | 'one';
  playHistory: number[];
  upcomingTracks: number[];
}

interface PlaylistActions {
  createPlaylist: (name: string, description?: string) => Promise<string>;
  addToPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  removeFromPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  playPlaylist: (playlistId: string, startIndex?: number) => Promise<void>;
  nextTrack: () => void;
  previousTrack: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  addToQueue: (track: Track) => void;
}

const PlaylistContext = createContext<PlaylistState & PlaylistActions | null>(null);

export const PlaylistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [state, setState] = useState<PlaylistState>({
    currentPlaylist: null,
    queue: [],
    currentIndex: -1,
    shuffle: false,
    repeat: 'none',
    playHistory: [],
    upcomingTracks: []
  });

  // Fetch playlist data
  const fetchPlaylist = useCallback(async (playlistId: string) => {
    const { data: playlistData } = await supabase
      .from('playlists')
      .select('*')
      .eq('id', playlistId)
      .single();

    const { data: tracksData } = await supabase
      .from('playlist_tracks')
      .select('track_id, position')
      .eq('playlist_id', playlistId)
      .order('position', { ascending: true });

    const trackIds = tracksData?.map(item => item.track_id) || [];
    const { data: fullTracks } = await supabase
      .from('tracks')
      .select('*')
      .in('id', trackIds);

    setState(prev => ({
      ...prev,
      currentPlaylist: playlistData ? { ...playlistData, track_count: fullTracks?.length || 0 } : null,
      queue: fullTracks || [],
      currentIndex: 0,
      playHistory: [],
      upcomingTracks: Array.from({ length: (fullTracks?.length || 1) - 1 }, (_, i) => i + 1)
    }));
  }, []);

  const createPlaylist = async (name: string, description = ''): Promise<string> => {
    try {
      const { data, error } = await supabase
        .from('playlists')
        .insert({
          name,
          description,
          user_id: user?.id,
          is_public: false
        })
        .select('id')
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error creating playlist:', error);
      throw new Error('Failed to create playlist');
    }
  };

  const addToPlaylist = async (playlistId: string, trackId: string) => {
    try {
      const { data: maxPosData } = await supabase
        .from('playlist_tracks')
        .select('position')
        .eq('playlist_id', playlistId)
        .order('position', { ascending: false })
        .limit(1);

      const nextPosition = maxPosData?.length ? maxPosData[0].position + 1 : 1;

      const { error } = await supabase
        .from('playlist_tracks')
        .insert({
          playlist_id: playlistId,
          track_id: trackId,
          position: nextPosition
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error adding to playlist:', error);
      throw new Error('Failed to add track to playlist');
    }
  };

  const removeFromPlaylist = async (playlistId: string, trackId: string) => {
    try {
      const { error } = await supabase
        .from('playlist_tracks')
        .delete()
        .eq('playlist_id', playlistId)
        .eq('track_id', trackId);

      if (error) throw error;
    } catch (error) {
      console.error('Error removing from playlist:', error);
      throw new Error('Failed to remove track from playlist');
    }
  };

  const playPlaylist = async (playlistId: string, startIndex = 0) => {
    try {
      await fetchPlaylist(playlistId);
      setState(prev => ({
        ...prev,
        currentIndex: startIndex
      }));
    } catch (error) {
      console.error('Error playing playlist:', error);
    }
  };

  const nextTrack = () => {
    setState(prev => {
      if (prev.repeat === 'one') return prev;
      
      const newHistory = [...prev.playHistory, prev.currentIndex];
      let nextIndex = prev.currentIndex + 1;
      
      if (prev.shuffle) {
        const availableIndices = Array.from({ length: prev.queue.length }, (_, i) => i)
          .filter(i => i !== prev.currentIndex && !prev.playHistory.includes(i));
        
        if (availableIndices.length > 0) {
          nextIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
        }
      }
      
      if (nextIndex >= prev.queue.length) {
        if (prev.repeat === 'all') {
          nextIndex = 0;
        } else {
          return prev;
        }
      }
      
      return {
        ...prev,
        currentIndex: nextIndex,
        playHistory: newHistory
      };
    });
  };

  const previousTrack = () => {
    setState(prev => {
      if (prev.playHistory.length === 0) return prev;
      
      const previousIndex = prev.playHistory[prev.playHistory.length - 1];
      const newHistory = prev.playHistory.slice(0, -1);
      
      return {
        ...prev,
        currentIndex: previousIndex,
        playHistory: newHistory
      };
    });
  };

  const toggleShuffle = () => {
    setState(prev => ({ ...prev, shuffle: !prev.shuffle }));
  };

  const toggleRepeat = () => {
    setState(prev => ({
      ...prev,
      repeat: prev.repeat === 'none' ? 'all' : prev.repeat === 'all' ? 'one' : 'none'
    }));
  };

  const addToQueue = (track: Track) => {
    setState(prev => ({
      ...prev,
      queue: [...prev.queue, track]
    }));
  };

  const value = {
    ...state,
    createPlaylist,
    addToPlaylist,
    removeFromPlaylist,
    playPlaylist,
    nextTrack,
    previousTrack,
    toggleShuffle,
    toggleRepeat,
    addToQueue
  };

  return (
    <PlaylistContext.Provider value={value}>
      {children}
    </PlaylistContext.Provider>
  );
};

export const usePlaylist = () => {
  const context = useContext(PlaylistContext);
  if (!context) throw new Error('usePlaylist must be used within PlaylistProvider');
  return context;
};
