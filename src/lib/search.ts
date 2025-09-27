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
}

const POPULAR_SEARCH_TERMS = [
  "guitar lessons", "piano basics", "vocal warmups", "music theory", 
  "songwriting", "gospel music", "afrobeat", "chord progressions"
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
  
  try {
    const { data, error } = await supabase.rpc('search_all', { 
      _q: cleanQuery, 
      _limit: limit, 
      _offset: offset 
    });

    if (error) {
      console.error('Search RPC error:', error);
      throw error;
    }

    let results = (data || []).map((item: any) => ({
      source_table: item.source_table,
      source_id: item.source_id,
      title: item.title,
      snippet: item.snippet || '',
      rank: item.rank || 0.1,
      metadata: item.metadata,
      type: getContentType(item.source_table),
      image: extractImage(item.metadata),
      description: extractDescription(item.metadata, item.snippet)
    }));

    if (filters.source_tables && filters.source_tables.length > 0) {
      results = results.filter(result => 
        filters.source_tables!.includes(result.source_table)
      );
    }

    return results;
  } catch (error) {
    console.error('Search failed:', error);
    return await fallbackSearch(cleanQuery, limit, offset, filters);
  }
};

export const getSearchSuggestions = async (query: string, limit = 8): Promise<string[]> => {
  if (!query || query.trim().length < 1) {
    return POPULAR_SEARCH_TERMS.slice(0, limit);
  }

  const cleanQuery = query.trim().toLowerCase();
  
  try {
    const { data, error } = await supabase
      .from('search_index')
      .select('title')
      .ilike('title', `%${cleanQuery}%`)
      .limit(limit * 2);

    if (error) throw error;

    const uniqueTitles = [...new Set(data.map(item => item.title).filter(Boolean))].slice(0, limit);
    
    if (uniqueTitles.length > 0) {
      return uniqueTitles;
    }

    return POPULAR_SEARCH_TERMS
      .filter(term => term.toLowerCase().includes(cleanQuery))
      .slice(0, limit);

  } catch (error) {
    return POPULAR_SEARCH_TERMS.slice(0, limit);
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
    const cleanSnippet = snippet.replace(/<[^>]*>/g, '').substring(0, 150);
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
      snippet: item.body?.substring(0, 100) || '',
      rank: calculateBasicRelevance(item, query),
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

const calculateBasicRelevance = (item: any, query: string): number => {
  const title = item.title?.toLowerCase() || '';
  const queryLower = query.toLowerCase();
  
  if (title === queryLower) return 0.9;
  if (title.includes(queryLower)) return 0.7;
  return 0.3;
};
