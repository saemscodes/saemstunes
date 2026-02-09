import React, { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { Library as LibraryIcon, BookOpen, Bookmark, Clock, Music, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mockVideos } from "@/data/mockData";
import VideoCardWrapper from "@/components/videos/VideoCardWrapper";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import DynamicMusicQuiz from "@/components/quiz/DynamicMusicQuiz";
import ResourceCard from "@/components/resources/ResourceCard";
import { Resource } from "@/types/resource";
import { useToast } from "@/hooks/use-toast";
import { useUserQuizProgress } from "@/hooks/useQuizzes";
import { supabase } from "@/integrations/supabase/client";
import RecommendationSection from "@/components/discover/RecommendationSection";

const Library = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getCompletedQuizIds, refetch: refetchProgress } = useUserQuizProgress();
  const [totalQuestions, setTotalQuestions] = useState(91);
  const [userTierInfo, setUserTierInfo] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch total question count
        const { count, error: countError } = await supabase
          .from('quizzes')
          .select('*', { count: 'exact' });

        if (countError) throw countError;
        if (count) setTotalQuestions(count);

        // Fetch user's tier information if logged in
        if (user) {
          const { data: tierData, error: tierError } = await supabase
            .from('access_tiers')
            .select('*')
            .eq('name', user.subscriptionTier || 'free')
            .single();

          if (tierError) throw tierError;
          setUserTierInfo(tierData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [user]);

  const formatQuestionCount = (count: number) => {
    if (count <= 999) {
      return Math.round(count / 100) * 100;
    } else if (count <= 9999) {
      return Math.round(count / 1000) * 1000;
    } else {
      const tenThousands = Math.floor(count / 10000) * 10000;
      const thousands = Math.floor((count % 10000) / 1000) * 1000;
      const hundreds = Math.round((count % 1000) / 100) * 100;
      return tenThousands + thousands + hundreds;
    }
  };

  const getTierDescription = () => {
    if (!userTierInfo) {
      return "Access our growing database of music questions to test your knowledge.";
    }

    const tierName = userTierInfo.name.toLowerCase();
    const features = userTierInfo.features || {};

    switch (tierName) {
      case 'free':
        return "Start with basic questions to build your music foundation.";
      case 'basic':
        return "Expand your knowledge with more diverse questions.";
      case 'premium':
        return "Access our full question database with varied difficulty levels.";
      case 'professional':
        return "Unlock our complete question library with expert-level content.";
      default:
        return "Access our growing database of music questions to test your knowledge.";
    }
  };

  const savedVideos = mockVideos.slice(0, 4);
  const saemOfferings = mockVideos.slice(4, 8).map(video => ({ ...video, isExclusive: true }));

  const courses = [
    {
      id: "course1",
      title: "Beginner Piano Masterclass",
      description: "Learn piano fundamentals from scratch",
      instructor: "Saem",
      duration: "8 weeks",
      level: "beginner",
      thumbnail: "/placeholder.svg",
      enrolled: true,
      progress: 35
    },
    {
      id: "course2",
      title: "Vocal Development for Pop Music",
      description: "Discover your unique voice and expand your range",
      instructor: "Lisa Wong",
      duration: "6 weeks",
      level: "intermediate",
      thumbnail: "/placeholder.svg",
      enrolled: true,
      progress: 72
    },
    {
      id: "course3",
      title: "Music Production Fundamentals",
      description: "Learn to produce professional tracks from home",
      instructor: "James Rodriguez",
      duration: "10 weeks",
      level: "beginner",
      thumbnail: "/placeholder.svg",
      enrolled: false,
      progress: 0
    },
    {
      id: "course4",
      title: "Advanced Guitar Techniques",
      description: "Take your guitar skills to the next level",
      instructor: "Saem",
      duration: "12 weeks",
      level: "advanced",
      thumbnail: "/placeholder.svg",
      enrolled: false,
      progress: 0
    }
  ];

  const offlineResources: Resource[] = [
    {
      id: "res1",
      title: "Complete Guitar Chord Chart",
      description: "A comprehensive chart of guitar chords for beginners to advanced players",
      category_id: "chord_chart",
      subject_category: "guitar",
      level: "beginner",
      is_locked: false,
      access_level: "free",
      metadata: {},
      thumbnail_url: "/placeholder.svg",
      resource_url: "#",
      duration: "Reference",
      instructor: "Saem's Tunes",
      tags: ["Guitar", "Chords", "Beginner"],
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "res2",
      title: "Piano Scales PDF Reference",
      description: "All major and minor piano scales with fingering patterns",
      category_id: "sheet_music",
      subject_category: "piano",
      level: "intermediate",
      is_locked: true,
      access_level: "premium",
      metadata: {},
      thumbnail_url: "/placeholder.svg",
      resource_url: "#",
      duration: "Reference",
      instructor: "Saem's Tunes",
      tags: ["Piano", "Scales", "Theory"],
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "res3",
      title: "Music Theory Fundamentals",
      description: "Essential theory concepts for any musician",
      category_id: "theory",
      subject_category: "theory",
      level: "beginner",
      is_locked: false,
      access_level: "free",
      metadata: {},
      thumbnail_url: "/placeholder.svg",
      resource_url: "#",
      duration: "45 min read",
      instructor: "Saem's Tunes",
      tags: ["Theory", "Beginner", "Fundamentals"],
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  const EmptyState = ({ title, description, icon: Icon }) => (
    <div className="text-center py-16">
      <div className="bg-muted/30 rounded-full p-6 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-medium mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-md mx-auto mb-6">
        {description}
      </p>
      <Button
        onClick={() => navigate("/discover")}
        className="bg-gold hover:bg-gold-dark text-white"
      >
        Explore Content
      </Button>
    </div>
  );

  const handleExclusiveContent = (contentId) => {
    navigate(`/subscriptions?contentType=exclusive&contentId=${contentId}`);
  };

  const CourseCard = ({ course }) => (
    <Card className="overflow-hidden h-full flex flex-col">
      <div className="relative aspect-video overflow-hidden">
        <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
        <div className="absolute top-2 right-2">
          <Badge className={course.enrolled ? "bg-green-600" : "bg-gold"}>
            {course.enrolled ? "Enrolled" : "Premium"}
          </Badge>
        </div>
        <div className="absolute bottom-2 left-2">
          <Badge variant="outline" className="bg-black/50 backdrop-blur-sm text-white capitalize">
            {course.level}
          </Badge>
        </div>
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{course.title}</CardTitle>
        <CardDescription className="line-clamp-2">{course.description}</CardDescription>
      </CardHeader>
      <CardContent className="pb-4 flex-1">
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span>Instructor: {course.instructor}</span>
          <span>{course.duration}</span>
        </div>
        {course.enrolled && (
          <div className="mt-2">
            <div className="text-sm text-muted-foreground mb-1 flex justify-between">
              <span>Progress</span>
              <span>{course.progress}%</span>
            </div>
            <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-gold"
                style={{ width: `${course.progress}%` }}
              ></div>
            </div>
          </div>
        )}
      </CardContent>
      <div className="p-4 pt-0">
        <Button
          className={cn("w-full", course.enrolled ? "bg-gold hover:bg-gold-dark" : "bg-muted-foreground")}
          onClick={() => {
            if (!course.enrolled) {
              handleExclusiveContent(course.id);
            } else {
              navigate(`/learning-hub/${course.id}`);
            }
          }}
        >
          {course.enrolled ? "Continue Learning" : "Enroll Now"}
        </Button>
      </div>
    </Card>
  );

  const handleQuizComplete = (score: number, total: number) => {
    toast({
      title: "Quiz Completed",
      description: `You scored ${score} out of ${total}! Keep learning and improving your music knowledge.`,
    });

    refetchProgress();

    if (!user && score >= total * 0.7) {
      setTimeout(() => {
        toast({
          title: "Great score! Sign in to save your progress",
          description: "Create an account to track your quiz scores and unlock more content",
          action: (
            <Button
              variant="outline"
              size="sm"
              className="whitespace-nowrap"
              onClick={() => navigate("/auth")}
            >
              Sign In
            </Button>

          ),
        });
      }, 1500);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-proxima font-bold">Our Music Library</h1>
            <p className="text-muted-foreground mt-1">
              Delve into exclusive fun content for your education
            </p>
          </div>
          {user && (
            <Button
              variant="outline"
              onClick={() => navigate("/discover")}
              className="hidden sm:flex"
            >
              <Music className="mr-2 h-4 w-4" />
              Discover More
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <DynamicMusicQuiz onComplete={handleQuizComplete} />
          </div>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Quiz Information</CardTitle>
                <CardDescription>
                  Your current subscription tier: <span className="font-bold capitalize">{user?.subscriptionTier || 'free'}</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {getTierDescription()}
                </p>
                {!user && (
                  <Button
                    className="w-full mt-4"
                    variant="outline"
                    onClick={() => navigate("/subscriptions")}
                  >
                    View Subscription Options
                  </Button>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Your Progress</CardTitle>
                <CardDescription>
                  Track your learning journey
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Completed Quizzes</span>
                    <Badge variant="outline">{getCompletedQuizIds().length}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Saved Resources</span>
                    <Badge variant="outline">{offlineResources.length}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Enrolled Courses</span>
                    <Badge variant="outline">{courses.filter(c => c.enrolled).length}</Badge>
                  </div>
                </div>
                <Button
                  className="w-full mt-4"
                  variant="outline"
                  onClick={() => navigate("/progress")}
                >
                  View Detailed Progress
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="relative rounded-lg overflow-hidden h-48 md:h-64 bg-gradient-to-r from-gold/70 to-brown/70 mb-8 cursor-pointer"
          onClick={() => handleExclusiveContent("master-class-guitar")}>
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent z-10"></div>
          <img
            src="https://i.imgur.com/DYWd4Ds.jpeg"
            alt="Featured Saem's content"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="relative z-20 p-6 flex flex-col h-full justify-end">
            <div className="inline-block bg-gold text-white px-2 py-1 rounded-md text-xs mb-2 w-fit">
              EXCLUSIVE
            </div>
            <h3 className="text-xl md:text-2xl font-proxima text-white font-bold mb-1">
              Master Class: Advanced Guitar Techniques
            </h3>
            <p className="text-white/80 text-sm md:text-base max-w-lg">
              Learn advanced techniques from Saem's top instructor
            </p>
          </div>
        </div>

        <RecommendationSection />

        <div className="mb-8">
          <h2 className="text-xl font-proxima font-semibold mb-4 flex items-center">
            <GraduationCap className="h-5 w-5 text-gold mr-2" />
            Music Courses
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {courses.map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-proxima font-semibold mb-4 flex items-center">
            <BookOpen className="h-5 w-5 text-gold mr-2" />
            Exclusive Content
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {saemOfferings.map(video => (
              <div
                key={video.id}
                className="cursor-pointer"
                onClick={() => handleExclusiveContent(video.id)}
              >
                <VideoCardWrapper key={video.id} video={video} isPremium={true} />
              </div>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-proxima font-semibold mb-4 flex items-center">
            <BookOpen className="h-5 w-5 text-gold mr-2" />
            Available Offline
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {offlineResources.map(resource => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                isBookmarked={true}
                onBookmark={() => {
                  toast({
                    title: "Removed from offline storage",
                    description: `${resource.title} is no longer available offline`,
                  });
                }}
              />
            ))}
            <Card className="flex flex-col items-center justify-center p-8 border-dashed cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => navigate("/resources")}>
              <div className="bg-gold/10 p-4 rounded-full mb-4">
                <BookOpen className="h-6 w-6 text-gold" />
              </div>
              <h3 className="font-medium mb-2">Save More Resources</h3>
              <p className="text-center text-sm text-muted-foreground">
                Browse our library to download more resources for offline use
              </p>
            </Card>
          </div>
        </div>

        <Tabs defaultValue="saved" className="w-full">
          <TabsList className="grid grid-cols-4">
            <TabsTrigger value="saved">
              <Bookmark className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Saved</span>
            </TabsTrigger>
            <TabsTrigger value="courses">
              <BookOpen className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Courses</span>
            </TabsTrigger>
            <TabsTrigger value="history">
              <Clock className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">History</span>
            </TabsTrigger>
            <TabsTrigger value="playlists">
              <LibraryIcon className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Playlists</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="saved" className="pt-4">
            {savedVideos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {savedVideos.map(video => (
                  <VideoCardWrapper
                    key={video.id}
                    video={video}
                    isPremium={video.isLocked}
                    onClick={() => navigate(`/videos/${video.id}`)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No Saved Content"
                description="Start saving videos, lessons, and resources to access them quickly in your library."
                icon={Bookmark}
              />
            )}
          </TabsContent>

          <TabsContent value="courses" className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {courses.filter(course => course.enrolled).map(course => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="history" className="pt-4">
            <EmptyState
              title="No Viewing History"
              description="Your recently watched Saem's content will appear here."
              icon={Clock}
            />
          </TabsContent>

          <TabsContent value="playlists" className="pt-4">
            <EmptyState
              title="No Playlists"
              description="Create playlists to organize your favorite Saem's content."
              icon={LibraryIcon}
            />
          </TabsContent>
        </Tabs>

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

export default Library;
