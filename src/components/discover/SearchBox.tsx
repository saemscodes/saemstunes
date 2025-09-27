import React, { useState, useRef, useEffect } from 'react';
import { Search, Clock, X, TrendingUp, Loader } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSearch } from '@/lib/hooks/useSearch';
import { getRecentSearches, saveRecentSearch } from '@/lib/search';

interface SearchBoxProps {
  onResultClick?: (result: any) => void;
  placeholder?: string;
  className?: string;
}

export const SearchBox: React.FC<SearchBoxProps> = ({
  onResultClick,
  placeholder = "Search for music, courses, artists...",
  className = ""
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [localQuery, setLocalQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    searchQuery,
    setSearchQuery,
    results,
    suggestions,
    isLoading,
    error,
    hasMore,
    loadMore
  } = useSearch({ debounceDelay: 400 });

  const recentSearches = getRecentSearches();
  const trendingSearches = ["guitar lessons", "piano basics", "music theory", "vocal warmups"];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (value: string) => {
    setLocalQuery(value);
    setSearchQuery(value);
    setShowSuggestions(true);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setLocalQuery(suggestion);
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    saveRecentSearch(suggestion);
    inputRef.current?.focus();
  };

  const handleClear = () => {
    setLocalQuery('');
    setSearchQuery('');
    setShowSuggestions(true);
    inputRef.current?.focus();
  };

  const shouldShowSuggestions = showSuggestions && isFocused && !error;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={localQuery}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => {
            setIsFocused(true);
            setShowSuggestions(true);
          }}
          className="pl-10 pr-10 w-full"
        />
        {localQuery && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {shouldShowSuggestions && (
        <div className="absolute top-full left-0 right-0 bg-card border border-border rounded-md shadow-lg mt-1 z-50 max-h-96 overflow-y-auto">
          <div className="p-3">
            {localQuery.length === 0 && recentSearches.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
                  <Clock className="h-3 w-3" />
                  Recent searches
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((search, idx) => (
                    <Badge
                      key={idx}
                      variant="secondary"
                      className="cursor-pointer hover:bg-secondary/80"
                      onClick={() => handleSuggestionClick(search)}
                    >
                      {search}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {suggestions.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
                  <TrendingUp className="h-3 w-3" />
                  Suggestions
                </div>
                <div className="space-y-1">
                  {suggestions.map((suggestion, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2 hover:bg-muted rounded cursor-pointer text-sm"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      <Search className="h-3 w-3 text-muted-foreground" />
                      {suggestion}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {localQuery.length === 0 && suggestions.length === 0 && (
              <div>
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
                  <TrendingUp className="h-3 w-3" />
                  Trending searches
                </div>
                <div className="flex flex-wrap gap-2">
                  {trendingSearches.map((search, idx) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className="cursor-pointer hover:bg-secondary/50"
                      onClick={() => handleSuggestionClick(search)}
                    >
                      {search}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {isLoading && (
              <div className="flex items-center justify-center py-4">
                <Loader className="h-4 w-4 animate-spin" />
                <span className="ml-2 text-sm text-muted-foreground">Searching...</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
