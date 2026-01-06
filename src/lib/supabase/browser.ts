import { supabase as generatedSupabase } from '@/integrations/supabase/client'

// Global singleton pattern to prevent multiple GoTrueClient instances
declare global {
  interface Window {
    __supabase_saemstunes?: typeof generatedSupabase
  }
}

// Singleton export - only creates one instance per browser tab
export const supabase = (() => {
  // In browser environment
  if (typeof window !== 'undefined') {
    if (!window.__supabase_saemstunes) {
      window.__supabase_saemstunes = generatedSupabase
      console.log('🔧 Supabase client initialized (singleton)')
    }
    return window.__supabase_saemstunes
  }
  
  // In server environment (for SSR/SSG)
  return generatedSupabase
})()
