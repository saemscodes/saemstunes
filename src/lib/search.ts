import { supabase } from '@/integrations/supabase/client';

export interface SearchResult {
  source_table: string;
  source_id: string;
  title: string;
  snippet: string;
  rank: number;
  metadata: any;
  type?: string;
  image?: string;
  description?: string;
}

export interface SearchSuggestion {
  text: string;
  type: 'recent' | 'suggestion' | 'popular';
  score?: number;
}

export interface SearchFilters {
  source_tables?: string[];
  content_types?: string[];
}

const searchCache = new Map<string, { results: SearchResult[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000;

const POPULAR_SEARCH_TERMS = [
  "guitar lessons", "piano basics", "vocal warmups", "music theory", 
  "songwriting", "gospel music", "afrobeat", "chord progressions",
  "fingerstyle guitar", "music production", "love", "worship",
  "african rhythms", "kenyan music", "gospel worship"
];

export const searchAll = async (
  query: string, 
  limit = 20, 
  offset = 0,
  filters: SearchFilters = {}
): Promise<SearchResult[]> => {
  if (!query || query.trim().length < 1) {
    return await getPopularContent(limit, offset, filters);
  }

  const cleanQuery = query.trim();
  const cacheKey = `${cleanQuery}-${limit}-${offset}-${JSON.stringify(filters)}`;
  
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.results;
  }

  try {
    const { data, error } = await supabase
      .rpc('search_all', { 
        _q: cleanQuery, 
        _limit: limit, 
        _offset: offset 
      });

    if (error) {
      console.error('Search RPC error:', error);
      throw error;
    }

    const results = (data || []).map((item: SearchResult) => ({
      ...item,
      type: getContentType(item.source_table),
      image: extractImage(item.metadata),
      description: extractDescription(item.metadata, item.snippet)
    }));

    searchCache.set(cacheKey, {
      results,
      timestamp: Date.now()
    });

    return results;
  } catch (error) {
    console.error('Search failed:', error);
    return await fallbackSearch(cleanQuery, limit, offset, filters);
  }
};

export const getSearchSuggestions = async (query: string, limit = 8): Promise<SearchSuggestion[]> => {
  if (!query || query.trim().length < 2) {
    return getDefaultSuggestions(limit);
  }

  const cleanQuery = query.trim().toLowerCase();
  const suggestions: SearchSuggestion[] = [];

  try {
    const results = await searchAll(cleanQuery, Math.floor(limit * 1.5), 0);
    
    const titleSuggestions = [...new Set(results.map(item => item.title))]
      .filter(title => title && title.toLowerCase().includes(cleanQuery))
      .slice(0, Math.floor(limit / 2))
      .map(text => ({
        text,
        type: 'suggestion' as const,
        score: 0.9
      }));

    suggestions.push(...titleSuggestions);

    const matchingPopular = POPULAR_SEARCH_TERMS
      .filter(term => term.toLowerCase().includes(cleanQuery))
      .slice(0, Math.floor(limit / 2))
      .map(term => ({
        text: term,
        type: 'popular' as const,
        score: 0.8
      }));

    suggestions.push(...matchingPopular);

    return suggestions
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, limit);

  } catch (error) {
    console.error('Suggestion error:', error);
    return getDefaultSuggestions(limit);
  }
};

export const getRecentSearches = (): string[] => {
  try {
    const stored = localStorage.getItem('saemstunes-recent-searches');
    if (stored) {
      return JSON.parse(stored).slice(0, 8);
    }
  } catch (error) {
    console.error('Error loading recent searches:', error);
  }
  return [];
};

