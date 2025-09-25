import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ArrowLeft,
  Heart,
  Share,
  MoreHorizontal,
  Download,
  Plus,
  Music,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat
} from 'lucide-react';
import { cn } from '@/lib/utils';
import MainLayout from '@/components/layout/MainLayout';
import { Helmet } from 'react-helmet';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AudioPlayer from '@/components/media/AudioPlayer';
import { ArtistMetadataManager } from '@/components/artists/ArtistMetadataManager';
import { useMediaState } from '@/components/idle-state/mediaStateContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import EnhancedAnimatedList from '@/components/tracks/EnhancedAnimatedList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAudioPlayer } from '@/context/AudioPlayerContext';
import { fetchPlaylistTracks, fetchUserPlaylists } from '@/lib/playlistUtils';
import { getAudioUrl, getStorageUrl, convertTrackToAudioTrack, generateTrackUrl } from '@/lib/audioUtils';
import AddToPlaylistModal from '@/components/playlists/AddToPlaylistModal';
import { AudioTrack } from '@/types/music';

const AudioPlayerPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const [trackData, setTrackData] = useState<AudioTrack | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);
  const { setMediaPlaying } = useMediaState();
  const [showMetadataPrompt, setShowMetadataPrompt] = useState(false);
  const [tracks, setTracks] = useState<AudioTrack[]>([]);
  const [userPlaylists, setUserPlaylists] = useState<any[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<any>(null);
  const [playlistTracks, setPlaylistTracks] = useState<AudioTrack[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  
  const {
    state: playerState,
    playTrack,
    pauseTrack,
    resumeTrack,
    playNext,
    playPrevious,
    toggleShuffle,
    toggleRepeat,
    setPlaylist,
    setCurrentIndex,
  } = useAudioPlayer();

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setMediaPlaying(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [setMediaPlaying]);

  const fetchAllTracks = useCallback(async () => {
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
  }, []);

  const fetchTrackData = useCallback(async (trackSlug: string) => {
    try {
      const existingTrack = tracks.find(t => t.slug === trackSlug || t.id === trackSlug);
      if (existingTrack) {
        setTrackData(existingTrack);
        setLoading(false);
        return;
      }
      
      let { data: trackData, error } = await supabase
        .from('tracks')
        .select('*')
        .eq('slug', trackSlug)
        .single();
      
      if (error && trackSlug) {
        const { data: idData, error: idError } = await supabase
          .from('tracks')
          .select('*')
          .eq('id', trackSlug)
          .single();
        
        if (idError) throw idError;
        trackData = idData;
      }
      
      if (trackData) {
        const newTrack = convertTrackToAudioTrack(trackData);
        setTrackData(newTrack);
        setTracks(prev => [...prev, newTrack]);
        
        if (trackData.slug && trackSlug !== trackData.slug) {
          navigate(generateTrackUrl(newTrack), { replace: true });
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load track data",
        variant: "destructive",
      });
      navigate('/tracks');
    } finally {
      setLoading(false);
    }
  }, [toast, tracks, navigate]);

  useEffect(() => {
    if (trackData && playerState.playlist.length > 0) {
      const index = playerState.playlist.findIndex(t => t.id === trackData.id);
      if (index !== -1) {
        setCurrentIndex(index);
      }
    }
  }, [trackData, playerState.playlist, setCurrentIndex]);

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
      const tracks = await fetchPlaylistTracks(playlistId);
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
    if (user) {
      fetchUserPlaylistsData();
    }
  }, [user, fetchUserPlaylistsData]);

  const handlePlaylistSelect = useCallback((playlist: any) => {
    setSelectedPlaylist(playlist);
    fetchPlaylistTracksData(playlist.id);
    setActiveTab('playlist');
  }, [fetchPlaylistTracksData]);

  useEffect(() => {
    const init = async () => {
      fetchAllTracks();
      
      if (location.state?.track) {
        setTrackData(location.state.track);
        setLoading(false);
      } else if (slug) {
        await fetchTrackData(slug);
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
  }, [slug, location.state, fetchAllTracks, fetchTrackData]);

  const checkIfLiked = useCallback(async () => {
    if (!user || !trackData) return;
    
    const { data } = await supabase
      .from('likes')
      .select('*')
      .eq('user_id', user.id)
      .eq('track_id', String(trackData.id))
      .single();
    
    setIsLiked(!!data);
  }, [user, trackData]);

  const checkIfSaved = useCallback(async () => {
    if (!user || !trackData) return;
    
    const { data } = await supabase
      .from('favorites')
      .select('*')
      .eq('user_id', user.id)
      .eq('content_id', String(trackData.id))
      .eq('content_type', 'track')
      .single();
    
    setIsSaved(!!data);
  }, [user, trackData]);

  useEffect(() => {
    if (user && trackData) {
      checkIfLiked();
      checkIfSaved();
    }
  }, [user, trackData, checkIfLiked, checkIfSaved]);

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

  const toggleSave = useCallback(async () => {
    if (!user) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to save tracks",
        variant: "destructive",
      });
      return;
    }

    if (!trackData) return;
    
    if (isSaved) {
      await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('content_id', String(trackData.id))
        .eq('content_type', 'track');
      setIsSaved(false);
      toast({
        title: "Removed from saved",
        description: "Track removed from your saved songs",
      });
    } else {
      await supabase
        .from('favorites')
        .insert({ 
          user_id: user.id, 
          content_id: String(trackData.id),
          content_type: 'track'
        });
      setIsSaved(true);
      toast({
        title: "Added to saved",
        description: "Track added to your saved songs",
      });
    }
  }, [user, trackData, isSaved, toast]);

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

  const handleDownload = useCallback(() => {
    toast({
      title: "Download feature",
      description: "Download functionality will be available for premium users",
    });
  }, [toast]);

  const handleTrackSelect = useCallback((track: AudioTrack) => {
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
  }, [
    navigate, 
    selectedPlaylist, 
    playlistTracks, 
    tracks, 
    setCurrentIndex, 
    setPlaylist, 
    playTrack
  ]);

  const handleAudioError = useCallback(() => {
    setAudioError(true);
    toast({
      title: "Audio Error",
      description: "Unable to load the audio player. Please try refreshing the page.",
      variant: "destructive",
    });
  }, [toast]);

  const togglePlayPause = useCallback(() => {
    if (!trackData) return;
    
    if (playerState?.isPlaying) {
      pauseTrack();
    } else {
      if (playerState?.currentTrack?.id === trackData.id) {
        resumeTrack();
      } else {
        playTrack({
          id: trackData.id.toString(),
          src: trackData.src,
          name: trackData.name,
          artist: trackData.artist || '',
          artwork: trackData.artwork || '',
        });
      }
    }
  }, [trackData, playerState, playTrack, pauseTrack, resumeTrack]);

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
                              <DropdownMenuItem onClick={toggleSave}>
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
                              
                              <DropdownMenuItem onClick={handleDownload}>
                                <Download className="mr-2 h-4 w-4" />
                                Download
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      {audioError ? (
                        <div className="text-center py-12">
                          <p className="text-muted-foreground mb-4">Unable to load audio player</p>
                          <Button onClick={() => window.location.reload()}>
                            Try Again
                          </Button>
                        </div>
                      ) : (
                        trackData && (
                          <AudioPlayer
                            trackId={String(trackData.id)}
                            src={trackData.src}
                            title={trackData.name}
                            artist={trackData.artist}
                            artwork={trackData.artwork}
                            className="bg-transparent border-0 shadow-none"
                            onError={handleAudioError}
                          />
                        )
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
                                          {playlist.play_count || 0} plays
                                        </span>
                                        <span className="mx-2">•</span>
                                        <span>
                                          {playlist.total_duration 
                                            ? `${Math.floor(playlist.total_duration / 60)} min` 
                                            : '0 min'}
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
};

export default AudioPlayerPage;
