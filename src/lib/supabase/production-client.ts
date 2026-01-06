// Production-specific Supabase client
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/integrations/supabase/types'

// Use VITE_ prefixed variables for Vite, fallback to hardcoded
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 
                    "https://uxyvhqtwkutstihtxdsv.supabase.co"

const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY ||
                    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4eXZocXR3a3V0c3RpaHR4ZHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0MzY0ODksImV4cCI6MjA2MTAxMjQ4OX0.oR-Jl_hJIVgehVr5J9oEB8WqxZCXREXY07cwFoW5COE"

console.log('🔧 Production Supabase Client Initializing...', {
  urlExists: !!supabaseUrl,
  keyExists: !!supabaseKey,
  urlStart: supabaseUrl?.substring(0, 30) + '...'
})

// Singleton pattern for production
declare global {
  interface Window {
    __supabase_prod?: ReturnType<typeof createClient<Database>>
  }
}

export const supabase = (() => {
  if (typeof window !== 'undefined') {
    if (!window.__supabase_prod) {
      window.__supabase_prod = createClient<Database>(supabaseUrl, supabaseKey, {
        auth: {
          storage: localStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false
        }
      })
      console.log('✅ Production Supabase client created')
    }
    return window.__supabase_prod
  }
  
  // SSR fallback
  return createClient<Database>(supabaseUrl, supabaseKey)
})()
