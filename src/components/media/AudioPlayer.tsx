import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX,
  Repeat,
  Shuffle,
  MoreHorizontal,
  ArrowLeft,
  Heart,
  Share,
  Download,
  Plus,
  Music
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { usePermissionRequest } from '@/lib/permissionsHelper';
import { useAudioPlayer } from '@/context/AudioPlayerContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useMediaState } from '@/components/idle-state/mediaStateContext';
import { supabase } from '@/integrations/supabase/client';
import { validate as isUuid } from 'uuid';
import MainLayout from '@/components/layout/MainLayout';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/context/AuthContext';
import EnhancedAnimatedList from '@/components/tracks/EnhancedAnimatedList';
import { fetchPlaylistTracks, fetchUserPlaylists } from '@/lib/playlistUtils';
import { getAudioUrl, getStorageUrl, convertTrackToAudioTrack, generateTrackUrl } from '@/lib/audioUtils';
import AddToPlaylistModal from '@/components/playlists/AddToPlaylistModal';
import { ArtistMetadataManager } from '@/components/artists/ArtistMetadataManager';
import { AudioTrack } from '@/types/music';

interface Track {
  id: string | number;
  title: string;
  artist?: string | null;
  audio_path: string;
  cover_path?: string | null;
  description?: string;
  album?: string;
  slug?: string;
  duration?: number;
  approved?: boolean;
  created_at?: string;
  profiles?: {
    avatar_url: string;
  };
}

