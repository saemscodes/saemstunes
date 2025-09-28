import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase, supabaseClient } from '@/lib/supabase/client'

interface AIResponse {
  response: string
  processingTime: number
  modelUsed: string
  conversationId: string
  source: string
}

interface PerformanceMetrics {
  averageResponseTime: number
  totalRequests: number
  lastResponseTime: number
  lastModelUsed: string
  usedHuggingFace: boolean
  cacheHitRate: number
}

interface AIOptions {
  modelProfile?: string
  temperature?: number
  maxTokens?: number
  userId?: string
  conversationId?: string
}

// Enhanced configuration with connection stability
const CONFIG = {
  // Primary endpoint - Hugging Face Spaces
  HF_SPACE_URL: import.meta.env.VITE_HF_SPACE_URL || 'https://saemstunes-sta-ai.hf.space',
  
  // Fallback endpoint - Railway
  API_BASE_URL: import.meta.env.VITE_AI_API_URL || 'https://saems-ai-api.railway.app',
  
  // Local fallback
  LOCAL_API_URL: import.meta.env.VITE_LOCAL_API_URL || 'http://localhost:8000',
  
  // Default model configuration
  DEFAULT_MODEL: 'microsoft/Phi-3.5-mini-instruct',
  
  // Stability configuration
  MAX_RETRIES: 3,
  TIMEOUT: 45000,
  DEBOUNCE_DELAY: 500,
  CONNECTION_TIMEOUT: 10000
}

// Connection health monitor
class ConnectionHealthMonitor {
  private endpoints: Map<string, boolean> = new Map()
  private checkInterval: NodeJS.Timeout | null = null

  constructor() {
    this.endpoints.set(CONFIG.HF_SPACE_URL, true)
    this.endpoints.set(CONFIG.API_BASE_URL, true)
    this.endpoints.set(CONFIG.LOCAL_API_URL, true)
  }

  async checkEndpointHealth(url: string): Promise<boolean> {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000)

      const response = await fetch(`${url}/api/health`, {
        signal: controller.signal,
        method: 'GET'
      })

      clearTimeout(timeout)
      return response.ok
    } catch {
      return false
    }
  }

  async getBestEndpoint(): Promise<string> {
    const endpoints = [
      CONFIG.HF_SPACE_URL,
      CONFIG.API_BASE_URL, 
      CONFIG.LOCAL_API_URL
    ]

    for (const endpoint of endpoints) {
      const isHealthy = await this.checkEndpointHealth(endpoint)
      if (isHealthy) {
        this.endpoints.set(endpoint, true)
        return endpoint
      } else {
        this.endpoints.set(endpoint, false)
      }
    }

    throw new Error('All AI endpoints are unavailable')
  }

  startMonitoring() {
    this.checkInterval = setInterval(async () => {
      for (const endpoint of this.endpoints.keys()) {
        const isHealthy = await this.checkEndpointHealth(endpoint)
        this.endpoints.set(endpoint, isHealthy)
      }
    }, 60000) // Check every minute
  }

  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
    }
  }
}

// Create global health monitor
const healthMonitor = new ConnectionHealthMonitor()

