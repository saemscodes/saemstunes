import React, { useState } from 'react';
import { useThreadDetails, Post } from '@/hooks/useCommunity';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ArrowLeft, Heart, MessageCircle, Share2, MoreVertical, Send, ShieldCheck, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { SmartBacklink } from './SmartBacklink';
import { Badge } from '@/components/ui/badge';

interface PostListProps {
    threadId: string;
    onBack: () => void;
}

export const PostList: React.FC<PostListProps> = ({ threadId, onBack }) => {
    const { thread, posts, threadLoading, postsLoading, createPost } = useThreadDetails(threadId);
    const [replyContent, setReplyContent] = useState('');

    const handlePostReply = () => {
        if (!replyContent.trim()) return;
        createPost.mutate(replyContent, {
            onSuccess: () => setReplyContent('')
        });
    };

    if (threadLoading || postsLoading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-gold" />
                <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-gold/60">Loading Transmission...</p>
            </div>
        );
    }

    if (!thread) return <div>Thread not found</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col gap-6">
                <Button variant="ghost" onClick={onBack} className="w-fit text-gray-400 hover:text-white px-0 hover:bg-transparent">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Discussions
                </Button>

                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <Badge className="bg-gold/10 text-gold border-gold/20 uppercase tracking-widest text-[9px] h-5">
                            {thread.category}
                        </Badge>
                        {thread.pinned && <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 h-5 text-[9px]">PINNED</Badge>}
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight text-white">{thread.title}</h1>

                    {thread.reference_entity_type && thread.reference_entity_id && (
                        <SmartBacklink
                            entityType={thread.reference_entity_type as any}
                            entityId={thread.reference_entity_id}
                            entityName="Related Learning Material"
                        />
                    )}
                </div>
            </div>

            {/* Posts */}
            <div className="space-y-6">
                {posts?.map((post, index) => (
                    <div
                        key={post.id}
                        className={cn(
                            "p-6 rounded-3xl border transition-all",
                            index === 0
                                ? "bg-gold/5 border-gold/20 shadow-xl shadow-gold/5"
                                : "bg-white/5 border-white/5"
                        )}
                    >
                        <div className="flex gap-4">
                            <Avatar className="h-12 w-12 rounded-2xl">
                                <AvatarImage src={post.author?.avatar_url} />
                                <AvatarFallback className="rounded-2xl bg-white/10 text-gray-400">
                                    {post.author?.full_name?.charAt(0) || '?'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-gray-200">{post.author?.full_name}</span>
                                            {index === 0 && <Badge className="bg-gold text-white text-[9px] h-4">AUTHOR</Badge>}
                                            <ShieldCheck className="h-4 w-4 text-gold/60" />
                                        </div>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                                            {formatDistanceToNow(new Date(post.created_at))} ago
                                        </p>
                                    </div>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-500">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </div>

                                <div className="text-gray-300 leading-relaxed overflow-hidden break-words">
                                    {post.content}
                                </div>

                                <div className="flex items-center gap-6 pt-4 border-t border-white/5">
                                    <button className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-red-500 transition-colors group">
                                        <Heart className="h-4 w-4 group-hover:scale-110 transition-transform" />
                                        React
                                    </button>
                                    <button className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-gold transition-colors">
                                        <MessageCircle className="h-4 w-4" />
                                        Reply
                                    </button>
                                    <button className="flex items-center gap-2 text-xs font-bold text-gray-500 ml-auto opacity-40 hover:opacity-100 transition-opacity">
                                        <Share2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Reply Box */}
            {thread.locked ? (
                <div className="p-8 bg-red-500/5 border border-red-500/10 rounded-3xl text-center">
                    <Lock className="h-8 w-8 text-red-500/40 mx-auto mb-2" />
                    <p className="text-red-500/60 font-medium">This discussion is locked and no longer accepting replies.</p>
                </div>
            ) : (
                <div className="p-6 bg-[#16181a] rounded-[2.5rem] border border-white/5 space-y-4 sticky bottom-6 shadow-2xl backdrop-blur-xl">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center">
                            <Zap className="h-4 w-4 text-gold" />
                        </div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Share your perspective</p>
                    </div>
                    <Textarea
                        placeholder="Write your response..."
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        className="bg-white/5 border-white/10 rounded-2xl resize-none h-32 focus-visible:ring-gold/20"
                    />
                    <div className="flex justify-between items-center">
                        <p className="text-[10px] text-gray-600 font-bold uppercase">Markdown supported</p>
                        <Button
                            onClick={handlePostReply}
                            disabled={!replyContent.trim() || createPost.isPending}
                            className="bg-gold hover:bg-gold-dark text-white rounded-xl px-8 h-12 font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {createPost.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                                <>
                                    Post Reply
                                    <Send className="ml-2 h-4 w-4" />
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

import { cn } from '@/lib/utils';
import { Lock } from 'lucide-react';
