import React, { useState, useEffect, useRef, useCallback } from "react";
import MainLayout from "@/components/layout/MainLayout";
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BookOpen, Play, Trophy, CheckCircle, ChevronRight, Music,
  Star, Users, Sparkles, Filter, Search, ArrowRight, Clock, Zap
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { useLearningContent } from "@/hooks/useLearningContent";
import { useUserProgress } from "@/hooks/useUserProgress";
import { toast } from "sonner";
import CircularText from "@/components/learning-hub/CircularText";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

// Access Policy Constants
const ACCESS_LEVELS = {
  free: { level: 0, label: 'Free', color: 'bg-green-500' },
  basic: { level: 1, label: 'Basic', color: 'bg-blue-500' },
  premium: { level: 2, label: 'Premium', color: 'bg-purple-500' },
  professional: { level: 3, label: 'Professional', color: 'bg-gold' },
  admin: { level: 4, label: 'Admin', color: 'bg-red-500' }
};

const LearningHub = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Data Hooks
  const { useCourses, useMusicCategories } = useLearningContent();
  const { data: coursesData, isLoading: coursesLoading } = useCourses();
  const { data: categoriesData, isLoading: categoriesLoading } = useMusicCategories();
  const { progressQuery: userProgressQueryResult, useAchievements } = useUserProgress();
  const { data: userAchievementsData } = useAchievements();

  // Filter logic
  const filteredCourses = coursesData?.filter(course => {
    const matchesCategory = !selectedCategory || course.category_id === selectedCategory;
    const matchesSearch = !searchQuery ||
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCourseProgress = (courseId: string) => {
    return userProgressQueryResult.data?.find(
      p => p.entity_id === courseId && p.entity_type === 'course'
    )?.progress_percent || 0;
  };

  const getGreeting = () => {
    const name = profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || "Musician";
    const hour = new Date().getHours();
    if (hour < 12) return `Good Morning, ${name}`;
    if (hour < 18) return `Good Afternoon, ${name}`;
    return `Good Evening, ${name}`;
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-[#0A0B0C] text-white pb-32">
        {/* Immersive Hero Section */}
        <section className="relative pt-12 pb-20 px-4 md:px-8 overflow-hidden">
          {/* Background Decorative Elements */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gold/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-primary/5 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="max-w-7xl mx-auto relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/20 w-fit">
                <Sparkles className="h-3.5 w-3.5 text-gold" />
                <span className="text-[10px] font-black uppercase tracking-widest text-gold-dark">Learning Hub v2.0</span>
              </div>

              <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-tight">
                {getGreeting()} <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-white to-gray-500">
                  Master Your Sound.
                </span>
              </h1>

              <p className="text-gray-400 max-w-2xl text-lg md:text-xl font-medium leading-relaxed">
                Unlock the 4-Level mastery curriculum. From foundations to professional performance,
                everything you need is right here.
              </p>

              <div className="flex flex-wrap gap-4 pt-4">
                <Button
                  onClick={() => navigate('/learning-hub/my-path')}
                  className="bg-gold hover:bg-gold-dark text-black font-black px-8 h-14 rounded-2xl transition-all hover:scale-105 active:scale-95"
                >
                  Continue My Path
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
                <div className="relative group flex-1 max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 group-focus-within:text-gold transition-colors" />
                  <input
                    type="text"
                    placeholder="Search courses, techniques..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-14 pl-12 pr-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Category Filter Pills */}
        <section className="sticky top-0 z-40 bg-[#0A0B0C]/80 backdrop-blur-xl border-y border-white/5 py-6 px-4 md:px-8 mb-12">
          <div className="max-w-7xl mx-auto flex items-center gap-4 overflow-x-auto no-scrollbar">
            <Button
              variant="ghost"
              onClick={() => setSelectedCategory(null)}
              className={cn(
                "rounded-full px-6 transition-all font-bold shrink-0",
                !selectedCategory ? "bg-gold text-black hover:bg-gold/90" : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              All Topics
            </Button>
            {categoriesLoading ? (
              Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-10 w-24 rounded-full bg-white/5" />)
            ) : (
              categoriesData?.map(category => (
                <Button
                  key={category.id}
                  variant="ghost"
                  onClick={() => setSelectedCategory(category.id)}
                  className={cn(
                    "rounded-full px-6 transition-all font-bold shrink-0 border border-transparent",
                    selectedCategory === category.id
                      ? "bg-white/10 border-gold/30 text-gold shadow-[0_0_20px_rgba(198,155,54,0.15)]"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <div className="flex items-center gap-2">
                    {category.name}
                  </div>
                </Button>
              ))
            )}
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* Main Course Grid */}
          <div className="lg:col-span-3 space-y-12">
            <section>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-black tracking-tighter">Your <span className="text-gold">Curriculum</span></h2>
                  <p className="text-gray-500 text-sm font-medium">Browse our expert-led musical paths</p>
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gold" />
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Filter By Tier</span>
                </div>
              </div>

              {coursesLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Array(4).fill(0).map((_, i) => (
                    <div key={i} className="h-80 rounded-3xl bg-white/5 animate-pulse" />
                  ))}
                </div>
              ) : filteredCourses?.length === 0 ? (
                <div className="text-center py-20 bg-white/5 rounded-[2.5rem] border border-dashed border-white/10">
                  <BookOpen className="h-16 w-16 text-gray-700 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-400">No courses found matching your criteria</h3>
                  <Button
                    variant="link"
                    onClick={() => { setSearchQuery(""); setSelectedCategory(null); }}
                    className="text-gold mt-2"
                  >
                    Clear all filters
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {filteredCourses?.map((course, index) => {
                    const progress = getCourseProgress(course.id);
                    const userTier = profile?.subscription_tier || 'free';
                    const requiredTier = course.access_tier || 'free';
                    const hasAccess = ACCESS_LEVELS[userTier as keyof typeof ACCESS_LEVELS]?.level >=
                      ACCESS_LEVELS[requiredTier as keyof typeof ACCESS_LEVELS]?.level ||
                      profile?.role === 'admin';

                    return (
                      <motion.div
                        key={course.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card
                          className="group relative overflow-hidden rounded-[2.5rem] bg-[#121417] border border-white/5 hover:border-gold/30 transition-all duration-500 hover:shadow-[0_20px_40px_rgba(0,0,0,0.5)] cursor-pointer"
                          onClick={() => navigate(`/learning-hub/${course.id}`)}
                        >
                          {/* Card Media Wrapper */}
                          <div className="aspect-[16/10] overflow-hidden relative">
                            {course.thumbnail_url ? (
                              <img
                                src={course.thumbnail_url}
                                alt={course.title}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-white/5 to-white/10 flex items-center justify-center">
                                <Music className="h-16 w-16 text-white/10" />
                              </div>
                            )}

                            <div className="absolute inset-0 bg-gradient-to-t from-[#121417] via-[#121417]/20 to-transparent" />

                            {/* Tier Badge */}
                            <div className="absolute top-6 right-6">
                              <Badge
                                className={cn(
                                  "rounded-full px-4 py-1 font-black text-[10px] tracking-widest uppercase border-0",
                                  requiredTier === 'free' ? "bg-emerald-500 text-white" :
                                    requiredTier === 'basic' ? "bg-blue-500 text-white" :
                                      requiredTier === 'premium' ? "bg-purple-500 text-white" : "bg-gold text-black"
                                )}
                              >
                                {requiredTier}
                              </Badge>
                            </div>

                            {!hasAccess && (
                              <div className="absolute inset-0 backdrop-blur-md bg-black/40 flex items-center justify-center p-6 text-center">
                                <div className="space-y-4">
                                  <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center mx-auto border border-gold/30">
                                    <Zap className="h-8 w-8 text-gold" />
                                  </div>
                                  <h4 className="text-xl font-black">Upgrade to Unlock</h4>
                                  <Button className="bg-gold text-black font-black rounded-xl">View Plans</Button>
                                </div>
                              </div>
                            )}
                          </div>

                          <CardHeader className="relative -mt-16 pt-0 px-8">
                            <div className="flex items-center gap-2 mb-3">
                              <Badge variant="outline" className="text-[10px] font-bold text-gold border-gold/20 uppercase">
                                {course.category?.name || "Music Theory"}
                              </Badge>
                              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1">
                                <Clock className="h-3 w-3" /> {course.estimated_time || "4h 20m"}
                              </span>
                            </div>
                            <CardTitle className="text-2xl font-black tracking-tighter group-hover:text-gold transition-colors">
                              {course.title}
                            </CardTitle>
                            <CardDescription className="text-gray-400 line-clamp-2 text-sm leading-relaxed mt-2">
                              {course.description}
                            </CardDescription>
                          </CardHeader>

                          <CardContent className="px-8 pb-8">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-gold">
                                  ST
                                </div>
                                <div>
                                  <p className="text-xs font-black uppercase tracking-widest text-white">Saem's Tunes</p>
                                  <p className="text-[10px] text-gray-500 font-bold">MASTER INSTRUCTOR</p>
                                </div>
                              </div>

                              <div className="relative">
                                <CircularText
                                  value={progress}
                                  size={44}
                                  strokeWidth={4}
                                  showPercentage={false}
                                  textColor="#C69B36"
                                  trailColor="rgba(255,255,255,0.05)"
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                  {progress === 100 ? (
                                    <CheckCircle className="h-4 w-4 text-gold" />
                                  ) : (
                                    <Play className="h-4 w-4 text-white group-hover:text-gold transition-colors" />
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          {/* Right Sidebar: Progress & Achievements */}
          <aside className="space-y-12">
            {/* Quick Stats Panel */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-[#121417] rounded-[2.5rem] p-8 border border-white/5 space-y-8"
            >
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 flex items-center gap-2">
                <Trophy className="h-4 w-4 text-gold" />
                Live Progress
              </h3>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-sm font-black text-white">Overall Mastery</span>
                    <span className="text-2xl font-black text-gold">24%</span>
                  </div>
                  <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "24%" }}
                      className="h-full bg-gradient-to-r from-gold to-gold-dark"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">XP Points</p>
                    <p className="text-xl font-black text-white">1,240</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Rank</p>
                    <p className="text-xl font-black text-gold">Novice</p>
                  </div>
                </div>
              </div>

              <Separator className="bg-white/5" />

              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500">Latest Achievements</h4>
                <div className="space-y-3">
                  {userAchievementsData?.slice(0, 3).map((a, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 group hover:border-gold/30 transition-all">
                      <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center shrink-0">
                        <Star className="h-5 w-5 text-gold" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black truncate text-white">{a.achievement?.title}</p>
                        <p className="text-[10px] text-gray-500 font-bold truncate">UNLOCKED RECENTLY</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="ghost" className="w-full text-gold text-xs font-black uppercase tracking-widest hover:bg-gold/10">View All</Button>
              </div>
            </motion.div>

            {/* Support / Community Card */}
            <div className="rounded-[2.5rem] p-8 bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/20 overflow-hidden relative">
              <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-gold/20 blur-[60px] rounded-full" />
              <Users className="h-10 w-10 text-gold mb-4" />
              <h3 className="text-xl font-black tracking-tighter mb-2">Music Community</h3>
              <p className="text-sm text-gray-400 font-medium mb-6 leading-relaxed">
                Interact with other students, share your recordings, and get professional critiques.
              </p>
              <Button className="w-full bg-gold text-black font-black rounded-2xl">Join Discussion</Button>
            </div>
          </aside>
        </div>
      </div>
    </MainLayout>
  );
};

export default LearningHub;
