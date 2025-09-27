import { supabase } from '@/integrations/supabase/client';

export interface SearchResult {
  source_table: string;
  source_id: string;
  title: string;
  snippet: string;
  rank: number;
  metadata: any;
}

export const searchAll = async (query: string, limit = 20, offset = 0): Promise<SearchResult[]> => {
  const { data, error } = await supabase
    .rpc('search_all', { _q: query, _limit: limit, _offset: offset });
  
  if (error) {
    console.error('Search error:', error);
    throw error;
  }
  
  return data || [];
};

export const getSearchSuggestions = async (query: string, limit = 5): Promise<string[]> => {
  // Simple implementation - you might want to enhance this with proper autocomplete
  if (!query || query.length < 2) return [];
  
  try {
    const results = await searchAll(query, limit);
    return [...new Set(results.map(r => r.title))].slice(0, limit);
  } catch (error) {
    console.error('Suggestion error:', error);
    return [];
  }
};
