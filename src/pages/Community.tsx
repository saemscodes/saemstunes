import React, { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, MessageCircle, Music, Video, Bell, Award, Heart, Headphones, X, Mail, Sparkles, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { BookOpen } from "lucide-react";
import { useCommunity } from "@/hooks/useCommunity";
import { formatDistanceToNow } from "date-fns";
import AudioSharingCard from "@/components/community/AudioSharingCard";
import DirectMessaging from "@/components/community/DirectMessaging";
import { useNavigate } from "react-router-dom";
import SEOHead from "@/components/seo/SEOHead";
import { Input } from "@/components/ui/input";

// Mock audio tracks for audio sharing
const AUDIO_TRACKS = [
  {
    id: '1',
    title: 'Violin Practice - Bach Partita',
    artist: 'Sarah Williams',
    artistImage: '/placeholder.svg',
    audioSrc: 'https://example.com/audio1.mp3',
    duration: '1:45',
    likes: 24,
    comments: 4,
    isLiked: false,
  },
  {
    id: '2',
    title: 'Piano Improvisation in G',
    artist: 'James Rodriguez',
    artistImage: '/placeholder.svg',
    audioSrc: 'https://example.com/audio2.mp3',
    duration: '2:30',
    likes: 37,
    comments: 12,
    isLiked: true,
  },
  {
    id: '3',
    title: 'Guitar Solo - First Attempt',
    artist: 'Chris Thomas',
    artistImage: '/placeholder.svg',
    audioSrc: 'https://example.com/audio3.mp3',
    duration: '3:15',
    likes: 18,
    comments: 7,
    isLiked: false,
  }
];

const Community = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { useThreads } = useCommunity();
  const { data: threads, isLoading: threadsLoading } = useThreads();
  const [activeTab, setActiveTab] = useState("discussions");

  // SEO schema for community page
  const communitySchema = {
    "@context": "https://schema.org",
    "@type": "DiscussionForumPosting",
    "headline": "Music Learning Community - Saem's Tunes",
    "description": "Join our vibrant community of music learners and educators. Share recordings, discuss techniques, and collaborate with fellow musicians.",
    "publisher": {
      "@type": "Organization",
      "name": "Saem's Tunes",
      "logo": "https://i.imgur.com/ltEen5M.png"
    },
    "keywords": "music community, music discussions, audio sharing, music collaboration, music learning",
    "interactionStatistic": {
      "@type": "InteractionCounter",
      "interactionType": "https://schema.org/CommentAction",
      "userInteractionCount": threads?.length?.toString() || "0"
    }
  };

  const events = [
    {
      id: 1,
      title: "Virtual Open Mic Night",
      date: "Fri, May 15 • 7:00 PM",
      attendees: 42,
      image: "/placeholder.svg"
    },
    {
      id: 2,
      title: "Music Theory Workshop",
      date: "Sat, May 23 • 3:00 PM",
      attendees: 28,
      image: "/placeholder.svg"
    }
  ];

  const featuredArtists = [
    {
      id: 1,
      name: "Sarah Williams",
      instrument: "Violin",
      followers: 324,
      image: "/placeholder.svg"
    },
    {
      id: 2,
      name: "James Rodriguez",
      instrument: "Guitar",
      followers: 287,
      image: "/placeholder.svg"
    },
    {
      id: 3,
      name: "Mia Chen",
      instrument: "Piano",
      followers: 412,
      image: "/placeholder.svg"
    }
  ];

  const DiscussionCard = ({ discussion }) => (
    <div className="border-b border-border pb-4 last:border-0 last:pb-0">
      <div className="flex justify-between items-start">
        <div className="flex gap-3">
          <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
            <AvatarImage src={discussion.author?.avatar_url || ''} />
            <AvatarFallback>{discussion.author?.full_name?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
          <div>
            <h4 className="font-medium hover:text-gold cursor-pointer flex items-center">
              {discussion.title}
              {discussion.is_pinned && (
                <Badge variant="outline" className="ml-2 text-xs bg-gold/10">
                  Pinned
                </Badge>
              )}
            </h4>
            <div className="flex items-center text-sm text-muted-foreground mt-1 gap-2 flex-wrap">
              <span>{discussion.author?.full_name || 'Anonymous'}</span>
              <span>•</span>
              <div className="flex items-center">
                <MessageCircle className="h-3 w-3 mr-1" />
                <span>{discussion.reply_count || 0}</span>
              </div>
              <span>•</span>
              <span>{discussion.last_activity_at ? formatDistanceToNow(new Date(discussion.last_activity_at), { addSuffix: true }) : 'active recently'}</span>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="hidden sm:block">
          View
        </Button>
      </div>
    </div>
  );

  const EventCard = ({ event }) => (
    <div className="flex gap-3 items-center mb-4">
      <div className="h-14 w-14 sm:h-16 sm:w-16 rounded bg-muted overflow-hidden">
        <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1">
        <h4 className="font-medium">{event.title}</h4>
        <p className="text-sm text-muted-foreground">{event.date}</p>
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
          <Users className="h-3 w-3" />
          <span>{event.attendees} attending</span>
        </div>
      </div>
      <Button variant="outline" size="sm">
        Join
      </Button>
    </div>
  );

  const ArtistCard = ({ artist }) => (
    <div className="flex items-center gap-3 mb-3">
      <Avatar className="h-10 w-10">
        <AvatarImage src={artist.image} />
        <AvatarFallback>{artist.name.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <h4 className="font-medium">{artist.name}</h4>
        <p className="text-xs text-muted-foreground">{artist.instrument}</p>
      </div>
      <Button variant="outline" size="sm">
        Follow
      </Button>
    </div>
  );

  return (
    <MainLayout>
      <SEOHead
        title="Music Community | Saem's Tunes"
        description="Join our vibrant music community. Share recordings, discuss techniques, and connect with fellow musicians and instructors."
        keywords="music community, musician forum, audio sharing, music collaboration"
        url="https://saemstunes.app/community"
        structuredData={communitySchema}
      />

      <div className="relative bg-gradient-to-r from-amber-50 to-gold/5 dark:from-gold/10 dark:to-gold/5 border border-gold/30 dark:border-gold/20 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="bg-gold/20 p-2 rounded-full">
            <Sparkles className="h-5 w-5 text-gold" />
          </div>

          <div className="flex-1">
            <h3 className="font-serif font-semibold text-lg mb-1">Live Community Hub</h3>
            <p className="text-sm text-muted-foreground">
              Connect with fellow musicians, share your recordings, and join discussions in real-time.
              Our community is active and growing!
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6 pb-24 md:pb-12">
        {isMobile ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-serif font-bold">Community</h1>
              <Button className="bg-gold hover:bg-gold-dark text-white">
                <MessageCircle className="mr-2 h-4 w-4" />
                New
              </Button>
            </div>

            <Tabs defaultValue="discussions" className="w-full" onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-5 mb-4">
                <TabsTrigger value="discussions">
                  <MessageCircle className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Discussions</span>
                </TabsTrigger>
                <TabsTrigger value="audio">
                  <Headphones className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Audio</span>
                </TabsTrigger>
                <TabsTrigger value="events">
                  <Bell className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Events</span>
                </TabsTrigger>
                <TabsTrigger value="messages">
                  <MessageCircle className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Messages</span>
                </TabsTrigger>
                <TabsTrigger value="featured">
                  <Award className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Featured</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="discussions" className="pt-2">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MessageCircle className="h-5 w-5 text-gold" />
                      Recent Discussions
                    </CardTitle>
                    <CardDescription>
                      Join conversations or start your own thread
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {threadsLoading ? (
                        <div className="flex items-center justify-center py-10">
                          <Loader2 className="h-6 w-6 animate-spin text-gold" />
                        </div>
                      ) : (
                        threads?.map(thread => (
                          <DiscussionCard key={thread.id} discussion={thread} />
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="audio" className="pt-2">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Headphones className="h-5 w-5 text-gold" />
                      Shared Audio
                    </CardTitle>
                    <CardDescription>
                      Listen to recordings shared by the community
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {AUDIO_TRACKS.map(track => (
                        <AudioSharingCard key={track.id} track={track} />
                      ))}

                      <Separator className="my-4" />

                      <div className="text-center">
                        <Button className="bg-gold hover:bg-gold/90 text-white">
                          Share Your Audio
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="messages" className="pt-2">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MessageCircle className="h-5 w-5 text-gold" />
                      Direct Messages
                    </CardTitle>
                    <CardDescription>
                      Connect with other musicians
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <DirectMessaging />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="events" className="pt-2">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Bell className="h-5 w-5 text-gold" />
                      Upcoming Events
                    </CardTitle>
                    <CardDescription>
                      Join virtual and in-person music events
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {events.map(event => (
                        <EventCard key={event.id} event={event} />
                      ))}

                      <Separator className="my-4" />

                      <div className="text-center">
                        <Button className="bg-gold hover:bg-gold-dark text-white">
                          Browse All Events
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="featured" className="pt-2">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Award className="h-5 w-5 text-gold" />
                      Featured Artists
                    </CardTitle>
                    <CardDescription>
                      Connect with talented musicians in our community
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {featuredArtists.map(artist => (
                        <ArtistCard key={artist.id} artist={artist} />
                      ))}

                      <Separator className="my-4" />

                      <div className="text-center">
                        <Button variant="outline">
                          View All Artists
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-serif font-bold">Community</h1>
              <Button className="bg-gold hover:bg-gold-dark text-white">
                <MessageCircle className="mr-2 h-4 w-4" />
                New Discussion
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                <Tabs defaultValue="discussions">
                  <TabsList>
                    <TabsTrigger value="discussions">Discussions</TabsTrigger>
                    <TabsTrigger value="audio">Shared Audio</TabsTrigger>
                    <TabsTrigger value="messages">Direct Messages</TabsTrigger>
                  </TabsList>

                  <TabsContent value="discussions" className="pt-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <MessageCircle className="mr-2 h-5 w-5" />
                          Recent Discussions
                        </CardTitle>
                        <CardDescription>
                          Join the conversation or start your own thread
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {threadsLoading ? (
                            <div className="flex items-center justify-center py-10">
                              <Loader2 className="h-6 w-6 animate-spin text-gold" />
                            </div>
                          ) : (
                            threads?.map(thread => (
                              <DiscussionCard key={thread.id} discussion={thread} />
                            ))
                          )}
                        </div>

                        <Button variant="outline" className="w-full mt-4">
                          View All Discussions
                        </Button>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="audio" className="pt-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      {AUDIO_TRACKS.map(track => (
                        <AudioSharingCard key={track.id} track={track} />
                      ))}
                    </div>

                    <Button className="w-full mt-6 bg-gold hover:bg-gold/90 text-white">
                      Share Your Recording
                    </Button>
                  </TabsContent>

                  <TabsContent value="messages" className="pt-4">
                    <Card>
                      <CardContent className="p-0">
                        <DirectMessaging />
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Music className="mr-2 h-5 w-5" />
                      Student Showcases
                    </CardTitle>
                    <CardDescription>
                      Recent performances and progress from fellow students
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="border border-border rounded-lg p-4 flex items-center">
                        <div className="aspect-square w-24 h-24 bg-muted rounded-md flex items-center justify-center">
                          <Video className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <div className="ml-4">
                          <h4 className="font-medium">First Piano Recital</h4>
                          <p className="text-sm text-muted-foreground">By SarahKeys • 2 days ago</p>
                          <p className="text-sm mt-1">Sharing my progress after 3 months of lessons!</p>
                        </div>
                      </div>

                      <Button variant="outline" className="w-full">
                        View More Showcases
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Bell className="mr-2 h-5 w-5" />
                      Upcoming Events
                    </CardTitle>
                    <CardDescription>
                      Join virtual and in-person music events
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {events.map(event => (
                        <EventCard key={event.id} event={event} />
                      ))}

                      <Button variant="outline" size="sm" className="w-full">
                        View All Events
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Award className="mr-2 h-5 w-5" />
                      Featured Artists
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {featuredArtists.map(artist => (
                        <ArtistCard key={artist.id} artist={artist} />
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Learning Resources</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-left"
                        onClick={() => window.location.href = "/learning-hub"}
                      >
                        <BookOpen className="h-4 w-4 mr-2" />
                        Beginner Music Theory
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-left"
                        onClick={() => window.location.href = "/learning-hub"}
                      >
                        <Music className="h-4 w-4 mr-2" />
                        Instrument Guides
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-left"
                        onClick={() => window.location.href = "/learning-hub"}
                      >
                        <Heart className="h-4 w-4 mr-2" />
                        Practice Tips
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-center space-x-4 pt-8 border-t">
          <Button
            variant="link"
            size="sm"
            onClick={() => navigate("/privacy")}
            className="text-muted-foreground hover:text-gold"
          >
            Privacy Policy
          </Button>
          <span className="text-muted-foreground">•</span>
          <Button
            variant="link"
            size="sm"
            onClick={() => navigate("/terms")}
            className="text-muted-foreground hover:text-gold"
          >
            Terms of Service
          </Button>
        </div>
      </div>
    </MainLayout>
  );
};

export default Community;
