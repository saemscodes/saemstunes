import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Crown, Lock, ChevronRight, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface UpgradePromptModalProps {
    isOpen: boolean;
    onClose: () => void;
    requiredTier: 'free' | 'basic' | 'premium' | 'professional';
    featureName?: string;
}

const TIER_BENEFITS: Record<string, string[]> = {
    basic: ['Full access to Metronome', 'Interactive Guitar tool', 'Basic music theory classes'],
    premium: ['Direct Teacher Messaging', 'Downloadable PDF resources', 'Ad-free experience', 'All Basic features'],
    professional: ['1-on-1 Mentorship', 'Live Masterclasses', 'Commercial usage rights', 'Early access to new tools', 'All Premium features']
};

export const UpgradePromptModal: React.FC<UpgradePromptModalProps> = ({
    isOpen,
    onClose,
    requiredTier,
    featureName = 'this feature'
}) => {
    const navigate = useNavigate();

    const handleUpgrade = () => {
        navigate('/subscriptions');
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] overflow-hidden border-none p-0 bg-gradient-to-b from-[#1a1c1e] to-[#0f1112]">
                <div className="relative p-6 pt-10">
                    {/* Decorative background glow */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-gold/20 blur-[60px] rounded-full pointer-events-none" />

                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold to-amber-600 flex items-center justify-center shadow-lg shadow-gold/20">
                            <Crown className="h-8 w-8 text-white" />
                        </div>

                        <div className="space-y-2">
                            <DialogTitle className="text-2xl font-bold text-white tracking-tight">
                                Unlock {requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1)} Access
                            </DialogTitle>
                            <DialogDescription className="text-gray-400">
                                You've reached a {requiredTier} feature. Sign up or upgrade to unlock {featureName} and advance your musical journey.
                            </DialogDescription>
                        </div>

                        <div className="w-full bg-white/5 rounded-2xl p-4 border border-white/10 text-left space-y-3">
                            <p className="text-xs font-bold text-gold uppercase tracking-wider">What you'll get:</p>
                            <ul className="space-y-2">
                                {TIER_BENEFITS[requiredTier]?.map((benefit, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                                        <Zap className="h-4 w-4 text-gold mt-0.5 shrink-0" />
                                        <span>{benefit}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-6 pt-0 flex-col sm:flex-col gap-3">
                    <Button
                        onClick={handleUpgrade}
                        className="w-full h-12 bg-gradient-to-r from-gold to-amber-600 hover:from-amber-500 hover:to-gold text-white font-bold rounded-xl shadow-lg shadow-gold/10 group"
                    >
                        Upgrade to {requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1)}
                        <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="w-full text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                        Not now
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
