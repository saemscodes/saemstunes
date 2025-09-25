// src/components/media/AudioPlayer.tsx
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
  Repeat1,
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
import { usePlaylist } from '@/context/PlaylistContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useMediaState } from '@/components/idle-state/mediaStateContext';
import { supabase } from '@/integrations/supabase/client';
import { validate as isUuid } from 'uuid';
import MainLayout from '@/components/layout/MainLayout';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/context/AuthContext';
import EnhancedAnimatedList from '@/components/tracks/EnhancedAnimatedList';
import { fetchPlaylistItems, fetchUserPlaylists } from '@/lib/playlistUtils';
import { getAudioUrl, getStorageUrl, convertTrackToAudioTrack, generateTrackUrl } from '@/lib/audioUtils';
import AddToPlaylistModal from '@/components/playlists/AddToPlaylistModal';
import { ArtistMetadataManager } from '@/components/artists/ArtistMetadataManager';
import { AudioTrack, PlayableItem } from '@/types/music';
import { Playlist } from '@/types/playlist';

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
  if (!seconds || isNaN(seconds)) return '0:00';
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
  const { toast } = useToast();
  const { requestPermissionWithFeedback } = usePermissionRequest();
  
  const { 
    queue, 
    playNext, 
    playPrevious, 
    toggleShuffle, 
    toggleRepeat, 
    setIsPlaying: setPlaylistPlaying,
    playPlaylist,
    addItemToQueue,
    setCurrentIndex,
    currentPlaylist
  } = usePlaylist();

  const {
    currentTime,
    duration,
    volume,
    isMuted,
    isPlaying: audioPlayerPlaying,
    setCurrentTime: seek,
    setVolume,
    toggleMute,
    play: audioPlay,
    pause: audioPause,
    loadAudio
  } = useAudioPlayer();

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAdvancedControls, setShowAdvancedControls] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [trackData, setTrackData] = useState<AudioTrack | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>(src || '');
  const [coverUrl, setCoverUrl] = useState<string>(artwork);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showMetadataPrompt, setShowMetadataPrompt] = useState(false);
  const [tracks, setTracks] = useState<AudioTrack[]>([]);
  const [userPlaylists, setUserPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [playlistTracks, setPlaylistTracks] = useState<AudioTrack[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [isPlayingRequested, setIsPlayingRequested] = useState(false);

  const fullPageMode = isFullPage || !!slug || !!location.state?.track;

  const currentItem = queue.items[queue.currentIndex];
  const displayTrack = fullPageMode ? trackData : currentItem;

  const canPlayNext = () => {
    if (queue.items.length === 0) return false;
    if (queue.repeat === 'all') return true;
    if (queue.repeat === 'one') return true;
    return queue.currentIndex < queue.items.length - 1;
  };

  const canPlayPrevious = () => {
    return queue.playHistory.length > 0;
  };

  const handleRepeatToggle = () => {
    toggleRepeat();
  };

  const trackPlayAnalytics = useCallback(async (trackId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!trackId || !session) return;

    try {
      await supabase.from('track_plays').insert({
        track_id: trackId,
        user_id: user?.id || null
      });
    } catch (error) {
      console.error('Error tracking play:', error);
    }
  }, [user]);

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
        
        if (typeof searchId === 'string' && isUuid(searchId)) {
          query = query.eq('id', searchId);
        } else {
          query = query.eq('slug', searchId);
        }

        let { data, error }: { data: any; error: any } = await query.single();

        if (error && searchId) {
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
        }
        
        if (!data) return;

        const convertedTrack = convertTrackToAudioTrack(data);
        setTrackData(convertedTrack);

        const audioUrl = getAudioUrl(data) || src || '';
        setAudioUrl(audioUrl);

        const coverUrl = data.cover_path 
          ? (data.cover_path.startsWith('http') 
              ? data.cover_path 
              : getStorageUrl(data.cover_path))
          : artwork;
        setCoverUrl(coverUrl);

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

  useEffect(() => {
    if (currentItem?.src) {
      loadAudio(currentItem.src);
      if (queue.isPlaying) {
        audioPlay();
      }
    }
  }, [currentItem?.src, loadAudio, audioPlay, queue.isPlaying]);

  useEffect(() => {
    setPlaylistPlaying(audioPlayerPlaying);
    setMediaPlaying(audioPlayerPlaying);
  }, [audioPlayerPlaying, setPlaylistPlaying, setMediaPlaying]);

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
      }
    } catch (error) {
      console.error('Error fetching tracks:', error);
    }
  }, [fullPageMode]);

  const fetchUserPlaylistsData = useCallback(async () => {
    if (!user) return;
    try {
      const playlists = await fetchUserPlaylists(user.id);
      setUserPlaylists(playlists);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load playlists",
        variant: "destructive",
      });
    }
  }, [user, toast]);

  const fetchPlaylistTracksData = useCallback(async (playlistId: string) => {
    try {
      const tracks = await fetchPlaylistItems(playlistId);
      setPlaylistTracks(tracks);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load playlist tracks",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    if (!fullPageMode) return;
    
    const init = async () => {
      await fetchAllTracks();
      await fetchUserPlaylistsData();
      
      if (location.state?.track) {
        setTrackData(location.state.track);
        setLoading(false);
      } else if (slug) {
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
  }, [slug, location.state, fetchAllTracks, fetchUserPlaylistsData, fullPageMode]);

  useEffect(() => {
    setCoverUrl(artwork);
    setImageLoaded(false);
  }, [artwork]);

  const handleImageError = () => {
    if (coverUrl !== '/placeholder.svg') {
      setCoverUrl('/placeholder.svg');
    }
  };

  const track = {
    id: trackId || trackData?.id || src || '',
    src: fullPageMode ? audioUrl : (currentItem?.src || ''),
    name: displayTrack?.name || title || 'Unknown Track',
    artist: displayTrack?.artist || artist || 'Unknown Artist',
    artwork: fullPageMode ? coverUrl : (currentItem?.artwork || artwork),
    slug: displayTrack?.slug,
  };

  const handlePlay = async () => {
    if (isPlayingRequested || !track.src) return;
    
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
      
      if (fullPageMode && trackData) {
        const playableItem: PlayableItem = {
          id: trackData.id.toString(),
          type: 'track',
          title: trackData.name,
          artist: trackData.artist || '',
          src: track.src,
          artwork: track.artwork,
          duration: trackData.duration || 0,
          slug: trackData.slug
        };
        
        addItemToQueue(playableItem, true);
      } else {
        loadAudio(track.src);
        await audioPlay();
      }
      
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

  const togglePlay = async () => {
    if (isPlayingRequested) return;
    
    if (!track.src) {
      setError('No audio source available');
      return;
    }
    
    try {
      setIsPlayingRequested(true);
      
      if (audioPlayerPlaying) {
        audioPause();
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
      if (selectedPlaylist) {
        playPlaylist(selectedPlaylist, index);
      }
    }
  }, [navigate, selectedPlaylist, playlistTracks, tracks, setCurrentIndex, playPlaylist, trackPlayAnalytics]);

  const handlePlaylistSelect = useCallback((playlist: Playlist) => {
    setSelectedPlaylist(playlist);
    fetchPlaylistTracksData(playlist.id);
    setActiveTab('playlist');
  }, [fetchPlaylistTracksData]);

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

  if (fullPageMode) {
    if (loading) {
      return (
        <MainLayout>
          <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center">
            <div className="text-center">
              <div className="h-8 w-8 rounded-full border-2 border-t-transparent border-gold animate-spin mx-auto mb-4"></div>
              <p>Loading track...</p>
            </div>
          </div>
        </MainLayout>
      );
    }

    if (!trackData) {
      return (
        <MainLayout>
          <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Track not found</h2>
              <Button onClick={() => navigate('/tracks')}>
                Back to Tracks
              </Button>
            </div>
          </div>
        </MainLayout>
      );
    }

    return (
      <div>
        <Helmet>
          <title>{`${trackData?.name || 'Audio Player'} - Saem's Tunes`}</title>
          <meta name="description" content={`Listen to ${trackData?.name || 'music'} by ${trackData?.artist || 'artist'}`} />
        </Helmet>
        
        <MainLayout>
          <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
            <div className="container mx-auto px-4 py-8 max-w-7xl">
              <div className="flex items-center gap-4 mb-8">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(-1)}
                  className="h-10 w-10"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-2xl font-bold">Now Playing</h1>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <Card className="overflow-hidden bg-gradient-to-b from-card to-card/80 border-gold/20 shadow-2xl">
                    <CardContent className="p-6 md:p-8">
                      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 mb-8">
                        <div className="flex-shrink-0 mx-auto lg:mx-0 w-full max-w-[320px]">
                          <div className="relative group aspect-square">
                            <img
                              src={trackData?.artwork || '/placeholder.svg'}
                              alt={trackData?.name || 'Track artwork'}
                              className={cn(
                                "w-full h-full rounded-2xl shadow-2xl object-cover group-hover:scale-105 transition-transform duration-300",
                                !imageLoaded && "opacity-0"
                              )}
                              onLoad={() => setImageLoaded(true)}
                            />
                            
                            {!imageLoaded && (
                              <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-2xl" />
                            )}
                            
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          </div>
                        </div>

                        <div className="flex flex-col justify-center space-y-6 flex-1 text-center lg:text-left">
                          <div>
                            <h2 className="text-3xl md:text-4xl font-bold mb-3 text-foreground">{trackData?.name || 'Unknown Track'}</h2>
                            <p className="text-xl md:text-2xl text-muted-foreground mb-2">{trackData?.artist || 'Unknown Artist'}</p>
                            {trackData?.album && (
                              <p className="text-lg text-muted-foreground/80">{trackData.album}</p>
                            )}
                          </div>

                          <div className="flex items-center justify-center lg:justify-start gap-4 flex-wrap">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={toggleLike}
                              className={cn(
                                "h-12 w-12",
                                isLiked ? "text-red-500" : "text-muted-foreground"
                              )}
                            >
                              <Heart className={cn("h-6 w-6", isLiked && "fill-current")} />
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={handleShare}
                              className="h-12 w-12 text-muted-foreground hover:text-foreground"
                            >
                              <Share className="h-6 w-6" />
                            </Button>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-12 w-12 text-muted-foreground hover:text-foreground"
                                >
                                  <MoreHorizontal className="h-6 w-6" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => {}}>
                                  <Plus className="mr-2 h-4 w-4" />
                                  {isSaved ? 'Remove from saved' : 'Save track'}
                                </DropdownMenuItem>
                                
                                {user && (
                                  <AddToPlaylistModal 
                                    trackId={String(trackData.id)} 
                                    userId={user.id}
                                    onPlaylistCreated={fetchUserPlaylistsData}
                                  >
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                      <Plus className="mr-2 h-4 w-4" />
                                      Add to playlist
                                    </DropdownMenuItem>
                                  </AddToPlaylistModal>
                                )}
                                
                                <DropdownMenuItem onClick={() => {}}>
                                  <Download className="mr-2 h-4 w-4" />
                                  Download
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        {error ? (
                          <div className="text-center py-12">
                            <p className="text-muted-foreground mb-4">Unable to load audio player</p>
                            <Button onClick={() => window.location.reload()}>
                              Try Again
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-6">
                            <div className="space-y-2">
                              <Slider 
                                value={[currentTime]}
                                max={duration || 100} 
                                step={0.1}
                                onValueChange={handleProgressChange}
                                className="cursor-pointer"
                              />
                              
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
                                disabled={!canPlayPrevious()}
                              >
                                <SkipBack className="h-6 w-6" />
                              </Button>
                              
                              <Button 
                                variant="default" 
                                size="icon" 
                                onClick={togglePlay}
                                className="h-16 w-16 rounded-full bg-primary hover:bg-primary/90"
                                title={audioPlayerPlaying ? "Pause" : "Play"}
                                disabled={!track.src}
                              >
                                {audioPlayerPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 ml-1" />}
                              </Button>
                              
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={playNext}
                                className="h-12 w-12"
                                title="Next"
                                disabled={!canPlayNext()}
                              >
                                <SkipForward className="h-6 w-6" />
                              </Button>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className={cn("h-10 w-10", queue.shuffle && "text-primary")}
                                  onClick={toggleShuffle}
                                  title="Shuffle"
                                >
                                  <Shuffle className="h-5 w-5" />
                                </Button>
                                
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className={cn(
                                    "h-10 w-10", 
                                    queue.repeat !== 'none' && "text-primary",
                                    queue.repeat === 'one' && "text-gold"
                                  )}
                                  onClick={handleRepeatToggle}
                                  title={
                                    queue.repeat === 'none' ? 'Repeat Off' : 
                                    queue.repeat === 'all' ? 'Repeat Playlist' : 
                                    'Repeat One'
                                  }
                                >
                                  {queue.repeat === 'one' ? (
                                    <Repeat1 className="h-5 w-5" />
                                  ) : (
                                    <Repeat className="h-5 w-5" />
                                  )}
                                </Button>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={toggleMute} 
                                  className="h-10 w-10"
                                  title={isMuted ? "Unmute" : "Mute"}
                                >
                                  {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                                </Button>
                                
                                <div className="w-24">
                                  <Slider
                                    value={[isMuted ? 0 : (volume * 100)]} 
                                    max={100}
                                    step={1}
                                    onValueChange={handleVolumeChange}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {showMetadataPrompt && trackData && (
                        <ArtistMetadataManager trackId={String(trackData.id)} />
                      )}
                    </CardContent>
                  </Card>
                </div>

                <div className="lg:col-span-1">
                  <Card className="h-fit">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Music className="h-5 w-5" />
                        Tracks
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Tabs 
                        value={activeTab} 
                        onValueChange={setActiveTab}
                        className="w-full"
                      >
                        <TabsList className="grid w-full grid-cols-4">
                          <TabsTrigger value="all">All</TabsTrigger>
                          <TabsTrigger value="favorites">Favorites</TabsTrigger>
                          <TabsTrigger value="recent">Recent</TabsTrigger>
                          <TabsTrigger value="playlists">Playlists</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="all" className="mt-0">
                          <ScrollArea className="h-[600px]">
                            <div className="p-4">
                              <EnhancedAnimatedList
                                tracks={tracks}
                                onTrackSelect={handleTrackSelect}
                              />
                            </div>
                          </ScrollArea>
                        </TabsContent>
                        
                        <TabsContent value="favorites" className="mt-0">
                          <ScrollArea className="h-[600px]">
                            <div className="p-4">
                              <p className="text-center text-muted-foreground py-8">
                                No favorite tracks yet
                              </p>
                            </div>
                          </ScrollArea>
                        </TabsContent>
                        
                        <TabsContent value="recent" className="mt-0">
                          <ScrollArea className="h-[600px]">
                            <div className="p-4">
                              <p className="text-center text-muted-foreground py-8">
                                No recent tracks
                              </p>
                            </div>
                          </ScrollArea>
                        </TabsContent>
                        
                        <TabsContent value="playlists" className="mt-0">
                          <ScrollArea className="h-[600px]">
                            <div className="p-4">
                              {!user ? (
                                <p className="text-center text-muted-foreground py-8">
                                  Sign in to view your playlists
                                </p>
                              ) : selectedPlaylist ? (
                                <div>
                                  <Button 
                                    variant="ghost" 
                                    onClick={() => setSelectedPlaylist(null)}
                                    className="mb-4"
                                  >
                                    <ArrowLeft className="h-4 w-4 mr-2" /> Back to playlists
                                  </Button>
                                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    {selectedPlaylist.name}
                                    <span className="text-sm text-muted-foreground">
                                      ({playlistTracks.length} tracks)
                                    </span>
                                  </h3>
                                  <EnhancedAnimatedList
                                    tracks={playlistTracks}
                                    onTrackSelect={handleTrackSelect}
                                  />
                                </div>
                              ) : userPlaylists.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">
                                  You don't have any playlists yet
                                </p>
                              ) : (
                                <div className="grid grid-cols-1 gap-3">
                                  {userPlaylists.map(playlist => (
                                    <div 
                                      key={playlist.id} 
                                      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted cursor-pointer transition-colors"
                                      onClick={() => handlePlaylistSelect(playlist)}
                                    >
                                      <div className="bg-muted border rounded-md w-16 h-16 flex items-center justify-center flex-shrink-0">
                                        <Music className="h-6 w-6 text-muted-foreground" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold truncate">{playlist.name}</h4>
                                        <p className="text-sm text-muted-foreground truncate">
                                          {playlist.description || 'No description'}
                                        </p>
                                        <div className="flex items-center mt-1 text-xs text-muted-foreground">
                                          <span>
                                            {playlist.item_count || 0} tracks
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </ScrollArea>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </MainLayout>
      </div>
    );
  }

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
          {audioPlayerPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
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
      {(track.name || track.artist) && (
        <div className="p-3 sm:p-4">
          <div className="flex items-center gap-3 min-w-0">
            {track.artwork && (
              <div className="relative flex-shrink-0">
                {!imageLoaded && (
                  <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-lg h-10 w-10 sm:h-12 sm:w-12" />
                )}
                <img 
                  src={track.artwork} 
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

        <div className="flex items-center justify-center gap-2 mt-4">
          <Button 
            variant="ghost" 
            size="icon"
            className="h-8 w-8 hidden xs:flex"
            title="Previous"
            onClick={playPrevious}
            disabled={!canPlayPrevious()}
          >
            <SkipBack className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="default" 
            size="icon" 
            onClick={togglePlay}
            className="h-12 w-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground"
            title={audioPlayerPlaying ? "Pause" : "Play"}
            disabled={!track.src}
          >
            {audioPlayerPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon"
            className="h-8 w-8 hidden xs:flex"
            title="Next"
            onClick={playNext}
            disabled={!canPlayNext()}
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>

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
                          className={cn("h-8 w-8", queue.shuffle && "text-primary")}
                          onClick={toggleShuffle}
                          title="Shuffle"
                        >
                          <Shuffle className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className={cn("h-8 w-8", queue.repeat !== 'none' && "text-primary", queue.repeat === 'one' && "text-gold")}
                          onClick={handleRepeatToggle}
                          title={
                            queue.repeat === 'none' ? 'Repeat Off' : 
                            queue.repeat === 'all' ? 'Repeat Playlist' : 
                            'Repeat One'
                          }
                        >
                          {queue.repeat === 'one' ? (
                            <Repeat1 className="h-4 w-4" />
                          ) : (
                            <Repeat className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={toggleMute} 
                          className="h-8 w-8"
                          title={isMuted ? "Unmute" : "Mute"}
                        >
                          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                        </Button>
                        <div className="flex-1 max-w-24">
                          <Slider
                            value={[isMuted ? 0 : (volume * 100)]} 
                            max={100}
                            step={1}
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
                  className={cn("h-8 w-8", queue.shuffle && "text-primary")}
                  onClick={toggleShuffle}
                  title="Shuffle"
                >
                  <Shuffle className="h-4 w-4" />
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={cn("h-8 w-8", queue.repeat !== 'none' && "text-primary", queue.repeat === 'one' && "text-gold")}
                  onClick={handleRepeatToggle}
                  title={
                    queue.repeat === 'none' ? 'Repeat Off' : 
                    queue.repeat === 'all' ? 'Repeat Playlist' : 
                    'Repeat One'
                  }
                >
                  {queue.repeat === 'one' ? (
                    <Repeat1 className="h-4 w-4" />
                  ) : (
                    <Repeat className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={toggleMute} 
                  className="h-8 w-8"
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
                
                <div className="w-20 lg:w-24">
                  <Slider
                    value={[isMuted ? 0 : (volume * 100)]} 
                    max={100}
                    step={1}
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
