// This file is the CANONICAL Supabase client singleton.
// Prevents "Multiple GoTrueClient instances" warnings.

import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Singleton guard using globalThis to span across module reloads
const globalWithSupabase = globalThis as unknown as {
  __supabase_singleton?: ReturnType<typeof createClient<Database>>
}

// Create or reuse singleton instance
export const getSupabaseClient = () => {
  if (!globalWithSupabase.__supabase_singleton) {
    globalWithSupabase.__supabase_singleton = createClient<Database>(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY,
      {
        auth: {
          storage: typeof window !== 'undefined' ? window.localStorage : undefined,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true
        },
        global: {
          headers: { 'x-application-name': 'saemstunes-ultimate' }
        }
      }
    )
    if (typeof window !== 'undefined') {
      console.log('🔧 Created canonical singleton Supabase client')
    }
  }
  return globalWithSupabase.__supabase_singleton
}

export const supabase = getSupabaseClient()
