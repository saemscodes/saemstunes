import React, { useState, useEffect, useRef, useCallback } from "react";
import MainLayout from "@/components/layout/MainLayout";
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen, Play, Trophy, CheckCircle, ChevronRight, Music,
  Pin, History, Settings, Video, Users, Star, Download, Share2, Menu
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { gsap } from "gsap";
import { useSpring, animated } from "@react-spring/web";
import SplitText from "@/gsap/SplitText";
import CircularText from "@/components/learning-hub/CircularText";
import FlowingMenu from "@/components/learning-hub/FlowingMenu";
import Folder from "@/components/learning-hub/Folder";
import DarkVeil from "@/components/learning-hub/DarkVeil";
import PillNav from "@/components/learning-hub/PillNav";
import PreviewModal from "@/components/learning-hub/PreviewModal";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { useLearningContent } from "@/hooks/useLearningContent";
import { useUserProgress } from "@/hooks/useUserProgress";
import { toast } from "sonner";

// Access Policy Constants
const ACCESS_LEVELS = {
  free: { level: 0, label: 'Free', color: 'bg-green-500' },
  subscriber: { level: 1, label: 'Subscriber', color: 'bg-blue-500' },
  pro: { level: 2, label: 'Pro', color: 'bg-purple-500' },
  master: { level: 3, label: 'Master', color: 'bg-gold' },
  admin: { level: 4, label: 'Admin', color: 'bg-red-500' }
};

const PREVIEW_STRATEGIES = {
  video: { duration: 90, quality: '720p', watermark: true },
  audio: { duration: 60, bitrate: '64kbps', fadeOut: true },
  text: { paragraphs: 2, showOutline: true },
  interactive: { demoMode: true, limitedFeatures: true }
};

// Utility Functions
const calculateSavings = (currentLevel: string, targetLevel: string) => {
  const savings = {
    'free->subscriber': { monthly: 15, yearly: 180 },
    'free->pro': { monthly: 25, yearly: 300 },
    'subscriber->pro': { monthly: 10, yearly: 120 }
  };
  const key = `${currentLevel}->${targetLevel}` as keyof typeof savings;
  return savings[key] || { monthly: 20, yearly: 240 };
};

const getUpgradeBonuses = (targetLevel: string) => {
  const bonuses: Record<string, string[]> = {
    subscriber: ['Unlimited course access', 'Mobile app', 'Progress tracking'],
    pro: ['1:1 instructor sessions', 'Performance feedback', 'Certificate of completion', 'Advanced exercises'],
    master: ['Personal learning coach', 'Industry networking', 'Performance opportunities', 'Masterclass access']
  };
  return bonuses[targetLevel] || [];
};

const generateTestimonials = (category = "music") => [
  {
    name: 'Sarah M.',
    location: 'Nairobi, Kenya',
    message: `This ${category} course transformed my understanding completely!`,
    avatar: '/testimonials/sarah-m.jpg',
    verified: true
  },
  {
    name: 'David K.',
    location: 'Lagos, Nigeria',
    message: 'I went from beginner to performing in just 3 months.',
    avatar: '/testimonials/david-k.jpg',
    verified: true
  }
];

const getPersonalizedGreeting = (user: any) => {
  return user?.name ? `Hi ${user.name.split(' ')[0]}! Ready to learn?` : "Welcome to Saem's Tunes!";
};

const getMotivationalMessage = (progress: number | Record<string, number>) => {
  if (typeof progress === 'number') {
    if (progress <= 5) return "Small steps every day - you've got this!";
    if (progress < 50) return `You're ${progress}% through - keep going!`;
    return `Amazing progress - ${progress}% complete!`;
  }
  return "Your musical journey starts today. Let's begin!";
};

