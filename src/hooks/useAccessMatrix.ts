import { useAuth, SubscriptionTier } from "@/context/AuthContext";
import { useCallback } from "react";

export type AccessFeature =
    | 'tool:piano'
    | 'tool:tuner'
    | 'tool:metronome'
    | 'tool:guitar'
    | 'tool:chord_library'
    | 'community:read'
    | 'community:post'
    | 'community:dm'
    | 'content:basic'
    | 'content:premium'
    | 'analytics:view';

const ACCESS_MATRIX: Record<AccessFeature, SubscriptionTier> = {
    'tool:piano': 'free',
    'tool:tuner': 'free',
    'tool:metronome': 'free',
    'tool:guitar': 'basic',
    'tool:chord_library': 'basic',
    'community:read': 'free',
    'community:post': 'free',
    'community:dm': 'basic',
    'content:basic': 'basic',
    'content:premium': 'premium',
    'analytics:view': 'basic',
};

const TIER_HIERARCHY: Record<SubscriptionTier, number> = {
    'free': 0,
    'basic': 1,
    'premium': 2,
    'professional': 3,
};

export const useAccessMatrix = () => {
    const { user, profile } = useAuth();

    const currentTier: SubscriptionTier = (profile?.subscription_tier as SubscriptionTier) || 'free';
    const tierLevel = TIER_HIERARCHY[currentTier];

    const hasAccess = useCallback((feature: AccessFeature): boolean => {
        // Admins always have access
        if (profile?.role === 'admin') return true;

        const requiredTier = ACCESS_MATRIX[feature];
        const requiredLevel = TIER_HIERARCHY[requiredTier];

        return tierLevel >= requiredLevel;
    }, [tierLevel, profile?.role]);

    const getRequiredTier = (feature: AccessFeature): SubscriptionTier => {
        return ACCESS_MATRIX[feature];
    };

    return {
        hasAccess,
        getRequiredTier,
        currentTier,
        isSubscribed: currentTier !== 'free'
    };
};
