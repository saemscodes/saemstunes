import { supabase } from '@/integrations/supabase/client';
import { AudioTrack } from '@/types/music';

// Fetch playlists for the current user
export const fetchUserPlaylists = async (userId: string) => {
  const { data, error } = await supabase
    .from('playlists')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

// Create a new playlist
export const createPlaylist = async (
  userId: string,
  name: string,
  description: string = '',
  isPublic: boolean = false
) => {
  const { data, error } = await supabase
    .from('playlists')
    .insert({
      user_id: userId,
      name,
      description,
      is_public: isPublic
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Add track to playlist
export const addTrackToPlaylist = async (playlistId: string, trackId: string) => {
  // Get current max position in playlist
  const { data: maxPosData, error: posError } = await supabase
    .from('playlist_tracks')
    .select('position')
    .eq('playlist_id', playlistId)
    .order('position', { ascending: false })
    .limit(1);
  
  const nextPosition = maxPosData?.length ? maxPosData[0].position + 1 : 0;
  
  const { data, error } = await supabase
    .from('playlist_tracks')
    .insert({
      playlist_id: playlistId,
      track_id: trackId,
      position: nextPosition
    });

  if (error) throw error;
  return data;
};

// Fetch tracks for a playlist
export const fetchPlaylistTracks = async (playlistId: string): Promise<AudioTrack[]> => {
  const { data, error } = await supabase
    .from('playlist_tracks')
    .select(`
      id,
      position,
      tracks: track_id (
        id,
        title,
        artist,
        audio_path,
        cover_path,
        duration,
        slug
      )
    `)
    .eq('playlist_id', playlistId)
    .order('position', { ascending: true });

  if (error) throw error;
  
  return data.map(item => ({
    id: item.tracks.id,
    name: item.tracks.title,
    artist: item.tracks.artist || 'Unknown Artist',
    src: getAudioUrl(item.tracks),
    artwork: getStorageUrl(item.tracks.cover_path) || '/placeholder.svg',
    duration: item.tracks.duration || 0,
    slug: item.tracks.slug || ''
  }));
};

// Get audio URL for track
export const getAudioUrl = (track: any) => {
  if (!track) return '';
  if (track.audio_path?.startsWith('http')) return track.audio_path;
  return track.audio_path 
    ? supabase.storage.from('tracks').getPublicUrl(track.audio_path).data.publicUrl 
    : track.alternate_audio_path || '';
};

// Get storage URL for file
export const getStorageUrl = (path: string | null) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return supabase.storage.from('tracks').getPublicUrl(path).data.publicUrl;
};
