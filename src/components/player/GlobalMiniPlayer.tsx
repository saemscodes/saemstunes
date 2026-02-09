import React from 'react';
import { Play, Pause, X, Shuffle, SkipBack, SkipForward, Repeat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useAudioPlayer } from '@/context/AudioPlayerContext';
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
  const {
    state,
    pauseTrack,
    resumeTrack,
    seek,
    clearPlayer,
    playNext,
    playPrevious,
    toggleShuffle,
    toggleRepeat
  } = useAudioPlayer();
  const navigate = useNavigate();

  if (!state.currentTrack) return null;

  const handlePlayPause = () => {
    if (state.isPlaying) {
      pauseTrack();
    } else {
      resumeTrack();
    }
  };

  const handleProgressChange = (values: number[]) => {
    seek(values[0]);
  };

  const handleClose = () => {
    clearPlayer();
  };

  const handleTrackClick = () => {
    if (state.currentTrack) {
      const trackUrl = generateTrackUrl(state.currentTrack);
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
                    src={state.currentTrack.artwork || '/placeholder.svg'}
                    alt={state.currentTrack.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{state.currentTrack.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{state.currentTrack.artist}</p>
                </div>
              </div>

              {/* Controls */}
              <div
                className="flex items-center gap-1 sm:gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="hidden sm:flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className={cn("h-8 w-8", state.shuffle && "text-gold")}
                    onClick={toggleShuffle}
                    title="Shuffle"
                  >
                    <Shuffle className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={playPrevious}
                    title="Previous"
                  >
                    <SkipBack className="h-4 w-4" />
                  </Button>
                </div>

                <motion.div
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-10 w-10 bg-gold/10 hover:bg-gold/20 text-gold rounded-full"
                    onClick={handlePlayPause}
                  >
                    {state.isPlaying ?
                      <Pause className="h-5 w-5 fill-current" /> :
                      <Play className="h-5 w-5 fill-current" />
                    }
                  </Button>
                </motion.div>

                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={playNext}
                    title="Next"
                  >
                    <SkipForward className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className={cn("h-8 w-8 hidden sm:flex", state.repeat !== 'off' && "text-gold")}
                    onClick={toggleRepeat}
                    title={`Repeat: ${state.repeat}`}
                  >
                    <Repeat className="h-4 w-4" />
                    {state.repeat === 'one' && <span className="absolute text-[8px] font-bold top-1 right-1">1</span>}
                  </Button>
                </div>

                <div className="w-[1px] h-6 bg-border mx-1 hidden sm:block"></div>

                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 opacity-60 hover:opacity-100"
                  onClick={handleClose}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-2 space-y-1">
              <Slider
                value={[state.currentTime]}
                max={state.duration || 100}
                step={0.1}
                onValueChange={handleProgressChange}
                className="h-1"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatTime(state.currentTime)}</span>
                <span>{formatTime(state.duration)}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GlobalMiniPlayer;
