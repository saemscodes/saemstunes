// Singleton Supabase client for browser
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/integrations/supabase/types'

// Use environment variables or fallback to hardcoded values
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 
                    import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
                    "https://uxyvhqtwkutstihtxdsv.supabase.co"

const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY ||
                    import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
                    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4eXZocXR3a3V0c3RpaHR4ZHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0MzY0ODksImV4cCI6MjA2MTAxMjQ4OX0.oR-Jl_hJIVgehVr5J9oEB8WqxZCXREXY07cwFoW5COE"

// Global singleton
let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null

export function getSupabaseClient() {
  if (!supabaseInstance) {
    supabaseInstance = createClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false
      }
    })
    
    // Also store on window for devtools/debugging
    if (typeof window !== 'undefined') {
      (window as any).__supabaseSingleton = supabaseInstance
    }
  }
  return supabaseInstance
}

// Default export for backward compatibility
export const supabase = getSupabaseClient()
