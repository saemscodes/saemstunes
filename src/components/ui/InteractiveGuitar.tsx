import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, Settings, Info, RotateCcw, Star, Timer, BookOpen, Zap, X, Music } from 'lucide-react';
import { useSwipeable } from 'react-swipeable';

// Chord theory definitions
interface ChordDefinition {
  name: string;
  intervals: number[];
  symbol: string;
  category: string;
}

const CHORD_THEORY: ChordDefinition[] = [
  { name: "Major", intervals: [0, 4, 7], symbol: "", category: "Basic" },
  { name: "Minor", intervals: [0, 3, 7], symbol: "m", category: "Basic" },
  { name: "Diminished", intervals: [0, 3, 6], symbol: "°", category: "Basic" },
  { name: "Augmented", intervals: [0, 4, 8], symbol: "+", category: "Basic" },
  { name: "Major 7th", intervals: [0, 4, 7, 11], symbol: "maj7", category: "Seventh" },
  { name: "Dominant 7th", intervals: [0, 4, 7, 10], symbol: "7", category: "Seventh" },
  { name: "Minor 7th", intervals: [0, 3, 7, 10], symbol: "m7", category: "Seventh" },
  { name: "Minor 7th Flat 5", intervals: [0, 3, 6, 10], symbol: "m7b5", category: "Seventh" },
  { name: "Diminished 7th", intervals: [0, 3, 6, 9], symbol: "°7", category: "Seventh" },
  { name: "Suspended 2nd", intervals: [0, 2, 7], symbol: "sus2", category: "Suspended" },
  { name: "Suspended 4th", intervals: [0, 5, 7], symbol: "sus4", category: "Suspended" },
  { name: "Dominant 9th", intervals: [0, 4, 7, 10, 14], symbol: "9", category: "Extended" },
  { name: "Major 9th", intervals: [0, 4, 7, 11, 14], symbol: "maj9", category: "Extended" },
  { name: "Minor 9th", intervals: [0, 3, 7, 10, 14], symbol: "m9", category: "Extended" },
  { name: "Add 9", intervals: [0, 4, 7, 14], symbol: "add9", category: "Extended" },
];

interface ChordProgression {
  name: string;
  chords: string[];
  description: string;
}

const CHORD_PROGRESSIONS: ChordProgression[] = [
  { name: "Classic I-IV-V-I", chords: ["G", "C", "D", "G"], description: "The foundation of rock and folk" },
  { name: "Pop I-V-vi-IV", chords: ["G", "D", "Em", "C"], description: "Used in hundreds of hit songs" },
  { name: "Jazz ii-V-I", chords: ["Am", "D", "G", "G"], description: "Classic jazz resolution" },
  { name: "50s Progression", chords: ["G", "Em", "C", "D"], description: "Doo-wop and early rock" },
];

// Helper to convert semitone to note name
const getNoteName = (semitone: number): string => {
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  return notes[semitone % 12];
};

// Helper to get interval names
const getIntervalName = (interval: number): string => {
  const intervals = ['Root', 'Minor 2nd', 'Major 2nd', 'Minor 3rd', 'Major 3rd', 'Perfect 4th',
    'Tritone', 'Perfect 5th', 'Minor 6th', 'Major 6th', 'Minor 7th', 'Major 7th'];
  return intervals[interval % 12] || `+${Math.floor(interval / 12)} Octave`;
};

// Chord detection function
const detectChord = (frequencies: number[]): { name: string; notes: string[]; intervals: string[] } => {
  if (frequencies.length < 3) return { name: "Not a chord", notes: [], intervals: [] };

  const semitones = frequencies.map(freq => Math.round(12 * Math.log2(freq / 440) + 69));
  const normalized = semitones.map(s => s % 12).sort((a, b) => a - b);
  const uniqueNotes = [...new Set(normalized)];

  for (const chord of CHORD_THEORY) {
    for (let i = 0; i < uniqueNotes.length; i++) {
      const root = uniqueNotes[i];
      const chordNotes = chord.intervals.map(interval => (root + interval) % 12).sort();

      const isMatch = chordNotes.every(note => uniqueNotes.includes(note));

      if (isMatch) {
        const rootNote = getNoteName(root);
        return {
          name: `${rootNote}${chord.symbol}`,
          notes: chordNotes.map(n => getNoteName(n)),
          intervals: chord.intervals.map(i => getIntervalName(i))
        };
      }
    }
  }

  return { name: "Unknown chord", notes: [], intervals: [] };
};

interface GuitarString {
  note: string;
  openFreq: number;
  frets: { note: string; frequency: number }[];
}

interface Chord {
  name: string;
  positions: { string: number; fret: number }[];
}

interface AudioState {
  context: AudioContext | null;
  gainNode: GainNode | null;
  compressor: DynamicsCompressorNode | null;
  reverb: ConvolverNode | null;
  reverbGain: GainNode | null;
}

interface PracticeExercise {
  id: string;
  title: string;
  description: string;
  type: 'chords' | 'scales' | 'strumming';
  target: any;
  instructions: string[];
}

interface TutorialStep {
  title: string;
  instruction: string;
  target: any;
  hints: string[];
}

