import { supabase as generatedSupabase } from '@/integrations/supabase/client'

declare global {
  interface Window {
    __supabase?: typeof generatedSupabase
  }
}

export const supabase =
  window.__supabase ?? (window.__supabase = generatedSupabase)