interface AudioPlayerProps {
  src?: string;
  trackId?: string | number;
  title?: string;
  artist?: string;
  artwork?: string;
  autoPlay?: boolean;
  onEnded?: () => void;
  onError?: () => void;
  className?: string;
  showControls?: boolean;
  compact?: boolean;
  isFullPage?: boolean;
  showTrackList?: boolean;
  enablePlaylistFeatures?: boolean;
  enableSocialFeatures?: boolean;
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const AudioPlayer: React.FC<AudioPlayerProps> = ({
  src,
  trackId,
  title,
  artist,
  artwork = '/placeholder.svg',
  autoPlay = false,
  onEnded,
  onError,
  className,
  showControls = true,
  compact = false,
  isFullPage = false,
  showTrackList = false,
  enablePlaylistFeatures = false,
  enableSocialFeatures = false
}) => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { setMediaPlaying } = useMediaState();
  const { user } = useAuth();
  const [isRepeat, setIsRepeat] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAdvancedControls, setShowAdvancedControls] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [trackData, setTrackData] = useState<AudioTrack | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>(src || '');
  const [coverUrl, setCoverUrl] = useState<string>(artwork);
  
  // Full page mode states
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showMetadataPrompt, setShowMetadataPrompt] = useState(false);
  const [tracks, setTracks] = useState<AudioTrack[]>([]);
  const [userPlaylists, setUserPlaylists] = useState<any[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<any>(null);
  const [playlistTracks, setPlaylistTracks] = useState<AudioTrack[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [isPlayingRequested, setIsPlayingRequested] = useState(false); // Add this
  
  const { toast } = useToast();
  const { requestPermissionWithFeedback } = usePermissionRequest();
  const { 
    state, 
    playTrack, 
    pauseTrack, 
    resumeTrack, 
    seek, 
    setVolume, 
    toggleMute, 
    playNext,
    playPrevious,
    toggleShuffle: globalToggleShuffle,
    toggleRepeat: globalToggleRepeat,
    setPlaylist,
    setCurrentIndex,
  } = useAudioPlayer();

  // Determine if this is full page mode
  const fullPageMode = isFullPage || !!slug || !!location.state?.track;

  // Track play analytics
  const trackPlayAnalytics = useCallback(async (trackId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!trackId || !session) return;
  
    try {
      await supabase.from('track_plays').insert({
      track_id: trackId,
      user_id: user?.id || null
    });
  }   catch (error) {
    console.error('Error tracking play:', error);
  }
}, [user]);

  // Fetch track metadata if trackId is provided
  useEffect(() => {
    const fetchTrackData = async () => {
      if (!trackId && !slug) return;
      
      try {
        setIsLoading(true);
        let query: any = supabase
          .from('tracks')
          .select(`
            id,
            title,
            artist,
            audio_path,
            alternate_audio_path,
            cover_path,
            description,
            duration,
            slug,
            profiles:user_id (
              avatar_url
            )
          `);

        const searchId = trackId || slug;
        
        // Check if searchId is a valid UUID
        if (typeof searchId === 'string' && isUuid(searchId)) {
          query = query.eq('id', searchId);
        } else {
          query = query.eq('slug', searchId);
        }

        let { data, error }: { data: any; error: any } = await query.single();

        if (error) {
          // Try alternate search method
          if (searchId) {
            const { data: altData, error: altError } = await supabase
              .from('tracks')
              .select('*')
              .or(`id.eq.${searchId},slug.eq.${searchId}`)
              .single();
            
            if (!altError && altData) {
              data = altData;
            } else {
              throw error;
            }
          } else {
            throw error;
          }
        }
        
        if (!data) return;

        const convertedTrack = convertTrackToAudioTrack(data);
        setTrackData(convertedTrack);

        // Get public URL for audio
        const audioUrl = getAudioUrl(data) || src || '';
        setAudioUrl(audioUrl);

        // Get cover URL
        const coverUrl = data.cover_path 
          ? (data.cover_path.startsWith('http') 
              ? data.cover_path 
              : getStorageUrl(data.cover_path))
          : artwork;
        setCoverUrl(coverUrl);

        // Track analytics for play
        if (data.id) {
          trackPlayAnalytics(data.id);
        }
      } catch (err) {
        console.error('Error fetching track:', err);
        setError('Failed to load track metadata');
      } finally {
        setIsLoading(false);
        setLoading(false);
      }
    };

    fetchTrackData();
  }, [trackId, slug, src, artwork, trackPlayAnalytics]);

  // Fetch all tracks for full page mode
  const fetchAllTracks = useCallback(async () => {
    if (!fullPageMode) return;
    
    try {
      const { data: allTracks, error } = await supabase
        .from('tracks')
        .select('id, title, audio_path, alternate_audio_path, cover_path, artist, duration, slug')
        .eq('approved', true)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      if (allTracks) {
        const mappedTracks = allTracks.map(track => convertTrackToAudioTrack(track));
        setTracks(mappedTracks);
        setPlaylist(mappedTracks);
      }
    } catch (error) {
      console.error('Error fetching tracks:', error);
    }
  }, [fullPageMode]);

  // Initialize for full page mode
  useEffect(() => {
    if (!fullPageMode) return;
    
    const init = async () => {
      fetchAllTracks();
      
      if (location.state?.track) {
        setTrackData(location.state.track);
        setLoading(false);
      } else if (slug) {
        // Track data will be fetched by the other useEffect
      } else {
        setTrackData({
          id: 1,
          src: '/audio/sample.mp3',
          name: 'Sample Track',
          artist: 'Sample Artist',
          artwork: '/placeholder.svg',
          album: 'Sample Album'
        });
        setLoading(false);
      }
    };

    init();
  }, [slug, location.state, fetchAllTracks, fullPageMode]);

  // Handle artwork changes
  useEffect(() => {
    setCoverUrl(artwork);
    setImageLoaded(false);
  }, [artwork]);

  // Handle image loading errors
  const handleImageError = () => {
    if (coverUrl !== '/placeholder.svg') {
      setCoverUrl('/placeholder.svg');
    }
  };

  // Handle external state changes
  useEffect(() => {
    if (state) {
      setMediaPlaying(state.isPlaying);
    }
  }, [state?.isPlaying, setMediaPlaying]);

  // Create track object
  const track = {
    id: trackId || trackData?.id || src || '',
    src: audioUrl,
    name: trackData?.name || title || 'Unknown Track',
    artist: trackData?.artist || artist || 'Unknown Artist',
    artwork: coverUrl,
    slug: trackData?.slug,
  };

  const isCurrentTrack = state?.currentTrack?.id === track.id;
  const isPlaying = isCurrentTrack && state?.isPlaying;
  const currentTime = isCurrentTrack ? (state?.currentTime || 0) : 0;
  const duration = isCurrentTrack ? (state?.duration || 0) : 0;

  useEffect(() => {
    if (autoPlay && audioUrl) {
      handlePlay();
    }
  }, [autoPlay, audioUrl]);

   // Handle play with concurrency protection
  const handlePlay = async () => {
    if (isPlayingRequested || !audioUrl) return;
    
    try {
      setIsPlayingRequested(true);
      setIsLoading(true);
      
      if (autoPlay) {
        const hasPermission = await requestPermissionWithFeedback('microphone', 'Audio playback');
        if (!hasPermission) {
          setIsLoading(false);
          return;
        }
      }
      
      const startTime = isCurrentTrack ? (state?.lastPlayedTime || 0) : 0;
      const audioTrack = {
        id: track.id.toString(),
        src: track.src,
        name: track.name,
        artist: track.artist,
        artwork: track.artwork,
        slug: track.slug,
      };
      
      await playTrack(audioTrack, startTime);
      
      if (track.id) {
        trackPlayAnalytics(String(track.id));
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error playing audio:', err);
        setError('Failed to play audio');
        onError?.();
      }
    } finally {
      setIsLoading(false);
      setIsPlayingRequested(false);
    }
  };

  // Toggle play with concurrency protection
  const togglePlay = async () => {
    if (isPlayingRequested) return;
    
    if (!audioUrl) {
      setError('No audio source available');
      return;
    }
    
    try {
      setIsPlayingRequested(true);
      
      if (isCurrentTrack) {
        if (isPlaying) {
          pauseTrack();
        } else {
          await resumeTrack();
        }
      } else {
        await handlePlay();
      }
    } finally {
      setIsPlayingRequested(false);
    }
  };
  
  const handleProgressChange = (values: number[]) => {
    const newTime = values[0];
    seek(newTime);
  };
  
  const handleVolumeChange = (values: number[]) => {
    const newVolume = values[0];
    setVolume(newVolume);
  };
  
  const toggleRepeat = () => {
    if (fullPageMode) {
      globalToggleRepeat();
    } else {
      setIsRepeat(!isRepeat);
      toast({
        title: isRepeat ? 'Repeat Off' : 'Repeat On',
        description: isRepeat ? 'Track will not repeat' : 'Track will repeat when finished',
      });
    }
  };
  
  const toggleShuffle = () => {
    if (fullPageMode) {
      globalToggleShuffle();
    } else {
      setIsShuffle(!isShuffle);
      toast({
        title: isShuffle ? 'Shuffle Off' : 'Shuffle On',
        description: 'This feature will work when playing multiple tracks',
      });
    }
  };

  // Full page mode handlers
  const handleTrackSelect = useCallback((track: AudioTrack) => {
    if (track.id) {
      trackPlayAnalytics(String(track.id));
    }
    
    setTrackData(track);
    const trackUrl = generateTrackUrl(track);
    navigate(trackUrl);
    
    const currentPlaylist = selectedPlaylist ? playlistTracks : tracks;
    const index = currentPlaylist.findIndex(t => t.id === track.id);
    
    if (index !== -1) {
      setCurrentIndex(index);
      setPlaylist(currentPlaylist, selectedPlaylist?.id);
      playTrack(track);
    }
  }, [navigate, selectedPlaylist, playlistTracks, tracks, setCurrentIndex, setPlaylist, playTrack, trackPlayAnalytics]);

  const toggleLike = useCallback(async () => {
    if (!user) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to like tracks",
        variant: "destructive",
      });
      return;
    }

    if (!trackData) return;
    
    if (isLiked) {
      await supabase
        .from('likes')
        .delete()
        .eq('user_id', user.id)
        .eq('track_id', String(trackData.id));
      setIsLiked(false);
      toast({
        title: "Removed from favorites",
        description: "Track removed from your favorites",
      });
    } else {
      await supabase
        .from('likes')
        .insert({ user_id: user.id, track_id: String(trackData.id) });
      setIsLiked(true);
      toast({
        title: "Added to favorites",
        description: "Track added to your favorites",
      });
    }
  }, [user, trackData, isLiked, toast]);

  const handleShare = useCallback(async () => {
    if (!trackData) return;

    const shareData = {
      title: `${trackData.name} by ${trackData.artist}`,
      text: `Listen to ${trackData.name} on Saem's Tunes`,
      url: window.location.href,
    };

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        toast({
          title: "Link copied",
          description: "Track link copied to clipboard",
        });
      }
    } catch (error) {
      toast({
        title: "Share failed",
        description: "Unable to share track",
        variant: "destructive",
      });
    }
  }, [trackData, toast]);

  // Return full page layout for full page mode
  if (fullPageMode) {
    if (loading) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="h-8 w-8 rounded-full border-2 border-t-transparent border-gold animate-spin mx-auto mb-4"></div>
            <p>Loading track...</p>
          </div>
        </div>
      );
    }

    if (!trackData) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Track not found</h2>
            <Button onClick={() => navigate('/tracks')}>
              Back to Tracks
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full max-w-2xl mx-auto p-6">
        <Helmet>
          <title>{`${trackData?.name || 'Audio Player'} - Saem's Tunes`}</title>
          <meta name="description" content={`Listen to ${trackData?.name || 'music'} by ${trackData?.artist || 'artist'}`} />
        </Helmet>
        
        {/* Enhanced Audio Controls */}
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="relative">
              <Slider 
                value={[currentTime]}
                max={duration || 100} 
                step={0.1}
                onValueChange={handleProgressChange}
                className="cursor-pointer"
              />
            </div>
            
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={playPrevious}
              className="h-12 w-12"
              title="Previous"
            >
              <SkipBack className="h-6 w-6" />
            </Button>
            
            <Button 
              variant="default" 
              size="icon" 
              onClick={togglePlay}
              className="h-16 w-16 rounded-full bg-primary hover:bg-primary/90"
              title={isPlaying ? "Pause" : "Play"}
              disabled={!audioUrl}
            >
              {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 ml-1" />}
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon"
              onClick={playNext}
              className="h-12 w-12"
              title="Next"
            >
              <SkipForward className="h-6 w-6" />
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn("h-10 w-10", state?.shuffle && "text-primary")}
                onClick={toggleShuffle}
                title="Shuffle"
              >
                <Shuffle className="h-5 w-5" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn("h-10 w-10", state?.repeat !== 'off' && "text-primary")}
                onClick={toggleRepeat}
                title="Repeat"
              >
                <Repeat className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleMute} 
                className="h-10 w-10"
                title={state?.isMuted ? "Unmute" : "Mute"}
              >
                {state?.isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </Button>
              
              <div className="w-24">
                <Slider
                  value={[state?.isMuted ? 0 : (state?.volume || 1)]} 
                  min={0} 
                  max={1} 
                  step={0.01}
                  onValueChange={handleVolumeChange}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Original compact/widget mode
  if (error) {
    return (
      <div className={cn("bg-muted rounded-md p-4 text-center", className)}>
        <p className="text-destructive">Error: {error}</p>
        <Button 
          variant="outline" 
          className="mt-2"
          onClick={() => window.location.reload()}
        >
          Try Again
        </Button>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className={cn("bg-muted rounded-md p-4 flex items-center justify-center", className)}>
        <div className="h-8 w-8 rounded-full border-2 border-t-transparent border-primary animate-spin"></div>
      </div>
    );
  }
  
  if (compact) {
    return (
      <div className={cn("flex items-center gap-2 p-2 min-w-0 overflow-hidden", className)}>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={togglePlay} 
          className="h-8 w-8 flex-shrink-0"
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        
        <div className="flex-1 min-w-0">
          <Slider 
            value={[currentTime]}
            max={duration || 100} 
            step={0.1}
            onValueChange={handleProgressChange}
            className="h-1"
          />
        </div>
        
        <span className="text-xs text-muted-foreground flex-shrink-0 hidden xs:block">
          {formatTime(currentTime)}
        </span>
      </div>
    );
  }
  
  return (
    <div className={cn("bg-background border rounded-lg overflow-hidden w-full", className)}>
      {/* Track info - Always visible */}
      {(track.name || track.artist) && (
        <div className="p-3 sm:p-4">
          <div className="flex items-center gap-3 min-w-0">
            {coverUrl && (
              <div className="relative flex-shrink-0">
                {!imageLoaded && (
                  <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-lg h-10 w-10 sm:h-12 sm:w-12" />
                )}
                <img 
                  src={coverUrl} 
                  alt={track.name || "Album art"}
                  className={cn(
                    "h-10 w-10 sm:h-12 sm:w-12 object-cover rounded-lg",
                    !imageLoaded ? "opacity-0" : "opacity-100"
                  )}
                  onLoad={() => setImageLoaded(true)}
                  onError={handleImageError}
                />
              </div>
            )}
            <div className="min-w-0 flex-1">
              {track.name && <p className="font-medium text-sm sm:text-base truncate">{track.name}</p>}
              {track.artist && <p className="text-xs sm:text-sm text-muted-foreground truncate">{track.artist}</p>}
            </div>
          </div>
        </div>
      )}
      
      {/* Progress section */}
      <div className="px-3 sm:px-4 pb-3 sm:pb-4">
        <div className="space-y-2">
          <div className="relative">
            <Slider 
              value={[currentTime]}
              max={duration || 100} 
              step={0.1}
              onValueChange={handleProgressChange}
              className="cursor-pointer"
            />
          </div>
          
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Essential controls */}
        <div className="flex items-center justify-center gap-2 mt-4">
          <Button 
            variant="ghost" 
            size="icon"
            className="h-8 w-8 hidden xs:flex"
            title="Previous"
            onClick={playPrevious}
          >
            <SkipBack className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="default" 
            size="icon" 
            onClick={togglePlay}
            className="h-12 w-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground"
            title={isPlaying ? "Pause" : "Play"}
            disabled={!audioUrl}
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon"
            className="h-8 w-8 hidden xs:flex"
            title="Next"
            onClick={playNext}
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>

        {/* Advanced controls */}
        {showControls && (
          <>
            <div className="sm:hidden">
              <div className="flex items-center justify-center mt-2">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setShowAdvancedControls(!showAdvancedControls)}
                  className="h-8 w-8"
                  title="More controls"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
              
              <AnimatePresence>
                {showAdvancedControls && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-3 space-y-3">
                      <div className="flex items-center justify-center gap-4">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className={cn("h-8 w-8", isShuffle && "text-primary")}
                          onClick={toggleShuffle}
                          title="Shuffle"
                        >
                          <Shuffle className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className={cn("h-8 w-8", isRepeat && "text-primary")}
                          onClick={toggleRepeat}
                          title="Repeat"
                        >
                          <Repeat className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={toggleMute} 
                          className="h-8 w-8"
                          title={state?.isMuted ? "Unmute" : "Mute"}
                        >
                          {state?.isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                        </Button>
                        <div className="flex-1 max-w-24">
                          <Slider
                            value={[state?.isMuted ? 0 : (state?.volume || 1)]} 
                            min={0} 
                            max={1} 
                            step={0.01}
                            onValueChange={handleVolumeChange}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="hidden sm:flex items-center justify-between mt-4">
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={cn("h-8 w-8", isShuffle && "text-primary")}
                  onClick={toggleShuffle}
                  title="Shuffle"
                >
                  <Shuffle className="h-4 w-4" />
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={cn("h-8 w-8", isRepeat && "text-primary")}
                  onClick={toggleRepeat}
                  title="Repeat"
                >
                  <Repeat className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={toggleMute} 
                  className="h-8 w-8"
                  title={state?.isMuted ? "Unmute" : "Mute"}
                >
                  {state?.isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
                
                <div className="w-20 lg:w-24">
                  <Slider
                    value={[state?.isMuted ? 0 : (state?.volume || 1)]} 
                    min={0} 
                    max={1} 
                    step={0.01}
                    onValueChange={handleVolumeChange}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AudioPlayer;
