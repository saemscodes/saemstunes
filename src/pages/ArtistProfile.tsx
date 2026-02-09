// src/pages/artist/[slug].tsx
import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import MagicBento from "@/components/ui/MagicBento";
import ArtistModal from "@/components/artists/ArtistModal";
import ArtistNotFound from "@/components/errors/ArtistNotFound";
import {
  Calendar, Mail, Music, Video, Star, MapPin,
  ExternalLink, Award, Info, Heart, Users, Mic2, Guitar, ArrowLeft
} from "lucide-react";
import { toast } from "sonner";

interface Artist {
  id: string;
  slug: string;
  name: string;
  bio: string | null;
  profile_image_url: string | null;
  cover_image_url: string | null;
  genre: string[] | null;
  specialties: string[] | null;
  location: string | null;
  verified_status: boolean;
  social_links: Record<string, string> | null;
  follower_count: number;
  rating: number | null;
  lessons_available: boolean;
  courses_available: boolean;
  achievements: any[] | null;
  fun_facts: string[] | null;
  awards: string[] | null;
  favorite_instruments: string[] | null;
  influences: string[] | null;
  created_at: string;
  updated_at: string;
}

const ArtistProfile = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState<Artist | null>(null);
  const [modalType, setModalType] = useState<string>('');

  useEffect(() => {
    const fetchArtist = async () => {
      if (!slug) {
        setError('Invalid artist URL');
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const client = supabase as any;
        const result = await client
          .from('artists')
          .select(`
            id, slug, name, bio, profile_image_url, cover_image_url, genre, specialties, 
            location, verified_status, social_links, follower_count, 
            rating, lessons_available, courses_available, achievements, 
            fun_facts, awards, favorite_instruments, influences, 
            created_at, updated_at
          `)
          .eq('slug', slug)
          .maybeSingle();

        const { data, error: fetchError } = result;

        if (fetchError) {
          console.error('Error fetching artist:', fetchError);
          setError(fetchError.message || 'Artist not found');
          return;
        }

        if (data) {
          setArtist(data as any);
        } else {
          setError('Artist not found');
        }
      } catch (error) {
        console.error('Error during artist fetch:', error);
        setError('Failed to load artist');
      } finally {
        setLoading(false);
      }
    };

    fetchArtist();
  }, [slug]);

  const bentoCardData = useMemo(() => {
    if (!artist) return [];

    return [
      {
        color: "linear-gradient(135deg, #1A1A1A 0%, #2D2D2D 100%)",
        title: "The Story",
        description: artist.bio ? `${artist.bio.substring(0, 100)}...` : 'Discover the journey...',
        label: "Biography",
        icon: <Info className="h-5 w-5 text-gold" />,
        onClick: () => handleBentoClick('bio'),
        disabled: !artist.bio,
        className: "md:col-span-2"
      },
      {
        color: "linear-gradient(135deg, #5A270F 0%, #1A1A1A 100%)",
        title: "Roots",
        description: artist.location || 'Based in Africa',
        label: "Location",
        icon: <MapPin className="h-5 w-5 text-gold" />,
        onClick: () => handleBentoClick('location'),
        disabled: !artist.location
      },
      {
        color: "linear-gradient(135deg, #1A1A1A 0%, #C69B36 100%)",
        title: "Sound",
        description: artist.genre?.join(' • ') || 'Christian Harmony',
        label: "Genre",
        icon: <Music className="h-5 w-5 text-gold" />,
        onClick: () => handleBentoClick('genre'),
        disabled: !artist.genre?.length
      },
      {
        color: "linear-gradient(135deg, #2D2D2D 0%, #5A270F 100%)",
        title: "Community",
        description: `${artist.follower_count.toLocaleString()} Dedicated Fans`,
        label: "Followers",
        icon: <Users className="h-5 w-5 text-gold" />,
        onClick: () => handleBentoClick('stats')
      },
      {
        color: "linear-gradient(135deg, #C69B36 0%, #5A270F 100%)",
        title: "Socials",
        description: artist.social_links
          ? `Connected on ${Object.keys(artist.social_links).length} Platforms`
          : 'Stay Tuned',
        label: "Connect",
        icon: <ExternalLink className="h-5 w-5 text-white" />,
        onClick: () => handleBentoClick('social'),
        disabled: !artist.social_links || Object.keys(artist.social_links).length === 0
      },
      {
        color: "linear-gradient(135deg, #1A1A1A 0%, #2D2D2D 100%)",
        title: "Fun Facts",
        description: artist.fun_facts?.length
          ? `Discover ${artist.fun_facts.length} surprising things`
          : 'Inside look...',
        label: "Trivia",
        icon: <Heart className="h-5 w-5 text-red-500" />,
        onClick: () => handleBentoClick('fun_facts'),
        disabled: !artist.fun_facts?.length
      },
      {
        color: "linear-gradient(135deg, #C69B36 0%, #1A1A1A 100%)",
        title: "Milestones",
        description: artist.awards?.length
          ? `${artist.awards.length} Prestigious Awards`
          : 'Ongoing Success',
        label: "Awards",
        icon: <Award className="h-5 w-5 text-gold" />,
        onClick: () => handleBentoClick('awards'),
        disabled: !artist.awards?.length
      }
    ].filter(card => !card.disabled);
  }, [artist]);

  const handleBentoClick = (type: string) => {
    if (!artist) return;
    setModalType(type);
    setModalData(artist);
    setModalOpen(true);
  };

  const handleBookLesson = () => {
    navigate(`/book/${artist?.id}`);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-8 pb-20">
          <Button
            variant="outline"
            className="mb-6 ml-6 mt-4"
            onClick={() => navigate("/discover")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Discover
          </Button>
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading artist profile...</p>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !artist) {
    return (
      <MainLayout>
        <div className="space-y-8 pb-20">
          <Button
            variant="outline"
            className="mb-6 ml-6 mt-4"
            onClick={() => navigate("/discover")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Discover
          </Button>
          <ArtistNotFound slug={slug || ''} error={error} isArtistPage />
        </div>
      </MainLayout>
    );
  }

  // Calculate star rating
  const rating = artist.rating || 4.0;
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  return (
    <MainLayout>
      <div className="min-h-screen bg-background overflow-x-hidden">
        <div className="space-y-8 pb-20">
          {/* Back Button */}
          <Button
            variant="outline"
            className="mb-6 ml-6 mt-4"
            onClick={() => navigate("/discover")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Discover
          </Button>

          {/* Hero Section with Background Image */}
          <div className="relative min-h-[60vh] overflow-hidden flex items-center justify-center">
            {/* Background Image */}
            {artist.cover_image_url && (
              <div
                className="absolute inset-0 w-full h-full z-0"
                style={{
                  backgroundImage: `url(${artist.cover_image_url})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundAttachment: 'fixed',
                  filter: 'blur(2px)', // Reduced blur
                }}
              />
            )}

            {/* Enhanced Gradient Overlay */}
            <div
              className="absolute inset-0 z-0"
              style={{
                background: `linear-gradient(
                to bottom, 
                rgba(var(--background-start-rgb), 0.8) 0%, 
                rgba(var(--background-start-rgb), 0.4) 30%, 
                rgba(var(--background-end-rgb), 0.1) 70%, 
                rgba(var(--background-end-rgb), 1) 100%
              )`
              }}
            />

            {/* Content Container */}
            <div className="w-full max-w-4xl mx-auto px-4 text-center z-10">
              <div className="flex items-center justify-center mb-6">
                <Avatar className="w-24 h-24 border-4 border-primary">
                  <AvatarImage
                    src={artist.profile_image_url || undefined}
                    alt={artist.name}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-primary text-white font-bold flex items-center justify-center">
                    {artist.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>

              <h1 className="text-4xl md:text-6xl font-serif font-bold text-foreground mb-4">
                {artist.name}
              </h1>
              <p className="text-xl text-muted-foreground mb-6">
                {artist.genre?.join(', ') || artist.specialties?.join(', ') || 'Artist'}
              </p>

              <div className="flex items-center justify-center mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${i < fullStars || (i === fullStars && hasHalfStar)
                      ? 'text-gold fill-gold'
                      : 'text-muted-foreground'
                      } mr-1`}
                  />
                ))}
                <span className="ml-2 text-sm">({rating.toFixed(1)})</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  className="bg-gold hover:bg-gold-dark text-white"
                  onClick={handleBookLesson}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Book Lesson
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    toast.info(`Opening mail to contact ${artist.name}...`);
                    setTimeout(() => {
                      window.location.href = `mailto:saemstunes@gmail.com?subject=Inquiry regarding ${artist.name}`;
                    }, 500);
                  }}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Contact
                </Button>
                {artist.social_links && (
                  <Button variant="outline"
                    onClick={() => {
                      const url = artist.social_links?.spotify ||
                        artist.social_links?.instagram ||
                        artist.social_links?.youtube ||
                        '#';
                      window.open(url, '_blank');
                    }}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Follow
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Dynamic Magic Bento Section */}
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">Artist Profile Explorer</h2>
              <p className="text-muted-foreground">
                Click on each card to dive deeper into {artist.name}'s musical world
              </p>
            </div>

            <div className="relative">
              <MagicBento
                cardData={bentoCardData}
                gridConfig="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                glowIntensity={0.6}
                particleDensity={8}
              />
            </div>
          </div>

          {/* Artist Content Tabs */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <Tabs defaultValue="about" className="w-full">
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="about">About</TabsTrigger>
                {artist.lessons_available && (
                  <TabsTrigger value="lessons">Lessons</TabsTrigger>
                )}
                {artist.courses_available && (
                  <TabsTrigger value="courses">Courses</TabsTrigger>
                )}
                <TabsTrigger value="schedule">Schedule</TabsTrigger>
              </TabsList>

              <TabsContent value="about" className="p-4 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="md:col-span-2">
                    <h2 className="text-2xl font-medium mb-4">Biography</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      {artist.bio || `${artist.name} is a talented music artist with a passion for creating unique sounds and inspiring others.`}
                    </p>

                    <h3 className="text-lg font-medium mt-8 mb-4">Expertise</h3>
                    <div className="flex flex-wrap gap-2">
                      {(artist.genre || artist.specialties || []).map((item, i) => (
                        <span key={i} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                          {item}
                        </span>
                      ))}
                    </div>

                    {artist.verified_status && (
                      <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center">
                          <Star className="h-5 w-5 text-green-600 mr-2" />
                          <span className="text-green-800 font-medium">Verified Artist</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-6">
                    <div className="bg-card rounded-lg border border-border p-6">
                      <h3 className="font-medium mb-6">Artist Info</h3>

                      <div className="space-y-4">
                        <div className="flex items-start">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 mr-3" />
                          <div>
                            <p className="text-sm">Location</p>
                            <p className="text-sm font-medium">{artist.location || 'Global'}</p>
                          </div>
                        </div>

                        <div className="flex items-start">
                          <Music className="h-4 w-4 text-muted-foreground mt-0.5 mr-3" />
                          <div>
                            <p className="text-sm">Followers</p>
                            <p className="text-sm font-medium">
                              {artist.follower_count.toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start">
                          <Video className="h-4 w-4 text-muted-foreground mt-0.5 mr-3" />
                          <div>
                            <p className="text-sm">Content</p>
                            <p className="text-sm font-medium">Music & Lessons</p>
                          </div>
                        </div>

                        <div className="flex items-start">
                          <Star className="h-4 w-4 text-muted-foreground mt-0.5 mr-3" />
                          <div>
                            <p className="text-sm">Rating</p>
                            <p className="text-sm font-medium">
                              {rating.toFixed(1)} out of 5
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Social Links */}
                    {artist.social_links && Object.keys(artist.social_links).length > 0 && (
                      <div className="bg-card rounded-lg border border-border p-6">
                        <h3 className="font-medium mb-4">Connect</h3>
                        <div className="space-y-2">
                          {Object.entries(artist.social_links).map(([platform, url]) => (
                            <Button
                              key={platform}
                              variant="outline"
                              size="sm"
                              className="w-full justify-start"
                              onClick={() => window.open(url, '_blank')}
                            >
                              <ExternalLink className="mr-2 h-4 w-4" />
                              {platform.charAt(0).toUpperCase() + platform.slice(1)}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              {artist.lessons_available && (
                <TabsContent value="lessons" className="p-4">
                  <h2 className="text-xl font-medium mb-4">Featured Lessons</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    <div className="text-center py-12">
                      <Mic2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">Coming Soon</h3>
                      <p className="text-muted-foreground">
                        {artist.name} is preparing amazing lessons for you
                      </p>
                    </div>
                  </div>
                </TabsContent>
              )}

              {artist.courses_available && (
                <TabsContent value="courses" className="p-4">
                  <div className="text-center py-16">
                    <Music className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-medium mb-2">No Courses Available</h3>
                    <p className="text-muted-foreground max-w-md mx-auto mb-6">
                      This artist hasn't published any courses yet. Check back soon!
                    </p>
                  </div>
                </TabsContent>
              )}

              <TabsContent value="schedule" className="p-4">
                <div className="text-center py-16">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-medium mb-2">Schedule a Lesson</h3>
                  <p className="text-muted-foreground max-w-md mx-auto mb-6">
                    Book a private or group session with this artist
                  </p>
                  <Button
                    onClick={handleBookLesson}
                    className="bg-gold hover:bg-gold-dark text-white"
                  >
                    View Available Times
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Artist Modal */}
          <ArtistModal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            title={modalType.charAt(0).toUpperCase() + modalType.slice(1)}
            data={artist}
            type={modalType as any}
          />
        </div>
      </div>
    </MainLayout>
  );
};

export default ArtistProfile;
