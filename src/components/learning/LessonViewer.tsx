import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Play, Pause, CheckCircle, Clock, FileText, Headphones, Video,
    BookOpen, Zap, MessageSquare, ChevronDown, ChevronUp, Download,
    Star, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Lesson } from '@/hooks/useLearningContent';
import { useUpdateProgress } from '@/hooks/useUserProgress';
import ResourceList from './ResourceList';
import { toast } from 'sonner';

interface LessonViewerProps {
    lesson: Lesson;
    context: {
        courseId: string;
        moduleId: string;
        classId: string;
    };
    onComplete?: () => void;
}

const LESSON_TYPE_CONFIG: Record<string, { icon: React.ElementType; label: string; color: string }> = {
    video: { icon: Video, label: 'Video Lesson', color: 'text-blue-400' },
    audio: { icon: Headphones, label: 'Audio Lesson', color: 'text-purple-400' },
    text: { icon: FileText, label: 'Reading', color: 'text-emerald-400' },
    reading: { icon: BookOpen, label: 'Reading Material', color: 'text-emerald-400' },
    interactive: { icon: Zap, label: 'Interactive', color: 'text-amber-400' },
    practice: { icon: Star, label: 'Practice Exercise', color: 'text-gold' },
    quiz: { icon: AlertCircle, label: 'Quiz', color: 'text-rose-400' },
};

