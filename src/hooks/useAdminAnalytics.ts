import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SupabaseClient } from "@supabase/supabase-js";
import { useAuth } from "@/context/AuthContext";

// Type Definitions
export interface DailyAnalytics {
    id: string;
    date: string;
    total_active_users: number;
    new_signups: number;
    lessons_completed: number;
    tool_sessions: number;
    forum_posts: number;
    total_revenue: number;
    avg_session_duration_seconds: number;
    created_at: string;
}

export interface AnalyticsSummary {
    todayActiveUsers: number;
    todayNewSignups: number;
    todayLessonsCompleted: number;
    todayRevenue: number;
    weeklyActiveUsers: number;
    weeklyNewSignups: number;
    weeklyLessonsCompleted: number;
    weeklyRevenue: number;
    monthlyActiveUsers: number;
    monthlyNewSignups: number;
    monthlyLessonsCompleted: number;
    monthlyRevenue: number;
}

export interface LeaderboardEntry {
    userId: string;
    userName: string;
    avatarUrl: string | null;
    lessonsCompleted: number;
    streakDays: number;
    totalPracticeMinutes: number;
}

const supabaseCustom = supabase as unknown as SupabaseClient;

// =============================================
// ADMIN ANALYTICS (Role-restricted)
// =============================================

export const useDailyAnalytics = (startDate: string, endDate: string) => {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['daily-analytics', startDate, endDate],
        queryFn: async () => {
            const { data, error } = await supabaseCustom
                .from('daily_analytics')
                .select('*')
                .gte('date', startDate)
                .lte('date', endDate)
                .order('date', { ascending: true });

            if (error) throw error;
            return data as DailyAnalytics[];
        },
        enabled: !!user,
    });
};

export const useAnalyticsSummary = () => {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['analytics-summary'],
        queryFn: async (): Promise<AnalyticsSummary> => {
            const today = new Date().toISOString().split('T')[0];
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

            // Get today's data
            const { data: todayData } = await supabaseCustom
                .from('daily_analytics')
                .select('*')
                .eq('date', today)
                .maybeSingle();

            // Get weekly data
            const { data: weeklyData } = await supabaseCustom
                .from('daily_analytics')
                .select('*')
                .gte('date', weekAgo);

            // Get monthly data
            const { data: monthlyData } = await supabaseCustom
                .from('daily_analytics')
                .select('*')
                .gte('date', monthAgo);

            const sumField = (data: any[], field: string) =>
                data?.reduce((sum, d) => sum + (d[field] || 0), 0) || 0;

            return {
                todayActiveUsers: todayData?.total_active_users || 0,
                todayNewSignups: todayData?.new_signups || 0,
                todayLessonsCompleted: todayData?.lessons_completed || 0,
                todayRevenue: todayData?.total_revenue || 0,

                weeklyActiveUsers: sumField(weeklyData, 'total_active_users'),
                weeklyNewSignups: sumField(weeklyData, 'new_signups'),
                weeklyLessonsCompleted: sumField(weeklyData, 'lessons_completed'),
                weeklyRevenue: sumField(weeklyData, 'total_revenue'),

                monthlyActiveUsers: sumField(monthlyData, 'total_active_users'),
                monthlyNewSignups: sumField(monthlyData, 'new_signups'),
                monthlyLessonsCompleted: sumField(monthlyData, 'lessons_completed'),
                monthlyRevenue: sumField(monthlyData, 'total_revenue'),
            };
        },
        enabled: !!user,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};

// =============================================
// LEADERBOARD (Public, anonymized)
// =============================================

export const useLeaderboard = (limit: number = 10) => {
    return useQuery({
        queryKey: ['leaderboard', limit],
        queryFn: async () => {
            // Aggregate progress from user_learning_progress (item-level)
            const { data, error } = await supabaseCustom
                .from('user_learning_progress')
                .select(`
          user_id,
          profiles:profiles!user_id(full_name, avatar_url)
        `)
                .eq('status', 'completed')
                .eq('entity_type', 'lesson');

            if (error) throw error;

            const userCounts: Record<string, { count: number; name: string; avatar: string | null }> = {};
            data?.forEach((entry: any) => {
                const userId = entry.user_id;
                if (!userCounts[userId]) {
                    userCounts[userId] = {
                        count: 0,
                        name: entry.profiles?.full_name || 'Anonymous',
                        avatar: entry.profiles?.avatar_url || null,
                    };
                }
                userCounts[userId].count++;
            });

            const leaderboard: LeaderboardEntry[] = Object.entries(userCounts)
                .map(([userId, data]) => ({
                    userId,
                    userName: data.name,
                    avatarUrl: data.avatar,
                    lessonsCompleted: data.count,
                    streakDays: 0, // Would need to fetch from user_progress (aggregate)
                    totalPracticeMinutes: 0, // Would need to fetch from user_progress (aggregate)
                }))
                .sort((a, b) => b.lessonsCompleted - a.lessonsCompleted)
                .slice(0, limit);

            return leaderboard;
        },
        staleTime: 1000 * 60 * 10, // 10 minutes
    });
};

// =============================================
// REAL-TIME ACTIVITY FEED
// =============================================

export interface ActivityItem {
    id: string;
    type: 'lesson_completed' | 'achievement_unlocked' | 'thread_created' | 'post_created';
    userId: string;
    userName: string;
    entityName: string;
    createdAt: string;
}

export const useRecentActivity = (limit: number = 20) => {
    return useQuery({
        queryKey: ['recent-activity', limit],
        queryFn: async () => {
            // Get recent completions from item-level tracker
            const { data: completions } = await supabaseCustom
                .from('user_learning_progress')
                .select(`
          id,
          user_id,
          entity_id,
          completed_at,
          profiles:profiles!user_id(full_name)
        `)
                .eq('status', 'completed')
                .eq('entity_type', 'lesson')
                .order('completed_at', { ascending: false })
                .limit(limit);

            // Get recent threads
            const { data: threads } = await supabaseCustom
                .from('community_threads')
                .select(`
          id,
          user_id,
          title,
          created_at,
          author:profiles!user_id(full_name)
        `)
                .order('created_at', { ascending: false })
                .limit(limit);

            const activities: ActivityItem[] = [];

            completions?.forEach((c: any) => {
                activities.push({
                    id: c.id,
                    type: 'lesson_completed',
                    userId: c.user_id,
                    userName: c.profiles?.full_name || 'A student',
                    entityName: 'a lesson',
                    createdAt: c.completed_at,
                });
            });

            threads?.forEach((t: any) => {
                activities.push({
                    id: t.id,
                    type: 'thread_created',
                    userId: t.user_id,
                    userName: t.author?.full_name || 'A member',
                    entityName: t.title,
                    createdAt: t.created_at,
                });
            });

            return activities
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, limit);
        },
        staleTime: 1000 * 60, // 1 minute
    });
};

export const useLogDailyAnalytics = () => {
    return useMutation({
        mutationFn: async (data: Omit<DailyAnalytics, 'id' | 'created_at'>) => {
            const { data: result, error } = await supabaseCustom
                .from('daily_analytics')
                .upsert(data, { onConflict: 'date' })
                .select()
                .single();

            if (error) throw error;
            return result;
        },
    });
};

export const useAdminAnalytics = () => {
    return {
        useDailyAnalytics,
        useAnalyticsSummary,
        useLeaderboard,
        useRecentActivity,
        useLogDailyAnalytics,
    };
};

export default useAdminAnalytics;
