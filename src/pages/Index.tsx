// src/pages/Index.tsx
import React, { useState, useEffect, useRef, useMemo, Suspense } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useAudioPlayer } from "@/context/AudioPlayerContext";
import MainLayout from "@/components/layout/MainLayout";
import DashboardStats from "@/components/dashboard/DashboardStats";
import RecommendedContent from "@/components/dashboard/RecommendedContent";
import UpcomingBookings from "@/components/dashboard/UpcomingBookings";
import SocialMediaContainer from "@/components/social/SocialMediaContainer";
import { CurvedLoop } from "@/components/ui/curved-loop";
import FourPointerSection from "@/components/homepage/FourPointerSection";
import LazyVisionSection from '@/components/LazyVisionSection';
import InstrumentSelector from "@/components/ui/InstrumentSelector";
import MusicToolsCarousel from "@/components/ui/MusicToolsCarousel";
import DotGrid from "@/components/effects/DotGrid";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Helmet } from "react-helmet";
import { 
  Music, PlayCircle, Star, BookOpen, Calendar, 
  Headphones, Heart, Play, Share, RotateCw, 
  Users, TrendingUp, Zap, X, Gift, ArrowRight
} from "lucide-react";
import { ResponsiveImage } from "@/components/ui/responsive-image";
import CountUp from "@/components/tracks/CountUp";
import { motion } from "framer-motion";
import { useWindowSize } from "@uidotdev/usehooks";
import { AudioStorageManager } from "@/utils/audioStorageManager";
import { getAudioUrl, convertTrackToAudioTrack, generateTrackUrl } from "@/lib/audioUtils";
import { supabase } from "@/integrations/supabase/client.ts";

// Constants - PRESERVE ORIGINAL STRUCTURE
const STATS = [
  { icon: TrendingUp, label: "Total Plays", value: 100000 },
  { icon: Users, label: "Community Members", value: 2384 },
  { icon: Music, label: "Original Tracks", value: 7 },
  { icon: Star, label: "Students Taught", value: 20 }
];

const QUICK_ACTIONS = [
  { 
    icon: BookOpen, 
    title: "Learning Hub", 
    smTitle: "Learning Hub",
    narrowTitle: "Learn",
    description: "Access courses, tutorials, and structured learning paths",
    smDescription: "Courses, tutorials & learning paths",
    narrowDescription: "Courses & tutorials",
    cta: "Explore Hub",
    smCta: "Explore",
    narrowCta: "Explore",
    path: "/learning-hub"
  },
  { 
    icon: Calendar, 
    title: "Book Sessions", 
    smTitle: "Book Sessions",
    narrowTitle: "Book",
    description: "Schedule one-on-one lessons with expert instructors",
    smDescription: "Schedule lessons with experts",
    narrowDescription: "Schedule lessons",
    cta: "View Availability",
    smCta: "Schedule",
    narrowCta: "Book",
    path: "/bookings"
  },
  { 
    icon: Users, 
    title: "Join Community", 
    smTitle: "Community",
    narrowTitle: "Connect",
    description: "Connect with fellow musicians and share your journey",
    smDescription: "Connect with fellow musicians",
    narrowDescription: "Musician community",
    cta: "Join Now",
    smCta: "Join",
    narrowCta: "Join",
    path: "/community"
  }
];

