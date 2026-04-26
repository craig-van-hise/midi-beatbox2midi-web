import { useState, useEffect, useRef, useCallback } from 'react';

export function useAudioPlayback(
  audioBuffer: AudioBuffer | null,
  metronomeEnabled: boolean = false,
  tempo: number = 120,
  timeSignature: [number, number] = [4, 4]
) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [loopRange, setLoopRange] = useState<[number, number]>([0, 0]); // in seconds
  const [isLooping, setIsLooping] = useState(true);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef = useRef(0);
  const offsetRef = useRef(0);
  const animationFrameRef = useRef(0);
  const lastBeatRef = useRef(-1);

  // Initialize AudioContext
  useEffect(() => {
    audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    return () => {
      audioCtxRef.current?.close();
    };
  }, []);

  // Set default loop range when buffer loads
  useEffect(() => {
    if (audioBuffer && loopRange[1] === 0) {
      setLoopRange([0, audioBuffer.duration]);
    }
  }, [audioBuffer]);

  const updatePlayhead = useCallback(() => {
    if (!audioCtxRef.current || !isPlaying || !audioBuffer) return;

    const now = audioCtxRef.current.currentTime;
    const elapsed = now - startTimeRef.current;
    let current = offsetRef.current + elapsed;
    
    if (isLooping) {
      const start = loopRange[0];
      const end = loopRange[1];
      const len = end - start;
      if (len > 0) {
        if (current >= end) {
          current = start + ((current - end) % len);
        }
      }
    } else {
      if (current >= audioBuffer.duration) {
        setIsPlaying(false);
        current = audioBuffer.duration;
      }
    }

    // Metronome logic
    const beatsPerSecond = tempo / 60;
    const currentBeatExact = current * beatsPerSecond;
    const currentBeatInt = Math.floor(currentBeatExact);

    if (metronomeEnabled && currentBeatInt > lastBeatRef.current) {
      lastBeatRef.current = currentBeatInt;
      
      // Synthesize a click
      if (audioCtxRef.current) {
        const osc = audioCtxRef.current.createOscillator();
        const gain = audioCtxRef.current.createGain();
        
        // High pitch on downbeat, lower pitch on other beats
        const isDownbeat = currentBeatInt % timeSignature[0] === 0;
        osc.frequency.value = isDownbeat ? 1200 : 800; 
        
        osc.connect(gain);
        gain.connect(audioCtxRef.current.destination);
        
        const clickTime = audioCtxRef.current.currentTime;
        osc.start(clickTime);
        gain.gain.setValueAtTime(0.5, clickTime);
        gain.gain.exponentialRampToValueAtTime(0.001, clickTime + 0.1);
        osc.stop(clickTime + 0.1);
      }
    }
    
    // Reset lastBeatRef if we loop back
    if (isLooping && currentBeatInt < lastBeatRef.current) {
       lastBeatRef.current = -1;
    }

    setCurrentTime(current);
    animationFrameRef.current = requestAnimationFrame(updatePlayhead);
  }, [isPlaying, isLooping, loopRange, audioBuffer, metronomeEnabled, tempo, timeSignature]);

  useEffect(() => {
    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(updatePlayhead);
    } else {
      cancelAnimationFrame(animationFrameRef.current);
    }
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [isPlaying, updatePlayhead]);

  // Update loop points in real-time
  useEffect(() => {
    if (sourceRef.current) {
      sourceRef.current.loop = isLooping;
      sourceRef.current.loopStart = loopRange[0];
      sourceRef.current.loopEnd = loopRange[1];
    }
  }, [loopRange, isLooping]);

  const play = useCallback((startTime: number = currentTime) => {
    if (!audioCtxRef.current || !audioBuffer) return;

    // Stop previous
    sourceRef.current?.stop();

    const source = audioCtxRef.current.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioCtxRef.current.destination);

    if (isLooping) {
      source.loop = true;
      source.loopStart = loopRange[0];
      source.loopEnd = loopRange[1];
    }

    // Ensure startTime is within loop if looping
    let start = startTime;
    if (isLooping) {
      if (start < loopRange[0] || start >= loopRange[1]) start = loopRange[0];
    }

    // Reset metronome beat tracker
    lastBeatRef.current = Math.floor(start * (tempo / 60)) - 1;

    source.start(0, start);
    sourceRef.current = source;
    
    startTimeRef.current = audioCtxRef.current.currentTime;
    offsetRef.current = start;
    setIsPlaying(true);

    source.onended = () => {
      if (!isLooping) setIsPlaying(false);
    };
  }, [audioBuffer, isLooping, loopRange, currentTime, tempo]);

  const playSlice = useCallback((startTime: number, endTime: number, onComplete?: () => void, returnToStart: boolean = false) => {
    if (!audioCtxRef.current || !audioBuffer) return;

    // Stop previous
    sourceRef.current?.stop();

    const source = audioCtxRef.current.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioCtxRef.current.destination);

    const now = audioCtxRef.current.currentTime;
    const duration = Math.max(0, endTime - startTime);
    
    source.start(now, startTime);
    source.stop(now + duration);
    sourceRef.current = source;
    
    startTimeRef.current = now;
    offsetRef.current = startTime;
    setIsPlaying(true);

    source.onended = () => {
      if (sourceRef.current === source) {
        sourceRef.current = null;
        setIsPlaying(false);
        
        if (returnToStart) {
          setCurrentTime(startTime);
          offsetRef.current = startTime;
        }

        if (onComplete) onComplete();
      }
    };
  }, [audioBuffer]);

  const stop = useCallback(() => {
    sourceRef.current?.stop();
    sourceRef.current = null;
    setIsPlaying(false);
    lastBeatRef.current = -1;
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) stop();
    else play();
  }, [isPlaying, play, stop]);

  const returnToZero = useCallback(() => {
    const target = isLooping ? loopRange[0] : 0;
    setCurrentTime(target);
    lastBeatRef.current = -1;
    if (isPlaying) {
      play(target);
    }
  }, [isLooping, loopRange, isPlaying, play]);

  const seek = useCallback((time: number) => {
    if (!audioBuffer) return;
    const target = Math.max(0, Math.min(time, audioBuffer.duration));
    setCurrentTime(target);
    offsetRef.current = target;
    lastBeatRef.current = Math.floor(target * (tempo / 60)) - 1;
    
    if (isPlaying) {
      play(target);
    }
  }, [audioBuffer, isPlaying, play, tempo]);

  return {
    isPlaying,
    currentTime,
    loopRange,
    setLoopRange,
    isLooping,
    setIsLooping,
    togglePlay,
    playSlice,
    stop,
    setCurrentTime,
    returnToZero,
    seek,
  };
}
