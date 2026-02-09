import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from '@/lib/supabase/singleton';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useAudioPlayer } from "@/context/AudioPlayerContext";
import {
  Search,
  Plus,
  Filter,
  Music,
  Play,
  Share,
  Heart,
  Calendar,
  Clock,
  LayoutGrid,
  List,
  Star,
  CheckCircle,
  TrendingUp,
  Upload,
} from "lucide-react";
import AudioPlayer from "@/components/media/AudioPlayer";
import { canAccessContent, AccessLevel } from "@/lib/contentAccess";
import MainLayout from "@/components/layout/MainLayout";
import { Helmet } from "react-helmet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AnimatedList from "@/components/tracks/AnimatedList";
import ChromaGrid from "@/components/tracks/ChromaGrid";
import CountUp from "@/components/tracks/CountUp";
import { ResponsiveImage } from "@/components/ui/responsive-image";
import { useNavigate } from "react-router-dom";
import { PlaylistActions } from "@/components/playlists/PlaylistActions";
import { ScrollArea } from "@/components/ui/scroll-area";
import EnhancedAnimatedList from "@/components/tracks/EnhancedAnimatedList";
import TiltedCard from "@/components/tracks/TiltedCard";
import { convertTrackToAudioTrack } from "@/lib/audioUtils";

interface Track {
  id: string;
  title: string;
  description: string | null;
  audio_path: string | null;
  alternate_audio_path: string | null;
  cover_path: string | null;
  access_level: string | null;
  user_id: string | null;
  approved: boolean | null;
  created_at: string;
  artist: string | null;
  profiles?: {
    avatar_url: string;
  };
  duration: number | null;
  youtube_url: string | null;
  preview_url: string | null;
  video_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  background_gradient: string | null;
  slug: string | null;
  is_favorite?: boolean;
}

interface Playlist {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

interface FeaturedTrack {
  id: string;
  imageSrc: string;
  title: string;
  artist: string;
  plays: number;
  likes: number;
  audioSrc: string;
  description?: string;
  youtube_url?: string;
  slug?: string;
}

const Tracks = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { playbackHistory } = useAudioPlayer();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [featuredTrack, setFeaturedTrack] = useState<FeaturedTrack | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [artists, setArtists] = useState<any[]>([]);

  // Upload form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [accessLevel, setAccessLevel] = useState<AccessLevel>("free");
  const [uploading, setUploading] = useState(false);

  const navigate = useNavigate();
  const channelRef = useRef<any>(null);
  const isFetchingRef = useRef(false);
  const subscriptionRef = useRef(false);

  // Get image URL utility
  const getImageUrl = useCallback((path: string | null | undefined): string => {
    if (!path) return '/default-cover.jpg';
    if (path.startsWith('http')) return path;
    return supabase.storage.from('tracks').getPublicUrl(path).data.publicUrl;
  }, []);

  // Get audio URL utility
  const getAudioUrl = useCallback((track: Track): string => {
    if (track.alternate_audio_path) {
      return track.alternate_audio_path.startsWith('http')
        ? track.alternate_audio_path
        : supabase.storage.from('tracks').getPublicUrl(track.alternate_audio_path).data.publicUrl;
    }

    if (track.audio_path.startsWith('http')) {
      return track.audio_path;
    }

    return supabase.storage.from('tracks').getPublicUrl(track.audio_path).data.publicUrl;
  }, []);

