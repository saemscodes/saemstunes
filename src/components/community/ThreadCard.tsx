import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Pin, Lock, Tag, Clock, ChevronRight, BookOpen, Music, Layout, Heart } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Thread, useCommunity } from '@/hooks/useCommunity';
import { cn } from '@/lib/utils';

interface ThreadCardProps {
    thread: Thread;
    onClick: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
    'Technique': 'text-blue-500 bg-blue-500/10',
    'Theory': 'text-amber-500 bg-amber-500/10',
    'Gear': 'text-emerald-500 bg-emerald-500/10',
    'Performance': 'text-pink-500 bg-pink-500/10',
    'General': 'text-gray-500 bg-gray-500/10'
};

const ENTITY_ICONS: Record<string, any> = {
    'course': BookOpen,
    'module': Layout,
    'lesson': Music
};

export const ThreadCard: React.FC<ThreadCardProps> = ({ thread, onClick }) => {
    const { useToggleReaction } = useCommunity();
    const toggleReaction = useToggleReaction();
    const EntityIcon = thread.linked_lesson_id ? Music : thread.linked_class_id ? Layout : thread.linked_course_id ? BookOpen : null;

    return (
        <Card
            className="group cursor-pointer transition-all hover:border-gold/30 hover:shadow-lg hover:shadow-gold/5 bg-card/50 backdrop-blur-sm border-white/5 rounded-2xl overflow-hidden"
            onClick={onClick}
        >
            <CardContent className="p-5">
                <div className="flex gap-4">
                    <Avatar className="h-12 w-12 rounded-2xl border-2 border-white/10 group-hover:border-gold/20 transition-colors">
                        <AvatarImage src={thread.author?.avatar_url} />
                        <AvatarFallback className="rounded-2xl bg-gold/10 text-gold text-lg">
                            {thread.author?.full_name?.charAt(0) || '?'}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    {thread.is_pinned && <Pin className="h-3 w-3 text-gold fill-current" />}
                                    {thread.is_locked && <Lock className="h-3 w-3 text-red-500" />}
                                    <h3 className="text-base font-bold text-gray-200 group-hover:text-gold transition-colors line-clamp-1">
                                        {thread.title}
                                    </h3>
                                </div>
                                <div className="flex items-center gap-3 text-[10px] uppercase font-bold tracking-wider text-gray-500">
                                    <span className={cn("px-2 py-0.5 rounded-full", CATEGORY_COLORS[thread.category] || CATEGORY_COLORS['General'])}>
                                        {thread.category}
                                    </span>
                                    <span>•</span>
                                    <span>{thread.author?.full_name || 'Anonymous'}</span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {formatDistanceToNow(new Date(thread.created_at))} ago
                                    </span>
                                </div>
                            </div>

                            {EntityIcon && (
                                <div className="p-2 rounded-xl bg-gold/5 border border-gold/10 text-gold" title="Linked Content">
                                    <EntityIcon className="h-4 w-4" />
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-between pt-2">
                            <div className="flex gap-2">
                                {thread.tags?.map(tag => (
                                    <Badge key={tag} variant="outline" className="text-[9px] bg-white/5 border-white/10 text-gray-400 font-medium">
                                        #{tag}
                                    </Badge>
                                ))}
                            </div>

                            <div className="flex items-center gap-4 text-xs font-bold text-gray-500">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleReaction.mutate({
                                            reactableId: thread.id,
                                            reactableType: 'thread',
                                            reactionType: 'like'
                                        });
                                    }}
                                    className="flex items-center gap-1.5 hover:text-red-500 transition-colors"
                                >
                                    <Heart className={cn("h-4 w-4", thread.reaction_count > 0 && "fill-red-500 text-red-500")} />
                                    {thread.reaction_count || 0}
                                </button>
                                <div className="flex items-center gap-1.5 group-hover:text-gold transition-colors">
                                    <MessageCircle className="h-4 w-4" />
                                    {thread.reply_count || 0}
                                </div>
                                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
