import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Music, Mic, Loader2 } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface Course {
  id: string;
  title: string;
  description: string | null;
  level: string | null;
  duration: number | null;
  enrollment_count: number | null;
  average_rating: number | null;
  preview_url: string | null;
  thumbnail_url: string | null;
}

const RecommendationSection = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRandomCourses = async () => {
      try {
        setLoading(true);
        // Fetch 3 random courses from the database including thumbnail_url
        const { data, error } = await supabase
          .from('courses')
          .select('id, title, description, level, duration, enrollment_count, average_rating, preview_url, thumbnail_url')
          .order('enrollment_count', { ascending: false, nullsFirst: false })
          .limit(3);

        if (error) {
          throw error;
        }

        if (data) {
          // Shuffle the courses to get a random selection
          const shuffled = [...data].sort(() => 0.5 - Math.random());
          setCourses(shuffled.slice(0, 3));
        }
      } catch (err) {
        console.error('Error fetching courses:', err);
        setError('Failed to load recommendations');
      } finally {
        setLoading(false);
      }
    };

    fetchRandomCourses();
  }, []);

  const getIconForCourse = (index: number) => {
    const icons = [BookOpen, Music, Mic];
    return icons[index % icons.length];
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return 'Duration not specified';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (loading) {
    return (
      <div className="mt-12">
        <h2 className="text-xl font-proxima font-semibold mb-4">Recommended For You</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((item) => (
            <Card key={item} className="overflow-hidden">
              <div className="aspect-video relative bg-muted flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
              <div className="p-4">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-full mb-1"></div>
                <div className="h-3 bg-muted rounded w-5/6 mb-3"></div>
                <div className="h-10 bg-muted rounded"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-12">
        <h2 className="text-xl font-proxima font-semibold mb-4">Recommended For You</h2>
        <div className="text-center py-8 text-muted-foreground">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-12">
      <h2 className="text-xl font-proxima font-semibold mb-4">Recommended For You</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {courses.map((course, index) => {
          const IconComponent = getIconForCourse(index);
          return (
            <Card key={course.id} className="overflow-hidden flex flex-col h-full">
              <div className="aspect-video relative">
                {course.thumbnail_url ? (
                  <img
                    src={course.thumbnail_url}
                    alt={course.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to gradient background if image fails to load
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <IconComponent className="h-12 w-12 text-primary/70" />
                  </div>
                )}
                {course.preview_url && (
                  <div className="absolute top-2 right-2">
                    <span className="bg-background/80 text-xs px-2 py-1 rounded-full">
                      Preview
                    </span>
                  </div>
                )}
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-semibold mb-1 line-clamp-2">{course.title}</h3>
                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                  {course.description || "No description available"}
                </p>

                <div className="mt-auto pt-2">
                  <div className="flex justify-between items-center text-xs text-muted-foreground mb-3">
                    <span>{course.level || 'All levels'}</span>
                    <span>{formatDuration(course.duration)}</span>
                  </div>

                  <div className="flex justify-between items-center mb-3">
                    {course.enrollment_count && course.enrollment_count > 0 ? (
                      <span className="text-xs text-muted-foreground">
                        {course.enrollment_count} enrolled
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">New course</span>
                    )}

                    {course.average_rating && course.average_rating > 0 ? (
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-medium">{course.average_rating.toFixed(1)}</span>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              className={`w-3 h-3 ${i < Math.floor(course.average_rating || 0) ? 'text-yellow-400 fill-current' : 'text-muted-foreground'}`}
                              viewBox="0 0 24 24"
                            >
                              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                            </svg>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">No ratings yet</span>
                    )}
                  </div>

                  <Button
                    className="w-full bg-gold hover:bg-gold-dark"
                    onClick={() => navigate(`/learning-hub/${course.id}`)}
                  >
                    View Course
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default RecommendationSection;
