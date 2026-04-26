import React, { useRef } from 'react';
import { Play, Square, Repeat, Music, SkipBack, Bell, Hand, Circle } from 'lucide-react';

interface TransportProps {
  tempo: number;
  setTempo: (t: number) => void;
  timeSignature: [number, number];
  setTimeSignature: (ts: [number, number]) => void;
  metronomeEnabled: boolean;
  setMetronomeEnabled: (e: boolean) => void;
  isRecording: boolean;
  toggleRecording: () => void;
  isPlaying: boolean;
  setIsPlaying: (p: boolean) => void;
  isLooping: boolean;
  setIsLooping: (l: boolean) => void;
  onRTZ: () => void;
  gridPulse: '8th' | '16th' | '32nd';
  setGridPulse: (gp: '8th' | '16th' | '32nd') => void;
  currentTime: number;
}

export const Transport: React.FC<TransportProps> = ({
  tempo,
  setTempo,
  timeSignature,
  setTimeSignature,
  metronomeEnabled,
  setMetronomeEnabled,
  isRecording,
  toggleRecording,
  isPlaying,
  setIsPlaying,
  isLooping,
  setIsLooping,
  onRTZ,
  gridPulse,
  setGridPulse,
  currentTime,
}) => {
  const tapTimesRef = useRef<number[]>([]);
  
  const handleTapTempo = () => {
    const now = performance.now();
    tapTimesRef.current.push(now);
    if (tapTimesRef.current.length > 4) tapTimesRef.current.shift();
    
    if (tapTimesRef.current.length >= 2) {
      const deltas = [];
      for (let i = 1; i < tapTimesRef.current.length; i++) {
        deltas.push(tapTimesRef.current[i] - tapTimesRef.current[i - 1]);
      }
      const avgDelta = deltas.reduce((a, b) => a + b) / deltas.length;
      const newBpm = Math.round(60000 / avgDelta);
      if (newBpm >= 40 && newBpm <= 300) setTempo(newBpm);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 glass h-16 flex items-center justify-center z-50">
      <div className="flex items-center px-8 w-full max-w-[1400px]">
        
        {/* Structure Section (Left) */}
        <div className="flex-1 flex items-center justify-start gap-6">
          {/* Time Signature */}
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Time Sig</span>
            <div className="flex items-center gap-1 font-bold text-slate-700 tabular-nums">
              <input
                type="number"
                value={timeSignature[0]}
                onChange={(e) => setTimeSignature([parseInt(e.target.value) || 4, timeSignature[1]])}
                className="w-6 bg-transparent border-none p-0 text-center focus:ring-0"
              />
              <span className="text-slate-300">/</span>
              <input
                type="number"
                value={timeSignature[1]}
                onChange={(e) => setTimeSignature([timeSignature[0], parseInt(e.target.value) || 4])}
                className="w-6 bg-transparent border-none p-0 text-center focus:ring-0"
              />
            </div>
          </div>

          <div className="h-8 w-[1px] bg-slate-200" />

          {/* Grid Pulse */}
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Grid</span>
            <select 
              value={gridPulse} 
              onChange={(e) => setGridPulse(e.target.value as '8th' | '16th' | '32nd')}
              className="bg-transparent border border-slate-300 rounded p-0.5 text-xs font-bold focus:ring-0"
            >
              <option value="8th">8th</option>
              <option value="16th">16th</option>
              <option value="32nd">32nd</option>
            </select>
          </div>

          <div className="h-8 w-[1px] bg-slate-200" />

          {/* Tempo */}
          <div className="flex items-center gap-3">
            <Music size={18} className="text-slate-400" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Tempo</span>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  step="0.001"
                  value={tempo}
                  onChange={(e) => setTempo(parseFloat(e.target.value))}
                  className="bg-transparent border-none p-0 text-lg font-bold focus:ring-0 w-20 h-6 tabular-nums"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="40"
                    max="250"
                    step="0.001"
                    value={tempo}
                    onChange={(e) => setTempo(parseFloat(e.target.value))}
                    className="w-24 accent-hit-blue h-1.5 rounded-lg appearance-none bg-slate-200 cursor-pointer"
                  />
                  <button
                    onClick={handleTapTempo}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-[10px] font-bold text-slate-600 transition-colors"
                  >
                    <Hand size={10} />
                    TAP
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Playback Controls (Center) */}
        <div className="flex items-center gap-4 border-x border-slate-200 px-12">
          <button
            onClick={onRTZ}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
            title="Return to Zero"
          >
            <SkipBack size={20} fill="currentColor" />
          </button>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`p-3 rounded-full transition-all ${
                isPlaying ? 'bg-hit-blue text-white shadow-lg scale-110' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
              }`}
            >
              {isPlaying ? <Square size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
            </button>

            <button
              onClick={toggleRecording}
              className={`p-3 rounded-full transition-all ${
                isRecording ? 'bg-red-500 text-white shadow-lg animate-pulse' : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-red-400'
              }`}
              title="Record"
            >
              <Circle size={20} fill="currentColor" />
            </button>
          </div>

          <div className="h-6 w-[1px] bg-slate-100" />

          <div className="flex items-center gap-1">
            <button
              onClick={() => setMetronomeEnabled(!metronomeEnabled)}
              className={`p-2 rounded-lg transition-all ${
                metronomeEnabled ? 'text-hit-blue bg-blue-50' : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Metronome"
            >
              <Bell size={20} fill={metronomeEnabled ? "currentColor" : "none"} />
            </button>

            <button
              onClick={() => setIsLooping(!isLooping)}
              className={`p-2 rounded-lg transition-all ${
                isLooping ? 'text-hit-blue bg-blue-50' : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Loop"
            >
              <Repeat size={20} />
            </button>
          </div>
        </div>

        {/* Time Display (Right) */}
        <div className="flex-1 flex flex-col items-end min-w-[120px]">
          <span className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Time</span>
          <span className="text-lg font-bold text-slate-700 tabular-nums">
            {formatTime(currentTime)}
          </span>
        </div>
      </div>
    </div>
  );
};
