// src/context/PlaylistContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { PlayableItem, Playlist, QueueState } from '@/types/playlist';
import { fetchPlaylistItems, fetchUserPlaylists, createRecentlyPlayedPlaylist, createWeeklyTopPlaylist } from '@/lib/playlistUtils';

interface PlaylistContextType {
  currentPlaylist: Playlist | null;
  queue: QueueState;
  playlists: Playlist[];
  smartPlaylists: Playlist[];
  
  // Playlist management
  createPlaylist: (name: string, description?: string) => Promise<string>;
  addToPlaylist: (playlistId: string, itemId: string, itemType?: 'track' | 'lesson' | 'video' | 'audio') => Promise<void>;
  removeFromPlaylist: (playlistId: string, itemId: string) => Promise<void>;
  playPlaylist: (playlist: Playlist, startIndex?: number) => Promise<void>;
  
  // Queue management
  addToQueue: (item: PlayableItem) => void;
  addItemToQueue: (item: PlayableItem, playNow?: boolean) => void;
  playNext: () => void;
  playPrevious: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  setCurrentIndex: (index: number) => void;
  setIsPlaying: (playing: boolean) => void;
  clearQueue: () => void;
  removeFromQueue: (index: number) => void;
  
  // Smart playlists
  refreshSmartPlaylists: () => Promise<void>;
  refreshSmartPlaylist: (playlistName: string) => Promise<void>;
}

const PlaylistContext = createContext<PlaylistContextType | null>(null);

