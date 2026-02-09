
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Music, Share, Heart, MessageCircle, MoreVertical, Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

interface AudioTrackProps {
  id: string;
  title: string;
  artist: string;
  artistImage: string;
  audioSrc: string;
  duration: string;
  likes: number;
  comments: number;
  isLiked?: boolean;
  isSaved?: boolean;
}

const AudioSharingCard = ({ track }: { track: AudioTrackProps }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(track.isLiked || false);
  const [likes, setLikes] = useState(track.likes);
  const [audioElement] = useState(new Audio(track.audioSrc));
  const { toast } = useToast();

  const togglePlay = () => {
    if (isPlaying) {
      audioElement.pause();
    } else {
      audioElement.play().catch(error => {
        console.error("Error playing audio:", error);
        toast({
          title: "Playback error",
          description: "Could not play the audio file",
          variant: "destructive"
        });
      });
    }
    setIsPlaying(!isPlaying);
  };

  const toggleLike = () => {
    setIsLiked(!isLiked);
    setLikes(isLiked ? likes - 1 : likes + 1);

    toast({
      title: isLiked ? "Removed like" : "Added like",
      description: isLiked ? "Track removed from your liked songs" : "Track added to your liked songs"
    });
  };

  const handleShare = () => {
    // Simulate sharing functionality
    toast({
      title: "Share options",
      description: "Sharing options would appear here"
    });
  };

  const handleComment = () => {
    // Simulate comment functionality
    toast({
      title: "Comments",
      description: "Comments section would appear here"
    });
  };

  // Clean up audio element on unmount
  React.useEffect(() => {
    return () => {
      audioElement.pause();
      audioElement.src = '';
    };
  }, []);

  // Add ended event listener
  React.useEffect(() => {
    const handleEnded = () => setIsPlaying(false);
    audioElement.addEventListener('ended', handleEnded);

    return () => {
      audioElement.removeEventListener('ended', handleEnded);
    };
  }, [audioElement]);

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader className="pb-3 pt-4 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={track.artistImage} alt={track.artist} />
              <AvatarFallback>{track.artist[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm leading-none">{track.artist}</p>
              <p className="text-xs text-muted-foreground mt-1">Original Content</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="flex items-center gap-4 mb-6 mt-2">
          <div
            className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg",
              isPlaying
                ? "bg-gold text-white shadow-gold/20 scale-105"
                : "bg-white/5 text-gold hover:bg-gold/10"
            )}
            onClick={togglePlay}
          >
            {isPlaying ? (
              <Pause className="h-6 w-6" fill="currentColor" />
            ) : (
              <Play className="h-6 w-6 ml-1" fill="currentColor" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-base text-white truncate">{track.title}</h3>
            <div className="flex items-center text-[10px] font-black uppercase tracking-widest text-gray-500 mt-1 gap-3">
              <div className="flex items-center gap-1.5">
                <Music className="h-3 w-3 text-gold" />
                <span>{track.duration}</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-gray-800" />
              <span>HQ Audio</span>
            </div>
          </div>
        </div>

        {/* Animated Waveform */}
        <div className="h-12 flex items-center gap-[3px] px-2 mb-6 opacity-40 group-hover:opacity-100 transition-opacity">
          {[...Array(40)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                height: isPlaying ? [10, Math.random() * 40 + 10, 10] : 10
              }}
              transition={{
                repeat: Infinity,
                duration: 0.5 + Math.random(),
                ease: "easeInOut"
              }}
              className="flex-1 bg-gold rounded-full"
              style={{ minHeight: '4px' }}
            />
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleLike}
              className="flex items-center gap-2 group/like"
            >
              <Heart
                className={cn(
                  "h-5 w-5 transition-all duration-300",
                  isLiked ? "fill-red-500 text-red-500 scale-110" : "text-gray-500 group-hover/like:text-red-400"
                )}
              />
              <span className={cn("text-xs font-bold", isLiked ? "text-white" : "text-gray-500")}>{likes}</span>
            </button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleShare}
            >
              <Share className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AudioSharingCard;
