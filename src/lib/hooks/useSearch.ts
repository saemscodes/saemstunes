import { useState, useEffect, useDeferredValue } from 'react';
import { searchAll, getSearchSuggestions, saveRecentSearch, type SearchResult, type SearchFilters } from '@/lib/search';

interface UseSearchOptions {
  initialQuery?: string;
  filters?: SearchFilters;
  debounceDelay?: number;
}

export const useSearch = (options: UseSearchOptions = {}) => {
  const { initialQuery = '', filters = {}, debounceDelay = 300 } = options;
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);

  const deferredQuery = useDeferredValue(searchQuery);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (deferredQuery.length > 0) {
        try {
          const suggestionResults = await getSearchSuggestions(deferredQuery, 5);
          setSuggestions(suggestionResults.map(s => s.text));
        } catch (err) {
          console.error('Failed to fetch suggestions:', err);
          setSuggestions([]);
        }
      } else {
        setSuggestions([]);
      }
    };

    fetchSuggestions();
  }, [deferredQuery]);

  useEffect(() => {
    const performSearch = async () => {
      if (!deferredQuery.trim()) {
        setResults([]);
        setHasMore(false);
        setPage(0);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const searchResults = await searchAll(deferredQuery, 12, 0, filters);
        setResults(searchResults);
        setHasMore(searchResults.length >= 12);
        setPage(1);

        if (searchResults.length > 0) {
          saveRecentSearch(deferredQuery);
        }
      } catch (err) {
        setError('Search failed. Please try again.');
        console.error('Search error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [deferredQuery, JSON.stringify(filters)]);

  const loadMore = async () => {
    if (!deferredQuery || !hasMore || isLoading) return;

    setIsLoading(true);
    try {
      const newResults = await searchAll(deferredQuery, 12, page * 12, filters);
      setResults(prev => [...prev, ...newResults]);
      setHasMore(newResults.length >= 12);
      setPage(prev => prev + 1);
    } catch (err) {
      setError('Failed to load more results');
    } finally {
      setIsLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setResults([]);
    setSuggestions([]);
    setError(null);
    setHasMore(false);
    setPage(0);
  };

  return {
    searchQuery,
    setSearchQuery,
    results,
    suggestions,
    isLoading,
    error,
    hasMore,
    loadMore,
    clearSearch,
  };
};
