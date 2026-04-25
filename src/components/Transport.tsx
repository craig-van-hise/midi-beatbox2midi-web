import React from 'react';
import { Play, Square, Repeat, Music, SkipBack } from 'lucide-react';

interface TransportProps {
  tempo: number;
  setTempo: (t: number) => void;
  isPlaying: boolean;
  setIsPlaying: (p: boolean) => void;
  isLooping: boolean;
  setIsLooping: (l: boolean) => void;
  onRTZ: () => void;
  currentTime: number;
}

export const Transport: React.FC<TransportProps> = ({
  tempo,
  setTempo,
  isPlaying,
  setIsPlaying,
  isLooping,
  setIsLooping,
  onRTZ,
  currentTime,
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 glass h-16 flex items-center justify-center z-50">
      <div className="flex items-center px-8 w-full max-w-[1400px]">
        
        {/* Tempo Section (Left) */}
        <div className="flex-1 flex items-center justify-start">
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
                  className="bg-transparent border-none p-0 text-lg font-mono font-bold focus:ring-0 w-20 h-6"
                />
                <input
                  type="range"
                  min="40"
                  max="250"
                  step="0.001"
                  value={tempo}
                  onChange={(e) => setTempo(parseFloat(e.target.value))}
                  className="w-32 accent-hit-blue h-1.5 rounded-lg appearance-none bg-slate-200 cursor-pointer"
                />
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
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`p-3 rounded-full transition-all ${
              isPlaying ? 'bg-hit-blue text-white shadow-lg scale-110' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
            }`}
          >
            {isPlaying ? <Square size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
          </button>
          <button
            onClick={() => setIsLooping(!isLooping)}
            className={`p-2 rounded-lg transition-all ${
              isLooping ? 'text-hit-blue bg-blue-50' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Repeat size={20} />
          </button>
        </div>

        {/* Time Display (Right) */}
        <div className="flex-1 flex flex-col items-end min-w-[100px]">
          <span className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Time</span>
          <span className="text-lg font-mono font-bold text-slate-700 tabular-nums">
            {formatTime(currentTime)}
          </span>
        </div>
      </div>
    </div>
  );
};
