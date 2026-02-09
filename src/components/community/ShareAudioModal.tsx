import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useCommunity } from "@/hooks/useCommunity";
import { Headphones, Loader2, Music, Upload } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface ShareAudioModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ShareAudioModal = ({ isOpen, onClose }: ShareAudioModalProps) => {
    const { user } = useAuth();
    const [isUploading, setIsUploading] = useState(false);
    const [selectedTrack, setSelectedTrack] = useState<any>(null);

    // Fetch user's own tracks to share
    const [userTracks, setUserTracks] = useState([]);
    const [loadingTracks, setLoadingTracks] = useState(false);

    React.useEffect(() => {
        if (isOpen && user) {
            setLoadingTracks(true);
            const fetchTracks = async () => {
                const { data, error } = await supabase
                    .from('tracks')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (!error) setUserTracks(data || []);
                setLoadingTracks(false);
            };
            fetchTracks();
        }
    }, [isOpen, user]);

    const handleShare = async () => {
        if (!selectedTrack) {
            toast.error("Please select a track to share");
            return;
        }

        setIsUploading(true);
        // In a real app, this might create a showcase thread or mark the track as 'community_visible'
        // For now, we'll simulate sharing by updating the 'approved' status if it's not already
        const { error } = await supabase
            .from('tracks')
            .update({ approved: true }) // Simulation: making it public
            .eq('id', selectedTrack.id);

        if (error) {
            toast.error("Failed to share track");
        } else {
            toast.success("Track shared with the community!");
            onClose();
        }
        setIsUploading(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] bg-[#121417] border-white/5 text-white">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black italic tracking-tighter flex items-center gap-2">
                        <Headphones className="text-gold h-6 w-6" />
                        Share Your Audio
                    </DialogTitle>
                    <DialogDescription className="text-gray-500">
                        Showcase your progress or share a practice session with the community.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    <div className="space-y-4">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Your Recordings</Label>

                        {loadingTracks ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-gold" />
                            </div>
                        ) : userTracks.length > 0 ? (
                            <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                                {userTracks.map((track: any) => (
                                    <button
                                        key={track.id}
                                        onClick={() => setSelectedTrack(track)}
                                        className={`w-full p-4 flex items-center justify-between rounded-xl border transition-all ${selectedTrack?.id === track.id
                                                ? "bg-gold/10 border-gold/50 text-gold shadow-lg shadow-gold/5"
                                                : "bg-white/5 border-transparent hover:bg-white/10 text-gray-400"
                                            }`}
                                    >
                                        <div className="flex items-center gap-3 text-left">
                                            <div className={`p-2 rounded-lg ${selectedTrack?.id === track.id ? "bg-gold text-white" : "bg-white/5"}`}>
                                                <Music className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold truncate">{track.title}</p>
                                                <p className="text-[10px] uppercase font-black opacity-50">
                                                    {track.duration ? `${Math.floor(track.duration / 60)}:${(track.duration % 60).toString().padStart(2, '0')}` : '0:00'}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10 bg-white/5 rounded-2xl border border-dashed border-white/10">
                                <Music className="h-8 w-8 text-gray-700 mx-auto mb-3" />
                                <p className="text-sm text-gray-500 mb-4 px-6">You haven't recorded any sessions yet. Use the Recorder tool to begin.</p>
                                <Button variant="outline" className="rounded-xl border-white/5 bg-white/5">
                                    Go to Recorder
                                </Button>
                            </div>
                        )}
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
                            onClick={handleShare}
                            className="bg-gold hover:bg-amber-600 text-white rounded-xl px-8 font-bold"
                            disabled={!selectedTrack || isUploading}
                        >
                            {isUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                            Share to Community
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ShareAudioModal;