export const PlaylistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [currentPlaylist, setCurrentPlaylist] = useState<Playlist | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [smartPlaylists, setSmartPlaylists] = useState<Playlist[]>([]);
  const [queue, setQueue] = useState<QueueState>({
    items: [],
    currentIndex: -1,
    isPlaying: false,
    shuffle: false,
    repeat: 'none',
    playHistory: [],
    currentPlaylist: null
  });

  useEffect(() => {
    if (user) {
      fetchUserPlaylistsData();
      fetchSmartPlaylists();
    }
  }, [user]);

  const fetchUserPlaylistsData = async () => {
    if (!user) return;
    
    try {
      const userPlaylists = await fetchUserPlaylists(user.id);
      setPlaylists(userPlaylists);
    } catch (error) {
      console.error('Error fetching playlists:', error);
    }
  };

  const fetchSmartPlaylists = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('playlists')
        .select(`
          id,
          name,
          description,
          category,
          updated_at,
          playlist_items(count)
        `)
        .eq('user_id', user.id)
        .eq('is_auto_generated', true)
        .order('name', { ascending: true });

      if (error) throw error;

      const smartPlaylistData = (data || []).map(playlist => ({
        id: playlist.id,
        name: playlist.name,
        description: playlist.description || '',
        category: playlist.category || 'personal_playlist',
        is_auto_generated: true,
        updated_at: playlist.updated_at,
        item_count: Array.isArray(playlist.playlist_items) ? playlist.playlist_items.length : 0
      }));

      setSmartPlaylists(smartPlaylistData);
    } catch (error) {
      console.error('Error fetching smart playlists:', error);
    }
  };

  const refreshSmartPlaylists = async () => {
    if (!user) return;

    try {
      await Promise.all([
        createRecentlyPlayedPlaylist(user.id),
        createWeeklyTopPlaylist(user.id)
      ]);
      await fetchSmartPlaylists();
    } catch (error) {
      console.error('Error refreshing smart playlists:', error);
      throw error;
    }
  };

  const refreshSmartPlaylist = async (playlistName: string) => {
    if (!user) return;

    try {
      switch (playlistName) {
        case 'Recently Played':
          await createRecentlyPlayedPlaylist(user.id);
          break;
        case 'Weekly Top Tracks':
          await createWeeklyTopPlaylist(user.id);
          break;
        default:
          throw new Error(`Unknown smart playlist: ${playlistName}`);
      }
      await fetchSmartPlaylists();
    } catch (error) {
      console.error(`Error refreshing ${playlistName}:`, error);
      throw error;
    }
  };

  const createPlaylist = async (name: string, description: string = ''): Promise<string> => {
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('playlists')
      .insert({
        name,
        description,
        user_id: user.id,
        is_public: false,
        category: 'personal_playlist'
      })
      .select()
      .single();

    if (error) throw error;
    
    setPlaylists(prev => [data, ...prev]);
    return data.id;
  };

  const addToPlaylist = async (
    playlistId: string, 
    itemId: string, 
    itemType: 'track' | 'lesson' | 'video' | 'audio' = 'track'
  ): Promise<void> => {
    const { data: maxPosData } = await supabase
      .from('playlist_items')
      .select('position')
      .eq('playlist_id', playlistId)
      .order('position', { ascending: false })
      .limit(1);

    const nextPosition = maxPosData?.length ? maxPosData[0].position + 1 : 0;

    const { error } = await supabase
      .from('playlist_items')
      .insert({
        playlist_id: playlistId,
        item_id: itemId,
        item_type: itemType,
        position: nextPosition
      });

    if (error) throw error;

    await fetchUserPlaylistsData();
  };

  const removeFromPlaylist = async (playlistId: string, itemId: string): Promise<void> => {
    const { error } = await supabase
      .from('playlist_items')
      .delete()
      .eq('playlist_id', playlistId)
      .eq('item_id', itemId);

    if (error) throw error;
    await fetchUserPlaylistsData();
  };

  const playPlaylist = async (playlist: Playlist, startIndex: number = 0) => {
    const items = await fetchPlaylistItems(playlist.id);
    setCurrentPlaylist(playlist);
    setQueue({
      items,
      currentIndex: Math.max(0, Math.min(startIndex, items.length - 1)),
      isPlaying: true,
      shuffle: false,
      repeat: 'none',
      playHistory: [],
      currentPlaylist: playlist
    });
  };

  const addToQueue = (item: PlayableItem) => {
    setQueue(prev => ({
      ...prev,
      items: [...prev.items, item]
    }));
  };

  const addItemToQueue = (item: PlayableItem, playNow: boolean = false) => {
    setQueue(prev => {
      const newItems = playNow ? [item, ...prev.items] : [...prev.items, item];
      const newIndex = playNow ? 0 : prev.currentIndex;
      
      return {
        ...prev,
        items: newItems,
        currentIndex: newIndex,
        isPlaying: playNow ? true : prev.isPlaying
      };
    });
  };

  const playNext = () => {
    setQueue(prev => {
      if (prev.items.length === 0) return prev;

      let nextIndex = prev.currentIndex + 1;
      
      if (prev.shuffle) {
        const availableIndices = prev.items
          .map((_, index) => index)
          .filter(index => index !== prev.currentIndex && !prev.playHistory.includes(index));
        
        if (availableIndices.length > 0) {
          nextIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
        }
      }

      if (nextIndex >= prev.items.length) {
        if (prev.repeat === 'all') {
          nextIndex = 0;
        } else if (prev.repeat === 'one') {
          nextIndex = prev.currentIndex;
        } else {
          return { ...prev, isPlaying: false };
        }
      }

      return {
        ...prev,
        currentIndex: nextIndex,
        playHistory: [...prev.playHistory, prev.currentIndex],
        isPlaying: true
      };
    });
  };

  const playPrevious = () => {
    setQueue(prev => {
      if (prev.playHistory.length === 0) return prev;
      
      const previousIndex = prev.playHistory[prev.playHistory.length - 1];
      const newHistory = prev.playHistory.slice(0, -1);

      return {
        ...prev,
        currentIndex: previousIndex,
        playHistory: newHistory,
        isPlaying: true
      };
    });
  };

  const toggleShuffle = () => {
    setQueue(prev => ({ ...prev, shuffle: !prev.shuffle }));
  };

  const toggleRepeat = () => {
    setQueue(prev => ({
      ...prev,
      repeat: prev.repeat === 'none' ? 'all' : prev.repeat === 'all' ? 'one' : 'none'
    }));
  };

  const setCurrentIndex = (index: number) => {
    setQueue(prev => ({
      ...prev,
      currentIndex: Math.max(0, Math.min(index, prev.items.length - 1)),
      playHistory: [...prev.playHistory, prev.currentIndex],
      isPlaying: true
    }));
  };

  const setIsPlaying = (isPlaying: boolean) => {
    setQueue(prev => ({ ...prev, isPlaying }));
  };

  const clearQueue = () => {
    setQueue({
      items: [],
      currentIndex: -1,
      isPlaying: false,
      shuffle: false,
      repeat: 'none',
      playHistory: [],
      currentPlaylist: null
    });
    setCurrentPlaylist(null);
  };

  const removeFromQueue = (index: number) => {
    setQueue(prev => {
      const newItems = prev.items.filter((_, i) => i !== index);
      let newIndex = prev.currentIndex;
      
      if (index < prev.currentIndex) {
        newIndex = Math.max(0, prev.currentIndex - 1);
      } else if (index === prev.currentIndex) {
        newIndex = Math.min(prev.currentIndex, newItems.length - 1);
        if (newItems.length === 0) newIndex = -1;
      }

      return {
        ...prev,
        items: newItems,
        currentIndex: newIndex
      };
    });
  };

  const value: PlaylistContextType = {
    currentPlaylist,
    queue,
    playlists,
    smartPlaylists,
    createPlaylist,
    addToPlaylist,
    removeFromPlaylist,
    playPlaylist,
    addToQueue,
    addItemToQueue,
    playNext,
    playPrevious,
    toggleShuffle,
    toggleRepeat,
    setCurrentIndex,
    setIsPlaying,
    clearQueue,
    removeFromQueue,
    refreshSmartPlaylists,
    refreshSmartPlaylist
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
