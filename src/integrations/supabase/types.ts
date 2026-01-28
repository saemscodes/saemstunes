export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      access_tiers: {
        Row: {
          download_limit: number | null
          features: Json | null
          id: number
          max_quality: string
          name: string
          price_monthly: number | null
          priority: number
        }
        Insert: {
          download_limit?: number | null
          features?: Json | null
          id?: number
          max_quality: string
          name: string
          price_monthly?: number | null
          priority: number
        }
        Update: {
          download_limit?: number | null
          features?: Json | null
          id?: number
          max_quality?: string
          name?: string
          price_monthly?: number | null
          priority?: number
        }
        Relationships: []
      }
      achievements: {
        Row: {
          active_months: number[] | null
          category: string
          created_at: string | null
          description: string
          icon: string
          id: string
          points: number
          requirements: Json
          seasonal: boolean | null
          tier: string
          title: string
          updated_at: string | null
        }
        Insert: {
          active_months?: number[] | null
          category: string
          created_at?: string | null
          description: string
          icon: string
          id: string
          points?: number
          requirements?: Json
          seasonal?: boolean | null
          tier?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          active_months?: number[] | null
          category?: string
          created_at?: string | null
          description?: string
          icon?: string
          id?: string
          points?: number
          requirements?: Json
          seasonal?: boolean | null
          tier?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      activity_logs: {
        Row: {
          action: string | null
          id: string
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          action?: string | null
          id?: string
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string | null
          id?: string
          timestamp?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_achievement_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_ai_activity_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      ai_feature_settings: {
        Row: {
          allowed_tiers: string[] | null
          created_at: string | null
          feature_name: string
          id: string
          is_enabled: boolean | null
          require_subscription: boolean | null
          updated_at: string | null
        }
        Insert: {
          allowed_tiers?: string[] | null
          created_at?: string | null
          feature_name: string
          id?: string
          is_enabled?: boolean | null
          require_subscription?: boolean | null
          updated_at?: string | null
        }
        Update: {
          allowed_tiers?: string[] | null
          created_at?: string | null
          feature_name?: string
          id?: string
          is_enabled?: boolean | null
          require_subscription?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_interactions: {
        Row: {
          context_used: Json | null
          conversation_id: string
          created_at: string | null
          error_message: string | null
          id: string
          input_text: string
          input_tokens: number | null
          metadata: Json | null
          model_used: string | null
          output_text: string | null
          output_tokens: number | null
          processing_time_ms: number | null
          session_id: string | null
          total_tokens: number | null
          user_feedback: string | null
          user_id: string | null
          was_helpful: boolean | null
        }
        Insert: {
          context_used?: Json | null
          conversation_id: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          input_text: string
          input_tokens?: number | null
          metadata?: Json | null
          model_used?: string | null
          output_text?: string | null
          output_tokens?: number | null
          processing_time_ms?: number | null
          session_id?: string | null
          total_tokens?: number | null
          user_feedback?: string | null
          user_id?: string | null
          was_helpful?: boolean | null
        }
        Update: {
          context_used?: Json | null
          conversation_id?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          input_text?: string
          input_tokens?: number | null
          metadata?: Json | null
          model_used?: string | null
          output_text?: string | null
          output_tokens?: number | null
          processing_time_ms?: number | null
          session_id?: string | null
          total_tokens?: number | null
          user_feedback?: string | null
          user_id?: string | null
          was_helpful?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_interactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_achievement_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "ai_interactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_ai_activity_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      ai_models: {
        Row: {
          context_length: number | null
          created_at: string | null
          deployment_target: string | null
          file_size: number | null
          id: string
          is_active: boolean | null
          name: string
          parameters_count: string | null
          performance_metrics: Json | null
          quantization_type: string | null
          version: string
        }
        Insert: {
          context_length?: number | null
          created_at?: string | null
          deployment_target?: string | null
          file_size?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          parameters_count?: string | null
          performance_metrics?: Json | null
          quantization_type?: string | null
          version: string
        }
        Update: {
          context_length?: number | null
          created_at?: string | null
          deployment_target?: string | null
          file_size?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          parameters_count?: string | null
          performance_metrics?: Json | null
          quantization_type?: string | null
          version?: string
        }
        Relationships: []
      }
      ai_performance_metrics: {
        Row: {
          id: string
          metric_type: string
          metric_value: number
          model_name: string
          recorded_at: string | null
          sample_size: number | null
          time_window: string | null
        }
        Insert: {
          id?: string
          metric_type: string
          metric_value: number
          model_name: string
          recorded_at?: string | null
          sample_size?: number | null
          time_window?: string | null
        }
        Update: {
          id?: string
          metric_type?: string
          metric_value?: number
          model_name?: string
          recorded_at?: string | null
          sample_size?: number | null
          time_window?: string | null
        }
        Relationships: []
      }
      ai_usage_analytics: {
        Row: {
          average_response_time: number | null
          created_at: string | null
          date: string
          failed_requests: number | null
          id: string
          model_name: string
          successful_requests: number | null
          total_requests: number | null
          total_tokens_used: number | null
          unique_users: number | null
        }
        Insert: {
          average_response_time?: number | null
          created_at?: string | null
          date: string
          failed_requests?: number | null
          id?: string
          model_name: string
          successful_requests?: number | null
          total_requests?: number | null
          total_tokens_used?: number | null
          unique_users?: number | null
        }
        Update: {
          average_response_time?: number | null
          created_at?: string | null
          date?: string
          failed_requests?: number | null
          id?: string
          model_name?: string
          successful_requests?: number | null
          total_requests?: number | null
          total_tokens_used?: number | null
          unique_users?: number | null
        }
        Relationships: []
      }
      artist_followers: {
        Row: {
          artist_id: string | null
          followed_at: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          artist_id?: string | null
          followed_at?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          artist_id?: string | null
          followed_at?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "artist_followers_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artist_followers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_achievement_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "artist_followers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_ai_activity_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      artist_metadata_submissions: {
        Row: {
          artist_id: string | null
          bio: string | null
          created_at: string
          genre: string | null
          id: string
          location: string | null
          name: string
          profile_image_url: string | null
          status: string
          submitted_by: string | null
          track_id: string
          updated_at: string
        }
        Insert: {
          artist_id?: string | null
          bio?: string | null
          created_at?: string
          genre?: string | null
          id?: string
          location?: string | null
          name: string
          profile_image_url?: string | null
          status?: string
          submitted_by?: string | null
          track_id: string
          updated_at?: string
        }
        Update: {
          artist_id?: string | null
          bio?: string | null
          created_at?: string
          genre?: string | null
          id?: string
          location?: string | null
          name?: string
          profile_image_url?: string | null
          status?: string
          submitted_by?: string | null
          track_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "artist_metadata_submissions_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artist_metadata_submissions_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artist_metadata_submissions_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "user_roles_comprehensive"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "artist_metadata_submissions_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      artists: {
        Row: {
          achievements: Json | null
          awards: string[] | null
          bio: string | null
          courses_available: boolean | null
          cover_image_url: string | null
          created_at: string | null
          favorite_instruments: string[] | null
          follower_count: number | null
          fun_facts: string[] | null
          genre: string[] | null
          id: string
          influences: string[] | null
          lessons_available: boolean | null
          location: string | null
          monthly_listeners: number | null
          name: string
          profile_image_url: string | null
          rating: number | null
          slug: string
          social_links: Json | null
          specialties: string[] | null
          updated_at: string | null
          verified_status: boolean | null
        }
        Insert: {
          achievements?: Json | null
          awards?: string[] | null
          bio?: string | null
          courses_available?: boolean | null
          cover_image_url?: string | null
          created_at?: string | null
          favorite_instruments?: string[] | null
          follower_count?: number | null
          fun_facts?: string[] | null
          genre?: string[] | null
          id?: string
          influences?: string[] | null
          lessons_available?: boolean | null
          location?: string | null
          monthly_listeners?: number | null
          name: string
          profile_image_url?: string | null
          rating?: number | null
          slug: string
          social_links?: Json | null
          specialties?: string[] | null
          updated_at?: string | null
          verified_status?: boolean | null
        }
        Update: {
          achievements?: Json | null
          awards?: string[] | null
          bio?: string | null
          courses_available?: boolean | null
          cover_image_url?: string | null
          created_at?: string | null
          favorite_instruments?: string[] | null
          follower_count?: number | null
          fun_facts?: string[] | null
          genre?: string[] | null
          id?: string
          influences?: string[] | null
          lessons_available?: boolean | null
          location?: string | null
          monthly_listeners?: number | null
          name?: string
          profile_image_url?: string | null
          rating?: number | null
          slug?: string
          social_links?: Json | null
          specialties?: string[] | null
          updated_at?: string | null
          verified_status?: boolean | null
        }
        Relationships: []
      }
      bookings: {
        Row: {
          created_at: string
          description: string | null
          end_time: string
          id: string
          is_virtual: boolean | null
          location: string | null
          payment_id: string | null
          price: number | null
          start_time: string
          status: Database["public"]["Enums"]["booking_status"] | null
          student_id: string
          title: string | null
          tutor_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_time: string
          id?: string
          is_virtual?: boolean | null
          location?: string | null
          payment_id?: string | null
          price?: number | null
          start_time: string
          status?: Database["public"]["Enums"]["booking_status"] | null
          student_id: string
          title?: string | null
          tutor_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_time?: string
          id?: string
          is_virtual?: boolean | null
          location?: string | null
          payment_id?: string | null
          price?: number | null
          start_time?: string
          status?: Database["public"]["Enums"]["booking_status"] | null
          student_id?: string
          title?: string | null
          tutor_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "user_achievement_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "bookings_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "user_ai_activity_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "bookings_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "tutors"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          badge_type: string | null
          created_at: string
          id: string
          issue_date: string
          level: number
          module_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          badge_type?: string | null
          created_at?: string
          id?: string
          issue_date?: string
          level: number
          module_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          badge_type?: string | null
          created_at?: string
          id?: string
          issue_date?: string
          level?: number
          module_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_achievement_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "certificates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_ai_activity_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      class_lessons: {
        Row: {
          class_id: string
          comments_enabled: boolean | null
          content_url: string | null
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          has_audio: boolean | null
          has_exercise: boolean | null
          has_pdf: boolean | null
          has_quiz: boolean | null
          has_video: boolean | null
          id: string
          is_preview: boolean | null
          lesson_type: string
          order_index: number | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          video_platform: string | null
        }
        Insert: {
          class_id: string
          comments_enabled?: boolean | null
          content_url?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          has_audio?: boolean | null
          has_exercise?: boolean | null
          has_pdf?: boolean | null
          has_quiz?: boolean | null
          has_video?: boolean | null
          id?: string
          is_preview?: boolean | null
          lesson_type: string
          order_index?: number | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          video_platform?: string | null
        }
        Update: {
          class_id?: string
          comments_enabled?: boolean | null
          content_url?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          has_audio?: boolean | null
          has_exercise?: boolean | null
          has_pdf?: boolean | null
          has_quiz?: boolean | null
          has_video?: boolean | null
          id?: string
          is_preview?: boolean | null
          lesson_type?: string
          order_index?: number | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          video_platform?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_lessons_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          created_at: string | null
          description: string | null
          difficulty_level: number | null
          duration: number | null
          id: string
          module_id: string | null
          order_index: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          difficulty_level?: number | null
          duration?: number | null
          id?: string
          module_id?: string | null
          order_index?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          difficulty_level?: number | null
          duration?: number | null
          id?: string
          module_id?: string | null
          order_index?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          content: string
          created_at: string | null
          edited_at: string | null
          id: string
          is_edited: boolean | null
          is_solution: boolean | null
          parent_post_id: string | null
          reaction_count: number | null
          reply_count: number | null
          thread_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          edited_at?: string | null
          id?: string
          is_edited?: boolean | null
          is_solution?: boolean | null
          parent_post_id?: string | null
          reaction_count?: number | null
          reply_count?: number | null
          thread_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          edited_at?: string | null
          id?: string
          is_edited?: boolean | null
          is_solution?: boolean | null
          parent_post_id?: string | null
          reaction_count?: number | null
          reply_count?: number | null
          thread_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_posts_parent_post_id_fkey"
            columns: ["parent_post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_posts_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "community_threads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_achievement_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "community_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_ai_activity_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      community_threads: {
        Row: {
          category: string
          created_at: string | null
          id: string
          is_announcement: boolean | null
          is_locked: boolean | null
          is_pinned: boolean | null
          last_activity_at: string | null
          linked_class_id: string | null
          linked_course_id: string | null
          linked_lesson_id: string | null
          linked_module_id: string | null
          reaction_count: number | null
          reply_count: number | null
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string | null
          view_count: number | null
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          is_announcement?: boolean | null
          is_locked?: boolean | null
          is_pinned?: boolean | null
          last_activity_at?: string | null
          linked_class_id?: string | null
          linked_course_id?: string | null
          linked_lesson_id?: string | null
          linked_module_id?: string | null
          reaction_count?: number | null
          reply_count?: number | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id?: string | null
          view_count?: number | null
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          is_announcement?: boolean | null
          is_locked?: boolean | null
          is_pinned?: boolean | null
          last_activity_at?: string | null
          linked_class_id?: string | null
          linked_course_id?: string | null
          linked_lesson_id?: string | null
          linked_module_id?: string | null
          reaction_count?: number | null
          reply_count?: number | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "community_threads_linked_class_id_fkey"
            columns: ["linked_class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_threads_linked_course_id_fkey"
            columns: ["linked_course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_threads_linked_lesson_id_fkey"
            columns: ["linked_lesson_id"]
            isOneToOne: false
            referencedRelation: "class_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_threads_linked_module_id_fkey"
            columns: ["linked_module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_threads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_achievement_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "community_threads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_ai_activity_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      conversations: {
        Row: {
          conversation_type: string | null
          created_at: string | null
          id: string
          last_message_at: string | null
          last_message_content: string | null
          last_message_sender_id: string | null
          participant_ids: string[]
          title: string | null
          updated_at: string | null
        }
        Insert: {
          conversation_type?: string | null
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          last_message_content?: string | null
          last_message_sender_id?: string | null
          participant_ids: string[]
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          conversation_type?: string | null
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          last_message_content?: string | null
          last_message_sender_id?: string | null
          participant_ids?: string[]
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      course_categories: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          estimated_time: string | null
          icon: string | null
          id: string
          order_index: number | null
          prerequisites: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          estimated_time?: string | null
          icon?: string | null
          id?: string
          order_index?: number | null
          prerequisites?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          estimated_time?: string | null
          icon?: string | null
          id?: string
          order_index?: number | null
          prerequisites?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      course_enrollments: {
        Row: {
          completed_at: string | null
          enrolled_at: string | null
          id: string
          last_accessed: string | null
          learning_path_id: string | null
          progress_percentage: number | null
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          enrolled_at?: string | null
          id?: string
          last_accessed?: string | null
          learning_path_id?: string | null
          progress_percentage?: number | null
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          enrolled_at?: string | null
          id?: string
          last_accessed?: string | null
          learning_path_id?: string | null
          progress_percentage?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_enrollments_learning_path_id_fkey"
            columns: ["learning_path_id"]
            isOneToOne: false
            referencedRelation: "learning_paths"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_achievement_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "course_enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_ai_activity_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      courses: {
        Row: {
          access_level: string | null
          average_rating: number | null
          category_id: string | null
          created_at: string | null
          description: string | null
          difficulty_level: number | null
          duration: number | null
          enrollment_count: number | null
          estimated_time: string | null
          extended_category: string | null
          id: string
          instructor_avatar: string | null
          instructor_id: string | null
          instructor_name: string | null
          lessons: number | null
          level: string | null
          music_elements: string[] | null
          prerequisites: string[] | null
          preview_duration: number | null
          preview_type: string | null
          preview_url: string | null
          related_courses: string[] | null
          related_resources: string[] | null
          skills_count: number | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          access_level?: string | null
          average_rating?: number | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          difficulty_level?: number | null
          duration?: number | null
          enrollment_count?: number | null
          estimated_time?: string | null
          extended_category?: string | null
          id?: string
          instructor_avatar?: string | null
          instructor_id?: string | null
          instructor_name?: string | null
          lessons?: number | null
          level?: string | null
          music_elements?: string[] | null
          prerequisites?: string[] | null
          preview_duration?: number | null
          preview_type?: string | null
          preview_url?: string | null
          related_courses?: string[] | null
          related_resources?: string[] | null
          skills_count?: number | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          access_level?: string | null
          average_rating?: number | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          difficulty_level?: number | null
          duration?: number | null
          enrollment_count?: number | null
          estimated_time?: string | null
          extended_category?: string | null
          id?: string
          instructor_avatar?: string | null
          instructor_id?: string | null
          instructor_name?: string | null
          lessons?: number | null
          level?: string | null
          music_elements?: string[] | null
          prerequisites?: string[] | null
          preview_duration?: number | null
          preview_type?: string | null
          preview_url?: string | null
          related_courses?: string[] | null
          related_resources?: string[] | null
          skills_count?: number | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "course_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "user_roles_comprehensive"
            referencedColumns: ["user_id"]
          },
        ]
      }
      custom_purchases: {
        Row: {
          access_expires_at: string | null
          access_granted_at: string | null
          base_price: number
          created_at: string | null
          currency: string | null
          final_price: number
          id: string
          is_lifetime_access: boolean | null
          notes: string | null
          payment_method: string | null
          payment_provider: string | null
          payment_status: string | null
          selected_classes: string[] | null
          selected_courses: string[] | null
          selected_lessons: string[] | null
          selected_modules: string[] | null
          tier_discount: number | null
          total_items: number
          transaction_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          access_expires_at?: string | null
          access_granted_at?: string | null
          base_price: number
          created_at?: string | null
          currency?: string | null
          final_price: number
          id?: string
          is_lifetime_access?: boolean | null
          notes?: string | null
          payment_method?: string | null
          payment_provider?: string | null
          payment_status?: string | null
          selected_classes?: string[] | null
          selected_courses?: string[] | null
          selected_lessons?: string[] | null
          selected_modules?: string[] | null
          tier_discount?: number | null
          total_items: number
          transaction_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          access_expires_at?: string | null
          access_granted_at?: string | null
          base_price?: number
          created_at?: string | null
          currency?: string | null
          final_price?: number
          id?: string
          is_lifetime_access?: boolean | null
          notes?: string | null
          payment_method?: string | null
          payment_provider?: string | null
          payment_status?: string | null
          selected_classes?: string[] | null
          selected_courses?: string[] | null
          selected_lessons?: string[] | null
          selected_modules?: string[] | null
          tier_discount?: number | null
          total_items?: number
          transaction_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_achievement_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "custom_purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_ai_activity_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      direct_messages: {
        Row: {
          attachment_type: string | null
          attachment_url: string | null
          conversation_id: string | null
          created_at: string | null
          has_attachment: boolean | null
          id: string
          is_read: boolean | null
          message: string
          reactions: Json | null
          read_at: string | null
          sender_id: string | null
          updated_at: string | null
        }
        Insert: {
          attachment_type?: string | null
          attachment_url?: string | null
          conversation_id?: string | null
          created_at?: string | null
          has_attachment?: boolean | null
          id?: string
          is_read?: boolean | null
          message: string
          reactions?: Json | null
          read_at?: string | null
          sender_id?: string | null
          updated_at?: string | null
        }
        Update: {
          attachment_type?: string | null
          attachment_url?: string | null
          conversation_id?: string | null
          created_at?: string | null
          has_attachment?: boolean | null
          id?: string
          is_read?: boolean | null
          message?: string
          reactions?: Json | null
          read_at?: string | null
          sender_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "direct_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "user_achievement_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "direct_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "user_ai_activity_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      email_breach_checks: {
        Row: {
          breach_count: number | null
          breaches: Json | null
          checked_at: string | null
          created_at: string | null
          email: string
          id: string
          is_compromised: boolean
          paste_count: number | null
          pastes: Json | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          breach_count?: number | null
          breaches?: Json | null
          checked_at?: string | null
          created_at?: string | null
          email: string
          id?: string
          is_compromised?: boolean
          paste_count?: number | null
          pastes?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          breach_count?: number | null
          breaches?: Json | null
          checked_at?: string | null
          created_at?: string | null
          email?: string
          id?: string
          is_compromised?: boolean
          paste_count?: number | null
          pastes?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_breach_checks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_achievement_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "email_breach_checks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_ai_activity_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      faq_embeddings: {
        Row: {
          created_at: string | null
          embedding: string | null
          embedding_model: string | null
          faq_id: string | null
          id: string
        }
        Insert: {
          created_at?: string | null
          embedding?: string | null
          embedding_model?: string | null
          faq_id?: string | null
          id?: string
        }
        Update: {
          created_at?: string | null
          embedding?: string | null
          embedding_model?: string | null
          faq_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "faq_embeddings_faq_id_fkey"
            columns: ["faq_id"]
            isOneToOne: false
            referencedRelation: "faq_knowledge_base"
            referencedColumns: ["id"]
          },
        ]
      }
      faq_knowledge_base: {
        Row: {
          answer: string
          category: string | null
          created_by: string | null
          id: string
          is_published: boolean | null
          last_updated: string | null
          popularity_score: number | null
          question: string
          subcategory: string | null
          tags: string[] | null
          ts_vector: unknown
        }
        Insert: {
          answer: string
          category?: string | null
          created_by?: string | null
          id?: string
          is_published?: boolean | null
          last_updated?: string | null
          popularity_score?: number | null
          question: string
          subcategory?: string | null
          tags?: string[] | null
          ts_vector?: unknown
        }
        Update: {
          answer?: string
          category?: string | null
          created_by?: string | null
          id?: string
          is_published?: boolean | null
          last_updated?: string | null
          popularity_score?: number | null
          question?: string
          subcategory?: string | null
          tags?: string[] | null
          ts_vector?: unknown
        }
        Relationships: [
          {
            foreignKeyName: "faq_knowledge_base_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_achievement_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "faq_knowledge_base_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_ai_activity_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      favorites: {
        Row: {
          content_id: string
          content_type: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_achievement_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_ai_activity_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      feature_triggers: {
        Row: {
          created_at: string | null
          feature_name: string
          id: string
          last_triggered_at: string | null
          trigger_count: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          feature_name: string
          id?: string
          last_triggered_at?: string | null
          trigger_count?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          feature_name?: string
          id?: string
          last_triggered_at?: string | null
          trigger_count?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feature_triggers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feature_triggers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_roles_comprehensive"
            referencedColumns: ["user_id"]
          },
        ]
      }
      featured_items: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          image: string | null
          is_external: boolean | null
          link: string | null
          order: number | null
          title: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          image?: string | null
          is_external?: boolean | null
          link?: string | null
          order?: number | null
          title?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          image?: string | null
          is_external?: boolean | null
          link?: string | null
          order?: number | null
          title?: string | null
        }
        Relationships: []
      }
      infographics: {
        Row: {
          access_level: Database["public"]["Enums"]["access_level"]
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          image_url: string
          title: string
          updated_at: string
        }
        Insert: {
          access_level?: Database["public"]["Enums"]["access_level"]
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image_url: string
          title: string
          updated_at?: string
        }
        Update: {
          access_level?: Database["public"]["Enums"]["access_level"]
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "infographics_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_achievement_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "infographics_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_ai_activity_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      instructors: {
        Row: {
          bio: string | null
          created_at: string | null
          expertise: string[] | null
          id: string
          name: string
          profile_image_url: string | null
          social_links: Json | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          expertise?: string[] | null
          id?: string
          name: string
          profile_image_url?: string | null
          social_links?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          expertise?: string[] | null
          id?: string
          name?: string
          profile_image_url?: string | null
          social_links?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "instructors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_achievement_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "instructors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_ai_activity_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      learning_paths: {
        Row: {
          created_at: string
          current_level: number | null
          id: string
          modules: Json | null
          status: string | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_level?: number | null
          id?: string
          modules?: Json | null
          status?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_level?: number | null
          id?: string
          modules?: Json | null
          status?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_paths_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_achievement_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "learning_paths_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_ai_activity_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      lesson_progress: {
        Row: {
          completed: boolean | null
          created_at: string | null
          id: string
          last_position: number | null
          updated_at: string | null
          user_id: string | null
          video_content_id: string | null
          watched_duration: number | null
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          id?: string
          last_position?: number | null
          updated_at?: string | null
          user_id?: string | null
          video_content_id?: string | null
          watched_duration?: number | null
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          id?: string
          last_position?: number | null
          updated_at?: string | null
          user_id?: string | null
          video_content_id?: string | null
          watched_duration?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_achievement_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "lesson_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_ai_activity_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "lesson_progress_video_content_id_fkey"
            columns: ["video_content_id"]
            isOneToOne: false
            referencedRelation: "video_content"
            referencedColumns: ["id"]
          },
        ]
      }
      library_resources: {
        Row: {
          access_tier: string | null
          author: string | null
          created_at: string | null
          description: string | null
          download_count: number | null
          duration_minutes: number | null
          file_size_mb: number | null
          id: string
          is_public: boolean | null
          library_id: string | null
          page_count: number | null
          resource_type: string
          resource_url: string
          tags: string[] | null
          title: string
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          access_tier?: string | null
          author?: string | null
          created_at?: string | null
          description?: string | null
          download_count?: number | null
          duration_minutes?: number | null
          file_size_mb?: number | null
          id?: string
          is_public?: boolean | null
          library_id?: string | null
          page_count?: number | null
          resource_type: string
          resource_url: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          access_tier?: string | null
          author?: string | null
          created_at?: string | null
          description?: string | null
          download_count?: number | null
          duration_minutes?: number | null
          file_size_mb?: number | null
          id?: string
          is_public?: boolean | null
          library_id?: string | null
          page_count?: number | null
          resource_type?: string
          resource_url?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "library_resources_library_id_fkey"
            columns: ["library_id"]
            isOneToOne: false
            referencedRelation: "resource_libraries"
            referencedColumns: ["id"]
          },
        ]
      }
      likes: {
        Row: {
          created_at: string | null
          track_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          track_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          track_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_roles_comprehensive"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "likes_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_roles_comprehensive"
            referencedColumns: ["user_id"]
          },
        ]
      }
      media_files: {
        Row: {
          access_tier_id: number | null
          bucket: string
          created_at: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
        }
        Insert: {
          access_tier_id?: number | null
          bucket: string
          created_at?: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
        }
        Update: {
          access_tier_id?: number | null
          bucket?: string
          created_at?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_files_access_tier_id_fkey"
            columns: ["access_tier_id"]
            isOneToOne: false
            referencedRelation: "access_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      missing_artist_requests: {
        Row: {
          created_at: string
          id: number
          requested_slug: string
          user_agent: string | null
          user_ip: unknown
        }
        Insert: {
          created_at?: string
          id?: number
          requested_slug: string
          user_agent?: string | null
          user_ip?: unknown
        }
        Update: {
          created_at?: string
          id?: number
          requested_slug?: string
          user_agent?: string | null
          user_ip?: unknown
        }
        Relationships: []
      }
      modules: {
        Row: {
          course_id: string | null
          created_at: string | null
          description: string | null
          difficulty_level: number | null
          estimated_duration: number | null
          id: string
          order_index: number | null
          prerequisites: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          course_id?: string | null
          created_at?: string | null
          description?: string | null
          difficulty_level?: number | null
          estimated_duration?: number | null
          id?: string
          order_index?: number | null
          prerequisites?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          course_id?: string | null
          created_at?: string | null
          description?: string | null
          difficulty_level?: number | null
          estimated_duration?: number | null
          id?: string
          order_index?: number | null
          prerequisites?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      music_categories: {
        Row: {
          category_type: string
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          order_index: number | null
          updated_at: string | null
        }
        Insert: {
          category_type: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          order_index?: number | null
          updated_at?: string | null
        }
        Update: {
          category_type?: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          order_index?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      news_feed: {
        Row: {
          author_id: string | null
          content: string | null
          created_at: string | null
          id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          author_id?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "news_feed_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "user_achievement_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "news_feed_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "user_ai_activity_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          read: boolean | null
          type: string | null
          user_id: string | null
          visible_to: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          read?: boolean | null
          type?: string | null
          user_id?: string | null
          visible_to?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          read?: boolean | null
          type?: string | null
          user_id?: string | null
          visible_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_roles_comprehensive"
            referencedColumns: ["user_id"]
          },
        ]
      }
      orders: {
        Row: {
          amount: number
          created_at: string
          currency: string | null
          id: string
          item_id: string
          item_name: string
          order_type: string
          payment_metadata: Json | null
          payment_method: string | null
          payment_provider_id: string | null
          status: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string | null
          id?: string
          item_id: string
          item_name: string
          order_type: string
          payment_metadata?: Json | null
          payment_method?: string | null
          payment_provider_id?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string | null
          id?: string
          item_id?: string
          item_name?: string
          order_type?: string
          payment_metadata?: Json | null
          payment_method?: string | null
          payment_provider_id?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_achievement_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_ai_activity_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      page_404s: {
        Row: {
          count: number
          first_seen: string
          id: string
          last_seen: string
          metadata: Json | null
          path: string
          query_params: string | null
          referrers: string[] | null
          user_agents: string[] | null
        }
        Insert: {
          count?: number
          first_seen?: string
          id?: string
          last_seen?: string
          metadata?: Json | null
          path: string
          query_params?: string | null
          referrers?: string[] | null
          user_agents?: string[] | null
        }
        Update: {
          count?: number
          first_seen?: string
          id?: string
          last_seen?: string
          metadata?: Json | null
          path?: string
          query_params?: string | null
          referrers?: string[] | null
          user_agents?: string[] | null
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          created_at: string
          details: Json
          id: string
          is_default: boolean | null
          provider_id: string | null
          type: Database["public"]["Enums"]["payment_method_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          details?: Json
          id?: string
          is_default?: boolean | null
          provider_id?: string | null
          type: Database["public"]["Enums"]["payment_method_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          details?: Json
          id?: string
          is_default?: boolean | null
          provider_id?: string | null
          type?: Database["public"]["Enums"]["payment_method_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_methods_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_achievement_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "payment_methods_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_ai_activity_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      payment_sessions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          metadata: Json | null
          order_id: string | null
          provider: string
          session_id: string
          session_url: string | null
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          order_id?: string | null
          provider: string
          session_id: string
          session_url?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          order_id?: string | null
          provider?: string
          session_id?: string
          session_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_sessions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          booking_id: string | null
          created_at: string
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          order_id: string | null
          payment_method_id: string | null
          receipt_url: string | null
          reference: string | null
          status: string | null
          transaction_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          booking_id?: string | null
          created_at?: string
          id?: string
          method: Database["public"]["Enums"]["payment_method"]
          order_id?: string | null
          payment_method_id?: string | null
          receipt_url?: string | null
          reference?: string | null
          status?: string | null
          transaction_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          booking_id?: string | null
          created_at?: string
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          order_id?: string | null
          payment_method_id?: string | null
          receipt_url?: string | null
          reference?: string | null
          status?: string | null
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "user_payment_methods_formatted"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_achievement_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_ai_activity_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      playlist_tracks: {
        Row: {
          added_at: string | null
          id: string
          playlist_id: string | null
          position: number
          track_id: string | null
        }
        Insert: {
          added_at?: string | null
          id?: string
          playlist_id?: string | null
          position: number
          track_id?: string | null
        }
        Update: {
          added_at?: string | null
          id?: string
          playlist_id?: string | null
          position?: number
          track_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "playlist_tracks_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlist_tracks_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      playlists: {
        Row: {
          category: string | null
          cover_art_url: string | null
          created_at: string | null
          description: string | null
          id: string
          is_public: boolean | null
          name: string
          play_count: number | null
          total_duration: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          cover_art_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          play_count?: number | null
          total_duration?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          cover_art_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          play_count?: number | null
          total_duration?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "playlists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_achievement_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "playlists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_ai_activity_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      practice_logs: {
        Row: {
          created_at: string
          date: string
          duration: number | null
          id: string
          media_url: string | null
          notes: string | null
          routine: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          duration?: number | null
          id?: string
          media_url?: string | null
          notes?: string | null
          routine?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          duration?: number | null
          id?: string
          media_url?: string | null
          notes?: string | null
          routine?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "practice_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_achievement_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "practice_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_ai_activity_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      pricing_tiers: {
        Row: {
          bundle_10_price: number | null
          bundle_20_price: number | null
          bundle_5_price: number | null
          entity_id: string
          entity_type: string
          id: string
          is_active: boolean | null
          monthly_price: number | null
          single_price: number
          updated_at: string | null
          yearly_price: number | null
        }
        Insert: {
          bundle_10_price?: number | null
          bundle_20_price?: number | null
          bundle_5_price?: number | null
          entity_id: string
          entity_type: string
          id?: string
          is_active?: boolean | null
          monthly_price?: number | null
          single_price: number
          updated_at?: string | null
          yearly_price?: number | null
        }
        Update: {
          bundle_10_price?: number | null
          bundle_20_price?: number | null
          bundle_5_price?: number | null
          entity_id?: string
          entity_type?: string
          id?: string
          is_active?: boolean | null
          monthly_price?: number | null
          single_price?: number
          updated_at?: string | null
          yearly_price?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          email: string | null
          first_name: string | null
          full_name: string | null
          id: string
          is_admin: boolean | null
          last_active: string | null
          last_name: string | null
          onboarding_complete: boolean | null
          parent_id: string | null
          phone: string | null
          role: string
          subscription_tier: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id: string
          is_admin?: boolean | null
          last_active?: string | null
          last_name?: string | null
          onboarding_complete?: boolean | null
          parent_id?: string | null
          phone?: string | null
          role?: string
          subscription_tier?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          is_admin?: boolean | null
          last_active?: string | null
          last_name?: string | null
          onboarding_complete?: boolean | null
          parent_id?: string | null
          phone?: string | null
          role?: string
          subscription_tier?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "user_achievement_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "user_ai_activity_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "profiles_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "user_achievement_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "profiles_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "user_ai_activity_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          answers: Json | null
          completed: boolean | null
          created_at: string
          id: string
          quiz_id: string
          score: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          answers?: Json | null
          completed?: boolean | null
          created_at?: string
          id?: string
          quiz_id: string
          score?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          answers?: Json | null
          completed?: boolean | null
          created_at?: string
          id?: string
          quiz_id?: string
          score?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_achievement_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "quiz_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_ai_activity_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      quizzes: {
        Row: {
          access_level: Database["public"]["Enums"]["access_level"] | null
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          difficulty: number
          id: string
          questions: Json
          title: string
          updated_at: string
        }
        Insert: {
          access_level?: Database["public"]["Enums"]["access_level"] | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty: number
          id?: string
          questions: Json
          title: string
          updated_at?: string
        }
        Update: {
          access_level?: Database["public"]["Enums"]["access_level"] | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty?: number
          id?: string
          questions?: Json
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_achievement_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "quizzes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_ai_activity_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      reactions: {
        Row: {
          created_at: string | null
          id: string
          reactable_id: string
          reactable_type: string
          reaction_type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          reactable_id: string
          reactable_type: string
          reaction_type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          reactable_id?: string
          reactable_type?: string
          reaction_type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_achievement_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_ai_activity_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      referrals: {
        Row: {
          bonus_applied: boolean | null
          created_at: string
          id: string
          referred_email: string
          referrer_id: string
          status: string | null
          updated_at: string
        }
        Insert: {
          bonus_applied?: boolean | null
          created_at?: string
          id?: string
          referred_email: string
          referrer_id: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          bonus_applied?: boolean | null
          created_at?: string
          id?: string
          referred_email?: string
          referrer_id?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "user_achievement_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "user_ai_activity_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      resource_categories: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      resource_comments: {
        Row: {
          commentable_id: string
          commentable_type: string
          content: string
          created_at: string | null
          id: string
          likes_count: number | null
          parent_comment_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          commentable_id: string
          commentable_type: string
          content: string
          created_at?: string | null
          id?: string
          likes_count?: number | null
          parent_comment_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          commentable_id?: string
          commentable_type?: string
          content?: string
          created_at?: string | null
          id?: string
          likes_count?: number | null
          parent_comment_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resource_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "resource_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_achievement_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "resource_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_ai_activity_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      resource_libraries: {
        Row: {
          created_at: string | null
          description: string | null
          entity_id: string
          entity_type: string
          icon: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          entity_id: string
          entity_type: string
          icon?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          entity_id?: string
          entity_type?: string
          icon?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      resources: {
        Row: {
          access_level: string | null
          category_id: string | null
          created_at: string | null
          description: string | null
          duration: string | null
          id: string
          instructor: string | null
          is_locked: boolean | null
          level: string | null
          metadata: Json | null
          related_courses: string[] | null
          resource_url: string | null
          subject_category: string | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          access_level?: string | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          duration?: string | null
          id?: string
          instructor?: string | null
          is_locked?: boolean | null
          level?: string | null
          metadata?: Json | null
          related_courses?: string[] | null
          resource_url?: string | null
          subject_category?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          access_level?: string | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          duration?: string | null
          id?: string
          instructor?: string | null
          is_locked?: boolean | null
          level?: string | null
          metadata?: Json | null
          related_courses?: string[] | null
          resource_url?: string | null
          subject_category?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resources_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "resource_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      search_index: {
        Row: {
          body: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          source_id: string
          source_table: string
          title: string | null
          tsv: unknown
          updated_at: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          source_id: string
          source_table: string
          title?: string | null
          tsv?: unknown
          updated_at?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          source_id?: string
          source_table?: string
          title?: string | null
          tsv?: unknown
          updated_at?: string | null
        }
        Relationships: []
      }
      security_events: {
        Row: {
          breach_count: number | null
          created_at: string | null
          email: string | null
          event_type: string
          id: string
          metadata: Json | null
          paste_count: number | null
          user_id: string | null
        }
        Insert: {
          breach_count?: number | null
          created_at?: string | null
          email?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          paste_count?: number | null
          user_id?: string | null
        }
        Update: {
          breach_count?: number | null
          created_at?: string | null
          email?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          paste_count?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_achievement_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "security_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_ai_activity_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      song_requests: {
        Row: {
          artist: string | null
          created_at: string
          description: string | null
          id: string
          status: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          artist?: string | null
          created_at?: string
          description?: string | null
          id?: string
          status?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          artist?: string | null
          created_at?: string
          description?: string | null
          id?: string
          status?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "song_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_achievement_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "song_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_ai_activity_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      study_sessions: {
        Row: {
          activity_type: string
          created_at: string
          duration_minutes: number
          id: string
          session_date: string
          user_id: string
        }
        Insert: {
          activity_type?: string
          created_at?: string
          duration_minutes?: number
          id?: string
          session_date?: string
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          duration_minutes?: number
          id?: string
          session_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_achievement_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "study_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_ai_activity_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          id: string
          order_id: string | null
          payment_id: string | null
          payment_method_id: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          type: Database["public"]["Enums"]["subscription_type"]
          updated_at: string
          user_id: string
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          order_id?: string | null
          payment_id?: string | null
          payment_method_id?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          type?: Database["public"]["Enums"]["subscription_type"]
          updated_at?: string
          user_id: string
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string | null
          payment_id?: string | null
          payment_method_id?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          type?: Database["public"]["Enums"]["subscription_type"]
          updated_at?: string
          user_id?: string
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "user_payment_methods_formatted"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_achievement_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_ai_activity_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      thread_subscriptions: {
        Row: {
          created_at: string | null
          id: string
          notify_on_reply: boolean | null
          notify_on_solution: boolean | null
          thread_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          notify_on_reply?: boolean | null
          notify_on_solution?: boolean | null
          thread_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          notify_on_reply?: boolean | null
          notify_on_solution?: boolean | null
          thread_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "thread_subscriptions_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "community_threads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thread_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_achievement_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "thread_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_ai_activity_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      track_embeddings: {
        Row: {
          created_at: string | null
          embedding: string | null
          embedding_model: string | null
          id: string
          track_id: string | null
        }
        Insert: {
          created_at?: string | null
          embedding?: string | null
          embedding_model?: string | null
          id?: string
          track_id?: string | null
        }
        Update: {
          created_at?: string | null
          embedding?: string | null
          embedding_model?: string | null
          id?: string
          track_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "track_embeddings_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      track_plays: {
        Row: {
          id: number
          played_at: string
          track_id: string
          user_id: string | null
        }
        Insert: {
          id?: number
          played_at?: string
          track_id: string
          user_id?: string | null
        }
        Update: {
          id?: number
          played_at?: string
          track_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "track_plays_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "track_plays_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "track_plays_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_roles_comprehensive"
            referencedColumns: ["user_id"]
          },
        ]
      }
      tracks: {
        Row: {
          access_level: string | null
          alternate_audio_path: string | null
          approved: boolean | null
          artist: string | null
          audio_path: string
          background_gradient: string | null
          cover_path: string | null
          created_at: string | null
          description: string | null
          duration: number | null
          id: string
          preview_url: string | null
          primary_color: string | null
          secondary_color: string | null
          slug: string | null
          title: string
          user_id: string | null
          video_url: string | null
          youtube_url: string | null
        }
        Insert: {
          access_level?: string | null
          alternate_audio_path?: string | null
          approved?: boolean | null
          artist?: string | null
          audio_path: string
          background_gradient?: string | null
          cover_path?: string | null
          created_at?: string | null
          description?: string | null
          duration?: number | null
          id?: string
          preview_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          slug?: string | null
          title: string
          user_id?: string | null
          video_url?: string | null
          youtube_url?: string | null
        }
        Update: {
          access_level?: string | null
          alternate_audio_path?: string | null
          approved?: boolean | null
          artist?: string | null
          audio_path?: string
          background_gradient?: string | null
          cover_path?: string | null
          created_at?: string | null
          description?: string | null
          duration?: number | null
          id?: string
          preview_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          slug?: string | null
          title?: string
          user_id?: string | null
          video_url?: string | null
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tracks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_roles_comprehensive"
            referencedColumns: ["user_id"]
          },
        ]
      }
      tutors: {
        Row: {
          available_days: Json | null
          average_rating: number | null
          bio: string | null
          created_at: string
          hourly_rate: number | null
          id: string
          is_freelance: boolean | null
          is_verified: boolean | null
          specialty: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          available_days?: Json | null
          average_rating?: number | null
          bio?: string | null
          created_at?: string
          hourly_rate?: number | null
          id?: string
          is_freelance?: boolean | null
          is_verified?: boolean | null
          specialty?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          available_days?: Json | null
          average_rating?: number | null
          bio?: string | null
          created_at?: string
          hourly_rate?: number | null
          id?: string
          is_freelance?: boolean | null
          is_verified?: boolean | null
          specialty?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tutors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_achievement_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "tutors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_ai_activity_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string | null
          created_at: string | null
          id: string
          progress: number | null
          unlocked: boolean | null
          unlocked_at: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          achievement_id?: string | null
          created_at?: string | null
          id?: string
          progress?: number | null
          unlocked?: boolean | null
          unlocked_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          achievement_id?: string | null
          created_at?: string | null
          id?: string
          progress?: number | null
          unlocked?: boolean | null
          unlocked_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_achievement_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_ai_activity_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_ai_preferences: {
        Row: {
          auto_expand_ai: boolean | null
          created_at: string | null
          feedback_requests_enabled: boolean | null
          id: string
          max_response_length: number | null
          preferred_model: string | null
          temperature_setting: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          auto_expand_ai?: boolean | null
          created_at?: string | null
          feedback_requests_enabled?: boolean | null
          id?: string
          max_response_length?: number | null
          preferred_model?: string | null
          temperature_setting?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          auto_expand_ai?: boolean | null
          created_at?: string | null
          feedback_requests_enabled?: boolean | null
          id?: string
          max_response_length?: number | null
          preferred_model?: string | null
          temperature_setting?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_ai_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_achievement_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_ai_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_ai_activity_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_community_stats: {
        Row: {
          badges: string[] | null
          comments_created: number | null
          created_at: string | null
          helpful_votes: number | null
          posts_created: number | null
          reactions_given: number | null
          reactions_received: number | null
          reputation_points: number | null
          solutions_provided: number | null
          threads_created: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          badges?: string[] | null
          comments_created?: number | null
          created_at?: string | null
          helpful_votes?: number | null
          posts_created?: number | null
          reactions_given?: number | null
          reactions_received?: number | null
          reputation_points?: number | null
          solutions_provided?: number | null
          threads_created?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          badges?: string[] | null
          comments_created?: number | null
          created_at?: string | null
          helpful_votes?: number | null
          posts_created?: number | null
          reactions_given?: number | null
          reactions_received?: number | null
          reputation_points?: number | null
          solutions_provided?: number | null
          threads_created?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_community_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_achievement_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_community_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_ai_activity_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_course_progress: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          course_id: string | null
          id: string
          last_accessed: string | null
          progress: number | null
          user_id: string | null
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          course_id?: string | null
          id?: string
          last_accessed?: string | null
          progress?: number | null
          user_id?: string | null
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          course_id?: string | null
          id?: string
          last_accessed?: string | null
          progress?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_course_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_course_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_achievement_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_course_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_ai_activity_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_lesson_progress: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          id: string
          last_position: number | null
          lesson_id: string | null
          updated_at: string | null
          user_id: string | null
          watch_time: number | null
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          last_position?: number | null
          lesson_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          watch_time?: number | null
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          last_position?: number | null
          lesson_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          watch_time?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_lesson_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_achievement_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_lesson_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_ai_activity_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_lesson_tracking: {
        Row: {
          bookmarked: boolean | null
          class_id: string | null
          completed_at: string | null
          completion_percentage: number | null
          course_id: string | null
          created_at: string | null
          difficulty_rating: number | null
          id: string
          last_accessed_at: string | null
          lesson_id: string | null
          module_id: string | null
          personal_notes: string | null
          quiz_attempts: number | null
          quiz_best_score: number | null
          quiz_passed: boolean | null
          resources_downloaded: string[] | null
          resources_viewed: string[] | null
          started_at: string | null
          time_spent_minutes: number | null
          updated_at: string | null
          user_id: string | null
          video_watched_percentage: number | null
        }
        Insert: {
          bookmarked?: boolean | null
          class_id?: string | null
          completed_at?: string | null
          completion_percentage?: number | null
          course_id?: string | null
          created_at?: string | null
          difficulty_rating?: number | null
          id?: string
          last_accessed_at?: string | null
          lesson_id?: string | null
          module_id?: string | null
          personal_notes?: string | null
          quiz_attempts?: number | null
          quiz_best_score?: number | null
          quiz_passed?: boolean | null
          resources_downloaded?: string[] | null
          resources_viewed?: string[] | null
          started_at?: string | null
          time_spent_minutes?: number | null
          updated_at?: string | null
          user_id?: string | null
          video_watched_percentage?: number | null
        }
        Update: {
          bookmarked?: boolean | null
          class_id?: string | null
          completed_at?: string | null
          completion_percentage?: number | null
          course_id?: string | null
          created_at?: string | null
          difficulty_rating?: number | null
          id?: string
          last_accessed_at?: string | null
          lesson_id?: string | null
          module_id?: string | null
          personal_notes?: string | null
          quiz_attempts?: number | null
          quiz_best_score?: number | null
          quiz_passed?: boolean | null
          resources_downloaded?: string[] | null
          resources_viewed?: string[] | null
          started_at?: string | null
          time_spent_minutes?: number | null
          updated_at?: string | null
          user_id?: string | null
          video_watched_percentage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_lesson_tracking_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_lesson_tracking_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_lesson_tracking_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "class_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_lesson_tracking_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_lesson_tracking_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_achievement_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_lesson_tracking_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_ai_activity_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_progress: {
        Row: {
          achievements_unlocked: number | null
          avg_daily_study_minutes: number | null
          chords_learned: number | null
          christmas_songs_learned: number | null
          classes_completed: number | null
          community_interactions: number | null
          completed_courses: number | null
          completed_lessons: number | null
          courses_completed: number | null
          courses_enrolled: number | null
          created_at: string | null
          current_streak_days: number | null
          dynamics_mastery: number | null
          favorite_tool: string | null
          form_mastery: number | null
          guitar_course_completed: boolean | null
          guitar_course_progress: number | null
          harmony_mastery: number | null
          help_given: number | null
          id: string
          last_quiz_date: string | null
          last_study_date: string | null
          lessons_completed: number | null
          level: number | null
          lifetime_value: number | null
          longest_streak_days: number | null
          melody_mastery: number | null
          modules_completed: number | null
          piano_course_completed: boolean | null
          piano_course_progress: number | null
          practice_streak: number | null
          profile_completion: number | null
          quiz_attempts_total: number | null
          quiz_average_score: number | null
          quiz_categories_mastered: string[] | null
          quiz_perfect_scores: number | null
          referrals: number | null
          rhythm_mastery: number | null
          songs_learned: number | null
          subscription_revenue_generated: number | null
          tempo_mastery: number | null
          texture_mastery: number | null
          timbre_mastery: number | null
          tools_used: string[] | null
          tools_used_count: number | null
          total_practice_minutes: number | null
          total_study_time_minutes: number | null
          total_tool_sessions: number | null
          total_xp: number | null
          tutor_sessions: number | null
          updated_at: string | null
          user_id: string | null
          videos_watched: number | null
          vocal_course_completed: boolean | null
          vocal_course_progress: number | null
          worship_course_completed: boolean | null
          worship_course_progress: number | null
        }
        Insert: {
          achievements_unlocked?: number | null
          avg_daily_study_minutes?: number | null
          chords_learned?: number | null
          christmas_songs_learned?: number | null
          classes_completed?: number | null
          community_interactions?: number | null
          completed_courses?: number | null
          completed_lessons?: number | null
          courses_completed?: number | null
          courses_enrolled?: number | null
          created_at?: string | null
          current_streak_days?: number | null
          dynamics_mastery?: number | null
          favorite_tool?: string | null
          form_mastery?: number | null
          guitar_course_completed?: boolean | null
          guitar_course_progress?: number | null
          harmony_mastery?: number | null
          help_given?: number | null
          id?: string
          last_quiz_date?: string | null
          last_study_date?: string | null
          lessons_completed?: number | null
          level?: number | null
          lifetime_value?: number | null
          longest_streak_days?: number | null
          melody_mastery?: number | null
          modules_completed?: number | null
          piano_course_completed?: boolean | null
          piano_course_progress?: number | null
          practice_streak?: number | null
          profile_completion?: number | null
          quiz_attempts_total?: number | null
          quiz_average_score?: number | null
          quiz_categories_mastered?: string[] | null
          quiz_perfect_scores?: number | null
          referrals?: number | null
          rhythm_mastery?: number | null
          songs_learned?: number | null
          subscription_revenue_generated?: number | null
          tempo_mastery?: number | null
          texture_mastery?: number | null
          timbre_mastery?: number | null
          tools_used?: string[] | null
          tools_used_count?: number | null
          total_practice_minutes?: number | null
          total_study_time_minutes?: number | null
          total_tool_sessions?: number | null
          total_xp?: number | null
          tutor_sessions?: number | null
          updated_at?: string | null
          user_id?: string | null
          videos_watched?: number | null
          vocal_course_completed?: boolean | null
          vocal_course_progress?: number | null
          worship_course_completed?: boolean | null
          worship_course_progress?: number | null
        }
        Update: {
          achievements_unlocked?: number | null
          avg_daily_study_minutes?: number | null
          chords_learned?: number | null
          christmas_songs_learned?: number | null
          classes_completed?: number | null
          community_interactions?: number | null
          completed_courses?: number | null
          completed_lessons?: number | null
          courses_completed?: number | null
          courses_enrolled?: number | null
          created_at?: string | null
          current_streak_days?: number | null
          dynamics_mastery?: number | null
          favorite_tool?: string | null
          form_mastery?: number | null
          guitar_course_completed?: boolean | null
          guitar_course_progress?: number | null
          harmony_mastery?: number | null
          help_given?: number | null
          id?: string
          last_quiz_date?: string | null
          last_study_date?: string | null
          lessons_completed?: number | null
          level?: number | null
          lifetime_value?: number | null
          longest_streak_days?: number | null
          melody_mastery?: number | null
          modules_completed?: number | null
          piano_course_completed?: boolean | null
          piano_course_progress?: number | null
          practice_streak?: number | null
          profile_completion?: number | null
          quiz_attempts_total?: number | null
          quiz_average_score?: number | null
          quiz_categories_mastered?: string[] | null
          quiz_perfect_scores?: number | null
          referrals?: number | null
          rhythm_mastery?: number | null
          songs_learned?: number | null
          subscription_revenue_generated?: number | null
          tempo_mastery?: number | null
          texture_mastery?: number | null
          timbre_mastery?: number | null
          tools_used?: string[] | null
          tools_used_count?: number | null
          total_practice_minutes?: number | null
          total_study_time_minutes?: number | null
          total_tool_sessions?: number | null
          total_xp?: number | null
          tutor_sessions?: number | null
          updated_at?: string | null
          user_id?: string | null
          videos_watched?: number | null
          vocal_course_completed?: boolean | null
          vocal_course_progress?: number | null
          worship_course_completed?: boolean | null
          worship_course_progress?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_achievement_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_ai_activity_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_achievement_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_ai_activity_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_study_sessions: {
        Row: {
          created_at: string | null
          duration_minutes: number | null
          forum_posts: number | null
          id: string
          lessons_accessed: string[] | null
          notes_written: number | null
          quizzes_taken: number | null
          resources_viewed: string[] | null
          session_date: string
          session_end: string | null
          session_start: string
          tools_used: string[] | null
          user_id: string | null
          videos_watched: number | null
        }
        Insert: {
          created_at?: string | null
          duration_minutes?: number | null
          forum_posts?: number | null
          id?: string
          lessons_accessed?: string[] | null
          notes_written?: number | null
          quizzes_taken?: number | null
          resources_viewed?: string[] | null
          session_date: string
          session_end?: string | null
          session_start: string
          tools_used?: string[] | null
          user_id?: string | null
          videos_watched?: number | null
        }
        Update: {
          created_at?: string | null
          duration_minutes?: number | null
          forum_posts?: number | null
          id?: string
          lessons_accessed?: string[] | null
          notes_written?: number | null
          quizzes_taken?: number | null
          resources_viewed?: string[] | null
          session_date?: string
          session_end?: string | null
          session_start?: string
          tools_used?: string[] | null
          user_id?: string | null
          videos_watched?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_study_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_achievement_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_study_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_ai_activity_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_ui_preferences: {
        Row: {
          created_at: string
          id: string
          instrument_selector_views: number
          last_instrument_selector_shown: string | null
          preferences: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          instrument_selector_views?: number
          last_instrument_selector_shown?: string | null
          preferences?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          instrument_selector_views?: number
          last_instrument_selector_shown?: string | null
          preferences?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_ui_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_achievement_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_ui_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_ai_activity_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      video_content: {
        Row: {
          access_level: Database["public"]["Enums"]["access_level"]
          approved: boolean
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          duration: number | null
          id: string
          resource_category: string | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          youtube_url: string
        }
        Insert: {
          access_level?: Database["public"]["Enums"]["access_level"]
          approved?: boolean
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration?: number | null
          id?: string
          resource_category?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          youtube_url: string
        }
        Update: {
          access_level?: Database["public"]["Enums"]["access_level"]
          approved?: boolean
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration?: number | null
          id?: string
          resource_category?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          youtube_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_content_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_achievement_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "video_content_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_ai_activity_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "video_content_resource_category_fkey"
            columns: ["resource_category"]
            isOneToOne: false
            referencedRelation: "resource_categories"
            referencedColumns: ["name"]
          },
          {
            foreignKeyName: "video_content_resource_category_fkey"
            columns: ["resource_category"]
            isOneToOne: false
            referencedRelation: "resources_by_category"
            referencedColumns: ["category_name"]
          },
          {
            foreignKeyName: "video_content_resource_category_fkey"
            columns: ["resource_category"]
            isOneToOne: false
            referencedRelation: "resources_with_categories"
            referencedColumns: ["category_name"]
          },
        ]
      }
      weak_passwords: {
        Row: {
          created_at: string | null
          id: string
          password_hash: string
          pattern_type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          password_hash: string
          pattern_type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          password_hash?: string
          pattern_type?: string
        }
        Relationships: []
      }
    }
    Views: {
      admin_user_analytics: {
        Row: {
          activity_status: string | null
          anonymized_user_id: string | null
          avg_daily_study_minutes: number | null
          avg_element_mastery: number | null
          classes_completed: number | null
          community_reputation: number | null
          courses_completed: number | null
          courses_enrolled: number | null
          current_streak_days: number | null
          engagement_score: number | null
          joined_date: string | null
          last_study_date: string | null
          lessons_completed: number | null
          lifetime_value: number | null
          longest_streak_days: number | null
          modules_completed: number | null
          posts_created: number | null
          subscription_revenue_generated: number | null
          subscription_tier: string | null
          threads_created: number | null
          total_study_time_minutes: number | null
          total_xp: number | null
          user_level: number | null
          user_role: string | null
        }
        Relationships: []
      }
      ai_performance_dashboard: {
        Row: {
          avg_response_time: number | null
          date: string | null
          helpful_responses: number | null
          model_name: string | null
          total_requests: number | null
          total_tokens_used: number | null
          unique_users: number | null
        }
        Relationships: []
      }
      resources_by_category: {
        Row: {
          auth_resources: number | null
          basic_resources: number | null
          category_id: string | null
          category_name: string | null
          free_resources: number | null
          premium_resources: number | null
          professional_resources: number | null
          resources: Json | null
          total_resources: number | null
        }
        Relationships: [
          {
            foreignKeyName: "resources_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "resource_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      resources_with_categories: {
        Row: {
          access_level: string | null
          category_description: string | null
          category_icon: string | null
          category_id: string | null
          category_name: string | null
          created_at: string | null
          description: string | null
          duration: string | null
          id: string | null
          instructor: string | null
          is_locked: boolean | null
          level: string | null
          metadata: Json | null
          resource_url: string | null
          subject_category: string | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resources_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "resource_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievement_summary: {
        Row: {
          completion_percentage: number | null
          email: string | null
          role: string | null
          total_achievements: number | null
          total_points: number | null
          unlocked_achievements: number | null
          unlocked_points: number | null
          user_id: string | null
        }
        Relationships: []
      }
      user_ai_activity_summary: {
        Row: {
          avg_response_time: number | null
          display_name: string | null
          email: string | null
          helpful_responses: number | null
          last_interaction: string | null
          total_interactions: number | null
          user_id: string | null
        }
        Relationships: []
      }
      user_payment_methods_formatted: {
        Row: {
          created_at: string | null
          formatted_details: Json | null
          id: string | null
          is_default: boolean | null
          provider_id: string | null
          type: Database["public"]["Enums"]["payment_method_type"] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          formatted_details?: never
          id?: string | null
          is_default?: boolean | null
          provider_id?: string | null
          type?: Database["public"]["Enums"]["payment_method_type"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          formatted_details?: never
          id?: string | null
          is_default?: boolean | null
          provider_id?: string | null
          type?: Database["public"]["Enums"]["payment_method_type"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_methods_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_achievement_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "payment_methods_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_ai_activity_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_roles_comprehensive: {
        Row: {
          app_roles: Database["public"]["Enums"]["app_role"][] | null
          created_at: string | null
          display_name: string | null
          email: string | null
          is_admin: boolean | null
          is_tutor: boolean | null
          is_user: boolean | null
          profile_role: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_achievement_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_ai_activity_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Functions: {
      add_user_xp: {
        Args: { p_user_id: string; p_xp_amount: number }
        Returns: {
          leveled_up: boolean
          new_level: number
          new_xp: number
        }[]
      }
      admin_create_featured_item: {
        Args: {
          p_description: string
          p_image: string
          p_is_external?: boolean
          p_link: string
          p_order?: number
          p_title: string
        }
        Returns: string
      }
      admin_delete_featured_item: { Args: { p_id: string }; Returns: boolean }
      admin_update_featured_item: {
        Args: {
          p_description: string
          p_id: string
          p_image: string
          p_is_external?: boolean
          p_link: string
          p_order?: number
          p_title: string
        }
        Returns: boolean
      }
      analyze_search_performance: {
        Args: { search_term: string }
        Returns: {
          average_rank: number
          execution_time: number
          index_used: string
          result_count: number
          search_type: string
        }[]
      }
      calculate_course_progress: {
        Args: { course_id_param: string; user_id_param: string }
        Returns: number
      }
      calculate_progress: {
        Args: { calculator: Json; requirement: Json }
        Returns: number
      }
      calculate_user_streak: { Args: { p_user_id: string }; Returns: number }
      can_access_resource: { Args: { resource_id: string }; Returns: boolean }
      can_manage_content: { Args: never; Returns: boolean }
      check_requirement: {
        Args: { calculator: Json; requirement: Json }
        Returns: boolean
      }
      check_track_access:
        | { Args: { track_id: string; user_tier: string }; Returns: boolean }
        | { Args: { track_id: string; user_id: string }; Returns: boolean }
      cleanup_old_breach_checks:
        | { Args: never; Returns: undefined }
        | { Args: { days_old?: number }; Returns: number }
      get_ai_context: { Args: { query_text: string }; Returns: Json }
      get_all_content: {
        Args: never
        Returns: {
          created_at: string
          downloads: number
          enrollments: number
          id: string
          plays: number
          title: string
          type: string
          views: number
        }[]
      }
      get_all_content_unified: {
        Args: never
        Returns: {
          created_at: string
          downloads: number
          enrollments: number
          id: string
          plays: number
          title: string
          type: string
          views: number
        }[]
      }
      get_audio_play_counts: {
        Args: never
        Returns: {
          play_count: number
          track_id: string
        }[]
      }
      get_course_enrollment_counts: {
        Args: never
        Returns: {
          enrollment_count: number
          learning_path_id: string
        }[]
      }
      get_current_month_revenue: {
        Args: never
        Returns: {
          total_revenue: number
        }[]
      }
      get_featured_items_admin: {
        Args: never
        Returns: {
          created_at: string
          description: string
          id: string
          image: string
          is_external: boolean
          link: string
          order: number
          title: string
        }[]
      }
      get_recent_content:
        | {
            Args: never
            Returns: {
              created_at: string
              downloads: number
              enrollments: number
              id: string
              plays: number
              title: string
              type: string
              views: number
            }[]
          }
        | {
            Args: { limit_count: number }
            Returns: {
              created_at: string
              downloads: number
              enrollments: number
              id: string
              plays: number
              title: string
              type: string
              views: number
            }[]
          }
      get_resources_by_access: {
        Args: { user_access_level: string }
        Returns: {
          access_level: string | null
          category_id: string | null
          created_at: string | null
          description: string | null
          duration: string | null
          id: string
          instructor: string | null
          is_locked: boolean | null
          level: string | null
          metadata: Json | null
          related_courses: string[] | null
          resource_url: string | null
          subject_category: string | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "resources"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_resources_by_category_secure: {
        Args: never
        Returns: {
          auth_resources: number
          basic_resources: number
          category_id: string
          category_name: string
          free_resources: number
          premium_resources: number
          professional_resources: number
          resources: Json
          total_resources: number
        }[]
      }
      get_total_content_views: {
        Args: never
        Returns: {
          total_views: number
        }[]
      }
      get_user_activity: {
        Args: { limit_records?: number; target_user_id?: string }
        Returns: {
          activity_description: string
          activity_id: string
          activity_type: string
          created_at: string
          ip_address: unknown
          user_agent: string
          user_id: string
        }[]
      }
      get_user_breach_summary:
        | { Args: never; Returns: undefined }
        | {
            Args: { target_user_id?: string }
            Returns: {
              compromised_emails: number
              last_check_date: string
              total_breaches: number
              total_emails_checked: number
              total_pastes: number
            }[]
          }
      get_user_default_payment_method: {
        Args: { user_uuid: string }
        Returns: {
          details: Json
          id: string
          is_default: boolean
          provider_id: string
          type: Database["public"]["Enums"]["payment_method_type"]
        }[]
      }
      get_user_resource_updates: {
        Args: never
        Returns: {
          access_level: string
          category_id: string
          created_at: string
          description: string
          duration: string
          id: string
          instructor: string
          is_locked: boolean
          level: string
          metadata: Json
          resource_url: string
          subject_category: string
          tags: string[]
          thumbnail_url: string
          title: string
          updated_at: string
        }[]
      }
      get_video_view_counts: {
        Args: never
        Returns: {
          video_content_id: string
          view_count: number
        }[]
      }
      get_weekly_study_data: {
        Args: { p_user_id: string }
        Returns: {
          day_name: string
          minutes: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      inspect_old_breach_checks: {
        Args: never
        Returns: {
          created_at: string
          id: number
        }[]
      }
      is_admin:
        | { Args: never; Returns: boolean }
        | { Args: { target_user_id: string }; Returns: boolean }
      is_current_user_admin: { Args: never; Returns: boolean }
      is_user_admin: { Args: { user_id?: string }; Returns: boolean }
      log_ai_interaction: {
        Args: {
          p_context_used?: Json
          p_conversation_id: string
          p_input_text: string
          p_model_used: string
          p_output_text: string
          p_processing_time_ms: number
          p_user_id: string
        }
        Returns: string
      }
      search_all: {
        Args: { _limit?: number; _offset?: number; _q: string }
        Returns: {
          metadata: Json
          rank: number
          snippet: string
          source_id: string
          source_table: string
          title: string
        }[]
      }
      search_resources: {
        Args: { search_term: string }
        Returns: {
          access_level: string | null
          category_id: string | null
          created_at: string | null
          description: string | null
          duration: string | null
          id: string
          instructor: string | null
          is_locked: boolean | null
          level: string | null
          metadata: Json | null
          related_courses: string[] | null
          resource_url: string | null
          subject_category: string | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "resources"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      test_admin_access: {
        Args: never
        Returns: {
          can_delete: boolean
          can_read: boolean
          can_write: boolean
          checked_at: string
          status: string
        }[]
      }
      unaccent: { Args: { "": string }; Returns: string }
      update_study_streak: {
        Args: { p_user_id: string }
        Returns: {
          current_streak: number
          is_new_day: boolean
        }[]
      }
      upsert_search_index: {
        Args: {
          _body: string
          _metadata?: Json
          _source_id: string
          _source_table: string
          _title: string
        }
        Returns: undefined
      }
      validate_password_security: { Args: { password: string }; Returns: Json }
      verify_admin_status: {
        Args: never
        Returns: {
          display_name: string
          email: string
          has_admin_access: boolean
          is_admin: boolean
          is_authenticated: boolean
          message: string
          role: string
          subscription_tier: string
          user_id: string
        }[]
      }
    }
    Enums: {
      access_level: "free" | "basic" | "premium" | "professional"
      app_role: "admin" | "tutor" | "user"
      booking_status: "pending" | "confirmed" | "canceled" | "completed"
      payment_method: "mpesa" | "paypal" | "card" | "bank_transfer"
      payment_method_type: "card" | "mpesa" | "paypal" | "bank"
      subscription_status: "active" | "expired" | "canceled" | "pending"
      subscription_type: "free" | "basic" | "premium" | "professional"
      user_role:
        | "student"
        | "adult_learner"
        | "tutor"
        | "parent"
        | "user"
        | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      access_level: ["free", "basic", "premium", "professional"],
      app_role: ["admin", "tutor", "user"],
      booking_status: ["pending", "confirmed", "canceled", "completed"],
      payment_method: ["mpesa", "paypal", "card", "bank_transfer"],
      payment_method_type: ["card", "mpesa", "paypal", "bank"],
      subscription_status: ["active", "expired", "canceled", "pending"],
      subscription_type: ["free", "basic", "premium", "professional"],
      user_role: [
        "student",
        "adult_learner",
        "tutor",
        "parent",
        "user",
        "admin",
      ],
    },
  },
} as const
