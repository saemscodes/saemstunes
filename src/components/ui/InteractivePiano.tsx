import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, Info, Settings, X, RotateCcw, Clock } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface PianoKey {
  note: string;
  type: 'white' | 'black';
  frequency: number;
  keyboardKey?: string;
  position: number;
  width: number;
}

interface AudioState {
  context: AudioContext | null;
  gainNode: GainNode | null;
  compressor: DynamicsCompressorNode | null;
  reverb: ConvolverNode | null;
}

// Define piano keys as a constant array
const PIANO_KEYS: PianoKey[] = (() => {
  const whiteKeyWidth = 100 / 10;
  const blackKeyWidth = whiteKeyWidth * 0.6;
  
  return [
    // White keys
    { note: 'C', type: 'white', frequency: 261.63, keyboardKey: 'a', position: 0, width: whiteKeyWidth },
    { note: 'D', type: 'white', frequency: 293.66, keyboardKey: 's', position: whiteKeyWidth, width: whiteKeyWidth },
    { note: 'E', type: 'white', frequency: 329.63, keyboardKey: 'd', position: whiteKeyWidth * 2, width: whiteKeyWidth },
    { note: 'F', type: 'white', frequency: 349.23, keyboardKey: 'f', position: whiteKeyWidth * 3, width: whiteKeyWidth },
    { note: 'G', type: 'white', frequency: 392.00, keyboardKey: 'g', position: whiteKeyWidth * 4, width: whiteKeyWidth },
    { note: 'A', type: 'white', frequency: 440.00, keyboardKey: 'h', position: whiteKeyWidth * 5, width: whiteKeyWidth },
    { note: 'B', type: 'white', frequency: 493.88, keyboardKey: 'j', position: whiteKeyWidth * 6, width: whiteKeyWidth },
    { note: "C'", type: 'white', frequency: 523.25, keyboardKey: 'k', position: whiteKeyWidth * 7, width: whiteKeyWidth },
    { note: "D'", type: 'white', frequency: 587.33, keyboardKey: 'l', position: whiteKeyWidth * 8, width: whiteKeyWidth },
    { note: "E'", type: 'white', frequency: 659.25, keyboardKey: ';', position: whiteKeyWidth * 9, width: whiteKeyWidth },
    
    // Black keys
    { note: 'C#', type: 'black', frequency: 277.18, keyboardKey: 'w', position: whiteKeyWidth * 0.7, width: blackKeyWidth },
    { note: 'D#', type: 'black', frequency: 311.13, keyboardKey: 'e', position: whiteKeyWidth * 1.7, width: blackKeyWidth },
    { note: 'F#', type: 'black', frequency: 369.99, keyboardKey: 't', position: whiteKeyWidth * 3.7, width: blackKeyWidth },
    { note: 'G#', type: 'black', frequency: 415.30, keyboardKey: 'y', position: whiteKeyWidth * 4.7, width: blackKeyWidth },
    { note: 'A#', type: 'black', frequency: 466.16, keyboardKey: 'u', position: whiteKeyWidth * 5.7, width: blackKeyWidth },
    { note: "C#'", type: 'black', frequency: 554.37, keyboardKey: 'o', position: whiteKeyWidth * 7.7, width: blackKeyWidth },
    { note: "D#'", type: 'black', frequency: 622.25, keyboardKey: 'p', position: whiteKeyWidth * 8.7, width: blackKeyWidth },
  ];
})();

