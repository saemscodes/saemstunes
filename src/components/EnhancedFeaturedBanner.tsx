import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useFeaturedItems } from '@/context/FeaturedItemsContext';
import { Skeleton } from '@/components/ui/skeleton';

interface FeaturedItem {
  id: string;
  title: string;
  description: string;
  image: string;
  link: string;
  is_external?: boolean;
  order?: number;
}

const EnhancedFeaturedBanner = () => {
  const navigate = useNavigate();
  const { featuredItems, loading } = useFeaturedItems();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragDistance, setDragDistance] = useState(0);
  const touchStartTime = useRef(0);
  const bannerRef = useRef<HTMLDivElement>(null);

  const SWIPE_THRESHOLD = 50;
  const MAX_CLICK_DURATION = 300;

  useEffect(() => {
    if (!isAutoPlaying || featuredItems.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredItems.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, featuredItems]);

  const handleItemClick = (item: FeaturedItem) => {
    if (isDragging || Math.abs(dragDistance) > SWIPE_THRESHOLD) {
      return;
    }

    const clickDuration = Date.now() - touchStartTime.current;
    if (clickDuration > MAX_CLICK_DURATION) {
      return;
    }

    if (item.is_external) {
      window.open(item.link, '_blank');
    } else {
      navigate(item.link);
    }
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + featuredItems.length) % featuredItems.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % featuredItems.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsAutoPlaying(false);
    setIsDragging(true);
    setDragStartX(e.touches[0].clientX);
    setDragDistance(0);
    touchStartTime.current = Date.now();
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const currentX = e.touches[0].clientX;
    const distance = currentX - dragStartX;
    setDragDistance(distance);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;

    setIsDragging(false);
    
    if (Math.abs(dragDistance) > SWIPE_THRESHOLD) {
      if (dragDistance > 0) {
        goToPrevious();
      } else {
        goToNext();
      }
    }
    
    setDragDistance(0);
    setTimeout(() => setIsAutoPlaying(true), 2000);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsAutoPlaying(false);
    setIsDragging(true);
    setDragStartX(e.clientX);
    setDragDistance(0);
    touchStartTime.current = Date.now();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const currentX = e.clientX;
    const distance = currentX - dragStartX;
    setDragDistance(distance);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;

    setIsDragging(false);
    
    if (Math.abs(dragDistance) > SWIPE_THRESHOLD) {
      if (dragDistance > 0) {
        goToPrevious();
      } else {
        goToNext();
      }
    }
    
    setDragDistance(0);
    setTimeout(() => setIsAutoPlaying(true), 2000);
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      setDragDistance(0);
    }
    setIsAutoPlaying(true);
  };

  if (loading) {
    return (
      <div className="relative rounded-lg overflow-hidden h-48 md:h-64 mb-8">
        <Skeleton className="w-full h-full" />
      </div>
    );
  }

  if (featuredItems.length === 0) {
    return (
      <div className="rounded-lg bg-muted/30 h-48 md:h-64 flex items-center justify-center">
        <p className="text-muted-foreground">No featured items available</p>
      </div>
    );
  }

  const currentItem = featuredItems[currentIndex];

  return (
    <div 
      ref={bannerRef}
      className="relative rounded-lg overflow-hidden h-48 md:h-64 mb-8 group"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={handleMouseLeave}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentItem.id}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ 
            opacity: 1, 
            scale: 1,
            x: isDragging ? dragDistance : 0 
          }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ 
            duration: isDragging ? 0 : 0.5,
            type: isDragging ? "tween" : "spring"
          }}
          className="absolute inset-0 cursor-pointer select-none"
          onClick={() => handleItemClick(currentItem)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          style={{ touchAction: 'pan-y' }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent z-10"></div>
          <img 
            src={currentItem.image} 
            alt={currentItem.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
            draggable="false"
          />
          <div className="relative z-20 p-6 flex flex-col h-full justify-end">
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-block bg-gold text-white px-2 py-1 rounded-md text-xs mb-2 w-fit"
            >
              FEATURED
            </motion.div>
            <motion.h3 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-xl md:text-2xl font-proxima text-white font-bold mb-1"
            >
              {currentItem.title}
            </motion.h3>
            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-white/80 text-sm md:text-base max-w-lg"
            >
              {currentItem.description}
            </motion.p>
          </div>
        </motion.div>
      </AnimatePresence>

      <Button
        variant="ghost"
        size="icon"
        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white z-30 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => {
          e.stopPropagation();
          goToPrevious();
        }}
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white z-30 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => {
          e.stopPropagation();
          goToNext();
        }}
      >
        <ChevronRight className="h-5 w-5" />
      </Button>

      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-30">
        {featuredItems.map((_, index) => (
          <button
            key={index}
            className={cn(
              "w-2 h-2 rounded-full transition-all duration-300",
              index === currentIndex ? "bg-white" : "bg-white/50"
            )}
            onClick={(e) => {
              e.stopPropagation();
              setCurrentIndex(index);
            }}
          />
        ))}
      </div>

      {isDragging && (
        <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
          <div className={cn(
            "text-white text-sm font-medium px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm transition-opacity duration-200",
            Math.abs(dragDistance) > SWIPE_THRESHOLD ? "opacity-100" : "opacity-0"
          )}>
            {dragDistance > 0 ? "Release to go previous" : "Release to go next"}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedFeaturedBanner;
