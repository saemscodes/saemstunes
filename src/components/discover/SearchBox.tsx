import React, { useState, useEffect } from 'react';
import { Search, Clock } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { getSearchSuggestions, saveRecentSearch, getRecentSearches } from '@/lib/search';

const SearchBox = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.length > 0) {
        setIsLoading(true);
        const results = await getSearchSuggestions(searchQuery);
        setSuggestions(results);
        setIsLoading(false);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(recentSearches.length > 0);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 200);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, recentSearches.length]);

  const handleSearch = (query: string) => {
    if (!query.trim()) return;
    
    saveRecentSearch(query);
    setRecentSearches(getRecentSearches());
    setShowSuggestions(false);
    setSearchQuery('');
    
    navigate('/search', { state: { initialQuery: query } });
  };

  const handleInputBlur = () => {
    setTimeout(() => setShowSuggestions(false), 150);
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSearch(suggestion);
  };

  return (
    <div className="relative max-w-md w-full">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 z-10" />
      <Input
        id="search"
        name="search"
        placeholder="Search for music, courses, artists..."
        className="pl-10 w-full relative z-20"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
        onFocus={() => setShowSuggestions(true)}
        onBlur={handleInputBlur}
      />
      
      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 bg-card shadow-lg rounded-md mt-1 p-2 z-50 border max-h-60 overflow-y-auto">
          {searchQuery.length === 0 && recentSearches.length > 0 && (
            <>
              <div className="text-xs text-muted-foreground mb-2 px-2">Recent searches</div>
              {recentSearches.map((search, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 hover:bg-muted rounded cursor-pointer transition-colors"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSuggestionClick(search)}
                >
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm">{search}</span>
                </div>
              ))}
            </>
          )}
          
          {searchQuery.length > 0 && suggestions.length > 0 && (
            <>
              <div className="text-xs text-muted-foreground mb-2 px-2">Suggestions</div>
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 hover:bg-muted rounded cursor-pointer transition-colors"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <Search className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm">{suggestion}</span>
                </div>
              ))}
            </>
          )}
          
          {isLoading && searchQuery.length > 0 && (
            <div className="p-2 text-sm text-muted-foreground">Loading suggestions...</div>
          )}
          
          {searchQuery.length > 0 && suggestions.length === 0 && !isLoading && (
            <div className="p-2 text-sm text-muted-foreground">No suggestions found</div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBox;
