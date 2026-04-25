import { useState, useEffect, useCallback, useRef } from 'react';
import { AudioProcessor } from '../lib/AudioProcessor';

// We'll load the factory from the public folder
// Since it's a global var in public/BeatboxEngine.js, we might need a trick
// or just load it via script tag. 
// However, the best way in Vite is to use the import.

export type HitState = 'locked' | 'muted' | 'user-added';

export function useHitManager() {
  console.log("useHitManager: Hook Re-rendered");
  const [audioBuffer, setAudioBuffer] = useState<Float32Array | null>(null);
  const [fullAudioBuffer, setFullAudioBuffer] = useState<AudioBuffer | null>(null);
  const [engineHits, setEngineHits] = useState<any[]>([]);
  const [hitStates, setHitStates] = useState<Map<number, HitState>>(new Map());
  const [params, setParams] = useState({
    sensitivity: 0.500,
    noiseFloor: 0.02,
    refractory: 40, // ms
  });
  const paramsRef = useRef(params);
  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  const processorRef = useRef<AudioProcessor | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize Engine
  useEffect(() => {
    let mounted = true;
    const initEngine = async () => {
      try {
        const proc = new AudioProcessor();
        // @ts-ignore
        let factory = window.BeatboxEngine; 
        
        if (!factory) {
          const existingScript = document.querySelector('script[src="/BeatboxEngine.js"]');
          if (!existingScript) {
            const script = document.createElement('script');
            script.src = '/BeatboxEngine.js';
            script.async = true;
            document.body.appendChild(script);
            
            await new Promise((resolve, reject) => {
              script.onload = resolve;
              script.onerror = reject;
            });
          } else {
            await new Promise((resolve) => {
              if ((window as any).BeatboxEngine) resolve(true);
              else existingScript.addEventListener('load', resolve);
            });
          }
          // @ts-ignore
          factory = window.BeatboxEngine;
        }

        if (factory && mounted) {
          await proc.init(factory);
          processorRef.current = proc;
          setIsInitialized(true);
          console.log("useHitManager: Engine initialized");
        }
      } catch (err) {
        console.error("useHitManager: Failed to initialize engine:", err);
      }
    };
    initEngine();

    return () => {
      mounted = false;
      processorRef.current?.dispose();
    };
  }, []);

  const updateHits = useCallback(() => {
    const proc = processorRef.current;
    if (!proc || !audioBuffer) return;

    proc.setSensitivityMultiplier(paramsRef.current.sensitivity);
    proc.setNoiseFloorOffset(paramsRef.current.noiseFloor);
    proc.setRefractoryPeriodMs(paramsRef.current.refractory);
    
    proc.calculateOnsets();
    const hits = proc.getTransients();
    setEngineHits(hits);
  }, [audioBuffer]); 


  // Recalculate when params change (debounced)
  useEffect(() => {
    console.log("useHitManager: Effect triggered by params change");
    if (!audioBuffer) return;
    const timer = setTimeout(updateHits, 16);
    return () => clearTimeout(timer);
  }, [params, updateHits, audioBuffer]);

  const loadFile = async (file: File) => {
    const proc = processorRef.current;
    if (!proc) return;

    const { audioBuffer: full, mono } = await proc.loadAudioFile(file);
    setAudioBuffer(mono);
    setFullAudioBuffer(full);
    proc.feedEngine(mono);
  };

  const toggleHitState = (sampleIndex: number, type: HitState) => {
    setHitStates(prev => {
      const next = new Map(prev);
      if (next.get(sampleIndex) === type) {
        next.delete(sampleIndex);
      } else {
        next.set(sampleIndex, type);
      }
      return next;
    });
  };

  return {
    audioBuffer,
    fullAudioBuffer,
    engineHits,
    hitStates,
    params,
    setParams,
    loadFile,
    toggleHitState,
    processor: processorRef.current,
    sampleRate: processorRef.current?.sampleRate || 44100,
    isInitialized,
  };
}
