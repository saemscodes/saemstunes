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
  similarity_score?: number;
}

export interface SearchFilters {
  source_tables?: string[];
  min_rank?: number;
  content_types?: string[];
  difficulty_levels?: string[];
  instructors?: string[];
}

export interface SearchSuggestion {
  text: string;
  type: 'recent' | 'suggestion' | 'popular';
  score?: number;
}

// Cache for search results
const searchCache = new Map<string, { results: SearchResult[]; timestamp: number }>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

const POPULAR_SEARCH_TERMS = [
  "guitar lessons", "piano basics", "vocal warmups", "music theory", 
  "songwriting", "gospel music", "afrobeat", "chord progressions",
  "fingerstyle guitar", "music production"
];

export const searchAll = async (
  query: string, 
  limit = 20, 
  offset = 0,
  filters: SearchFilters = {}
): Promise<SearchResult[]> => {
  if (!query || query.trim().length < 2) {
    return await searchByPopularity(limit, offset, filters);
  }

  const cleanQuery = query.trim().toLowerCase();
  const cacheKey = `${cleanQuery}-${limit}-${offset}-${JSON.stringify(filters)}`;
  
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.results;
  }

  try {
    let queryBuilder = supabase
      .from('search_index')
      .select('*')
      .textSearch('tsv', cleanQuery, {
        type: 'websearch',
        config: 'english'
      });

    if (filters.source_tables && filters.source_tables.length > 0) {
      queryBuilder = queryBuilder.in('source_table', filters.source_tables);
    }

    const { data, error } = await queryBuilder
      .range(offset, offset + limit - 1)
      .order('rank', { ascending: false });

    if (error) throw error;

    const results = (data || []).map((item: any) => ({
      ...item,
      type: getContentType(item.source_table),
      image: extractImage(item.metadata),
      description: extractDescription(item.metadata, item.snippet),
      similarity_score: calculateSimilarityScore(item, cleanQuery)
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

export const searchByPopularity = async (
  limit = 20,
  offset = 0,
  filters: SearchFilters = {}
): Promise<SearchResult[]> => {
  try {
    let queryBuilder = supabase
      .from('search_index')
      .select('*');

    if (filters.source_tables && filters.source_tables.length > 0) {
      queryBuilder = queryBuilder.in('source_table', filters.source_tables);
    }

    const { data, error } = await queryBuilder
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((item: any) => ({
      ...item,
      type: getContentType(item.source_table),
      image: extractImage(item.metadata),
      description: extractDescription(item.metadata, item.snippet),
      similarity_score: 0.5
    }));
  } catch (error) {
    console.error('Popularity search failed:', error);
    return [];
  }
};

export const getSearchSuggestions = async (query: string, limit = 8): Promise<SearchSuggestion[]> => {
  if (!query || query.trim().length < 2) {
    return getDefaultSuggestions(limit);
  }

  const cleanQuery = query.trim().toLowerCase();
  const suggestions: SearchSuggestion[] = [];

  try {
    const { data, error } = await supabase
      .from('search_index')
      .select('title')
      .textSearch('title', cleanQuery, {
        type: 'websearch',
        config: 'english'
      })
      .limit(limit);

    if (!error && data) {
      suggestions.push(...data.map((item: any) => ({
        text: item.title,
        type: 'suggestion' as const,
        score: 0.9
      })));
    }

    const matchingPopular = POPULAR_SEARCH_TERMS
      .filter(term => term.toLowerCase().includes(cleanQuery))
      .slice(0, 3)
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

export const advancedSearch = async (
  query: string,
  options: {
    search_fields?: ('title' | 'body' | 'metadata')[];
    boost_title?: number;
    min_similarity?: number;
    filters?: SearchFilters;
  } = {}
): Promise<SearchResult[]> => {
  const {
    search_fields = ['title', 'body'],
    boost_title = 2.0,
    min_similarity = 0.1,
    filters = {}
  } = options;

  try {
    let queryBuilder = supabase
      .from('search_index')
      .select('*');

    if (query && query.trim().length >= 2) {
      const cleanQuery = query.trim().toLowerCase();
      
      if (search_fields.includes('title') && search_fields.includes('body')) {
        queryBuilder = queryBuilder.textSearch('tsv', cleanQuery, {
          type: 'websearch',
          config: 'english'
        });
      } else if (search_fields.includes('title')) {
        queryBuilder = queryBuilder.textSearch('title', cleanQuery, {
          type: 'websearch',
          config: 'english'
        });
      } else if (search_fields.includes('body')) {
        queryBuilder = queryBuilder.textSearch('body', cleanQuery, {
          type: 'websearch',
          config: 'english'
        });
      }
    }

    if (filters.source_tables && filters.source_tables.length > 0) {
      queryBuilder = queryBuilder.in('source_table', filters.source_tables);
    }

    const { data, error } = await queryBuilder
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    const scoredResults = (data || [])
      .map((item: any) => ({
        ...item,
        type: getContentType(item.source_table),
        image: extractImage(item.metadata),
        description: extractDescription(item.metadata, item.snippet),
        similarity_score: calculateAdvancedSimilarity(item, query, boost_title)
      }))
      .filter(result => result.similarity_score >= min_similarity)
      .sort((a, b) => (b.similarity_score || 0) - (a.similarity_score || 0));

    return scoredResults;
  } catch (error) {
    console.error('Advanced search failed:', error);
    return [];
  }
};

export const searchByMetadata = async (
  metadataFilters: Record<string, any>,
  limit = 20
): Promise<SearchResult[]> => {
  try {
    let queryBuilder = supabase.from('search_index');

    Object.entries(metadataFilters).forEach(([key, value]) => {
      queryBuilder = queryBuilder.filter('metadata', 'cs', JSON.stringify({ [key]: value }));
    });

    const { data, error } = await queryBuilder
      .select('*')
      .limit(limit)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((item: any) => ({
      ...item,
      type: getContentType(item.source_table),
      image: extractImage(item.metadata),
      description: extractDescription(item.metadata, item.snippet)
    }));
  } catch (error) {
    console.error('Metadata search failed:', error);
    return [];
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
    const updated = [query, ...recent.filter(item => item.toLowerCase() !== query.toLowerCase())].slice(0, 8);
    localStorage.setItem('saemstunes-recent-searches', JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving recent search:', error);
  }
};

export const clearSearchCache = (): void => {
  searchCache.clear();
};

// Helper functions
const getContentType = (sourceTable: string): string => {
  const typeMap: Record<string, string> = {
    'video_content': 'video',
    'tracks': 'music',
    'resources': 'resource',
    'courses': 'course',
    'artists': 'artist',
    'tutors': 'tutor'
  };
  return typeMap[sourceTable] || 'content';
};

const extractImage = (metadata: any): string | undefined => {
  if (!metadata) return undefined;
  
  return metadata.thumbnail_url || metadata.cover_path || metadata.profile_image || 
         metadata.image || metadata.cover_image || metadata.avatar;
};

const extractDescription = (metadata: any, snippet: string): string | undefined => {
  if (metadata?.description) return metadata.description;
  if (snippet) {
    const cleanSnippet = snippet.replace(/'/g, '').substring(0, 200);
    return cleanSnippet.length > 150 ? cleanSnippet.substring(0, 150) + '...' : cleanSnippet;
  }
  return undefined;
};

const calculateSimilarityScore = (item: any, query: string): number => {
  const title = item.title?.toLowerCase() || '';
  const body = item.body?.toLowerCase() || '';
  const queryTerms = query.toLowerCase().split(' ');
  
  let score = 0;
  
  queryTerms.forEach(term => {
    if (title.includes(term)) score += 2;
    if (body.includes(term)) score += 1;
  });
  
  const maxScore = queryTerms.length * 2;
  return maxScore > 0 ? Math.min(score / maxScore, 1) : 0;
};

const calculateAdvancedSimilarity = (item: any, query: string, titleBoost: number): number => {
  if (!query) return 0.5;
  
  const title = item.title?.toLowerCase() || '';
  const body = item.body?.toLowerCase() || '';
  const queryTerms = query.toLowerCase().split(' ').filter(term => term.length > 2);
  
  if (queryTerms.length === 0) return 0.5;
  
  let titleScore = 0;
  let bodyScore = 0;
  
  queryTerms.forEach(term => {
    if (title.includes(term)) titleScore += titleBoost;
    if (body.includes(term)) bodyScore += 1;
  });
  
  const maxTitleScore = queryTerms.length * titleBoost;
  const maxBodyScore = queryTerms.length;
  const totalMaxScore = maxTitleScore + maxBodyScore;
  
  if (totalMaxScore === 0) return 0.5;
  
  return Math.min((titleScore + bodyScore) / totalMaxScore, 1);
};

const getDefaultSuggestions = (limit: number): SearchSuggestion[] => {
  return POPULAR_SEARCH_TERMS.slice(0, limit).map(term => ({
    text: term,
    type: 'popular' as const,
    score: 0.7
  }));
};

const fallbackSearch = async (
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

    if (filters.source_tables && filters.source_tables.length > 0) {
      queryBuilder = queryBuilder.in('source_table', filters.source_tables);
    }

    const { data, error } = await queryBuilder
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((item: any) => ({
      ...item,
      type: getContentType(item.source_table),
      image: extractImage(item.metadata),
      description: extractDescription(item.metadata, item.snippet),
      similarity_score: calculateSimilarityScore(item, query)
    }));
  } catch (error) {
    console.error('Fallback search failed:', error);
    return [];
  }
};

// Auto-clear cache every 30 minutes
setInterval(clearSearchCache, 30 * 60 * 1000);
