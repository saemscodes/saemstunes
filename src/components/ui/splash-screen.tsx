import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Loader2, Music, Play, Headphones, Volume2, Sparkles } from "lucide-react";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "framer-motion";

// ============================================================================
// ULTIMATE iOS-INSPIRED PREMIUM SPLASH SCREEN
// Deep liquid animations, smooth easings, brand-aligned colors from index.css
// ============================================================================

// Premium iOS-style cubic-bezier easings
const EASINGS = {
  // iOS system spring - ultra smooth
  iosSpring: [0.23, 1, 0.32, 1] as const,
  // iOS decelerate - smooth slow down
  iosDecelerate: [0.0, 0.0, 0.2, 1] as const,
  // iOS accelerate - smooth ramp up
  iosAccelerate: [0.4, 0.0, 1, 1] as const,
  // Liquid/organic feel
  liquid: [0.76, 0, 0.24, 1] as const,
  // Ultra premium bounce
  premiumBounce: [0.34, 1.56, 0.64, 1] as const,
  // Smooth modal entrance
  modalIn: [0.16, 1, 0.3, 1] as const,
  // Standard material
  standard: [0.4, 0.0, 0.2, 1] as const,
};

// Brand colors from index.css - Gold and Brown Theme
const THEME_COLORS = {
  // Primary gold colors (HSL 43 100% 33%)
  gold: "#A67C00",
  goldLight: "#D4A936", // HSL 48 100% 52%
  goldDark: "#7A5A00", // HSL 43 100% 24%
  goldRgb: "166, 124, 0",
  goldLightRgb: "212, 169, 54",
  goldDarkRgb: "122, 90, 0",
  // Brown colors (HSL 20 14% 21%)
  brown: "#3D3633",
  brownLight: "#59504A", // HSL 20 14% 35%
  brownDark: "#1A1614", // HSL 20 14% 8%
  brownRgb: "61, 54, 51",
  // Dark background for premium feel
  bgDark: "#0A0908",
  bgCard: "#1A1614",
};

// Animation timing configurations
const ANIMATION_TIMING = {
  // Fast micro-interactions
  micro: 0.15,
  // Standard transitions
  standard: 0.3,
  // Smooth entrances
  entrance: 0.6,
  // Premium slow reveals
  reveal: 1.2,
  // Liquid morphs
  liquid: 2.5,
};

interface SplashScreenProps {
  loading?: boolean;
  message?: string;
  onFinish?: () => void;
}

