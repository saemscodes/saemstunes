// Safe wrapper that preserves existing functionality while preventing duplicates
import { supabase as originalSupabase } from '@/integrations/supabase/client'

// Store on window only in browser
if (typeof window !== 'undefined') {
  if (!window.__saemstunes_supabase) {
    window.__saemstunes_supabase = originalSupabase
  }
}

// Export the window instance if in browser, otherwise original
export const supabase = 
  (typeof window !== 'undefined' && window.__saemstunes_supabase) 
    ? window.__saemstunes_supabase 
    : originalSupabase
