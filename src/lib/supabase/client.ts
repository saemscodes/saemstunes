import { createClient } from '@supabase/supabase-js'
import { Database } from '@/integrations/supabase/types'

const supabaseUrl = 'https://uxyvhqtwkutstihtxdsv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4eXZocXR3a3V0c3RpaHR4ZHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0MzY0ODksImV4cCI6MjA2MTAxMjQ4OX0.oR-Jl_hJIVgehVr5J9oEB8WqxZCXREXY07cwFoW5COE'

// Enhanced Supabase client with connection stability features
class StableSupabaseClient {
  private client: any
  private retryCount: number = 0
  private maxRetries: number = 3
  private baseDelay: number = 1000

  constructor() {
    this.client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      },
      global: {
        headers: { 'x-application-name': 'saems-tunes-ai' },
        fetch: this.createFetchWithRetry()
      },
      db: {
        schema: 'public'
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    })

    this.setupConnectionMonitoring()
  }

  private createFetchWithRetry() {
    return async (url: RequestInfo, options?: RequestInit) => {
      let lastError: Error

      for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
        try {
          const response = await fetch(url, {
            ...options,
            signal: AbortSignal.timeout(30000) // 30 second timeout
          })

          if (response.ok) {
            return response
          }

          // Exponential backoff
          if (attempt < this.maxRetries) {
            const delay = this.baseDelay * Math.pow(2, attempt)
            await new Promise(resolve => setTimeout(resolve, delay))
          }
        } catch (error) {
          lastError = error as Error
          if (attempt === this.maxRetries) break
          
          const delay = this.baseDelay * Math.pow(2, attempt)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }

      throw lastError || new Error('Max retries exceeded')
    }
  }

  private setupConnectionMonitoring() {
    // Monitor connection health
    setInterval(async () => {
      try {
        const { error } = await this.client.from('tracks').select('id').limit(1)
        if (error) {
          console.warn('Supabase connection check failed:', error)
        }
      } catch (error) {
        console.error('Connection monitoring error:', error)
      }
    }, 60000) // Check every minute
  }

  getClient() {
    return this.client
  }

  // Enhanced query with automatic retry
  async queryWithRetry(table: string, query: any, maxRetries: number = 3) {
    let lastError: Error

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const { data, error } = await query

        if (error) throw error
        return { data, error: null }
      } catch (error) {
        lastError = error as Error
        
        if (attempt < maxRetries) {
          const delay = this.baseDelay * Math.pow(2, attempt)
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        }
      }
    }

    return { data: null, error: lastError }
  }
}

// Create singleton instance
export const supabaseClient = new StableSupabaseClient()
export const supabase = supabaseClient.getClient()
