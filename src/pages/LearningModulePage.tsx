import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Play, Clock, BookOpen, Music, Award, Lock, ChevronRight, FileText, Download, Share2, Video } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCourseDetails } from '@/hooks/useLearningContent';
import { useAuth } from '@/context/AuthContext';
import ResourceList from '@/components/learning/ResourceList';
import PurchaseModal from '@/components/payment/PurchaseModal';
import { usePayment } from '@/hooks/usePayment';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import MainLayout from '@/components/layout/MainLayout';

const LearningModulePage = () => {
  const { courseId, moduleId } = useParams();
  const navigate = useNavigate();
  const { user, subscription } = useAuth();
  const { data: course, isLoading } = useCourseDetails(courseId);
  const { checkAccess } = usePayment();

  const [activeModuleId, setActiveModuleId] = useState<string | null>(moduleId || null);
  const [activeClassId, setActiveClassId] = useState<string | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [purchaseItem, setPurchaseItem] = useState<any>(null);

  // Sync state with URL
  useEffect(() => {
    if (moduleId && !activeModuleId) {
      setActiveModuleId(moduleId);
    }
  }, [moduleId]);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container py-12 flex flex-col items-center justify-center">
          <Clock className="h-12 w-12 animate-spin text-gold mb-4" />
          <p className="text-muted-foreground animate-pulse">Loading your musical journey...</p>
        </div>
      </MainLayout>
    );
  }

  if (!course) {
    return (
      <MainLayout>
        <div className="container py-8 text-center">
          <h1 className="text-2xl font-bold">Course not found</h1>
          <p className="mt-2 text-muted-foreground">The requested course could not be located.</p>
          <Button className="mt-6" onClick={() => navigate('/learning-hub')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Learning Hub
          </Button>
        </div>
      </MainLayout>
    );
  }

  const activeModule = course.modules?.find(m => m.id === activeModuleId) || course.modules?.[0];
  const activeClass = activeModule?.classes?.find(c => c.id === activeClassId) || activeModule?.classes?.[0];
  const activeLesson = activeClass?.class_lessons?.find(l => l.id === activeLessonId) || activeClass?.class_lessons?.[0];

  const handleLessonClick = (lesson: any) => {
    setActiveLessonId(lesson.id);
    // Track progress here in future
  };

  const handlePurchaseClick = (item: any) => {
    setPurchaseItem(item);
    setIsPurchaseModalOpen(true);
  };

  return (
    <MainLayout>
      <div className="container py-6">
        <div className="flex flex-col gap-8">
          {/* 1. Hierarchy Header (Course Info) */}
          <div className="space-y-4">
            <Link to="/learning-hub" className="text-sm text-muted-foreground hover:text-gold transition-colors flex items-center gap-2 w-fit group">
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Learning Hub / {course.title}
            </Link>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
              <div>
                <h1 className="text-4xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-gold to-amber-600">
                  {course.title}
                </h1>
                <p className="text-muted-foreground max-w-2xl mt-2">{course.description}</p>
              </div>
              <div className="flex items-center gap-4 bg-accent/30 p-4 rounded-xl backdrop-blur-sm border border-gold/10">
                <div className="text-center px-4">
                  <p className="text-2xl font-bold text-gold">{course.modules?.length || 0}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Modules</p>
                </div>
                <Separator orientation="vertical" className="h-8" />
                <div className="text-center px-4">
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <p className="text-2xl font-bold">12%</p>
                  </div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Progress</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* 2. Navigation Sidebar (Module > Class) */}
            <div className="lg:col-span-4 space-y-6">
              <Card className="border-gold/20 shadow-xl overflow-hidden bg-gradient-to-b from-card to-background">
                <CardHeader className="bg-gold/5 border-b border-gold/10">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-gold" />
                    Course Curriculum
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 max-h-[600px] overflow-y-auto custom-scrollbar">
                  <div className="divide-y divide-gold/10">
                    {course.modules?.map((module, mIdx) => (
                      <div key={module.id} className="group">
                        <button
                          onClick={() => setActiveModuleId(module.id)}
                          className={cn(
                            "w-full text-left p-4 hover:bg-gold/5 transition-all flex items-center justify-between",
                            activeModuleId === module.id && "bg-gold/10 border-l-4 border-gold"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-gold/60">0{mIdx + 1}</span>
                            <span className={cn("font-medium", activeModuleId === module.id && "text-gold")}>
                              {module.title}
                            </span>
                          </div>
                          <ChevronRight className={cn("h-4 w-4 transition-transform", activeModuleId === module.id && "rotate-90 text-gold")} />
                        </button>

                        {/* Classes within Module */}
                        {activeModuleId === module.id && (
                          <div className="bg-accent/20 py-2">
                            {module.classes?.map((cls, cIdx) => (
                              <button
                                key={cls.id}
                                onClick={() => setActiveClassId(cls.id)}
                                className={cn(
                                  "w-full text-left px-10 py-2 text-sm hover:text-gold transition-colors flex items-center gap-2",
                                  activeClassId === cls.id ? "text-gold font-semibold" : "text-muted-foreground"
                                )}
                              >
                                {activeClassId === cls.id ? <Play className="h-3 w-3 fill-current" /> : <Clock className="h-3 w-3" />}
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

              {/* Resource Library Hook */}
              <ResourceList
                entityType="module"
                entityId={activeModule?.id || ''}
                title={`${activeModule?.title || 'Module'} Resources`}
              />
            </div>

            {/* 3. Main Content Area (Class > Lesson) */}
            <div className="lg:col-span-8 space-y-6">
              {activeClass ? (
                <div className="space-y-6">
                  {/* Class Header */}
                  <div className="bg-gold/5 p-6 rounded-2xl border border-gold/10 flex justify-between items-center">
                    <div>
                      <Badge variant="outline" className="mb-2 border-gold text-gold-dark">
                        Current Class
                      </Badge>
                      <h2 className="text-2xl font-bold">{activeClass.title}</h2>
                      <p className="text-muted-foreground text-sm mt-1">{activeClass.description}</p>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 text-gold">
                      <Music className="h-5 w-5" />
                      <span className="text-sm font-semibold">{activeClass.difficulty_level || 1}/5 Difficulty</span>
                    </div>
                  </div>

                  {/* Lessons Grid (The 4th level) */}
                  <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                    {activeClass.class_lessons?.map((lesson, lIdx) => (
                      <Card
                        key={lesson.id}
                        className={cn(
                          "cursor-pointer transition-all hover:scale-[1.01] border-l-4",
                          activeLessonId === lesson.id ? "border-l-gold shadow-md" : "border-l-transparent"
                        )}
                        onClick={() => handleLessonClick(lesson)}
                      >
                        <CardContent className="p-4 flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0">
                            {lesson.lesson_type === 'video' ? <Video className="h-6 w-6 text-gold" /> : <FileText className="h-6 w-6 text-gold" />}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold flex items-center gap-2">
                              {lIdx + 1}. {lesson.title}
                              {lesson.is_preview && <Badge variant="secondary" className="bg-green-100 text-green-700 text-[10px] h-4">
                                PREVIEW
                              </Badge>}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{lesson.description}</p>
                          </div>
                          <div className="text-right flex items-center gap-3">
                            <span className="text-xs font-mono text-muted-foreground">{lesson.duration_minutes}m</span>
                            {lesson.is_preview ? (
                              <Button size="sm" className="bg-gold hover:bg-gold-dark text-white rounded-full">
                                Play
                              </Button>
                            ) : (
                              <Lock className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Active Lesson View */}
                  {activeLesson && (
                    <Card className="border-gold/10 shadow-lg overflow-hidden">
                      <div className="aspect-video bg-black relative">
                        {!activeLesson.is_preview && (
                          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
                            <Lock className="h-16 w-16 text-gold mb-4 animate-bounce" />
                            <h3 className="text-xl font-bold text-white mb-2">Wait, this lesson is locked!</h3>
                            <p className="text-gold-light/80 mb-6 max-w-sm">
                              Upgrade your subscription or purchase this course to unlock this lesson and many more.
                            </p>
                            <Button
                              onClick={() => handlePurchaseClick({ id: courseId, title: course.title, type: 'course', price: 2500 })}
                              className="bg-gold hover:bg-gold-dark text-white px-8"
                            >
                              Unlock Full Course - KES 2,500
                            </Button>
                          </div>
                        )}
                        {/* Video Player Placeholder */}
                        <div className="w-full h-full flex flex-col items-center justify-center text-white/50 bg-gradient-to-br from-neutral-900 to-black">
                          <Play className="h-20 w-20 opacity-20 mb-4" />
                          <p>Lesson Content Player System</p>
                        </div>
                      </div>
                      <CardHeader>
                        <CardTitle>{activeLesson.title}</CardTitle>
                        <CardDescription>{activeLesson.description}</CardDescription>
                      </CardHeader>
                      <CardFooter className="bg-muted/30 border-t flex justify-between">
                        <Button variant="ghost" size="sm" className="gap-2">
                          <Download className="h-4 w-4" />
                          Download Materials
                        </Button>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Share2 className="h-4 w-4" />
                          Share Progress
                        </Button>
                      </CardFooter>
                    </Card>
                  )}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center p-12 bg-accent/10 rounded-3xl border-2 border-dashed border-gold/20">
                  <div className="text-center">
                    <BookOpen className="h-12 w-12 text-gold/30 mx-auto mb-4" />
                    <p className="text-muted-foreground">Select a module and class to start learning</p>
                  </div>
                </div>
              )}
            </div>
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
