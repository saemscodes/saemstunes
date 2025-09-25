// src/hooks/useSmartPlaylists.ts
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { createRecentlyPlayedPlaylist, createWeeklyTopPlaylist } from '@/lib/playlistUtils';

interface SmartPlaylist {
  id: string;
  name: string;
  description: string;
  category: string;
  is_auto_generated: boolean;
  last_updated: string;
  track_count: number;
  user_id: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export const useSmartPlaylists = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [smartPlaylists, setSmartPlaylists] = useState<SmartPlaylist[]>([]);
  const [loading, setLoading] = useState(false);

  // Create automatic "Favorites" playlist
  const createFavoritesPlaylist = useCallback(async (): Promise<string> => {
    if (!user) throw new Error('User not authenticated');

    try {
      let { data: existingPlaylist } = await supabase
        .from('playlists')
        .select('id')
        .eq('user_id', user.id)
        .eq('name', 'Favorites')
        .single();

      let playlistId: string;

      if (!existingPlaylist) {
        const { data: newPlaylist, error } = await supabase
          .from('playlists')
          .insert({
            name: 'Favorites',
            description: 'Your favorite tracks',
            user_id: user.id,
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

      // Clear existing tracks
      await supabase
        .from('playlist_items')
        .delete()
        .eq('playlist_id', playlistId);

      // Get user's liked tracks
      const { data: userLikes } = await supabase
        .from('likes')
        .select('track_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (userLikes?.length) {
        const playlistItems = userLikes.map((like, index) => ({
          playlist_id: playlistId,
          item_id: like.track_id,
          item_type: 'track',
          position: index + 1
        }));

        await supabase
          .from('playlist_items')
          .insert(playlistItems);
      }

      return playlistId;
    } catch (error) {
      console.error('Error creating Favorites playlist:', error);
      throw error;
    }
  }, [user]);

  // Create discovery playlist based on listening patterns
  const createDiscoveryPlaylist = useCallback(async (): Promise<string> => {
    if (!user) throw new Error('User not authenticated');

    try {
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

      // Clear existing tracks
      await supabase
        .from('playlist_items')
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

        // Find new tracks from top artists that user hasn't played
        const { data: discoveryTracks } = await supabase
          .from('tracks')
          .select('id, title, artist, duration, cover_path, audio_path')
          .in('artist', topArtists)
          .eq('approved', true)
          .not('id', 'in', `(${Array.from(playedTrackIds).join(',')})`)
          .limit(30);

        if (discoveryTracks?.length) {
          // Shuffle and add to playlist
          const shuffled = [...discoveryTracks].sort(() => 0.5 - Math.random());
          const playlistItems = shuffled.slice(0, 20).map((track, index) => ({
            playlist_id: playlistId,
            item_id: track.id,
            item_type: 'track',
            position: index + 1
          }));

          await supabase
            .from('playlist_items')
            .insert(playlistItems);
        }
      }

      return playlistId;
    } catch (error) {
      console.error('Error creating Discovery playlist:', error);
      throw error;
    }
  }, [user]);

  // Create "Most Played All Time" playlist
  const createAllTimeTopPlaylist = useCallback(async (): Promise<string> => {
    if (!user) throw new Error('User not authenticated');

    try {
      let { data: existingPlaylist } = await supabase
        .from('playlists')
        .select('id')
        .eq('user_id', user.id)
        .eq('name', 'All Time Top Tracks')
        .single();

      let playlistId: string;

      if (!existingPlaylist) {
        const { data: newPlaylist, error } = await supabase
          .from('playlists')
          .insert({
            name: 'All Time Top Tracks',
            description: 'Your most played tracks of all time',
            user_id: user.id,
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

      // Clear existing tracks
      await supabase
        .from('playlist_items')
        .delete()
        .eq('playlist_id', playlistId);

      // Get all time most played tracks
      const { data: allTimePlays } = await supabase
        .from('track_plays')
        .select('track_id')
        .eq('user_id', user.id);

      if (allTimePlays?.length) {
        // Count plays per track
        const trackCounts = new Map<string, number>();
        allTimePlays.forEach(play => {
          trackCounts.set(play.track_id, (trackCounts.get(play.track_id) || 0) + 1);
        });

        // Sort by play count and take top 50
        const topTracks = Array.from(trackCounts.entries())
          .sort(([,a], [,b]) => b - a)
          .slice(0, 50);

        // Add to playlist
        const playlistItems = topTracks.map(([trackId], index) => ({
          playlist_id: playlistId,
          item_id: trackId,
          item_type: 'track',
          position: index + 1
        }));

        await supabase
          .from('playlist_items')
          .insert(playlistItems);
      }

      return playlistId;
    } catch (error) {
      console.error('Error creating All Time Top playlist:', error);
      throw error;
    }
  }, [user]);

  // Refresh all smart playlists
  const refreshAllSmartPlaylists = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const results = await Promise.allSettled([
        createRecentlyPlayedPlaylist(user.id),
        createWeeklyTopPlaylist(user.id),
        createDiscoveryPlaylist(),
        createFavoritesPlaylist(),
        createAllTimeTopPlaylist()
      ]);

      // Check for failures
      const failures = results.filter(result => result.status === 'rejected');
      if (failures.length > 0) {
        console.error('Some smart playlists failed to update:', failures);
        toast({
          title: "Partial Update",
          description: `Updated ${results.length - failures.length} of ${results.length} playlists. Some may have failed.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Smart Playlists Updated",
          description: "All your automated playlists have been refreshed",
        });
      }

      // Refresh the list regardless of individual failures
      await fetchSmartPlaylists();
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
  }, [user, createDiscoveryPlaylist, createFavoritesPlaylist, createAllTimeTopPlaylist, toast]);

  // Refresh specific smart playlist
  const refreshSmartPlaylist = useCallback(async (playlistName: string) => {
    if (!user) return;

    setLoading(true);
    try {
      switch (playlistName) {
        case 'Recently Played':
          await createRecentlyPlayedPlaylist(user.id);
          break;
        case 'Weekly Top Tracks':
          await createWeeklyTopPlaylist(user.id);
          break;
        case 'Discover Weekly':
          await createDiscoveryPlaylist();
          break;
        case 'Favorites':
          await createFavoritesPlaylist();
          break;
        case 'All Time Top Tracks':
          await createAllTimeTopPlaylist();
          break;
        default:
          throw new Error(`Unknown smart playlist: ${playlistName}`);
      }

      toast({
        title: "Playlist Updated",
        description: `${playlistName} has been refreshed`,
      });

      await fetchSmartPlaylists();
    } catch (error) {
      console.error(`Error refreshing ${playlistName}:`, error);
      toast({
        title: "Error",
        description: `Failed to update ${playlistName}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, createDiscoveryPlaylist, createFavoritesPlaylist, createAllTimeTopPlaylist, toast]);

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
          is_public,
          user_id,
          created_at,
          updated_at,
          playlist_items(count)
        `)
        .eq('user_id', user.id)
        .eq('is_auto_generated', true)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const smartPlaylistData = (data || []).map(playlist => ({
        id: playlist.id,
        name: playlist.name,
        description: playlist.description || '',
        category: playlist.category || 'personal_playlist',
        is_auto_generated: true,
        is_public: playlist.is_public || false,
        user_id: playlist.user_id,
        created_at: playlist.created_at,
        updated_at: playlist.updated_at,
        last_updated: playlist.updated_at || playlist.created_at,
        track_count: Array.isArray(playlist.playlist_items) ? playlist.playlist_items.length : 0
      }));

      setSmartPlaylists(smartPlaylistData);
    } catch (error) {
      console.error('Error fetching smart playlists:', error);
    }
  }, [user]);

  // Initialize smart playlists for new users
  const initializeSmartPlaylists = useCallback(async () => {
    if (!user) return;

    try {
      // Check if user already has any smart playlists
      const { data: existingPlaylists, error: checkError } = await supabase
        .from('playlists')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_auto_generated', true)
        .limit(1);

      if (checkError) throw checkError;

      // If no smart playlists exist, create them
      if (!existingPlaylists || existingPlaylists.length === 0) {
        await Promise.allSettled([
          createRecentlyPlayedPlaylist(user.id),
          createFavoritesPlaylist(),
          createDiscoveryPlaylist()
        ]);
        
        await fetchSmartPlaylists();
        
        toast({
          title: "Smart Playlists Created",
          description: "Your personalized playlists have been set up",
        });
      }
    } catch (error) {
      console.error('Error initializing smart playlists:', error);
    }
  }, [user, createDiscoveryPlaylist, createFavoritesPlaylist, fetchSmartPlaylists, toast]);

  // Auto-refresh smart playlists periodically
  useEffect(() => {
    if (!user) return;

    // Refresh discovery playlist weekly
    const discoveryInterval = setInterval(() => {
      refreshSmartPlaylist('Discover Weekly').catch(console.error);
    }, 7 * 24 * 60 * 60 * 1000); // 7 days

    // Refresh weekly top playlist daily
    const weeklyInterval = setInterval(() => {
      refreshSmartPlaylist('Weekly Top Tracks').catch(console.error);
    }, 24 * 60 * 60 * 1000); // 24 hours

    // Refresh recently played playlist hourly
    const recentInterval = setInterval(() => {
      refreshSmartPlaylist('Recently Played').catch(console.error);
    }, 60 * 60 * 1000); // 1 hour

    return () => {
      clearInterval(discoveryInterval);
      clearInterval(weeklyInterval);
      clearInterval(recentInterval);
    };
  }, [user, refreshSmartPlaylist]);

  useEffect(() => {
    if (user) {
      fetchSmartPlaylists();
      initializeSmartPlaylists();
    }
  }, [user, fetchSmartPlaylists, initializeSmartPlaylists]);

  return {
    smartPlaylists,
    loading,
    refreshAllSmartPlaylists,
    refreshSmartPlaylist,
    createDiscoveryPlaylist,
    createFavoritesPlaylist,
    createAllTimeTopPlaylist,
    fetchSmartPlaylists,
    initializeSmartPlaylists
  };
};
