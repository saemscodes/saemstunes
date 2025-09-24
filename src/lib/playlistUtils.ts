// src/lib/playlistUtils.ts
import { supabase } from '@/integrations/supabase/client';
import { Playlist, PlaylistItem, PlayableItem } from '@/types/playlist';

export const fetchUserPlaylists = async (userId: string): Promise<Playlist[]> => {
  const { data, error } = await supabase
    .from('playlists')
    .select(`
      *,
      playlist_items(count)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  return data.map(playlist => ({
    ...playlist,
    item_count: Array.isArray(playlist.playlist_items) ? playlist.playlist_items.length : 0
  }));
};

export const createPlaylist = async (
  userId: string, 
  name: string, 
  description: string = '', 
  isPublic: boolean = false
): Promise<Playlist> => {
  const { data, error } = await supabase
    .from('playlists')
    .insert({
      user_id: userId,
      name,
      description,
      is_public: isPublic,
      category: 'personal_playlist'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const addItemToPlaylist = async (
  playlistId: string, 
  itemId: string, 
  itemType: 'track' | 'lesson' | 'video' | 'audio'
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
};

export const fetchPlaylistItems = async (playlistId: string): Promise<PlayableItem[]> => {
  const { data, error } = await supabase
    .from('playlist_items')
    .select(`
      id,
      position,
      item_type,
      tracks:item_id(
        id, title, artist, audio_path, alternate_audio_path, cover_path, duration, slug, youtube_url, preview_url, video_url
      ),
      lessons:item_id(
        id, title, description, audio_path, video_path, cover_path, duration, slug
      )
    `)
    .eq('playlist_id', playlistId)
    .order('position', { ascending: true });

  if (error) throw error;

  return data.map(item => {
    if (item.item_type === 'track' && item.tracks) {
      return {
        id: item.tracks.id,
        type: 'track' as const,
        title: item.tracks.title,
        artist: item.tracks.artist || 'Unknown Artist',
        src: getAudioUrl(item.tracks),
        artwork: getStorageUrl(item.tracks.cover_path) || '/placeholder.svg',
        duration: item.tracks.duration || 0,
        slug: item.tracks.slug || '',
        metadata: {
          youtube_url: item.tracks.youtube_url,
          preview_url: item.tracks.preview_url,
          video_url: item.tracks.video_url
        }
      };
    } else if (item.item_type === 'lesson' && item.lessons) {
      return {
        id: item.lessons.id,
        type: 'lesson' as const,
        title: item.lessons.title,
        artist: 'Lesson',
        src: item.lessons.audio_path || item.lessons.video_path || '',
        artwork: getStorageUrl(item.lessons.cover_path) || '/placeholder.svg',
        duration: item.lessons.duration || 0,
        slug: item.lessons.slug || '',
        metadata: { description: item.lessons.description }
      };
    }
    return null;
  }).filter(Boolean) as PlayableItem[];
};

export const getAudioUrl = (item: any): string => {
  if (!item) return '';
  if (item.audio_path?.startsWith('http')) return item.audio_path;
  return item.audio_path ? supabase.storage.from('tracks').getPublicUrl(item.audio_path).data.publicUrl : item.alternate_audio_path || '';
};

export const getStorageUrl = (path: string | null): string => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return supabase.storage.from('tracks').getPublicUrl(path).data.publicUrl;
};

export const createRecentlyPlayedPlaylist = async (userId: string): Promise<string> => {
  let { data: existingPlaylist } = await supabase
    .from('playlists')
    .select('id')
    .eq('user_id', userId)
    .eq('name', 'Recently Played')
    .single();

  let playlistId: string;

  if (!existingPlaylist) {
    const { data: newPlaylist, error } = await supabase
      .from('playlists')
      .insert({
        name: 'Recently Played',
        description: 'Your recently played tracks (last 72 hours)',
        user_id: userId,
        category: 'personal_playlist',
        is_public: false,
        is_auto_generated: true
      })
      .select('id')
      .single();

    if (error) throw error;
    playlistId = newPlaylist.id;
  } else {
    playlistId = existingPlaylist.id;
  }

  await supabase
    .from('playlist_items')
    .delete()
    .eq('playlist_id', playlistId);

  const threeDaysAgo = new Date();
  threeDaysAgo.setHours(threeDaysAgo.getHours() - 72);

  const { data: recentPlays } = await supabase
    .from('track_plays')
    .select('track_id, played_at')
    .eq('user_id', userId)
    .gte('played_at', threeDaysAgo.toISOString())
    .order('played_at', { ascending: false });

  if (recentPlays?.length) {
    const uniqueTrackIds = Array.from(new Set(recentPlays.map(play => play.track_id)));
    
    const playlistTracks = uniqueTrackIds.slice(0, 50).map((trackId, index) => ({
      playlist_id: playlistId,
      item_id: trackId,
      item_type: 'track',
      position: index + 1
    }));

    await supabase
      .from('playlist_items')
      .insert(playlistTracks);
  }

  return playlistId;
};

export const createWeeklyTopPlaylist = async (userId: string): Promise<string> => {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  let { data: existingPlaylist } = await supabase
    .from('playlists')
    .select('id')
    .eq('user_id', userId)
    .eq('name', 'Weekly Top Tracks')
    .single();

  let playlistId: string;

  if (!existingPlaylist) {
    const { data: newPlaylist, error } = await supabase
      .from('playlists')
      .insert({
        name: 'Weekly Top Tracks',
        description: 'Your most played tracks this week',
        user_id: userId,
        category: 'personal_playlist',
        is_public: false,
        is_auto_generated: true
      })
      .select('id')
      .single();

    if (error) throw error;
    playlistId = newPlaylist.id;
  } else {
    playlistId = existingPlaylist.id;
  }

  await supabase
    .from('playlist_items')
    .delete()
    .eq('playlist_id', playlistId);

  const { data: weeklyPlays } = await supabase
    .from('track_plays')
    .select('track_id')
    .eq('user_id', userId)
    .gte('played_at', weekAgo.toISOString());

  if (weeklyPlays?.length) {
    const trackCounts = new Map<string, number>();
    weeklyPlays.forEach(play => {
      trackCounts.set(play.track_id, (trackCounts.get(play.track_id) || 0) + 1);
    });

    const topTracks = Array.from(trackCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 25);

    const playlistTracks = topTracks.map(([trackId], index) => ({
      playlist_id: playlistId,
      item_id: trackId,
      item_type: 'track',
      position: index + 1
    }));

    await supabase
      .from('playlist_items')
      .insert(playlistTracks);
  }

  return playlistId;
};