const isUuid = (id: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

// User Preferences Service
class UserPreferencesService {
  static async getInstrumentSelectorStatus(userId: string): Promise<{
    shouldShow: boolean;
    viewCount: number;
    lastShown: string | null;
  }> {
    try {
      let { data: prefs, error } = await supabase
        .from('user_ui_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        const { data: newPrefs, error: createError } = await supabase
          .from('user_ui_preferences')
          .insert({ user_id: userId })
          .select()
          .single();

        if (createError) throw createError;
        prefs = newPrefs;
      } else if (error) {
        throw error;
      }

      const shouldShow = this.shouldShowInstrumentSelector(prefs);

      return {
        shouldShow,
        viewCount: prefs.instrument_selector_views,
        lastShown: prefs.last_instrument_selector_shown
      };
    } catch (error) {
      console.error('Error getting instrument selector status:', error);
      throw error;
    }
  }

  static async markInstrumentSelectorShown(userId: string): Promise<void> {
    try {
      const { data: prefs, error: fetchError } = await supabase
        .from('user_ui_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (fetchError) throw fetchError;

      const { error } = await supabase
        .from('user_ui_preferences')
        .upsert({
          user_id: userId,
          instrument_selector_views: (prefs?.instrument_selector_views || 0) + 1,
          last_instrument_selector_shown: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error marking instrument selector as shown:', error);
      throw error;
    }
  }

  private static shouldShowInstrumentSelector(prefs: any): boolean {
    if (!prefs.last_instrument_selector_shown) return true;
    
    const lastShown = new Date(prefs.last_instrument_selector_shown);
    const now = new Date();
    const hoursSinceLastShown = (now.getTime() - lastShown.getTime()) / (1000 * 60 * 60);
    
    return hoursSinceLastShown >= 24;
  }
}

// IMPROVED ORIENTATION HOOK
const useWindowOrientation = () => {
  const windowSize = useWindowSize();
  const [orientation, setOrientation] = useState({
    isMobile: false,
    isLandscape: false
  });

  useEffect(() => {
    if (windowSize.width === null || windowSize.height === null) return;
    
    setOrientation({
      isMobile: windowSize.width < 768,
      isLandscape: windowSize.width > windowSize.height
    });
  }, [windowSize]);

  return orientation;
};

// IMPROVED TRACK HANDLING WITH AUDIO STORAGE MANAGER
const useShuffledTracks = (count: number, interval: number) => {
  const [shuffledTracks, setShuffledTracks] = useState<any[]>([]);

  useEffect(() => {
    const shuffleAndSelectTracks = async () => {
      try {
        const tracks = await AudioStorageManager.getShuffledTracks(count);
        setShuffledTracks(tracks);
      } catch (error) {
        console.error('Error fetching shuffled tracks:', error);
        const shuffled = FEATURED_TRACKS.sort(() => 0.5 - Math.random());
        setShuffledTracks(shuffled.slice(0, count));
      }
    };

    shuffleAndSelectTracks();
    
    const id = setInterval(shuffleAndSelectTracks, interval);
    return () => clearInterval(id);
  }, [count, interval]);

  return shuffledTracks;
};

// AUTH-BASED INSTRUMENT SELECTOR HOOK WITH DATABASE INTEGRATION
const useInstrumentSelectorLogic = (user: any) => {
  const [showInstrumentSelector, setShowInstrumentSelector] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (!user) {
      setShowInstrumentSelector(false);
      setIsLoading(false);
      return;
    }

    const checkInstrumentSelectorStatus = async () => {
      try {
        const status = await UserPreferencesService.getInstrumentSelectorStatus(user.id);
        
        const shouldShowBasedOnOrientation = () => {
          const width = window.innerWidth;
          const isMobile = width < 768;
          const isLandscape = 
            window.matchMedia("(orientation: landscape)").matches || 
            window.innerWidth > window.innerHeight;
          return isLandscape || isMobile;
        };

        const finalShouldShow = status.shouldShow && shouldShowBasedOnOrientation();
        setShowInstrumentSelector(finalShouldShow);
        
        const sessionKey = `instrument_selector_shown_${user.id}`;
        sessionStorage.setItem(sessionKey, status.shouldShow ? 'false' : 'true');
        sessionStorage.setItem(`instrument_selector_count_${user.id}`, status.viewCount.toString());
      } catch (error) {
        console.error('Database check failed, falling back to sessionStorage:', error);
        const sessionKey = `instrument_selector_shown_${user.id}`;
        const hasSeenThisSession = sessionStorage.getItem(sessionKey);
        
        if (!hasSeenThisSession) {
          const width = window.innerWidth;
          const isMobile = width < 768;
          const isLandscape = 
            window.matchMedia("(orientation: landscape)").matches || 
            window.innerWidth > window.innerHeight;
          
          setShowInstrumentSelector(isLandscape || isMobile);
        } else {
          setShowInstrumentSelector(false);
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkInstrumentSelectorStatus();
  }, [user]);

  const markInstrumentSelectorAsShown = async () => {
    if (!user) return;

    try {
      await UserPreferencesService.markInstrumentSelectorShown(user.id);
    } catch (error) {
      console.error('Failed to mark as shown in database, using sessionStorage only:', error);
    }

    const sessionKey = `instrument_selector_shown_${user.id}`;
    sessionStorage.setItem(sessionKey, 'true');
    setShowInstrumentSelector(false);
  };

  useEffect(() => {
    const cleanup = () => {
      const keys = Object.keys(sessionStorage);
      keys.forEach(key => {
        if (key.startsWith('instrument_selector_') && (!user || !key.includes(user.id))) {
          sessionStorage.removeItem(key);
        }
      });
    };

    cleanup();
  }, [user?.id]);

  return {
    showInstrumentSelector,
    isLoading,
    markInstrumentSelectorAsShown
  };
};

// IMPROVED HERO BUTTON TEXT
const HomeHero = ({ onExploreTracks, onTryTools }: { onExploreTracks: () => void; onTryTools: () => void }) => {
  return (
    <motion.section 
      className="relative text-center space-y-4 py-8 sm:py-12 h-screen flex items-center justify-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="absolute top-0 left-0 w-screen h-full z-0 pointer-events-none">
        <div className="w-full h-full 
            [mask-image:radial-gradient(ellipse_at_center,black_70%,transparent_100%)]
            [-webkit-mask-image:radial-gradient(ellipse_at_center,black_70%,transparent_100%)]
            [mask-size:100%_100%]
            [-webkit-mask-size:100%_100%]
            [mask-repeat:no-repeat]
            [-webkit-mask-repeat:no-repeat]">
          <DotGrid
            dotSize={7}
            gap={22.5}
            lightBaseColor="#f5f2e6"
            lightActiveColor="#A67C00"
            darkBaseColor="#3a2e2e"
            darkActiveColor="#A67C00"
            proximity={80}
            shockRadius={80}
            shockStrength={2.5}
            resistance={1200}
            returnDuration={1.5}
            velocityMultiplier={0.001}
            className="w-full h-full"
            idleWaveInterval={7500} 
            waveAmplitude={1.2} 
            waveSpeed={0.8} 
          />
        </div>
      </div>
      
      <div className="relative z-10 max-w-4xl mx-auto px-4">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4 sm:mb-6">
          Welcome to{" "}
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Saem's Tunes
          </span>
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed">
          Your musical journey starts here. Discover amazing tracks, learn instruments, 
          and embark on learning music with ease.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <Button 
            size="lg" 
            onClick={onExploreTracks}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 sm:px-8 group"
          >
            <Music className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
            Discover Music
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            onClick={onTryTools}
            className="border-primary text-primary hover:bg-primary hover:text-primary-foreground px-6 sm:px-8 group"
          >
            <PlayCircle className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
            Try Music Tools
          </Button>
        </div>
      </div>
    </motion.section>
  );
};

// IMPROVED TRACK CARD WITH ANALYTICS SUPPORT
const TrackCard = ({ track, onPlay, onShare }: { track: any; onPlay: (track: any) => void; onShare: (track: any) => void }) => (
  <Card className="group hover:shadow-lg transition-all duration-300 hover:scale-105">
    <CardContent className="p-4">
      <div className="relative mb-4 aspect-square">
        <img
          src={track.cover_art_url || track.imageSrc}
          alt={track.title}
          className="w-full h-full object-cover rounded-lg"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center">
          <Button
            size="icon"
            className="opacity-0 group-hover:opacity-100 transition-opacity bg-primary hover:bg-primary/90"
            onClick={() => onPlay(track)}
          >
            <Play className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      <div className="space-y-2">
        <h3 className="font-semibold text-foreground line-clamp-1">{track.title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-1">{track.artist}</p>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Headphones className="h-3 w-3" />
              <CountUp to={track.play_count || track.plays || 0} separator="," />
            </span>
            <span className="flex items-center gap-1">
              <Heart className="h-3 w-3" />
              <CountUp to={track.likes || 0} separator="," />
            </span>
          </div>
          
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={() => onShare(track)}
          >
            <Share className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
);

const Index = () => {
  const { user } = useAuth();
  const { state } = useAudioPlayer();
  const navigate = useNavigate();
  
  const { showInstrumentSelector, isLoading, markInstrumentSelectorAsShown } = useInstrumentSelectorLogic(user);

  const currentTrack = state?.currentTrack || null;
  
  const featuredTracks = useShuffledTracks(4, 30000);

  // Preload VisionSection when user interacts with page
  useEffect(() => {
    const preloadOnInteraction = () => {
      import('@/components/homepage/VisionSection');
      document.removeEventListener('mousemove', preloadOnInteraction);
      document.removeEventListener('touchstart', preloadOnInteraction);
    };

    document.addEventListener('mousemove', preloadOnInteraction, { once: true });
    document.addEventListener('touchstart', preloadOnInteraction, { once: true });

    return () => {
      document.removeEventListener('mousemove', preloadOnInteraction);
      document.removeEventListener('touchstart', preloadOnInteraction);
    };
  }, []);

  const handleInstrumentSelect = async (instrument: string) => {
    await markInstrumentSelectorAsShown();
    navigate(`/music-tools?tool=${instrument}`);
  };

  const handleBackToHome = async () => {
    await markInstrumentSelectorAsShown();
  };

  const handlePlayTrack = async (track: any) => {
    const trackUrl = generateTrackUrl(track);
    navigate(trackUrl);

    const identifier = track.slug || (!isUuid(track.id) ? track.id : null);
    if (identifier && user?.id) {
      try {
        await AudioStorageManager.trackPlay(identifier, user.id);
      } catch (error) {
        console.error('Play tracking failed:', error);
      }
    }
  };

  const handleShareTrack = async (track: any) => {
    const shareData = {
      title: `${track.title} by ${track.artist}`,
      text: `Listen to ${track.title} on Saem's Tunes`,
      url: `${window.location.origin}/tracks/${track.id}`,
    };

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  // Memoize the VisionSection to prevent re-renders
  const memoizedVisionSection = useMemo(() => (
    <LazyVisionSection key="vision-section" />
  ), []);
    
  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  if (showInstrumentSelector) {
    return (
      <InstrumentSelector
        onInstrumentSelect={handleInstrumentSelect}
        onBackToHome={handleBackToHome}
      />
    );
  }

  return (
    <>
      <Helmet>
        <title>Saem's Tunes - Your Musical Journey Starts Here</title>
        <meta name="description" content="Discover amazing music, learn instruments, and join our musical community. Practice with interactive tools, explore our tracks, and grow your musical skills." />
      </Helmet>
      
      <MainLayout>
        <div className="min-h-screen bg-background">
          <OrientationHint />

          <div className="w-full max-w-full overflow-x-hidden space-y-6 sm:space-y-8 px-4 sm:px-6">
            <HomeHero 
              onExploreTracks={() => navigate('/tracks')}
              onTryTools={() => navigate('/music-tools')}
            />
            
            <StatsSection />
            
            <FeaturedTracksSection 
              tracks={featuredTracks}
              onPlayTrack={handlePlayTrack}
              onShareTrack={handleShareTrack}
            />

            <QuickActionsSection />
          
            <Suspense fallback={<div className="h-64 bg-muted/20 animate-pulse rounded-lg" />}>
              <FourPointerSection />
            </Suspense>
            
            <section className="py-8 bg-background flex items-center justify-center">
               <div className="container mx-auto px-4 max-w-full xl:max-w-7xl"> 
                <CurvedLoop 
                  marqueeText="I love to sing ✦ It makes me happy, so "
                  speed={2}
                  curveAmount={-330}
                  direction="left"
                  interactive={true}
                  className="fill-brown-dark dark:fill-gold hover:fill-brown dark:hover:fill-gold-light transition-colors duration-300"
                  />
              </div>
            </section>

            {memoizedVisionSection}
            
            <section>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-6">
                Try Our Music Tools
              </h2>
              <div className="overflow-x-hidden py-2">
                <MusicToolsCarousel />
              </div>
            </section>
            
            <SocialMediaContainer />
            
            {user && (
              <div className="overflow-x-auto">
                <DashboardStats role={user?.user_metadata?.role || 'student'} />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                  <RecommendedContent />
                  <UpcomingBookings />
                </div>
              </div>
            )}
            
            <section className="py-12 rounded-xl bg-gradient-to-r 
              from-gold-default/20 via-gold-light/20 to-gold-default/20
              dark:from-gold-dark/10 dark:via-gold-default/10 dark:to-gold-dark/10">
              <div className="max-w-3xl mx-auto text-center px-4">
                <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                  Ready to Begin Your <span className="text-primary">Musical Journey</span>?
                </h2>
                <p className="text-muted-foreground mb-6">
                  Join thousands of music lovers who have found inspiration through our platform.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button 
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 sm:px-8 group"
                    onClick={() => navigate(user ? '/dashboard' : '/signup')}
                  >
                    <Zap className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
                    {user ? 'Go to Dashboard' : 'Get Started'}
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="border-primary text-primary hover:bg-primary hover:text-primary-foreground px-6 sm:px-8 group"
                    onClick={() => navigate('/subscriptions')}
                  >
                    <Star className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
                    View Premium
                  </Button>
                </div>
              </div>
            </section>

            <section className="py-8 bg-background flex items-center justify-center">
              <div className="container mx-auto px-4 max-w-full xl:max-w-7xl">
                <CurvedLoop 
                  marqueeText="I love to sing ✦ It makes me happy, so "
                  speed={2}
                  curveAmount={300}
                  direction="right"
                  interactive={true}
                  className="fill-brown-dark dark:fill-gold hover:fill-brown dark:hover:fill-gold-light transition-colors duration-300"
                  />
              </div>
            </section>
            
          </div>
        </div>
      </MainLayout>
    </>
  );
};

export default Index;

const FEATURED_TRACKS = [
  {
    id: 'featured-1',
    title: "Pale Ulipo",
    slug: "pale-ulipo",
    artist: "Saem's Tunes",
    imageSrc: "https://i.imgur.com/VfKXMyG.png",
    audio_path: "Tracks/Pale Ulipo (Afrobeats).m4a",
    alternate_audio_path: "Tracks/Cover_Tracks/Pale Ulipo cover.m4a",
    get audioSrc() { 
      return getAudioUrl(this);
    },
    likes: 71,
    plays: 1202
  },
  {
    id: 'featured-2',
    title: "I Need You More",
    slug: "i-need-you-more",
    artist: "Saem's Tunes",
    imageSrc: "https://i.imgur.com/6yr8BpG.jpeg",
    audio_path: "Tracks/I Need You More.wav",
    get audioSrc() { 
      return getAudioUrl(this);
    },
    likes: 106,
    plays: 2412
  },
  {
    id: 'featured-3',
    title: "Ni Hai",
    slug: "ni-hai",
    artist: "Saem's Tunes ft. Kendi Nkonge",
    imageSrc: "https://i.imgur.com/LJQDADg.jpeg",
    audio_path: "Tracks/Ni Hai (Demo) - Saem's Tunes (OFFICIAL MUSIC VIDEO) (128kbit_AAC).m4a",
    get audioSrc() { 
      return getAudioUrl(this);
    },
    likes: 1421,
    plays: 127
  },
  {
    id: 'featured-4',
    title: "Mapenzi Ya Ajabu",
    slug: "mapenzi-ya-ajabu",
    artist: "Saem's Tunes",
    imageSrc: "https://i.imgur.com/wrm7LI1.jpeg",
    audio_path: "Tracks/Mapenzi Ya Ajabu (Demo) - Saem's Tunes (OFFICIAL MUSIC VIDEO) (128kbit_AAC).m4a",
    get audioSrc() { 
      return getAudioUrl(this);
    },
    likes: 28,
    plays: 154
  }
];

const StatsSection = () => (
  <section className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
    {STATS.map((stat, index) => (
      <Card key={index} className="bg-card text-card-foreground shadow-md overflow-hidden">
        <CardContent className="flex flex-col items-center justify-center p-3 sm:p-4 space-y-2">
          <stat.icon className="h-6 w-6 text-muted-foreground" />
          <div className="text-2xl font-bold"><CountUp to={stat.value} separator="," /></div>
          <div className="text-sm text-muted-foreground">{stat.label}</div>
        </CardContent>
      </Card>
    ))}
  </section>
);

const FeaturedTracksSection = ({ tracks, onPlayTrack, onShareTrack }: { tracks: any[]; onPlayTrack: (track: any) => void; onShareTrack: (track: any) => void }) => (
  <section>
    <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-6">
      Featured Tracks
    </h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
      {tracks.map(track => (
        <TrackCard
          key={track.id}
          track={track}
          onPlay={onPlayTrack}
          onShare={onShareTrack}
        />
      ))}
    </div>
  </section>
);

const QuickActionsSection = () => {
  const navigate = useNavigate();
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [containerWidths, setContainerWidths] = useState<number[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const updateWidths = () => {
      setContainerWidths(
        cardRefs.current.map(ref => ref?.offsetWidth || 0)
      );
    };

    updateWidths();
    window.addEventListener('resize', updateWidths);
    setIsMounted(true);
    
    return () => {
      window.removeEventListener('resize', updateWidths);
    };
  }, []);

  const getTextVariant = (width: number) => {
    if (width < 220) return 'narrow';
    if (width < 320) return 'sm';
    return 'default';
  };

  if (!isMounted) {
    return (
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {QUICK_ACTIONS.map((_, index) => (
          <Card key={index} className="h-full overflow-hidden">
            <CardContent className="flex flex-col items-start justify-start p-4 space-y-3 h-full">
              <div className="bg-gray-200 dark:bg-gray-700 rounded-lg p-3 w-fit mb-1">
                <div className="h-5 w-5 bg-transparent" />
              </div>
              <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded flex-grow" />
              <div className="h-4 w-1/3 bg-gray-200 dark:bg-gray-700 rounded" />
            </CardContent>
          </Card>
        ))}
      </section>
    );
  }

  return (
    <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
      {QUICK_ACTIONS.map((action, index) => {
        const containerWidth = containerWidths[index] || 0;
        const textVariant = getTextVariant(containerWidth);
        
        return (
          <motion.div
            key={action.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-20px" }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            ref={el => {
              if (el) cardRefs.current[index] = el;
            }}
          >
            <Card className="h-full group hover:shadow-lg transition-all duration-300 overflow-hidden">
              <CardContent className="flex flex-col items-start justify-start p-4 space-y-3 h-full">
                <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-lg p-3 w-fit mb-1 group-hover:scale-110 transition-transform">
                  <action.icon className="h-5 w-5 text-primary" />
                </div>
                
                <h3 className="font-semibold text-base sm:text-lg group-hover:text-primary transition-colors">
                  {textVariant === 'narrow' 
                    ? action.narrowTitle 
                    : textVariant === 'sm' 
                      ? action.smTitle 
                      : action.title}
                </h3>
                
                <p className="text-muted-foreground text-xs sm:text-sm flex-grow">
                  {textVariant === 'narrow' 
                    ? action.narrowDescription 
                    : textVariant === 'sm' 
                      ? action.smDescription 
                      : action.description}
                </p>
                
                <Button 
                  variant="ghost" 
                  className="group/btn p-0 h-auto justify-start hover:bg-transparent"
                  onClick={() => navigate(action.path)}
                >
                  <span className="text-primary font-medium text-xs sm:text-sm">
                    {textVariant === 'narrow' 
                      ? action.narrowCta 
                      : textVariant === 'sm' 
                        ? action.smCta 
                        : action.cta}
                  </span>
                  <ArrowRight className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4 text-primary group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </section>
  );
};

const OrientationHint = () => {
  const { isMobile, isLandscape } = useWindowOrientation();
  const [dismissed, setDismissed] = useState(false);
  
  useEffect(() => {
    const hasSeenHint = localStorage.getItem('orientationHintSeen');
    setDismissed(!!hasSeenHint);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('orientationHintSeen', 'true');
    setDismissed(true);
  };

  if (isMobile && !isLandscape && !dismissed) {
    return (
      <motion.div 
        className="fixed inset-0 z-[999] flex flex-col items-center justify-center p-6 backdrop-blur-lg"
        style={{
          background: 'radial-gradient(circle, var(--gold-light) 0%, var(--brown-dark) 100%)'
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="absolute top-6 right-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            className="text-card hover:bg-primary/20 rounded-full p-2 transition-all"
            aria-label="Close orientation hint"
          >
            <X className="h-6 w-6 text-card-foreground" />
          </Button>
        </div>
        
        <motion.div
          initial={{ scale: 0.8, rotate: -30 }}
          animate={{ 
            scale: 1, 
            rotate: 0,
            transition: { 
              type: "spring", 
              stiffness: 260, 
              damping: 20 
            }
          }}
          className="mb-8"
        >
          <div className="relative">
            <Gift className="h-24 w-24 text-primary" />
            <RotateCw className="h-10 w-10 text-card absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
        </motion.div>
        
        <div className="text-center max-w-md space-y-4">
          <Badge variant="secondary" className="mb-2 bg-primary/30 text-primary-foreground">
            Special Gift
          </Badge>
          <h2 className="text-2xl font-bold text-card">
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Turn Your Screen for a Surprise!
            </span>
          </h2>
          <p className="text-lg text-card-foreground">
            Discover a special musical experience by rotating your device
          </p>
        </div>
        
        <Button
          onClick={handleDismiss}
          className="mt-8 bg-card text-card-foreground hover:bg-primary hover:text-primary-foreground group"
        >
          <Play className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
          Continue without rotating
        </Button>
      </motion.div>
    );
  }

  return null;
};
