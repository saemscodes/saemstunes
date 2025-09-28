import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { AuthProvider } from "@/context/AuthContext";
import { SubscriptionProvider } from "@/context/SubscriptionContext";
import { WalletProvider } from "@/context/WalletContext";
import { AudioPlayerProvider } from "@/context/AudioPlayerContext";
import { MediaStateProvider } from '@/components/idle-state/mediaStateContext';
import { PlaylistProvider } from '@/context/PlaylistContext';
import { FeaturedItemsProvider } from '@/context/FeaturedItemsContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import SplashScreen from "@/components/ui/splash-screen";
import GlobalMiniPlayer from "@/components/player/GlobalMiniPlayer";
import IdleStateManager from "@/components/idle-state/IdleStateManager";
import AuthCallback from "@/components/auth/AuthCallback";
import SaemsTunesAI from "@/LLM/SaemsTunesAI";

// Page imports
import Admin from "@/pages/Admin";
import Index from "./pages/Index";
import Auth from "./pages/Auth"; 
import VerificationWaiting from "./pages/VerificationWaiting";
import Videos from "./pages/Videos";
import VideoDetail from "./pages/VideoDetail";
import Resources from "./pages/Resources";
import ResourceDetail from "./pages/ResourceDetail";
import LearningHub from "./pages/LearningHub";
import LearningModulePage from "./pages/LearningModulePage";
import Bookings from "./pages/Bookings";
import BookTutor from "./pages/BookTutor";
import NotFound from "./pages/NotFound";
import Search from "./pages/Search";
import Unauthorized from "./pages/Unauthorized";
import Discover from "./pages/Discover";
import Library from "./pages/Library";
import Community from "./pages/Community";
import Player from "./pages/Player";
import ArtistProfile from "./pages/ArtistProfile";
import Notifications from "./pages/Notifications";
import FollowUs from "./pages/FollowUs";
import ContactUs from "./pages/ContactUs";
import SupportUs from "./pages/SupportUs";
import Settings from "./pages/Settings";
import Services from "./pages/Services";
import Payment from "./pages/Payment";
import PaymentSuccess from "./pages/PaymentSuccess";
import MusicTools from "./pages/MusicTools";
import UserDetails from "./pages/UserDetails";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Subscriptions from "./pages/Subscriptions";
import ComingSoon from "./pages/ComingSoon";
import Tracks from "@/pages/Tracks";
import AudioPlayer from "./pages/AudioPlayer";
import Artists from "./pages/Artists";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import MusicShowcase from "./pages/MusicShowcase";
import Profile from "./pages/Profile";

const queryClient = new QueryClient();

