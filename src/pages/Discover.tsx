import React, { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { motion } from "framer-motion";
import { pageTransition } from "@/lib/animation-utils";
import SearchBox from "@/components/discover/SearchBox";
import EnhancedFeaturedBanner from "@/components/EnhancedFeaturedBanner";
import CategoryNavigation from "@/components/discover/CategoryNavigation";
import ContentTabs from "@/components/discover/ContentTabs";
import RecommendationSection from "@/components/discover/RecommendationSection";
import { supabase } from "@/integrations/supabase/client";
import { FeaturedItemsProvider } from "@/context/FeaturedItemsContext";

const Discover = () => {
  const [activeTab, setActiveTab] = useState("music");
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [videos, setVideos] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'music', label: 'Music' },
    { id: 'tutorials', label: 'Tutorials' },
    { id: 'resources', label: 'Resources' },
  ];

  useEffect(() => {
    fetchContent();
  }, [selectedCategory]);

  const fetchContent = async () => {
    setLoading(true);
    try {
      const client = supabase as any;
      const videosResult = await client
        .from('video_content')
        .select('*')
        .eq('approved', true)
        .order('created_at', { ascending: false });

      const { data: videosData, error: videosError } = videosResult;
      if (videosError) console.error('Videos error:', videosError);

      const { data: tracksData, error: tracksError } = await supabase
        .from('tracks')
        .select('*')
        .eq('approved', true)
        .order('created_at', { ascending: false });

      if (tracksError) throw tracksError;

      setVideos(videosData as any || []);
      setTracks(tracksData as any || []);
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredVideos = videos.filter(video =>
    video.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (selectedCategory === 'all' || video.category === selectedCategory)
  );

  const filteredTracks = tracks.filter(track =>
    track.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (selectedCategory === 'all' || track.category === selectedCategory)
  );

  useEffect(() => {
    if (!document.getElementById('portal-dropdown-container')) {
      const dropdownContainer = document.createElement('div');
      dropdownContainer.id = 'portal-dropdown-container';
      dropdownContainer.style.position = 'fixed';
      dropdownContainer.style.top = '0';
      dropdownContainer.style.left = '0';
      dropdownContainer.style.width = '100%';
      dropdownContainer.style.height = '100%';
      dropdownContainer.style.pointerEvents = 'none';
      dropdownContainer.style.zIndex = '999';
      document.body.appendChild(dropdownContainer);
    }
    
    return () => {
      const container = document.getElementById('portal-dropdown-container');
      if (container && container.childNodes.length === 0) {
        document.body.removeChild(container);
      }
    };
  }, []);

  return (
    <MainLayout>
      <FeaturedItemsProvider>
        <motion.div 
          className="space-y-6" 
          {...pageTransition}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-proxima font-bold">Discover</h1>
              <p className="text-muted-foreground mt-1">
                Explore curated content from across the musical world
              </p>
            </div>
            <SearchBox />
          </div>
          
          <EnhancedFeaturedBanner />

          {/* Category Navigation
          <CategoryNavigation
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          /> */}
                    
          <ContentTabs 
            activeTab={activeTab} 
            setActiveTab={setActiveTab}
          />

          <RecommendationSection />
        </motion.div>
      </FeaturedItemsProvider>
    </MainLayout>
  );
};

export default Discover;
