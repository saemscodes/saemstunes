import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SupabaseClient } from "@supabase/supabase-js";

export const useLearningContent = () => {
    const supabaseCustom = supabase as unknown as SupabaseClient;

    // Fetch all courses with their modules
    const { data: courses, isLoading: isCoursesLoading } = useQuery({
        queryKey: ["courses"],
        queryFn: async () => {
            const { data, error } = await supabaseCustom
                .from("courses")
                .select(`
          *,
          modules!course_modules_course_id_fkey (
            *,
            classes!course_lessons_module_id_fkey (
              *,
              class_lessons (
                *
              )
            )
          )
        `)
                .order("order_index", { ascending: true });

            if (error) throw error;
            return data;
        },
    });

    return {
        courses: courses || [],
        isLoading: isCoursesLoading
    };
};

export const useCourseDetails = (courseId: string | undefined) => {
    const supabaseCustom = supabase as unknown as SupabaseClient;

    return useQuery({
        queryKey: ["course-details", courseId],
        queryFn: async () => {
            if (!courseId) return null;
            const { data, error } = await supabaseCustom
                .from("courses")
                .select(`
          *,
          modules!course_modules_course_id_fkey (
            *,
            classes!course_lessons_module_id_fkey (
              *,
              class_lessons (
                *
              )
            )
          )
        `)
                .eq("id", courseId)
                .single();

            if (error) throw error;
            return data;
        },
        enabled: !!courseId,
    });
};
