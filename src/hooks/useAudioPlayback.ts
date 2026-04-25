import { useState, useEffect, useRef, useCallback } from 'react';

export function useAudioPlayback(audioBuffer: AudioBuffer | null) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [loopRange, setLoopRange] = useState<[number, number]>([0, 0]); // in seconds
  const [isLooping, setIsLooping] = useState(true);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef = useRef(0);
  const offsetRef = useRef(0);
  const animationFrameRef = useRef(0);

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

    setCurrentTime(current);
    animationFrameRef.current = requestAnimationFrame(updatePlayhead);
  }, [isPlaying, isLooping, loopRange, audioBuffer]);

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

    source.start(0, start);
    sourceRef.current = source;
    
    startTimeRef.current = audioCtxRef.current.currentTime;
    offsetRef.current = start;
    setIsPlaying(true);

    source.onended = () => {
      if (!isLooping) setIsPlaying(false);
    };
  }, [audioBuffer, isLooping, loopRange, currentTime]);

  const playSlice = useCallback((startTime: number, endTime: number) => {
    if (!audioCtxRef.current || !audioBuffer) return;

    // Stop previous
    sourceRef.current?.stop();

    const source = audioCtxRef.current.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioCtxRef.current.destination);

    const now = audioCtxRef.current.currentTime;
    const duration = endTime - startTime;
    
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
      }
    };
  }, [audioBuffer]);

  const stop = useCallback(() => {
    sourceRef.current?.stop();
    sourceRef.current = null;
    setIsPlaying(false);
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) stop();
    else play();
  }, [isPlaying, play, stop]);

  const returnToZero = useCallback(() => {
    const target = isLooping ? loopRange[0] : 0;
    setCurrentTime(target);
    if (isPlaying) {
      play(target);
    }
  }, [isLooping, loopRange, isPlaying, play]);

  const seek = useCallback((time: number) => {
    if (!audioBuffer) return;
    const target = Math.max(0, Math.min(time, audioBuffer.duration));
    setCurrentTime(target);
    offsetRef.current = target;
    
    if (isPlaying) {
      play(target);
    }
  }, [audioBuffer, isPlaying, play]);

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
