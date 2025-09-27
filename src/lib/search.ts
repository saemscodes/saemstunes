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

export interface SearchFilters {
  source_tables?: string[];
  content_types?: string[];
  min_rank?: number;
}

export interface SearchSuggestion {
  text: string;
  type: 'recent' | 'suggestion' | 'popular';
  score?: number;
}

const searchCache = new Map<string, { results: SearchResult[]; timestamp: number }>();
const CACHE_DURATION = 10 * 60 * 1000;
const POPULAR_SEARCH_TERMS = ["guitar lessons", "piano basics", "music theory", "songwriting", "vocal warmups"];

export const searchAll = async (
  query: string, 
  limit = 20, 
  offset = 0, 
  filters: SearchFilters = {}
): Promise<SearchResult[]> => {
  if (!query || query.trim().length < 2) {
    return await getPopularContent(limit, offset, filters);
  }

  const cleanQuery = query.trim().toLowerCase();
  const cacheKey = `${cleanQuery}-${limit}-${offset}-${JSON.stringify(filters)}`;
  
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.results;
  }

  try {
    const { data, error } = await supabase.rpc('search_all', {
      _q: cleanQuery,
      _limit: limit,
      _offset: offset
    });

    if (error) {
      console.error('Search RPC error:', error);
      return await fallbackFullTextSearch(cleanQuery, limit, offset, filters);
    }

    const results = (data || []).map((item: any) => ({
      ...item,
      type: getContentType(item.source_table),
      image: extractImage(item.metadata),
      description: extractDescription(item.metadata),
      rank: Number(item.rank) || 0
    })).filter((item: SearchResult) => 
      !filters.source_tables || filters.source_tables.includes(item.source_table)
    );

    searchCache.set(cacheKey, { results, timestamp: Date.now() });
    return results;

  } catch (error) {
    console.error('Search failed:', error);
    return await fallbackFullTextSearch(cleanQuery, limit, offset, filters);
  }
};

export const advancedSearch = async (
  query: string,
  options: {
    search_fields?: ('title' | 'body')[];
    boost_title?: boolean;
    filters?: SearchFilters;
  } = {}
): Promise<SearchResult[]> => {
  try {
    let queryBuilder = supabase
      .from('search_index')
      .select('*')
      .textSearch('tsv', query, {
        type: 'websearch',
        config: 'simple'
      });

    if (options.filters?.source_tables) {
      queryBuilder = queryBuilder.in('source_table', options.filters.source_tables);
    }

    const { data, error } = await queryBuilder
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    return (data || []).map((item: any) => ({
      source_table: item.source_table,
      source_id: item.source_id,
      title: item.title,
      snippet: item.body?.substring(0, 200) + '...' || '',
      rank: calculateRelevanceScore(item, query, options.boost_title || false),
      metadata: item.metadata,
      type: getContentType(item.source_table),
      image: extractImage(item.metadata),
      description: extractDescription(item.metadata)
    })).sort((a, b) => b.rank - a.rank);

  } catch (error) {
    console.error('Advanced search failed:', error);
    return [];
  }
};

export const getSearchSuggestions = async (query: string, limit = 5): Promise<SearchSuggestion[]> => {
  if (!query || query.trim().length < 1) {
    return getDefaultSuggestions(limit);
  }

  const cleanQuery = query.trim().toLowerCase();
  const suggestions: SearchSuggestion[] = [];

  try {
    const { data, error } = await supabase
      .from('search_index')
      .select('title')
      .textSearch('title', cleanQuery, {
        type: 'plain',
        config: 'simple'
      })
      .limit(limit);

    if (!error && data) {
      suggestions.push(...data.map((item: any) => ({
        text: item.title,
        type: 'suggestion' as const,
        score: 0.9
      })));
    }

    const recent = getRecentSearches();
    const matchingRecent = recent
      .filter(term => term.toLowerCase().includes(cleanQuery))
      .map(term => ({ text: term, type: 'recent' as const, score: 0.8 }));

    const matchingPopular = POPULAR_SEARCH_TERMS
      .filter(term => term.toLowerCase().includes(cleanQuery))
      .map(term => ({ text: term, type: 'popular' as const, score: 0.7 }));

    suggestions.push(...matchingRecent, ...matchingPopular);

    return suggestions
      .filter((s, i, arr) => arr.findIndex(t => t.text === s.text) === i)
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, limit);

  } catch (error) {
    console.error('Suggestion error:', error);
    return getDefaultSuggestions(limit);
  }
};

export const searchByType = async (type: string, query: string, limit = 20): Promise<SearchResult[]> => {
  const sourceTables = getSourceTablesForType(type);
  return searchAll(query, limit, 0, { source_tables: sourceTables });
};