  // Fetch playlists
  const fetchPlaylists = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('playlists')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching playlists:', error);
        return;
      }

      if (data) {
        setPlaylists(data);
      }
    } catch (error) {
      console.error('Error fetching playlists:', error);
    }
  }, [user]);

  // Fetch all artists from the dedicated table
  const fetchArtists = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('artists')
        .select('*')
        .order('name');

      if (error) throw error;
      if (data) {
        setArtists(data.map(a => ({
          id: a.id,
          title: a.name,
          subtitle: a.genre?.join(', ') || 'Artist',
          image: a.profile_image_url || '/default-artist.jpg',
          slug: a.slug,
          handle: `@${a.slug || a.id.substring(0, 8)}`
        })));
      }
    } catch (error) {
      console.error('Error fetching artists:', error);
    }
  }, []);

  // Fetch featured track with proper error handling
  const fetchFeaturedTrack = useCallback(async () => {
    try {
      const { data: trackData, error: trackError } = await supabase
        .from('tracks')
        .select(`
          id,
          title,
          audio_path,
          alternate_audio_path,
          cover_path,
          description,
          created_at,
          artist,
          youtube_url,
          slug,
          user_id
        `)
        .eq('approved', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (trackError) {
        console.error('Error fetching featured track:', trackError);
        setFeaturedTrack(null);
        return;
      }

      if (!trackData) {
        setFeaturedTrack(null);
        return;
      }

      // Check if user can access this track - access_level might be missing, default to 'free'
      const trackAccessLevel = (trackData as any).access_level || 'free';
      const canAccess = canAccessContent(
        trackAccessLevel as AccessLevel,
        user,
        user?.subscriptionTier
      );

      if (!canAccess) {
        setFeaturedTrack(null);
        return;
      }

      // Fetch counts in parallel
      const [playCountResult, likeCountResult] = await Promise.all([
        supabase
          .from('track_plays')
          .select('*', { count: 'exact', head: true })
          .eq('track_id', trackData.id),
        supabase
          .from('likes')
          .select('*', { count: 'exact', head: true })
          .eq('track_id', trackData.id)
      ]);

      const playCount = playCountResult.count || 0;
      const likeCount = likeCountResult.count || 0;

      // Create a Track-compatible object for getAudioUrl
      const trackWithDefaults = {
        ...trackData,
        access_level: trackAccessLevel,
        approved: true
      } as Track;

      const audioUrl = getAudioUrl(trackWithDefaults);
      const coverUrl = getImageUrl(trackData.cover_path);

      setFeaturedTrack({
        id: trackData.id,
        slug: trackData.slug || trackData.id,
        imageSrc: coverUrl,
        title: trackData.title,
        artist: trackData.artist || "Unknown Artist",
        plays: playCount,
        likes: likeCount,
        audioSrc: audioUrl,
        description: trackData.description,
        youtube_url: trackData.youtube_url
      });
    } catch (error) {
      console.error('Error in fetchFeaturedTrack:', error);
      setFeaturedTrack(null);
    }
  }, [user, getAudioUrl, getImageUrl]);

  // Fetch all tracks with proper filtering
  const fetchTracks = useCallback(async () => {
    if (isFetchingRef.current) return;

    isFetchingRef.current = true;

    try {
      const { data, error } = await supabase
        .from('tracks')
        .select(`
          id,
          title,
          description,
          audio_path,
          alternate_audio_path,
          cover_path,
          access_level,
          user_id,
          approved,
          created_at,
          artist,
          duration,
          youtube_url,
          preview_url,
          video_url,
          primary_color,
          secondary_color,
          background_gradient,
          slug
        `)
        .eq('approved', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase Error Details:', error);
        throw error;
      }

      // Fetch user favorites if logged in
      let favoriteIds: string[] = [];
      if (user) {
        const { data: favoritesData } = await supabase
          .from('favorites')
          .select('content_id')
          .eq('user_id', user.id)
          .eq('content_type', 'track');
        favoriteIds = (favoritesData || []).map(f => f.content_id);
      }

      // Filter tracks based on user access - handle missing access_level
      const accessibleTracks = (data || []).filter((track: any) => {
        const accessLevel = track.access_level || 'free';
        return canAccessContent(accessLevel as AccessLevel, user, user?.subscriptionTier);
      }).map((track: any) => ({
        ...track,
        access_level: track.access_level || 'free',
        approved: track.approved ?? true,
        is_favorite: favoriteIds.includes(track.id)
      })) as Track[];

      setTracks(accessibleTracks);
    } catch (error) {
      console.error('Error fetching tracks:', error);
      toast({
        title: "Error",
        description: "Failed to load tracks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [user, toast]);

  // Initialize data fetching
  const initializeData = useCallback(async () => {
    setLoading(true);

    try {
      await Promise.all([
        fetchTracks(),
        fetchFeaturedTrack(),
        fetchPlaylists(),
        fetchArtists()
      ]);
    } catch (error) {
      console.error('Error initializing data:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchTracks, fetchFeaturedTrack, fetchPlaylists]);

  // Setup real-time subscriptions
  const setupSubscriptions = useCallback(() => {
    if (subscriptionRef.current || channelRef.current) return;

    subscriptionRef.current = true;

    // Create a single channel for all subscriptions
    const channel = supabase
      .channel('tracks-page-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tracks',
          filter: `approved=eq.true`
        },
        async (payload) => {
          // Debounce updates - only process every 2 seconds
          await new Promise(resolve => setTimeout(resolve, 2000));

          if (payload.eventType === 'INSERT') {
            const newTrack = payload.new as Track;
            // Check if user can access the new track
            const canAccess = canAccessContent(
              newTrack.access_level as AccessLevel,
              user,
              user?.subscriptionTier
            );

            if (canAccess) {
              setTracks(prev => {
                const exists = prev.some(t => t.id === newTrack.id);
                if (exists) return prev;
                return [newTrack, ...prev];
              });

              // Update featured track if needed
              if (!featuredTrack) {
                fetchFeaturedTrack();
              }
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedTrack = payload.new as Track;
            const oldTrack = payload.old as Track;

            // Check if access level changed
            if (updatedTrack.access_level !== oldTrack.access_level) {
              const canAccess = canAccessContent(
                updatedTrack.access_level as AccessLevel,
                user,
                user?.subscriptionTier
              );

              if (canAccess) {
                setTracks(prev => prev.map(t =>
                  t.id === updatedTrack.id ? updatedTrack : t
                ));
              } else {
                setTracks(prev => prev.filter(t => t.id !== updatedTrack.id));
              }
            } else {
              setTracks(prev => prev.map(t =>
                t.id === updatedTrack.id ? updatedTrack : t
              ));
            }

            // Update featured track if it's the featured one
            if (featuredTrack?.id === updatedTrack.id) {
              fetchFeaturedTrack();
            }
          } else if (payload.eventType === 'DELETE') {
            const deletedTrack = payload.old as Track;
            setTracks(prev => prev.filter(t => t.id !== deletedTrack.id));

            // Update featured track if it was deleted
            if (featuredTrack?.id === deletedTrack.id) {
              fetchFeaturedTrack();
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'playlists',
          filter: user ? `user_id=eq.${user.id}` : undefined
        },
        () => {
          // Debounce playlist updates
          setTimeout(fetchPlaylists, 1000);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Subscribed to tracks changes');
        }
      });

    channelRef.current = channel;
  }, [user, featuredTrack, fetchFeaturedTrack, fetchPlaylists]);

  // Effect for initial data loading
  useEffect(() => {
    initializeData();

    // Cleanup function
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      subscriptionRef.current = false;
    };
  }, [initializeData]);

  // Effect for setting up subscriptions after initial load
  useEffect(() => {
    if (!loading && !channelRef.current) {
      // Small delay before setting up subscriptions to avoid race conditions
      const timeoutId = setTimeout(() => {
        setupSubscriptions();
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [loading, setupSubscriptions]);

  // Track play function
  const trackPlay = useCallback(async (trackId: string) => {
    if (!trackId || !user) return;

    try {
      await supabase.from('track_plays').insert({
        track_id: trackId,
        user_id: user.id
      });
    } catch (error) {
      console.error('Error tracking play:', error);
    }
  }, [user]);

  // Handle play now for featured track
  const handlePlayNow = useCallback(() => {
    if (!featuredTrack) return;

    if (featuredTrack.id) {
      trackPlay(featuredTrack.id);
    }

    navigate(featuredTrack.slug
      ? `/tracks/${featuredTrack.slug}`
      : `/tracks/${featuredTrack.id}`
    );
  }, [featuredTrack, navigate, trackPlay]);

  // Handle track selection
  const handleTrackSelect = useCallback((track: Track) => {
    if (track.id) {
      trackPlay(track.id);
    }

    navigate(track.slug
      ? `/tracks/${track.slug}`
      : `/tracks/${track.id}`
    );
  }, [navigate, trackPlay]);

  // Handle upload
  const handleUpload = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to upload tracks",
        variant: "destructive",
      });
      return;
    }

    if (!audioFile || !title.trim()) {
      toast({
        title: "Missing Information",
        description: "Audio file and title are required",
        variant: "destructive",
      });
      return;
    }

    const allowedAudioTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/m4a'];
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/jpg'];

    if (!allowedAudioTypes.includes(audioFile.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a valid audio file (MP3, WAV, M4A)",
        variant: "destructive",
      });
      return;
    }

    if (coverFile && !allowedImageTypes.includes(coverFile.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a valid image file (JPEG, PNG)",
        variant: "destructive",
      });
      return;
    }

    if (audioFile.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Audio file must be less than 10MB",
        variant: "destructive",
      });
      return;
    }

    if (coverFile && coverFile.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Cover image must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const sanitizedAudioName = `${user.id}/${Date.now()}-${audioFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const { data: audioData, error: audioError } = await supabase.storage
        .from('tracks')
        .upload(sanitizedAudioName, audioFile);

      if (audioError) throw audioError;

      let coverPath = null;
      if (coverFile) {
        const sanitizedCoverName = `${user.id}/${Date.now()}-${coverFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const { data: coverData, error: coverError } = await supabase.storage
          .from('tracks')
          .upload(sanitizedCoverName, coverFile);

        if (coverError) throw coverError;
        coverPath = coverData.path;
      }

      const { error: dbError } = await supabase
        .from('tracks')
        .insert({
          title: title.trim(),
          description: description.trim(),
          audio_path: audioData.path,
          cover_path: coverPath,
          access_level: accessLevel,
          user_id: user.id,
          youtube_url: youtubeUrl || null,
          approved: false // Uploads need approval
        });

      if (dbError) throw dbError;

      toast({
        title: "Upload Successful!",
        description: "Your track has been uploaded and is pending approval.",
      });

      // Reset form
      setTitle('');
      setDescription('');
      setAudioFile(null);
      setCoverFile(null);
      setYoutubeUrl('');
      setAccessLevel('free');
      setShowUpload(false);

      // Refresh data
      setTimeout(() => {
        fetchTracks();
        fetchFeaturedTrack();
      }, 1000);

    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload track. Please try again.';
      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  // Filter tracks based on search
  const filteredTracks = tracks.filter(track =>
    track.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (track.artist && track.artist.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Artists are now fetched from the dedicated artists table

  // Prepare cover tracks for display
  const coverTracks = tracks
    .filter(track => track.cover_path && track.approved && track.youtube_url)
    .map(track => ({
      id: track.id,
      image: getImageUrl(track.cover_path),
      title: track.title,
      subtitle: track.description?.substring(0, 30) + (track.description && track.description.length > 30 ? '...' : ''),
      handle: track.artist || '@unknown',
      borderColor: track.primary_color || '#5A270F',
      gradient: track.background_gradient || 'linear-gradient(145deg, #5A270F, #000)',
      audioUrl: getAudioUrl(track),
      duration: track.duration ?
        `${Math.floor(track.duration / 60)}:${(track.duration % 60).toString().padStart(2, '0')}` : '0:00',
      previewUrl: track.preview_url || '',
      videoUrl: track.video_url || '',
      youtubeUrl: track.youtube_url || '',
      primaryColor: track.primary_color || '#5A270F',
      secondaryColor: track.secondary_color || '#8B4513',
      backgroundGradient: track.background_gradient || 'linear-gradient(145deg, #5A270F 0%, #8B4513 50%, #000 100%)',
    }));

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <Music className="h-12 w-12 animate-spin mx-auto mb-4 text-gold" />
            <p>Loading tracks...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <>
      <Helmet>
        <title>Tracks - Saem's Tunes</title>
        <meta name="description" content="Discover and share amazing music tracks on Saem's Tunes" />
      </Helmet>

      <MainLayout>
        <div className="min-h-screen bg-background pb-20 lg:pb-0 overflow-x-hidden">
          <div className="w-full max-w-full px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Tracks</h1>
                <p className="text-muted-foreground">Discover and share amazing music</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                <div className="relative max-w-md w-full">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tracks, artists..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>

                {user && (
                  <Button
                    onClick={() => setShowUpload(!showUpload)}
                    className="bg-gold hover:bg-gold/90"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Track
                  </Button>
                )}
              </div>
            </div>

            {showUpload && user && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Upload Your Track
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    placeholder="Track title *"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={100}
                  />

                  <Textarea
                    placeholder="Description (optional)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={500}
                  />

                  <Input
                    placeholder="YouTube URL (optional)"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    type="url"
                  />

                  <Select value={accessLevel} onValueChange={(value: AccessLevel) => setAccessLevel(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Access level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free - Everyone can listen</SelectItem>
                      <SelectItem value="auth">Sign In Required</SelectItem>
                      <SelectItem value="basic">Basic Subscribers</SelectItem>
                      <SelectItem value="premium">Premium Subscribers</SelectItem>
                      <SelectItem value="professional">Professional Only</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Audio File * (Max 10MB)</label>
                    <Input
                      type="file"
                      accept="audio/mp3,audio/wav,audio/mpeg,audio/m4a,audio/aac"
                      onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Cover Image (Max 5MB)</label>
                    <Input
                      type="file"
                      accept="image/jpeg,image/png,image/jpg"
                      onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleUpload}
                      disabled={uploading || !title.trim() || !audioFile}
                      className="bg-gold hover:bg-gold/90"
                    >
                      {uploading ? (
                        <>
                          <Clock className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Track
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowUpload(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Tabs defaultValue="showcase" className="w-full">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
                <div className="overflow-x-auto pb-2 scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0 flex-1 w-full">
                  <TabsList className="inline-flex w-auto min-w-max bg-background/50 backdrop-blur-md border border-white/10 p-1 rounded-xl">
                    <TabsTrigger value="showcase" className="rounded-lg data-[state=active]:bg-gold data-[state=active]:text-black">Showcase</TabsTrigger>
                    <TabsTrigger value="featured" className="rounded-lg data-[state=active]:bg-gold data-[state=active]:text-black">Featured</TabsTrigger>
                    <TabsTrigger value="covers" className="rounded-lg data-[state=active]:bg-gold data-[state=active]:text-black">Covers</TabsTrigger>
                    <TabsTrigger value="playlists" className="rounded-lg data-[state=active]:bg-gold data-[state=active]:text-black">Playlists</TabsTrigger>
                    <TabsTrigger value="artists" className="rounded-lg data-[state=active]:bg-gold data-[state=active]:text-black">Artists</TabsTrigger>
                    <TabsTrigger value="community" className="rounded-lg data-[state=active]:bg-gold data-[state=active]:text-black">Community</TabsTrigger>
                    <TabsTrigger value="favourites" className="rounded-lg data-[state=active]:bg-gold data-[state=active]:text-black">Favourites</TabsTrigger>
                    <TabsTrigger value="recents" className="rounded-lg data-[state=active]:bg-gold data-[state=active]:text-black">Recents</TabsTrigger>
                  </TabsList>
                </div>

                <div className="bg-white/5 backdrop-blur-md border border-white/10 p-1 rounded-xl flex self-end sm:self-auto">
                  <Button
                    variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className={cn("rounded-lg h-9 w-10 p-0", viewMode === 'grid' && "bg-gold text-black hover:bg-gold/90")}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className={cn("rounded-lg h-9 w-10 p-0", viewMode === 'list' && "bg-gold text-black hover:bg-gold/90")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <TabsContent value="showcase" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-2 mb-6">
                  <Music className="h-6 w-6 text-gold" />
                  <h2 className="text-2xl font-bold">Music Showcase</h2>
                </div>

                <div className={cn(
                  "grid gap-6",
                  viewMode === 'grid' ? "grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
                )}>
                  {filteredTracks.length === 0 ? (
                    <Card className="bg-white/5 border-white/10 col-span-full">
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <Music className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No tracks found</h3>
                        <p className="text-muted-foreground text-center">
                          {searchTerm ? `No tracks matching "${searchTerm}"` : "Try uploading your first track!"}
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    filteredTracks.map((track) => (
                      <TrackCard
                        key={track.id}
                        track={track}
                        user={user}
                        layout={viewMode}
                      />
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="favourites" className="space-y-8">
                <div className="flex items-center gap-2 mb-6">
                  <Heart className="h-6 w-6 text-gold" />
                  <h2 className="text-2xl font-bold">Your Favourites</h2>
                </div>
                {/* Implementation similar to showcase but filtered for favourites */}
                <div className={cn(
                  "grid gap-6",
                  viewMode === 'grid' ? "grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
                )}>
                  {tracks.filter(t => t.is_favorite).length === 0 ? (
                    <Card className="bg-white/5 border-white/10 col-span-full">
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <Heart className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No favourites yet</h3>
                        <p className="text-muted-foreground text-center">
                          Tap the heart icon on any track to save it here!
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    tracks.filter(t => t.is_favorite).map((track) => (
                      <TrackCard key={track.id} track={track} user={user} layout={viewMode} />
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="recents" className="space-y-8">
                <div className="flex items-center gap-2 mb-6">
                  <Clock className="h-6 w-6 text-gold" />
                  <h2 className="text-2xl font-bold">Recently Played</h2>
                </div>
                <div className={cn(
                  "grid gap-6",
                  viewMode === 'grid' ? "grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
                )}>
                  {tracks.filter(t => playbackHistory.includes(t.id)).length === 0 ? (
                    <Card className="bg-white/5 border-white/10 col-span-full w-full">
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No recently played tracks</h3>
                        <p className="text-muted-foreground text-center">
                          Start listening to tracks and they'll appear here!
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    tracks
                      .filter(t => playbackHistory.includes(t.id))
                      .sort((a, b) => playbackHistory.indexOf(b.id) - playbackHistory.indexOf(a.id))
                      .map((track) => (
                        <TrackCard
                          key={track.id}
                          track={track}
                          user={user}
                          layout={viewMode}
                        />
                      ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="featured" className="space-y-8 w-full max-w-full overflow-hidden">
                {featuredTrack ? (
                  <section>
                    <div className="flex items-center gap-2 mb-6">
                      <Star className="h-6 w-6 text-gold" />
                      <h2 className="text-2xl font-bold">Featured Track of the Week</h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 lg:gap-8 items-center">
                      <div className="flex justify-center relative order-2 md:order-1 w-full overflow-visible py-4">
                        <div className="hover:z-[9999] relative transition-all duration-300 w-[260px] sm:w-[320px] md:w-[380px] aspect-square">
                          <TiltedCard
                            imageSrc={featuredTrack.imageSrc}
                            altText="Featured Track Cover"
                            captionText={featuredTrack.title}
                            containerHeight="100%"
                            containerWidth="100%"
                            rotateAmplitude={12}
                            scaleOnHover={1.1}
                            showMobileWarning={false}
                            showTooltip={true}
                            displayOverlayContent={true}
                            overlayContent={<p className="text-white font-bold text-lg">{featuredTrack.title}</p>}
                            onClick={handlePlayNow}
                          />
                        </div>
                      </div>

                      <div className="space-y-4 order-1 md:order-2 text-center md:text-left">
                        <h3 className="text-xl font-semibold">{featuredTrack.title}</h3>
                        <p className="text-muted-foreground">
                          {featuredTrack.description}
                        </p>

                        <div className="flex gap-8 justify-center md:justify-start">
                          <div className="text-center">
                            <div className="flex items-center gap-2 justify-center">
                              <Play className="h-4 w-4" />
                              <CountUp
                                to={featuredTrack.plays}
                                separator=","
                                className="text-2xl font-bold text-gold"
                              />
                            </div>
                            <p className="text-sm text-muted-foreground">Plays</p>
                          </div>

                          <div className="text-center">
                            <div className="flex items-center gap-2 justify-center">
                              <Heart className="h-4 w-4" />
                              <CountUp
                                to={featuredTrack.likes}
                                separator=","
                                className="text-2xl font-bold text-gold"
                              />
                            </div>
                            <p className="text-sm text-muted-foreground">Likes</p>
                          </div>
                        </div>

                        <Button
                          className="bg-gold hover:bg-gold/90 w-full md:w-auto"
                          onClick={handlePlayNow}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Play Now
                        </Button>
                      </div>
                    </div>
                  </section>
                ) : (
                  <section>
                    <div className="flex items-center gap-2 mb-6">
                      <Star className="h-6 w-6 text-gold" />
                      <h2 className="text-2xl font-bold">No Featured Track</h2>
                    </div>
                    <p className="text-muted-foreground">No featured track available. Check back later!</p>
                  </section>
                )}

                <section className="w-full overflow-hidden">
                  <div className="flex items-center gap-2 mb-6">
                    <TrendingUp className="h-6 w-6 text-gold" />
                    <h2 className="text-2xl font-bold">Suggested For You</h2>
                  </div>

                  <Card className="w-full overflow-hidden">
                    <CardHeader className="pb-2">
                      <CardTitle>Recommended Tracks</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 sm:p-6 sm:pt-0">
                      <ScrollArea className="h-[400px] w-full">
                        <div className="w-full overflow-hidden px-4 sm:px-0">
                          <EnhancedAnimatedList
                            tracks={filteredTracks.slice(0, 10).map(convertTrackToAudioTrack)}
                            onTrackSelect={(track) => {
                              const foundTrack = filteredTracks.find(t => t.id === track.id);
                              if (foundTrack) handleTrackSelect(foundTrack);
                            }}
                          />
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </section>
              </TabsContent>

              <TabsContent value="covers" className="space-y-8">
                <div className="flex items-center gap-2 mb-6">
                  <Music className="h-6 w-6 text-gold" />
                  <h2 className="text-2xl font-bold">Featured Covers</h2>
                </div>

                {coverTracks.length > 0 ? (
                  <div className="w-full overflow-hidden">
                    <ChromaGrid
                      items={coverTracks}
                      radius={300}
                      damping={0.45}
                      fadeOut={0.6}
                      ease="power3.out"
                    />
                  </div>
                ) : (
                  <p className="text-muted-foreground">No cover tracks available yet</p>
                )}
              </TabsContent>

              <TabsContent value="playlists" className="space-y-8">
                <div className="flex items-center gap-2 mb-6">
                  <Music className="h-6 w-6 text-gold" />
                  <h2 className="text-2xl font-bold">Your Playlists</h2>
                </div>

                <div className="grid gap-4">
                  {playlists.map((playlist) => (
                    <Card key={playlist.id} className="w-full max-w-full overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                            <Music className="h-8 w-8 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold truncate">{playlist.name}</h3>
                            <p className="text-sm text-muted-foreground truncate">
                              {playlist.description || 'No description'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Created {new Date(playlist.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Button variant="outline" size="sm" className="mt-2 sm:mt-0">
                            View Playlist
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {playlists.length === 0 && (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <Music className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No playlists yet</h3>
                        <p className="text-muted-foreground text-center mb-4">
                          Create your first playlist to organize your favorite tracks
                        </p>
                        <Button variant="outline">
                          <Plus className="h-4 w-4 mr-2" />
                          Create Playlist
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="artists" className="space-y-8">
                <div className="flex items-center gap-2 mb-6">
                  <Music className="h-6 w-6 text-gold" />
                  <h2 className="text-2xl font-bold">Featured Artists</h2>
                </div>

                {artists.length > 0 ? (
                  <div className="w-full overflow-hidden px-2">
                    <div className="max-w-full">
                      <AnimatedList
                        items={artists.map(a => a.title)}
                        onItemSelect={(title, index) => {
                          const artist = artists[index];
                          if (artist) navigate(`/artists/${artist.slug || artist.id}`);
                        }}
                        showGradients={true}
                        enableArrowNavigation={true}
                        displayScrollbar={true}
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No artists available</p>
                )}
              </TabsContent>

              <TabsContent value="community" className="space-y-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Music className="h-6 w-6 text-gold" />
                    <h2 className="text-2xl font-bold">Community Tracks</h2>
                  </div>
                </div>

                <div className="grid gap-6">
                  <Card className="w-full max-w-full overflow-hidden">
                    <CardHeader>
                      <CardTitle>All Tracks</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[500px] w-full">
                        <EnhancedAnimatedList
                          tracks={filteredTracks.map(convertTrackToAudioTrack)}
                          onTrackSelect={(track) => {
                            const foundTrack = filteredTracks.find(t => t.id === track.id);
                            if (foundTrack) handleTrackSelect(foundTrack);
                          }}
                        />
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </MainLayout>
    </>
  );
};

function TrackCard({ track, user, layout = 'grid' }: { track: Track; user: any; layout?: 'grid' | 'list' }) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [saved, setSaved] = useState(false);
  const { toast } = useToast();
  const { playTrack } = useAudioPlayer();

  const audioUrl = track.audio_path ?
    supabase.storage.from('tracks').getPublicUrl(track.audio_path).data.publicUrl : '';

  const getImageUrl = useCallback((path: string | null | undefined): string => {
    if (!path) return '/default-cover.jpg';
    if (path.startsWith('http')) return path;
    return supabase.storage.from('tracks').getPublicUrl(path).data.publicUrl;
  }, []);

  const coverUrl = getImageUrl(track.cover_path);

  const isValidDatabaseTrack = track.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(track.id);

  useEffect(() => {
    if (user && isValidDatabaseTrack) {
      checkIfLiked();
      checkIfSaved();
      getLikeCount();
    }
  }, [user, track.id, isValidDatabaseTrack]);

  const checkIfLiked = async () => {
    if (!user || !isValidDatabaseTrack) return;

    const { data } = await supabase
      .from('likes')
      .select('*')
      .eq('user_id', user.id)
      .eq('track_id', track.id)
      .single();

    setLiked(!!data);
  };

  const checkIfSaved = async () => {
    if (!user || !isValidDatabaseTrack) return;

    const { data } = await supabase
      .from('favorites')
      .select('*')
      .eq('user_id', user.id)
      .eq('content_id', track.id)
      .eq('content_type', 'track')
      .single();

    setSaved(!!data);
  };

  const getLikeCount = async () => {
    if (!isValidDatabaseTrack) return;

    const { count } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('track_id', track.id);

    setLikeCount(count || 0);
  };

  const toggleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to like tracks",
        variant: "destructive",
      });
      return;
    }

    if (!isValidDatabaseTrack) {
      toast({
        title: "Feature Not Available",
        description: "Likes are not available for this track",
        variant: "destructive",
      });
      return;
    }

    if (liked) {
      await supabase
        .from('likes')
        .delete()
        .eq('user_id', user.id)
        .eq('track_id', track.id);
      setLiked(false);
      setLikeCount(prev => prev - 1);
    } else {
      await supabase
        .from('likes')
        .insert({ user_id: user.id, track_id: track.id });
      setLiked(true);
      setLikeCount(prev => prev + 1);
    }
  };

  const toggleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to save tracks",
        variant: "destructive",
      });
      return;
    }

    if (!isValidDatabaseTrack) {
      toast({
        title: "Feature Not Available",
        description: "Saving is not available for this track",
        variant: "destructive",
      });
      return;
    }

    if (saved) {
      await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('content_id', track.id)
        .eq('content_type', 'track');
      setSaved(false);
    } else {
      await supabase
        .from('favorites')
        .insert({
          user_id: user.id,
          content_id: track.id,
          content_type: 'track'
        });
      setSaved(true);
    }
  };

  const handleShare = async () => {
    const getBaseUrl = () => {
      const hostname = window.location.hostname;

      if (hostname === 'saemstunes.vercel.app') {
        return 'https://saemstunes.vercel.app';
      } else if (hostname === 'saemstunes.lovable.app') {
        return 'https://saemstunes.lovable.app';
      } else {
        return window.location.origin;
      }
    };

    const shareData = {
      title: `${track.title} by ${track.artist || 'Unknown Artist'}`,
      text: `Listen to ${track.title} on Saem's Tunes`,
      url: `${getBaseUrl()}/tracks/${track.id}`,
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
      console.error('Error sharing:', error);
      try {
        await navigator.clipboard.writeText(shareData.url);
        toast({
          title: "Link copied",
          description: "Track link copied to clipboard",
        });
      } catch (clipboardError) {
        toast({
          title: "Sharing Failed",
          description: "Please try again later",
          variant: "destructive",
        });
      }
    }
  };

  const handlePlay = () => {
    if (audioUrl) {
      playTrack({
        id: track.id,
        src: audioUrl,
        name: track.title,
        artist: track.artist || 'Unknown Artist',
        artwork: coverUrl
      });
    }
  };

  if (layout === 'grid') {
    return (
      <Card
        className="overflow-hidden group hover:shadow-lg transition-all duration-300 border-white/5 bg-white/5 cursor-pointer"
        onClick={handlePlay}
      >
        <div className="aspect-square relative overflow-hidden">
          <img
            src={coverUrl}
            alt={track.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="bg-gold rounded-full p-3 text-black">
              <Play className="h-6 w-6 fill-current" />
            </div>
          </div>
          <div className="absolute top-2 right-2 flex flex-col gap-2">
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 rounded-full bg-black/60 backdrop-blur-md border-none text-white"
              onClick={toggleSave}
            >
              <CheckCircle className={cn("h-4 w-4", saved && "text-green-500 fill-green-500")} />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 rounded-full bg-black/60 backdrop-blur-md border-none text-white"
              onClick={toggleLike}
            >
              <Heart className={cn("h-4 w-4", liked && "text-red-500 fill-red-500")} />
            </Button>
          </div>
        </div>
        <CardContent className="p-3">
          <h4 className="font-bold text-sm line-clamp-1">{track.title}</h4>
          <p className="text-xs text-muted-foreground line-clamp-1">By {track.artist || 'Unknown'}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
      onClick={handlePlay}
    >
      <CardContent className="p-3">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-lg overflow-hidden flex-shrink-0">
            <img src={coverUrl} alt={track.title} className="w-full h-full object-cover" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base truncate">{track.title}</h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{track.artist || 'Unknown Artist'}</span>
              <span>•</span>
              <span>{new Date(track.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-gold" onClick={toggleLike}>
              <Heart className={cn("h-4 w-4", liked && "fill-gold text-gold")} />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-gold" onClick={toggleSave}>
              <CheckCircle className={cn("h-4 w-4", saved && "fill-gold text-gold")} />
            </Button>
            <PlaylistActions trackId={track.id} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Tracks;
