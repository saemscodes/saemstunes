import React, { useState } from 'react';
import { useResourceLibrary, ResourceEntityType } from '@/hooks/useResourceLibrary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Video, Music, Link as LinkIcon, Download, ExternalLink, BookOpen, File, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface ResourceListProps {
    entityType: ResourceEntityType;
    entityId: string;
    title?: string;
    className?: string;
}

const ResourceList: React.FC<ResourceListProps> = ({ entityType, entityId, title = "Resources", className }) => {
    const { resources, isLoading } = useResourceLibrary(entityType, entityId);
    const [selectedResource, setSelectedResource] = useState<any>(null);

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
        <Card className={className}>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    {getIcon('book')}
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {resources.map((resource: any) => (
                        <div key={resource.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                            <div className="flex items-center gap-3">
                                {getIcon(resource.resource_type)}
                                <div>
                                    <p className="font-medium text-sm">{resource.title}</p>
                                    <p className="text-xs text-muted-foreground uppercase">{resource.resource_type} {resource.file_size_mb && `• ${resource.file_size_mb} MB`}</p>
                                </div>
                            </div>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" asChild>
                                <a href={resource.resource_url} target="_blank" rel="noopener noreferrer">
                                    <Download className="h-4 w-4" />
                                </a>
                            </Button>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

export default ResourceList;
