import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Search, Filter, X, Clock, History, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { searchAll, SearchResult, getSearchSuggestions, saveRecentSearch, getRecentSearches } from "@/lib/search";
import { useDebounce } from "@/lib/hooks/useDebounce";
import ResultsGrid from "@/components/search/ResultsGrid";

const SearchPage = () => {
  const location = useLocation();
  const initialQuery = location.state?.initialQuery || "";
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [trendingSearches] = useState([
    "Piano basics", "Guitar chords", "Vocal warm-ups", "Music theory", "Saxophone lessons",
    "Love songs", "Worship music", "Gospel chords", "African rhythms"
  ]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const debouncedQuery = useDebounce(searchQuery, 350);

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

  const saveSearchToHistory = (query: string) => {
    if (!query.trim()) return;
    const updatedSearches = [
      query,
      ...recentSearches.filter(item => item !== query)
    ].slice(0, 5);
    setRecentSearches(updatedSearches);
    saveRecentSearch(query);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setPage(0);
    setHasMore(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery) {
      saveSearchToHistory(searchQuery);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    saveSearchToHistory(suggestion);
  };

  const loadMore = () => {
    performSearch(debouncedQuery, page + 1);
  };

  const filterResultsByType = (results: SearchResult[], type: string) => {
    if (type === "all") return results;
    return results.filter(result => result.source_table === type);
  };

  const filteredResults = filterResultsByType(searchResults, activeTab);

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

          {!searchQuery && (
            <div className="absolute top-full left-0 right-0 bg-background shadow-lg rounded-md mt-2 p-4 z-20 border">
              {recentSearches.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
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
                      Clear
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((search, idx) => (
                      <Badge
                        key={idx}
                        variant="outline"
                        className="cursor-pointer hover:bg-muted"
                        onClick={() => handleSuggestionClick(search)}
                      >
                        <History className="mr-1 h-3 w-3" />
                        {search}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              <div>
                <h3 className="text-sm font-medium flex items-center gap-1 mb-2">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Trending
                </h3>
                <div className="flex flex-wrap gap-2">
                  {trendingSearches.map((search, idx) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className="cursor-pointer hover:bg-muted"
                      onClick={() => handleSuggestionClick(search)}
                    >
                      {search}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {showFilters && (
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
                      className="cursor-pointer hover:bg-muted"
                      onClick={() => handleSuggestionClick(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="mt-4 flex justify-end">
                  <Button variant="outline" size="sm" onClick={() => setShowFilters(false)}>
                    Close
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="artists">Artists</TabsTrigger>
            <TabsTrigger value="video_content">Videos</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="tracks">Tracks</TabsTrigger>
            <TabsTrigger value="tutors">Tutors</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-0">
            {searchQuery ? (
              <>
                <p className="text-muted-foreground mb-4">
                  {filteredResults.length} results for "{searchQuery}"
                  {activeTab !== "all" && ` in ${activeTab.replace('_', ' ')}`}
                </p>
                
                {error && (
                  <div className="bg-destructive/10 text-destructive p-4 rounded-lg mb-4">
                    {error}
                  </div>
                )}
                
                {isLoading && page === 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Card key={i} className="h-full">
                        <CardContent className="p-4">
                          <div className="animate-pulse">
                            <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-muted rounded w-full mb-1"></div>
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
                        >
                          {isLoading ? "Loading..." : "Load More Results"}
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-16">
                    <h2 className="text-xl font-medium">No results found</h2>
                    <p className="text-muted-foreground mt-2">
                      Try adjusting your search terms or exploring different categories
                    </p>
                    <Button variant="outline" className="mt-4" onClick={clearSearch}>
                      Clear Search
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Enter search terms to find videos, resources, tutors and more
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default SearchPage;
