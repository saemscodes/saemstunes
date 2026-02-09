-- =============================================
-- SAEM'S TUNES - DATABASE ALIGNMENT & ENHANCEMENT
-- Version: 2.2.0 (Legacy Convention Fix)
-- Date: 2026-02-09
-- =============================================

-- =============================================
-- SECTION 1: RESOURCE LIBRARY (EXISTING ALIGNMENT)
-- =============================================

-- resource_libraries and library_resources mostly exist, ensuring columns
DO $$ 
BEGIN 
  -- library_resources: Switch from file_size_bytes to file_size_mb if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='library_resources' AND column_name='file_size_mb') THEN
    ALTER TABLE library_resources ADD COLUMN file_size_mb DECIMAL(10, 2);
  END IF;
END $$;

-- =============================================
-- SECTION 2: COMMUNITY & REACTIONS (FIXING ENTITY_TYPE)
-- =============================================

-- Ensure indexes exist using CORRECT 'user_id' column
CREATE INDEX IF NOT EXISTS idx_threads_user ON community_threads(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_user ON community_posts(user_id);

-- REACTIONS - Using EXISTING 'reactable_type' and 'reactable_id'
CREATE INDEX IF NOT EXISTS idx_reactions_entity ON reactions(reactable_type, reactable_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user ON reactions(user_id);

-- =============================================
-- SECTION 3: USER PROGRESS (GENERIC TRACKING)
-- =============================================

-- user_progress (aggregate) exists, but we want an item-level tracker for generic items
CREATE TABLE IF NOT EXISTS user_learning_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('course', 'module', 'class', 'lesson', 'tool', 'quiz')),
  entity_id UUID NOT NULL,
  status TEXT DEFAULT 'started' CHECK (status IN ('started', 'in_progress', 'completed')),
  progress_percent INTEGER DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  time_spent_seconds INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, entity_type, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_learning_progress_user ON user_learning_progress(user_id);

-- STUDY SESSIONS - Align with EXISTING schema
-- existing: user_study_sessions(id, user_id, session_start, session_end, duration_minutes, etc.)
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_study_sessions' AND column_name='session_type') THEN
    ALTER TABLE user_study_sessions ADD COLUMN session_type TEXT DEFAULT 'learning';
  END IF;
END $$;

-- =============================================
-- SECTION 4: ANALYTICS (NEW)
-- =============================================

CREATE TABLE IF NOT EXISTS daily_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  total_active_users INTEGER DEFAULT 0,
  new_signups INTEGER DEFAULT 0,
  lessons_completed INTEGER DEFAULT 0,
  tool_sessions INTEGER DEFAULT 0,
  forum_posts INTEGER DEFAULT 0,
  total_revenue DECIMAL(10, 2) DEFAULT 0.00,
  avg_session_duration_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- SECTION 5: RLS POLICIES
-- =============================================

-- Enable RLS on new/critical tables
ALTER TABLE user_learning_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_analytics ENABLE ROW LEVEL SECURITY;

-- User-specific policies
CREATE POLICY "Users can manage own learning progress" ON user_learning_progress FOR ALL USING (auth.uid() = user_id);

-- Admin Analytics
CREATE POLICY "Admin read analytics" ON daily_analytics FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- =============================================
-- SECTION 6: FUNCTIONS & TRIGGERS
-- =============================================

-- Auto-update thread activity logic
CREATE OR REPLACE FUNCTION update_thread_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'community_posts' THEN
    UPDATE community_threads
    SET reply_count = (SELECT COUNT(*) FROM community_posts WHERE thread_id = NEW.thread_id),
        last_activity_at = now()
    WHERE id = NEW.thread_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_post_created ON community_posts;
CREATE TRIGGER on_post_created
  AFTER INSERT ON community_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_thread_stats();
