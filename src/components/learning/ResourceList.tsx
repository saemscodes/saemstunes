import React, { useState } from 'react';
import { useResourceLibrary, ResourceEntityType } from '@/hooks/useResourceLibrary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Video, Music, Link as LinkIcon, Download, ExternalLink, BookOpen, File, Loader2, Eye, ChevronRight } from 'lucide-react';
import { ResourceModal } from './ResourceModal';

interface ResourceListProps {
    entityType: ResourceEntityType;
    entityId: string;
    title?: string;
    className?: string;
}

const ResourceList: React.FC<ResourceListProps> = ({ entityType, entityId, title = "Resources", className }) => {
    const { resources, isLoading } = useResourceLibrary(entityType, entityId);
    const [selectedResource, setSelectedResource] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    if (isLoading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-gold" />
            </div>
        );
    }

    if (resources.length === 0) {
        return null; // Don't show anything if no resources
    }

    const handlePreview = (resource: any) => {
        setSelectedResource(resource);
        setIsModalOpen(true);
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'pdf': return <FileText className="h-5 w-5 text-red-500" />;
            case 'video': return <Video className="h-5 w-5 text-blue-500" />;
            case 'audio': return <Music className="h-5 w-5 text-pink-500" />;
            case 'link': return <LinkIcon className="h-5 w-5 text-green-500" />;
            case 'book': return <BookOpen className="h-5 w-5 text-amber-500" />;
            default: return <File className="h-5 w-5 text-gray-500" />;
        }
    };

    return (
        <>
            <Card className={cn("border-white/5 bg-white/5 backdrop-blur-sm overflow-hidden rounded-3xl", className)}>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold uppercase tracking-widest text-gold flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        {title}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-2">
                    {resources.map((resource: any) => (
                        <div
                            key={resource.id}
                            onClick={() => handlePreview(resource)}
                            className="group flex items-center justify-between p-3 rounded-2xl border border-white/5 bg-white/5 hover:bg-gold/10 hover:border-gold/20 transition-all cursor-pointer"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-white/5 group-hover:bg-gold/10 transition-colors">
                                    {getIcon(resource.resource_type)}
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-sm text-gray-200 group-hover:text-gold transition-colors line-clamp-1">{resource.title}</p>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                                        {resource.resource_type} {resource.file_size_mb && `• ${resource.file_size_mb} MB`}
                                    </p>
                                </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-gray-600 group-hover:text-gold transition-all group-hover:translate-x-1" />
                        </div>
                    ))}
                </CardContent>
            </Card>

            <ResourceModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                resource={selectedResource}
            />
        </>
    );
};

export default ResourceList;
import { cn } from '@/lib/utils';