const getPopularContent = async (limit: number, offset: number, filters: SearchFilters): Promise<SearchResult[]> => {
  try {
    let queryBuilder = supabase
      .from('search_index')
      .select('*');

    if (filters.source_tables) {
      queryBuilder = queryBuilder.in('source_table', filters.source_tables);
    }

    const { data, error } = await queryBuilder
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((item: any) => ({
      source_table: item.source_table,
      source_id: item.source_id,
      title: item.title,
      snippet: item.body?.substring(0, 200) + '...' || '',
      rank: 0.1,
      metadata: item.metadata,
      type: getContentType(item.source_table),
      image: extractImage(item.metadata),
      description: extractDescription(item.metadata)
    }));
  } catch (error) {
    console.error('Popular content fetch failed:', error);
    return [];
  }
};

const fallbackFullTextSearch = async (
  query: string, 
  limit: number, 
  offset: number, 
  filters: SearchFilters
): Promise<SearchResult[]> => {
  try {
    let queryBuilder = supabase
      .from('search_index')
      .select('*')
      .or(`title.ilike.%${query}%,body.ilike.%${query}%`);

    if (filters.source_tables) {
      queryBuilder = queryBuilder.in('source_table', filters.source_tables);
    }

    const { data, error } = await queryBuilder
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((item: any) => ({
      source_table: item.source_table,
      source_id: item.source_id,
      title: item.title,
      snippet: highlightMatch(item.body, query)?.substring(0, 200) + '...' || '',
      rank: calculateBasicRelevance(item, query),
      metadata: item.metadata,
      type: getContentType(item.source_table),
      image: extractImage(item.metadata),
      description: extractDescription(item.metadata)
    })).sort((a, b) => b.rank - a.rank);

  } catch (error) {
    console.error('Fallback search failed:', error);
    return [];
  }
};

const calculateRelevanceScore = (item: any, query: string, boostTitle: boolean): number => {
  const title = item.title?.toLowerCase() || '';
  const body = item.body?.toLowerCase() || '';
  const queryTerms = query.toLowerCase().split(' ').filter(term => term.length > 2);
  
  if (queryTerms.length === 0) return 0.1;

  let score = 0;
  queryTerms.forEach(term => {
    if (title.includes(term)) score += boostTitle ? 3 : 2;
    if (body.includes(term)) score += 1;
  });

  const maxScore = queryTerms.length * (boostTitle ? 3 : 2);
  return maxScore > 0 ? Math.min(score / maxScore, 1) : 0.1;
};

const calculateBasicRelevance = (item: any, query: string): number => {
  const title = item.title?.toLowerCase() || '';
  const body = item.body?.toLowerCase() || '';
  const queryLower = query.toLowerCase();
  
  let score = 0;
  if (title.includes(queryLower)) score += 2;
  if (body.includes(queryLower)) score += 1;
  
  return score / 3;
};

const highlightMatch = (text: string, query: string): string => {
  if (!text) return '';
  const index = text.toLowerCase().indexOf(query.toLowerCase());
  if (index === -1) return text.substring(0, 200);
  
  const start = Math.max(0, index - 50);
  const end = Math.min(text.length, index + query.length + 100);
  return text.substring(start, end);
};

const getContentType = (sourceTable: string): string => {
  const typeMap: Record<string, string> = {
    'artists': 'artist',
    'tracks': 'music',
    'video_content': 'video',
    'resources': 'resource',
    'courses': 'course',
    'tutors': 'tutor'
  };
  return typeMap[sourceTable] || 'content';
};

const extractImage = (metadata: any): string | undefined => {
  if (!metadata) return undefined;
  return metadata.thumbnail_url || metadata.cover_path || metadata.profile_image || metadata.image;
};

const extractDescription = (metadata: any): string | undefined => {
  if (metadata?.description) return metadata.description;
  return undefined;
};

const getSourceTablesForType = (type: string): string[] => {
  const typeMap: Record<string, string[]> = {
    'artists': ['artists'],
    'music': ['tracks'],
    'videos': ['video_content'],
    'resources': ['resources'],
    'courses': ['courses'],
    'tutors': ['tutors'],
    'all': ['artists', 'tracks', 'video_content', 'resources', 'courses', 'tutors']
  };
  return typeMap[type] || ['artists', 'tracks', 'video_content', 'resources', 'courses', 'tutors'];
};

const getDefaultSuggestions = (limit: number): SearchSuggestion[] => {
  return POPULAR_SEARCH_TERMS.slice(0, limit).map(term => ({
    text: term,
    type: 'popular' as const,
    score: 0.5
  }));
};

export const getRecentSearches = (): string[] => {
  try {
    const stored = localStorage.getItem('saemstunes-recent-searches');
    return stored ? JSON.parse(stored).slice(0, 5) : [];
  } catch {
    return [];
  }
};

export const saveRecentSearch = (query: string): void => {
  try {
    const recent = getRecentSearches();
    const updated = [query, ...recent.filter(item => item.toLowerCase() !== query.toLowerCase())].slice(0, 8);
    localStorage.setItem('saemstunes-recent-searches', JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving recent search:', error);
  }
};

export const clearSearchCache = (): void => {
  searchCache.clear();
};

setInterval(clearSearchCache, 30 * 60 * 1000);
