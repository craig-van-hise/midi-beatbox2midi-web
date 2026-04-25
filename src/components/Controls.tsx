import React from 'react';
import { Sliders, Zap, VolumeX, Timer } from 'lucide-react';

interface ControlsProps {
  params: {
    sensitivity: number;
    noiseFloor: number;
    refractory: number;
  };
  setParams: (p: any) => void;
}

export const Controls: React.FC<ControlsProps> = ({ params, setParams }) => {
  return (
    <div className="glass rounded-xl py-2 px-4 mb-3 flex flex-wrap gap-2 items-end">
      <div className="flex-1 min-w-[180px]">
        <label className="flex items-center gap-2 text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
          <Zap size={14} className="text-cyan-500" />
          Sensitivity
          <span className="ml-auto text-hit-blue font-mono">{params.sensitivity.toFixed(3)}</span>
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.001"
          value={params.sensitivity}
          onChange={(e) => setParams({ ...params, sensitivity: parseFloat(e.target.value) })}
          className="w-full accent-hit-blue h-1.5 rounded-lg appearance-none bg-slate-200 cursor-pointer"
        />
      </div>

      <div className="flex-1 min-w-[180px]">
        <label className="flex items-center gap-2 text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
          <VolumeX size={14} className="text-slate-400" />
          Noise Floor
          <span className="ml-auto text-hit-blue font-mono">{params.noiseFloor.toFixed(3)}</span>
        </label>
        <input
          type="range"
          min="-0.1"
          max="0.1"
          step="0.005"
          value={params.noiseFloor}
          onChange={(e) => setParams({ ...params, noiseFloor: parseFloat(e.target.value) })}
          className="w-full accent-hit-blue h-1.5 rounded-lg appearance-none bg-slate-200 cursor-pointer"
        />
      </div>

      <div className="flex-1 min-w-[180px]">
        <label className="flex items-center gap-2 text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
          <Timer size={14} className="text-hit-blue" />
          Refractory
          <span className="ml-auto text-hit-blue font-mono">{params.refractory}ms</span>
        </label>
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={params.refractory}
          onChange={(e) => setParams({ ...params, refractory: parseInt(e.target.value) })}
          className="w-full accent-hit-blue h-1.5 rounded-lg appearance-none bg-slate-200 cursor-pointer"
        />
      </div>
    </div>
  );
};
