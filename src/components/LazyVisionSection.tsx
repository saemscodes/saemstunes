// src/components/LazyVisionSection.tsx
import React, { Suspense, lazy } from 'react';
import { useLazyIntersection } from '@/hooks/useLazyIntersection';
import { LoaderOne } from '@/components/ui/loader';

// A fallback component for loading state
const LoadFallback = () => (
  <div className="min-h-[400px] flex flex-col items-center justify-center py-12 space-y-4">
    <LoaderOne />
    <p className="text-primary text-sm">Loading our vision...</p>
  </div>
);

// A fallback component for errors
const ErrorFallback = () => (
  <div className="text-center py-12">
    <p className="text-muted-foreground">Unable to load vision section</p>
  </div>
);

// Lazy load with error handling for the import promise itself
const VisionSection = lazy(() =>
  import('@/components/homepage/VisionSection')
    .then((module) => {
      // Check if the module has a valid default export
      if (module && module.default) {
        return module;
      }
      throw new Error('VisionSection module does not have a default export');
    })
    .catch((error) => {
      console.error('Failed to load VisionSection module:', error);
      // Return a fallback component module if the import fails
      return { default: ErrorFallback };
    })
);

const LazyVisionSection: React.FC = () => {
  const { elementRef, shouldLoad } = useLazyIntersection({
    threshold: 0.1,
    rootMargin: '150px',
  });

  return (
    <div ref={elementRef} className="w-full">
      {shouldLoad && (
        <Suspense fallback={<LoadFallback />}>
          <VisionSection />
        </Suspense>
      )}
    </div>
  );
};

export default LazyVisionSection;
