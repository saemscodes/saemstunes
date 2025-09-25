// src/components/tracks/EnhancedAnimatedList.tsx
import React, { useState, useEffect } from 'react';
import { Play, Pause, Music, Clock, MoreHorizontal, Download, Share2, Heart, HeartOff, Plus, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAudioPlayer } from '@/context/AudioPlayerContext';
import { usePlaylist } from '@/context/PlaylistContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { generateTrackUrl } from '@/lib/audioUtils';
import { useAuth } from '@/context/AuthContext';

interface AudioTrack {
  id: string | number;
  src: string;
  name: string;
  artist?: string;
  artwork?: string;
  duration?: number;
  slug?: string;
}

interface EnhancedAnimatedListProps {
  tracks: AudioTrack[];
  className?: string;
  onTrackSelect?: (track: AudioTrack) => void;
}

const formatTime = (seconds: number): string => {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const EnhancedAnimatedList: React.FC<EnhancedAnimatedListProps> = ({ tracks, className, onTrackSelect }) => {
  const [likedTracks, setLikedTracks] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const { user } = useAuth();
  const { play: audioPlay, pause: audioPause, isPlaying: audioPlayerPlaying } = useAudioPlayer();
  const { queue, addItemToQueue, playPlaylist, currentPlaylist, playNext, playPrevious, toggleShuffle, toggleRepeat, setCurrentIndex } = usePlaylist();
  const navigate = useNavigate();

  // Fetch user's liked tracks
  useEffect(() => {
    const fetchLikedTracks = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('likes')
          .select('track_id')
          .eq('user_id', user.id);
        
        if (error) throw error;
        if (data) {
          const likedTrackIds = new Set(data.map(like => like.track_id));
          setLikedTracks(likedTrackIds);
        }
      } catch (error) {
        console.error('Error fetching liked tracks:', error);
      }
    };
    fetchLikedTracks();
  }, [user]);

  const toggleFavorite = async (trackId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to like tracks",
        variant: "destructive",
      });
      return;
    }

    try {
      if (likedTracks.has(trackId)) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('track_id', trackId);
        
        if (error) throw error;
        setLikedTracks(prev => {
          const newSet = new Set(prev);
          newSet.delete(trackId);
          return newSet;
        });
        toast({
          title: "Removed from favorites",
          description: "Track removed from your favorites"
        });
      } else {
        const { error } = await supabase
          .from('likes')
          .insert({ user_id: user.id, track_id: trackId });
        
        if (error) throw error;
        setLikedTracks(prev => new Set(prev).add(trackId));
        toast({
          title: "Added to favorites",
          description: "Track added to your favorites"
        });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({
        title: "Error",
        description: "Failed to update favorites",
        variant: "destructive",
      });
    }
  };

  const handleDownload = (track: AudioTrack, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!track.src) {
      toast({
        title: "Download unavailable",
        description: "This track cannot be downloaded",
        variant: "destructive",
      });
      return;
    }

    try {
      const link = document.createElement('a');
      link.href = track.src;
      link.download = `${track.artist || 'Unknown'}-${track.name}.mp3`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({
        title: "Download started",
        description: `Downloading "${track.name}"`
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Unable to download track",
        variant: "destructive",
      });
    }
  };

  const handleShare = async (track: AudioTrack, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const trackUrl = generateTrackUrl(track);
      const shareData = {
        title: track.name,
        text: `Listen to ${track.name} by ${track.artist || 'Unknown Artist'} on Saem's Tunes`,
        url: window.location.origin + trackUrl,
      };

      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        toast({
          title: "Link copied",
          description: "Track link copied to clipboard"
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast({
        title: "Share failed",
        description: "Unable to share track",
        variant: "destructive",
      });
    }
  };

  const handleAddToQueue = (track: AudioTrack, e: React.MouseEvent) => {
    e.stopPropagation();
    const playableItem = {
      id: track.id.toString(),
      type: 'track' as const,
      title: track.name,
      artist: track.artist || 'Unknown Artist',
      src: track.src,
      artwork: track.artwork,
      duration: track.duration || 0,
      slug: track.slug
    };
    addItemToQueue(playableItem, false);
    toast({
      title: "Added to queue",
      description: `"${track.name}" added to your queue`
    });
  };

  const handlePlayTrack = (track: AudioTrack) => {
    if (onTrackSelect) {
      onTrackSelect(track);
    } else {
      const trackUrl = generateTrackUrl(track);
      navigate(trackUrl);
    }

    const playableItem = {
      id: track.id.toString(),
      type: 'track' as const,
      title: track.name,
      artist: track.artist || 'Unknown Artist',
      src: track.src,
      artwork: track.artwork,
      duration: track.duration || 0,
      slug: track.slug
    };

    // If this track is part of the current playlist, play it from the playlist
    const trackIndexInQueue = queue.items.findIndex(item => item.id === track.id.toString());
    if (trackIndexInQueue !== -1 && currentPlaylist) {
      setCurrentIndex(trackIndexInQueue);
      playPlaylist(currentPlaylist, trackIndexInQueue);
    } else {
      // Otherwise, add to queue and play immediately
      addItemToQueue(playableItem, true);
    }

    // Track play analytics
    if (user) {
      supabase.from('track_plays').insert({
        track_id: track.id.toString(),
        user_id: user.id
      }).catch(console.error);
    }
  };

  const isTrackPlaying = (track: AudioTrack) => {
    return queue.currentIndex !== -1 && 
           queue.items[queue.currentIndex]?.id === track.id.toString() && 
           audioPlayerPlaying;
  };

  const isTrackInQueue = (track: AudioTrack) => {
    return queue.items.some(item => item.id === track.id.toString());
  };

  const getQueuePosition = (track: AudioTrack) => {
    const index = queue.items.findIndex(item => item.id === track.id.toString());
    return index !== -1 ? index + 1 : null;
  };

  if (!tracks || tracks.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-12 text-muted-foreground", className)}>
        <Music className="h-16 w-16 mb-4 opacity-50" />
        <p className="text-lg font-medium">No tracks available</p>
        <p className="text-sm">Add some tracks to see them here</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {tracks.map((track, index) => {
        const queuePosition = getQueuePosition(track);
        const isPlaying = isTrackPlaying(track);
        const inQueue = isTrackInQueue(track);
        
        return (
          <motion.div
            key={`${track.id}-${index}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className={cn(
              "group flex items-center justify-between p-3 rounded-lg border border-transparent hover:border-accent cursor-pointer transition-all duration-300",
              isPlaying ? "bg-accent/50 border-accent shadow-sm" : "hover:bg-accent/30"
            )}
            onClick={() => handlePlayTrack(track)}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="relative h-12 w-12 flex-shrink-0">
                {track.artwork ? (
                  <img
                    src={track.artwork}
                    alt={track.name}
                    className="h-12 w-12 rounded-lg object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder.svg';
                    }}
                  />
                ) : (
                  <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center transition-all duration-300 group-hover:from-gold/20 group-hover:to-gold/10">
                    <Music className="h-5 w-5 text-muted-foreground transition-colors duration-300 group-hover:text-gold" />
                  </div>
                )}
                
                {/* Play/Pause overlay */}
                <div className={cn(
                  "absolute inset-0 bg-black/40 flex items-center justify-center rounded-lg transition-all duration-300",
                  isPlaying ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                )}>
                  {isPlaying ? (
                    <Pause className="h-5 w-5 text-white" />
                  ) : (
                    <Play className="h-5 w-5 text-white ml-0.5" />
                  )}
                </div>

                {/* Queue indicator with position number */}
                {inQueue && !isPlaying && (
                  <div className="absolute -top-1 -right-1 h-5 w-5 bg-gold rounded-full border-2 border-background flex items-center justify-center">
                    <span className="text-[10px] font-bold text-white">
                      {queuePosition}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className={cn(
                  "truncate text-base font-medium transition-all duration-300",
                  isPlaying ? "text-foreground font-semibold" : "text-foreground group-hover:text-foreground group-hover:font-medium"
                )}>
                  {track.name}
                </p>
                <p className={cn(
                  "text-sm truncate transition-all duration-300",
                  isPlaying ? "text-foreground/80" : "text-muted-foreground group-hover:text-foreground/80"
                )}>
                  {track.artist || 'Unknown Artist'}
                </p>
                
                {/* Track duration and status */}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTime(track.duration || 0)}
                  </span>
                  {isPlaying && (
                    <span className="text-xs bg-gold/20 text-gold-dark px-2 py-0.5 rounded-full">
                      Now Playing
                    </span>
                  )}
                  {inQueue && !isPlaying && (
                    <span className="text-xs bg-blue-500/20 text-blue-600 px-2 py-0.5 rounded-full">
                      In Queue ({queuePosition})
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1">
              {/* Like button */}
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8 transition-all duration-300",
                  likedTracks.has(track.id.toString()) 
                    ? "text-red-500 hover:text-red-600" 
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={(e) => toggleFavorite(track.id.toString(), e)}
              >
                {likedTracks.has(track.id.toString()) ? (
                  <Heart className="h-4 w-4 fill-current transition-transform duration-300 hover:scale-110" />
                ) : (
                  <Heart className="h-4 w-4 transition-transform duration-300 hover:scale-110" />
                )}
              </Button>

              {/* More options dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 transition-all duration-300 opacity-70 hover:opacity-100"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={(e) => handleAddToQueue(track, e)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add to Queue
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => handleDownload(track, e)}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => handleShare(track, e)}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={(e) => toggleFavorite(track.id.toString(), e)}>
                    {likedTracks.has(track.id.toString()) ? (
                      <>
                        <HeartOff className="h-4 w-4 mr-2" />
                        Remove from Favorites
                      </>
                    ) : (
                      <>
                        <Heart className="h-4 w-4 mr-2" />
                        Add to Favorites
                      </>
                    )}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default EnhancedAnimatedList;
