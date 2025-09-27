// src/components/LazyVisionSection.tsx
import React, { Suspense, lazy } from 'react';
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

const LazyVisionSection: React.FC = () => {
  const { elementRef, shouldLoad } = useLazyIntersection({
    threshold: 0.1,
    rootMargin: '150px',
  });

  return (
    <div ref={elementRef} className="w-full">
      {shouldLoad ? (
        <Suspense
          fallback={
            <div className="min-h-[400px] flex flex-col items-center justify-center py-12 space-y-4">
              <LoaderOne />
              <p className="text-primary text-sm">Loading our vision...</p>
            </div>
          }
        >
          <div className="animate-in fade-in-50 duration-500">
            <VisionSection />
          </div>
        </Suspense>
      ) : (
        // Invisible placeholder to maintain layout and trigger intersection
        <div className="min-h-[400px] w-full opacity-0" aria-hidden="true" />
      )}
    </div>
  );
};

export default LazyVisionSection;
