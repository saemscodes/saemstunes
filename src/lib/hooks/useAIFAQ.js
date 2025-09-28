import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

// Configuration
const CONFIG = {
  API_BASE_URL: process.env.REACT_APP_AI_API_URL || 'https://saems-ai-api.railway.app',
  HF_SPACE_URL: process.env.REACT_APP_HF_SPACE_URL || 'https://huggingface.co/spaces/saemstunes/STA-AI',
  DEFAULT_MODEL: 'fast',
  MAX_RETRIES: 3,
  TIMEOUT: 30000,
  DEBOUNCE_DELAY: 500
};

// Custom hook for AI FAQ functionality
export const useAIFAQ = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [performance, setPerformance] = useState({});
  const retryCount = useRef(0);
  const abortController = useRef(new AbortController());

  // Generate unique conversation ID
  const generateConversationId = useCallback(() => {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Get music context from Supabase
  const getMusicContext = useCallback(async (question) => {
    try {
      const contextParts = [];
      
      // Analyze question for context requirements
      const questionLower = question.toLowerCase();
      
      // Song-related queries
      if (questionLower.includes('song') || questionLower.includes('music') || questionLower.includes('track')) {
        const { data: songs } = await supabase
          .from('songs')
          .select('title, artist, genre, plays')
          .order('plays', { ascending: false })
          .limit(3);
        
        if (songs && songs.length > 0) {
          contextParts.push(`Popular songs: ${songs.map(s => `${s.title} by ${s.artist}`).join(', ')}`);
        }
      }
      
      // Artist-related queries
      if (questionLower.includes('artist') || questionLower.includes('band') || questionLower.includes('musician')) {
        const { data: artists } = await supabase
          .from('artists')
          .select('name, genre, followers')
          .order('followers', { ascending: false })
          .limit(3);
          
        if (artists && artists.length > 0) {
          contextParts.push(`Featured artists: ${artists.map(a => a.name).join(', ')}`);
        }
      }
      
      // Platform statistics
      if (questionLower.includes('how many') || questionLower.includes('total') || questionLower.includes('stat')) {
        const [songsCount, artistsCount, usersCount] = await Promise.all([
          supabase.from('songs').select('*', { count: 'exact', head: true }),
          supabase.from('artists').select('*', { count: 'exact', head: true }),
          supabase.from('users').select('*', { count: 'exact', head: true })
        ]);
        
        contextParts.push(`Platform stats: ${songsCount.count} songs, ${artistsCount.count} artists, ${usersCount.count} users`);
      }
      
      return contextParts.join(' | ') || 'Saem\'s Tunes music streaming platform';
      
    } catch (err) {
      console.error('Context fetch error:', err);
      return 'Music platform context unavailable';
    }
  }, []);

  // Main AI query function
  const askAI = useCallback(async (question, options = {}) => {
    if (!question.trim()) {
      throw new Error('Question cannot be empty');
    }

    setIsLoading(true);
    setError(null);
    abortController.current = new AbortController();

    try {
      const startTime = performance.now();
      
      // Get context for better responses
      const context = await getMusicContext(question);
      
      // Prepare request payload
      const payload = {
        message: question,
        conversation_id: conversationId || generateConversationId(),
        model_profile: options.modelProfile || CONFIG.DEFAULT_MODEL,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 300,
        context: context
      };

      // Try Railway API first, fallback to Hugging Face Spaces
      let response;
      try {
        response = await fetch(`${CONFIG.API_BASE_URL}/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: abortController.current.signal
        });
      } catch (apiError) {
        console.warn('Railway API failed, trying Hugging Face Spaces:', apiError);
        response = await fetch(`${CONFIG.HF_SPACE_URL}/api/predict`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            data: [question, []]
          }),
          signal: abortController.current.signal
        });
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
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
        averageResponseTime: ((prev.averageResponseTime || 0) * (prev.totalRequests || 0) + processingTime) / ((prev.totalRequests || 0) + 1)
      }));

      retryCount.current = 0; // Reset retry count on success
      
      return {
        response: result.response || result.data?.[0] || 'No response generated',
        processingTime: result.processing_time || processingTime,
        modelUsed: result.model_used || 'default',
        conversationId: payload.conversation_id
      };
      
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new Error('Request cancelled');
      }

      retryCount.current += 1;
      
      if (retryCount.current <= CONFIG.MAX_RETRIES) {
        console.warn(`Retrying request (${retryCount.current}/${CONFIG.MAX_RETRIES})`);
        return askAI(question, options);
      }

      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, generateConversationId, getMusicContext]);

  // Cancel ongoing request
  const cancelRequest = useCallback(() => {
    abortController.current.abort();
    setIsLoading(false);
  }, []);

  // Submit feedback for response quality
  const submitFeedback = useCallback(async (conversationId, helpful, comments = '') => {
    try {
      await fetch(`${CONFIG.API_BASE_URL}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversation_id: conversationId,
          helpful: helpful,
          comments: comments
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
  }, []);

  // Get available models
  const getAvailableModels = useCallback(async () => {
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/models`);
      const data = await response.json();
      return data.models || [];
    } catch (err) {
      console.error('Error fetching models:', err);
      return [];
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
    getPerformanceStats
  };
};

// Debounced hook version
export const useDebouncedAIFAQ = (delay = CONFIG.DEBOUNCE_DELAY) => {
  const [debouncedQuestion, setDebouncedQuestion] = useState('');
  const timeoutRef = useRef();
  const aiFAQ = useAIFAQ();

  const askDebouncedAI = useCallback((question, options) => {
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
