import React from 'react';
import { Play, Pause, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useAudioPlayer } from '@/context/AudioPlayerContext';
import { usePlaylist } from '@/context/PlaylistContext';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { generateTrackUrl } from '@/lib/audioUtils';
import './StarBorder.css'; // Import the CSS for the star border effect

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const GlobalMiniPlayer: React.FC = () => {
  const audioPlayer = useAudioPlayer();
  const { queue, clearQueue } = usePlaylist();
  const navigate = useNavigate();

  // Get current track from the queue
  const currentTrack = queue.currentIndex >= 0 && queue.items[queue.currentIndex] 
    ? queue.items[queue.currentIndex] 
    : null;

  if (!currentTrack) return null;

  const handlePlayPause = () => {
    if (audioPlayer.isPlaying) {
      audioPlayer.pause();
    } else {
      audioPlayer.play();
    }
  };

  const handleProgressChange = (values: number[]) => {
    audioPlayer.seek(values[0]);
  };

  const handleClose = () => {
    audioPlayer.pause();
    clearQueue();
  };

  const handleTrackClick = () => {
    if (currentTrack) {
      const trackUrl = generateTrackUrl({
        id: currentTrack.id,
        name: currentTrack.title,
        artist: currentTrack.artist || 'Unknown Artist',
        slug: currentTrack.slug || '',
        src: currentTrack.src,
        artwork: currentTrack.artwork || '/placeholder.svg',
        duration: currentTrack.duration,
        album: undefined,
        metadata: currentTrack.metadata
      });
      navigate(trackUrl);
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={cn(
          "fixed left-4 right-4 z-40 shadow-2xl",
          "bottom-20 lg:bottom-4 lg:max-w-md lg:mx-auto star-border-container"
        )}
      >
        <div
          className="border-gradient-bottom"
          style={{
            background: `radial-gradient(circle, #A67C00, transparent 10%)`,
            animationDuration: "5s",
          }}
        ></div>
        <div
          className="border-gradient-top"
          style={{
            background: `radial-gradient(circle, #A67C00, transparent 10%)`,
            animationDuration: "5s",
          }}
        ></div>
        
        <div className={cn(
          "inner-content bg-card/95 backdrop-blur-lg border border-border rounded-2xl",
          "dark:border-[hsl(20_14%_25%)]"
        )}>
          <div className="p-3">
            <div className="flex items-center gap-3">
              {/* Track Info - Clickable */}
              <div 
                className="flex items-center flex-1 min-w-0 cursor-pointer"
                onClick={handleTrackClick}
              >
                <div className="h-10 w-10 rounded-lg overflow-hidden flex-shrink-0">
                  <img 
                    src={currentTrack.artwork || '/placeholder.svg'} 
                    alt={currentTrack.title} 
                    className="h-full w-full object-cover" 
                  />
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{currentTrack.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{currentTrack.artist}</p>
                </div>
              </div>
              
              {/* Controls - Prevent click propagation */}
              <div 
                className="flex items-center gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                <motion.div
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-8 w-8" 
                    onClick={handlePlayPause}
                  >
                    {audioPlayer.isPlaying ? 
                      <Pause className="h-4 w-4" /> : 
                      <Play className="h-4 w-4" />
                    }
                  </Button>
                </motion.div>
                
                <motion.div
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-8 w-8" 
                    onClick={handleClose}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </motion.div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-2 space-y-1">
              <Slider 
                value={[audioPlayer.currentTime]}
                max={audioPlayer.duration || 100} 
                step={0.1}
                onValueChange={handleProgressChange}
                className="h-1"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatTime(audioPlayer.currentTime)}</span>
                <span>{formatTime(audioPlayer.duration)}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GlobalMiniPlayer;