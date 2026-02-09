import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SupabaseClient } from "@supabase/supabase-js";
import { useAuth } from "@/context/AuthContext";

// Type Definitions
export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  thumbnail_url: string | null;
  instructor_id: string | null;
  category_id: string | null;
  difficulty_level: number;
  level: string | null;
  is_published: boolean;
  lessons: number;
  duration: number;
  created_at: string;
  updated_at: string;
  // Joined
  instructor?: {
    full_name: string;
    avatar_url: string | null;
  };
  modules?: Module[];
}

export interface Module {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
  // Joined
  classes?: ClassEntity[];
}

export interface ClassEntity {
  id: string;
  module_id: string;
  title: string;
  description: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
  // Joined
  lessons?: Lesson[];
}

export interface Lesson {
  id: string;
  class_id: string;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface ResourceLibrary {
  id: string;
  entity_type: string;
  entity_id: string;
  name: string;
  description: string | null;
  created_at: string;
  resources?: LibraryResource[];
}

export interface LibraryResource {
  id: string;
  library_id: string;
  title: string;
  description: string | null;
  resource_type: string;
  resource_url: string;
  file_size_mb: number | null;
  download_count: number;
  access_tier: string | null;
  created_at: string;
}

const supabaseCustom = supabase as unknown as SupabaseClient;

// =============================================
// COURSES
// =============================================

export const useCourses = (options?: { categoryId?: string; instructorId?: string }) => {
  return useQuery({
    queryKey: ['courses', options],
    queryFn: async () => {
      let query = supabaseCustom
        .from('courses')
        .select(`
          *,
          instructor:profiles!instructor_id(full_name, avatar_url)
        `)
        .order('created_at', { ascending: false });

      if (options?.categoryId) {
        query = query.eq('category_id', options.categoryId);
      }
      if (options?.instructorId) {
        query = query.eq('instructor_id', options.instructorId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Course[];
    },
  });
};

export const useCourse = (courseId: string) => {
  return useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      const { data, error } = await supabaseCustom
        .from('courses')
        .select(`
          *,
          instructor:profiles!instructor_id(full_name, avatar_url)
        `)
        .eq('id', courseId)
        .single();

      if (error) throw error;
      return data as Course;
    },
    enabled: !!courseId,
  });
};

// Full course details with hierarchy
export const useCourseDetails = (courseId: string) => {
  return useQuery({
    queryKey: ['course-details', courseId],
    queryFn: async () => {
      // Fetch course with instructor
      const { data: course, error: courseError } = await supabaseCustom
        .from('courses')
        .select(`
          *,
          instructor:profiles!instructor_id(full_name, avatar_url)
        `)
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;

      // Fetch modules
      const { data: modules, error: modulesError } = await supabaseCustom
        .from('modules')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true });

      if (modulesError) throw modulesError;

      // Fetch classes for all modules
      const moduleIds = (modules || []).map((m: Module) => m.id);
      let classes: ClassEntity[] = [];
      if (moduleIds.length > 0) {
        const { data: fetchedClasses, error: classesError } = await supabaseCustom
          .from('classes')
          .select('*')
          .in('module_id', moduleIds)
          .order('order_index', { ascending: true });

        if (classesError) throw classesError;
        classes = fetchedClasses || [];
      }

      // Fetch lessons for all classes
      const classIds = classes.map((c: ClassEntity) => c.id);
      let lessons: Lesson[] = [];
      if (classIds.length > 0) {
        const { data: fetchedLessons, error: lessonsError } = await supabaseCustom
          .from('class_lessons')
          .select('*')
          .in('class_id', classIds)
          .order('order_index', { ascending: true });

        if (lessonsError) throw lessonsError;
        lessons = fetchedLessons || [];
      }

      // Build hierarchy
      const modulesWithClasses = (modules || []).map((mod: Module) => ({
        ...mod,
        classes: classes
          .filter((c: ClassEntity) => c.module_id === mod.id)
          .map((cls: ClassEntity) => ({
            ...cls,
            lessons: lessons.filter((l: Lesson) => l.class_id === cls.id),
          })),
      }));

      return {
        ...course,
        modules: modulesWithClasses,
      } as Course;
    },
    enabled: !!courseId,
  });
};


// =============================================
// HIERARCHY
// =============================================

export const useModules = (courseId: string) => {
  return useQuery({
    queryKey: ['modules', courseId],
    queryFn: async () => {
      const { data, error } = await supabaseCustom
        .from('modules')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data as Module[];
    },
    enabled: !!courseId,
  });
};

export const useClasses = (moduleId: string) => {
  return useQuery({
    queryKey: ['classes', moduleId],
    queryFn: async () => {
      const { data, error } = await supabaseCustom
        .from('classes')
        .select('*')
        .eq('module_id', moduleId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data as ClassEntity[];
    },
    enabled: !!moduleId,
  });
};

export const useLessons = (classId: string) => {
  return useQuery({
    queryKey: ['class_lessons', classId],
    queryFn: async () => {
      const { data, error } = await supabaseCustom
        .from('class_lessons')
        .select('*')
        .eq('class_id', classId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data as Lesson[];
    },
    enabled: !!classId,
  });
};

// =============================================
// RESOURCES
// =============================================

export const useResourceLibrary = (entityType: string, entityId: string) => {
  return useQuery({
    queryKey: ['resource-library', entityType, entityId],
    queryFn: async () => {
      const { data, error } = await supabaseCustom
        .from('resource_libraries')
        .select(`
          *,
          resources:library_resources(*)
        `)
        .eq('entity_type', entityType)
        .eq('entity_id', entityId);

      if (error) throw error;
      return data as ResourceLibrary[];
    },
  });
};

export const useIncrementDownload = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (resourceId: string) => {
      // Manual update since RPC might be missing
      const { data: current } = await supabaseCustom
        .from('library_resources')
        .select('download_count')
        .eq('id', resourceId)
        .single();

      const { error } = await supabaseCustom
        .from('library_resources')
        .update({ download_count: (current?.download_count || 0) + 1 })
        .eq('id', resourceId);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resource-library'] });
    },
  });
};

// =============================================
// COMBINED HOOK
// =============================================

export const useLearningContent = () => {
  return {
    useCourses,
    useCourse,
    useModules,
    useClasses,
    useLessons,
    useResourceLibrary,
    useIncrementDownload,
  };
};

export default useLearningContent;
