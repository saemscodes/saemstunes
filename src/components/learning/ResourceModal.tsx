import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText, Video, Music, ExternalLink, Download, X, Maximize2 } from 'lucide-react';

interface ResourceModalProps {
    isOpen: boolean;
    onClose: () => void;
    resource: {
        id: string;
        title: string;
        resource_type: 'pdf' | 'video' | 'audio' | 'link' | 'book';
        resource_url: string;
        description?: string;
    } | null;
}

export const ResourceModal: React.FC<ResourceModalProps> = ({ isOpen, onClose, resource }) => {
    if (!resource) return null;

    const renderPreview = () => {
        switch (resource.resource_type) {
            case 'pdf':
                return (
                    <div className="w-full h-[60vh] bg-neutral-900 rounded-2xl flex flex-col items-center justify-center text-white/40 border border-white/5">
                        <FileText className="h-16 w-16 mb-4 opacity-20" />
                        <p className="text-sm font-medium">PDF Preview Not Available In-Browser</p>
                        <Button variant="outline" className="mt-4 border-white/10 hover:bg-white/5" asChild>
                            <a href={resource.resource_url} target="_blank" rel="noopener noreferrer">
                                Open in New Tab
                            </a>
                        </Button>
                    </div>
                );
            case 'video':
                return (
                    <div className="aspect-video w-full bg-black rounded-2xl overflow-hidden shadow-2xl">
                        <video
                            src={resource.resource_url}
                            controls
                            className="w-full h-full"
                            poster="/video-placeholder.jpg"
                        />
                    </div>
                );
            case 'audio':
                return (
                    <div className="w-full p-12 bg-gradient-to-br from-gold/10 to-amber-900/20 rounded-2xl flex flex-col items-center gap-6 border border-gold/10">
                        <div className="w-20 h-20 rounded-full bg-gold/20 flex items-center justify-center animate-pulse">
                            <Music className="h-10 w-10 text-gold" />
                        </div>
                        <audio src={resource.resource_url} controls className="w-full" />
                        <p className="text-xs text-gold/60 uppercase tracking-widest font-bold">High Fidelity Audio</p>
                    </div>
                );
            case 'link':
            case 'book':
                return (
                    <div className="w-full p-8 bg-accent/20 rounded-2xl border border-white/5 flex flex-col items-center text-center">
                        <ExternalLink className="h-12 w-12 text-gold mb-4" />
                        <h4 className="text-xl font-bold mb-2">External Resource</h4>
                        <p className="text-muted-foreground mb-6">This resource is hosted on an external platform.</p>
                        <Button className="bg-gold hover:bg-gold-dark text-white px-8 h-12 rounded-xl" asChild>
                            <a href={resource.resource_url} target="_blank" rel="noopener noreferrer">
                                Continue to Resource
                                <ExternalLink className="ml-2 h-4 w-4" />
                            </a>
                        </Button>
                    </div>
                );
            default:
                return null;
        }
    };

    const getIcon = () => {
        switch (resource.resource_type) {
            case 'pdf': return <FileText className="h-5 w-5 text-red-500" />;
            case 'video': return <Video className="h-5 w-5 text-blue-500" />;
            case 'audio': return <Music className="h-5 w-5 text-pink-500" />;
            default: return <ExternalLink className="h-5 w-5 text-gold" />;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden border-none bg-[#0f1112]">
                <div className="p-8 space-y-6">
                    <DialogHeader className="flex flex-row items-center justify-between space-y-0">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                                {getIcon()}
                            </div>
                            <div className="text-left">
                                <DialogTitle className="text-2xl font-bold text-white tracking-tight">
                                    {resource.title}
                                </DialogTitle>
                                <p className="text-sm text-gray-500 uppercase tracking-widest font-bold mt-1">
                                    {resource.resource_type} Resource
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button size="icon" variant="ghost" className="rounded-full text-gray-400 hover:text-white hover:bg-white/5" asChild>
                                <a href={resource.resource_url} download>
                                    <Download className="h-5 w-5" />
                                </a>
                            </Button>
                            <Button size="icon" variant="ghost" className="rounded-full text-gray-400 hover:text-white hover:bg-white/5" onClick={onClose}>
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                    </DialogHeader>

                    <div className="space-y-6">
                        {renderPreview()}

                        <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                            <h5 className="text-sm font-bold text-gold uppercase tracking-widest mb-2">Description</h5>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                {resource.description || "No description provided for this resource. This material is designed to supplement your learning in this specific lesson."}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white/5 p-4 flex justify-center border-t border-white/5">
                    <p className="text-[10px] text-gray-600 uppercase tracking-[0.3em] font-bold">Saem's Tunes Ultimate Learning Library</p>
                </div>
            </DialogContent>
        </Dialog>
    );
};
