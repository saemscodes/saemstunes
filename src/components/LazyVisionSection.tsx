// src/components/LazyVisionSection.tsx
import React, { Suspense, lazy, useMemo } from 'react';
import { useLazyIntersection } from '@/hooks/useLazyIntersection';
import { LoaderOne } from '@/components/ui/loader';

// Lazy load VisionSection with error boundary
const VisionSection = lazy(() => 
  import('@/components/homepage/VisionSection')
    .catch(error => {
      console.error('Failed to load VisionSection:', error);
      // Return a fallback component
      return { 
        default: () => (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Unable to load vision section</p>
          </div>
        )
      };
    })
);

// Preload function for better performance
const preloadVisionSection = () => import('@/components/homepage/VisionSection');

// Error boundary component to avoid recreating function on each render
const ErrorFallback = () => (
  <div className="text-center py-12">
    <p className="text-muted-foreground">Unable to load vision section</p>
  </div>
);

// Optimized lazy load with better error handling and preloading
const OptimizedVisionSection = lazy(() => 
  preloadVisionSection()
    .then(module => ({ default: module.VisionSection }))
    .catch(() => ({ default: ErrorFallback }))
);

const LazyVisionSection: React.FC = () => {
  // Optimize intersection observer with more aggressive thresholds
  const { elementRef, shouldLoad } = useLazyIntersection({
    threshold: 0.05, // More sensitive threshold
    rootMargin: '250px', // Start loading earlier
  });

  // Memoize the placeholder to prevent unnecessary re-renders
  const placeholder = useMemo(() => (
    <div className="min-h-[400px] w-full opacity-0" aria-hidden="true" />
  ), []);

  // Memoize the suspense fallback
  const suspenseFallback = useMemo(() => (
    <div className="min-h-[400px] flex flex-col items-center justify-center py-12 space-y-4">
      <LoaderOne />
      <p className="text-primary text-sm">Loading our vision...</p>
    </div>
  ), []);

  // Use the optimized version when shouldLoad is true
  const VisionComponent = shouldLoad ? OptimizedVisionSection : VisionSection;

  return (
    <div 
      ref={elementRef} 
      className="w-full"
      // Add loading attribute for browsers that support it
      {...{ loading: 'lazy' }}
    >
      {shouldLoad ? (
        <Suspense fallback={suspenseFallback}>
          <div className="animate-in fade-in-50 duration-500">
            <VisionComponent />
          </div>
        </Suspense>
      ) : (
        placeholder
      )}
    </div>
  );
};

export default React.memo(LazyVisionSection);
