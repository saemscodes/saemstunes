-- =============================================
-- SAEM'S TUNES - DB FIXES & ENHANCEMENTS
-- Version: 2.2.1 (Schema Correction)
-- Date: 2026-02-10
-- =============================================

-- 1. Fix community_threads -> profiles relationship
DO $$ 
BEGIN 
  -- Check if foreign key exists, if not add it
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'community_threads_user_id_fkey'
  ) THEN
    ALTER TABLE community_threads 
    ADD CONSTRAINT community_threads_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 2. Fix community_posts -> profiles relationship
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'community_posts_user_id_fkey'
  ) THEN
    ALTER TABLE community_posts 
    ADD CONSTRAINT community_posts_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 3. Add playback_history table (if not using localStorage entirely)
-- Storing history in DB allows syncing across devices
CREATE TABLE IF NOT EXISTS user_playback_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  track_id UUID REFERENCES public.tracks(id) ON DELETE CASCADE NOT NULL,
  played_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, track_id)
);

CREATE INDEX IF NOT EXISTS idx_playback_history_user ON user_playback_history(user_id);
ALTER TABLE user_playback_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own playback history" 
  ON user_playback_history FOR ALL 
  USING (auth.uid() = user_id);

-- 4. Ensure reaction_count and reply_count exist and are updated
-- These are usually managed by triggers, but ensuring columns exist
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='community_threads' AND column_name='reaction_count') THEN
    ALTER TABLE community_threads ADD COLUMN reaction_count INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='community_threads' AND column_name='reply_count') THEN
    ALTER TABLE community_threads ADD COLUMN reply_count INTEGER DEFAULT 0;
  END IF;
END $$;