const LessonViewer: React.FC<LessonViewerProps> = ({ lesson, context, onComplete }) => {
    const [showNotes, setShowNotes] = useState(false);
    const [personalNotes, setPersonalNotes] = useState('');
    const [isCompleted, setIsCompleted] = useState(false);
    const updateProgress = useUpdateProgress();

    const typeConfig = LESSON_TYPE_CONFIG[lesson.lesson_type] || LESSON_TYPE_CONFIG.text;
    const TypeIcon = typeConfig.icon;

    const handleMarkComplete = () => {
        updateProgress.mutate({
            entityType: 'lesson',
            entityId: lesson.id,
            status: 'completed',
            progressPercent: 100,
        }, {
            onSuccess: () => {
                setIsCompleted(true);
                toast.success('Lesson completed! 🎉');
                onComplete?.();
            }
        });
    };

    const renderContent = () => {
        if (!lesson.content_url) {
            return (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <BookOpen className="h-16 w-16 text-gray-600 mb-4" />
                    <h3 className="text-xl font-bold text-gray-300 mb-2">Content Coming Soon</h3>
                    <p className="text-gray-500 max-w-md">
                        This lesson's content is being prepared. Check back soon!
                    </p>
                </div>
            );
        }

        switch (lesson.lesson_type) {
            case 'video':
                return (
                    <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black">
                        {lesson.content_url.includes('youtube.com') || lesson.content_url.includes('youtu.be') ? (
                            <iframe
                                src={lesson.content_url.replace('watch?v=', 'embed/')}
                                className="w-full h-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                title={lesson.title}
                            />
                        ) : (
                            <video controls className="w-full h-full" preload="metadata">
                                <source src={lesson.content_url} />
                                Your browser does not support the video tag.
                            </video>
                        )}
                    </div>
                );

            case 'audio':
                return (
                    <div className="p-8 rounded-2xl bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/20">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center">
                                <Headphones className="h-8 w-8 text-purple-400" />
                            </div>
                            <div>
                                <h4 className="text-lg font-bold text-white">{lesson.title}</h4>
                                <p className="text-sm text-gray-400">{lesson.duration_minutes} minutes</p>
                            </div>
                        </div>
                        <audio controls className="w-full" preload="metadata">
                            <source src={lesson.content_url} />
                            Your browser does not support the audio tag.
                        </audio>
                    </div>
                );

            case 'text':
            case 'reading':
                return (
                    <div className="prose prose-invert prose-gold max-w-none p-6 md:p-8 rounded-2xl bg-white/[0.02] border border-white/5">
                        {lesson.content_url.startsWith('http') ? (
                            <iframe
                                src={lesson.content_url}
                                className="w-full min-h-[600px] rounded-xl border-0"
                                title={lesson.title}
                            />
                        ) : (
                            <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                                {lesson.description || 'Lesson content is loading...'}
                            </div>
                        )}
                    </div>
                );

            case 'interactive':
            case 'practice':
                return (
                    <div className="p-8 rounded-2xl bg-gradient-to-br from-amber-500/10 to-gold/10 border border-gold/20">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 rounded-2xl bg-gold/20 flex items-center justify-center">
                                <Zap className="h-8 w-8 text-gold" />
                            </div>
                            <div>
                                <h4 className="text-lg font-bold text-white">{lesson.title}</h4>
                                <p className="text-sm text-gray-400">Interactive content</p>
                            </div>
                        </div>
                        {lesson.content_url && (
                            <iframe
                                src={lesson.content_url}
                                className="w-full min-h-[500px] rounded-xl border border-white/10"
                                title={lesson.title}
                                sandbox="allow-scripts allow-same-origin"
                            />
                        )}
                    </div>
                );

            case 'quiz':
                return (
                    <div className="p-8 rounded-2xl bg-gradient-to-br from-rose-500/10 to-pink-500/10 border border-rose-500/20">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 rounded-2xl bg-rose-500/20 flex items-center justify-center">
                                <AlertCircle className="h-8 w-8 text-rose-400" />
                            </div>
                            <div>
                                <h4 className="text-lg font-bold text-white">{lesson.title}</h4>
                                <p className="text-sm text-gray-400">Test your knowledge</p>
                            </div>
                        </div>
                        {lesson.content_url ? (
                            <iframe
                                src={lesson.content_url}
                                className="w-full min-h-[500px] rounded-xl border border-white/10"
                                title={lesson.title}
                            />
                        ) : (
                            <p className="text-gray-400 text-center py-8">Quiz content is being prepared.</p>
                        )}
                    </div>
                );

            default:
                return (
                    <div className="text-center py-12 text-gray-500">
                        <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Content type not yet supported</p>
                    </div>
                );
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
        >
            {/* Lesson Header */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-3 flex-1">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center",
                        isCompleted ? "bg-green-500/20" : "bg-white/5"
                    )}>
                        {isCompleted ? (
                            <CheckCircle className="h-5 w-5 text-green-400" />
                        ) : (
                            <TypeIcon className={cn("h-5 w-5", typeConfig.color)} />
                        )}
                    </div>
                    <div>
                        <Badge variant="outline" className={cn("text-[9px] font-black uppercase tracking-wider mb-1", typeConfig.color, "border-current/20")}>
                            {typeConfig.label}
                        </Badge>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Clock className="h-3.5 w-3.5" />
                            {lesson.duration_minutes} min
                            {lesson.has_pdf && <Badge variant="secondary" className="text-[8px] px-1.5 py-0">PDF</Badge>}
                            {lesson.has_audio && <Badge variant="secondary" className="text-[8px] px-1.5 py-0">Audio</Badge>}
                            {lesson.has_video && <Badge variant="secondary" className="text-[8px] px-1.5 py-0">Video</Badge>}
                        </div>
                    </div>
                </div>

                <Button
                    onClick={handleMarkComplete}
                    disabled={isCompleted || updateProgress.isPending}
                    className={cn(
                        "rounded-xl font-bold transition-all",
                        isCompleted
                            ? "bg-green-500/20 text-green-400 border border-green-500/30 cursor-default"
                            : "bg-gold hover:bg-gold-dark text-black"
                    )}
                >
                    {isCompleted ? (
                        <><CheckCircle className="h-4 w-4 mr-2" /> Completed</>
                    ) : (
                        <><CheckCircle className="h-4 w-4 mr-2" /> Mark Complete</>
                    )}
                </Button>
            </div>

            {/* Lesson Description */}
            {lesson.description && (
                <p className="text-gray-400 leading-relaxed">{lesson.description}</p>
            )}

            {/* Main Content */}
            {renderContent()}

            {/* Resources Section */}
            <ResourceList entityType="lesson" entityId={lesson.id} />

            {/* Personal Notes */}
            <div className="rounded-2xl bg-white/[0.02] border border-white/5 overflow-hidden">
                <button
                    onClick={() => setShowNotes(!showNotes)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-white/[0.02] transition-colors"
                >
                    <div className="flex items-center gap-2 text-gray-300 font-medium">
                        <MessageSquare className="h-4 w-4 text-gold" />
                        Personal Notes
                    </div>
                    {showNotes ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
                </button>
                {showNotes && (
                    <div className="px-4 pb-4">
                        <Textarea
                            value={personalNotes}
                            onChange={(e) => setPersonalNotes(e.target.value)}
                            placeholder="Add your notes about this lesson..."
                            className="bg-white/5 border-white/10 text-gray-300 placeholder:text-gray-600 rounded-xl min-h-[120px] resize-none"
                        />
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default LessonViewer;
