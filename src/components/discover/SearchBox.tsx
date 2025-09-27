import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { userPreferences } from '@/lib/animation-utils';
import { getSearchSuggestions } from '@/lib/search';

const SearchBox = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const savedSearches = userPreferences.load<string[]>('recent-searches', [
      "Piano lessons", "Guitar chords", "Music theory", "Vocal techniques"
    ]);
    setRecentSearches(savedSearches);
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.length > 1) {
        setIsLoading(true);
        const results = await getSearchSuggestions(searchQuery);
        setSuggestions(results);
        setIsLoading(false);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;

    const updatedSearches = [
      query,
      ...recentSearches.filter(item => item !== query)
    ].slice(0, 5);
    
    setRecentSearches(updatedSearches);
    userPreferences.save('recent-searches', updatedSearches);
    setShowSuggestions(false);
    setSearchQuery('');
    
    navigate('/search', { state: { initialQuery: query } });
  };

  const handleInputBlur = () => {
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSearch(suggestion);
  };

  return (
    <div className="relative max-w-md w-full">
      <Input
        id="search"
        name="search"
        placeholder="Search for music, courses, artists..."
        className="w-full relative z-20 text-left truncate px-3"  // use px-3 for normal balanced padding
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
        onFocus={() => searchQuery.length > 1 && setShowSuggestions(true)}
        onBlur={handleInputBlur}
        />
      
      {showSuggestions && (suggestions.length > 0 || recentSearches.length > 0) && (
        <div className="absolute top-full left-0 right-0 bg-card shadow-lg rounded-md mt-1 p-2 z-50 border max-h-60 overflow-y-auto">
          {suggestions.length > 0 && (
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
          
          {recentSearches.length > 0 && suggestions.length === 0 && (
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
          
          {isLoading && (
            <div className="p-2 text-sm text-muted-foreground">Loading suggestions...</div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBox;
