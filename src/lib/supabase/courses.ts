import { supabase } from '@/integrations/supabase/client';

export interface Course {
  id: string;
  title: string;
  description: string;
  level: string;
  access_level: string;
  lessons: number;
  duration: number;
  enrollment_count: number;
  average_rating: number;
  thumbnail_url: string | null;
  instructor_name: string | null;
  instructor_avatar: string | null;
  category_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CourseWithDetails extends Course {
  instructor?: {
    id: string | null;
    name: string;
    avatar: string | null;
  };
  enrolled?: boolean;
  progress?: number;
}

export const coursesService = {
  async getCourses(): Promise<CourseWithDetails[]> {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('enrollment_count', { ascending: false });

    if (error) {
      console.error('Error fetching courses:', error);
      return [];
    }

    return (data || []).map((course: any) => ({
      ...course,
      instructor: course.instructor_name ? {
        id: course.instructor_id || null,
        name: course.instructor_name,
        avatar: course.instructor_avatar
      } : undefined
    }));
  },

  async getCategories() {
    const { data, error } = await supabase
      .from('course_categories')
      .select('*')
      .order('order_index');

    if (error) {
      console.error('Error fetching categories:', error);
      return [];
    }

    return data || [];
  },

  async getCourseById(id: string): Promise<CourseWithDetails | null> {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching course:', error);
      return null;
    }

    if (!data) return null;

    const courseData = data as any;
    return {
      ...courseData,
      instructor: courseData.instructor_name ? {
        id: courseData.instructor_id || null,
        name: courseData.instructor_name,
        avatar: courseData.instructor_avatar
      } : undefined
    };
  },

  async searchCourses(query: string, filters: { category?: string; level?: string } = {}): Promise<CourseWithDetails[]> {
    let queryBuilder = supabase
      .from('courses')
      .select('*');

    if (query) {
      queryBuilder = queryBuilder.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
    }

    if (filters.category && filters.category !== 'all') {
      queryBuilder = queryBuilder.eq('category_id', filters.category);
    }

    if (filters.level && filters.level !== 'all') {
      queryBuilder = queryBuilder.eq('level', filters.level);
    }

    const { data, error } = await queryBuilder.order('enrollment_count', { ascending: false });

    if (error) {
      console.error('Error searching courses:', error);
      return [];
    }

    return (data || []).map((course: any) => ({
      ...course,
      instructor: course.instructor_name ? {
        id: course.instructor_id || null,
        name: course.instructor_name,
        avatar: course.instructor_avatar
      } : undefined
    }));
  },

  async getCoursesWithEnrollment(userId: string | null): Promise<CourseWithDetails[]> {
    const courses = await this.getCourses();
    
    if (!userId) {
      return courses.map(course => ({ ...course, enrolled: false, progress: 0 }));
    }

    // Query enrollments using raw query to bypass type issues
    const { data: enrollments } = await (supabase as any)
      .from('user_course_enrollments')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    const enrollmentMap = new Map(
      (enrollments || []).map((e: any) => [e.course_id, e])
    );

    return courses.map(course => {
      const enrollment = enrollmentMap.get(course.id) as any;
      return {
        ...course,
        enrolled: !!enrollment,
        progress: enrollment?.progress_percentage || 0
      };
    });
  }
};

export default coursesService;