export const saveRecentSearch = (query: string): void => {
  try {
    const recent = getRecentSearches();
    const updated = [query, ...recent.filter(item => 
      item.toLowerCase() !== query.toLowerCase()
    )].slice(0, 8);
    localStorage.setItem('saemstunes-recent-searches', JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving recent search:', error);
  }
};

export const clearSearchCache = (): void => {
  searchCache.clear();
};

const getContentType = (sourceTable: string): string => {
  const typeMap: Record<string, string> = {
    'video_content': 'video',
    'tracks': 'music',
    'resources': 'resource',
    'courses': 'course',
    'artists': 'artist',
    'tutors': 'tutor'
  };
  return typeMap[sourceTable] || sourceTable;
};

const extractImage = (metadata: any): string | undefined => {
  if (!metadata) return undefined;
  return metadata.thumbnail_url || metadata.cover_path || metadata.profile_image || 
         metadata.image || metadata.cover_image;
};

const extractDescription = (metadata: any, snippet: string): string | undefined => {
  if (metadata?.description) return metadata.description;
  if (snippet) {
    const cleanSnippet = snippet
      .replace(/<b>/g, '')
      .replace(/<\/b>/g, '')
      .substring(0, 150);
    return cleanSnippet.length > 140 ? cleanSnippet.substring(0, 140) + '...' : cleanSnippet;
  }
  return undefined;
};

const getPopularContent = async (
  limit: number,
  offset: number,
  filters: SearchFilters = {}
): Promise<SearchResult[]> => {
  try {
    let query = supabase
      .from('search_index')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (filters.source_tables && filters.source_tables.length > 0) {
      query = query.in('source_table', filters.source_tables);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).map((item: any) => ({
      source_table: item.source_table,
      source_id: item.source_id,
      title: item.title,
      snippet: item.body?.substring(0, 100) || '',
      rank: 0.5,
      metadata: item.metadata,
      type: getContentType(item.source_table),
      image: extractImage(item.metadata),
      description: item.body?.substring(0, 150) || ''
    }));
  } catch (error) {
    console.error('Popular content search failed:', error);
    return [];
  }
};

const fallbackSearch = async (
  query: string,
  limit: number,
  offset: number,
  filters: SearchFilters = {}
): Promise<SearchResult[]> => {
  try {
    let queryBuilder = supabase
      .from('search_index')
      .select('*')
      .or(`title.ilike.%${query}%,body.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (filters.source_tables && filters.source_tables.length > 0) {
      queryBuilder = queryBuilder.in('source_table', filters.source_tables);
    }

    const { data, error } = await queryBuilder;

    if (error) throw error;

    return (data || []).map((item: any) => ({
      source_table: item.source_table,
      source_id: item.source_id,
      title: item.title,
      snippet: highlightText(item.body, query) || item.body?.substring(0, 100) || '',
      rank: calculateRelevanceScore(item, query),
      metadata: item.metadata,
      type: getContentType(item.source_table),
      image: extractImage(item.metadata),
      description: item.body?.substring(0, 150) || ''
    }));
  } catch (error) {
    console.error('Fallback search failed:', error);
    return [];
  }
};

const highlightText = (text: string, query: string): string => {
  if (!text || !query) return text || '';
  const regex = new RegExp(`(${query.split(' ').filter(w => w.length > 2).join('|')})`, 'gi');
  return text.replace(regex, '<b>$1</b>').substring(0, 100) + '...';
};

const calculateRelevanceScore = (item: any, query: string): number => {
  const title = item.title?.toLowerCase() || '';
  const body = item.body?.toLowerCase() || '';
  const queryLower = query.toLowerCase();
  
  let score = 0;
  
  if (title.includes(queryLower)) score += 3;
  if (body.includes(queryLower)) score += 1;
  
  if (title === queryLower) score += 2;
  
  return Math.min(score / 5, 1);
};

const getDefaultSuggestions = (limit: number): SearchSuggestion[] => {
  return POPULAR_SEARCH_TERMS.slice(0, limit).map(term => ({
    text: term,
    type: 'popular' as const,
    score: 0.7
  }));
};

setInterval(clearSearchCache, 30 * 60 * 1000);
