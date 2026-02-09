// src/components/music-tools/metronome/MetronomeVisual.tsx
import React, { useMemo } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface MetronomeVisualProps {
  tempo: number;
  isPlaying: boolean;
  visualFeedback: boolean;
  currentBeat: number;
  beatsPerMeasure: number;
  pendulumControls: any;
}

const MetronomeVisual: React.FC<MetronomeVisualProps> = ({
  tempo,
  isPlaying,
  visualFeedback,
  currentBeat,
  beatsPerMeasure,
  pendulumControls
}) => {
  // Calculate the beat marker positions on a circle
  const beatMarkers = useMemo(() => {
    return Array.from({ length: beatsPerMeasure }).map((_, i) => {
      // Calculate position on a circle
      const angle = (Math.PI * 1.5) + (2 * Math.PI * i / beatsPerMeasure);
      const radius = 42; // Circle radius percentage

      return {
        top: `${50 - radius * Math.sin(angle)}%`,
        left: `${50 + radius * Math.cos(angle)}%`,
        beat: i
      };
    });
  }, [beatsPerMeasure]);



  return (
    <div className="flex flex-col items-center mb-4">
      <div className="relative w-64 h-64 md:w-80 md:h-80 mb-6">
        {/* Extra glow effect for the first beat */}
        <AnimatePresence>
          {isPlaying && currentBeat === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 0.25, scale: 1.3 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 rounded-full bg-gold z-0"
              transition={{ duration: 0.15 }}
            />
          )}
        </AnimatePresence>

        {/* Circular base with wooden texture */}
        <div className="absolute inset-0 rounded-full border-4 border-gold/20"
          style={{
            background: "radial-gradient(circle, #5D370F 20%, #3D230A 100%)",
            boxShadow: "0 15px 40px rgba(0,0,0,0.7), inset 0 -4px 15px rgba(0,0,0,0.5)",
          }}
        >
          {/* Wood grain effect rounded */}
          <div className="absolute inset-0 rounded-full opacity-40 mix-blend-overlay"
            style={{
              backgroundImage: "repeating-radial-gradient(circle at 50% 50%, rgba(0,0,0,0.2) 0px, rgba(0,0,0,0.2) 2px, transparent 2px, transparent 10px)",
            }}
          />
        </div>

        {/* Tempo Circle - LARGER and more prominent */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full w-52 h-52 md:w-60 md:h-60 flex items-center justify-center p-2"
          style={{
            background: "radial-gradient(circle, rgba(20,20,20,0.95) 0%, rgba(10,10,10,1) 100%)",
            boxShadow: "inset 0 4px 20px rgba(0,0,0,0.9), 0 0 30px rgba(0,0,0,0.8)",
            border: "3px solid rgba(255, 215, 0, 0.2)"
          }}
        >
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              border: "3px solid rgba(255, 215, 0, 0.5)",
              boxShadow: isPlaying ? "0 0 35px rgba(255, 215, 0, 0.5)" : "none"
            }}
            animate={{
              opacity: isPlaying ? (currentBeat === 0 ? 1 : 0.6) : 0.4,
              scale: isPlaying && currentBeat === 0 ? 1.08 : 1
            }}
            transition={{
              duration: 0.1,
              ease: "easeOut"
            }}
          />

          {/* Tempo value display - MUCH BIGGER */}
          <motion.div
            className="text-center z-10"
            key={tempo}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div
              style={{
                color: '#FFD700',
                textShadow: isPlaying ? '0 0 20px rgba(255, 215, 0, 0.8)' : '0 0 10px rgba(255, 215, 0, 0.3)',
                fontFamily: 'Orbitron, monospace',
                fontSize: tempo > 99 ? '4.5rem' : '5.5rem',
                lineHeight: 1
              }}
              className="font-black tracking-tighter"
            >
              {tempo}
            </div>
            <div className="text-xs md:text-sm text-gold/80 font-black uppercase tracking-[0.4em] mt-1">BPM</div>
          </motion.div>
        </div>

        {/* Beat Markers Circle - Keep them for visual flair */}
        {visualFeedback && (
          <div className="absolute inset-0">
            {beatMarkers.map(({ top, left, beat }) => {
              const isActive = isPlaying && currentBeat === beat;
              const isAccent = beat === 0;

              return (
                <motion.div
                  key={beat}
                  className={cn(
                    "absolute rounded-full z-20",
                    isAccent ? "w-5 h-5" : "w-3 h-3"
                  )}
                  style={{
                    top,
                    left,
                    transform: 'translate(-50%, -50%)',
                    background: isActive ? (isAccent ? "#FFF" : "#FFD700") : "rgba(255, 215, 0, 0.15)",
                    boxShadow: isActive ? `0 0 20px rgba(255, 215, 0, 1)` : "none",
                    border: isAccent ? "1px solid rgba(255, 215, 0, 0.4)" : "none"
                  }}
                  animate={{
                    scale: isActive ? 1.4 : 1,
                  }}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Sequential Count Indicator - NEW feature */}
      <div className="flex gap-4 items-center justify-center p-4 bg-black/40 rounded-2xl border border-gold/10 backdrop-blur-sm">
        {Array.from({ length: beatsPerMeasure }).map((_, i) => {
          const isActive = isPlaying && currentBeat === i;
          const isAccent = i === 0;

          return (
            <div key={i} className="flex flex-col items-center gap-2">
              <motion.div
                className={cn(
                  "rounded-full transition-all duration-100",
                  isAccent ? "w-8 h-8 md:w-10 md:h-10" : "w-6 h-6 md:w-8 md:h-8"
                )}
                style={{
                  background: isActive
                    ? (isAccent ? "radial-gradient(circle, #FFF, #FFD700)" : "radial-gradient(circle, #FFD700, #B8860B)")
                    : "rgba(255, 215, 0, 0.05)",
                  border: `2px solid ${isActive ? '#FFD700' : 'rgba(255, 215, 0, 0.2)'}`,
                  boxShadow: isActive ? `0 0 25px rgba(255, 215, 0, 0.6)` : "none"
                }}
                animate={{
                  scale: isActive ? 1.2 : 1,
                  y: isActive ? -4 : 0
                }}
              />
              <span className={cn(
                "text-[10px] font-bold",
                isActive ? "text-gold" : "text-gray-600"
              )}>
                {i + 1}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MetronomeVisual;
