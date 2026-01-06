import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from '@/lib/supabase/singleton';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Upload, Play, Heart, Music, CheckCircle, Clock, Star, TrendingUp, Share, Search, Plus } from "lucide-react";
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
import { getImageUrl } from "@/lib/urlUtils";
import { getAudioUrl, getStorageUrl, convertTrackToAudioTrack, generateTrackUrl } from "@/lib/audioUtils";

interface Track {
  id: string;
  title: string;
  description: string;
  audio_path: string;
  alternate_audio_path?: string;
  cover_path?: string;
  access_level: AccessLevel;
  user_id: string;
  approved: boolean;
  created_at: string;
  artist: string | null;
  profiles?: {
    avatar_url: string;
  };
  duration?: number;
  youtube_url?: string;
  preview_url?: string;
  video_url?: string;
  primary_color?: string;
  secondary_color?: string;
  background_gradient?: string;
  slug?: string;
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
  const [tracks, setTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [featuredTrack, setFeaturedTrack] = useState<FeaturedTrack | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [activeTab, setActiveTab] = useState("showcase");
  const [searchTerm, setSearchTerm] = useState('');
  
  // Upload form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [accessLevel, setAccessLevel] = useState<AccessLevel>("free");
  const [uploading, setUploading] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchTracks();
    fetchFeaturedTrack();
    fetchPlaylists();
    
    const channel = supabase
      .channel('tracks-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tracks'
      }, () => {
        fetchTracks();
        fetchFeaturedTrack();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'playlists'
      }, () => {
        fetchPlaylists();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchPlaylists = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('playlists')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setPlaylists(data);
    } catch (error) {
      console.error('Error fetching playlists:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch playlists. Please try again.',
        variant: 'destructive',
      });
    }
  }, [user, toast]);

  const fetchFeaturedTrack = async () => {
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
          slug
        `)
        .eq('approved', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (trackError) throw trackError;

      if (trackData) {
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

        const audioUrl = getAudioUrl(trackData) || '';
        const coverUrl = getImageUrl(trackData.cover_path);

        setFeaturedTrack({
          id: trackData.id,
          slug: trackData.slug,
          imageSrc: coverUrl,
          title: trackData.title,
          artist: trackData.artist || "Unknown Artist",
          plays: playCount,
          likes: likeCount,
          audioSrc: audioUrl,
          description: trackData.description,
          youtube_url: trackData.youtube_url
        });
      }
    } catch (error) {
      console.error('Error fetching featured track:', error);
      setFeaturedTrack(null);
    }
  };

  const getImageUrl = useCallback((path: string | null | undefined): string => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return supabase.storage.from('tracks').getPublicUrl(path).data.publicUrl;
  }, []);

  const fetchTracks = async () => {
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
          slug,
          profiles:user_id (
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase Error Details:', error);
        throw error;
      }
      
      const accessibleTracks = (data || []).filter((track: any) => 
        canAccessContent(track.access_level as AccessLevel, user, user?.subscriptionTier)
      );
      
      setTracks(accessibleTracks as any);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching tracks:', error);
      toast({
        title: "Error",
        description: "Failed to load tracks",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const trackPlay = async (trackId: string) => {
    if (!trackId) return;
    
    try {
      await supabase.from('track_plays').insert({
        track_id: trackId,
        user_id: user?.id || null
      });
    } catch (error) {
      console.error('Error tracking play:', error);
    }
  };

  const handlePlayNow = () => {
    if (!featuredTrack) return;
    
    if (featuredTrack.id) {
      trackPlay(featuredTrack.id);
    }
    
    navigate(featuredTrack.slug 
      ? `/tracks/${featuredTrack.slug}` 
      : `/tracks/${featuredTrack.id}`
    );
  };

  const handleTrackSelect = (track: Track) => {
    navigate(track.slug 
      ? `/tracks/${track.slug}` 
      : `/tracks/${track.id}`
    );
  };

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
          youtube_url: youtubeUrl || null
        });

      if (dbError) throw dbError;

      toast({
        title: "Upload Successful!",
        description: "Your track has been uploaded successfully.",
      });

      setTitle('');
      setDescription('');
      setAudioFile(null);
      setCoverFile(null);
      setYoutubeUrl('');
      setAccessLevel('free');
      setShowUpload(false);
      
      fetchTracks();
      fetchFeaturedTrack();
      
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

  const filteredTracks = tracks.filter(track =>
    track.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (track.artist && track.artist.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const artists = Array.from(
    new Set(tracks.map(track => track.artist).filter(Boolean))
  );

  const coverTracks = tracks.filter(track => 
    track.cover_path && track.approved && track.youtube_url
  ).map(track => ({
    id: track.id,
    image: getImageUrl(track.cover_path), 
    title: track.title,
    subtitle: track.description?.substring(0, 30) + (track.description && track.description.length > 30 ? '...' : ''),
    handle: track.artist || '@unknown',
    borderColor: track.primary_color || '#5A270F',
    gradient: track.background_gradient || 'linear-gradient(145deg, #5A270F, #000)',
    audioUrl: track.audio_path ? 
      supabase.storage.from('tracks').getPublicUrl(track.audio_path).data.publicUrl : '',
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

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full overflow-x-auto">
              <TabsList className="grid w-full grid-cols-5 min-w-[300px]">
                <TabsTrigger value="showcase">Showcase</TabsTrigger>
                <TabsTrigger value="covers">Covers</TabsTrigger>
                <TabsTrigger value="playlists">Playlists</TabsTrigger>
                <TabsTrigger value="artists">Artists</TabsTrigger>
                <TabsTrigger value="community">Community</TabsTrigger>
              </TabsList>

              <TabsContent value="showcase" className="space-y-8">
                {featuredTrack ? (
                  <section>
                    <div className="flex items-center gap-2 mb-6">
                      <Star className="h-6 w-6 text-gold" />
                      <h2 className="text-2xl font-bold">Featured Track of the Week</h2>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-6 lg:gap-8 items-center">
                    <div className="flex justify-center relative order-2 md:order-1">
                      <div className="hover:z-[9999] relative transition-all duration-300 w-full max-w-sm">
                        <TiltedCard
                          imageSrc={featuredTrack.imageSrc}
                          altText="Featured Track Cover"
                          captionText={featuredTrack.title}
                          containerHeight="300px"
                          containerWidth="300px"
                          rotateAmplitude={12}
                          scaleOnHover={1.2}
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
                              <CountUp to={featuredTrack.plays} separator="," className="text-2xl font-bold text-gold" />
                            </div>
                            <p className="text-sm text-muted-foreground">Plays</p>
                          </div>
                          
                          <div className="text-center">
                            <div className="flex items-center gap-2 justify-center">
                              <Heart className="h-4 w-4" />
                              <CountUp to={featuredTrack.likes} separator="," className="text-2xl font-bold text-gold" />
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

                <section>
                  <div className="flex items-center gap-2 mb-6">
                    <TrendingUp className="h-6 w-6 text-gold" />
                    <h2 className="text-2xl font-bold">Suggested For You</h2>
                  </div>
                  
                  <Card className="w-full max-w-full overflow-hidden">
                    <CardHeader>
                      <CardTitle>Recommended Tracks</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[400px] w-full">
                        <EnhancedAnimatedList 
                          tracks={filteredTracks.slice(0, 10).map(convertTrackToAudioTrack)} 
                          onTrackSelect={(track) => handleTrackSelect(filteredTracks.find(t => t.id === track.id)!)}
                        />
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
                        items={artists}
                        onItemSelect={(item) => console.log(item)}
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
                          onTrackSelect={(track) => handleTrackSelect(filteredTracks.find(t => t.id === track.id)!)}
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

const TrackCard = ({ track, user }: { track: Track; user: any }) => {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [saved, setSaved] = useState(false);
  const { toast } = useToast();
  
  const audioUrl = track.audio_path ? 
    supabase.storage.from('tracks').getPublicUrl(track.audio_path).data.publicUrl : '';
  
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

  const toggleLike = async () => {
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
      toast({
        title: "Removed from likes",
        description: "Track removed from your liked songs",
      });
    } else {
      await supabase
        .from('likes')
        .insert({ user_id: user.id, track_id: track.id });
      setLiked(true);
      setLikeCount(prev => prev + 1);
      toast({
        title: "Added to likes",
        description: "Track added to your liked songs",
      });
    }
  };

  const toggleSave = async () => {
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
      toast({
        title: "Removed from saved",
        description: "Track removed from your saved songs",
      });
    } else {
      await supabase
        .from('favorites')
        .insert({ 
          user_id: user.id, 
          content_id: track.id,
          content_type: 'track'
        });
      setSaved(true);
      toast({
        title: "Added to saved",
        description: "Track added to your saved songs",
      });
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

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="h-12 w-12 rounded-full bg-gold/20 flex items-center justify-center">
            {track.cover_path ? (
              <ResponsiveImage 
                src={coverUrl} 
                alt="Artist" 
                width={48}
                height={48}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <Music className="h-6 w-6 text-gold" />
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg">{track.title}</h3>
            </div>
            <p className="text-muted-foreground text-sm">
              by {track.artist || 'Unknown Artist'}
            </p>
            {track.description && (
              <p className="text-sm mt-2">{track.description}</p>
            )}
          </div>
          
          {coverUrl && (
      <ResponsiveImage 
        src={coverUrl} 
        alt="Cover" 
        width={64}
        height={64}
        className="h-16 w-16 rounded object-cover"
        />
      )}
     </div>     

        {audioUrl && (
          <div className="mb-4">
            <AudioPlayer 
              src={audioUrl}
              title={track.title}
              artist={track.artist || 'Unknown Artist'}
              artwork={coverUrl}
              compact={false}
            />
          </div>
        )}

        <div className="flex items-center gap-2">
          <PlaylistActions trackId={track.id} />
          <div className="flex items-center gap-4 flex-wrap">
            {user && isValidDatabaseTrack && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleLike}
                  className="flex items-center gap-2"
                >
                  <Heart className={`h-4 w-4 ${liked ? 'fill-red-500 text-red-500' : ''}`} />
                  {likeCount}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleSave}
                  className="flex items-center gap-2"
                >
                  <CheckCircle className={`h-4 w-4 ${saved ? 'fill-green-500 text-green-500' : ''}`} />
                  {saved ? 'Saved' : 'Save'}
                </Button>
              </>
            )}
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center gap-2"
              onClick={handleShare}
            >
              <Share className="h-4 w-4" />
              Share
            </Button>
            
            <span className="text-xs text-muted-foreground ml-auto">
              {new Date(track.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Tracks;
