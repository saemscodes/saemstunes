import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Configuration with Hugging Face as primary
const CONFIG = {
  HF_SPACE_URL: process.env.REACT_APP_HF_SPACE_URL || 'https://huggingface.co/spaces/saemstunes/STA-AI',
  API_BASE_URL: process.env.REACT_APP_AI_API_URL || 'https://saems-ai-api.railway.app',
  DEFAULT_MODEL: 'TinyLlama-1.1B-Chat',
  MAX_RETRIES: 3,
  TIMEOUT: 45000,
  DEBOUNCE_DELAY: 500
};

// Custom hook for AI FAQ functionality with Hugging Face primary
export const useAIFAQ = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [performance, setPerformance] = useState<Record<string, any>>({});
  const retryCount = useRef(0);
  const abortController = useRef(new AbortController());

  // Generate unique conversation ID
  const generateConversationId = useCallback(() => {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Get comprehensive music context from Supabase
  const getMusicContext = useCallback(async (question: string) => {
    try {
      const contextParts = [];
      const questionLower = question.toLowerCase();
      
      // Platform statistics
      const [songsCount, artistsCount, usersCount, coursesCount] = await Promise.all([
        supabase.from('songs').select('*', { count: 'exact', head: true }),
        supabase.from('artists').select('*', { count: 'exact', head: true }),
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('courses').select('*', { count: 'exact', head: true })
      ]);
      
      contextParts.push(`Platform: ${songsCount.count} songs, ${artistsCount.count} artists, ${usersCount.count} users, ${coursesCount.count} courses`);

      // Song-related queries
      if (questionLower.includes('song') || questionLower.includes('music') || questionLower.includes('track') || questionLower.includes('listen')) {
        const { data: songs } = await supabase
          .from('songs')
          .select('title, artist, genre, plays, duration')
          .order('plays', { ascending: false })
          .limit(5);
        
        if (songs && songs.length > 0) {
          const popularSongs = songs.map(s => `${s.title} by ${s.artist} (${s.plays} plays)`).join(', ');
          contextParts.push(`Popular songs: ${popularSongs}`);
        }
      }
      
      // Artist-related queries
      if (questionLower.includes('artist') || questionLower.includes('band') || questionLower.includes('musician') || questionLower.includes('creator')) {
        const { data: artists } = await supabase
          .from('artists')
          .select('name, genre, followers, is_verified')
          .order('followers', { ascending: false })
          .limit(5);
          
        if (artists && artists.length > 0) {
          const topArtists = artists.map(a => `${a.name}${a.is_verified ? ' (verified)' : ''} - ${a.followers} followers`).join(', ');
          contextParts.push(`Featured artists: ${topArtists}`);
        }
      }
      
      // Course-related queries
      if (questionLower.includes('course') || questionLower.includes('learn') || questionLower.includes('education') || questionLower.includes('lesson')) {
        const { data: courses } = await supabase
          .from('courses')
          .select('title, instructor, level, enrolled_students, rating')
          .order('enrolled_students', { ascending: false })
          .limit(3);
          
        if (courses && courses.length > 0) {
          const popularCourses = courses.map(c => `${c.title} by ${c.instructor} (${c.enrolled_students} students)`).join(', ');
          contextParts.push(`Popular courses: ${popularCourses}`);
        }
      }

      // Playlist-related queries
      if (questionLower.includes('playlist') || questionLower.includes('collection') || questionLower.includes('library')) {
        const { data: playlists } = await supabase
          .from('playlists')
          .select('name, description, track_count, is_public')
          .order('created_at', { ascending: false })
          .limit(3);
          
        if (playlists && playlists.length > 0) {
          const recentPlaylists = playlists.map(p => `${p.name} (${p.track_count} tracks)`).join(', ');
          contextParts.push(`Recent playlists: ${recentPlaylists}`);
        }
      }

      // Subscription-related queries
      if (questionLower.includes('premium') || questionLower.includes('subscribe') || questionLower.includes('payment') || questionLower.includes('plan')) {
        const { data: subscriptionPlans } = await supabase
          .from('subscription_plans')
          .select('name, price, features')
          .order('price', { ascending: true });
          
        if (subscriptionPlans && subscriptionPlans.length > 0) {
          const plans = subscriptionPlans.map(p => `${p.name} - $${p.price}/month`).join(', ');
          contextParts.push(`Available plans: ${plans}`);
        }
      }
      
      return contextParts.join(' | ') || 'Saem\'s Tunes music education and streaming platform';
      
    } catch (err) {
      console.error('Context fetch error:', err);
      return 'Music platform context unavailable';
    }
  }, []);

  // Main AI query function with Hugging Face primary
  const askAI = useCallback(async (question: string, options: any = {}) => {
    if (!question.trim()) {
      throw new Error('Question cannot be empty');
    }

    setIsLoading(true);
    setError(null);
    abortController.current = new AbortController();

    try {
      const startTime = performance.now();
      
      // Get comprehensive context for better responses
      const context = await getMusicContext(question);
      
      // Prepare request payload
      const payload = {
        message: question,
        conversation_id: conversationId || generateConversationId(),
        model_profile: options.modelProfile || CONFIG.DEFAULT_MODEL,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 300,
        context: context,
        user_id: options.userId || 'anonymous'
      };

      let response;
      let usedHuggingFace = true;

      // Try Hugging Face Spaces first (primary)
      try {
        console.log('🔄 Trying Hugging Face Spaces...');
        response = await fetch(`${CONFIG.HF_SPACE_URL}/api/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: abortController.current.signal
        });

        if (!response.ok) {
          throw new Error(`Hugging Face error: ${response.status}`);
        }

      } catch (hfError) {
        console.warn('❌ Hugging Face failed, trying Railway API:', hfError);
        usedHuggingFace = false;
        
        // Fallback to Railway API
        response = await fetch(`${CONFIG.API_BASE_URL}/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: abortController.current.signal
        });

        if (!response.ok) {
          throw new Error(`Railway API error: ${response.status}`);
        }
      }

      const result = await response.json();
      const processingTime = performance.now() - startTime;

      // Set conversation ID if this is a new conversation
      if (!conversationId) {
        setConversationId(payload.conversation_id);
      }

      // Update performance metrics
      setPerformance(prev => ({
        ...prev,
        lastResponseTime: processingTime,
        totalRequests: (prev.totalRequests || 0) + 1,
        averageResponseTime: ((prev.averageResponseTime || 0) * (prev.totalRequests || 0) + processingTime) / ((prev.totalRequests || 0) + 1),
        lastModelUsed: payload.model_profile,
        usedHuggingFace: usedHuggingFace
      }));

      retryCount.current = 0; // Reset retry count on success
      
      return {
        response: result.response || result.data?.[0] || result.answer || 'No response generated',
        processingTime: result.processing_time || processingTime,
        modelUsed: result.model_used || payload.model_profile,
        conversationId: payload.conversation_id,
        source: usedHuggingFace ? 'huggingface' : 'railway'
      };
      
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error('Request cancelled');
      }

      retryCount.current += 1;
      
      if (retryCount.current <= CONFIG.MAX_RETRIES) {
        console.warn(`🔄 Retrying request (${retryCount.current}/${CONFIG.MAX_RETRIES})`);
        return askAI(question, options);
      }

      const errorMessage = err.message || 'Unknown error occurred';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, generateConversationId, getMusicContext]);

  // Cancel ongoing request
  const cancelRequest = useCallback(() => {
    abortController.current.abort();
    setIsLoading(false);
    setError('Request cancelled');
  }, []);

  // Submit feedback for response quality
  const submitFeedback = useCallback(async (convId: string, helpful: boolean, comments: string = '') => {
    try {
      await fetch(`${CONFIG.API_BASE_URL}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversation_id: convId,
          helpful: helpful,
          comments: comments,
          timestamp: new Date().toISOString()
        })
      });
    } catch (err) {
      console.error('Feedback submission error:', err);
    }
  }, []);

  // Clear conversation
  const clearConversation = useCallback(() => {
    setConversationId(null);
    setError(null);
    setPerformance({});
  }, []);

  // Get available models
  const getAvailableModels = useCallback(async () => {
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/models`);
      const data = await response.json();
      return data.models || [
        { name: 'TinyLlama-1.1B-Chat', description: 'Fastest response, basic conversations' },
        { name: 'Phi-2', description: 'Good balance of speed and quality' },
        { name: 'Qwen-1.8B-Chat', description: 'Best for complex conversations' }
      ];
    } catch (err) {
      console.error('Error fetching models:', err);
      return [
        { name: 'TinyLlama-1.1B-Chat', description: 'Fastest response, basic conversations' },
        { name: 'Phi-2', description: 'Good balance of speed and quality' },
        { name: 'Qwen-1.8B-Chat', description: 'Best for complex conversations' }
      ];
    }
  }, []);

  // Performance monitoring
  const getPerformanceStats = useCallback(async () => {
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/performance`);
      const data = await response.json();
      setPerformance(prev => ({ ...prev, ...data }));
      return data;
    } catch (err) {
      console.error('Error fetching performance stats:', err);
      return {};
    }
  }, []);

  // Get system health
  const getSystemHealth = useCallback(async () => {
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/health`);
      return await response.json();
    } catch (err) {
      console.error('Error fetching system health:', err);
      return { status: 'unhealthy', error: err };
    }
  }, []);

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
  };
};

// Debounced hook version for better performance
export const useDebouncedAIFAQ = (delay: number = CONFIG.DEBOUNCE_DELAY) => {
  const [debouncedQuestion, setDebouncedQuestion] = useState('');
  const timeoutRef = useRef<NodeJS.Timeout>();
  const aiFAQ = useAIFAQ();

  const askDebouncedAI = useCallback((question: string, options?: any) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    return new Promise((resolve, reject) => {
      timeoutRef.current = setTimeout(async () => {
        try {
          const result = await aiFAQ.askAI(question, options);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, delay);
    });
  }, [aiFAQ, delay]);

  return {
    ...aiFAQ,
    askAI: askDebouncedAI
  };
};
