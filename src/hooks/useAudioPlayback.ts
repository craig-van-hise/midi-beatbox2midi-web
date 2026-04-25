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
    if (audioBuffer) {
      setLoopRange([0, audioBuffer.duration]);
    }
  }, [audioBuffer]);

  const updatePlayhead = useCallback(() => {
    if (!audioCtxRef.current || !isPlaying) return;

    const now = audioCtxRef.current.currentTime;
    const elapsed = now - startTimeRef.current + offsetRef.current;
    
    let current = elapsed;
    if (isLooping && audioBuffer) {
      const loopLen = loopRange[1] - loopRange[0];
      if (loopLen > 0 && current >= loopRange[1]) {
        // This is a bit tricky with precise sync, but for visual playhead:
        current = loopRange[0] + (current - loopRange[1]) % loopLen;
      }
    } else if (audioBuffer && current >= audioBuffer.duration) {
      setIsPlaying(false);
      current = audioBuffer.duration;
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

  const stop = useCallback(() => {
    sourceRef.current?.stop();
    sourceRef.current = null;
    setIsPlaying(false);
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) stop();
    else play();
  }, [isPlaying, play, stop]);

  return {
    isPlaying,
    currentTime,
    loopRange,
    setLoopRange,
    isLooping,
    setIsLooping,
    togglePlay,
    stop,
    setCurrentTime,
  };
}
