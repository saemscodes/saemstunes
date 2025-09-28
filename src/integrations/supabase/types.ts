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
      // ... ALL YOUR EXISTING TABLES (keeping them exactly as they are) ...
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
        ]
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
        ]
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
            foreignKeyName: "lesson_progress_video_content_id_fkey"
            columns: ["video_content_id"]
            isOneToOne: false
            referencedRelation: "video_content"
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
            foreignKeyName: "likes_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
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
          user_ip: unknown | null
        }
        Insert: {
          created_at?: string
          id?: number
          requested_slug: string
          user_agent?: string | null
          user_ip?: unknown | null
        }
        Update: {
          created_at?: string
          id?: number
          requested_slug?: string
          user_agent?: string | null
          user_ip?: unknown | null
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
        ]
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
        ]
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
            foreignKeyName: "profiles_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "user_achievement_summary"
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
        ]
      }
      user_progress: {
        Row: {
          achievements_unlocked: number | null
          chords_learned: number | null
          christmas_songs_learned: number | null
          community_interactions: number | null
          completed_courses: number | null
          completed_lessons: number | null
          created_at: string | null
          guitar_course_completed: boolean | null
          guitar_course_progress: number | null
          help_given: number | null
          id: string
          piano_course_completed: boolean | null
          piano_course_progress: number | null
          practice_streak: number | null
          profile_completion: number | null
          referrals: number | null
          songs_learned: number | null
          tools_used_count: number | null
          total_practice_minutes: number | null
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
          chords_learned?: number | null
          christmas_songs_learned?: number | null
          community_interactions?: number | null
          completed_courses?: number | null
          completed_lessons?: number | null
          created_at?: string | null
          guitar_course_completed?: boolean | null
          guitar_course_progress?: number | null
          help_given?: number | null
          id?: string
          piano_course_completed?: boolean | null
          piano_course_progress?: number | null
          practice_streak?: number | null
          profile_completion?: number | null
          referrals?: number | null
          songs_learned?: number | null
          tools_used_count?: number | null
          total_practice_minutes?: number | null
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
          chords_learned?: number | null
          christmas_songs_learned?: number | null
          community_interactions?: number | null
          completed_courses?: number | null
          completed_lessons?: number | null
          created_at?: string | null
          guitar_course_completed?: boolean | null
          guitar_course_progress?: number | null
          help_given?: number | null
          id?: string
          piano_course_completed?: boolean | null
          piano_course_progress?: number | null
          practice_streak?: number | null
          profile_completion?: number | null
          referrals?: number | null
          songs_learned?: number | null
          tools_used_count?: number | null
          total_practice_minutes?: number | null
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

      // ============ AI SYSTEM TABLES ============
      ai_interactions: {
        Row: {
          id: string
          user_id: string
          conversation_id: string
          query: string
          response: string
          processing_time: number
          model_used: string
          created_at: string
          feedback: boolean | null
          context_used: Json
        }
        Insert: {
          id?: string
          user_id: string
          conversation_id: string
          query: string
          response: string
          processing_time: number
          model_used: string
          created_at?: string
          feedback?: boolean | null
          context_used?: Json
        }
        Update: {
          id?: string
          user_id?: string
          conversation_id?: string
          query?: string
          response?: string
          processing_time?: number
          model_used?: string
          created_at?: string
          feedback?: boolean | null
          context_used?: Json
        }
        Relationships: [
          {
            foreignKeyName: "ai_interactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          favorite_genres: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          favorite_genres?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          favorite_genres?: string[]
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      user_activity: {
        Row: {
          id: string
          user_id: string
          activity_type: string
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          activity_type: string
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          activity_type?: string
          metadata?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_activity_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      learning_progress: {
        Row: {
          id: string
          user_id: string
          completed_lessons: number
          current_course: string | null
          total_xp: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          completed_lessons?: number
          current_course?: string | null
          total_xp?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          completed_lessons?: number
          current_course?: string | null
          total_xp?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      // ============ END AI SYSTEM TABLES ============
    }
    Views: {
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
        ]
      }
    }
    Functions: {
      calculate_progress: {
        Args: { calculator: Json; requirement: Json }
        Returns: number
      }
      can_access_resource: {
        Args: { resource_id: string }
        Returns: boolean
      }
      check_requirement: {
        Args: { calculator: Json; requirement: Json }
        Returns: boolean
      }
      check_track_access: {
        Args:
          | { track_id: string; user_id: string }
          | { track_id: string; user_tier: string }
        Returns: boolean
      }
      cleanup_old_breach_checks: {
        Args: Record<PropertyKey, never> | { days_old?: number }
        Returns: undefined
      }
      get_all_content: {
        Args: Record<PropertyKey, never>
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
        Args: Record<PropertyKey, never>
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
        Args: Record<PropertyKey, never>
        Returns: {
          play_count: number
          track_id: string
        }[]
      }
      get_course_enrollment_counts: {
        Args: Record<PropertyKey, never>
        Returns: {
          enrollment_count: number
          learning_path_id: string
        }[]
      }
      get_current_month_revenue: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_revenue: number
        }[]
      }
      get_recent_content: {
        Args: Record<PropertyKey, never> | { limit_count: number }
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
          resource_url: string | null
          subject_category: string | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
        }[]
      }
      get_resources_by_category_secure: {
        Args: Record<PropertyKey, never>
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
        Args: Record<PropertyKey, never>
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
      get_user_breach_summary: {
        Args: Record<PropertyKey, never> | { target_user_id?: string }
        Returns: undefined
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
        Args: Record<PropertyKey, never>
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
        Args: Record<PropertyKey, never>
        Returns: {
          video_content_id: string
          view_count: number
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
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          id: number
        }[]
      }
      is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_current_user_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
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
          resource_url: string | null
          subject_category: string | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
        }[]
      }
      validate_password_security: {
        Args: { password: string }
        Returns: Json
      }
    }
    Enums: {
      access_level: "free" | "basic" | "premium" | "private"
      app_role: "admin" | "tutor" | "user"
      booking_status: "pending" | "confirmed" | "canceled" | "completed"
      payment_method: "mpesa" | "paypal" | "card" | "bank_transfer"
      payment_method_type: "card" | "mpesa" | "paypal" | "bank"
      subscription_status: "active" | "expired" | "canceled" | "pending"
      subscription_type: "free" | "basic" | "premium" | "enterprise"
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
      access_level: ["free", "basic", "premium", "private"],
      app_role: ["admin", "tutor", "user"],
      booking_status: ["pending", "confirmed", "canceled", "completed"],
      payment_method: ["mpesa", "paypal", "card", "bank_transfer"],
      payment_method_type: ["card", "mpesa", "paypal", "bank"],
      subscription_status: ["active", "expired", "canceled", "pending"],
      subscription_type: ["free", "basic", "premium", "enterprise"],
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