const InteractiveGuitar: React.FC = () => {
  // State management
  const [activeNotes, setActiveNotes] = useState<Set<string>>(new Set());
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isPlayingDemo, setIsPlayingDemo] = useState(false);
  const [strumDirection, setStrumDirection] = useState<'down' | 'up' | null>(null);
  const [showPick, setShowPick] = useState(false);
  const [pickPosition, setPickPosition] = useState(0);
  const [heldChord, setHeldChord] = useState<number | null>(null);
  const [currentChord, setCurrentChord] = useState({ name: "", notes: [], intervals: [] });
  const [isTouch, setIsTouch] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showDemoTip, setShowDemoTip] = useState(true);
  const [currentChordIndex, setCurrentChordIndex] = useState(-1);
  const [tempo, setTempo] = useState(80);
  const [waveform, setWaveform] = useState<OscillatorType>('sawtooth');
  const [reverbLevel, setReverbLevel] = useState(0.3);
  const [delayEffect, setDelayEffect] = useState(0);
  const [distortion, setDistortion] = useState(0);
  const [eqSettings, setEqSettings] = useState({ low: 0, mid: 0, high: 0 });
  const [practiceMode, setPracticeMode] = useState(false);
  const [currentExercise, setCurrentExercise] = useState<PracticeExercise | null>(null);
  const [exerciseProgress, setExerciseProgress] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedPerformance, setRecordedPerformance] = useState<any[]>([]);
  const [recordingStartTime, setRecordingStartTime] = useState(0);
  const [metronomeActive, setMetronomeActive] = useState(false);
  const [timeSignature, setTimeSignature] = useState({ beats: 4, noteValue: 4 });
  const [activeTutorial, setActiveTutorial] = useState<TutorialStep | null>(null);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [favoriteChords, setFavoriteChords] = useState<string[]>([]);
  const [highlightedNotes, setHighlightedNotes] = useState<string[]>([]);
  const [panelPosition, setPanelPosition] = useState<'left' | 'right' | 'chords' | null>(null);
  const [activeProgression, setActiveProgression] = useState<string | null>(null);
  const [progressionStep, setProgressionStep] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  const audioState = useRef<AudioState>({
    context: null,
    gainNode: null,
    compressor: null,
    reverb: null,
    reverbGain: null
  });

  const oscillators = useRef<Map<string, OscillatorNode>>(new Map());
  const demoTimeouts = useRef<NodeJS.Timeout[]>([]);
  const activeNoteKeysByString = useRef<Map<number, string>>(new Map());
  const guitarRef = useRef<HTMLDivElement>(null);
  const metronomeInterval = useRef<NodeJS.Timeout | null>(null);
  const recordingStartTimeRef = useRef(0);
  const touchActiveRef = useRef(false);

  // Chord definitions
  const chords: Chord[] = [
    {
      name: "G",
      positions: [
        { string: 0, fret: 3 },
        { string: 1, fret: 2 },
        { string: 5, fret: 3 }
      ]
    },
    {
      name: "C",
      positions: [
        { string: 1, fret: 3 },
        { string: 2, fret: 2 },
        { string: 4, fret: 1 }
      ]
    },
    {
      name: "D",
      positions: [
        { string: 1, fret: 2 },
        { string: 2, fret: 2 },
        { string: 3, fret: 3 },
        { string: 4, fret: 3 }
      ]
    },
    {
      name: "Em",
      positions: [
        { string: 1, fret: 2 },
        { string: 2, fret: 2 }
      ]
    },
    {
      name: "Am",
      positions: [
        { string: 1, fret: 2 },
        { string: 2, fret: 2 },
        { string: 3, fret: 2 }
      ]
    },
    {
      name: "F",
      positions: [
        { string: 0, fret: 1 },
        { string: 1, fret: 1 },
        { string: 2, fret: 3 },
        { string: 3, fret: 3 },
        { string: 4, fret: 2 },
        { string: 5, fret: 1 }
      ]
    }
  ];

  // Practice exercises
  const practiceExercises: PracticeExercise[] = [
    {
      id: "beginner-chords",
      title: "Basic Chord Changes",
      description: "Practice transitioning between G, C, and D chords",
      type: 'chords',
      target: ["G", "C", "D"],
      instructions: [
        "Place your fingers for a G chord",
        "Strum the chord clearly",
        "Transition to a C chord smoothly",
        "Strum the C chord",
        "Transition to a D chord",
        "Strum the D chord",
        "Return to G chord"
      ]
    },
    {
      id: "minor-chords",
      title: "Minor Chord Practice",
      description: "Practice Em and Am chords",
      type: 'chords',
      target: ["Em", "Am"],
      instructions: [
        "Place your fingers for an Em chord",
        "Strum the chord clearly",
        "Transition to an Am chord smoothly",
        "Strum the Am chord",
        "Return to Em chord"
      ]
    }
  ];

  // Tutorial steps
  const tutorialSteps: TutorialStep[] = [
    {
      title: "Welcome to Interactive Guitar",
      instruction: "This tutorial will guide you through the basics of playing guitar with this interactive tool.",
      target: null,
      hints: ["Click 'Next' to continue"]
    },
    {
      title: "Playing Notes",
      instruction: "Click on any fret to play a note. Try clicking on different frets and strings.",
      target: { action: "play-note", count: 3 },
      hints: ["Click on the frets to play notes", "Each string produces a different sound"]
    },
    {
      title: "Strumming",
      instruction: "Swipe vertically across the strings to strum. Try swiping downward and upward.",
      target: { action: "strum", count: 2 },
      hints: ["Swipe down across the strings for a downstroke", "Swipe up for an upstroke"]
    },
    {
      title: "Playing Chords",
      instruction: "Click on a chord button to place your fingers in the correct position, then strum to play the chord.",
      target: { action: "play-chord", chord: "G" },
      hints: ["Select the G chord from the chord buttons", "Swipe to strum the chord"]
    }
  ];

  // Calculate accurate fret positions
  const calculateFretPositions = (numFrets: number = 20) => {
    const scaleLength = 25.4;
    const positions: number[] = [0];

    for (let i = 1; i <= numFrets; i++) {
      const distance = scaleLength - (scaleLength / Math.pow(2, i / 12));
      positions.push(distance / scaleLength);
    }
    return positions;
  };

  const fretPositions = calculateFretPositions(20);

  // Generate frets with accurate note calculation
  const generateFrets = (baseFreq: number, count: number = 20) => {
    return Array.from({ length: count }, (_, i) => {
      const freq = baseFreq * Math.pow(2, i / 12);
      const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      let noteIndex;

      if (baseFreq === 82.41) noteIndex = (4 + i) % 12;
      else if (baseFreq === 110.00) noteIndex = (9 + i) % 12;
      else if (baseFreq === 146.83) noteIndex = (2 + i) % 12;
      else if (baseFreq === 196.00) noteIndex = (7 + i) % 12;
      else if (baseFreq === 246.94) noteIndex = (11 + i) % 12;
      else if (baseFreq === 329.63) noteIndex = (4 + i) % 12;
      else noteIndex = 0;

      return { note: notes[noteIndex], frequency: freq };
    });
  };

  // Guitar strings with standard tuning
  const strings: GuitarString[] = [
    { note: 'E', openFreq: 82.41, frets: generateFrets(82.41) },
    { note: 'A', openFreq: 110.00, frets: generateFrets(110.00) },
    { note: 'D', openFreq: 146.83, frets: generateFrets(146.83) },
    { note: 'G', openFreq: 196.00, frets: generateFrets(196.00) },
    { note: 'B', openFreq: 246.94, frets: generateFrets(246.94) },
    { note: 'E', openFreq: 329.63, frets: generateFrets(329.63) }
  ];

  // Enhanced audio initialization
  useEffect(() => {
    const initAudio = async () => {
      try {
        const context = new ((window as any).AudioContext || (window as any).webkitAudioContext)();
        const gainNode = context.createGain();
        const compressor = context.createDynamicsCompressor();

        const reverb = context.createConvolver();
        const reverbGain = context.createGain();

        const impulseLength = context.sampleRate * 2;
        const impulse = context.createBuffer(2, impulseLength, context.sampleRate);
        for (let channel = 0; channel < 2; channel++) {
          const channelData = impulse.getChannelData(channel);
          for (let i = 0; i < impulseLength; i++) {
            channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / impulseLength, 2);
          }
        }
        reverb.buffer = impulse;

        gainNode.connect(compressor);
        compressor.connect(reverbGain);
        reverbGain.connect(reverb);
        reverb.connect(context.destination);
        compressor.connect(context.destination);

        gainNode.gain.setValueAtTime(volume, context.currentTime);
        reverbGain.gain.setValueAtTime(reverbLevel, context.currentTime);

        audioState.current = { context, gainNode, compressor, reverb, reverbGain };

        const resumeAudio = async () => {
          if (context.state === 'suspended') {
            await context.resume();
          }
        };

        document.addEventListener('click', resumeAudio, { once: true });
        document.addEventListener('touchstart', resumeAudio, { once: true });
      } catch (error) {
        console.error('Audio initialization failed:', error);
      }
    };

    initAudio();
    setIsTouch('ontouchstart' in window);

    return () => {
      if (audioState.current.context) {
        audioState.current.context.close();
      }
      demoTimeouts.current.forEach(timeout => clearTimeout(timeout));
      if (metronomeInterval.current) {
        clearInterval(metronomeInterval.current);
      }
    };
  }, []);

  // Volume and mute handling
  useEffect(() => {
    if (audioState.current.gainNode) {
      audioState.current.gainNode.gain.value = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Reverb level handling
  useEffect(() => {
    if (audioState.current.reverbGain) {
      audioState.current.reverbGain.gain.setValueAtTime(reverbLevel, audioState.current.context.currentTime);
    }
  }, [reverbLevel]);

  // Metronome effect
  useEffect(() => {
    if (metronomeActive) {
      const intervalMs = (60000 / tempo) * (4 / timeSignature.noteValue);
      metronomeInterval.current = setInterval(() => {
        playMetronomeClick();
      }, intervalMs);
    } else if (metronomeInterval.current) {
      clearInterval(metronomeInterval.current);
    }

    return () => {
      if (metronomeInterval.current) {
        clearInterval(metronomeInterval.current);
      }
    };
  }, [metronomeActive, tempo, timeSignature]);

  const playMetronomeClick = () => {
    if (!audioState.current.context || isMuted) return;

    const { context } = audioState.current;
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.frequency.setValueAtTime(1000, context.currentTime);
    oscillator.type = 'sine';

    const now = context.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.001);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    oscillator.start(now);
    oscillator.stop(now + 0.1);
  };

  // Stop all notes
  const stopAllNotes = useCallback(() => {
    oscillators.current.forEach(osc => {
      try {
        osc.stop();
      } catch (e) {
        console.warn('Error stopping oscillator:', e);
      }
    });
    oscillators.current.clear();
    setActiveNotes(new Set());
    activeNoteKeysByString.current.clear();
    setHeldChord(null);
    setCurrentChord({ name: "", notes: [], intervals: [] });
  }, []);

  // Detect chord when active notes change
  useEffect(() => {
    const activeFrequencies: number[] = [];

    activeNoteKeysByString.current.forEach((noteKey, stringIndex) => {
      const fretIndex = parseInt(noteKey.split('-')[1]);
      const frequency = strings[stringIndex].frets[fretIndex].frequency;
      activeFrequencies.push(frequency);
    });

    if (activeFrequencies.length > 0) {
      const chord = detectChord(activeFrequencies);
      setCurrentChord(chord);
    } else {
      setCurrentChord({ name: "", notes: [], intervals: [] });
    }
  }, [activeNotes]);

  // Swipe handlers for strumming
  const swipeHandlers = useSwipeable({
    onSwipedDown: (eventData) => handleStrum('down', eventData),
    onSwipedUp: (eventData) => handleStrum('up', eventData),
    onSwipedLeft: (eventData) => handleStrum('down', eventData),
    onSwipedRight: (eventData) => handleStrum('up', eventData),
    onSwiping: (eventData) => {
      if (guitarRef.current) {
        const rect = guitarRef.current.getBoundingClientRect();
        const event = eventData.event as TouchEvent | MouseEvent;
        const relativeY = 'touches' in event ?
          event.touches[0].clientY - rect.top :
          (event as MouseEvent).clientY - rect.top;
        setPickPosition(relativeY / rect.height);
        setShowPick(true);
      }
    },
    delta: 20,
    trackTouch: true,
    trackMouse: true,
  });

  // Enhanced strum function
  const handleStrum = async (direction: 'up' | 'down', eventData?: any) => {
    if (!audioState.current.context || !audioState.current.gainNode || isMuted) return;

    if (isRecording) {
      setRecordedPerformance(prev => [...prev, {
        time: Date.now() - recordingStartTimeRef.current,
        type: 'strum',
        data: { direction }
      }]);
    }

    setStrumDirection(direction);
    setShowPick(true);

    if (eventData && guitarRef.current) {
      const rect = guitarRef.current.getBoundingClientRect();
      const relativeY = eventData.event.touches ?
        eventData.event.touches[0].clientY - rect.top :
        eventData.event.clientY - rect.top;
      setPickPosition(relativeY / rect.height);
    }

    const heldFrets = new Map<number, number>();
    activeNoteKeysByString.current.forEach((noteKey, stringIndex) => {
      const fretIndex = parseInt(noteKey.split('-')[1]);
      heldFrets.set(stringIndex, fretIndex);
    });

    const strumDelay = direction === 'down' ? 30 : 25;
    const stringOrder = direction === 'down' ? [0, 1, 2, 3, 4, 5] : [5, 4, 3, 2, 1, 0];

    stringOrder.forEach((stringIndex, i) => {
      setTimeout(() => {
        const fretIndex = heldFrets.get(stringIndex) || 0;
        const frequency = strings[stringIndex].frets[fretIndex].frequency;
        playStrummedNote(frequency, stringIndex, fretIndex, direction);
      }, i * strumDelay);
    });

    if (navigator.vibrate && isTouch) {
      navigator.vibrate(direction === 'down' ? 50 : 30);
    }

    setTimeout(() => {
      setShowPick(false);
      setStrumDirection(null);
    }, 300);
  };

  // Play strummed note with enhanced realism
  const playStrummedNote = async (frequency: number, stringIndex: number, fretIndex: number, direction: 'up' | 'down') => {
    if (!audioState.current.context || !audioState.current.gainNode) return;

    try {
      const { context, gainNode } = audioState.current;
      const noteKey = `strum-${stringIndex}-${fretIndex}-${Date.now()}`;

      const oscillator = context.createOscillator();
      const noteGain = context.createGain();
      const filter = context.createBiquadFilter();

      oscillator.connect(filter);
      filter.connect(noteGain);
      noteGain.connect(gainNode);

      oscillator.type = waveform;
      oscillator.frequency.setValueAtTime(frequency, context.currentTime);

      filter.type = 'lowpass';
      const baseFreq = direction === 'down' ? 2500 : 3000;
      filter.frequency.setValueAtTime(baseFreq + (frequency * 1.5), context.currentTime);
      filter.frequency.exponentialRampToValueAtTime(400 + frequency, context.currentTime + 1.2);

      const now = context.currentTime;
      const attackTime = direction === 'down' ? 0.003 : 0.002;
      const decayTime = 0.8;
      const sustainLevel = 0.15;
      const releaseTime = 1.2;

      const peakVolume = direction === 'down' ? volume * 0.9 : volume * 0.7;

      noteGain.gain.setValueAtTime(0, now);
      noteGain.gain.linearRampToValueAtTime(peakVolume, now + attackTime);
      noteGain.gain.exponentialRampToValueAtTime(peakVolume * sustainLevel, now + attackTime + decayTime);
      noteGain.gain.exponentialRampToValueAtTime(0.001, now + attackTime + decayTime + releaseTime);

      oscillator.start(now);
      oscillator.stop(now + attackTime + decayTime + releaseTime);

      setActiveNotes(prev => new Set(prev).add(noteKey));

      setTimeout(() => {
        setActiveNotes(prev => {
          const newSet = new Set(prev);
          newSet.delete(noteKey);
          return newSet;
        });
      }, (attackTime + decayTime + releaseTime) * 1000);

    } catch (error) {
      console.error('Strummed note playback failed:', error);
    }
  };

  // Individual note playing
  const playNote = useCallback(async (frequency: number, stringIndex: number, fretIndex: number) => {
    if (!audioState.current.context || !audioState.current.gainNode || isMuted) return;

    if (isRecording) {
      setRecordedPerformance(prev => [...prev, {
        time: Date.now() - recordingStartTimeRef.current,
        type: 'note',
        data: { frequency, stringIndex, fretIndex }
      }]);
    }

    try {
      if (audioState.current.context.state === 'suspended') {
        await audioState.current.context.resume();
      }

      const { context, gainNode } = audioState.current;
      const noteKey = `${stringIndex}-${fretIndex}`;

      const existingKey = activeNoteKeysByString.current.get(stringIndex);
      if (existingKey) {
        const existingOsc = oscillators.current.get(existingKey);
        if (existingOsc) {
          existingOsc.stop();
          oscillators.current.delete(existingKey);
        }
        setActiveNotes(prev => {
          const newSet = new Set(prev);
          newSet.delete(existingKey);
          return newSet;
        });
      }

      const oscillator = context.createOscillator();
      const noteGain = context.createGain();
      const filter = context.createBiquadFilter();

      oscillator.connect(filter);
      filter.connect(noteGain);
      noteGain.connect(gainNode);

      oscillator.type = waveform;
      oscillator.frequency.setValueAtTime(frequency, context.currentTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2000 + (frequency * 2), context.currentTime);
      filter.frequency.exponentialRampToValueAtTime(500 + frequency, context.currentTime + 1.5);

      const now = context.currentTime;
      const attackTime = 0.005;
      const decayTime = 0.5;
      const sustainLevel = 0.2;
      const releaseTime = 1.5;

      noteGain.gain.setValueAtTime(0, now);
      noteGain.gain.linearRampToValueAtTime(volume * 0.8, now + attackTime);
      noteGain.gain.exponentialRampToValueAtTime(volume * sustainLevel, now + attackTime + decayTime);
      noteGain.gain.exponentialRampToValueAtTime(0.001, now + attackTime + decayTime + releaseTime);

      oscillator.start(now);
      oscillator.stop(now + attackTime + decayTime + releaseTime);

      oscillators.current.set(noteKey, oscillator);
      activeNoteKeysByString.current.set(stringIndex, noteKey);

      setActiveNotes(prev => new Set(prev).add(noteKey));

      setTimeout(() => {
        setActiveNotes(prev => {
          const newSet = new Set(prev);
          newSet.delete(noteKey);
          return newSet;
        });
        oscillators.current.delete(noteKey);
        if (activeNoteKeysByString.current.get(stringIndex) === noteKey) {
          activeNoteKeysByString.current.delete(stringIndex);
        }
      }, (attackTime + decayTime + releaseTime) * 1000);

    } catch (error) {
      console.error('Note playback failed:', error);
    }
  }, [volume, isMuted, waveform, isRecording]);

  // Play chord progressions
  const playDemo = useCallback(async () => {
    if (isPlayingDemo) {
      setIsPlayingDemo(false);
      demoTimeouts.current.forEach(timeout => clearTimeout(timeout));
      demoTimeouts.current = [];
      stopAllNotes();
      setCurrentChordIndex(-1);
      return;
    }

    setIsPlayingDemo(true);
    setShowDemoTip(false);
    stopAllNotes();
    setCurrentChordIndex(0);

    const playChord = async (chordIndex: number) => {
      if (!isPlayingDemo) return;

      const chord = chords[chordIndex];
      setCurrentChordIndex(chordIndex);

      applyChord(chordIndex);

      demoTimeouts.current.push(setTimeout(() => {
        if (!isPlayingDemo) return;
        handleStrum('down');
      }, 200));

      demoTimeouts.current.push(setTimeout(() => {
        playChord((chordIndex + 1) % chords.length);
      }, (60000 / tempo)));
    };

    playChord(0);
  }, [isPlayingDemo, stopAllNotes, tempo, handleStrum]);

  // Handle auto-playing progressions
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAutoPlaying && activeProgression) {
      const progression = CHORD_PROGRESSIONS.find(p => p.name === activeProgression);
      if (progression) {
        interval = setInterval(() => {
          setProgressionStep(prev => {
            const next = (prev + 1) % progression.chords.length;
            const chordName = progression.chords[next];
            const chordIdx = chords.findIndex(c => c.name === chordName);
            if (chordIdx !== -1) {
              applyChord(chordIdx);
              setTimeout(() => handleStrum('down'), 50);
            }
            return next;
          });
        }, (60000 / tempo) * 2); // 2 beats per chord
      }
    }
    return () => clearInterval(interval);
  }, [isAutoPlaying, activeProgression, tempo, chords]);

  const toggleProgression = (progName: string) => {
    if (activeProgression === progName) {
      setIsAutoPlaying(!isAutoPlaying);
    } else {
      setActiveProgression(progName);
      setProgressionStep(0);
      setIsAutoPlaying(true);
      const progression = CHORD_PROGRESSIONS.find(p => p.name === progName);
      if (progression) {
        const chordIdx = chords.findIndex(c => c.name === progression.chords[0]);
        if (chordIdx !== -1) {
          applyChord(chordIdx);
          setTimeout(() => handleStrum('down'), 50);
        }
      }
    }
  };

  // Apply chord to the guitar
  const applyChord = useCallback((chordIndex: number) => {
    stopAllNotes();
    setHeldChord(chordIndex);

    const chord = chords[chordIndex];

    activeNoteKeysByString.current.clear();

    chord.positions.forEach(({ string, fret }) => {
      const noteKey = `${string}-${fret}`;
      activeNoteKeysByString.current.set(string, noteKey);
      setActiveNotes(prev => new Set(prev).add(noteKey));
    });
  }, [stopAllNotes]);

  // Check if a fret is part of a chord
  const isChordFret = (stringIndex: number, fretIndex: number) => {
    if (heldChord === null) return false;
    return chords[heldChord].positions.some(pos =>
      pos.string === stringIndex && pos.fret === fretIndex
    );
  };

  // Play current chord
  const playCurrentChord = () => {
    if (activeNoteKeysByString.current.size > 0) {
      handleStrum('down');
    }
  };

  // Start/stop recording
  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
    } else {
      setIsRecording(true);
      setRecordedPerformance([]);
      recordingStartTimeRef.current = Date.now();
    }
  };

  // Play recorded performance
  const playRecording = () => {
    recordedPerformance.forEach((event) => {
      setTimeout(() => {
        if (event.type === 'note') {
          playNote(event.data.frequency, event.data.stringIndex, event.data.fretIndex);
        } else if (event.type === 'strum') {
          handleStrum(event.data.direction);
        }
      }, event.time);
    });
  };

  // Start practice mode
  const startPractice = (exercise: PracticeExercise) => {
    setPracticeMode(true);
    setCurrentExercise(exercise);
    setExerciseProgress(0);
  };

  // Start tutorial
  const startTutorial = () => {
    setActiveTutorial(tutorialSteps[0]);
    setTutorialStep(0);
  };

  // Toggle favorite chord
  const toggleFavoriteChord = (chordName: string) => {
    if (favoriteChords.includes(chordName)) {
      setFavoriteChords(favoriteChords.filter(name => name !== chordName));
    } else {
      setFavoriteChords([...favoriteChords, chordName]);
    }
  };

  // Highlight scale notes
  const highlightScale = (rootNote: string, scaleType: string) => {
    // Simplified scale highlighting
    const scaleNotes = [
      rootNote,
      getNoteName((getNoteIndex(rootNote) + 2) % 12),
      getNoteName((getNoteIndex(rootNote) + 4) % 12),
      getNoteName((getNoteIndex(rootNote) + 5) % 12),
      getNoteName((getNoteIndex(rootNote) + 7) % 12),
      getNoteName((getNoteIndex(rootNote) + 9) % 12),
      getNoteName((getNoteIndex(rootNote) + 11) % 12)
    ];
    setHighlightedNotes(scaleNotes);
  };

  const getNoteIndex = (note: string): number => {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    return notes.indexOf(note);
  };

  return (
    <motion.div
      className="relative bg-gradient-to-br from-amber-900 via-amber-800 to-amber-900 rounded-2xl shadow-2xl overflow-hidden w-full max-w-6xl mx-auto p-4 sm:p-6"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
      ref={guitarRef}
      {...swipeHandlers}
    >
      {/* Background wood grain texture */}
      <div className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `repeating-linear-gradient(
               0deg,
               rgba(139, 69, 19, 0.3) 0px,
               rgba(160, 82, 45, 0.2) 2px,
               rgba(139, 69, 19, 0.3) 4px
             )`
        }} />

      {/* Side Panel Buttons */}
      <div className="absolute inset-y-0 left-0 flex items-center z-30">
        <button
          onClick={() => setPanelPosition(panelPosition === 'left' ? null : 'left')}
          className="ml-[-16px] sm:ml-[-20px] w-8 h-16 sm:w-10 sm:h-20 bg-gradient-to-r from-amber-800 to-amber-900 hover:from-amber-700 hover:to-amber-800 rounded-r-lg shadow-lg flex items-center justify-center transition-all group"
        >
          <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-white group-hover:scale-110 transition-transform" />
        </button>
      </div>

      <div className="absolute inset-y-0 right-0 flex items-center z-30">
        <button
          onClick={() => setPanelPosition(panelPosition === 'right' ? null : 'right')}
          className="mr-[-16px] sm:mr-[-20px] w-8 h-16 sm:w-10 sm:h-20 bg-gradient-to-r from-amber-900 to-amber-800 hover:from-amber-800 hover:to-amber-700 rounded-l-lg shadow-lg flex items-center justify-center transition-all group"
        >
          <Info className="h-4 w-4 sm:h-5 sm:w-5 text-white group-hover:scale-110 transition-transform" />
        </button>
      </div>

      {/* Left Settings Panel */}
      <AnimatePresence>
        {panelPosition === 'left' && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute top-0 left-0 h-full w-[280px] sm:w-80 bg-gradient-to-b from-amber-900 to-amber-800 border-r border-amber-700 shadow-2xl z-20 flex flex-col"
          >
            <div className="flex items-center justify-between p-6">
              <h3 className="text-white font-semibold text-lg flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Guitar Settings
              </h3>
              <button
                onClick={() => setPanelPosition(null)}
                className="text-white/60 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-grow overflow-y-auto px-6 pb-6">
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-4">
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-white font-medium flex items-center gap-2">
                        <Volume2 className="h-4 w-4" />
                        Volume
                      </label>
                      <span className="text-amber-400 font-mono text-sm">
                        {Math.round(volume * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={volume}
                      onChange={(e) => setVolume(parseFloat(e.target.value))}
                      className="w-full accent-amber-500 bg-white/10 rounded-lg"
                    />
                  </div>

                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-white font-medium">Tempo</label>
                      <span className="text-purple-400 font-mono text-sm">
                        {tempo} BPM
                      </span>
                    </div>
                    <input
                      type="range"
                      min="60"
                      max="180"
                      step="10"
                      value={tempo}
                      onChange={(e) => setTempo(parseInt(e.target.value))}
                      className="w-full accent-purple-500 bg-white/10 rounded-lg"
                    />
                  </div>

                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-white font-medium">Reverb</label>
                      <span className="text-blue-400 font-mono text-sm">
                        {Math.round(reverbLevel * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={reverbLevel}
                      onChange={(e) => setReverbLevel(parseFloat(e.target.value))}
                      className="w-full accent-blue-500 bg-white/10 rounded-lg"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-white/5 rounded-lg p-4">
                    <label className="text-white font-medium block mb-3">Waveform</label>
                    <select
                      value={waveform}
                      onChange={(e) => setWaveform(e.target.value as OscillatorType)}
                      className="w-full bg-black/50 text-white rounded-lg px-3 py-2 border border-white/20 focus:border-blue-400 focus:outline-none"
                    >
                      <option value="sawtooth">Sawtooth (Guitar-like)</option>
                      <option value="sine">Sine</option>
                      <option value="square">Square</option>
                      <option value="triangle">Triangle</option>
                    </select>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4">
                    <label className="text-white font-medium block mb-3">Tuning</label>
                    <div className="bg-black/50 text-white rounded-lg px-3 py-2 border border-white/20">
                      <span className="text-amber-400">Standard: E-A-D-G-B-E</span>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <label className="text-white font-medium">Metronome</label>
                      <button
                        onClick={() => setMetronomeActive(!metronomeActive)}
                        className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${metronomeActive ? 'bg-green-500' : 'bg-white/20'
                          }`}
                      >
                        <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform duration-300 ${metronomeActive ? 'translate-x-7' : 'translate-x-0'
                          }`} />
                      </button>
                    </div>
                    {metronomeActive && (
                      <div className="mt-3">
                        <label className="text-white/70 text-sm">Time Signature</label>
                        <select
                          value={`${timeSignature.beats}/${timeSignature.noteValue}`}
                          onChange={(e) => {
                            const [beats, noteValue] = e.target.value.split('/').map(Number);
                            setTimeSignature({ beats, noteValue });
                          }}
                          className="w-full bg-black/50 text-white rounded-lg px-3 py-2 border border-white/20 mt-1"
                        >
                          <option value="4/4">4/4</option>
                          <option value="3/4">3/4</option>
                          <option value="6/8">6/8</option>
                          <option value="2/4">2/4</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right Info Panel */}
      <AnimatePresence>
        {panelPosition === 'right' && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute top-0 right-0 h-full w-[280px] sm:w-80 bg-gradient-to-b from-amber-900 to-amber-800 border-l border-amber-700 shadow-2xl z-20 flex flex-col"
          >
            <div className="flex items-center justify-between p-6">
              <h3 className="text-white font-semibold text-lg flex items-center gap-2">
                <Info className="h-5 w-5" />
                Guitar Guide
              </h3>
              <button
                onClick={() => setPanelPosition(null)}
                className="text-white/60 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-grow overflow-y-auto px-6 pb-6">
              <div className="space-y-6">
                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="text-amber-400 font-medium mb-2">Playing Guide</h4>
                  <div className="space-y-1 text-white/80 text-sm">
                    <div>• Click on frets to play notes</div>
                    <div>• Swipe vertically to strum strings</div>
                    <div>• Hold multiple frets to form chords</div>
                    <div>• Use chord buttons to apply common chords</div>
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="text-purple-400 font-medium mb-2">Chord Recognition</h4>
                  <div className="space-y-1 text-white/80 text-sm">
                    <div>• Recognizes major, minor, 7th chords</div>
                    <div>• Shows chord name above controls</div>
                    <div>• Play chord button strums all active notes</div>
                    <div>• Accurate fret positioning based on physics</div>
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="text-blue-400 font-medium mb-2">Practice Exercises</h4>
                  <div className="space-y-2">
                    {practiceExercises.map((exercise) => (
                      <button
                        key={exercise.id}
                        onClick={() => startPractice(exercise)}
                        className="w-full bg-amber-700 hover:bg-amber-600 text-white text-sm py-2 px-3 rounded-lg transition-colors text-left"
                      >
                        <div className="font-medium">{exercise.title}</div>
                        <div className="text-xs opacity-80">{exercise.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setPanelPosition('chords')}
                  className="w-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 hover:from-purple-500/30 hover:to-blue-500/30 border border-purple-500/30 text-purple-200 py-2 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <Music className="h-4 w-4" />
                  Chord Progressions
                </button>

                <button
                  onClick={startTutorial}
                  className="w-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/30 text-amber-200 py-2 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <BookOpen className="h-4 w-4" />
                  Start Tutorial
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chord Progressions Panel */}
      <AnimatePresence>
        {panelPosition === 'chords' && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute top-0 right-0 h-full w-[280px] sm:w-80 bg-gradient-to-b from-amber-900 to-amber-800 border-l border-amber-700 shadow-2xl z-20 flex flex-col"
          >
            <div className="flex items-center justify-between p-6">
              <h3 className="text-white font-semibold text-lg flex items-center gap-2">
                <Music className="h-5 w-5" />
                Chord Progressions
              </h3>
              <button
                onClick={() => setPanelPosition(null)}
                className="text-white/60 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-grow overflow-y-auto px-6 pb-6">
              <div className="space-y-4">
                {CHORD_PROGRESSIONS.map((prog) => (
                  <div
                    key={prog.name}
                    className={`bg-white/5 rounded-lg p-4 transition-all border ${activeProgression === prog.name ? 'border-amber-500/50 bg-amber-500/10' : 'border-transparent'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-amber-400 font-medium">{prog.name}</h4>
                    </div>
                    <p className="text-white/60 text-xs mb-3">{prog.description}</p>
                    <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                      {prog.chords.map((chord, i) => (
                        <div
                          key={i}
                          className={`px-2 py-1 rounded text-xs font-mono transition-colors ${activeProgression === prog.name && progressionStep === i
                            ? 'bg-amber-500 text-white'
                            : 'bg-black/30 text-amber-200'
                            }`}
                        >
                          {chord}
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => toggleProgression(prog.name)}
                      className={`w-full py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${activeProgression === prog.name && isAutoPlaying
                        ? 'bg-red-500 hover:bg-red-400 text-white'
                        : 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg'
                        }`}
                    >
                      {activeProgression === prog.name && isAutoPlaying ? (
                        <>
                          <Pause className="h-4 w-4" />
                          Pause Auto-play
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4" />
                          Start Auto-play
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tutorial Overlay */}
      <AnimatePresence>
        {activeTutorial && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-gradient-to-br from-amber-800 to-amber-900 rounded-xl p-6 max-w-md w-full border border-amber-600"
            >
              <h3 className="text-white font-semibold text-xl mb-2">
                {activeTutorial.title}
              </h3>
              <p className="text-amber-100 mb-4">
                {activeTutorial.instruction}
              </p>

              <div className="bg-black/30 rounded-lg p-3 mb-4">
                <h4 className="text-amber-300 font-medium mb-1">Hint:</h4>
                <p className="text-amber-200 text-sm">
                  {activeTutorial.hints[0]}
                </p>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => {
                    if (tutorialStep > 0) {
                      setTutorialStep(tutorialStep - 1);
                      setActiveTutorial(tutorialSteps[tutorialStep - 1]);
                    }
                  }}
                  disabled={tutorialStep === 0}
                  className="px-4 py-2 bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-amber-600 text-white rounded-lg transition-colors"
                >
                  Previous
                </button>

                <div className="flex items-center gap-1">
                  {tutorialSteps.map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full ${i === tutorialStep ? 'bg-amber-400' : 'bg-amber-700'
                        }`}
                    />
                  ))}
                </div>

                <button
                  onClick={() => {
                    if (tutorialStep < tutorialSteps.length - 1) {
                      setTutorialStep(tutorialStep + 1);
                      setActiveTutorial(tutorialSteps[tutorialStep + 1]);
                    } else {
                      setActiveTutorial(null);
                    }
                  }}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-white rounded-lg transition-colors"
                >
                  {tutorialStep < tutorialSteps.length - 1 ? 'Next' : 'Finish'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Complete Guitar Layout */}
      <div className="relative w-full h-64 sm:h-80 md:h-96 flex items-center overflow-hidden">

        {/* HEADSTOCK */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[15%] h-[70%] z-10">
          <div className="relative w-full h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-600 via-amber-700 to-amber-800 shadow-lg"
              style={{
                clipPath: 'polygon(0% 25%, 80% 20%, 95% 35%, 100% 50%, 95% 65%, 80% 80%, 0% 75%)'
              }}>
              <div className="absolute inset-0 opacity-40"
                style={{
                  backgroundImage: `repeating-linear-gradient(
                       0deg,
                       rgba(139, 69, 19, 0.5) 0px,
                       rgba(160, 82, 45, 0.3) 1px,
                       rgba(139, 69, 19, 0.5) 2px
                     )`
                }} />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-4 bg-gradient-to-br from-amber-800 to-amber-900 rounded-sm opacity-60"></div>
            </div>

            <div className="absolute inset-0">
              <div className="absolute top-6 left-3 flex flex-col gap-3">
                {[5, 4, 3].map((stringIndex) => (
                  <div key={`top-${stringIndex}`} className="flex items-center">
                    <div className="w-4 h-4 bg-gradient-to-br from-gray-200 to-gray-400 rounded-full shadow-md relative">
                      <div className="absolute inset-0.5 bg-gradient-to-br from-gray-300 to-gray-500 rounded-full"></div>
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-gray-700 rounded-full"></div>
                      <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-1.5 h-0.5 bg-gradient-to-r from-gray-300 to-gray-500 rounded"></div>
                    </div>
                    <div className="w-5 h-0.5 bg-gradient-to-r from-gray-300 to-gray-500 ml-1 rounded"></div>
                  </div>
                ))}
              </div>

              <div className="absolute bottom-6 left-3 flex flex-col gap-3">
                {[2, 1, 0].map((stringIndex) => (
                  <div key={`bottom-${stringIndex}`} className="flex items-center">
                    <div className="w-4 h-4 bg-gradient-to-br from-gray-200 to-gray-400 rounded-full shadow-md relative">
                      <div className="absolute inset-0.5 bg-gradient-to-br from-gray-300 to-gray-500 rounded-full"></div>
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-gray-700 rounded-full"></div>
                      <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-1.5 h-0.5 bg-gradient-to-r from-gray-300 to-gray-500 rounded"></div>
                    </div>
                    <div className="w-5 h-0.5 bg-gradient-to-r from-gray-300 to-gray-500 ml-1 rounded"></div>
                  </div>
                ))}
              </div>

              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-2 text-xs font-bold text-amber-200">
                {strings.slice().reverse().map((string, i) => (
                  <span key={i} className="text-center leading-none">{string.note}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* NECK & FRETBOARD */}
        <div className="absolute left-[12%] top-1/2 -translate-y-1/2 w-[50%] h-[65%] z-[2]">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-700 via-amber-600 to-amber-500 shadow-lg rounded-lg">
            <div className="absolute inset-0 opacity-30 rounded-lg"
              style={{
                backgroundImage: `repeating-linear-gradient(
                     0deg,
                     rgba(139, 69, 19, 0.4) 0px,
                     rgba(160, 82, 45, 0.2) 2px,
                     rgba(139, 69, 19, 0.4) 4px
                   )`
              }} />
          </div>

          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[60%] bg-gradient-to-b from-gray-900 via-black to-gray-900 shadow-inner rounded-lg">
            <div className="absolute inset-0 border-2 border-amber-100 rounded-lg"></div>

            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-gray-100 via-white to-gray-100 z-30 rounded-l-lg shadow-sm"></div>

            {fretPositions.slice(1, 15).map((position, i) => (
              <div
                key={i + 1}
                className="absolute top-0 bottom-0 w-0.5 bg-gradient-to-b from-gray-200 via-gray-300 to-gray-200 z-10 shadow-sm"
                style={{ left: `${position * 100}%` }}
              />
            ))}

            <div className="absolute inset-0 z-5" style={{ pointerEvents: 'none' }}>
              {[3, 5, 7, 9, 12].map(fret => {
                if (fret >= 15) return null;
                const position = fretPositions[fret];
                const nextPosition = fretPositions[fret + 1] || 1;
                const centerPosition = (position + nextPosition) / 2;
                return (
                  <div
                    key={fret}
                    className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center"
                    style={{ left: `${centerPosition * 100}%` }}
                  >
                    {fret === 12 ? (
                      <div className="flex flex-col gap-1.5">
                        <div className="w-2.5 h-2.5 bg-gradient-to-br from-gray-200 to-gray-400 rounded-full shadow-md border border-gray-300"></div>
                        <div className="w-2.5 h-2.5 bg-gradient-to-br from-gray-200 to-gray-400 rounded-full shadow-md border border-gray-300"></div>
                      </div>
                    ) : (
                      <div className="w-2.5 h-2.5 bg-gradient-to-br from-gray-200 to-gray-400 rounded-full shadow-md border border-gray-300"></div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="absolute inset-0 flex flex-col justify-evenly py-1">
              {strings.map((string, stringIndex) => (
                <motion.div
                  key={stringIndex}
                  className="relative flex items-center h-full"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: stringIndex * 0.05 }}
                >
                  <div
                    className="absolute w-full transition-all duration-200 rounded-full"
                    style={{
                      top: '50%',
                      transform: 'translateY(-50%)',
                      height: `${stringIndex < 3 ? '2px' : '1.5px'}`,
                      background: `linear-gradient(to right, ${stringIndex < 3 ? '#8B4513, #CD853F, #D2691E' : '#C0C0C0, #E0E0E0, #F5F5F5'
                        })`,
                      boxShadow: activeNoteKeysByString.current.has(stringIndex) ?
                        '0 0 8px rgba(255,215,0,0.8)' : '0 1px 2px rgba(0,0,0,0.2)'
                    }}
                  />

                  <div className="relative w-full h-full flex">
                    {string.frets.slice(0, 14).map((fret, fretIndex) => {
                      const isActive = activeNoteKeysByString.current.get(stringIndex) === `${stringIndex}-${fretIndex}` ||
                        isChordFret(stringIndex, fretIndex);
                      const isHighlighted = highlightedNotes.includes(fret.note);
                      const leftPosition = fretIndex === 0 ? '0%' : `${fretPositions[fretIndex] * 100}%`;
                      const width = fretIndex === 0 ? `${fretPositions[1] * 100}%` :
                        fretIndex < 13 ? `${(fretPositions[fretIndex + 1] - fretPositions[fretIndex]) * 100}%` :
                          `${(1 - fretPositions[fretIndex]) * 100}%`;

                      return (
                        <motion.button
                          key={fretIndex}
                          whileHover={{ backgroundColor: 'rgba(217, 119, 6, 0.3)', scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`absolute h-full border-r border-amber-600/20 flex items-center justify-center transition-all duration-200 z-20 rounded-sm ${isActive
                            ? 'bg-yellow-400/50 shadow-lg scale-105 border-yellow-500/50'
                            : isHighlighted
                              ? 'bg-blue-400/30 shadow-md border-blue-400/30'
                              : 'bg-transparent shadow-sm'
                            }`}
                          style={{
                            left: leftPosition,
                            width: width
                          }}
                          onClick={() => playNote(fret.frequency, stringIndex, fretIndex)}
                          onMouseDown={(e) => e.preventDefault()}
                        >
                          {fretIndex === 0 && (
                            <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full shadow-md border-2 ${isChordFret(stringIndex, fretIndex)
                              ? 'bg-yellow-400 border-yellow-500 shadow-yellow-500/50'
                              : 'bg-amber-600 border-amber-500'
                              }`} />
                          )}
                          {fretIndex > 0 && (
                            <motion.div
                              className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full border-2 shadow-sm ${isActive
                                ? 'bg-yellow-400 border-yellow-500 shadow-yellow-500/50'
                                : isHighlighted
                                  ? 'bg-blue-400 border-blue-500 shadow-blue-500/50'
                                  : 'bg-transparent border-white/30'
                                }`}
                              initial={{ scale: 0 }}
                              animate={{ scale: isActive ? 1.2 : 1 }}
                              transition={{ duration: 0.2 }}
                            />
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* STRINGS SPANNING FROM NECK TO BRIDGE */}
        <div className="absolute left-[60%] top-1/2 -translate-y-1/2 w-[35%] h-[25%] pointer-events-none z-15">
          <div className="absolute inset-0 flex flex-col justify-evenly">
            {strings.map((string, stringIndex) => (
              <div
                key={`span-${stringIndex}`}
                className="w-full transition-all duration-200 rounded-full"
                style={{
                  height: `${stringIndex < 3 ? '2px' : '1.5px'}`,
                  background: `linear-gradient(to right, ${stringIndex < 3 ? '#8B4513, #CD853F, #D2691E' : '#C0C0C0, #E0E0E0, #F5F5F5'
                    })`,
                  boxShadow: activeNoteKeysByString.current.has(stringIndex) ?
                    '0 0 6px rgba(255,215,0,0.6)' : '0 1px 2px rgba(0,0,0,0.1)'
                }}
              />
            ))}
          </div>
        </div>

        {/* GUITAR BODY */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[40%] h-full z-[1]">
          <div className="relative w-full h-full">
            <div className="absolute top-0 left-0 w-full h-[42%] bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 rounded-t-full shadow-lg border-2 border-amber-600/40">
              <div className="absolute inset-0 opacity-25 rounded-t-full"
                style={{
                  backgroundImage: `repeating-linear-gradient(
                       45deg,
                       rgba(139, 69, 19, 0.4) 0px,
                       rgba(160, 82, 45, 0.3) 2px,
                       rgba(139, 69, 19, 0.4) 4px
                     )`
                }} />
            </div>

            <div className="absolute top-[38%] left-[8%] w-[84%] h-[24%] bg-gradient-to-r from-amber-500 to-amber-600 shadow-inner border-y-2 border-amber-600/40"></div>

            <div className="absolute bottom-0 left-0 w-full h-[42%] bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 rounded-b-full shadow-lg border-2 border-amber-600/40">
              <div className="absolute inset-0 opacity-25 rounded-b-full"
                style={{
                  backgroundImage: `repeating-linear-gradient(
                       45deg,
                       rgba(139, 69, 19, 0.4) 0px,
                       rgba(160, 82, 45, 0.3) 2px,
                       rgba(139, 69, 19, 0.4) 4px
                     )`
                }} />
            </div>

            <div className="absolute top-[30%] left-[30%] -translate-x-1/2 -translate-y-1/2 z-10">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-black shadow-inner relative border-4 border-amber-700">
                <div className="absolute inset-1 rounded-full border-2 border-amber-500"></div>
                <div className="absolute inset-2 rounded-full border border-amber-400"></div>
                <div className="absolute inset-3 rounded-full border border-amber-300"></div>
                <div className="absolute inset-4 rounded-full border border-amber-200"></div>
                <div className="absolute inset-5 rounded-full border border-amber-100"></div>
                <div className="absolute inset-6 rounded-full bg-gradient-to-br from-amber-900 to-black opacity-80"></div>

                {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => (
                  <div
                    key={i}
                    className="absolute w-1 h-1 bg-amber-400 rounded-full"
                    style={{
                      top: '50%',
                      left: '50%',
                      transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-32px)`
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="absolute bottom-[30%] left-[30%] -translate-x-1/2 w-20 h-3 bg-gradient-to-b from-amber-700 to-amber-900 rounded shadow-lg border border-amber-800">
              <div className="absolute top-0 left-0 w-full h-full flex justify-evenly items-center">
                {strings.map((_, i) => (
                  <div key={i} className="w-1.5 h-1.5 bg-gradient-to-br from-white to-gray-200 rounded-full shadow-sm border border-gray-300"></div>
                ))}
              </div>
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gray-100 via-white to-gray-100 rounded-t shadow-sm"></div>
            </div>

            <div className="absolute inset-0 rounded-full border-4 border-amber-600/60 shadow-inner"></div>

            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-1/3 left-1/4 w-12 h-0.5 bg-amber-900 rotate-45"></div>
              <div className="absolute top-1/3 right-1/4 w-12 h-0.5 bg-amber-900 -rotate-45"></div>
              <div className="absolute bottom-1/3 left-1/4 w-8 h-0.5 bg-amber-900 rotate-12"></div>
              <div className="absolute bottom-1/3 right-1/4 w-8 h-0.5 bg-amber-900 -rotate-12"></div>
            </div>
          </div>
        </div>

        {/* Pick animation */}
        <AnimatePresence>
          {showPick && (
            <motion.div
              className="absolute z-30 w-3 h-5 bg-gradient-to-b from-amber-100 to-amber-300 rounded-sm shadow-lg pointer-events-none border border-amber-400"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{
                opacity: 1,
                scale: 1,
                x: strumDirection === 'down' ? 20 : -20,
                rotate: strumDirection === 'down' ? 15 : -15
              }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.3 }}
              style={{
                left: '75%',
                top: `${45 + pickPosition * 10}%`,
              }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Chord selection */}
      <div className="mt-4 flex justify-center flex-wrap gap-1 sm:gap-2">
        {chords.map((chord, index) => (
          <motion.button
            key={index}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all flex items-center gap-1 ${heldChord === index
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg'
              : favoriteChords.includes(chord.name)
                ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-amber-100 shadow-lg'
                : 'bg-amber-700 text-amber-100 hover:bg-amber-600 shadow-md'
              }`}
            onClick={() => {
              applyChord(index);
              setTimeout(() => handleStrum('down'), 50);
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              toggleFavoriteChord(chord.name);
            }}
          >
            {chord.name}
            {favoriteChords.includes(chord.name) && <Star className="h-3 w-3 fill-current" />}
          </motion.button>
        ))}
      </div>

      {/* Current chord display */}
      {currentChord.name && (
        <div className="text-center mt-4 bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-sm rounded-xl p-4 border border-amber-400/30">
          <span className="text-amber-100 font-medium">Current Chord: </span>
          <span className="font-bold text-amber-300 text-xl">{currentChord.name}</span>

          {currentChord.notes.length > 0 && (
            <div className="mt-2 text-amber-200 text-sm">
              Notes: {currentChord.notes.join(', ')}
            </div>
          )}

          {currentChord.intervals.length > 0 && (
            <div className="mt-1 text-amber-200 text-xs">
              Intervals: {currentChord.intervals.join(', ')}
            </div>
          )}
        </div>
      )}

      {/* Practice mode display */}
      {practiceMode && currentExercise && (
        <div className="text-center mt-4 bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-sm rounded-xl p-4 border border-purple-400/30">
          <div className="text-white font-medium mb-2">{currentExercise.title}</div>
          <div className="text-purple-200 text-sm mb-3">{currentExercise.description}</div>

          <div className="bg-white/10 rounded-full h-2 mb-2">
            <div
              className="bg-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${exerciseProgress}%` }}
            />
          </div>

          <div className="text-white text-sm">
            Progress: {exerciseProgress}% Complete
          </div>
        </div>
      )}

      {/* Control buttons */}
      <div className="flex justify-center items-center gap-4 mt-6 flex-wrap">
        <button
          onClick={playDemo}
          disabled={isMuted}
          className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-all shadow-lg ${isPlayingDemo
            ? 'bg-gradient-to-r from-red-500/80 to-red-700/80 text-white'
            : 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-white hover:from-amber-500/30 hover:to-orange-500/30'
            } ${isMuted ? 'opacity-50' : ''}`}
        >
          {isPlayingDemo ? (
            <>
              <Pause className="h-4 w-4" />
              Stop Demo
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Play Demo
            </>
          )}
        </button>

        <button
          onClick={() => setIsMuted(!isMuted)}
          className={`text-white/80 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10 shadow-lg ${isMuted ? 'bg-red-500/20 text-red-300' : ''
            }`}
        >
          {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </button>

        <button
          onClick={stopAllNotes}
          className="text-white/80 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10 shadow-lg"
        >
          <RotateCcw className="h-5 w-5" />
        </button>

        <button
          onClick={toggleRecording}
          className={`text-white/80 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10 shadow-lg ${isRecording ? 'bg-red-500/20 text-red-300' : ''
            }`}
        >
          <div className="relative">
            <div className={`h-2 w-2 rounded-full bg-current ${isRecording ? 'animate-pulse' : ''}`}></div>
            {isRecording && (
              <div className="absolute inset-0 border border-current rounded-full animate-ping"></div>
            )}
          </div>
        </button>

        {recordedPerformance.length > 0 && !isRecording && (
          <button
            onClick={playRecording}
            className="text-white/80 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10 shadow-lg"
          >
            <Play className="h-5 w-5" />
          </button>
        )}

        <button
          onClick={() => setMetronomeActive(!metronomeActive)}
          className={`text-white/80 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10 shadow-lg ${metronomeActive ? 'bg-green-500/20 text-green-300' : ''
            }`}
        >
          <Timer className="h-5 w-5" />
        </button>

        <button
          onClick={playCurrentChord}
          disabled={currentChord.name === "" || isMuted}
          className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-all shadow-lg ${currentChord.name === "" || isMuted
            ? 'opacity-50 bg-gray-600'
            : 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30'
            }`}
        >
          <Play className="h-4 w-4" />
          Play Chord
        </button>
      </div>

      {/* Demo tooltip */}
      <AnimatePresence>
        {showDemoTip && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center mt-4 bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-sm border border-amber-500/30 rounded-full px-4 py-2 text-white text-sm font-medium inline-block"
          >
            <Zap className="inline w-4 h-4 mr-2" />
            {isTouch ? 'Tap frets to play • Swipe to strum' : 'Click frets to play • Drag to strum'}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Current chord indicator */}
      {currentChordIndex >= 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mt-4"
        >
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-sm rounded-full px-4 py-2 text-white text-sm border border-amber-500/30">
            <span>🎸 Playing:</span>
            <span className="font-bold">{chords[currentChordIndex].name}</span>
          </div>
        </motion.div>
      )}

      {/* Recording indicator */}
      {isRecording && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center mt-4"
        >
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-red-500/20 to-pink-500/20 backdrop-blur-sm rounded-full px-4 py-2 text-white text-sm border border-red-500/30">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span>Recording...</span>
          </div>
        </motion.div>
      )}

      {/* Metronome indicator */}
      {metronomeActive && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center mt-4"
        >
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm rounded-full px-4 py-2 text-white text-sm border border-green-500/30">
            <Timer className="h-4 w-4" />
            <span>Metronome: {timeSignature.beats}/{timeSignature.noteValue} • {tempo} BPM</span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default InteractiveGuitar;
