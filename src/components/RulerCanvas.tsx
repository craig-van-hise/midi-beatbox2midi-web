import React, { useRef, useEffect } from 'react';

interface RulerCanvasProps {
  zoomRange: [number, number];
  totalSamples: number;
  sampleRate: number;
  tempo: number;
  timeSignature: [number, number];
  loopRange: [number, number];
  gridPulse: '8th' | '16th' | '32nd';
  onSeek: (time: number) => void;
}

export const RulerCanvas: React.FC<RulerCanvasProps> = ({
  zoomRange,
  totalSamples,
  sampleRate,
  tempo,
  timeSignature,
  loopRange,
  gridPulse,
  onSeek,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const [startRatio, endRatio] = zoomRange;
    
    // Unified math matching TimeSigCanvas
    const effectiveTotalSamples = totalSamples > 0 ? totalSamples : (sampleRate * 120);
    const visibleSamples = effectiveTotalSamples * (endRatio - startRatio);
    const startSample = effectiveTotalSamples * startRatio;

    if (visibleSamples <= 0 || sampleRate <= 0 || tempo <= 0) return;

    // Use a pure white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    const beatsPerMeasure = timeSignature[0];
    const beatsPerSecond = tempo / 60;
    const samplesPerBeat = sampleRate / beatsPerSecond;
    const samplesPerMeasure = samplesPerBeat * beatsPerMeasure;
    
    const gridDivisionsPerBeat = gridPulse === '8th' ? 2 : gridPulse === '16th' ? 4 : 8;
    const samplesPerGrid = samplesPerBeat / gridDivisionsPerBeat;

    const startMeasure = Math.floor(startSample / samplesPerMeasure);
    const endMeasure = startMeasure + Math.ceil(visibleSamples / samplesPerMeasure) + 1;

    for (let m = startMeasure; m <= endMeasure; m++) {
      const measureSample = m * samplesPerMeasure;
      
      // Loop through grid pulses within this measure
      for (let g = 0; g < beatsPerMeasure * gridDivisionsPerBeat; g++) {
        const tickSample = measureSample + (g * samplesPerGrid);
        const x = ((tickSample - startSample) / visibleSamples) * width;
        
        if (x >= 0 && x <= width) {
          ctx.beginPath();
          
          if (g === 0) {
            // TIER 1: Bar Line (BOLD Black)
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2.5;
            const lx = Math.round(x) + 0.5;
            ctx.moveTo(lx, height);
            ctx.lineTo(lx, 0); // Full height
            ctx.stroke();
          } else if (g % gridDivisionsPerBeat === 0) {
            // TIER 2: Beat Line (Medium Slate)
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 1.5;
            const lx = Math.round(x) + 0.5;
            ctx.moveTo(lx, height);
            ctx.lineTo(lx, height - 20); 
            ctx.stroke();
          } else {
            // TIER 3: Grid Pulse (Light Slate)
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 1;
            const lx = Math.floor(x) + 0.5;
            ctx.moveTo(lx, height);
            ctx.lineTo(lx, height - 12);
            ctx.stroke();
          }
        }
      }
    }
  };

  useEffect(() => {
    draw();
    const resizeObserver = new ResizeObserver(() => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        draw();
      }
    });
    if (canvasRef.current) resizeObserver.observe(canvasRef.current);
    return () => resizeObserver.disconnect();
  }, [zoomRange, totalSamples, sampleRate, tempo, timeSignature, gridPulse]);

  useEffect(() => {
    draw();
  }, [zoomRange, totalSamples, sampleRate, tempo, timeSignature, gridPulse]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas || sampleRate <= 0) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const [startRatio, endRatio] = zoomRange;
    const effectiveTotalSamples = totalSamples > 0 ? totalSamples : (sampleRate * 120);
    const visibleSamples = (endRatio - startRatio) * effectiveTotalSamples;
    const clickedSample = startRatio * effectiveTotalSamples + (x / rect.width) * visibleSamples;
    const clickedTime = clickedSample / sampleRate;
    onSeek(clickedTime);
  };

  return (
    <div className="relative border-b-2 border-slate-600">
      <canvas
        ref={canvasRef}
        className="w-full h-[40px] cursor-pointer"
        onMouseDown={handleMouseDown}
      />
    </div>
  );
};
