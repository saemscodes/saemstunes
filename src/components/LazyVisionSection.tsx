// src/components/LazyVisionSection.tsx
import React, { Suspense, lazy, useMemo } from 'react';
import { useLazyIntersection } from '@/hooks/useLazyIntersection';
import { LoaderOne } from '@/components/ui/loader';

// Single, optimized lazy load implementation
const VisionSection = lazy(() => 
  import('@/components/homepage/VisionSection')
    .then(module => ({ default: module.VisionSection }))
    .catch(error => {
      console.error('Failed to load VisionSection:', error);
      return { 
        default: () => (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Unable to load vision section</p>
          </div>
        )
      };
    })
);

const LazyVisionSection: React.FC = () => {
  const { elementRef, shouldLoad } = useLazyIntersection({
    threshold: 0.1, // Revert to original threshold
    rootMargin: '150px', // Revert to original margin
  });

  // Memoize components to prevent re-renders
  const placeholder = useMemo(() => (
    <div className="min-h-[400px] w-full opacity-0" aria-hidden="true" />
  ), []);

  const suspenseFallback = useMemo(() => (
    <div className="min-h-[400px] flex flex-col items-center justify-center py-12 space-y-4">
      <LoaderOne />
      <p className="text-primary text-sm">Loading our vision...</p>
    </div>
  ), []);

  return (
    <div ref={elementRef} className="w-full">
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
