import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SmartPlaylist {
  id: string;
  name: string;
  description: string;
  category: string;
  is_auto_generated: boolean;
  last_updated: string;
  track_count: number;
}

export const useSmartPlaylists = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [smartPlaylists, setSmartPlaylists] = useState<SmartPlaylist[]>([]);
  const [loading, setLoading] = useState(false);

  // Create automatic "Recently Played" playlist
  const createRecentlyPlayedPlaylist = useCallback(async () => {
    if (!user) return;

    try {
      // Check if Recently Played playlist exists
      let { data: existingPlaylist } = await supabase
        .from('playlists')
        .select('id')
        .eq('user_id', user.id)
        .eq('name', 'Recently Played')
        .single();

      let playlistId: string;

      if (!existingPlaylist) {
        // Create Recently Played playlist
        const { data: newPlaylist, error } = await supabase
          .from('playlists')
          .insert({
            name: 'Recently Played',
            description: 'Your recently played tracks (last 72 hours)',
            user_id: user.id,
            category: 'personal_playlist',
            is_public: false
          })
          .select('id')
          .single();

        if (error) throw error;
        playlistId = newPlaylist.id;
      } else {
        playlistId = existingPlaylist.id;
      }

      // Clear existing tracks
      await supabase
        .from('playlist_tracks')
        .delete()
        .eq('playlist_id', playlistId);

      // Get recently played tracks (last 72 hours)
      const threeDaysAgo = new Date();
      threeDaysAgo.setHours(threeDaysAgo.getHours() - 72);

      const { data: recentPlays } = await supabase
        .from('track_plays')
        .select('track_id, played_at')
        .eq('user_id', user.id)
        .gte('played_at', threeDaysAgo.toISOString())
        .order('played_at', { ascending: false });

      if (recentPlays?.length) {
        // Get unique tracks (most recent first)
        const uniqueTrackIds = Array.from(new Set(recentPlays.map(play => play.track_id)));
        
        // Add tracks to playlist
        const playlistTracks = uniqueTrackIds.slice(0, 50).map((trackId, index) => ({
          playlist_id: playlistId,
          track_id: trackId,
          position: index + 1
        }));

        await supabase
          .from('playlist_tracks')
          .insert(playlistTracks);
      }

    } catch (error) {
      console.error('Error creating Recently Played playlist:', error);
    }
  }, [user]);

  // Create automatic "Most Played This Week" playlist
  const createWeeklyTopPlaylist = useCallback(async () => {
    if (!user) return;

    try {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      // Check if weekly playlist exists
      let { data: existingPlaylist } = await supabase
        .from('playlists')
        .select('id')
        .eq('user_id', user.id)
        .eq('name', 'Weekly Top Tracks')
        .single();

      let playlistId: string;

      if (!existingPlaylist) {
        const { data: newPlaylist, error } = await supabase
          .from('playlists')
          .insert({
            name: 'Weekly Top Tracks',
            description: 'Your most played tracks this week',
            user_id: user.id,
            category: 'personal_playlist',
            is_public: false
          })
          .select('id')
          .single();

        if (error) throw error;
        playlistId = newPlaylist.id;
      } else {
        playlistId = existingPlaylist.id;
      }

      // Clear existing tracks
      await supabase
        .from('playlist_tracks')
        .delete()
        .eq('playlist_id', playlistId);

      // Get most played tracks this week
      const { data: weeklyPlays } = await supabase
        .from('track_plays')
        .select('track_id')
        .eq('user_id', user.id)
        .gte('played_at', weekAgo.toISOString());

      if (weeklyPlays?.length) {
        // Count plays per track
        const trackCounts = new Map<string, number>();
        weeklyPlays.forEach(play => {
          trackCounts.set(play.track_id, (trackCounts.get(play.track_id) || 0) + 1);
        });

        // Sort by play count and take top 25
        const topTracks = Array.from(trackCounts.entries())
          .sort(([,a], [,b]) => b - a)
          .slice(0, 25);

        // Add to playlist
        const playlistTracks = topTracks.map(([trackId], index) => ({
          playlist_id: playlistId,
          track_id: trackId,
          position: index + 1
        }));

        await supabase
          .from('playlist_tracks')
          .insert(playlistTracks);
      }

    } catch (error) {
      console.error('Error creating Weekly Top playlist:', error);
    }
  }, [user]);

  // Create discovery playlist based on listening patterns
  const createDiscoveryPlaylist = useCallback(async () => {
    if (!user) return;

    try {
      // Check if discovery playlist exists
      let { data: existingPlaylist } = await supabase
        .from('playlists')
        .select('id')
        .eq('user_id', user.id)
        .eq('name', 'Discover Weekly')
        .single();

      let playlistId: string;

      if (!existingPlaylist) {
        const { data: newPlaylist, error } = await supabase
          .from('playlists')
          .insert({
            name: 'Discover Weekly',
            description: 'New tracks based on your listening habits',
            user_id: user.id,
            category: 'personal_playlist',
            is_public: false
          })
          .select('id')
          .single();

        if (error) throw error;
        playlistId = newPlaylist.id;
      } else {
        playlistId = existingPlaylist.id;
      }

      // Clear existing tracks
      await supabase
        .from('playlist_tracks')
        .delete()
        .eq('playlist_id', playlistId);

      // Get user's top artists from last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: recentPlays } = await supabase
        .from('track_plays')
        .select(`
          track_id,
          tracks:track_id (artist)
        `)
        .eq('user_id', user.id)
        .gte('played_at', thirtyDaysAgo.toISOString());

      if (recentPlays?.length) {
        // Get top artists
        const artistCounts = new Map<string, number>();
        recentPlays.forEach(play => {
          const artist = play.tracks?.artist;
          if (artist) {
            artistCounts.set(artist, (artistCounts.get(artist) || 0) + 1);
          }
        });

        const topArtists = Array.from(artistCounts.entries())
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([artist]) => artist);

        // Get user's played track IDs
        const playedTrackIds = new Set(recentPlays.map(play => play.track_id));

        // Find new tracks from top artists
        const { data: discoveryTracks } = await supabase
          .from('tracks')
          .select('id')
          .in('artist', topArtists)
          .eq('approved', true)
          .not('id', 'in', `(${Array.from(playedTrackIds).join(',')})`)
          .limit(30);

        if (discoveryTracks?.length) {
          // Shuffle and add to playlist
          const shuffled = discoveryTracks.sort(() => 0.5 - Math.random());
          const playlistTracks = shuffled.slice(0, 20).map((track, index) => ({
            playlist_id: playlistId,
            track_id: track.id,
            position: index + 1
          }));

          await supabase
            .from('playlist_tracks')
            .insert(playlistTracks);
        }
      }

    } catch (error) {
      console.error('Error creating Discovery playlist:', error);
    }
  }, [user]);

  // Refresh all smart playlists
  const refreshAllSmartPlaylists = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      await Promise.all([
        createRecentlyPlayedPlaylist(),
        createWeeklyTopPlaylist(),
        createDiscoveryPlaylist()
      ]);

      toast({
        title: "Smart Playlists Updated",
        description: "Your automated playlists have been refreshed",
      });
    } catch (error) {
      console.error('Error refreshing smart playlists:', error);
      toast({
        title: "Error",
        description: "Failed to update smart playlists",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, createRecentlyPlayedPlaylist, createWeeklyTopPlaylist, createDiscoveryPlaylist, toast]);

  // Get all smart playlists
  const fetchSmartPlaylists = useCallback(async () => {
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
          playlist_tracks(count)
        `)
        .eq('user_id', user.id)
        .in('name', ['Recently Played', 'Weekly Top Tracks', 'Discover Weekly', 'Favorites']);

      if (error) throw error;

      const smartPlaylistData = data?.map(playlist => ({
        id: playlist.id,
        name: playlist.name,
        description: playlist.description || '',
        category: playlist.category || 'personal_playlist',
        is_auto_generated: true,
        last_updated: playlist.updated_at || new Date().toISOString(),
        track_count: Array.isArray(playlist.playlist_tracks) ? playlist.playlist_tracks.length : 0
      })) || [];

      setSmartPlaylists(smartPlaylistData);
    } catch (error) {
      console.error('Error fetching smart playlists:', error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchSmartPlaylists();
    }
  }, [user, fetchSmartPlaylists]);

  return {
    smartPlaylists,
    loading,
    refreshAllSmartPlaylists,
    createRecentlyPlayedPlaylist,
    createWeeklyTopPlaylist,
    createDiscoveryPlaylist,
    fetchSmartPlaylists
  };
};