const InteractivePiano: React.FC = () => {
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
  const [isPlayingDemo, setIsPlayingDemo] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [waveform, setWaveform] = useState<OscillatorType>('sine');
  const [sustainPedal, setSustainPedal] = useState(false);
  const [octaveShift, setOctaveShift] = useState(0);
  const [audioReady, setAudioReady] = useState(false);
  const [tempo, setTempo] = useState(120);
  const [noteBeingHeld, setNoteBeingHeld] = useState<string | null>(null);
  const [noteDuration, setNoteDuration] = useState(0);
  const [rhythmValue, setRhythmValue] = useState<string>('Quarter note');
  const [panelPosition, setPanelPosition] = useState<'left' | 'right' | null>(null);
  const isMobile = useIsMobile();
  
  const audioState = useRef<AudioState>({
    context: null,
    gainNode: null,
    compressor: null,
    reverb: null
  });
  
  const oscillators = useRef<Map<string, OscillatorNode>>(new Map());
  const sustainedNotes = useRef<Set<string>>(new Set());
  const demoTimeouts = useRef<NodeJS.Timeout[]>([]);
  const noteStartTime = useRef<number>(0);
  const durationTimer = useRef<NodeJS.Timeout | null>(null);
  const touchActiveRef = useRef(false);

  // Note duration values in beats
  const noteDurations = {
    'Whole note': 4,
    'Half note': 2,
    'Quarter note': 1,
    'Eighth note': 0.5,
    'Sixteenth note': 0.25,
    'Thirty-second note': 0.125,
  };

  // Calculate duration based on current tempo
  const getNoteDurationMs = (beats: number) => {
    return (beats * 60000) / tempo;
  };

  // Classify held duration into nearest note value
  const classifyDuration = (durationMs: number) => {
    const beatDuration = 60000 / tempo;
    const beats = durationMs / beatDuration;
    
    const noteTypes = Object.entries(noteDurations);
    let closest = noteTypes[0];
    let minDiff = Math.abs(beats - closest[1]);
    
    for (const [name, value] of noteTypes) {
      const diff = Math.abs(beats - value);
      if (diff < minDiff) {
        minDiff = diff;
        closest = [name, value];
      }
    }
    
    return closest[0];
  };

  // Enhanced melodies with rhythm information
  const melodies = [
  // 🌟 Twinkle Twinkle Little Star (Complete)
  [
    { note: 'C', duration: 1 }, 
    { note: 'C', duration: 1 },
    { note: 'G', duration: 1 },
    { note: 'G', duration: 1 },
    { note: 'A', duration: 1 },
    { note: 'A', duration: 1 },
    { note: 'G', duration: 2 },
    { note: 'F', duration: 1 },
    { note: 'F', duration: 1 },
    { note: 'E', duration: 1 },
    { note: 'E', duration: 1 },
    { note: 'D', duration: 1 },
    { note: 'D', duration: 1 },
    { note: 'C', duration: 2 },
    { note: 'G', duration: 1 },
    { note: 'G', duration: 1 },
    { note: 'F', duration: 1 },
    { note: 'F', duration: 1 },
    { note: 'E', duration: 1 },
    { note: 'E', duration: 1 },
    { note: 'D', duration: 2 },
    { note: 'G', duration: 1 },
    { note: 'G', duration: 1 },
    { note: 'F', duration: 1 },
    { note: 'F', duration: 1 },
    { note: 'E', duration: 1 },
    { note: 'E', duration: 1 },
    { note: 'D', duration: 2 },
    { note: 'C', duration: 1 },
    { note: 'C', duration: 1 },
    { note: 'G', duration: 1 },
    { note: 'G', duration: 1 },
    { note: 'A', duration: 1 },
    { note: 'A', duration: 1 },
    { note: 'G', duration: 2 },
    { note: 'F', duration: 1 },
    { note: 'F', duration: 1 },
    { note: 'E', duration: 1 },
    { note: 'E', duration: 1 },
    { note: 'D', duration: 1 },
    { note: 'D', duration: 1 },
    { note: 'C', duration: 4 }
  ],

  // 🚣 Row, Row, Row Your Boat
  [
    { note: 'C', duration: 1 },
    { note: 'C', duration: 1 },
    { note: 'C', duration: 0.75 },
    { note: 'D', duration: 0.25 },
    { note: 'E', duration: 2 },
    { note: 'E', duration: 0.75 },
    { note: 'D', duration: 0.25 },
    { note: 'E', duration: 0.75 },
    { note: 'F', duration: 0.25 },
    { note: 'G', duration: 4 },
    { note: 'C', duration: 0.5 },
    { note: 'C', duration: 0.5 },
    { note: 'C', duration: 0.5 },
    { note: 'G', duration: 0.5 },
    { note: 'G', duration: 0.5 },
    { note: 'G', duration: 0.5 },
    { note: 'E', duration: 0.5 },
    { note: 'E', duration: 0.5 },
    { note: 'E', duration: 0.5 },
    { note: 'C', duration: 0.5 },
    { note: 'C', duration: 0.5 },
    { note: 'C', duration: 0.5 },
    { note: 'G', duration: 0.75 },
    { note: 'F', duration: 0.25 },
    { note: 'E', duration: 0.75 },
    { note: 'D', duration: 0.25 },
    { note: 'C', duration: 4 }
  ],

  // 🎼 Mary Had a Little Lamb (Complete verse)
  [
    { note: 'E', duration: 1 },
    { note: 'D', duration: 1 },
    { note: 'C', duration: 1 },
    { note: 'D', duration: 1 },
    { note: 'E', duration: 1 },
    { note: 'E', duration: 1 },
    { note: 'E', duration: 2 },
    { note: 'D', duration: 1 },
    { note: 'D', duration: 1 },
    { note: 'D', duration: 2 },
    { note: 'E', duration: 1 },
    { note: 'G', duration: 1 },
    { note: 'G', duration: 2 },
    { note: 'E', duration: 1 },
    { note: 'D', duration: 1 },
    { note: 'C', duration: 1 },
    { note: 'D', duration: 1 },
    { note: 'E', duration: 1 },
    { note: 'E', duration: 1 },
    { note: 'E', duration: 1 },
    { note: 'E', duration: 1 },
    { note: 'D', duration: 1 },
    { note: 'D', duration: 1 },
    { note: 'E', duration: 1 },
    { note: 'D', duration: 1 },
    { note: 'C', duration: 4 }
  ],

  // 🎶 Happy Birthday (Complete song)
  [
    { note: 'C', duration: 1 },
    { note: 'C', duration: 1 },
    { note: 'D', duration: 2 },
    { note: 'C', duration: 2 },
    { note: 'F', duration: 2 },
    { note: 'E', duration: 4 },
    { note: 'C', duration: 1 },
    { note: 'C', duration: 1 },
    { note: 'D', duration: 2 },
    { note: 'C', duration: 2 },
    { note: 'G', duration: 2 },
    { note: 'F', duration: 4 },
    { note: 'C', duration: 1 },
    { note: 'C', duration: 1 },
    { note: 'C', duration: 2 },
    { note: 'A', duration: 2 },
    { note: 'F', duration: 2 },
    { note: 'E', duration: 2 },
    { note: 'D', duration: 4 },
    { note: 'A#', duration: 1 },
    { note: 'A#', duration: 1 },
    { note: 'A', duration: 2 },
    { note: 'F', duration: 2 },
    { note: 'G', duration: 2 },
    { note: 'F', duration: 4 }
  ],

  // 🎹 Ode to Joy (Complete first section)
  [
    { note: 'E', duration: 1 },
    { note: 'E', duration: 1 },
    { note: 'F', duration: 1 },
    { note: 'G', duration: 1 },
    { note: 'G', duration: 1 },
    { note: 'F', duration: 1 },
    { note: 'E', duration: 1 },
    { note: 'D', duration: 1 },
    { note: 'C', duration: 1 },
    { note: 'C', duration: 1 },
    { note: 'D', duration: 1 },
    { note: 'E', duration: 1 },
    { note: 'E', duration: 1.5 },
    { note: 'D', duration: 0.5 },
    { note: 'D', duration: 2 },
    { note: 'E', duration: 1 },
    { note: 'E', duration: 1 },
    { note: 'F', duration: 1 },
    { note: 'G', duration: 1 },
    { note: 'G', duration: 1 },
    { note: 'F', duration: 1 },
    { note: 'E', duration: 1 },
    { note: 'D', duration: 1 },
    { note: 'C', duration: 1 },
    { note: 'C', duration: 1 },
    { note: 'D', duration: 1 },
    { note: 'E', duration: 1 },
    { note: 'D', duration: 1.5 },
    { note: 'C', duration: 0.5 },
    { note: 'C', duration: 4 }
  ],

  // 🎵 Baa Baa Black Sheep (Added nursery rhyme)
  [
    { note: 'C', duration: 1 },
    { note: 'C', duration: 1 },
    { note: 'G', duration: 1 },
    { note: 'G', duration: 1 },
    { note: 'A', duration: 1 },
    { note: 'A', duration: 1 },
    { note: 'G', duration: 2 },
    { note: 'F', duration: 1 },
    { note: 'F', duration: 1 },
    { note: 'E', duration: 1 },
    { note: 'E', duration: 1 },
    { note: 'D', duration: 1 },
    { note: 'D', duration: 1 },
    { note: 'C', duration: 2 },
    { note: 'G', duration: 1 },
    { note: 'G', duration: 1 },
    { note: 'F', duration: 1 },
    { note: 'F', duration: 1 },
    { note: 'E', duration: 1 },
    { note: 'E', duration: 1 },
    { note: 'D', duration: 2 },
    { note: 'G', duration: 1 },
    { note: 'G', duration: 1 },
    { note: 'F', duration: 1 },
    { note: 'F', duration: 1 },
    { note: 'E', duration: 1 },
    { note: 'E', duration: 1 },
    { note: 'D', duration: 2 },
    { note: 'C', duration: 1 },
    { note: 'C', duration: 1 },
    { note: 'G', duration: 1 },
    { note: 'G', duration: 1 },
    { note: 'A', duration: 1 },
    { note: 'A', duration: 1 },
    { note: 'G', duration: 2 },
    { note: 'F', duration: 1 },
    { note: 'F', duration: 1 },
    { note: 'E', duration: 1 },
    { note: 'E', duration: 1 },
    { note: 'D', duration: 1 },
    { note: 'D', duration: 1 },
    { note: 'C', duration: 4 }
  ]
  ];

  // Use the constant keys array
  const keys = PIANO_KEYS;
  
  // Enhanced audio initialization
  useEffect(() => {
    const initAudio = async () => {
      try {
        const context = new (window.AudioContext || (window as any).webkitAudioContext)();
        const gainNode = context.createGain();
        const compressor = context.createDynamicsCompressor();
        
        // Create reverb effect
        const reverb = context.createConvolver();
        const reverbGain = context.createGain();
        
        // Simple reverb impulse response
        const impulseLength = context.sampleRate * 2;
        const impulse = context.createBuffer(2, impulseLength, context.sampleRate);
        for (let channel = 0; channel < 2; channel++) {
          const channelData = impulse.getChannelData(channel);
          for (let i = 0; i < impulseLength; i++) {
            channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / impulseLength, 2);
          }
        }
        reverb.buffer = impulse;
        
        // Connect audio graph
        gainNode.connect(compressor);
        compressor.connect(reverbGain);
        reverbGain.connect(reverb);
        reverb.connect(context.destination);
        compressor.connect(context.destination);
        
        gainNode.gain.setValueAtTime(volume, context.currentTime);
        reverbGain.gain.setValueAtTime(0.2, context.currentTime);
        
        audioState.current = { context, gainNode, compressor, reverb };
        
        const resumeAudio = async () => {
          if (context.state === 'suspended') {
            await context.resume();
          }
          setAudioReady(true);
        };

        document.addEventListener('click', resumeAudio, { once: true });
        document.addEventListener('touchstart', resumeAudio, { once: true });
      } catch (error) {
        console.error('Audio initialization failed:', error);
      }
    };
    
    initAudio();
    
    return () => {
      if (audioState.current.context) {
        audioState.current.context.close();
      }
      demoTimeouts.current.forEach(timeout => clearTimeout(timeout));
      if (durationTimer.current) {
        clearTimeout(durationTimer.current);
      }
    };
  }, []);

  // Volume and mute handling
  useEffect(() => {
    if (audioState.current.gainNode) {
      audioState.current.gainNode.gain.value = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

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
    sustainedNotes.current.clear();
    setActiveKeys(new Set());
    setNoteBeingHeld(null);
    setNoteDuration(0);
    if (durationTimer.current) {
      clearTimeout(durationTimer.current);
    }
  }, []);

  // Enhanced audio playback with envelope, harmonics, and filter
  const playAudioNote = useCallback(async (noteInfo: PianoKey, velocity = 0.5) => {
    if (!audioState.current.context || !audioState.current.gainNode || isMuted) return;

    try {
      if (audioState.current.context.state === 'suspended') {
        await audioState.current.context.resume();
        setAudioReady(true);
      }

      const { context, gainNode } = audioState.current;
      const existingOsc = oscillators.current.get(noteInfo.note);
      if (existingOsc) {
        existingOsc.stop();
        oscillators.current.delete(noteInfo.note);
      }

      // Create primary oscillator
      const oscillator = context.createOscillator();
      const noteGain = context.createGain();
      const filter = context.createBiquadFilter();
      
      // Apply octave shift
      const adjustedFreq = noteInfo.frequency * Math.pow(2, octaveShift);
      
      oscillator.connect(filter);
      filter.connect(noteGain);
      noteGain.connect(gainNode);
      
      oscillator.frequency.setValueAtTime(adjustedFreq, context.currentTime);
      oscillator.type = waveform;
      
      // Subtle filter for warmth
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(adjustedFreq * 4, context.currentTime);
      filter.Q.setValueAtTime(0.5, context.currentTime);
      
      // Enhanced envelope with velocity sensitivity
      const attackTime = 0.01;
      const decayTime = 0.1;
      const sustainLevel = sustainPedal ? 0.6 : 0.4;
      const releaseTime = sustainPedal ? 2.0 : 0.8;
      const velocityMultiplier = Math.max(0.1, Math.min(1.0, velocity));
      
      noteGain.gain.setValueAtTime(0, context.currentTime);
      noteGain.gain.linearRampToValueAtTime(volume * velocityMultiplier * 0.8, context.currentTime + attackTime);
      noteGain.gain.exponentialRampToValueAtTime(volume * velocityMultiplier * sustainLevel, context.currentTime + attackTime + decayTime);
      
      if (!sustainPedal) {
        noteGain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + releaseTime);
      }
      
      oscillator.start(context.currentTime);
      
      if (sustainPedal) {
        oscillators.current.set(noteInfo.note, oscillator);
        sustainedNotes.current.add(noteInfo.note);
      } else {
        oscillator.stop(context.currentTime + releaseTime);
      }
      
      return oscillator;
    } catch (error) {
      console.error('Note playback failed:', error);
      return null;
    }
  }, [volume, isMuted, waveform, octaveShift, sustainPedal]);

  const stopNote = useCallback((note: string) => {
    const oscillator = oscillators.current.get(note);
    if (oscillator && audioState.current.context) {
      const { context } = audioState.current;
      const noteGain = context.createGain();
      noteGain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.3);
      oscillator.stop(context.currentTime + 0.3);
      oscillators.current.delete(note);
      sustainedNotes.current.delete(note);
    }
  }, []);

  // Enhanced note press handling with duration tracking
  const handleNotePress = (key: PianoKey, durationBeats?: number) => {
    noteStartTime.current = Date.now();
    setNoteBeingHeld(key.note);
    setNoteDuration(0);
    
    // Start duration tracking
    const updateDuration = () => {
      if (noteBeingHeld === key.note) {
        const currentDuration = Date.now() - noteStartTime.current;
        setNoteDuration(currentDuration);
        
        // Use provided duration if available (for demo), otherwise classify
        const rhythm = durationBeats 
          ? `${durationBeats} beat${durationBeats !== 1 ? 's' : ''}` 
          : classifyDuration(currentDuration);
          
        setRhythmValue(`${rhythm} (${(currentDuration / 1000).toFixed(1)}s)`);
        durationTimer.current = setTimeout(updateDuration, 50);
      }
    };
    updateDuration();
    
    playAudioNote(key);
    setActiveKeys(prev => new Set(prev).add(key.note));
  };

  // Enhanced note release handling
  const handleNoteRelease = (key: PianoKey) => {
    if (noteBeingHeld === key.note) {
      const finalDuration = Date.now() - noteStartTime.current;
      const finalRhythm = classifyDuration(finalDuration);
      setRhythmValue(`${finalRhythm} (${(finalDuration / 1000).toFixed(1)}s)`);
      setNoteBeingHeld(null);
      if (durationTimer.current) {
        clearTimeout(durationTimer.current);
      }
    }
    
    if (!sustainPedal) {
      stopNote(key.note);
      setTimeout(() => {
        setActiveKeys(prev => {
          const newSet = new Set(prev);
          newSet.delete(key.note);
          return newSet;
        });
      }, 300);
    }
  };

  // Tempo-based demo timing with rhythm support
  const playDemo = useCallback(async () => {
    if (isPlayingDemo || isMuted) return;
    
    setIsPlayingDemo(true);
    demoTimeouts.current.forEach(timeout => clearTimeout(timeout));
    demoTimeouts.current = [];
    
    try {
      if (audioState.current.context?.state === 'suspended') {
        await audioState.current.context.resume();
        setAudioReady(true);
      }
      
      const melody = melodies[Math.floor(Math.random() * melodies.length)];
      let accumulatedTime = 0;
      
      melody.forEach((noteObj) => {
        const noteDurationMs = getNoteDurationMs(noteObj.duration);
        const releaseOffset = noteDurationMs * 0.8;
        
        // Schedule note press
        demoTimeouts.current.push(setTimeout(() => {
          const key = keys.find(k => k.note === noteObj.note);
          if (key) {
            handleNotePress(key, noteObj.duration);
          }
        }, accumulatedTime));
        
        // Schedule note release
        demoTimeouts.current.push(setTimeout(() => {
          const key = keys.find(k => k.note === noteObj.note);
          if (key) {
            handleNoteRelease(key);
          }
        }, accumulatedTime + releaseOffset));
        
        accumulatedTime += noteDurationMs;
      });
      
      demoTimeouts.current.push(setTimeout(() => {
        setIsPlayingDemo(false);
      }, accumulatedTime + 500));
      
    } catch (error) {
      console.error('Demo playback failed:', error);
      setIsPlayingDemo(false);
    }
  }, [isPlayingDemo, tempo, isMuted, keys]);

  // Keyboard event handling
  useEffect(() => {
    const keyMap: Record<string, PianoKey> = {};
    keys.forEach(key => {
      if (key.keyboardKey) {
        keyMap[key.keyboardKey] = key;
      }
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const noteInfo = keyMap[key];
      
      if (noteInfo && !activeKeys.has(noteInfo.note)) {
        handleNotePress(noteInfo);
      }
      
      if (key === ' ') {
        e.preventDefault();
        playDemo();
      }
      if (e.key === 'Shift') setSustainPedal(true);
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setOctaveShift(prev => Math.min(prev + 1, 2));
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setOctaveShift(prev => Math.max(prev - 1, -2));
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const noteInfo = keyMap[key];
      
      if (noteInfo) {
        handleNoteRelease(noteInfo);
      }
      
      if (e.key === 'Shift') {
        setSustainPedal(false);
        // Release all sustained notes
        sustainedNotes.current.forEach(note => {
          stopNote(note);
          setTimeout(() => {
            setActiveKeys(prev => {
              const newSet = new Set(prev);
              newSet.delete(note);
              return newSet;
            });
          }, 300);
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [activeKeys, keys, playDemo, stopNote]);

  const whiteKeys = keys.filter(k => k.type === 'white');
  const blackKeys = keys.filter(k => k.type === 'black');

  return (
    <motion.div
      className="relative bg-gradient-to-b from-slate-900 via-slate-800 to-black p-3 sm:p-6 rounded-2xl shadow-2xl overflow-hidden w-full max-w-5xl mx-auto"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
    >
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-purple-500/10 opacity-50" />
      
      {/* Side Panel Buttons - Adjusted for mobile */}
      <div className="absolute inset-y-0 left-0 flex items-center z-30">
        <button
          onClick={() => setPanelPosition(panelPosition === 'left' ? null : 'left')}
          className="ml-[-16px] sm:ml-[-20px] w-8 h-16 sm:w-10 sm:h-20 bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 rounded-r-lg shadow-lg flex items-center justify-center transition-all group"
        >
          <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-white group-hover:scale-110 transition-transform" />
        </button>
      </div>
      
      <div className="absolute inset-y-0 right-0 flex items-center z-30">
        <button
          onClick={() => setPanelPosition(panelPosition === 'right' ? null : 'right')}
          className="mr-[-16px] sm:mr-[-20px] w-8 h-16 sm:w-10 sm:h-20 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 rounded-l-lg shadow-lg flex items-center justify-center transition-all group"
        >
          <Info className="h-4 w-4 sm:h-5 sm:w-5 text-white group-hover:scale-110 transition-transform" />
        </button>
      </div>
      
      {/* Left Settings Panel - Made responsive */}
      <AnimatePresence>
        {panelPosition === 'left' && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute top-0 left-0 h-full w-[280px] sm:w-80 bg-gradient-to-b from-slate-900 to-slate-800 border-r border-slate-700 shadow-2xl z-20 flex flex-col"
          >
            <div className="flex items-center justify-between p-6">
              <h3 className="text-white font-semibold text-lg flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Piano Settings
              </h3>
              <button
                onClick={() => setPanelPosition(null)}
                className="text-white/60 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            {/* Scrollable content container */}
            <div className="flex-grow overflow-y-auto px-6 pb-6">
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-4">
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-white font-medium flex items-center gap-2">
                        <Volume2 className="h-4 w-4" />
                        Volume
                      </label>
                      <span className="text-primary font-mono text-sm">
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
                      className="w-full accent-primary bg-white/10 rounded-lg"
                    />
                  </div>
                  
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-white font-medium flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Tempo
                      </label>
                      <span className="text-purple-400 font-mono text-sm">
                        {tempo} BPM
                      </span>
                    </div>
                    <input
                      type="range"
                      min="60"
                      max="200"
                      step="10"
                      value={tempo}
                      onChange={(e) => setTempo(parseInt(e.target.value))}
                      className="w-full accent-purple-500 bg-white/10 rounded-lg"
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
                      <option value="sine">Sine (Piano-like)</option>
                      <option value="sawtooth">Sawtooth</option>
                      <option value="square">Square</option>
                      <option value="triangle">Triangle</option>
                    </select>
                  </div>
                  
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-white font-medium">Octave</label>
                      <span className="text-blue-400 font-mono text-sm">
                        {octaveShift > 0 ? '+' : ''}{octaveShift}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setOctaveShift(prev => Math.max(prev - 1, -2))}
                        className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 px-3 rounded-lg transition-colors font-medium"
                        disabled={octaveShift <= -2}
                      >
                        ↓ Lower
                      </button>
                      <button
                        onClick={() => setOctaveShift(0)}
                        className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 py-2 px-3 rounded-lg transition-colors font-medium"
                      >
                        Reset
                      </button>
                      <button
                        onClick={() => setOctaveShift(prev => Math.min(prev + 1, 2))}
                        className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 px-3 rounded-lg transition-colors font-medium"
                        disabled={octaveShift >= 2}
                      >
                        ↑ Higher
                      </button>
                    </div>
                  </div>
                  
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <label className="text-white font-medium">Sustain Pedal</label>
                      <button
                        onClick={() => setSustainPedal(!sustainPedal)}
                        className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${
                          sustainPedal ? 'bg-primary' : 'bg-white/20'
                        }`}
                      >
                        <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform duration-300 ${
                          sustainPedal ? 'translate-x-7' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>
                    <p className="text-white/60 text-sm mt-2">
                      Hold Shift key or toggle here
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Right Keyguide Panel - Made responsive */}
      <AnimatePresence>
        {panelPosition === 'right' && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute top-0 right-0 h-full w-[280px] sm:w-80 bg-gradient-to-b from-slate-900 to-slate-800 border-l border-slate-700 shadow-2xl z-20 flex flex-col"
          >
            <div className="flex items-center justify-between p-6">
              <h3 className="text-white font-semibold text-lg flex items-center gap-2">
                <Info className="h-5 w-5" />
                Keyboard Shortcuts
              </h3>
              <button
                onClick={() => setPanelPosition(null)}
                className="text-white/60 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            {/* Scrollable content container */}
            <div className="flex-grow overflow-y-auto px-6 pb-6">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <h4 className="font-medium mb-1 text-white/80">White Keys</h4>
                  <div className="space-y-1">
                    {keys.filter(k => k.type === 'white').map((key) => (
                      <div key={key.note} className="flex justify-between">
                        <span className="text-white/70">{key.note}</span>
                        <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-xs text-white/90">
                          {key.keyboardKey?.toUpperCase()}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-1 text-white/80">Black Keys</h4>
                  <div className="space-y-1">
                    {keys.filter(k => k.type === 'black').map((key) => (
                      <div key={key.note} className="flex justify-between">
                        <span className="text-white/70">{key.note}</span>
                        <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-xs text-white/90">
                          {key.keyboardKey?.toUpperCase()}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-white/10">
                <h4 className="font-medium mb-1 text-white/80">Controls</h4>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-white/70">Play Demo</span>
                    <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-xs text-white/90">SPACE</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Sustain Pedal</span>
                    <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-xs text-white/90">SHIFT</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Octave Up</span>
                    <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-xs text-white/90">↑</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Octave Down</span>
                    <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-xs text-white/90">↓</kbd>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rhythm Display - Responsive positioning */}
      {noteBeingHeld && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-2 sm:top-4 left-2 right-2 sm:left-1/2 sm:transform sm:-translate-x-1/2 bg-blue-500/20 backdrop-blur-sm border border-blue-500/30 rounded-lg px-3 py-1 text-xs sm:text-sm text-blue-100 font-medium z-40 shadow-lg truncate"
          style={{
            left: panelPosition === 'left' ? 'calc(50% + 140px)' : 
                  panelPosition === 'right' ? 'calc(50% - 140px)' : '50%',
            transition: 'left 0.3s ease',
            maxWidth: isMobile ? 'calc(100vw - 2rem)' : 'none'
          }}
        >
          <Clock className="inline w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
          Playing: {rhythmValue} • Tempo: {tempo} BPM
        </motion.div>
      )}
      
      <div className="relative z-10">
        {/* Control buttons */}
        <motion.div 
          className="flex flex-wrap justify-center items-center gap-2 mb-3 sm:mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <button
            onClick={playDemo}
            disabled={isPlayingDemo || isMuted}
            className={`text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10 ${
              isPlayingDemo ? 'bg-blue-500/20' : ''
            }`}
          >
            {isPlayingDemo ? <Pause className="h-3 w-3 sm:h-4 sm:w-4" /> : <Play className="h-3 w-3 sm:h-4 sm:w-4" />}
          </button>
          
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10 ${
              isMuted ? 'bg-red-500/20 text-red-300' : ''
            }`}
          >
            {isMuted ? <VolumeX className="h-3 w-3 sm:h-4 sm:w-4" /> : <Volume2 className="h-3 w-3 sm:h-4 sm:w-4" />}
          </button>
          
          <button
            onClick={stopAllNotes}
            className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
          >
            <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4" />
          </button>
        </motion.div>

        {/* Piano Keyboard - Made fully responsive */}
        <div className="relative bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg p-2 sm:p-4 shadow-inner overflow-x-auto">
          <div className="relative w-full min-w-[320px] pb-[20%] sm:pb-[25%] min-h-[120px] sm:min-h-[150px] md:min-h-[180px]">
            <div className="absolute inset-0">
              {/* White keys */}
              {whiteKeys.map((key) => (
                <motion.button
                  key={key.note}
                  className={`
                    absolute rounded-b-lg transition-all duration-150 select-none
                    ${activeKeys.has(key.note)
                      ? 'bg-gradient-to-b from-primary-400 to-primary-600 shadow-xl shadow-primary-500/50 scale-95' 
                      : 'bg-gradient-to-b from-white to-gray-100 hover:from-gray-50 hover:to-gray-200 shadow-lg hover:shadow-xl'
                    }
                    active:scale-90 border border-gray-300
                  `}
                  style={{
                    left: `${key.position}%`,
                    width: `${key.width}%`,
                    height: '100%',
                    touchAction: 'none' // FIX: Prevent touch gestures
                  }}
                  onMouseDown={() => {
                    if (touchActiveRef.current) return;
                    handleNotePress(key);
                  }}
                  onMouseUp={() => {
                    if (touchActiveRef.current) return;
                    handleNoteRelease(key);
                  }}
                  onMouseLeave={() => {
                    if (touchActiveRef.current) return;
                    handleNoteRelease(key);
                  }}
                  onTouchStart={() => {
                    touchActiveRef.current = true;
                    handleNotePress(key);
                  }}
                  onTouchEnd={() => {
                    handleNoteRelease(key);
                    setTimeout(() => {
                      touchActiveRef.current = false;
                    }, 100);
                  }}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="absolute bottom-1 sm:bottom-2 left-1/2 transform -translate-x-1/2 text-center">
                    <span className={`text-[10px] sm:text-xs font-medium block ${
                      activeKeys.has(key.note) ? 'text-primary-900' : 'text-slate-700'
                    }`}>
                      {key.note}
                    </span>
                    {!isMobile && key.keyboardKey && (
                      <span className={`text-[9px] sm:text-xs block ${
                        activeKeys.has(key.note) ? 'text-primary-800' : 'text-slate-500'
                      }`}>
                        {key.keyboardKey.toUpperCase()}
                      </span>
                    )}
                  </div>
                </motion.button>
              ))}

              {/* Black keys */}
              {blackKeys.map((key) => (
                <motion.button
                  key={key.note}
                  className={`
                    absolute rounded-b-md transition-all duration-150 select-none
                    ${activeKeys.has(key.note)
                      ? 'bg-gradient-to-b from-primary-400 to-primary-600 shadow-xl shadow-primary-500/50 scale-95' 
                      : 'bg-gradient-to-b from-gray-900 to-black hover:from-gray-800 hover:to-gray-900 shadow-lg'
                    }
                    active:scale-90 border border-gray-700
                  `}
                  style={{ 
                    left: `${key.position}%`,
                    width: `${key.width}%`,
                    height: '65%',
                    zIndex: 10,
                    touchAction: 'none' // FIX: Prevent touch gestures
                  }}
                  onMouseDown={() => {
                    if (touchActiveRef.current) return;
                    handleNotePress(key);
                  }}
                  onMouseUp={() => {
                    if (touchActiveRef.current) return;
                    handleNoteRelease(key);
                  }}
                  onMouseLeave={() => {
                    if (touchActiveRef.current) return;
                    handleNoteRelease(key);
                  }}
                  onTouchStart={() => {
                    touchActiveRef.current = true;
                    handleNotePress(key);
                  }}
                  onTouchEnd={() => {
                    handleNoteRelease(key);
                    setTimeout(() => {
                      touchActiveRef.current = false;
                    }, 100);
                  }}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="absolute bottom-1 sm:bottom-2 left-1/2 transform -translate-x-1/2 text-center">
                    <span className={`text-[10px] sm:text-xs font-medium block ${
                      activeKeys.has(key.note) ? 'text-primary-200' : 'text-white'
                    }`}>
                      {key.note}
                    </span>
                    {!isMobile && key.keyboardKey && (
                      <span className={`text-[9px] sm:text-xs block ${
                        activeKeys.has(key.note) ? 'text-primary-300' : 'text-white/60'
                      }`}>
                        {key.keyboardKey.toUpperCase()}
                      </span>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* Status indicators - Responsive text */}
        <motion.div 
          className="text-center mt-3 sm:mt-4 space-y-1 sm:space-y-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2 text-[10px] sm:text-xs">
            <span className="text-white/80">Interactive Piano</span>
            {sustainPedal && (
              <span className="bg-primary/20 text-primary-400 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-[9px] sm:text-xs">
                Sustain ON
              </span>
            )}
            {octaveShift !== 0 && (
              <span className="bg-blue-500/20 text-blue-400 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-[9px] sm:text-xs">
                Octave {octaveShift > 0 ? '+' : ''}{octaveShift}
              </span>
            )}
            <span className="bg-purple-500/20 text-purple-400 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-[9px] sm:text-xs">
              Tempo: {tempo} BPM
            </span>
            {isMuted && (
              <span className="bg-red-500/20 text-red-400 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-[9px] sm:text-xs">
                Muted
              </span>
            )}
          </div>
          
          <AnimatePresence>
            {activeKeys.size > 0 && !isMuted && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="inline-flex items-center gap-1 sm:gap-2 bg-gradient-to-r from-primary/20 to-purple-500/20 backdrop-blur-sm rounded-full px-2 py-1 sm:px-3 sm:py-1.5 text-white text-[10px] sm:text-sm border border-primary/30"
              >
                <span>🎹 Playing</span>
                <span className="font-medium truncate max-w-[80px] sm:max-w-none">
                  {Array.from(activeKeys).join(', ')}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default InteractivePiano;
