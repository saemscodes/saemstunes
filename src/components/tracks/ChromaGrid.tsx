import { useRef, useEffect, useState, useCallback } from "react";
import { Play, ExternalLink, Clock, Heart, X } from "lucide-react";
import { useAudioPlayer } from "@/context/AudioPlayerContext";

interface ChromaGridItem {
  image: string;
  title: string;
  subtitle: string;
  handle?: string;
  borderColor?: string;
  gradient?: string;
  url?: string;
  location?: string;
  audioUrl?: string;
  duration?: string;
  youtubeUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  backgroundGradient?: string;
  likes?: number;
  views?: number;
}

interface ChromaGridProps {
  items?: ChromaGridItem[];
  className?: string;
  radius?: number;
  damping?: number;
  fadeOut?: number;
  ease?: string;
}

const getYouTubeVideoId = (url: string): string | null => {
  const patterns = [
    /youtu\.be\/([^#&?]{11})/,
    /youtube\.com\/shorts\/([^#&?]{11})/,
    /youtube\.com\/watch\?v=([^#&?]{11})/,
    /youtube\.com\/embed\/([^#&?]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
};

export const ChromaGrid = ({
  items,
  className = "",
  radius = 300,
}: ChromaGridProps) => {
  const { playTrack } = useAudioPlayer();
  const rootRef = useRef<HTMLDivElement>(null);
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [previewItem, setPreviewItem] = useState<ChromaGridItem | null>(null);

  const parseDuration = useCallback((str: string): number => {
    const [mins, secs] = str.split(":").map(Number);
    return mins * 60 + secs;
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const demo: ChromaGridItem[] = [
    {
      image: "https://i.pravatar.cc/300?img=8",
      title: "Alex Rivera",
      subtitle: "Full Stack Developer",
      handle: "@alexrivera",
      borderColor: "#4F46E5",
      gradient: "linear-gradient(145deg, #4F46E5, #000)",
      url: "https://github.com/",
      duration: "3:45",
      audioUrl: "https://example.com/track1.mp3",
      likes: 120,
      views: 1500,
    },
    {
      image: "https://i.pravatar.cc/300?img=11",
      title: "Jordan Chen",
      subtitle: "DevOps Engineer",
      handle: "@jordanchen",
      borderColor: "#10B981",
      gradient: "linear-gradient(210deg, #10B981, #000)",
      url: "https://linkedin.com/in/",
      duration: "4:12",
      audioUrl: "https://example.com/track2.mp3",
      likes: 85,
      views: 3200,
    },
    {
      image: "https://i.pravatar.cc/300?img=3",
      title: "Morgan Blake",
      subtitle: "UI/UX Designer",
      handle: "@morganblake",
      borderColor: "#F59E0B",
      gradient: "linear-gradient(165deg, #F59E0B, #000)",
      url: "https://dribbble.com/",
      duration: "2:58",
      audioUrl: "https://example.com/track3.mp3",
      likes: 210,
      views: 4800,
    },
    {
      image: "https://i.pravatar.cc/300?img=16",
      title: "Casey Park",
      subtitle: "Data Scientist",
      handle: "@caseypark",
      borderColor: "#EF4444",
      gradient: "linear-gradient(195deg, #EF4444, #000)",
      url: "https://kaggle.com/",
      duration: "3:21",
      audioUrl: "https://example.com/track4.mp3",
      likes: 75,
      views: 2100,
    },
    {
      image: "https://i.pravatar.cc/300?img=25",
      title: "Sam Kim",
      subtitle: "Mobile Developer",
      handle: "@thesamkim",
      borderColor: "#8B5CF6",
      gradient: "linear-gradient(225deg, #8B5CF6, #000)",
      url: "https://github.com/",
      duration: "4:05",
      audioUrl: "https://example.com/track5.mp3",
      likes: 180,
      views: 5600,
    },
    {
      image: "https://i.pravatar.cc/300?img=60",
      title: "Tyler Rodriguez",
      subtitle: "Cloud Architect",
      handle: "@tylerrod",
      borderColor: "#06B6D4",
      gradient: "linear-gradient(135deg, #06B6D4, #000)",
      url: "https://aws.amazon.com/",
      duration: "3:33",
      audioUrl: "https://example.com/track6.mp3",
      likes: 95,
      views: 3900,
    },
  ];

  const data = items?.length ? items : demo;

  const handleCardClick = useCallback((url?: string) => {
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }, []);

  const handleCardMove = useCallback((e: React.MouseEvent) => {
    const card = e.currentTarget as HTMLElement;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty("--mouse-x", `${x}px`);
    card.style.setProperty("--mouse-y", `${y}px`);
  }, []);

  const handlePlayButtonClick = useCallback((e: React.MouseEvent, item: ChromaGridItem) => {
    e.stopPropagation();
    setPreviewItem(item);
  }, []);

  const handlePlayAudio = useCallback(() => {
    if (!previewItem) return;

    setPreviewItem(null);

    playTrack({
      id: previewItem.audioUrl!,
      src: previewItem.audioUrl!,
      name: previewItem.title,
      artist: previewItem.subtitle,
      artwork: previewItem.image,
    });
  }, [previewItem, playTrack]);

  return (
    <div
      ref={rootRef}
      className={`chroma-grid-enhanced ${className}`}
      style={{ "--r": `${radius}px` } as React.CSSProperties}
    >
      {previewItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center p-4 md:pb-[4.5rem]">
          <div className="bg-card text-foreground rounded-2xl max-w-2xl w-full overflow-hidden border border-border shadow-xl relative">
            <button
              className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white rounded-full p-2 hover:bg-black/80 transition-all z-[60] border border-white/20 active:scale-90"
              onClick={(e) => {
                e.stopPropagation();
                setPreviewItem(null);
              }}
              aria-label="Close preview"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Responsive aspect ratio container */}
            <div className="relative pb-[56.25%] h-0">
              {previewItem.youtubeUrl ? (
                (() => {
                  const videoId = getYouTubeVideoId(previewItem.youtubeUrl);
                  const isShorts = previewItem.youtubeUrl.includes('/shorts/');

                  return (
                    <div className={`absolute inset-0 w-full h-full ${isShorts ? "flex items-center justify-center" : ""}`}>
                      {videoId ? (
                        <iframe
                          src={`https://www.youtube.com/embed/${videoId}`}
                          className={`w-full h-full ${isShorts ? "max-w-full max-h-full aspect-video" : ""}`}
                          style={{
                            aspectRatio: isShorts ? "9/16" : "16/9"
                          }}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                      ) : (
                        <div className="w-full h-full bg-black flex items-center justify-center">
                          <p className="text-white">Invalid YouTube URL</p>
                        </div>
                      )}
                    </div>
                  );
                })()
              ) : (
                <div className="absolute inset-0 w-full h-full flex items-center justify-center">
                  <img
                    src={previewItem.image}
                    alt={previewItem.title}
                    className="w-full h-full object-cover opacity-70"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-black/50 rounded-full p-6 backdrop-blur-sm">
                      <Play className="h-16 w-16 text-primary fill-primary" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row gap-4 md:gap-6">
                <div className="flex-1">
                  <h2 className="text-xl md:text-2xl font-bold mb-1 md:mb-2">
                    {previewItem.title}
                  </h2>
                  <p className="text-muted-foreground text-sm md:text-base mb-2 md:mb-4">
                    {previewItem.subtitle}
                  </p>
                  {previewItem.duration && (
                    <div className="flex items-center text-muted-foreground text-xs md:text-sm gap-1 md:gap-2">
                      <Clock className="h-3 w-3 md:h-4 md:w-4" />
                      <span>Duration: {previewItem.duration}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 md:gap-3 mt-2 md:mt-0">
                  <button
                    onClick={handlePlayAudio}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2 md:py-3 px-4 md:px-6 rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    <Play className="h-4 w-4 md:h-5 md:w-5" />
                    <span className="text-sm md:text-base">Play Audio</span>
                  </button>

                  {previewItem.audioUrl && (
                    <button
                      onClick={() => window.open(previewItem.audioUrl, "_blank")}
                      className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-medium py-2 md:py-3 px-4 md:px-6 rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                      <ExternalLink className="h-4 w-4 md:h-5 md:w-5" />
                      <span className="text-sm md:text-base">Audio Source</span>
                    </button>
                  )}

                  {previewItem.youtubeUrl && (
                    <button
                      onClick={() => window.open(previewItem.youtubeUrl, "_blank")}
                      className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 md:py-3 px-4 md:px-6 rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                      <ExternalLink className="h-4 w-4 md:h-5 md:w-5" />
                      <span className="text-sm md:text-base">Watch on YouTube</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 w-full">
        {data.map((item, i) => (
          <article
            key={i}
            className="chroma-card-enhanced group relative overflow-hidden rounded-xl cursor-pointer transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            onMouseMove={handleCardMove}
            onMouseEnter={() => setHoveredItem(i)}
            onMouseLeave={() => setHoveredItem(null)}
            onClick={() => handleCardClick(item.url)}
            style={{
              "--card-border": item.borderColor || "transparent",
              "--card-gradient": item.gradient,
              background: item.gradient || "linear-gradient(145deg, #333, #000)",
            } as React.CSSProperties}
          >
            <div className="aspect-square relative overflow-hidden">
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 rounded-lg"
              />

              <div className={`absolute inset-0 bg-black/70 transition-opacity duration-300 flex items-center justify-center ${isMobile ? 'opacity-0' : hoveredItem === i ? 'opacity-100' : 'opacity-0'
                }`}>
                <div className="flex gap-3">
                  {(item.audioUrl || item.youtubeUrl) && (
                    <button
                      onClick={(e) => handlePlayButtonClick(e, item)}
                      className="bg-white/20 backdrop-blur-sm rounded-full p-3 hover:bg-white/30 transition-colors"
                    >
                      <Play className="h-6 w-6 text-white fill-white" />
                    </button>
                  )}
                  {item.url && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(item.url, "_blank", "noopener,noreferrer");
                      }}
                      className="bg-white/20 backdrop-blur-sm rounded-full p-3 hover:bg-white/30 transition-colors"
                    >
                      <ExternalLink className="h-6 w-6 text-white" />
                    </button>
                  )}
                </div>
              </div>

              {item.duration && (
                <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm rounded-full px-2 py-1 text-xs text-white flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {item.duration}
                </div>
              )}
            </div>

            <div className={`p-4 transition-all duration-300 ${isMobile
                ? 'opacity-100 translate-y-0'
                : hoveredItem === i
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-60 translate-y-2'
              }`}>
              <h3 className="font-bold text-white text-lg mb-1 line-clamp-1">
                {item.title}
              </h3>

              <p className="text-white/80 text-sm mb-2 line-clamp-1">
                {item.subtitle}
              </p>

              {item.handle && (
                <p className="text-white/60 text-xs mb-3">
                  {item.handle}
                </p>
              )}

              {isMobile && (item.likes !== undefined || item.views !== undefined) && (
                <div className="flex items-center gap-3 mt-2 text-xs text-white/60">
                  {item.likes !== undefined && (
                    <span className="flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      {item.likes}
                    </span>
                  )}
                  {item.views !== undefined && (
                    <span className="flex items-center gap-1">
                      <Play className="h-3 w-3" />
                      {item.views.toLocaleString()}
                    </span>
                  )}
                </div>
              )}

              {isMobile && (
                <div className="flex gap-2 mt-3">
                  {(item.audioUrl || item.youtubeUrl) && (
                    <button
                      className="flex-1 bg-white/20 backdrop-blur-sm rounded-lg py-2 px-3 text-white text-sm font-medium hover:bg-white/30 transition-colors flex items-center justify-center gap-2"
                      onClick={(e) => handlePlayButtonClick(e, item)}
                    >
                      <Play className="h-4 w-4" />
                      Preview
                    </button>
                  )}
                  {item.url && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(item.url, "_blank", "noopener,noreferrer");
                      }}
                      className="flex-1 md:flex-none bg-white/20 backdrop-blur-sm rounded-lg py-2 px-3 text-white text-sm font-medium hover:bg-white/30 transition-colors flex items-center justify-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Visit
                    </button>
                  )}
                </div>
              )}

              {!isMobile && hoveredItem === i && (
                <div className="mt-3 space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
                  {item.location && (
                    <p className="text-white/60 text-xs">
                      📍 {item.location}
                    </p>
                  )}

                  {(item.likes !== undefined || item.views !== undefined) && (
                    <div className="flex items-center gap-4 text-white/60 text-xs">
                      {item.likes !== undefined && (
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          {item.likes}
                        </span>
                      )}
                      {item.views !== undefined && (
                        <span className="flex items-center gap-1">
                          <Play className="h-3 w-3" />
                          {item.views.toLocaleString()}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div
              className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
              style={{
                background: `linear-gradient(45deg, transparent 30%, ${item.borderColor || '#fff'} 50%, transparent 70%)`,
                mask: `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
                WebkitMask: `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
                maskComposite: 'exclude',
                WebkitMaskComposite: 'xor',
                padding: '2px',
              }}
            />
          </article>
        ))}
      </div>

      <style>{`
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        @keyframes animate-in {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-in {
          animation: animate-in 0.2s ease-out;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .fade-in {
          animation: fadeIn 0.2s ease-out;
        }
        
        @keyframes slideInFromBottom {
          from { transform: translateY(8px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        .slide-in-from-bottom-2 {
          animation: slideInFromBottom 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ChromaGrid;
