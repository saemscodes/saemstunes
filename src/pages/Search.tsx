import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Search, Filter, X, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { searchAll, SearchResult, saveRecentSearch, getRecentSearches } from "@/lib/search";
import { useDebounce } from "@/lib/hooks/useDebounce";
import ResultsGrid from "@/components/search/ResultsGrid";

const SearchPage = () => {
  const location = useLocation();
  const initialQuery = location.state?.initialQuery || "";
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const debouncedQuery = useDebounce(searchQuery, 400);

  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  useEffect(() => {
    if (debouncedQuery) {
      performSearch(debouncedQuery, 0);
    } else {
      setSearchResults([]);
      setPage(0);
      setHasMore(false);
    }
  }, [debouncedQuery, activeTab]);

  const performSearch = async (query: string, pageNum: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const limit = 12;
      const filters = activeTab !== "all" ? { source_tables: [activeTab] } : {};
      
      const results = await searchAll(query, limit, pageNum * limit, filters);
      
      if (pageNum === 0) {
        setSearchResults(results);
      } else {
        setSearchResults(prev => [...prev, ...results]);
      }
      
      setHasMore(results.length >= limit);
      setPage(pageNum);
    } catch (err) {
      setError("Search temporarily unavailable. Please try again.");
      console.error("Search error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    saveRecentSearch(searchQuery);
    setRecentSearches(getRecentSearches());
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setPage(0);
    setHasMore(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    setTimeout(() => handleSearch(), 100);
  };

  const loadMore = () => {
    performSearch(debouncedQuery, page + 1);
  };

  const filteredResults = activeTab === "all" 
    ? searchResults 
    : searchResults.filter(result => result.source_table === activeTab);

  const extractQuickFilters = () => {
    const tags = new Set<string>();
    searchResults.forEach(result => {
      if (result.metadata?.tags) {
        result.metadata.tags.forEach((tag: string) => tags.add(tag));
      }
      if (result.metadata?.genre) {
        if (Array.isArray(result.metadata.genre)) {
          result.metadata.genre.forEach((genre: string) => tags.add(genre));
        } else {
          tags.add(result.metadata.genre);
        }
      }
    });
    return Array.from(tags).slice(0, 8);
  };

  const quickFilters = extractQuickFilters();

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-serif font-bold mb-6">Search</h1>
        
        <div className="relative mb-6">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search for music, courses, artists, resources..."
                className="pl-10 pr-10 text-lg py-6"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              {searchQuery && (
                <button
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={clearSearch}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
              className={`h-11 w-11 ${showFilters ? "bg-muted" : ""}`}
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {!searchQuery && recentSearches.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-background shadow-lg rounded-md mt-2 p-4 z-20 border">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Recent Searches
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto py-1 px-2 text-xs"
                  onClick={() => {
                    localStorage.removeItem('saemstunes-recent-searches');
                    setRecentSearches([]);
                  }}
                >
                  Clear All
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((search, idx) => (
                  <Badge
                    key={idx}
                    variant="secondary"
                    className="cursor-pointer hover:bg-primary/20 transition-colors px-3 py-1"
                    onClick={() => handleSuggestionClick(search)}
                  >
                    {search}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {showFilters && quickFilters.length > 0 && (
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card>
              <CardContent className="p-4">
                <h3 className="text-sm font-medium mb-3">Quick Filters</h3>
                <div className="flex flex-wrap gap-2">
                  {quickFilters.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary/10 transition-colors"
                      onClick={() => handleSuggestionClick(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 w-full flex overflow-x-auto">
            <TabsTrigger value="all" className="flex-1">All Content</TabsTrigger>
            <TabsTrigger value="artists" className="flex-1">Artists</TabsTrigger>
            <TabsTrigger value="tracks" className="flex-1">Music</TabsTrigger>
            <TabsTrigger value="resources" className="flex-1">Resources</TabsTrigger>
            <TabsTrigger value="courses" className="flex-1">Courses</TabsTrigger>
            <TabsTrigger value="video_content" className="flex-1">Videos</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-0">
            {searchQuery ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-muted-foreground">
                    Found {filteredResults.length} results for "{searchQuery}"
                    {activeTab !== "all" && ` in ${activeTab.replace('_', ' ')}`}
                  </p>
                  {searchResults.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      Ranked by relevance
                    </Badge>
                  )}
                </div>
                
                {error && (
                  <div className="bg-destructive/10 text-destructive p-4 rounded-lg mb-4">
                    {error}
                  </div>
                )}
                
                {isLoading && page === 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Card key={i} className="h-full animate-pulse">
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <div className="h-4 bg-muted rounded w-3/4"></div>
                            <div className="h-3 bg-muted rounded w-full"></div>
                            <div className="h-3 bg-muted rounded w-5/6"></div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : filteredResults.length > 0 ? (
                  <>
                    <ResultsGrid results={filteredResults} />
                    
                    {hasMore && (
                      <div className="mt-8 text-center">
                        <Button
                          onClick={loadMore}
                          disabled={isLoading}
                          variant="outline"
                          size="lg"
                        >
                          {isLoading ? "Loading More..." : "Load More Results"}
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-16">
                    <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h2 className="text-xl font-medium mb-2">No results found</h2>
                    <p className="text-muted-foreground mb-4">
                      Try different keywords or browse by category
                    </p>
                    <div className="flex gap-2 justify-center flex-wrap">
                      {["guitar", "piano", "vocal", "music theory"].map((term) => (
                        <Badge
                          key={term}
                          variant="outline"
                          className="cursor-pointer hover:bg-primary/10"
                          onClick={() => handleSuggestionClick(term)}
                        >
                          {term}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <Search className="h-20 w-20 text-muted-foreground mx-auto mb-6 opacity-50" />
                <h2 className="text-2xl font-medium mb-3">Discover Music Content</h2>
                <p className="text-muted-foreground max-w-md mx-auto mb-6">
                  Search for artists, music tracks, courses, and educational resources
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {["guitar lessons", "piano basics", "vocal techniques", "music theory"].map((term) => (
                    <Badge
                      key={term}
                      variant="secondary"
                      className="cursor-pointer hover:bg-primary/20 px-4 py-2 text-sm"
                      onClick={() => handleSuggestionClick(term)}
                    >
                      {term}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default SearchPage;
