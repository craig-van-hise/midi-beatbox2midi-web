import React from 'react';
import { Play, Square, Repeat, Music, Hash } from 'lucide-react';

interface TransportProps {
  tempo: number;
  setTempo: (t: number) => void;
  isPlaying: boolean;
  setIsPlaying: (p: boolean) => void;
  isLooping: boolean;
  setIsLooping: (l: boolean) => void;
}

export const Transport: React.FC<TransportProps> = ({
  tempo,
  setTempo,
  isPlaying,
  setIsPlaying,
  isLooping,
  setIsLooping,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 glass h-16 px-8 flex items-center gap-12 z-50">
      {/* Playback Controls */}
      <div className="flex items-center gap-4">
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

      {/* Tempo Section */}
      <div className="flex items-center gap-8 border-l border-slate-300 pl-8 flex-1 max-w-md">
        <div className="flex items-center gap-3 flex-1">
          <Music size={18} className="text-slate-400" />
          <div className="flex flex-col flex-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Tempo</span>
            <div className="flex items-center gap-4">
              <input
                type="number"
                step="0.001"
                value={tempo}
                onChange={(e) => setTempo(parseFloat(e.target.value))}
                className="bg-transparent border-none p-0 text-lg font-mono font-bold focus:ring-0 w-24"
              />
              <input
                type="range"
                min="40"
                max="250"
                step="0.001"
                value={tempo}
                onChange={(e) => setTempo(parseFloat(e.target.value))}
                className="flex-1 accent-hit-blue h-1.5 rounded-lg appearance-none bg-slate-200 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Locators Placeholder (Visual only for now, flags are in SlicerCanvas) */}
      <div className="ml-auto flex gap-4 text-slate-400 text-sm font-mono">
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-bold uppercase">Time</span>
          <span className="text-lg font-bold text-slate-700">00:00.000</span>
        </div>
      </div>
    </div>
  );
};