export const useAIFAQ = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [performance, setPerformance] = useState<PerformanceMetrics>({
    averageResponseTime: 0,
    totalRequests: 0,
    lastResponseTime: 0,
    lastModelUsed: CONFIG.DEFAULT_MODEL,
    usedHuggingFace: true,
    cacheHitRate: 0
  })

  const retryCount = useRef(0)
  const abortController = useRef(new AbortController())
  const cache = useRef(new Map<string, { response: AIResponse; timestamp: number }>())

  // Initialize health monitoring
  useEffect(() => {
    healthMonitor.startMonitoring()
    return () => healthMonitor.stopMonitoring()
  }, [])

  // Generate unique conversation ID
  const generateConversationId = useCallback(() => {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }, [])

  // Enhanced Supabase query with retry and error handling
  const querySupabase = useCallback(async (queryFn: () => Promise<any>, description: string) => {
    const maxRetries = 3
    let lastError: Error

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await queryFn()
        
        if (result.error) {
          throw new Error(result.error.message)
        }

        return result
      } catch (err) {
        lastError = err as Error
        console.warn(`Supabase query attempt ${attempt + 1} failed for ${description}:`, err)

        if (attempt < maxRetries) {
          const delay = 1000 * Math.pow(2, attempt)
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        }
      }
    }

    throw lastError || new Error(`Failed to execute ${description} after ${maxRetries} attempts`)
  }, [])

  // Get comprehensive music context from Supabase with enhanced error handling
  const getMusicContext = useCallback(async (question: string, userId?: string) => {
    const cacheKey = `context_${question}_${userId}`
    const cached = cache.current.get(cacheKey)
    
    // Cache valid for 5 minutes
    if (cached && Date.now() - cached.timestamp < 300000) {
      return cached.response.response
    }

    try {
      const contextParts = []
      const questionLower = question.toLowerCase()

      // Platform statistics with enhanced error handling
      try {
        const [tracksCount, artistsCount, profilesCount, coursesCount] = await Promise.all([
          querySupabase(() => supabase.from('tracks').select('*', { count: 'exact', head: true }), 'tracks count'),
          querySupabase(() => supabase.from('artists').select('*', { count: 'exact', head: true }), 'artists count'),
          querySupabase(() => supabase.from('profiles').select('*', { count: 'exact', head: true }), 'profiles count'),
          querySupabase(() => supabase.from('courses').select('*', { count: 'exact', head: true }), 'courses count')
        ])

        contextParts.push(
          `Platform: ${tracksCount.count} tracks, ${artistsCount.count} artists, ${profilesCount.count} users, ${coursesCount.count} courses`
        )
      } catch (statsError) {
        console.warn('Failed to fetch platform stats, using fallback:', statsError)
        contextParts.push('Platform: Comprehensive music education and streaming platform')
      }

      // Track-related queries
      if (questionLower.includes('song') || questionLower.includes('music') || questionLower.includes('track') || questionLower.includes('listen')) {
        try {
          const { data: tracks } = await querySupabase(
            () => supabase
              .from('tracks')
              .select('title, artist, genre, play_count, duration')
              .order('play_count', { ascending: false })
              .limit(5),
            'popular tracks'
          )

          if (tracks && tracks.length > 0) {
            const popularTracks = tracks.map(t => `${t.title} by ${t.artist} (${t.play_count} plays)`).join(', ')
            contextParts.push(`Popular tracks: ${popularTracks}`)
          }
        } catch (trackError) {
          console.warn('Failed to fetch tracks:', trackError)
        }
      }

      // Artist-related queries
      if (questionLower.includes('artist') || questionLower.includes('band') || questionLower.includes('musician') || questionLower.includes('creator')) {
        try {
          const { data: artists } = await querySupabase(
            () => supabase
              .from('artists')
              .select('name, genre, follower_count, is_verified')
              .order('follower_count', { ascending: false })
              .limit(5),
            'popular artists'
          )

          if (artists && artists.length > 0) {
            const topArtists = artists.map(a => `${a.name}${a.is_verified ? ' (verified)' : ''} - ${a.follower_count} followers`).join(', ')
            contextParts.push(`Featured artists: ${topArtists}`)
          }
        } catch (artistError) {
          console.warn('Failed to fetch artists:', artistError)
        }
      }

      // Course-related queries
      if (questionLower.includes('course') || questionLower.includes('learn') || questionLower.includes('education') || questionLower.includes('lesson')) {
        try {
          const { data: courses } = await querySupabase(
            () => supabase
              .from('courses')
              .select('title, instructor, level, student_count, rating')
              .order('student_count', { ascending: false })
              .limit(3),
            'recent courses'
          )

          if (courses && courses.length > 0) {
            const popularCourses = courses.map(c => `${c.title} by ${c.instructor} (${c.student_count} students)`).join(', ')
            contextParts.push(`Popular courses: ${popularCourses}`)
          }
        } catch (courseError) {
          console.warn('Failed to fetch courses:', courseError)
        }
      }

      // Playlist-related queries
      if (questionLower.includes('playlist') || questionLower.includes('collection') || questionLower.includes('library')) {
        try {
          const { data: playlists } = await querySupabase(
            () => supabase
              .from('playlists')
              .select('title, description, track_count, is_public')
              .order('created_at', { ascending: false })
              .limit(3),
            'featured playlists'
          )

          if (playlists && playlists.length > 0) {
            const recentPlaylists = playlists.map(p => `${p.title} (${p.track_count} tracks)`).join(', ')
            contextParts.push(`Recent playlists: ${recentPlaylists}`)
          }
        } catch (playlistError) {
          console.warn('Failed to fetch playlists:', playlistError)
        }
      }

      // User-specific context
      if (userId && userId !== 'anonymous') {
        try {
          const { data: userPreferences } = await querySupabase(
            () => supabase
              .from('user_preferences')
              .select('favorite_genres')
              .eq('user_id', userId)
              .single(),
            'user preferences'
          )

          if (userPreferences?.favorite_genres) {
            contextParts.push(`User prefers: ${userPreferences.favorite_genres.slice(0, 3).join(', ')} music`)
          }

          const { data: userProfile } = await querySupabase(
            () => supabase
              .from('profiles')
              .select('subscription_tier')
              .eq('id', userId)
              .single(),
            'user profile'
          )

          if (userProfile?.subscription_tier === 'premium') {
            contextParts.push('User has premium subscription')
          }
        } catch (userError) {
          console.warn('Failed to fetch user context:', userError)
        }
      }

      const finalContext = contextParts.join(' | ') || 'Saem\'s Tunes music education and streaming platform with extensive catalog and community features'
      
      // Cache the context
      cache.current.set(cacheKey, {
        response: { response: finalContext } as AIResponse,
        timestamp: Date.now()
      })

      return finalContext

    } catch (error) {
      console.error('Context generation failed:', error)
      return 'Saem\'s Tunes music education and streaming platform with extensive catalog and community features'
    }
  }, [querySupabase])

  // Enhanced AI request with multiple fallbacks
  const askAI = useCallback(async (question: string, options: AIOptions = {}): Promise<AIResponse> => {
    if (!question.trim()) {
      throw new Error('Question cannot be empty')
    }

    setIsLoading(true)
    setError(null)
    abortController.current = new AbortController()

    // Check cache first
    const cacheKey = `ai_${question}_${options.userId}`
    const cached = cache.current.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < 300000) { // 5 minute cache
      setIsLoading(false)
      setPerformance(prev => ({
        ...prev,
        cacheHitRate: ((prev.cacheHitRate * prev.totalRequests) + 1) / (prev.totalRequests + 1)
      }))
      return cached.response
    }

    try {
      const startTime = performance.now()
      
      // Get comprehensive context
      const context = await getMusicContext(question, options.userId)
      
      // Prepare request payload
      const payload = {
        message: question,
        user_id: options.userId || 'anonymous',
        conversation_id: options.conversationId || conversationId || generateConversationId(),
        context: context,
        model_profile: options.modelProfile || CONFIG.DEFAULT_MODEL,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 300
      }

      let response
      let usedEndpoint = ''

      // Try endpoints in order of preference
      const endpoints = await healthMonitor.getBestEndpoint()
      
      for (const endpoint of [CONFIG.HF_SPACE_URL, CONFIG.API_BASE_URL, CONFIG.LOCAL_API_URL]) {
        try {
          console.log(`🔄 Trying endpoint: ${endpoint}`)
          usedEndpoint = endpoint

          response = await fetch(`${endpoint}/api/chat`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
            signal: abortController.current.signal
          })

          if (response.ok) {
            break
          } else {
            throw new Error(`Endpoint ${endpoint} returned ${response.status}`)
          }
        } catch (endpointError) {
          console.warn(`Endpoint ${endpoint} failed:`, endpointError)
          if (endpoint === CONFIG.LOCAL_API_URL) {
            throw new Error('All AI endpoints are unavailable')
          }
          continue
        }
      }

      if (!response || !response.ok) {
        throw new Error('No available AI endpoints')
      }

      const result = await response.json()
      const processingTime = performance.now() - startTime

      // Update conversation ID if this is a new conversation
      if (!conversationId) {
        setConversationId(payload.conversation_id)
      }

      const aiResponse: AIResponse = {
        response: result.response || 'I apologize, but I could not generate a response. Please try again.',
        processingTime: result.processing_time || processingTime,
        modelUsed: result.model_used || payload.model_profile,
        conversationId: payload.conversation_id,
        source: usedEndpoint.includes('huggingface') ? 'huggingface' : 'railway'
      }

      // Update performance metrics
      setPerformance(prev => {
        const totalRequests = prev.totalRequests + 1
        const cacheHitRate = prev.cacheHitRate
        const averageResponseTime = ((prev.averageResponseTime * prev.totalRequests) + processingTime) / totalRequests
        
        return {
          averageResponseTime,
          totalRequests,
          lastResponseTime: processingTime,
          lastModelUsed: payload.model_profile,
          usedHuggingFace: usedEndpoint.includes('huggingface'),
          cacheHitRate
        }
      })

      // Cache successful response
      cache.current.set(cacheKey, {
        response: aiResponse,
        timestamp: Date.now()
      })

      // Log interaction to Supabase
      try {
        await querySupabase(
          () => supabase
            .from('ai_interactions')
            .insert({
              user_id: options.userId || 'anonymous',
              conversation_id: payload.conversation_id,
              query: question,
              response: aiResponse.response,
              processing_time: processingTime,
              model_used: aiResponse.modelUsed,
              context_used: { context: context, source: usedEndpoint }
            }),
          'ai interaction log'
        )
      } catch (logError) {
        console.warn('Failed to log AI interaction:', logError)
      }

      retryCount.current = 0
      return aiResponse

    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error('Request cancelled')
      }

      retryCount.current += 1
      
      if (retryCount.current <= CONFIG.MAX_RETRIES) {
        console.warn(`🔄 Retrying request (${retryCount.current}/${CONFIG.MAX_RETRIES})`)
        const delay = 1000 * Math.pow(2, retryCount.current - 1)
        await new Promise(resolve => setTimeout(resolve, delay))
        return askAI(question, options)
      }

      const errorMessage = err.message || 'Unknown error occurred'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [conversationId, generateConversationId, getMusicContext, querySupabase])

  // Cancel ongoing request
  const cancelRequest = useCallback(() => {
    abortController.current.abort()
    setIsLoading(false)
    setError('Request cancelled')
  }, [])

  // Submit feedback for response quality
  const submitFeedback = useCallback(async (convId: string, helpful: boolean, comments: string = '') => {
    try {
      await querySupabase(
        () => supabase
          .from('ai_interactions')
          .update({ feedback: helpful })
          .eq('conversation_id', convId),
        'feedback submission'
      )
    } catch (err) {
      console.error('Feedback submission error:', err)
    }
  }, [querySupabase])

  // Clear conversation and cache
  const clearConversation = useCallback(() => {
    setConversationId(null)
    setError(null)
    cache.current.clear()
    setPerformance(prev => ({
      ...prev,
      cacheHitRate: 0
    }))
  }, [])

  // Get available models
  const getAvailableModels = useCallback(async () => {
    try {
      const endpoint = await healthMonitor.getBestEndpoint()
      const response = await fetch(`${endpoint}/api/models`)
      const data = await response.json()
      return data.available_models || [CONFIG.DEFAULT_MODEL]
    } catch (err) {
      console.error('Error fetching models:', err)
      return [CONFIG.DEFAULT_MODEL]
    }
  }, [])

  // Performance monitoring
  const getPerformanceStats = useCallback(async () => {
    try {
      const endpoint = await healthMonitor.getBestEndpoint()
      const response = await fetch(`${endpoint}/api/stats`)
      const data = await response.json()
      setPerformance(prev => ({ ...prev, ...data }))
      return data
    } catch (err) {
      console.error('Error fetching performance stats:', err)
      return {}
    }
  }, [])

  // Get system health
  const getSystemHealth = useCallback(async () => {
    try {
      const endpoint = await healthMonitor.getBestEndpoint()
      const response = await fetch(`${endpoint}/api/health`)
      return await response.json()
    } catch (err) {
      console.error('Error fetching system health:', err)
      return { status: 'unhealthy', error: err }
    }
  }, [])

  return {
    askAI,
    isLoading,
    error,
    performance,
    conversationId,
    cancelRequest,
    submitFeedback,
    clearConversation,
    getAvailableModels,
    getPerformanceStats,
    getSystemHealth
  }
}

// Debounced hook version for better performance
export const useDebouncedAIFAQ = (delay: number = CONFIG.DEBOUNCE_DELAY) => {
  const [debouncedQuestion, setDebouncedQuestion] = useState('')
  const timeoutRef = useRef<NodeJS.Timeout>()
  const aiFAQ = useAIFAQ()

  const askDebouncedAI = useCallback((question: string, options?: AIOptions) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    return new Promise<AIResponse>((resolve, reject) => {
      timeoutRef.current = setTimeout(async () => {
        try {
          const result = await aiFAQ.askAI(question, options)
          resolve(result)
        } catch (error) {
          reject(error)
        }
      }, delay)
    })
  }, [aiFAQ, delay])

  return {
    ...aiFAQ,
    askAI: askDebouncedAI
  }
}
