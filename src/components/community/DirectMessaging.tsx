import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Send, PlusCircle, Image, Mic, Smile, Loader2, Music, MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useCommunity } from "@/hooks/useCommunity";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

const DirectMessaging = () => {
  const { user } = useAuth();
  const { useMessageThreads, useDirectMessages, useSendMessage, useStreamingMessages } = useCommunity();
  const { data: threads, isLoading: threadsLoading } = useMessageThreads();
  const sendMessage = useSendMessage();

  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Use the hook for real messages
  const { data: messages = [], isLoading: messagesLoading } = useDirectMessages(selectedThreadId || '');

  // Real-time updates
  useStreamingMessages(selectedThreadId || '');

  const selectedThread = threads?.find(t => t.id === selectedThreadId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (selectedThreadId) {
      scrollToBottom();
    }
  }, [messages.length, selectedThreadId]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedThreadId) return;

    sendMessage.mutate({
      conversationId: selectedThreadId,
      message: newMessage
    }, {
      onSuccess: () => {
        setNewMessage('');
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (threadsLoading) {
    return <div className="flex items-center justify-center h-[500px]">
      <Loader2 className="h-8 w-8 animate-spin text-gold" />
    </div>;
  }

  return (
    <div className="flex flex-col h-[600px] md:max-h-[600px] bg-[#0A0B0C] rounded-b-2xl overflow-hidden border-t border-white/5">
      <div className="flex h-full">
        {/* Conversations sidebar */}
        <div className="hidden md:flex md:w-80 flex-col border-r border-white/5 bg-[#121417]">
          <div className="p-5 border-b border-white/5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search conversations..."
                className="pl-10 h-10 bg-white/5 border-none rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {threads?.map(thread => {
              const otherParticipant = thread.participants?.find((p: any) => p.id !== user?.id);
              return (
                <button
                  key={thread.id}
                  className={cn(
                    "w-full px-5 py-4 flex items-center gap-4 hover:bg-white/5 transition-all text-left group",
                    selectedThreadId === thread.id && "bg-white/5 border-l-2 border-gold"
                  )}
                  onClick={() => setSelectedThreadId(thread.id)}
                >
                  <div className="relative">
                    <Avatar className="h-12 w-12 rounded-xl border border-white/10 ring-2 ring-transparent group-hover:ring-gold/20 transition-all">
                      <AvatarImage src={otherParticipant?.avatar_url || ''} />
                      <AvatarFallback className="bg-gold/10 text-gold font-bold">{otherParticipant?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    {thread.unread_count > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-gold rounded-full text-[10px] flex items-center justify-center text-white font-black shadow-lg">
                        {thread.unread_count}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <p className="font-bold text-white truncate text-sm">{otherParticipant?.full_name || 'Guest User'}</p>
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        {thread.last_message_at ? formatDistanceToNow(new Date(thread.last_message_at), { addSuffix: false }) : ''}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{thread.last_message_content || 'No messages yet'}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="p-5 border-t border-white/5">
            <Button className="w-full h-11 bg-gold hover:bg-amber-600 text-white font-bold rounded-xl">
              <PlusCircle className="h-4 w-4 mr-2" />
              Start New Chat
            </Button>
          </div>
        </div>

        {/* Message view */}
        <div className="flex-1 flex flex-col bg-[#0A0B0C]">
          {selectedThread ? (
            <>
              {/* Conversation header */}
              <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-[#121417]/50 backdrop-blur-md">
                <div className="flex items-center gap-4">
                  <Avatar className="h-10 w-10 rounded-lg border border-white/10">
                    <AvatarImage src={selectedThread.participants?.find((p: any) => p.id !== user?.id)?.avatar_url || ''} />
                    <AvatarFallback className="bg-gold/10 text-gold">{selectedThread.participants?.find((p: any) => p.id !== user?.id)?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-bold text-white text-sm">{selectedThread.participants?.find((p: any) => p.id !== user?.id)?.full_name || 'Chat'}</p>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      <p className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Active Member</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {messagesLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-gold/20" />
                  </div>
                ) : (
                  <>
                    {messages.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center opacity-30">
                        <MessageCircle className="h-12 w-12 text-gray-500 mb-2" />
                        <p className="text-sm italic text-gray-500">Send the first message to start the thread.</p>
                      </div>
                    )}
                    {messages.map((message: any) => (
                      <div
                        key={message.id}
                        className={cn(
                          "flex",
                          message.sender_id === user?.id ? "justify-end" : "justify-start"
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[80%] rounded-2xl px-5 py-3 text-sm shadow-xl",
                            message.sender_id === user?.id
                              ? "bg-gold text-white rounded-br-none"
                              : "bg-[#121417] text-gray-200 border border-white/5 rounded-bl-none"
                          )}
                        >
                          <p className="leading-relaxed">{message.message}</p>
                          <p className={cn(
                            "text-[9px] font-black uppercase tracking-widest mt-2 opacity-50 px-1",
                            message.sender_id === user?.id ? "text-right" : "text-left"
                          )}>
                            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message input */}
              <div className="p-6 bg-[#121417]/50 border-t border-white/5">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-10 w-10 text-gray-500 hover:text-gold hover:bg-gold/10 rounded-xl">
                      <PlusCircle className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 text-gray-500 hover:text-gold hover:bg-gold/10 rounded-xl"
                    >
                      <Image className="h-5 w-5" />
                    </Button>
                  </div>

                  <div className="flex-1 relative">
                    <Input
                      placeholder="Share your musical journey..."
                      className="h-12 bg-white/5 border-none rounded-2xl px-5 text-sm ring-offset-0 focus-visible:ring-1 focus-visible:ring-gold/30"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 text-gray-600">
                      <Smile className="h-5 w-5 cursor-pointer hover:text-gold transition-colors" />
                    </div>
                  </div>

                  <Button
                    size="icon"
                    className={cn(
                      "h-12 w-12 rounded-2xl bg-gold hover:bg-amber-600 text-white shadow-lg shadow-gold/20 transition-all",
                      !newMessage.trim() && "opacity-50 grayscale"
                    )}
                    disabled={!newMessage.trim() || sendMessage.isPending}
                    onClick={handleSendMessage}
                  >
                    {sendMessage.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6">
                <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center">
                  <Music className="h-8 w-8 text-gold" />
                </div>
              </div>
              <h3 className="text-xl font-black text-white mb-2">Your Conversations</h3>
              <p className="text-gray-500 text-sm max-w-xs">
                Select a thread from the sidebar to chat with mentors and students across the platform.
              </p>
              <Button className="mt-8 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 h-11 px-8 font-bold">
                Compose New Message
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DirectMessaging;
