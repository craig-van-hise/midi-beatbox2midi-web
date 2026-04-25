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
    <div className="glass rounded-xl p-6 mb-4 flex flex-wrap gap-8 items-end">
      <div className="flex-1 min-w-[200px]">
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 mb-2">
          <Zap size={16} className="text-cyan-500" />
          Sensitivity
          <span className="ml-auto text-hit-blue">{params.sensitivity.toFixed(3)}</span>
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.001"
          value={params.sensitivity}
          onChange={(e) => setParams({ ...params, sensitivity: parseFloat(e.target.value) })}
          className="w-full"
        />
      </div>

      <div className="flex-1 min-w-[200px]">
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 mb-2">
          <VolumeX size={16} className="text-slate-400" />
          Noise Floor
          <span className="ml-auto text-hit-blue">{params.noiseFloor.toFixed(3)}</span>
        </label>
        <input
          type="range"
          min="-0.1"
          max="0.1"
          step="0.005"
          value={params.noiseFloor}
          onChange={(e) => setParams({ ...params, noiseFloor: parseFloat(e.target.value) })}
          className="w-full"
        />
      </div>

      <div className="flex-1 min-w-[200px]">
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 mb-2">
          <Timer size={16} className="text-hit-blue" />
          Refractory (ms)
          <span className="ml-auto text-hit-blue">{params.refractory}ms</span>
        </label>
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={params.refractory}
          onChange={(e) => setParams({ ...params, refractory: parseInt(e.target.value) })}
          className="w-full"
        />
      </div>
    </div>
  );
};
