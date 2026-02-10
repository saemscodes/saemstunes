import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import { Helmet } from "react-helmet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWindowSize } from "@uidotdev/usehooks";
import InteractiveGuitar from "@/components/ui/InteractiveGuitar";
import InteractivePiano from "@/components/ui/InteractivePiano";
import Metronome from "@/components/music-tools/Metronome";
import PitchFinder from "@/components/music-tools/PitchFinder";
import ToolSuggestionForm from "@/components/music-tools/ToolSuggestionForm";
import {
  Music,
  Lightbulb,
  Piano,
  Guitar,
  Timer,
  Mic,
  Volume2,
  RotateCcw,
  Smartphone,
  Tablet,
  Lock,
  Crown,
  Loader2,
  Sparkles,
  ChevronRight,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { UpgradePromptModal } from "@/components/auth/UpgradePromptModal";
import { useUserProgress } from "@/hooks/useUserProgress";
import { useAccessMatrix, AccessFeature } from "@/hooks/useAccessMatrix";

// ============================================================================
// PREMIUM MUSIC TOOLS PAGE
// Preserves ALL existing functionality while enhancing with premium UI
// ============================================================================

// Custom hook for responsive behavior
const useResponsiveLayout = () => {
  const windowSize = useWindowSize();

  const isMobile = windowSize.width ? windowSize.width < 768 : false;
  const isTablet = windowSize.width ? windowSize.width >= 768 && windowSize.width < 1024 : false;
  const isLandscape = windowSize.width && windowSize.height
    ? windowSize.width > windowSize.height
    : false;

  return { isMobile, isTablet, isLandscape, windowSize };
};

// Tool definitions mapping to access feature - PRESERVED WITH ALL TOOLS
const MUSIC_TOOLS = [
  {
    id: 'piano',
    name: 'Interactive Piano',
    icon: Piano,
    description: 'Learn scales, chords, and melodies',
    component: InteractivePiano,
    category: 'instruments',
    minWidth: 320, // minWidth for mobile portrait
    accessFeature: 'tool:piano' as AccessFeature,
    recommendedOrientation: 'any'
  },
  {
    id: 'guitar',
    name: 'Interactive Guitar',
    icon: Guitar,
    description: 'Practice chords and strumming patterns',
    component: InteractiveGuitar,
    category: 'instruments',
    minWidth: 400, // minWidth for mobile landscape
    accessFeature: 'tool:guitar' as AccessFeature,
    recommendedOrientation: 'landscape'
  },
  {
    id: 'metronome',
    name: 'Metronome',
    icon: Timer,
    description: 'Keep perfect time while practicing',
    component: Metronome,
    category: 'utilities',
    minWidth: 300,
    accessFeature: 'tool:metronome' as AccessFeature,
    recommendedOrientation: 'portrait'
  },
  {
    id: 'tuner',
    name: 'Pitch Finder',
    icon: Mic,
    description: 'Tune your instruments accurately',
    component: PitchFinder,
    category: 'utilities',
    minWidth: 280,
    accessFeature: 'tool:tuner' as AccessFeature,
    recommendedOrientation: 'portrait'
  },
  {
    id: 'suggest-tool',
    name: 'Suggest a Tool',
    icon: Lightbulb,
    description: 'Have an idea for a new tool?',
    component: ToolSuggestionForm,
    category: 'feedback',
    minWidth: 300,
    accessFeature: 'community:post' as AccessFeature,
    recommendedOrientation: 'any',
    props: { adminEmail: "contact@saemstunes.com" }
  }
];

// Premium Orientation Guide Component
const OrientationGuide = ({ tool, onDismiss }: { tool: typeof MUSIC_TOOLS[0] | undefined, onDismiss: () => void }) => {
  if (!tool || tool.recommendedOrientation === 'any') return null;

  const isLandscapeRecommended = tool.recommendedOrientation === 'landscape';

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className="bg-amber-50/10 backdrop-blur-xl border border-amber-500/20 rounded-2xl p-4 mb-6"
    >
      <div className="flex items-center gap-3">
        {isLandscapeRecommended ? (
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <Smartphone className="h-5 w-5 text-amber-400 transform rotate-90" />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <Tablet className="h-5 w-5 text-amber-400" />
          </div>
        )}
        <div className="flex-1">
          <p className="text-sm text-amber-200 font-medium">
            <strong className="text-amber-400">Pro Tip:</strong> {tool.name} works best in{' '}
            <strong className="text-amber-300">{tool.recommendedOrientation}</strong> orientation for the optimal experience.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 rounded-xl"
        >
          ×
        </Button>
      </div>
    </motion.div>
  );
};