const LearningHub = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("my-path");
  const [previewData, setPreviewData] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [expandedFolder, setExpandedFolder] = useState<string | null>(null);
  const [mobileDockOpen, setMobileDockOpen] = useState(false);
  const dockRef = useRef<HTMLDivElement>(null);
  const folderRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Real Data
  const { useCourses, useCategories } = useLearningContent();
  const { data: coursesData, isLoading: coursesLoading } = useCourses();
  const { data: categoriesData, isLoading: categoriesLoading } = useCategories();
  const { progressQuery: userProgressQueryResult, useAchievements } = useUserProgress();
  const { data: userAchievementsData } = useAchievements();

  // Animation states
  const [titleAnimated, setTitleAnimated] = useState(false);
  const prefersReducedMotion = typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const titleAnimation = useSpring({
    from: { opacity: 0, transform: "translateY(20px)" },
    to: { opacity: 1, transform: "translateY(0)" },
    config: { duration: 800 },
    immediate: !titleAnimated || prefersReducedMotion
  });

  useEffect(() => {
    const hasAnimated = sessionStorage.getItem("titleAnimated");
    if (!hasAnimated) {
      setTitleAnimated(true);
      sessionStorage.setItem("titleAnimated", "true");
    }

    // Folder stagger animation
    gsap.from(folderRefs.current.filter(Boolean), {
      y: 20,
      opacity: 0,
      stagger: 0.1,
      duration: 0.6,
      ease: "power2.out",
      delay: 0.3
    });
  }, []);

  // Enhanced Access Control System
  const getEnhancedAccessStatus = useCallback((course: any) => {
    const requiredLevel = course?.accessLevel || 'free';
    const userLevel = user?.accessLevel || 'free';
    const hasAccess = ACCESS_LEVELS[userLevel].level >= ACCESS_LEVELS[requiredLevel].level;

    if (!user) {
      return {
        status: 'locked',
        action: 'signup',
        messaging: {
          primary: 'Unlock Your Musical Journey',
          secondary: `Join thousands of musicians learning ${course?.category || 'music'}`,
          cta: 'Start Free Trial',
          urgencyText: `${course?.enrollmentCount || Math.floor(Math.random() * 500) + 100} learners enrolled this month`
        },
        preview: {
          available: true,
          strategy: PREVIEW_STRATEGIES[course?.preview?.type || 'video'],
          teasers: [
            `Learn ${course?.skillsCount || '5+'} essential techniques`,
            `Master ${course?.title || 'this course'} in ${course?.estimatedTime || '2-4 weeks'}`,
            `Get personalized feedback from ${course?.instructor?.name || 'the instructor'}`
          ]
        },
        conversion: {
          redirect: `/auth?next=${encodeURIComponent(`/learning-hub/${course?.id}`)}`,
          incentive: 'first_month_free',
          social_proof: true
        }
      };
    }

    if (!hasAccess) {
      return {
        status: 'upgrade_required',
        action: 'upgrade',
        messaging: {
          primary: `Upgrade to ${ACCESS_LEVELS[requiredLevel].label} Access`,
          secondary: `Unlock ${course?.title || 'advanced content'} + many more courses`,
          cta: `Upgrade to ${ACCESS_LEVELS[requiredLevel].label}`,
          savings: calculateSavings(userLevel, requiredLevel)
        },
        preview: {
          available: true,
          strategy: PREVIEW_STRATEGIES[course?.preview?.type || 'video'],
          exclusive_glimpse: true
        },
        conversion: {
          redirect: `/pricing?upgrade=${requiredLevel}&from=${userLevel}`,
          trial: '7_day_free_trial',
          bonuses: getUpgradeBonuses(requiredLevel)
        }
      };
    }

    return {
      status: 'granted',
      action: course.progress > 0 ? 'continue' : 'start',
      messaging: {
        primary: course.progress > 0 ? 'Continue Your Journey' : 'Start Learning',
        secondary: course.progress > 0 ?
          `You're ${course.progress}% through this course` :
          'Begin your musical transformation today'
      }
    };
  }, [user]);

  const createPreviewExperience = useCallback((course: any) => {
    const accessStatus = getEnhancedAccessStatus(course);
    const mediaUrl = course?.preview?.url || null;
    const mediaType = course?.preview?.type || 'video';
    const duration = accessStatus?.preview?.strategy?.duration || course?.preview?.duration || 60;

    return {
      id: course.id,
      title: course.title,
      instructor: course.instructor,
      preview: {
        mediaUrl,
        mediaType,
        duration,
        poster: course.previewImage || null,
        chapters: course.preview?.chapters || [],
        transcript: course.preview?.transcript ?
          course.preview.transcript.slice(0, 200) + '...' : null
      },
      valueProps: [
        `Master ${course.skillsCount || '7+'} core techniques`,
        `Join ${course.communitySize || '2,500+'} active learners`,
        `Get ${course.instructor?.responseTime || '24-hour'} instructor support`
      ],
      socialProof: {
        studentCount: course.enrollmentCount || Math.floor(Math.random() * 1000) + 500,
        rating: course.averageRating || 4.8,
        testimonials: course.featured_testimonials || generateTestimonials(course.title)
      },
      conversion: accessStatus.conversion || {},
      urgency: {
        type: 'enrollment_deadline',
        message: 'Limited spots available this month',
        countdown: null
      },
      accessStatus
    };
  }, [getEnhancedAccessStatus]);

  // Content Interaction Handler
  const handleContentInteraction = useCallback((
    course: any,
    interactionType: 'preview' | 'enroll'
  ) => {
    const accessStatus = getEnhancedAccessStatus(course);

    // Track event
    console.log('Tracking: content_interaction', {
      courseId: course.id,
      accessStatus: accessStatus.status,
      interactionType,
      userLevel: user?.accessLevel || 'anonymous'
    });

    switch (accessStatus.status) {
      case 'locked':
      case 'upgrade_required':
        setPreviewData(createPreviewExperience(course));
        setShowPreview(true);
        break;

      case 'granted':
        if (interactionType === 'preview') {
          setPreviewData(createPreviewExperience(course));
          setShowPreview(true);
        } else {
          navigate(`/learning-hub/${course.id}`);
        }
        break;
    }
  }, [getEnhancedAccessStatus, createPreviewExperience, navigate, user]);

  // Enhanced Data Model
  // Transform dynamic data into internal structures
  const learningCategories = categoriesData?.map(cat => ({
    id: cat.id,
    title: cat.name,
    description: cat.description,
    icon: <Music className="h-6 w-6" />,
    color: cat.color || "bg-gradient-to-br from-blue-500 to-indigo-600",
    estimatedTime: cat.estimated_time || "4-8 weeks",
    courses: coursesData?.filter(c => c.category_id === cat.id).map(c => {
      // Calculate progress for each course
      const lessonIdsInCourse = []; // This would ideally come from useCourseDetails
      // For now we'll approximate or use a simplified approach since loading all details is expensive
      const courseProgress = userProgressQueryResult.data?.find(p => p.entity_id === c.id && p.entity_type === 'course')?.progress_percent || 0;

      return {
        ...c,
        progress: courseProgress,
        instructor: {
          name: c.instructor?.full_name || "Guest Instructor",
          avatar: c.instructor?.avatar_url,
          responseTime: "within 24 hours",
          rating: c.average_rating || 4.8
        },
        preview: {
          type: c.preview_type || "video",
          url: c.preview_url,
          duration: c.preview_duration || 60
        }
      };
    }) || []
  })) || [];

  const pinnedCourses = coursesData?.slice(0, 1).map(c => ({
    id: c.id,
    title: c.title,
    description: c.description,
    progress: userProgressQueryResult.data?.find(p => p.entity_id === c.id)?.progress_percent || 0,
    instructor: { name: c.instructor?.full_name || "Instructor" }
  })) || [];

  const achievements = userAchievementsData?.map(a => ({
    id: a.id,
    title: a.achievement?.title || "Achievement",
    description: a.achievement?.description || "Goal reached",
    icon: <Trophy className="h-5 w-5" />,
    unlocked: true,
    progress: 100
  })) || [];

  const pillNavItems = [
    { id: "my-path", label: "My Path" },
    { id: "all-courses", label: "All Courses" },
    { id: "free-content", label: "Free Content" },
    { id: "live-classes", label: "Live Classes" },
    { id: "new-releases", label: "New Releases" }
  ];

  // Folder toggle animation
  const handleFolderToggle = useCallback((folderId: string) => {
    setExpandedFolder(prev => prev === folderId ? null : folderId);
    const folderContent = document.getElementById(`folder-content-${folderId}`);

    if (folderContent) {
      gsap.to(folderContent, {
        height: "auto",
        opacity: 1,
        duration: 0.5,
        ease: "power2.inOut",
        onStart: () => {
          if (folderContent.style.height === "0px") {
            folderContent.style.overflow = "hidden";
          }
        },
        onComplete: () => {
          folderContent.style.overflow = "visible";
        }
      });
    }
  }, []);

  // Flowing menu items
  const flowingMenuItems = useCallback((course: any) => {
    const access = getEnhancedAccessStatus(course);

    return [
      {
        label: "Preview",
        icon: <Video className="h-4 w-4" />,
        action: () => handleContentInteraction(course, 'preview'),
        disabled: false
      },
      {
        label: "Book 1:1",
        icon: <Users className="h-4 w-4" />,
        action: () => navigate(`/booking/${course.instructor.id}`),
        disabled: !user
      },
      {
        label: access.status === "granted"
          ? (course.progress > 0 ? "Continue" : "Enroll")
          : (access.status === "locked" ? "Signup to Access" : "Upgrade Required"),
        icon: access.status === "granted"
          ? (course.progress > 0 ? <Play className="h-4 w-4" /> : <Star className="h-4 w-4" />)
          : <CheckCircle className="h-4 w-4" />,
        action: () => access.status === "granted"
          ? handleContentInteraction(course, 'enroll')
          : handleContentInteraction(course, 'preview'),
        disabled: access.status !== "granted"
      },
      {
        label: "Share",
        icon: <Share2 className="h-4 w-4" />,
        action: () => {
          if (typeof navigator !== 'undefined' && navigator.share) {
            navigator.share({
              title: course.title,
              text: `Check out this music course on Saem's Tunes: ${course.description}`,
              url: window.location.href
            }).catch(console.error);
          } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
            navigator.clipboard.writeText(window.location.href);
          }
        },
        disabled: false
      }
    ];
  }, [getEnhancedAccessStatus, handleContentInteraction, navigate, user]);

  return (
    <MainLayout>
      <DarkVeil
        isVisible={showPreview}
        onClick={() => setShowPreview(false)}
        hueShift={120}
        noiseIntensity={0.02}
        speed={0.3}
      />

      {showPreview && previewData && (
        <PreviewModal
          content={previewData}
          onClose={() => setShowPreview(false)}
          onSignup={() => navigate(`/auth?next=/learning-hub/${previewData.id}`)}
          onUpgrade={() => navigate("/pricing")}
        />
      )}

      <div className="hub-shell grid grid-cols-1 lg:grid-cols-[280px_1fr_320px] gap-8 min-h-screen p-4 md:p-8 lg:p-10 max-w-[1600px] mx-auto">
        <header className="col-span-full pt-4 px-2 mb-4">
          <animated.div style={titleAnimation} className="mb-4">
            <SplitText
              text="Let's Learn!"
              className="text-4xl font-serif font-bold text-gold"
              duration={0.8}
              stagger={0.03}
              from={{ opacity: 0, y: 20 }}
              to={{ opacity: 1, y: 0 }}
            />
          </animated.div>

          <PillNav
            items={pillNavItems}
            activeId={activeTab}
            onSelect={setActiveTab}
            className="mb-6"
          />
        </header>

        <aside
          ref={dockRef}
          className={`left-dock bg-cream/90 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-gold/10 transition-all duration-300 ${mobileDockOpen
            ? 'fixed inset-0 z-50 bg-cream p-8 overflow-y-auto'
            : 'hidden lg:block'
            }`}
        >
          {mobileDockOpen && (
            <div className="flex justify-between items-center mb-6 lg:hidden">
              <h2 className="text-xl font-bold text-gold">Your Learning Dock</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileDockOpen(false)}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          )}

          <div className="dock-content space-y-6">
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h3 className="flex items-center font-medium mb-3 text-gold-dark">
                <Play className="h-4 w-4 mr-2 text-gold" />
                Continue Learning
              </h3>
              <div className="space-y-3">
                {learningCategories.flatMap(cat => cat.courses as any)
                  .filter((course: any) => course.progress > 0 && course.progress < 100)
                  .slice(0, 2)
                  .map((course: any) => (
                    <Card key={course.id} className="relative group transition-transform hover:-translate-y-0.5">
                      <CardContent className="p-3">
                        <div className="flex items-center">
                          <CircularText
                            value={course.progress}
                            size={40}
                            strokeWidth={3}
                            className="mr-3 flex-shrink-0"
                            textColor={course.progress === 100 ? "#C69B36" : "#3B82F6"}
                            trailColor="#F8F6F0"
                          />
                          <div className="min-w-0">
                            <h4 className="font-medium text-sm truncate">{course.title}</h4>
                            <p className="text-xs text-muted-foreground truncate">
                              {course.instructor.name}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleContentInteraction(course, 'enroll')}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Card>
                  ))}
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h3 className="flex items-center font-medium mb-3 text-gold-dark">
                <Pin className="h-4 w-4 mr-2 text-gold" />
                Pinned Courses
              </h3>
              <div className="space-y-3">
                {pinnedCourses.map(course => (
                  <Card key={course.id} className="relative group transition-transform hover:-translate-y-0.5">
                    <CardContent className="p-3">
                      <div className="flex items-center">
                        <div className="bg-muted border-2 border-dashed rounded-xl w-16 h-16 mr-3 flex-shrink-0" />
                        <div className="min-w-0">
                          <h4 className="font-medium text-sm truncate">{course.title}</h4>
                          <p className="text-xs text-muted-foreground truncate">
                            {course.instructor.name}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => navigate(`/learning-hub/${course.id}`)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Card>
                ))}
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="flex items-center font-medium mb-3 text-gold-dark">
                <History className="h-4 w-4 mr-2 text-gold" />
                Recent Activity
              </h3>
              <div className="space-y-2 text-sm">
                <div className="p-3 bg-muted/20 rounded-lg transition-colors hover:bg-muted/40">
                  <p className="font-medium text-gold-dark">Completed Breathing Techniques</p>
                  <p className="text-xs text-muted-foreground mt-1">Yesterday</p>
                </div>
                <div className="p-3 bg-muted/20 rounded-lg transition-colors hover:bg-muted/40">
                  <p className="font-medium text-gold-dark">Earned Module Master badge</p>
                  <p className="text-xs text-muted-foreground mt-1">3 days ago</p>
                </div>
                <div className="p-3 bg-muted/20 rounded-lg transition-colors hover:bg-muted/40">
                  <p className="font-medium text-gold-dark">Pinned Stage Presence course</p>
                  <p className="text-xs text-muted-foreground mt-1">1 week ago</p>
                </div>
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="flex items-center font-medium mb-3 text-gold-dark">
                <Settings className="h-4 w-4 mr-2 text-gold" />
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="default" size="sm" className="w-full bg-gold text-white hover:bg-gold/90">
                  Book Class
                </Button>
                <Button variant="outline" size="sm" className="w-full">
                  Browse All
                </Button>
                <Button variant="outline" size="sm" className="w-full">
                  Settings
                </Button>
                <Button variant="outline" size="sm" className="w-full">
                  Help Center
                </Button>
              </div>
            </motion.section>
          </div>
        </aside>

        <main className="center-studio px-2 pb-12">
          <div className="folder-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {learningCategories.map((category, index) => (
              <div
                key={category.id}
                ref={el => folderRefs.current[index] = el}
              >
                <Folder
                  title={category.title}
                  description={category.description}
                  icon={category.icon}
                  color={category.color}
                  itemCount={category.courses.length}
                  isExpanded={expandedFolder === category.id}
                  onToggle={() => handleFolderToggle(category.id)}
                >
                  <div
                    id={`folder-content-${category.id}`}
                    className="course-grid grid grid-cols-1 gap-4 mt-4"
                  >
                    {category.courses.map(course => {
                      const access = getEnhancedAccessStatus(course);

                      return (
                        <Card
                          key={course.id}
                          className="course-card relative overflow-hidden group transition-all hover:shadow-lg"
                        >
                          <FlowingMenu
                            items={flowingMenuItems(course)}
                            trigger="hover"
                            className="absolute top-3 right-3 z-10"
                            mobileBehavior="long-press"
                          />

                          <CardHeader className="pb-3">
                            <div className="aspect-video bg-muted rounded-md relative overflow-hidden">
                              <div className="bg-gray-200 border-2 border-dashed rounded-xl w-full h-full" />
                              {access.status !== "granted" && (
                                <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                                  <Button
                                    variant="default"
                                    size="sm"
                                    className="bg-gold text-white hover:bg-gold/90"
                                    onClick={() => handleContentInteraction(course, 'preview')}
                                  >
                                    {access.status === "locked"
                                      ? "Unlock Preview"
                                      : "Upgrade to Access"}
                                  </Button>
                                </div>
                              )}
                            </div>
                            <CardTitle className="flex items-center justify-between">
                              <span className="truncate max-w-[70%]">{course.title}</span>
                              {course.accessLevel !== "free" && (
                                <span className="text-xs bg-gold/20 text-gold-dark px-2 py-1 rounded-full flex-shrink-0">
                                  {course.accessLevel === "pro" ? "PRO" : "PREMIUM"}
                                </span>
                              )}
                            </CardTitle>
                            <CardDescription className="truncate">{course.description}</CardDescription>
                          </CardHeader>

                          <CardContent>
                            <div className="flex justify-between items-center">
                              <div className="flex items-center space-x-2">
                                <CircularText
                                  value={course.progress}
                                  size={32}
                                  strokeWidth={3}
                                  showPercentage
                                  textColor={course.progress === 100 ? "#C69B36" : "#3B82F6"}
                                  trailColor="#F8F6F0"
                                />
                                <div className="min-w-0">
                                  <p className="text-xs text-muted-foreground truncate">
                                    {course.lessons} lessons • {course.duration} min
                                  </p>
                                  <p className="text-xs font-medium truncate">
                                    {course.instructor.name}
                                  </p>
                                </div>
                              </div>
                              <span className="text-xs px-2 py-1 bg-muted rounded-full whitespace-nowrap">
                                {course.level}
                              </span>
                            </div>
                          </CardContent>

                          <CardFooter>
                            <Button
                              className={`w-full transition-all ${access.status === "granted"
                                ? "bg-gold hover:bg-gold-dark text-white hover:shadow-gold/30"
                                : "hover:bg-muted"
                                }`}
                              variant={access.status === "granted" ? "default" : "outline"}
                              onClick={() =>
                                access.status === "granted"
                                  ? handleContentInteraction(course, 'enroll')
                                  : handleContentInteraction(course, 'preview')
                              }
                            >
                              {access.status === "granted"
                                ? course.progress > 0 ? "Continue" : "Start Learning"
                                : access.status === "locked" ? "Preview Course" : "Upgrade Required"}
                            </Button>
                          </CardFooter>
                        </Card>
                      );
                    })}
                  </div>
                </Folder>
              </div>
            ))}
          </div>
        </main>

        <aside className="right-panel bg-cream/90 backdrop-blur-sm rounded-xl p-4 hidden lg:block">
          <section className="mb-8">
            <h3 className="font-medium mb-4 flex items-center text-gold-dark">
              <Trophy className="h-5 w-5 mr-2 text-gold" />
              Your Achievements
            </h3>
            <div className="space-y-4">
              {achievements.map((achievement) => (
                <div key={achievement.id} className="flex items-center">
                  <div className="mr-3 relative flex-shrink-0">
                    <CircularText
                      value={achievement.unlocked ? 100 : achievement.progress}
                      size={48}
                      strokeWidth={4}
                      className={achievement.unlocked ? "text-gold" : "text-muted"}
                      textColor={achievement.unlocked ? "#C69B36" : "#9CA3AF"}
                      trailColor="#F8F6F0"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      {React.cloneElement(achievement.icon, {
                        className: `h-5 w-5 ${achievement.unlocked ? "text-gold" : "text-muted-foreground"
                          }`
                      })}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium">{achievement.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {achievement.description}
                    </p>
                    {!achievement.unlocked && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {achievement.progress}% complete
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="font-medium mb-4 flex items-center text-gold-dark">
              <Users className="h-5 w-5 mr-2 text-gold" />
              Community Activity
            </h3>
            <div className="space-y-3">
              <div className="p-3 bg-muted/20 rounded-lg transition-colors hover:bg-muted/40">
                <p className="text-sm">
                  <span className="font-medium text-gold-dark">Alex M.</span> just completed Vocal Warm-Ups
                </p>
                <p className="text-xs text-muted-foreground mt-1">2 minutes ago</p>
              </div>
              <div className="p-3 bg-muted/20 rounded-lg transition-colors hover:bg-muted/40">
                <p className="text-sm">
                  <span className="font-medium text-gold-dark">Taylor R.</span> earned Perfect Score achievement
                </p>
                <p className="text-xs text-muted-foreground mt-1">15 minutes ago</p>
              </div>
              <div className="p-3 bg-muted/20 rounded-lg transition-colors hover:bg-muted/40">
                <p className="text-sm">
                  <span className="font-medium text-gold-dark">Jordan K.</span> shared a performance
                </p>
                <p className="text-xs text-muted-foreground mt-1">1 hour ago</p>
              </div>
            </div>
            <Button variant="default" className="w-full mt-4 bg-gold text-white hover:bg-gold/90">
              Join Community
            </Button>
          </section>
        </aside>
      </div>

      <div className="fixed bottom-4 left-4 lg:hidden z-40">
        <Button
          variant="default"
          size="icon"
          className="shadow-lg shadow-gold/30"
          onClick={() => setMobileDockOpen(!mobileDockOpen)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      <div className="lg:hidden px-4 pb-6">
        <Tabs defaultValue="courses" className="w-full">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
          </TabsList>

          <TabsContent value="achievements" className="pt-4">
            <h3 className="font-medium mb-4 flex items-center text-gold-dark">
              <Trophy className="h-5 w-5 mr-2 text-gold" />
              Your Achievements
            </h3>
            <div className="space-y-4">
              {achievements.map((achievement) => (
                <Card key={achievement.id} className="flex items-center p-3">
                  <div className="mr-3 relative flex-shrink-0">
                    <CircularText
                      value={achievement.unlocked ? 100 : achievement.progress}
                      size={48}
                      strokeWidth={4}
                      className={achievement.unlocked ? "text-gold" : "text-muted"}
                      textColor={achievement.unlocked ? "#C69B36" : "#9CA3AF"}
                      trailColor="#F8F6F0"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      {React.cloneElement(achievement.icon, {
                        className: `h-5 w-5 ${achievement.unlocked ? "text-gold" : "text-muted-foreground"
                          }`
                      })}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium">{achievement.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {achievement.description}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default LearningHub;
