import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SupabaseClient } from "@supabase/supabase-js";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

// Type Definitions
export interface Thread {
    id: string;
    user_id: string;
    title: string;
    slug: string | null;
    content: string | null;
    category: string;
    linked_course_id: string | null;
    linked_module_id: string | null;
    linked_class_id: string | null;
    linked_lesson_id: string | null;
    is_pinned: boolean;
    is_locked: boolean;
    is_announcement: boolean;
    view_count: number;
    reply_count: number;
    reaction_count: number;
    last_activity_at: string;
    created_at: string;
    updated_at: string;
    tags: string[] | null;
    // Joined fields
    author?: {
        id: string;
        full_name: string;
        avatar_url: string | null;
    };
}

export interface Post {
    id: string;
    thread_id: string;
    user_id: string;
    parent_post_id: string | null;
    content: string;
    is_solution: boolean;
    is_edited: boolean;
    reaction_count: number;
    created_at: string;
    updated_at: string;
    // Joined fields
    author?: {
        id: string;
        full_name: string;
        avatar_url: string | null;
    };
    reactions?: Reaction[];
}

export interface Reaction {
    id: string;
    user_id: string;
    reactable_type: 'thread' | 'post' | 'lesson' | 'resource';
    reactable_id: string;
    reaction_type: 'like' | 'love' | 'insightful' | 'celebrate' | 'helpful';
    created_at: string;
}

export interface CreateThreadInput {
    title: string;
    content: string;
    category: string;
    linked_course_id?: string;
    linked_module_id?: string;
    linked_class_id?: string;
    linked_lesson_id?: string;
    tags?: string[];
}

export interface CreatePostInput {
    thread_id: string;
    content: string;
    parent_post_id?: string;
}

const supabaseCustom = supabase as unknown as SupabaseClient;

export const useCommunityAudio = () => {
    return useQuery({
        queryKey: ['community-audio'],
        queryFn: async () => {
            const { data, error } = await supabaseCustom
                .from('tracks')
                .select(`
          *,
          author:profiles(id, full_name, avatar_url)
        `)
                .eq('approved', true)
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) throw error;
            return data;
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};

// =============================================
// THREAD HOOKS
// =============================================

export const useThreads = (category?: string) => {
    return useQuery({
        queryKey: ['community-threads', category],
        queryFn: async () => {
            let query = supabaseCustom
                .from('community_threads')
                .select(`
          *,
          author:profiles(id, full_name, avatar_url)
        `)
                .order('is_pinned', { ascending: false })
                .order('last_activity_at', { ascending: false })
                .limit(50);

            if (category) {
                query = query.eq('category', category);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data as Thread[];
        },
        staleTime: 1000 * 60 * 2, // 2 minutes
    });
};

export const useThread = (threadId: string) => {
    return useQuery({
        queryKey: ['community-thread', threadId],
        queryFn: async () => {
            const { data, error } = await supabaseCustom
                .from('community_threads')
                .select(`
          *,
          author:profiles(id, full_name, avatar_url)
        `)
                .eq('id', threadId)
                .single();

            if (error) throw error;

            // Increment view count
            supabaseCustom
                .from('community_threads')
                .update({ view_count: (data.view_count || 0) + 1 })
                .eq('id', threadId)
                .then(() => { });

            return data as Thread;
        },
        enabled: !!threadId,
    });
};

export const useCreateThread = () => {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    return useMutation({
        mutationFn: async (input: CreateThreadInput) => {
            if (!user) throw new Error("Authentication required");

            const slug = input.title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);

            const { data, error } = await supabaseCustom
                .from('community_threads')
                .insert({
                    user_id: user.id,
                    title: input.title,
                    slug,
                    content: input.content,
                    category: input.category,
                    linked_course_id: input.linked_course_id || null,
                    linked_module_id: input.linked_module_id || null,
                    linked_class_id: input.linked_class_id || null,
                    linked_lesson_id: input.linked_lesson_id || null,
                    tags: input.tags || [],
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['community-threads'] });
            toast.success("Discussion created successfully!");
        },
        onError: (error) => {
            toast.error(`Failed to create discussion: ${error.message}`);
        },
    });
};

// =============================================
// POST HOOKS
// =============================================

export const usePosts = (threadId: string) => {
    return useQuery({
        queryKey: ['community-posts', threadId],
        queryFn: async () => {
            const { data, error } = await supabaseCustom
                .from('community_posts')
                .select(`
          *,
          author:profiles(id, full_name, avatar_url)
        `)
                .eq('thread_id', threadId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            return data as Post[];
        },
        enabled: !!threadId,
        staleTime: 1000 * 30, // 30 seconds
    });
};

export const useCreatePost = () => {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    return useMutation({
        mutationFn: async (input: CreatePostInput) => {
            if (!user) throw new Error("Authentication required");

            const { data, error } = await supabaseCustom
                .from('community_posts')
                .insert({
                    thread_id: input.thread_id,
                    user_id: user.id,
                    content: input.content,
                    parent_post_id: input.parent_post_id || null,
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['community-posts', variables.thread_id] });
            queryClient.invalidateQueries({ queryKey: ['community-threads'] });
            toast.success("Reply posted!");
        },
        onError: (error) => {
            toast.error(`Failed to post reply: ${error.message}`);
        },
    });
};

// =============================================
// REACTION HOOKS
// =============================================

export const useToggleReaction = () => {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    return useMutation({
        mutationFn: async ({
            reactableType,
            reactableId,
            reactionType,
        }: {
            reactableType: Reaction['reactable_type'];
            reactableId: string;
            reactionType: Reaction['reaction_type'];
        }) => {
            if (!user) throw new Error("Authentication required");

            const { data: existingReaction } = await supabaseCustom
                .from('reactions')
                .select('id')
                .eq('user_id', user.id)
                .eq('reactable_type', reactableType)
                .eq('reactable_id', reactableId)
                .eq('reaction_type', reactionType)
                .maybeSingle();

            if (existingReaction) {
                const { error } = await supabaseCustom
                    .from('reactions')
                    .delete()
                    .eq('id', existingReaction.id);
                if (error) throw error;
                return { action: 'removed' };
            } else {
                const { error } = await supabaseCustom
                    .from('reactions')
                    .insert({
                        user_id: user.id,
                        reactable_type: reactableType,
                        reactable_id: reactableId,
                        reaction_type: reactionType,
                    });
                if (error) throw error;
                return { action: 'added' };
            }
        },
        onSuccess: (result, variables) => {
            if (variables.reactableType === 'post') {
                queryClient.invalidateQueries({ queryKey: ['community-posts'] });
            } else if (variables.reactableType === 'thread') {
                queryClient.invalidateQueries({ queryKey: ['community-threads'] });
            }
        },
    });
};

export const useUserReactions = (reactableType: Reaction['reactable_type'], reactableIds: string[]) => {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['user-reactions', reactableType, reactableIds],
        queryFn: async () => {
            if (!user || reactableIds.length === 0) return {};

            const { data, error } = await supabaseCustom
                .from('reactions')
                .select('reactable_id, reaction_type')
                .eq('user_id', user.id)
                .eq('reactable_type', reactableType)
                .in('reactable_id', reactableIds);

            if (error) throw error;

            const reactionMap: Record<string, string[]> = {};
            data?.forEach((r) => {
                if (!reactionMap[r.reactable_id]) {
                    reactionMap[r.reactable_id] = [];
                }
                reactionMap[r.reactable_id].push(r.reaction_type);
            });
            return reactionMap;
        },
        enabled: !!user && reactableIds.length > 0,
    });
};

// =============================================
// SEARCH & BACKLINKS
// =============================================

export const useThreadsForEntity = (
    type: 'course' | 'module' | 'class' | 'lesson',
    id: string
) => {
    return useQuery({
        queryKey: ['entity-threads', type, id],
        queryFn: async () => {
            let query = supabaseCustom
                .from('community_threads')
                .select(`
          id,
          title,
          slug,
          reply_count,
          last_activity_at,
          author:profiles!user_id(full_name)
        `)
                .order('last_activity_at', { ascending: false })
                .limit(5);

            if (type === 'course') query = query.eq('linked_course_id', id);
            else if (type === 'module') query = query.eq('linked_module_id', id);
            else if (type === 'class') query = query.eq('linked_class_id', id);
            else if (type === 'lesson') query = query.eq('linked_lesson_id', id);

            const { data, error } = await query;
            if (error) throw error;
            return data;
        },
        enabled: !!id,
    });
};

// =============================================
// DIRECT MESSAGING (Existing Schema Refinement)
// =============================================

export const useMessageThreads = () => {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['message-threads', user?.id],
        queryFn: async () => {
            if (!user) return [];

            const { data, error } = await supabaseCustom
                .from('conversations')
                .select(`
          *,
          last_message_sender:profiles(full_name)
        `)
                .contains('participant_ids', [user.id])
                .order('last_message_at', { ascending: false });

            if (error) throw error;
            return data;
        },
        enabled: !!user,
    });
};

