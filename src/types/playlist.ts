// src/types/playlist.ts
export interface PlayableItem {
  id: string;
  type: 'track' | 'lesson' | 'video' | 'audio';
  title: string;
  artist?: string;
  src: string;
  artwork?: string;
  duration: number;
  slug?: string;
  metadata?: Record<string, any>;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  cover_art_url?: string;
  user_id: string;
  is_public: boolean;
  category: string;
  created_at: string;
  updated_at: string;
  item_count?: number;
  total_duration?: number;
  is_auto_generated?: boolean;
}

export interface PlaylistItem {
  id: string;
  playlist_id: string;
  item_id: string;
  item_type: 'track' | 'lesson' | 'video' | 'audio';
  position: number;
  added_at: string;
}

export interface QueueState {
  items: PlayableItem[];
  currentIndex: number;
  isPlaying: boolean;
  shuffle: boolean;
  repeat: 'none' | 'all' | 'one';
  playHistory: number[];
  currentPlaylist: Playlist | null;
}
