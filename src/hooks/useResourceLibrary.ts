import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DatabaseCustom } from "@/types/database.custom";
import { SupabaseClient } from "@supabase/supabase-js";

type ResourceLibrary = any; // Will use types from database.custom
type LibraryResource = any;

export type ResourceEntityType = 'course' | 'module' | 'class' | 'lesson';

export const useResourceLibrary = (entityType: ResourceEntityType, entityId: string | undefined) => {
    const supabaseCustom = supabase as unknown as SupabaseClient;

    // 1. Fetch the Library ID for this entity
    const { data: library, isLoading: isLibraryLoading } = useQuery({
        queryKey: ["resource-library", entityType, entityId],
        queryFn: async () => {
            if (!entityId) return null;
            const { data, error } = await supabaseCustom
                .from("resource_libraries")
                .select("*")
                .eq("entity_type", entityType)
                .eq("entity_id", entityId)
                .maybeSingle();

            if (error) throw error;
            return data;
        },
        enabled: !!entityId,
    });

    // 2. Fetch Resources if library exists
    const { data: resources, isLoading: isResourcesLoading } = useQuery({
        queryKey: ["library-resources", library?.id],
        queryFn: async () => {
            if (!library?.id) return [];
            const { data, error } = await supabaseCustom
                .from("library_resources")
                .select("*")
                .eq("library_id", library.id)
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data;
        },
        enabled: !!library?.id,
    });

    return {
        library,
        resources: resources || [],
        isLoading: isLibraryLoading || isResourcesLoading
    };
};