const SplashScreen = ({
  loading = true,
  message = "Loading your music...",
  onFinish,
}: SplashScreenProps) => {
  const [showSplash, setShowSplash] = useState(true);
  const [progress, setProgress] = useState(0);
  const [showParticles, setShowParticles] = useState(false);
  const [currentMessage, setCurrentMessage] = useState(0);
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [phaseComplete, setPhaseComplete] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Spring-based progress for ultra-smooth animation
  const springProgress = useSpring(0, { damping: 30, stiffness: 100 });

  // Premium loading messages with music theme
  const loadingMessages = useMemo(() => [
    "Orchestrating the experience...",
    "Tuning the virtual fretboard...",
    "Harmonizing with Christ...",
    "Preparing your studio...",
    "Setting the stage...",
  ], []);

  // Memoized particle system - creates floating musical particles
  const particles = useMemo(() =>
    Array.from({ length: 25 }, (_, i) => ({
      id: i,
      size: Math.random() * 6 + 2,
      x: Math.random() * 100,
      y: Math.random() * 100,
      duration: Math.random() * 8 + 6,
      delay: Math.random() * 3,
      opacity: Math.random() * 0.4 + 0.1,
      blur: Math.random() * 2,
    })), []);

  // Floating music icons configuration
  const musicIcons = useMemo(() => {
    const icons = [Music, Play, Headphones, Volume2, Sparkles];
    return Array.from({ length: 8 }, (_, i) => ({
      id: i,
      Icon: icons[i % icons.length],
      x: (Math.random() - 0.5) * 120,
      y: 30 + Math.random() * 40,
      rotate: Math.random() * 360,
      scale: 0.5 + Math.random() * 0.5,
      duration: 4 + Math.random() * 3,
      delay: i * 0.4,
      opacity: 0.3 + Math.random() * 0.4,
    }));
  }, []);

  // Liquid orbs for background - iOS-style ambient lighting
  const liquidOrbs = useMemo(() => [
    {
      id: 1,
      size: 400,
      x: -15,
      y: -10,
      color: THEME_COLORS.gold,
      opacity: 0.12,
      duration: 12,
      blur: 120,
    },
    {
      id: 2,
      size: 350,
      x: 85,
      y: 75,
      color: THEME_COLORS.goldDark,
      opacity: 0.08,
      duration: 15,
      blur: 100,
    },
    {
      id: 3,
      size: 280,
      x: 50,
      y: 20,
      color: THEME_COLORS.goldLight,
      opacity: 0.06,
      duration: 18,
      blur: 80,
    },
    {
      id: 4,
      size: 200,
      x: 20,
      y: 80,
      color: THEME_COLORS.brown,
      opacity: 0.1,
      duration: 14,
      blur: 60,
    },
  ], []);

  // Preload the logo
  useEffect(() => {
    const img = new Image();
    img.src = "/lovable-uploads/logo-icon-md.webp";
    img.onload = () => setLogoLoaded(true);
    img.onerror = () => {
      console.warn("Logo failed to load, using fallback");
      setLogoLoaded(true);
    };
  }, []);

  // Handle splash screen exit with smooth transition
  const handleSplashExit = useCallback(() => {
    setPhaseComplete(true);
    setTimeout(() => {
      setShowSplash(false);
      onFinish?.();
    }, 800);
  }, [onFinish]);

  // Splash screen lifecycle management
  useEffect(() => {
    if (!loading) {
      springProgress.set(100);
      const timeout = setTimeout(handleSplashExit, 1000);
      return () => clearTimeout(timeout);
    } else {
      // Show particles after initial animation
      const particleTimeout = setTimeout(() => setShowParticles(true), 600);
      return () => clearTimeout(particleTimeout);
    }
  }, [loading, handleSplashExit, springProgress]);

  // Message cycling with smooth transitions
  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % loadingMessages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [loading, loadingMessages.length]);

  // Premium progress simulation with organic feel
  useEffect(() => {
    if (!loading) {
      setProgress(100);
      return;
    }
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 92) return prev;
        // Organic progress increments
        const increment = Math.random() * 8 + 2;
        const newProgress = Math.min(prev + increment, 92);
        springProgress.set(newProgress);
        return newProgress;
      });
    }, 250);
    return () => clearInterval(interval);
  }, [loading, springProgress]);

  // Liquid Orb Component - iOS-style ambient background
  const LiquidOrb = ({ orb }: { orb: typeof liquidOrbs[0] }) => (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: orb.size,
        height: orb.size,
        left: `${orb.x}%`,
        top: `${orb.y}%`,
        background: `radial-gradient(circle at 30% 30%, ${orb.color}, transparent 70%)`,
        filter: `blur(${orb.blur}px)`,
        opacity: orb.opacity,
      }}
      animate={{
        x: [0, 30, -20, 0],
        y: [0, -25, 15, 0],
        scale: [1, 1.15, 0.95, 1],
      }}
      transition={{
        duration: orb.duration,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );

  // Particle Component - floating specks
  const Particle = ({ particle }: { particle: typeof particles[0] }) => (
    <motion.div
      className="absolute rounded-full"
      style={{
        width: particle.size,
        height: particle.size,
        left: `${particle.x}%`,
        top: `${particle.y}%`,
        background: `rgba(${THEME_COLORS.goldRgb}, ${particle.opacity})`,
        filter: `blur(${particle.blur}px)`,
      }}
      animate={{
        y: [0, -150, -300],
        x: [0, Math.random() * 40 - 20, Math.random() * 60 - 30],
        opacity: [0, particle.opacity, 0],
        scale: [0.5, 1.2, 0.3],
      }}
      transition={{
        duration: particle.duration,
        repeat: Infinity,
        delay: particle.delay,
        ease: "linear",
      }}
    />
  );

  return (
    <AnimatePresence mode="wait">
      {showSplash && (
        <motion.div
          ref={containerRef}
          className="fixed inset-0 flex items-center justify-center overflow-hidden"
          style={{
            zIndex: 9999999,
            background: `linear-gradient(135deg, ${THEME_COLORS.bgDark} 0%, ${THEME_COLORS.brownDark} 50%, ${THEME_COLORS.bgDark} 100%)`,
          }}
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: 1.08,
            filter: "blur(20px)",
            transition: { duration: 0.8, ease: EASINGS.iosDecelerate },
          }}
        >
          {/* Liquid Background Orbs - iOS ambient lighting */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {liquidOrbs.map((orb) => (
              <LiquidOrb key={orb.id} orb={orb} />
            ))}
          </div>

          {/* Particle System */}
          <AnimatePresence>
            {showParticles && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {particles.map((particle) => (
                  <Particle key={particle.id} particle={particle} />
                ))}
              </div>
            )}
          </AnimatePresence>

          {/* Subtle grid pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.02] pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(rgba(${THEME_COLORS.goldRgb}, 0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(${THEME_COLORS.goldRgb}, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: "50px 50px",
            }}
          />

          {/* Main Content Container */}
          <div className="relative z-10 flex flex-col items-center px-8 max-w-lg w-full">
            {/* Logo Container with Premium Effects */}
            <motion.div
              className="relative w-36 h-36 mb-10"
              initial={{ scale: 0.8, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 1.2, ease: EASINGS.iosSpring }}
            >
              {/* Outer spinning ring with gradient */}
              <motion.div
                className="absolute -inset-6 rounded-full"
                style={{
                  background: `conic-gradient(from 0deg, transparent, ${THEME_COLORS.gold}40, transparent, ${THEME_COLORS.goldLight}30, transparent)`,
                  filter: "blur(1px)",
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              />

              {/* Pulsing glow rings */}
              {[1, 2, 3, 4].map((i) => (
                <motion.div
                  key={`pulse-${i}`}
                  className="absolute -inset-4 rounded-full border"
                  style={{ borderColor: `rgba(${THEME_COLORS.goldRgb}, 0.15)` }}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{
                    scale: [0.9, 1.6 + i * 0.15, 2 + i * 0.2],
                    opacity: [0.6, 0.15, 0],
                  }}
                  transition={{
                    duration: 3.5,
                    repeat: Infinity,
                    delay: i * 0.5,
                    ease: "easeOut",
                  }}
                />
              ))}

              {/* Inner rotating border */}
              <motion.div
                className="absolute -inset-3 rounded-full"
                style={{
                  background: `conic-gradient(from 180deg, ${THEME_COLORS.gold}, transparent, ${THEME_COLORS.goldDark}, transparent, ${THEME_COLORS.gold})`,
                  mask: "radial-gradient(circle, transparent 72%, black 73%)",
                  WebkitMask: "radial-gradient(circle, transparent 72%, black 73%)",
                }}
                animate={{ rotate: -360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              />

              {/* Logo glass container */}
              <motion.div
                className="absolute inset-0 rounded-[2.5rem] overflow-hidden"
                style={{
                  background: `linear-gradient(145deg, ${THEME_COLORS.bgCard} 0%, ${THEME_COLORS.brownDark} 100%)`,
                  border: `1px solid rgba(${THEME_COLORS.goldRgb}, 0.2)`,
                  boxShadow: `
                    0 25px 50px -12px rgba(0, 0, 0, 0.5),
                    inset 0 1px 1px rgba(255, 255, 255, 0.05),
                    0 0 60px rgba(${THEME_COLORS.goldRgb}, 0.15)
                  `,
                }}
              >
                {/* Inner glow */}
                <div
                  className="absolute inset-0 rounded-[2.5rem]"
                  style={{
                    background: `radial-gradient(circle at 30% 30%, rgba(${THEME_COLORS.goldRgb}, 0.1) 0%, transparent 60%)`,
                  }}
                />

                {/* Logo icon container */}
                <div className="absolute inset-3 flex items-center justify-center">
                  <motion.div
                    className="w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden"
                    style={{
                      background: `linear-gradient(135deg, ${THEME_COLORS.goldLight} 0%, ${THEME_COLORS.gold} 50%, ${THEME_COLORS.goldDark} 100%)`,
                      boxShadow: `
                        0 10px 30px rgba(${THEME_COLORS.goldRgb}, 0.4),
                        inset 0 1px 2px rgba(255, 255, 255, 0.3)
                      `,
                    }}
                    animate={{
                      boxShadow: [
                        `0 10px 30px rgba(${THEME_COLORS.goldRgb}, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.3)`,
                        `0 15px 45px rgba(${THEME_COLORS.goldRgb}, 0.5), inset 0 1px 2px rgba(255, 255, 255, 0.3)`,
                        `0 10px 30px rgba(${THEME_COLORS.goldRgb}, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.3)`,
                      ],
                    }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  >
                    {logoLoaded ? (
                      <img
                        src="/lovable-uploads/logo-icon-md.webp"
                        alt="Saem's Tunes"
                        className="w-full h-full object-contain p-1"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <Music className="w-10 h-10 text-white" />
                    )}
                    <Music className="w-10 h-10 text-white absolute opacity-0" />
                  </motion.div>
                </div>

                {/* Glass highlight overlay */}
                <div
                  className="absolute inset-0 rounded-[2.5rem] pointer-events-none"
                  style={{
                    background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%)",
                  }}
                />
              </motion.div>
            </motion.div>

            {/* Floating Music Icons */}
            <AnimatePresence>
              {showParticles && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  {musicIcons.map((note) => {
                    const IconComponent = note.Icon;
                    return (
                      <motion.div
                        key={note.id}
                        className="absolute top-1/2 left-1/2"
                        style={{
                          color: THEME_COLORS.gold,
                          filter: `drop-shadow(0 0 12px rgba(${THEME_COLORS.goldRgb}, 0.6))`,
                        }}
                        initial={{
                          x: note.x,
                          y: note.y,
                          rotate: note.rotate,
                          scale: 0,
                          opacity: 0,
                        }}
                        animate={{
                          y: [note.y, note.y - 80, note.y - 180],
                          x: [note.x, note.x + (Math.random() - 0.5) * 50, note.x + (Math.random() - 0.5) * 80],
                          scale: [0, note.scale, note.scale * 1.1, 0],
                          opacity: [0, note.opacity, note.opacity * 0.6, 0],
                          rotate: [note.rotate, note.rotate + 90, note.rotate + 200],
                        }}
                        transition={{
                          duration: note.duration,
                          delay: note.delay,
                          ease: EASINGS.standard,
                          repeat: Infinity,
                          repeatDelay: 1.5 + Math.random() * 2,
                        }}
                      >
                        <IconComponent size={20} />
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </AnimatePresence>

            {/* Premium Typography */}
            <motion.div
              className="text-center mb-10"
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8, ease: EASINGS.iosSpring }}
            >
              <h1 className="text-5xl font-black tracking-tighter text-white mb-2 flex items-center justify-center gap-3">
                <span>SAEM'S</span>
                <motion.span
                  className="italic font-serif"
                  style={{ color: THEME_COLORS.gold }}
                  animate={{
                    textShadow: [
                      `0 0 20px rgba(${THEME_COLORS.goldRgb}, 0.3)`,
                      `0 0 40px rgba(${THEME_COLORS.goldRgb}, 0.6)`,
                      `0 0 20px rgba(${THEME_COLORS.goldRgb}, 0.3)`,
                    ],
                  }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  TUNES
                </motion.span>
              </h1>
              <div className="flex items-center justify-center gap-3">
                <motion.div
                  className="h-[1px] w-10"
                  style={{ background: `linear-gradient(to right, transparent, ${THEME_COLORS.gold}50)` }}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.6, duration: 0.8 }}
                />
                <motion.p
                  className="text-[10px] uppercase font-black tracking-[0.35em]"
                  style={{ color: `rgba(${THEME_COLORS.goldRgb}, 0.7)` }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8, duration: 0.6 }}
                >
                  Making Music, Representing Christ
                </motion.p>
                <motion.div
                  className="h-[1px] w-10"
                  style={{ background: `linear-gradient(to left, transparent, ${THEME_COLORS.gold}50)` }}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.6, duration: 0.8 }}
                />
              </div>
            </motion.div>

            {/* Premium Progress Section */}
            <motion.div
              className="w-72 max-w-full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.6 }}
            >
              {/* Progress bar */}
              <div
                className="relative h-[3px] w-full rounded-full overflow-hidden mb-6"
                style={{ background: `rgba(${THEME_COLORS.goldRgb}, 0.1)` }}
              >
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${THEME_COLORS.goldDark}, ${THEME_COLORS.gold}, ${THEME_COLORS.goldLight})`,
                    boxShadow: `0 0 20px rgba(${THEME_COLORS.goldRgb}, 0.6)`,
                  }}
                  initial={{ width: "0%" }}
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: EASINGS.iosSpring }}
                />
                {/* Shimmer effect */}
                <motion.div
                  className="absolute inset-0"
                  style={{
                    background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
                    width: "30%",
                  }}
                  animate={{ x: ["-100%", "400%"] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 1, ease: "easeInOut" }}
                />
              </div>

              {/* Loading message */}
              <div className="flex flex-col items-center gap-4">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentMessage}
                    className="flex items-center gap-3"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Sparkles
                      className="h-3.5 w-3.5 animate-pulse"
                      style={{ color: THEME_COLORS.gold }}
                    />
                    <span
                      className="text-[11px] font-bold uppercase tracking-[0.15em]"
                      style={{ color: `rgba(255, 255, 255, 0.5)` }}
                    >
                      {loading ? loadingMessages[currentMessage] : "Ready to play"}
                    </span>
                  </motion.div>
                </AnimatePresence>

                {/* Animated dots */}
                <div className="flex gap-2 items-center">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: THEME_COLORS.gold }}
                      animate={{
                        scale: [1, 1.4, 1],
                        opacity: [0.4, 1, 0.4],
                      }}
                      transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        delay: i * 0.15,
                        ease: "easeInOut",
                      }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Bottom branding */}
          <motion.div
            className="absolute bottom-10 left-0 right-0 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 0.8 }}
          >
            <p
              className="text-[9px] font-bold uppercase tracking-[0.5em]"
              style={{ color: `rgba(255, 255, 255, 0.25)` }}
            >
              Premium Learning Experience
            </p>
          </motion.div>

          {/* Completion celebration overlay */}
          <AnimatePresence>
            {phaseComplete && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="text-8xl"
                  style={{ color: THEME_COLORS.gold }}
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{
                    scale: [0, 1.3, 1],
                    rotate: [0, 15, 0],
                    opacity: [1, 1, 0],
                  }}
                  transition={{ duration: 0.8, ease: EASINGS.premiumBounce }}
                >
                  ♪
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Accessibility fallback */}
          <noscript>
            <div className="fixed inset-0 bg-black flex items-center justify-center text-white">
              <div className="text-center">
                <h1 className="text-3xl font-bold mb-3">Saem's Tunes</h1>
                <p className="text-gray-400">Loading your music...</p>
              </div>
            </div>
          </noscript>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;
