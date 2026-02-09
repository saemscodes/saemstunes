import React, { useState } from 'react';
import { useCommunity, Thread } from '@/hooks/useCommunity';
import { ThreadCard } from './ThreadCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plus, Filter, MessageSquareCode, Loader2, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface ForumListProps {
    onThreadSelect: (thread: Thread) => void;
}

const CATEGORIES = ['All', 'Technique', 'Theory', 'Gear', 'Performance', 'General'];

export const ForumList: React.FC<ForumListProps> = ({ onThreadSelect }) => {
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const { useThreads, useCreateThread } = useCommunity();
    const { data: threads, isLoading: threadsLoading } = useThreads(selectedCategory === 'All' ? undefined : selectedCategory);
    const createThread = useCreateThread();

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newThread, setNewThread] = useState({ title: '', category: 'General', content: '' });

    const handleCreateThread = () => {
        createThread.mutate({
            title: newThread.title,
            category: newThread.category,
            tags: []
        }, {
            onSuccess: () => {
                setIsCreateOpen(false);
                setNewThread({ title: '', category: 'General', content: '' });
            }
        });
    };

    const filteredThreads = threads?.filter(t =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header & Search */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div className="relative w-full sm:max-w-md group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-gold transition-colors" />
                    <Input
                        placeholder="Search discussions..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-11 h-12 bg-white/5 border-white/10 rounded-2xl focus-visible:ring-gold/20 focus-visible:border-gold/30 transition-all"
                    />
                </div>

                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="h-12 px-6 bg-gold hover:bg-gold-dark text-white rounded-2xl font-bold shadow-lg shadow-gold/20 w-full sm:w-auto">
                            <Plus className="mr-2 h-5 w-5" />
                            New Discussion
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] bg-[#0f1112] border-white/5">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold text-white">Start a Discussion</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-6 py-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gold uppercase tracking-widest">Topic Title</label>
                                <Input
                                    placeholder="e.g. How to master vibrato on violin?"
                                    value={newThread.title}
                                    onChange={(e) => setNewThread({ ...newThread, title: e.target.value })}
                                    className="bg-white/5 border-white/10"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gold uppercase tracking-widest">Category</label>
                                <Select value={newThread.category} onValueChange={(val) => setNewThread({ ...newThread, category: val })}>
                                    <SelectTrigger className="bg-white/5 border-white/10">
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CATEGORIES.slice(1).map(cat => (
                                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gold uppercase tracking-widest">Initial Post Content</label>
                                <Textarea
                                    placeholder="Share your thoughts, ask a question, or provide details..."
                                    rows={5}
                                    value={newThread.content}
                                    onChange={(e) => setNewThread({ ...newThread, content: e.target.value })}
                                    className="resize-none bg-white/5 border-white/10"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleCreateThread} className="w-full bg-gold hover:bg-gold-dark text-white h-12 rounded-xl font-bold">
                                Launch Discussion
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Categories Horizontal Scroll */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-none">
                {CATEGORIES.map(cat => (
                    <Button
                        key={cat}
                        variant={selectedCategory === cat ? 'default' : 'ghost'}
                        onClick={() => setSelectedCategory(cat)}
                        className={cn(
                            "h-9 px-5 rounded-full text-xs font-bold uppercase tracking-widest transition-all",
                            selectedCategory === cat
                                ? "bg-gold text-white shadow-lg shadow-gold/20"
                                : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                        )}
                    >
                        {cat}
                    </Button>
                ))}
            </div>

            {/* Threads List */}
            <div className="space-y-4">
                {threadsLoading ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-4 text-gray-500">
                        <Loader2 className="h-10 w-10 animate-spin text-gold/40" />
                        <p className="text-sm font-medium uppercase tracking-[0.2em]">Syncing community...</p>
                    </div>
                ) : filteredThreads?.length === 0 ? (
                    <div className="py-20 text-center space-y-4 border-2 border-dashed border-white/5 rounded-3xl">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto">
                            <Info className="h-8 w-8 text-gray-600" />
                        </div>
                        <p className="text-gray-500 font-medium">No discussions found in this category.</p>
                        <Button variant="link" className="text-gold" onClick={() => setSelectedCategory('All')}>View all discussions</Button>
                    </div>
                ) : (
                    filteredThreads?.map(thread => (
                        <ThreadCard
                            key={thread.id}
                            thread={thread}
                            onClick={() => onThreadSelect(thread)}
                        />
                    ))
                )}
            </div>

            <div className="p-8 mt-12 bg-gold/5 rounded-[2rem] border border-gold/10 text-center">
                <MessageSquareCode className="h-10 w-10 text-gold/40 mx-auto mb-4" />
                <h4 className="text-lg font-bold text-white mb-2">Community Guidelines</h4>
                <p className="text-sm text-gray-400 max-w-lg mx-auto leading-relaxed">
                    Be respectful, keep it musical, and support your fellow learners. We all grow faster together!
                </p>
            </div>
        </div>
    );
};
