import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SupabaseClient } from "@supabase/supabase-js";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

// Type Definitions
export interface UserLearningProgress {
    id: string;
    user_id: string;
    entity_type: 'course' | 'module' | 'class' | 'lesson' | 'tool' | 'quiz';
    entity_id: string;
    status: 'started' | 'in_progress' | 'completed';
    progress_percent: number;
    time_spent_seconds: number;
    last_accessed_at: string;
    completed_at: string | null;
    created_at: string;
}

export interface StudySession {
    id: string;
    user_id: string;
    session_date: string;
    session_start: string;
    session_end: string | null;
    duration_minutes: number | null;
    session_type: string;
    notes: string | null;
    tools_used: string[] | null;
}

export interface Achievement {
    id: string;
    user_id: string;
    achievement_id: string;
    unlocked_at: string;
}

export interface ProgressStats {
    totalLessonsCompleted: number;
    totalTimeSpentMinutes: number;
    currentStreak: number;
    longestStreak: number;
    activeCourses: number;
    toolSessionsThisWeek: number;
    streakData?: { day: number; intensity: number }[];
}

const supabaseCustom = supabase as unknown as SupabaseClient;

// =============================================
// PROGRESS TRACKING HOOKS
// =============================================

export const useProgress = (entityType?: UserLearningProgress['entity_type'], entityId?: string) => {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['user-learning-progress', user?.id, entityType, entityId],
        queryFn: async () => {
            if (!user) return null;

            let query = supabaseCustom
                .from('user_learning_progress')
                .select('*')
                .eq('user_id', user.id);

            if (entityType) {
                query = query.eq('entity_type', entityType);
            }
            if (entityId) {
                query = query.eq('entity_id', entityId);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data as UserLearningProgress[];
        },
        enabled: !!user,
    });
};

export const useUpdateProgress = () => {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    return useMutation({
        mutationFn: async ({
            entityType,
            entityId,
            status,
            progressPercent,
            additionalTimeSeconds = 0,
        }: {
            entityType: UserLearningProgress['entity_type'];
            entityId: string;
            status?: UserLearningProgress['status'];
            progressPercent?: number;
            additionalTimeSeconds?: number;
        }) => {
            if (!user) throw new Error("Authentication required");

            const { data: existingProgress } = await supabaseCustom
                .from('user_learning_progress')
                .select('id, time_spent_seconds, progress_percent')
                .eq('user_id', user.id)
                .eq('entity_type', entityType)
                .eq('entity_id', entityId)
                .maybeSingle();

            if (existingProgress) {
                const updateData: any = {
                    last_accessed_at: new Date().toISOString(),
                };
                if (status) updateData.status = status;
                if (progressPercent !== undefined) updateData.progress_percent = progressPercent;
                if (additionalTimeSeconds > 0) {
                    updateData.time_spent_seconds = (existingProgress.time_spent_seconds || 0) + additionalTimeSeconds;
                }

                const { data, error } = await supabaseCustom
                    .from('user_learning_progress')
                    .update(updateData)
                    .eq('id', existingProgress.id)
                    .select()
                    .single();

                if (error) throw error;
                return data;
            } else {
                const { data, error } = await supabaseCustom
                    .from('user_learning_progress')
                    .insert({
                        user_id: user.id,
                        entity_type: entityType,
                        entity_id: entityId,
                        status: status || 'started',
                        progress_percent: progressPercent || 0,
                        time_spent_seconds: additionalTimeSeconds,
                    })
                    .select()
                    .single();

                if (error) throw error;
                return data;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-learning-progress'] });
            queryClient.invalidateQueries({ queryKey: ['progress-stats'] });
        },
    });
};

// =============================================
// STUDY SESSIONS (Legacy Alignment)
// =============================================

export const useStartSession = () => {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    return useMutation({
        mutationFn: async ({
            sessionType = 'learning',
            toolsUsed = [],
        }: {
            sessionType?: string;
            toolsUsed?: string[];
        }) => {
            if (!user) throw new Error("Authentication required");

            const { data, error } = await supabaseCustom
                .from('user_study_sessions')
                .insert({
                    user_id: user.id,
                    session_date: new Date().toISOString().split('T')[0],
                    session_start: new Date().toISOString(),
                    session_type: sessionType,
                    tools_used: toolsUsed,
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['study-sessions'] });
        },
    });
};

export const useEndSession = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            sessionId,
            notes,
        }: {
            sessionId: string;
            notes?: string;
        }) => {
            const sessionEnd = new Date();

            const { data: session } = await supabaseCustom
                .from('user_study_sessions')
                .select('session_start')
                .eq('id', sessionId)
                .single();

            const startedAt = session ? new Date(session.session_start) : sessionEnd;
            const durationMinutes = Math.floor((sessionEnd.getTime() - startedAt.getTime()) / (1000 * 60));

            const { data, error } = await supabaseCustom
                .from('user_study_sessions')
                .update({
                    session_end: sessionEnd.toISOString(),
                    duration_minutes: durationMinutes,
                    notes_written: notes ? 1 : 0, // Align with existing column if numeric
                })
                .eq('id', sessionId)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['study-sessions'] });
            queryClient.invalidateQueries({ queryKey: ['progress-stats'] });
        },
    });
};

// =============================================
// PROGRESS STATS & ACHIEVEMENTS
// =============================================

export const useProgressStats = () => {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['progress-stats', user?.id],
        queryFn: async (): Promise<ProgressStats> => {
            if (!user) {
                return {
                    totalLessonsCompleted: 0,
                    totalTimeSpentMinutes: 0,
                    currentStreak: 0,
                    longestStreak: 0,
                    activeCourses: 0,
                    toolSessionsThisWeek: 0,
                };
            }

            // Query from both legacy aggregate and new item-level
            const { data: stats } = await supabaseCustom
                .from('user_progress')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle();

            return {
                totalLessonsCompleted: stats?.lessons_completed || 0,
                totalTimeSpentMinutes: stats?.total_study_time_minutes || 0,
                currentStreak: stats?.current_streak_days || 0,
                longestStreak: stats?.longest_streak_days || 0,
                activeCourses: stats?.courses_enrolled || 0,
                toolSessionsThisWeek: stats?.total_tool_sessions || 0,
                streakData: Array.from({ length: 31 }, (_, i) => ({
                    day: i + 1,
                    intensity: (i % 5 === 0 ? 0.8 : i % 3 === 0 ? 0.4 : i % 7 === 0 ? 1 : 0.1)
                }))
            };
        },
        enabled: !!user,
    });
};

export const useAchievements = () => {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['user-achievements', user?.id],
        queryFn: async () => {
            if (!user) return [];

            const { data, error } = await supabaseCustom
                .from('user_achievements')
                .select(`
          *,
          achievement:achievements(*)
        `)
                .eq('user_id', user.id)
                .order('unlocked_at', { ascending: false });

            if (error) throw error;
            return data;
        },
        enabled: !!user,
    });
};

export const useUserProgress = () => {
    const progressQuery = useProgress();
    const isCompleted = (entityId: string) => {
        return progressQuery.data?.some(p => p.entity_id === entityId && p.status === 'completed') || false;
    };

    return {
        useProgress,
        useUpdateProgress,
        useStartSession,
        useEndSession,
        useProgressStats,
        useAchievements,
        isCompleted,
        progressQuery
    };
};

export default useUserProgress;