export const useDirectMessages = (conversationId: string) => {
    return useQuery({
        queryKey: ['direct-messages', conversationId],
        queryFn: async () => {
            const { data, error } = await supabaseCustom
                .from('direct_messages')
                .select(`
          *,
          sender:profiles(id, full_name, avatar_url)
        `)
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            return data;
        },
        enabled: !!conversationId,
    });
};

export const useSendMessage = () => {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    return useMutation({
        mutationFn: async ({
            conversationId,
            message,
        }: {
            conversationId: string;
            message: string;
        }) => {
            if (!user) throw new Error("Authentication required");

            const { data, error } = await supabaseCustom
                .from('direct_messages')
                .insert({
                    sender_id: user.id,
                    conversation_id: conversationId,
                    message: message,
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (_, vars) => {
            queryClient.invalidateQueries({ queryKey: ['message-threads'] });
            queryClient.invalidateQueries({ queryKey: ['direct-messages', vars.conversationId] });
        },
    });
};

export const useStreamingMessages = (conversationId: string) => {
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!conversationId) return;

        const channel = supabase
            .channel(`public:direct_messages:conversation_id=eq.${conversationId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'direct_messages',
                    filter: `conversation_id=eq.${conversationId}`,
                },
                (payload) => {
                    // Optimized: Manually update the cache to avoid a full refetch if possible
                    // But for simplicity, we'll invalidate the query to ensure fresh data with joins
                    queryClient.invalidateQueries({ queryKey: ['direct-messages', conversationId] });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [conversationId, queryClient]);
};

// =============================================
// COMBINED HOOK FOR CONVENIENCE
// =============================================

export const useCommunity = () => {
    return {
        useThreads,
        useThread,
        useCreateThread,
        usePosts,
        useCreatePost,
        useToggleReaction,
        useUserReactions,
        useThreadsForEntity,
        useMessageThreads,
        useDirectMessages,
        useSendMessage,
        useStreamingMessages,
        useCommunityAudio,
    };
};

export default useCommunity;
