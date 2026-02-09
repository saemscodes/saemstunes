import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Play, Clock, BookOpen, Music, Award, Lock, ChevronRight, FileText, Download, Share2, Video, MessageCircle, Plus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCourseDetails } from '@/hooks/useLearningContent';
import { useAuth } from '@/context/AuthContext';
import ResourceList from '@/components/learning/ResourceList';
import PurchaseModal from '@/components/payment/PurchaseModal';
import { usePayment } from '@/hooks/usePayment';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import MainLayout from '@/components/layout/MainLayout';
import { useUserProgress } from '@/hooks/useUserProgress';
import { useCommunity } from '@/hooks/useCommunity';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const LearningModulePage = () => {
  const { courseId, moduleId } = useParams();
  const navigate = useNavigate();
  const { user, subscription } = useAuth();
  const { data: course, isLoading: courseLoading } = useCourseDetails(courseId);
  const { progressQuery: userProgressQueryResult } = useUserProgress();
  const { checkAccess } = usePayment();
  const { useUpdateProgress, isCompleted } = useUserProgress();
  const updateProgress = useUpdateProgress();

  const { useThreadsForEntity, useCreateThread } = useCommunity();
  const createThread = useCreateThread();

  const tierHierarchy = { 'free': 0, 'basic': 1, 'premium': 2, 'professional': 3 };
  const userTier = (subscription?.tier as 'free' | 'basic' | 'premium' | 'professional') || 'free';

  const [activeModuleId, setActiveModuleId] = useState<string | null>(moduleId || null);
  const [activeClassId, setActiveClassId] = useState<string | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);

  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [purchaseItem, setPurchaseItem] = useState<any>(null);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newThreadTitle, setNewThreadTitle] = useState("");
  const [newThreadContent, setNewThreadContent] = useState("");

  const activeModule = course?.modules?.find(m => m.id === activeModuleId) || course?.modules?.[0];
  const activeClass = activeModule?.classes?.find(c => c.id === activeClassId) || activeModule?.classes?.[0];
  const activeLesson = activeClass?.lessons?.find(l => l.id === activeLessonId) || activeClass?.lessons?.[0];

  // Calculate actual progress if not provided by backend
  if (course && !course.progress && userProgressQueryResult.data) {
    const lessonIds = course.modules?.flatMap(m => m.classes?.flatMap(c => c.lessons?.map(l => l.id) || []) || []) || [];
    const completedCount = lessonIds.filter(id =>
      userProgressQueryResult.data?.some(p => p.entity_id === id && p.status === 'completed')
    ).length;
    course.progress = lessonIds.length > 0 ? (completedCount / lessonIds.length) * 100 : 0;
  }

  // Fetch threads for the active entity (prioritize lesson, then class, then module)
  const entityType = activeLesson ? 'lesson' : (activeClass ? 'class' : (activeModule ? 'module' : null));
  const entityId = activeLesson?.id || activeClass?.id || activeModule?.id;
  const { data: entityThreads, isLoading: threadsLoading } = useThreadsForEntity(entityType as any, entityId as string);

  // Sync state with URL
  useEffect(() => {
    if (moduleId && !activeModuleId) {
      setActiveModuleId(moduleId);
    }
  }, [moduleId]);

  const handleLessonClick = (lesson: any) => {
    setActiveLessonId(lesson.id);
    updateProgress.mutate({ entityType: 'lesson', entityId: lesson.id, status: 'started' });
  };

  const handleCreateThread = () => {
    if (!newThreadTitle.trim() || !newThreadContent.trim() || !entityId) return;

    createThread.mutate({
      title: newThreadTitle,
      content: newThreadContent,
      category: 'general',
      linked_course_id: course?.id,
      linked_module_id: activeModule?.id,
      linked_class_id: activeClass?.id,
      linked_lesson_id: activeLesson?.id
    }, {
      onSuccess: () => {
        setIsCreateDialogOpen(false);
        setNewThreadTitle("");
        setNewThreadContent("");
        toast.success("Discussion started for this lesson!");
      }
    });
  };

  if (courseLoading) {
    return (
      <MainLayout>
        <div className="container py-32 flex flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-gold mb-4" />
          <p className="text-muted-foreground animate-pulse font-medium uppercase tracking-widest text-xs">Loading Studio...</p>
        </div>
      </MainLayout>
    );
  }

  if (!course) {
    return (
      <MainLayout>
        <div className="container py-24 text-center">
          <h1 className="text-3xl font-black text-white">Course not found</h1>
          <p className="mt-4 text-gray-500">The requested course could not be located in our library.</p>
          <Button className="mt-8 bg-gold text-white font-bold h-12 px-8 rounded-xl" onClick={() => navigate('/learning-hub')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Library
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container py-10">
        <div className="flex flex-col gap-10">
          {/* Course Header */}
          <div className="space-y-6">
            <Link to="/learning-hub" className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 hover:text-gold transition-colors flex items-center gap-2 w-fit group">
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Library / {course.title}
            </Link>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div className="space-y-2">
                <h1 className="text-5xl font-black tracking-tighter text-white">
                  {course.title}
                </h1>
                <p className="text-gray-500 max-w-2xl text-sm font-medium leading-relaxed">{course.description}</p>
              </div>
              <div className="flex items-center gap-6 bg-[#121417] p-6 rounded-3xl border border-white/5 shadow-2xl">
                <div className="text-center px-4">
                  <p className="text-3xl font-black text-gold">{course.modules?.length || 0}</p>
                  <p className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-600">Modules</p>
                </div>
                <div className="h-10 w-[1px] bg-white/5" />
                <div className="text-center px-4">
                  <div className="flex items-center gap-1.5 justify-center">
                    <CheckCircle className={cn("h-3 w-3",
                      (course.progress || 0) > 0 ? "text-emerald-500" : "text-gray-600"
                    )} />
                    <p className="text-3xl font-black text-white">
                      {Math.round(course.progress || 0)}%
                    </p>
                  </div>
                  <p className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-600">Progress</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Navigation Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            <Card className="bg-[#121417] border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
              <CardHeader className="p-6 bg-white/[0.02] border-b border-white/5">
                <CardTitle className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-2 text-white">
                  <BookOpen className="h-4 w-4 text-gold" />
                  Curriculum
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 max-h-[500px] overflow-y-auto custom-scrollbar">
                <div className="divide-y divide-white/5">
                  {course.modules?.map((module, mIdx) => (
                    <div key={module.id} className="group">
                      <button
                        onClick={() => setActiveModuleId(module.id)}
                        className={cn(
                          "w-full text-left p-5 hover:bg-white/5 transition-all flex items-center justify-between",
                          activeModuleId === module.id && "bg-gold/5 border-l-4 border-gold"
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-[10px] font-black text-gold/30">{(mIdx + 1).toString().padStart(2, '0')}</span>
                          <span className={cn("text-sm font-bold transition-colors", activeModuleId === module.id ? "text-gold" : "text-gray-300 group-hover:text-white")}>
                            {module.title}
                          </span>
                        </div>
                        <ChevronRight className={cn("h-4 w-4 transition-transform text-gray-600", activeModuleId === module.id && "rotate-90 text-gold")} />
                      </button>

                      {activeModuleId === module.id && (
                        <div className="bg-black/20 py-3 space-y-1">
                          {module.classes?.map((cls) => (
                            <button
                              key={cls.id}
                              onClick={() => setActiveClassId(cls.id)}
                              className={cn(
                                "w-full text-left px-12 py-2.5 text-xs hover:text-gold transition-colors flex items-center gap-3",
                                activeClassId === cls.id ? "text-gold font-black" : "text-gray-500 font-bold"
                              )}
                            >
                              <div className={cn("w-1.5 h-1.5 rounded-full", activeClassId === cls.id ? "bg-gold animate-pulse shadow-[0_0_8px_rgba(166,124,0,0.8)]" : "bg-gray-800")} />
                              {cls.title}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <ResourceList
              entityType="module"
              entityId={activeModule?.id || ''}
              title="Module Assets"
              className="bg-[#121417] border-white/5 rounded-[2.5rem] shadow-xl"
            />
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-10">
            {activeLesson ? (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
                {/* Video/Content Player Section */}
                <div className="aspect-video relative rounded-[3rem] overflow-hidden bg-black shadow-3xl border border-white/5 group">
                  {!activeLesson.is_preview && tierHierarchy[userTier] < 1 && (
                    <div className="absolute inset-0 z-30 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-12 text-center">
                      <div className="w-24 h-24 rounded-full bg-gold/10 flex items-center justify-center mb-8 shadow-2xl">
                        <Lock className="h-10 w-10 text-gold" />
                      </div>
                      <h3 className="text-3xl font-black text-white mb-3">Begin Your Advanced Journey</h3>
                      <p className="text-gray-500 mb-10 max-w-sm font-medium">
                        This premium lesson is reserved for our community members. Unlock this and 100+ other masterclasses.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-5">
                        <Button
                          onClick={() => {
                            setPurchaseItem({ id: course.id, title: course.title, type: 'course', price: 2500 });
                            setIsPurchaseModalOpen(true);
                          }}
                          className="bg-gold hover:bg-amber-600 text-white h-14 px-10 rounded-2xl font-black shadow-2xl shadow-gold/20 text-xs uppercase tracking-widest"
                        >
                          Unlock Course - KES 2,500
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => navigate('/subscriptions')}
                          className="border-white/10 text-white hover:bg-white/5 h-14 px-10 rounded-2xl font-black text-xs uppercase tracking-widest"
                        >
                          View All Plans
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#121417] to-black">
                    {activeLesson.lesson_type === 'video' ? (
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        className="w-24 h-24 rounded-full bg-gold flex items-center justify-center cursor-pointer shadow-2xl shadow-gold/40 transition-all group/play"
                      >
                        <Play className="h-10 w-10 text-white ml-1.5" fill="currentColor" />
                      </motion.div>
                    ) : (
                      <div className="flex flex-col items-center gap-6 opacity-30">
                        <FileText className="h-20 w-20 text-gold" />
                        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white">Study Material</p>
                      </div>
                    )}
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black via-black/40 to-transparent flex justify-between items-end opacity-0 group-hover:opacity-100 transition-all duration-500">
                    <div className="flex items-center gap-4">
                      <Badge className="bg-gold/20 text-gold border-none rounded-lg px-3 py-1 text-[10px] font-black">{activeLesson.duration_minutes} MIN</Badge>
                      <span className="text-white/50 text-[10px] font-black uppercase tracking-widest">{activeLesson.lesson_type}</span>
                    </div>
                    <Button size="icon" variant="ghost" className="text-white/40 hover:text-gold hover:bg-gold/10 rounded-xl">
                      <Share2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                {/* Lesson Info Section */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
                  <div className="md:col-span-8 space-y-10">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-black text-[8px] uppercase tracking-widest">{activeModule?.title}</Badge>
                        <div className="h-1 w-1 rounded-full bg-gray-700" />
                        <Badge className="bg-gold/10 text-gold border-none font-black text-[8px] uppercase tracking-widest">{activeClass?.title}</Badge>
                      </div>
                      <h2 className="text-4xl font-black text-white tracking-tighter leading-none">{activeLesson.title}</h2>
                      <p className="text-gray-500 text-lg italic font-medium">"{activeLesson.description}"</p>
                    </div>

                    {/* Community Integration Section (Smart Backlinks) */}
                    <div className="space-y-6 pt-10 border-t border-white/5">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-3">
                          <MessageCircle className="h-5 w-5 text-gold" />
                          Lesson Discussions
                        </h3>
                        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" className="rounded-xl border-white/10 text-white font-black text-[10px] uppercase tracking-widest h-9 px-4 gap-2 hover:bg-gold hover:border-gold transition-all">
                              <Plus className="h-3.5 w-3.5" />
                              Start Thread
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-[#0A0B0C] border-white/10 rounded-[2.5rem] p-8 max-w-xl">
                            <DialogHeader>
                              <DialogTitle className="text-2xl font-black text-white tracking-tighter mb-4">Discuss this Lesson</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-5">
                              <div className="space-y-2">
                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest pl-2">Subject</label>
                                <Input
                                  placeholder="Your question or insight..."
                                  value={newThreadTitle}
                                  onChange={(e) => setNewThreadTitle(e.target.value)}
                                  className="h-12 bg-white/5 border-none rounded-xl text-sm"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest pl-2">Content</label>
                                <Textarea
                                  placeholder="Share something with your fellow students..."
                                  value={newThreadContent}
                                  onChange={(e) => setNewThreadContent(e.target.value)}
                                  className="min-h-[150px] bg-white/5 border-none rounded-2xl p-5 text-sm resize-none"
                                />
                              </div>
                              <Button
                                onClick={handleCreateThread}
                                disabled={createThread.isPending}
                                className="w-full h-12 bg-gold hover:bg-amber-600 text-white font-bold rounded-xl shadow-lg"
                              >
                                {createThread.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Publish to Course Forum"}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>

                      <div className="space-y-4">
                        {threadsLoading ? (
                          <div className="h-20 bg-white/5 rounded-2xl animate-pulse" />
                        ) : entityThreads && entityThreads.length > 0 ? (
                          entityThreads.map((thread: any) => (
                            <div
                              key={thread.id}
                              onClick={() => navigate(`/community/thread/${thread.id}`)}
                              className="p-4 bg-white/[0.03] rounded-2xl border border-white/5 flex items-center justify-between hover:bg-white/5 cursor-pointer transition-all group"
                            >
                              <div className="flex items-center gap-4">
                                <Avatar className="h-10 w-10 rounded-xl">
                                  <AvatarImage src={thread.author?.avatar_url} />
                                  <AvatarFallback className="bg-gold/10 text-gold">{thread.author?.full_name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-sm font-bold text-gray-200 group-hover:text-gold transition-colors">{thread.title}</p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <p className="text-[10px] font-bold text-gray-500 tracking-widest uppercase">
                                      {thread.author?.full_name} • {formatDistanceToNow(new Date(thread.created_at), { addSuffix: true })}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <ChevronRight className="h-4 w-4 text-gray-700 group-hover:text-gold group-hover:translate-x-1 transition-all" />
                            </div>
                          ))
                        ) : (
                          <div className="p-8 text-center bg-white/[0.02] border border-dashed border-white/5 rounded-3xl">
                            <p className="text-gray-600 text-xs italic">No discussions yet. Be the first to start the conversation!</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Sidebar Extras */}
                  <div className="md:col-span-4 space-y-8">
                    <ResourceList
                      entityType="lesson"
                      entityId={activeLesson.id}
                      title="Lesson Assets"
                      className="bg-[#121417] border-white/5 rounded-[2.5rem] shadow-xl"
                    />

                    <Card className="bg-gold/5 border-gold/10 rounded-[2.5rem] overflow-hidden shadow-2xl p-8 relative">
                      <div className="absolute -top-10 -right-10 opacity-5">
                        <Award className="h-32 w-32" />
                      </div>
                      <div className="relative z-10 space-y-6">
                        <div>
                          <h4 className="text-[10px] font-black text-gold uppercase tracking-[0.3em] mb-4">Session Control</h4>
                          {activeClass.lessons?.filter(l => l.id !== activeLesson.id).slice(0, 1).map(next => (
                            <div key={next.id} className="group cursor-pointer mb-6" onClick={() => handleLessonClick(next)}>
                              <p className="text-xs text-gray-500 mb-1 font-bold">Up Next</p>
                              <h4 className="font-bold text-white group-hover:text-gold transition-colors line-clamp-1">{next.title}</h4>
                            </div>
                          ))}
                        </div>
                        <Button
                          className="w-full h-14 bg-white/5 hover:bg-gold hover:text-white transition-all text-white rounded-2xl border border-white/10 font-black text-[10px] uppercase tracking-widest shadow-xl"
                          disabled={isCompleted?.(activeLesson.id) || updateProgress.isPending}
                          onClick={() => {
                            updateProgress.mutate({
                              entityType: 'lesson',
                              entityId: activeLesson.id,
                              status: 'completed',
                              progressPercent: 100
                            });
                          }}
                        >
                          {updateProgress.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-3" /> : (isCompleted?.(activeLesson.id) ? <CheckCircle className="h-4 w-4 mr-3" /> : null)}
                          {isCompleted?.(activeLesson.id) ? 'Completed' : 'Mark Lesson Done'}
                        </Button>
                      </div>
                    </Card>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-[60vh] flex flex-col items-center justify-center p-12 bg-[#121417]/30 rounded-[3.5rem] border-2 border-dashed border-white/5 text-center">
                <div className="w-24 h-24 rounded-full bg-gold/5 flex items-center justify-center mb-6 shadow-3xl">
                  <Music className="h-10 w-10 text-gold/20" />
                </div>
                <h3 className="text-2xl font-black text-white mb-2">Select Your Lesson</h3>
                <p className="text-gray-500 max-w-xs font-medium italic">Begin today's practice by selecting a module from the curriculum menu.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {purchaseItem && (
        <PurchaseModal
          isOpen={isPurchaseModalOpen}
          onClose={() => setIsPurchaseModalOpen(false)}
          item={purchaseItem}
        />
      )}
    </MainLayout>
  );
};

export default LearningModulePage;

import { motion } from "framer-motion";