const App = () => {
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <SubscriptionProvider>
            <WalletProvider>
              <MediaStateProvider>
                <AudioPlayerProvider>
                  <PlaylistProvider>
                    <TooltipProvider>
                      <Toaster />
                      <Sonner />
                      <SplashScreen loading={loading} />
                      <FeaturedItemsProvider>
                        <SaemsTunesAI
                          position="bottom-right"
                          defaultOpen={false}
                          showFeedback={true}
                          maxHeight="600px"
                          theme="default"
                          />
                        <BrowserRouter>
                          <IdleStateManager idleTime={60000} />
                          <Routes>
                            <Route path="/" element={<Index />} />
                            <Route path="/admin" element={<Admin />} />
                            <Route path="/login" element={<Auth />} />
                            <Route path="/signup" element={<Auth />} />
                            <Route path="/auth" element={<Auth />} />
                            <Route path="/verification-waiting" element={<VerificationWaiting />} />
                            <Route path="/terms" element={<Terms />} />
                            <Route path="/privacy" element={<Privacy />} />
                            <Route path="/unauthorized" element={<Unauthorized />} />
                            <Route path="/auth/callback" element={<AuthCallback />} />
                            <Route path="/videos" element={<Videos />} />
                            <Route path="/videos/:id" element={<VideoDetail />} />
                            <Route path="/resources" element={<Resources />} />
                            <Route path="/resources/:id" element={<ResourceDetail />} />
                            <Route path="/search" element={<Search />} />
                            <Route path="/discover" element={<Discover />} />
                            <Route path="/library" element={<Library />} />
                            <Route path="/community" element={<Community />} />
                            <Route path="/tracks" element={<Tracks />} />
                            
                            {/* CRITICAL: Add these missing routes to prevent 404s */}
                            <Route path="/track/:slug" element={<AudioPlayer />} />
                            <Route path="/artist/:slug" element={<ArtistProfile />} />
                            <Route path="/course/:slug" element={<LearningHub />} />
                            <Route path="/lesson/:slug" element={<LearningModulePage />} />
                            <Route path="/module/:slug" element={<LearningModulePage />} />
                            
                            <Route path="/music-showcase" element={<Navigate to="/tracks" replace />} />
                            <Route path="/player" element={<Player />} />
                            <Route path="/learning-hub" element={<LearningHub />} />
                            <Route path="/learning-hub/:id" element={<LearningModulePage />} />
                            <Route path="/learning-module/:id" element={<LearningModulePage />} />
                            
                            {/* This route was already present but keeping it for consistency */}
                            <Route path="/artist/:slug" element={<ArtistProfile />} />
                            
                            <Route path="/notifications" element={<Notifications />} />
                            <Route path="/follow-us" element={<FollowUs />} />
                            <Route path="/contact-us" element={<ContactUs />} />
                            <Route path="/support-us" element={<SupportUs />} />
                            <Route path="/settings" element={<Settings />} />
                            
                            <Route path="/profile" element={
                              <ProtectedRoute>
                                <Profile />
                              </ProtectedRoute>
                            } />
                            
                            <Route path="/services" element={<Services />} />
                            <Route path="/payment" element={<Payment />} />
                            <Route path="/payment-success" element={<PaymentSuccess />} />
                            <Route path="/subscriptions" element={<Subscriptions />} />
                            <Route path="/music-tools" element={<MusicTools />} />
                            <Route path="/artists" element={<Artists />} />
                            <Route path="/learning-hub/:moduleId" element={<LearningModulePage />} />
                            
                            <Route path="/bookings" element={
                              <ProtectedRoute requiredRoles={["student", "adult_learner", "parent"]}>
                                <Bookings />
                              </ProtectedRoute>
                            } />
                            <Route path="/book/:id" element={
                              <ProtectedRoute requiredRoles={["student", "adult_learner", "parent"]}>
                                <BookTutor />
                              </ProtectedRoute>
                            } />
                            <Route path="/book-tutor" element={
                              <ProtectedRoute requiredRoles={["student", "adult_learner", "parent"]}>
                                <BookTutor />
                              </ProtectedRoute>
                            } />
                            <Route path="/auth" element={
                              <ProtectedRoute>
                                <Auth />
                              </ProtectedRoute>
                            } />
                            <Route path="/user-details" element={
                              <ProtectedRoute>
                                <UserDetails />
                              </ProtectedRoute>
                            } />
                            
                            <Route path="/coming-soon" element={<ComingSoon />} />
                            <Route path="/tracks/:slug" element={<AudioPlayer />} />
                            <Route path="/audio-player/:id" element={<Navigate to="/tracks" replace />} />
                            <Route path="*" element={<NotFound />} />
                          </Routes>
                          <GlobalMiniPlayer />
                          <SpeedInsights />
                          <Analytics />
                        </BrowserRouter>
                      </FeaturedItemsProvider>
                    </TooltipProvider>
                  </PlaylistProvider>
                </AudioPlayerProvider>
              </MediaStateProvider>
            </WalletProvider>
          </SubscriptionProvider>
        </AuthProvider>
      </ThemeProvider>   
    </QueryClientProvider>
  );
};

export default App;
