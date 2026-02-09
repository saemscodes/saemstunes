import { useRef, useState, useEffect } from 'react';
import './AnimatedList.css';

interface AnimatedItemProps {
  children: React.ReactNode;
  delay?: number;
  index: number;
  onMouseEnter: () => void;
  onClick: () => void;
  isVisible: boolean;
}

const AnimatedItem = ({ children, delay = 0, index, onMouseEnter, onClick, isVisible }: AnimatedItemProps) => {
  return (
    <div
      data-index={index}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      className={`transform transition-all duration-200 cursor-pointer mb-4 ${isVisible
        ? 'scale-100 opacity-100'
        : 'scale-75 opacity-0'
        }`}
      style={{
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
};

interface AnimatedListProps {
  items?: any[];
  onItemSelect?: (item: any, index: number) => void;
  showGradients?: boolean;
  enableArrowNavigation?: boolean;
  className?: string;
  itemClassName?: string;
  displayScrollbar?: boolean;
  initialSelectedIndex?: number;
  maxHeight?: string;
}

const AnimatedList = ({
  items = [
    'Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5',
    'Item 6', 'Item 7', 'Item 8', 'Item 9', 'Item 10',
    'Item 11', 'Item 12', 'Item 13', 'Item 14', 'Item 15'
  ],
  onItemSelect,
  showGradients = true,
  enableArrowNavigation = true,
  className = '',
  itemClassName = '',
  displayScrollbar = true,
  initialSelectedIndex = -1,
  maxHeight = '70vh'
}: AnimatedListProps) => {
  const listRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(initialSelectedIndex);
  const [keyboardNav, setKeyboardNav] = useState(false);
  const [topGradientOpacity, setTopGradientOpacity] = useState(0);
  const [bottomGradientOpacity, setBottomGradientOpacity] = useState(1);
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set());

  // Intersection Observer for visibility detection
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        setVisibleItems(prev => {
          const newSet = new Set(prev);
          entries.forEach(entry => {
            const index = parseInt(entry.target.getAttribute('data-index') || '0');
            if (entry.isIntersecting) {
              newSet.add(index);
            } else {
              newSet.delete(index);
            }
          });
          return newSet;
        });
      },
      {
        threshold: 0.1,
        rootMargin: '50px 0px'
      }
    );

    if (listRef.current) {
      const items = listRef.current.querySelectorAll('[data-index]');
      items.forEach(item => observer.observe(item));
    }

    return () => observer.disconnect();
  }, [items]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    setTopGradientOpacity(Math.min(scrollTop / 50, 1));
    const bottomDistance = scrollHeight - (scrollTop + clientHeight);
    setBottomGradientOpacity(
      scrollHeight <= clientHeight ? 0 : Math.min(bottomDistance / 50, 1)
    );
  };

  useEffect(() => {
    if (!enableArrowNavigation) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) {
        e.preventDefault();
        setKeyboardNav(true);
        setSelectedIndex((prev) => Math.min(prev + 1, items.length - 1));
      } else if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
        e.preventDefault();
        setKeyboardNav(true);
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        if (selectedIndex >= 0 && selectedIndex < items.length) {
          e.preventDefault();
          if (onItemSelect) {
            onItemSelect(items[selectedIndex], selectedIndex);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, selectedIndex, onItemSelect, enableArrowNavigation]);

  useEffect(() => {
    if (!keyboardNav || selectedIndex < 0 || !listRef.current) return;
    const container = listRef.current;
    const selectedItem = container.querySelector(`[data-index="${selectedIndex}"]`) as HTMLElement;
    if (selectedItem) {
      const extraMargin = 50;
      const containerScrollTop = container.scrollTop;
      const containerHeight = container.clientHeight;
      const itemTop = selectedItem.offsetTop;
      const itemBottom = itemTop + selectedItem.offsetHeight;
      if (itemTop < containerScrollTop + extraMargin) {
        container.scrollTo({ top: itemTop - extraMargin, behavior: 'smooth' });
      } else if (itemBottom > containerScrollTop + containerHeight - extraMargin) {
        container.scrollTo({
          top: itemBottom - containerHeight + extraMargin,
          behavior: 'smooth',
        });
      }
    }
    setKeyboardNav(false);
  }, [selectedIndex, keyboardNav]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full max-w-full overflow-hidden ${className}`}
      style={{
        maxHeight,
        minHeight: '200px',
        backgroundColor: 'hsl(var(--background))'
      }}
    >
      <div
        ref={listRef}
        className={`h-full overflow-y-auto px-4 py-2 animated-list-scrollbar ${!displayScrollbar ? 'scrollbar-hide' : ''
          }`}
        onScroll={handleScroll}
      >
        {items.map((item, index) => (
          <AnimatedItem
            key={index}
            delay={Math.min(index * 50, 500)}
            index={index}
            isVisible={visibleItems.has(index)}
            onMouseEnter={() => setSelectedIndex(index)}
            onClick={() => {
              setSelectedIndex(index);
              if (onItemSelect) {
                onItemSelect(item, index);
              }
            }}
          >
            <div
              className={`p-4 rounded-lg border-2 transition-all duration-200 ${selectedIndex === index
                ? 'bg-accent/10 dark:bg-accent/20 border-primary shadow-md transform scale-105'
                : 'bg-card dark:bg-card border-border hover:border-accent/50 hover:shadow-sm'
                } ${itemClassName}`}
              style={{
                backgroundColor: selectedIndex === index
                  ? 'hsl(43 60% 45% / 0.1)'
                  : 'hsl(var(--card))',
                borderColor: selectedIndex === index
                  ? 'hsl(43 100% 33%)'
                  : 'hsl(var(--border))',
                color: 'hsl(var(--card-foreground))'
              }}
            >
              {typeof item === 'object' && item !== null ? (
                <div className="flex items-center gap-4">
                  {(item as any).image && (
                    <img
                      src={(item as any).image}
                      alt={(item as any).title || 'Item'}
                      className="w-12 h-12 rounded-full object-cover border border-primary/20"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm md:text-base truncate">
                      {(item as any).title || (item as any).name || 'Untitled'}
                    </p>
                    {(item as any).subtitle && (
                      <p className="text-xs text-muted-foreground truncate">
                        {(item as any).subtitle}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="font-medium text-sm md:text-base break-words">
                  {String(item)}
                </p>
              )}
            </div>
          </AnimatedItem>
        ))}
      </div>

      {showGradients && (
        <>
          <div
            className="absolute top-0 left-0 right-0 h-8 pointer-events-none z-10"
            style={{
              opacity: topGradientOpacity,
              background: 'linear-gradient(to bottom, hsl(var(--background)), transparent)'
            }}
          />
          <div
            className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none z-10"
            style={{
              opacity: bottomGradientOpacity,
              background: 'linear-gradient(to top, hsl(var(--background)), transparent)'
            }}
          />
        </>
      )}
    </div>
  );
};

export default AnimatedList;