// Premium Tool Card Component
const ToolCard = ({
  tool,
  isActive,
  onClick,
  isOptimal,
  isLocked
}: {
  tool: typeof MUSIC_TOOLS[0],
  isActive: boolean,
  onClick: () => void,
  isOptimal: boolean,
  isLocked: boolean
}) => (
  <motion.div
    whileHover={{ scale: 1.02, y: -2 }}
    whileTap={{ scale: 0.98 }}
    transition={{ type: "spring", stiffness: 400, damping: 25 }}
  >
    <Card
      className={`cursor-pointer transition-all duration-300 relative overflow-hidden h-full ${isActive
        ? 'ring-2 ring-primary bg-primary/5 border-primary/50 shadow-[0_0_30px_rgba(166,124,0,0.15)]'
        : 'hover:shadow-lg hover:bg-white/5 border-white/10 hover:border-white/20'
        } ${isLocked ? 'opacity-70 grayscale-[0.3]' : ''}`}
      onClick={onClick}
    >
      {/* Lock indicator */}
      {isLocked && (
        <div className="absolute top-3 right-3 z-10">
          <div className="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center">
            <Lock className="h-3 w-3 text-gold" />
          </div>
        </div>
      )}

      {/* Premium gradient overlay when active */}
      {isActive && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none" />
      )}

      <CardHeader className="p-5">
        <div className="flex flex-col gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${isActive
            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
            : 'bg-white/5 text-primary border border-white/10'
            }`}>
            <tool.icon className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-lg font-bold text-white">{tool.name}</CardTitle>
              {isLocked && <Crown className="h-3.5 w-3.5 text-gold" />}
            </div>
            <p className="text-sm text-gray-400 line-clamp-2">{tool.description}</p>
          </div>
        </div>
        {!isOptimal && (
          <div className="mt-3">
            <Badge variant="outline" className="text-[10px] uppercase tracking-wider bg-amber-500/10 text-amber-400 border-amber-500/20">
              Optimal on Desktop
            </Badge>
          </div>
        )}
      </CardHeader>
    </Card>
  </motion.div>
);

const MusicTools = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const { isMobile, isLandscape, windowSize } = useResponsiveLayout();
  const { hasAccess, getRequiredTier } = useAccessMatrix();
  const { useStartSession } = useUserProgress();
  const startSession = useStartSession();

  const [activeTool, setActiveTool] = useState(searchParams.get('tool') || 'piano');
  const [showOrientationGuide, setShowOrientationGuide] = useState(true);
  const [resetKey, setResetKey] = useState(0);
  const [upgradeModal, setUpgradeModal] = useState({ isOpen: false, tier: 'free' as any });
  const scrollRef = useRef<HTMLDivElement>(null);

  // Check if we need to open the suggest-a-tool tab from navigation state
  useEffect(() => {
    if (location.state?.openSuggestTool) {
      setActiveTool("suggest-tool");
      setSearchParams({ tool: "suggest-tool" });
    }
  }, [location.state]);

  // Get current tool
  const currentTool = MUSIC_TOOLS.find(tool => tool.id === activeTool);
  const CurrentComponent = currentTool?.component;

  // Check if current screen size is optimal for the tool
  const isOptimalSize = currentTool
    ? (windowSize.width || 0) >= currentTool.minWidth
    : true;

  const isOptimalOrientation = currentTool
    ? currentTool.recommendedOrientation === 'any' ||
    (currentTool.recommendedOrientation === 'landscape' && isLandscape) ||
    (currentTool.recommendedOrientation === 'portrait' && !isLandscape)
    : true;

  // Sync with URL params
  useEffect(() => {
    const toolFromParams = searchParams.get('tool');
    if (toolFromParams && MUSIC_TOOLS.find(t => t.id === toolFromParams)) {
      setActiveTool(toolFromParams);
    }
  }, [searchParams]);

  const handleToolChange = (toolId: string) => {
    const tool = MUSIC_TOOLS.find(t => t.id === toolId);
    if (!tool) return;

    // Check access permissions
    if (!hasAccess(tool.accessFeature)) {
      setUpgradeModal({ isOpen: true, tier: getRequiredTier(tool.accessFeature) });
      return;
    }

    setActiveTool(toolId);
    setSearchParams({ tool: toolId });
    setResetKey(prev => prev + 1);

    // Track session start for analytics
    startSession.mutate({
      sessionType: 'tool',
      toolsUsed: [toolId]
    });

    // Reset audio contexts to prevent overlap
    window.dispatchEvent(new CustomEvent('reset-guitar'));
    window.dispatchEvent(new CustomEvent('reset-piano'));

    // Auto-scroll mobile switcher to active tool
    if (isMobile && scrollRef.current) {
      const element = document.getElementById(`mobile-btn-${toolId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  };

  const handleReset = () => {
    setResetKey(prev => prev + 1);
    window.dispatchEvent(new CustomEvent('reset-guitar'));
    window.dispatchEvent(new CustomEvent('reset-piano'));
  };

  // Group tools by category for sidebar
  const categories = {
    instruments: MUSIC_TOOLS.filter(t => t.category === 'instruments'),
    utilities: MUSIC_TOOLS.filter(t => t.category === 'utilities'),
    feedback: MUSIC_TOOLS.filter(t => t.category === 'feedback')
  };

  return (
    <>
      <Helmet>
        <title>Music Tools - Saem's Tunes</title>
        <meta name="description" content="Interactive music tools for learning and practice. Features guitar, piano, metronome, and tuner." />
      </Helmet>

      <MainLayout>
        <div className="min-h-screen bg-[#0A0B0C] pb-24 lg:pb-0">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">

            {/* Premium Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
              <div className="space-y-2">
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest"
                >
                  <Music className="h-3 w-3" />
                  Practice Hub
                </motion.div>
                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-4xl sm:text-5xl font-black text-white tracking-tighter"
                >
                  Tools & <span className="text-primary">Instruments</span>
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-gray-400 max-w-lg"
                >
                  Level up your skills with our mathematically accurate virtual instruments and essential practice utilities.
                </motion.p>
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-3"
              >
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleReset}
                  className="bg-white/5 border-white/10 hover:bg-white/10 text-white rounded-2xl h-14 px-8 font-bold"
                >
                  <RotateCcw className="h-5 w-5 mr-3" />
                  Refresh
                </Button>
              </motion.div>
            </div>

            {/* Mobile Tab Switcher - Premium iOS-style scrollable bar */}
            <div className="md:hidden sticky top-0 z-50 -mx-4 px-4 py-4 bg-[#0A0B0C]/80 backdrop-blur-xl border-b border-white/5 mb-8">
              <div
                ref={scrollRef}
                className="flex gap-2 overflow-x-auto no-scrollbar"
              >
                {MUSIC_TOOLS.map((tool) => {
                  const locked = !hasAccess(tool.accessFeature);
                  const active = activeTool === tool.id;
                  return (
                    <motion.button
                      id={`mobile-btn-${tool.id}`}
                      key={tool.id}
                      onClick={() => handleToolChange(tool.id)}
                      whileTap={{ scale: 0.95 }}
                      className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all whitespace-nowrap border ${active
                        ? 'bg-primary border-primary text-white shadow-xl shadow-primary/20 scale-[1.02]'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                        } ${locked ? 'opacity-80' : ''}`}
                    >
                      <tool.icon className={`h-4 w-4 ${active ? 'text-white' : 'text-primary'}`} />
                      {tool.name}
                      {locked && <Lock className="h-3 w-3 ml-1 text-gold" />}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              {/* Desktop Sidebar Tool Selection */}
              <div className="hidden md:block md:col-span-4 space-y-8">
                {Object.entries(categories).map(([name, tools]) => (
                  <motion.div
                    key={name}
                    className="space-y-4"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * Object.keys(categories).indexOf(name) }}
                  >
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 px-1 flex items-center gap-2">
                      <Sparkles className="h-3 w-3 text-primary/50" />
                      {name}
                    </h3>
                    <div className="space-y-3">
                      {tools.map((tool) => (
                        <ToolCard
                          key={tool.id}
                          tool={tool}
                          isActive={activeTool === tool.id}
                          isLocked={!hasAccess(tool.accessFeature)}
                          onClick={() => handleToolChange(tool.id)}
                          isOptimal={(windowSize.width || 0) >= tool.minWidth}
                        />
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Main Tool Content Area */}
              <div className="md:col-span-8 flex flex-col gap-6">
                {/* Orientation Guide */}
                <AnimatePresence mode="wait">
                  {showOrientationGuide && !isOptimalOrientation && (
                    <OrientationGuide
                      tool={currentTool}
                      onDismiss={() => setShowOrientationGuide(false)}
                    />
                  )}
                </AnimatePresence>

                {/* Screen Size Warning */}
                {!isOptimalSize && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 mb-2"
                  >
                    <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
                      <div className="max-w-xs w-full p-8 rounded-[2.5rem] bg-[#121417] border border-white/10 text-center shadow-2xl">
                        <Zap className="h-12 w-12 text-gold mx-auto mb-6 animate-pulse" />
                        <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tighter">Expand View</h3>
                        <p className="text-sm text-gray-500 font-medium leading-relaxed">
                          This professional tool requires a slightly larger display for the best experience. Try rotating your device or using a tablet.
                        </p>
                        <Button
                          variant="outline"
                          className="mt-8 border-gold/20 text-gold hover:bg-gold/10 rounded-xl font-bold text-[10px] uppercase tracking-widest"
                          onClick={() => window.location.reload()}
                        >
                          Refresh View
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Tool Container - Premium Glass Card */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                  className="w-full min-h-[300px] md:min-h-[500px] rounded-[2rem] md:rounded-[2.5rem] bg-[#121417] border border-white/5 shadow-2xl relative group overflow-hidden"
                >
                  <div className="absolute inset-0 overflow-auto scrollbar-hide py-10 px-4 md:p-0">
                    <div className="min-w-fit md:min-w-0 md:h-full md:w-full flex items-center justify-center">

                      {/* Tool Component */}
                      <AnimatePresence mode="wait">
                        {CurrentComponent && (
                          <motion.div
                            key={`${activeTool}-${resetKey}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="relative h-full w-full"
                          >
                            {currentTool?.props ? (
                              <CurrentComponent {...currentTool.props} />
                            ) : (
                              <CurrentComponent adminEmail="contact@saemstunes.com" />
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>

                {/* Status Bar - Premium footer */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-center justify-between px-6 py-4 bg-white/5 rounded-2xl border border-white/10"
                >
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-lg shadow-green-500/50" />
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">System Ready</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Volume2 className="h-3.5 w-3.5 text-gray-500" />
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Audio: 44.1kHz</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Current:</span>
                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{currentTool?.name}</span>
                  </div>
                </motion.div>

                {/* Quick Tips Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="p-6 bg-white/[0.02] rounded-2xl border border-white/5"
                >
                  <h3 className="font-bold text-white mb-4 flex items-center gap-2 text-sm">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Quick Tips
                  </h3>
                  <ul className="text-sm text-gray-400 space-y-2">
                    <li className="flex items-start gap-2">
                      <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      Use headphones for the best audio experience
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      {isMobile ? 'Tap' : 'Click'} the reset button to clear all active notes
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      Guitar: Swipe vertically to strum, {isMobile ? 'tap' : 'click'} frets to play individual notes
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      Piano: Hold keys longer for different note durations
                    </li>
                  </ul>
                </motion.div>
              </div>
            </div>

            {/* Upgrade Modal - PRESERVED */}
            <UpgradePromptModal
              isOpen={upgradeModal.isOpen}
              onClose={() => setUpgradeModal({ ...upgradeModal, isOpen: false })}
              requiredTier={upgradeModal.tier}
              featureName={MUSIC_TOOLS.find(t => t.id === activeTool)?.name}
            />
          </div>
        </div>
      </MainLayout>
    </>
  );
};

export default MusicTools;
