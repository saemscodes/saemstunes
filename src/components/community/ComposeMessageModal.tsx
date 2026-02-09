import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Loader2, Search, Send, User } from "lucide-react";
import { toast } from "sonner";

interface ComposeMessageModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (conversationId: string) => void;
}

const ComposeMessageModal = ({ isOpen, onClose, onSuccess }: ComposeMessageModalProps) => {
    const { user: currentUser } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);

    React.useEffect(() => {
        if (searchQuery.trim().length > 1) {
            const searchUsers = async () => {
                setSearching(true);
                const { data, error } = await supabase
                    .from('profiles')
                    .select('id, full_name, avatar_url')
                    .neq('id', currentUser?.id)
                    .ilike('full_name', `%${searchQuery}%`)
                    .limit(5);

                if (!error) setUsers(data || []);
                setSearching(false);
            };

            const timer = setTimeout(searchUsers, 500);
            return () => clearTimeout(timer);
        } else {
            setUsers([]);
        }
    }, [searchQuery, currentUser]);

    const handleSend = async () => {
        if (!selectedUser || !message.trim()) {
            toast.error("Please select a recipient and enter a message");
            return;
        }

        setSending(true);
        try {
            // 1. Check if conversation already exists
            const { data: existingConvs, error: convError } = await supabase
                .from('conversations')
                .select('id')
                .contains('participant_ids', [currentUser?.id, selectedUser.id]);

            let conversationId;
            if (!convError && existingConvs && existingConvs.length > 0) {
                conversationId = existingConvs[0].id;
            } else {
                // 2. Create new conversation
                const { data: newConv, error: createError } = await supabase
                    .from('conversations')
                    .insert({
                        participant_ids: [currentUser?.id, selectedUser.id],
                        participant_count: 2
                    })
                    .select()
                    .single();

                if (createError) throw createError;
                conversationId = newConv.id;
            }

            // 3. Send message
            const { error: sendError } = await supabase
                .from('direct_messages')
                .insert({
                    conversation_id: conversationId,
                    sender_id: currentUser?.id,
                    message: message
                });

            if (sendError) throw sendError;

            toast.success("Message sent!");
            onSuccess(conversationId);
            onClose();
            setMessage('');
            setSelectedUser(null);
            setSearchQuery('');
        } catch (error: any) {
            toast.error(`Failed to send message: ${error.message}`);
        } finally {
            setSending(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] bg-[#121417] border-white/5 text-white">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black italic tracking-tighter flex items-center gap-2">
                        Compose New Message
                    </DialogTitle>
                    <DialogDescription className="text-gray-500">
                        Start a direct conversation with another member of the community.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Recipient</Label>
                        {selectedUser ? (
                            <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-gold/20">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8 rounded-lg border border-white/10">
                                        <AvatarImage src={selectedUser.avatar_url || ''} />
                                        <AvatarFallback className="bg-gold/10 text-gold">{selectedUser.full_name?.charAt(0) || 'U'}</AvatarFallback>
                                    </Avatar>
                                    <p className="text-sm font-bold">{selectedUser.full_name}</p>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)} className="h-8 hover:bg-white/5">Change</Button>
                            </div>
                        ) : (
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                <Input
                                    placeholder="Search by name..."
                                    className="pl-10 h-12 bg-white/5 border-none rounded-xl"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />

                                {searching && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <Loader2 className="h-4 w-4 animate-spin text-gold" />
                                    </div>
                                )}

                                {users.length > 0 && (
                                    <div className="absolute top-14 left-0 right-0 z-50 bg-[#1A1C1F] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                                        {users.map(u => (
                                            <button
                                                key={u.id}
                                                className="w-full p-4 flex items-center gap-3 hover:bg-white/5 transition-all text-left"
                                                onClick={() => setSelectedUser(u)}
                                            >
                                                <Avatar className="h-8 w-8 rounded-lg">
                                                    <AvatarImage src={u.avatar_url || ''} />
                                                    <AvatarFallback className="bg-white/5 text-gray-400">{u.full_name?.charAt(0) || 'U'}</AvatarFallback>
                                                </Avatar>
                                                <p className="text-sm font-medium">{u.full_name}</p>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="message" className="text-[10px] font-black uppercase tracking-widest text-gray-500">Message</Label>
                        <Textarea
                            id="message"
                            placeholder="What would you like to say?"
                            className="bg-white/5 border-none min-h-[120px] rounded-xl resize-none"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
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
                            onClick={handleSend}
                            className="bg-gold hover:bg-amber-600 text-white rounded-xl px-8 font-bold"
                            disabled={!selectedUser || !message.trim() || sending}
                        >
                            {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                            Send Message
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ComposeMessageModal;
