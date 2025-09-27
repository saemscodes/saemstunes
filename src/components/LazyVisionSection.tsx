// src/components/LazyVisionSection.tsx
import React, { Suspense, lazy, useMemo } from 'react';
import { useLazyIntersection } from '@/hooks/useLazyIntersection';
import { LoaderOne } from '@/components/ui/loader';

// Preload function for better performance
const preloadVisionSection = () => import('@/components/homepage/VisionSection');

// Error boundary component to avoid recreating function on each render
const ErrorFallback = () => (
  <div className="text-center py-12">
    <p className="text-muted-foreground">Unable to load vision section</p>
  </div>
);

// Lazy load with better error handling and preloading
const VisionSection = lazy(() => 
  preloadVisionSection()
    .then(module => ({ default: module.VisionSection }))
    .catch(() => ({ default: ErrorFallback }))
);

const LazyVisionSection: React.FC = () => {
  // Optimize intersection observer with more aggressive thresholds
  const { elementRef, shouldLoad } = useLazyIntersection({
    threshold: 0.05,
    rootMargin: '250px',
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

  return (
    <div 
      ref={elementRef} 
      className="w-full"
    >
      {shouldLoad ? (
        <Suspense fallback={suspenseFallback}>
          <div className="animate-in fade-in-50 duration-500">
            <VisionSection />
          </div>
        </Suspense>
      ) : (
        placeholder
      )}
    </div>
  );
};

export default React.memo(LazyVisionSection);
