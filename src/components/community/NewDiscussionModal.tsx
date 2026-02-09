import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCommunity } from "@/hooks/useCommunity";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";

interface NewDiscussionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const NewDiscussionModal = ({ isOpen, onClose }: NewDiscussionModalProps) => {
    const { useCreateThread } = useCommunity();
    const createThread = useCreateThread();

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState('General');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) {
            toast.error("Please fill in all fields");
            return;
        }

        createThread.mutate({
            title,
            content,
            category,
            tags: []
        }, {
            onSuccess: () => {
                setTitle('');
                setContent('');
                setCategory('General');
                onClose();
            }
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] bg-[#121417] border-white/5 text-white">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black italic tracking-tighter">Start New Discussion</DialogTitle>
                    <DialogDescription className="text-gray-500">
                        Share your thoughts, ask questions, or start a debate with the community.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                    <div className="space-y-2">
                        <Label htmlFor="title" className="text-[10px] font-black uppercase tracking-widest text-gray-500">Title</Label>
                        <Input
                            id="title"
                            placeholder="What's on your mind?"
                            className="bg-white/5 border-none h-12 rounded-xl"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="category" className="text-[10px] font-black uppercase tracking-widest text-gray-500">Category</Label>
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger className="bg-white/5 border-none h-12 rounded-xl">
                                <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#121417] border-white/5 text-white">
                                <SelectItem value="General">General</SelectItem>
                                <SelectItem value="Technique">Technique</SelectItem>
                                <SelectItem value="Theory">Theory</SelectItem>
                                <SelectItem value="Gear">Gear</SelectItem>
                                <SelectItem value="Inspiration">Inspiration</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="content" className="text-[10px] font-black uppercase tracking-widest text-gray-500">Content</Label>
                        <Textarea
                            id="content"
                            placeholder="Tell us more..."
                            className="bg-white/5 border-none min-h-[150px] rounded-xl resize-none"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                        />
                    </div>

                    <DialogFooter className="pt-4">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            className="rounded-xl hover:bg-white/5"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="bg-gold hover:bg-amber-600 text-white rounded-xl px-8 font-bold"
                            disabled={createThread.isPending}
                        >
                            {createThread.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                            Post Discussion
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default NewDiscussionModal;
