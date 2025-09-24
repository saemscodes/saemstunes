import React, { useState } from 'react';
import { Play, Pause, Music, Clock, MoreHorizontal, Download, Share2, Heart, HeartOff, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAudioPlayer } from '@/context/AudioPlayerContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { generateTrackUrl } from '@/lib/audioUtils';

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
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const EnhancedAnimatedList: React.FC<EnhancedAnimatedListProps> = ({ tracks, className, onTrackSelect }) => {
  const [favorites, setFavorites] = useState<string[]>([]);
  const { toast } = useToast();
  const { state, playTrack } = useAudioPlayer();
  const navigate = useNavigate();

  const toggleFavorite = (trackId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (favorites.includes(trackId)) {
      setFavorites(favorites.filter(id => id !== trackId));
      toast({
        title: "Removed from favorites",
        description: "Track removed from your favorites"
      });
    } else {
      setFavorites([...favorites, trackId]);
      toast({
        title: "Added to favorites",
        description: "Track added to your favorites"
      });
    }
  };

  const handleDownload = (track: AudioTrack, e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = track.src;
    link.download = `${track.artist}-${track.name}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({
      title: "Download started",
      description: `Downloading "${track.name}"`
    });
  };

  const handleShare = (track: AudioTrack, e: React.MouseEvent) => {
    e.stopPropagation();
    const trackUrl = generateTrackUrl(track);
    const shareData = {
      title: track.name,
      text: `Listen to ${track.name} by ${track.artist} on Saem's Tunes`,
      url: window.location.origin + trackUrl,
    };

    if (navigator.share) {
      navigator.share(shareData)
        .then(() => console.log('Successful share'))
        .catch((error) => console.log('Error sharing', error));
    } else {
      navigator.clipboard.writeText(shareData.url)
        .then(() => {
          toast({
            title: "Link copied",
            description: "Track link copied to clipboard"
          });
        })
        .catch(() => {
          toast({
            title: "Share failed",
            description: "Unable to share or copy link"
          });
        });
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {tracks.map((track, index) => (
        <motion.div
          key={track.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          className={cn(
            "group flex items-center justify-between p-3 rounded-md hover:bg-accent cursor-pointer transition-all duration-300",
            state.currentTrack?.id === track.id && "bg-accent"
          )}
          onClick={() => {
            if (onTrackSelect) {
              onTrackSelect(track);
            } else {
              const trackUrl = generateTrackUrl(track);
              navigate(trackUrl);
            }
            playTrack({
              id: track.id.toString(),
              src: track.src,
              name: track.name,
              artist: track.artist || '',
              artwork: track.artwork || '',
            });
          }}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative h-10 w-10 flex-shrink-0">
              {track.artwork ? (
                <img
                  src={track.artwork}
                  alt={track.name}
                  className="h-10 w-10 rounded object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="h-10 w-10 rounded bg-muted flex items-center justify-center transition-colors duration-300 group-hover:bg-gold/20">
                  <Music className="h-5 w-5 text-muted-foreground transition-colors duration-300 group-hover:text-gold" />
                </div>
              )}
              {state.currentTrack?.id === track.id && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded">
                  {state.isPlaying ? (
                    <Pause className="h-5 w-5 text-white" />
                  ) : (
                    <Play className="h-5 w-5 text-white" />
                  )}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-base font-medium text-foreground transition-all duration-300 group-hover:text-foreground group-hover:font-medium">
                {track.name}
              </p>
              <p className="text-sm text-muted-foreground truncate transition-all duration-300 group-hover:text-foreground group-hover:font-medium">
                {track.artist || 'Unknown Artist'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground flex items-center gap-1 hidden sm:flex transition-colors duration-300 group-hover:text-foreground">
              <Clock className="h-3 w-3" />
              {formatTime(track.duration || 0)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground transition-all duration-300 hover:text-foreground"
              onClick={(e) => toggleFavorite(String(track.id), e)}
              >
              {favorites.includes(String(track.id)) ? (
                <Heart className="h-4 w-4 fill-foreground text-foreground transition-transform duration-300 hover:scale-110" />
              ) : (
                <Heart className="h-4 w-4 transition-transform duration-300 hover:scale-110" />
              )}
            </Button>            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 transition-opacity duration-300 opacity-70 group-hover:opacity-100"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => handleDownload(track, e)}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => handleShare(track, e)}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Plus className="h-4 w-4 mr-2" />
                  Add to Playlist
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={(e) => toggleFavorite(String(track.id), e)}>
                  {favorites.includes(String(track.id)) ? (
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
      ))}
    </div>
  );
};

export default EnhancedAnimatedList;
