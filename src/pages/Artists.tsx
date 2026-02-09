
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Search,
  User,
  Music,
  MapPin,
  Users,
  Heart,
  Play,
  Star,
  Verified,
  TrendingUp,
  Grid,
  List
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import MainLayout from '@/components/layout/MainLayout';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from "@/integrations/supabase/client";

interface Artist {
  id: string;
  name: string;
  genre: string[];
  location: string;
  followerCount: number;
  isVerified: boolean;
  profileImage: string;
  bio: string;
  monthlyListeners: number;
  isFollowing: boolean;
  slug: string;
  createdAt: string;
  socialLinks?: {
    instagram?: string;
    spotify?: string;
    youtube?: string;
  };
}

const Artists: React.FC = () => {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [sortBy, setSortBy] = useState('popularity');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [followedArtists, setFollowedArtists] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newThisMonth, setNewThisMonth] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const isMobile = useIsMobile();

  const ARTISTS_PER_PAGE = 9;

  useEffect(() => {
    const fetchArtists = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('artists')
          .select('*')
          .order('follower_count', { ascending: false });

        if (error) {
          throw error;
        }

        if (data) {
          const mappedArtists = data.map(artist => ({
            id: artist.id,
            name: artist.name,
            genre: artist.genre || [],
            location: artist.location || '',
            followerCount: artist.follower_count || 0,
            isVerified: artist.verified_status || false,
            profileImage: artist.profile_image_url || '/placeholder.svg',
            bio: artist.bio || '',
            monthlyListeners: artist.monthly_listeners || 0,
            isFollowing: false,
            slug: artist.slug,
            createdAt: artist.created_at,
            socialLinks: typeof artist.social_links === 'object' && artist.social_links !== null
              ? artist.social_links as { instagram?: string; spotify?: string; youtube?: string; }
              : {}
          }));
          setArtists(mappedArtists);

          // Calculate new artists this month
          const now = new Date();
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          const newArtistsCount = data.filter(artist => {
            const createdAt = new Date(artist.created_at);
            return createdAt >= startOfMonth;
          }).length;

          setNewThisMonth(newArtistsCount);
        }
      } catch (err) {
        setError('Failed to load artists');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchArtists();
  }, []);

  const genres = [
    'all',
    'Gospel',
    'Christian Contemporary',
    'Worship',
    'Afrobeats Gospel',
    'Traditional Gospel',
    'Christian Pop'
  ];

  const sortOptions = [
    { value: 'popularity', label: 'Popularity' },
    { value: 'name', label: 'Name A-Z' },
    { value: 'followers', label: 'Most Followers' },
    { value: 'recent', label: 'Recently Added' }
  ];

  const filteredArtists = artists
    .filter(artist => {
      const matchesSearch = artist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        artist.genre.some(g => g.toLowerCase().includes(searchTerm.toLowerCase())) ||
        artist.location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGenre = selectedGenre === 'all' || artist.genre.includes(selectedGenre);
      return matchesSearch && matchesGenre;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'followers':
          return b.followerCount - a.followerCount;
        case 'recent':
          // Sort by creation date for recent sorting
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return b.monthlyListeners - a.monthlyListeners;
      }
    });

  // Get artists for current page
  const paginatedArtists = filteredArtists.slice(0, currentPage * ARTISTS_PER_PAGE);
  const hasMoreArtists = paginatedArtists.length < filteredArtists.length;

  const handleLoadMore = () => {
    setCurrentPage(prev => prev + 1);
  };

  const handleFollow = (artistId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFollowedArtists(prev => {
      const newSet = new Set(prev);
      if (newSet.has(artistId)) {
        newSet.delete(artistId);
      } else {
        newSet.add(artistId);
      }
      return newSet;
    });
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  const ArtistCard = ({ artist }: { artist: Artist }) => {
    const isFollowing = followedArtists.has(artist.id);

    return (
      <motion.div
        variants={itemVariants}
        whileHover={{ y: isMobile ? 0 : -5 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-card to-card/80 h-full">
          <CardContent className="p-0">
            <Link to={`/artist/${artist.slug}`} className="block">
              <div className="relative">
                <img
                  src={artist.profileImage}
                  alt={artist.name}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-bold text-white text-lg truncate">{artist.name}</h3>
                    {artist.isVerified && (
                      <Verified className="h-4 w-4 text-blue-500 fill-current" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-white/80 text-sm mb-2">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate">{artist.location}</span>
                  </div>
                </div>
              </div>
            </Link>

            <div className="p-4">
              <Link to={`/artist/${artist.slug}`} className="block">
                <div className="flex flex-wrap gap-1 mb-3">
                  {artist.genre.slice(0, 2).map((genre) => (
                    <Badge key={genre} variant="secondary" className="text-xs">
                      {genre}
                    </Badge>
                  ))}
                  {artist.genre.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{artist.genre.length - 2}
                    </Badge>
                  )}
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {artist.bio}
                </p>

                <div className="grid grid-cols-2 gap-4 mb-4 text-center">
                  <div>
                    <div className="font-bold text-sm">{formatNumber(artist.followerCount)}</div>
                    <div className="text-xs text-muted-foreground">Followers</div>
                  </div>
                  <div>
                    <div className="font-bold text-sm">{formatNumber(artist.monthlyListeners)}</div>
                    <div className="text-xs text-muted-foreground">Monthly</div>
                  </div>
                </div>
              </Link>

              <div className="flex gap-2">
                <Button
                  onClick={(e) => handleFollow(artist.id, e)}
                  className={`flex-1 ${isFollowing
                      ? 'bg-muted text-muted-foreground hover:bg-muted/80'
                      : 'bg-gold hover:bg-gold-dark text-white'
                    }`}
                >
                  {isFollowing ? (
                    <>
                      <Users className="mr-2 h-4 w-4" />
                      Following
                    </>
                  ) : (
                    <>
                      <Heart className="mr-2 h-4 w-4" />
                      Follow
                    </>
                  )}
                </Button>
                <Button size="icon" variant="outline">
                  <Music className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <MainLayout>
      <motion.div
        className="min-h-screen bg-gradient-to-br from-background via-background to-gold/5 w-full max-w-full"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="container px-4 sm:px-6 lg:px-8 py-6 w-full max-w-full overflow-hidden">
          <motion.div
            className="text-center mb-8"
            variants={itemVariants}
          >
            <h1 className="text-3xl sm:text-4xl font-serif font-bold mb-4">
              Discover <span className="text-gold">Artists</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Connect with talented Christian artists from across Africa and beyond
            </p>
          </motion.div>

          <motion.div
            className="mb-8 space-y-4"
            variants={itemVariants}
          >
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search artists, genres, or locations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex gap-2">
                <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Genre" />
                  </SelectTrigger>
                  <SelectContent>
                    {genres.map((genre) => (
                      <SelectItem key={genre} value={genre}>
                        {genre === 'all' ? 'All Genres' : genre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex border rounded-lg">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{filteredArtists.length} artists found</span>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span>{newThisMonth} new this month</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-gold" />
                  <span>{followedArtists.size} following</span>
                </div>
              </div>
            </div>
          </motion.div>

          {loading && (
            <motion.div
              className="text-center py-16"
              variants={itemVariants}
            >
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold mx-auto mb-4"></div>
              <p>Loading artists...</p>
            </motion.div>
          )}

          {error && !loading && (
            <motion.div
              className="text-center py-16"
              variants={itemVariants}
            >
              <User className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-medium mb-2">Error loading artists</h3>
              <p className="text-muted-foreground mb-6">
                {error}
              </p>
              <Button
                onClick={() => window.location.reload()}
                className="bg-gold hover:bg-gold-dark text-white"
              >
                Try Again
              </Button>
            </motion.div>
          )}

          {!loading && !error && (
            <>
              <motion.div
                className={`grid gap-6 ${viewMode === 'grid'
                    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                    : 'grid-cols-1'
                  }`}
                variants={containerVariants}
              >
                <AnimatePresence>
                  {paginatedArtists.map((artist) => (
                    <ArtistCard key={artist.id} artist={artist} />
                  ))}
                </AnimatePresence>
              </motion.div>

              {filteredArtists.length === 0 && (
                <motion.div
                  className="text-center py-16"
                  variants={itemVariants}
                >
                  <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-medium mb-2">No artists found</h3>
                  <p className="text-muted-foreground mb-6">
                    Try adjusting your search or filter criteria
                  </p>
                  <Button
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedGenre('all');
                      setCurrentPage(1);
                    }}
                    className="bg-gold hover:bg-gold-dark text-white"
                  >
                    Clear Filters
                  </Button>
                </motion.div>
              )}
            </>
          )}

          {!loading && !error && hasMoreArtists && (
            <motion.div
              className="text-center mt-12"
              variants={itemVariants}
            >
              <Button
                onClick={handleLoadMore}
                variant="outline"
                className="border-gold text-gold hover:bg-gold hover:text-white"
              >
                Load More Artists
              </Button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </MainLayout>
  );
};

export default Artists;
