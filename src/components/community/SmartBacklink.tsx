import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Music, Layout, ChevronRight, Zap } from 'lucide-react';

interface SmartBacklinkProps {
    entityType: 'course' | 'module' | 'class' | 'lesson';
    entityId: string;
    entityName: string;
}

export const SmartBacklink: React.FC<SmartBacklinkProps> = ({ entityType, entityId, entityName }) => {
    const getUrl = () => {
        switch (entityType) {
            case 'course': return `/learning-hub/${entityId}`;
            case 'module': return `/learning-module/${entityId}`;
            case 'class': return `/learning-module/${entityId}`; // Simplified for now
            case 'lesson': return `/learning-module/${entityId}`; // Simplified for now
            default: return `/learning-hub`;
        }
    };

    const getIcon = () => {
        switch (entityType) {
            case 'course': return BookOpen;
            case 'module': return Layout;
            case 'lesson': return Music;
            default: return Zap;
        }
    };

    const Icon = getIcon();

    return (
        <Link
            to={getUrl()}
            className="inline-flex items-center gap-3 p-3 rounded-2xl bg-gold/5 border border-gold/10 hover:bg-gold/10 hover:border-gold/20 transition-all group mt-4 w-full sm:w-auto"
        >
            <div className="p-2 rounded-xl bg-gold/10 text-gold">
                <Icon className="h-4 w-4" />
            </div>
            <div className="text-left">
                <p className="text-[9px] uppercase font-bold tracking-[0.2em] text-gold-dark/60">Related {entityType}</p>
                <p className="text-sm font-bold text-gray-200 group-hover:text-gold transition-colors">{entityName}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-gold/40 ml-2 group-hover:translate-x-1 transition-transform" />
        </Link>
    );
};
