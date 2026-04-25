import React, { useRef, useEffect, useState } from 'react';
import { HitState } from '../hooks/useHitManager';
import { Tool } from './Toolbar';

interface SlicerCanvasProps {
  audioBuffer: Float32Array | null;
  engineHits: any[];
  hitStates: Map<number, HitState>;
  zoomRange: [number, number];
  activeTool: Tool;
  onHitAction: (sampleIndex: number, action: 'toggle-lock' | 'toggle-mute' | 'add' | 'remove' | 'toggle-select') => void;
  selectedHits: Set<number>;
  isPlaying: boolean;
  currentTime: number; // in seconds
  sampleRate: number;
  loopRange: [number, number]; // in seconds
  setLoopRange: (range: [number, number]) => void;
}

export const SlicerCanvas: React.FC<SlicerCanvasProps> = ({
  audioBuffer,
  engineHits,
  hitStates,
  zoomRange,
  activeTool,
  onHitAction,
  selectedHits,
  isPlaying,
  currentTime,
  sampleRate,
  loopRange,
  setLoopRange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoverSample, setHoverSample] = useState<number | null>(null);
  const [marquee, setMarquee] = useState<{ start: { x: number, y: number }, end: { x: number, y: number } } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !audioBuffer) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const [startRatio, endRatio] = zoomRange;
    const totalSamples = audioBuffer.length;
    const startSample = startRatio * totalSamples;
    const endSample = endRatio * totalSamples;
    const visibleSamples = endSample - startSample;

    if (visibleSamples <= 0) return;

    ctx.clearRect(0, 0, width, height);

    // 1. Draw Real Waveform
    ctx.beginPath();
    ctx.strokeStyle = '#94a3b8'; // slate-400
    ctx.lineWidth = 1;
    const samplesPerPixel = visibleSamples / width;
    const amp = height / 2;

    for (let i = 0; i < width; i++) {
      const sStart = Math.floor(startSample + i * samplesPerPixel);
      const sEnd = Math.floor(startSample + (i + 1) * samplesPerPixel);
      let min = 0;
      let max = 0;
      for (let s = sStart; s < sEnd; s++) {
        const val = audioBuffer[s] || 0;
        if (val < min) min = val;
        if (val > max) max = val;
      }
      ctx.moveTo(i, amp + min * amp);
      ctx.lineTo(i, amp + max * amp);
    }
    ctx.stroke();

    // 2. Draw Hit Markers
    const allHits = [...engineHits];
    hitStates.forEach((state, sampleIndex) => {
      if (state === 'user-added' && !allHits.find(h => h.sampleIndex === sampleIndex)) {
        allHits.push({ sampleIndex, velocity: 0.5 });
      }
    });

    allHits.forEach((hit) => {
      const state = hitStates.get(hit.sampleIndex);
      const isSelected = selectedHits.has(hit.sampleIndex);
      const x = ((hit.sampleIndex - startSample) / visibleSamples) * width;

      if (x < 0 || x > width) return;

      let color = isSelected ? '#ef4444' : '#00f2ff'; // red if selected, cyan default
      if (state === 'muted') color = '#94a3b8';
      else if (state === 'locked' || state === 'user-added') color = '#0066ff';

      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = (state === 'locked' || state === 'user-added') ? 2 : 1;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();

      // Triangle Marker
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x - 8, 0);
      ctx.lineTo(x + 8, 0);
      ctx.lineTo(x, 12);
      ctx.fill();

      // Padlock Icon for Locked Hits
      if (state === 'locked') {
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x - 3, 3, 6, 4); // body
        ctx.beginPath();
        ctx.arc(x, 3, 2, Math.PI, 0); // shackle
        ctx.stroke();
      }

      ctx.restore();
    });

    // 3. Pencil Preview
    if (activeTool === 'pencil' && hoverSample !== null) {
      const hx = ((hoverSample - startSample) / visibleSamples) * width;
      if (hx >= 0 && hx <= width) {
        ctx.save();
        ctx.globalAlpha = 0.4;
        ctx.strokeStyle = '#0066ff';
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(hx, 0);
        ctx.lineTo(hx, height);
        ctx.stroke();
        ctx.restore();
      }
    }

    // 4. Marquee Selection
    if (marquee) {
      ctx.save();
      ctx.strokeStyle = '#0066ff';
      ctx.fillStyle = 'rgba(0, 102, 255, 0.1)';
      const mx = Math.min(marquee.start.x, marquee.end.x);
      const my = Math.min(marquee.start.y, marquee.end.y);
      const mw = Math.abs(marquee.start.x - marquee.end.x);
      const mh = Math.abs(marquee.start.y - marquee.end.y);
      ctx.fillRect(mx, my, mw, mh);
      ctx.strokeRect(mx, my, mw, mh);
      ctx.restore();
    }

    // 5. Loop Locators (Flags)
    const drawFlag = (time: number, isRight: boolean) => {
      const lx = ((time * sampleRate - startSample) / visibleSamples) * width;
      if (lx < 0 || lx > width) return;
      ctx.save();
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.moveTo(lx, 20);
      ctx.lineTo(lx, 40);
      if (isRight) {
        ctx.lineTo(lx - 12, 30);
      } else {
        ctx.lineTo(lx + 12, 30);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };
    drawFlag(loopRange[0], false);
    drawFlag(loopRange[1], true);

    // 6. Playhead
    if (isPlaying || currentTime > 0) {
      const px = ((currentTime * sampleRate - startSample) / visibleSamples) * width;
      if (px >= 0 && px <= width) {
        ctx.save();
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(px, 0);
        ctx.lineTo(px, height);
        ctx.stroke();
        ctx.restore();
      }
    }

  }, [audioBuffer, engineHits, hitStates, zoomRange, activeTool, hoverSample, marquee, selectedHits, isPlaying, currentTime, sampleRate, loopRange]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas || !audioBuffer) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const [startRatio, endRatio] = zoomRange;
    const totalSamples = audioBuffer.length;
    const startSample = startRatio * totalSamples;
    const visibleSamples = (endRatio - startRatio) * totalSamples;
    const mouseTime = (startSample + (x / rect.width) * visibleSamples) / sampleRate;

    // Check for locator dragging
    const threshold = 15 / rect.width * (visibleSamples / sampleRate); // 15px in seconds
    let draggingLocator: 'left' | 'right' | null = null;
    if (Math.abs(mouseTime - loopRange[0]) < threshold) draggingLocator = 'left';
    else if (Math.abs(mouseTime - loopRange[1]) < threshold) draggingLocator = 'right';

    if (draggingLocator) {
      const handleMouseMove = (moveEvent: MouseEvent) => {
        const mx = moveEvent.clientX - rect.left;
        const newTime = (startSample + (mx / rect.width) * visibleSamples) / sampleRate;
        setLoopRange(prev => {
          let [start, end] = prev;
          if (draggingLocator === 'left') start = Math.max(0, Math.min(newTime, end - 0.1));
          else end = Math.max(start + 0.1, Math.min(newTime, audioBuffer.length / sampleRate));
          return [start, end];
        });
      };
      const handleMouseUp = () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return;
    }

    if (activeTool === 'pointer') {
      setMarquee({ start: { x, y }, end: { x, y } });
    }

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const mx = moveEvent.clientX - rect.left;
      const my = moveEvent.clientY - rect.top;
      if (activeTool === 'pointer') {
        setMarquee(prev => prev ? { ...prev, end: { x: mx, y: my } } : null);
      }
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      if (activeTool === 'pointer' && marquee) {
        const mx = Math.min(marquee.start.x, marquee.end.x);
        const mw = Math.abs(marquee.start.x - marquee.end.x);

        engineHits.forEach(hit => {
          const hx = ((hit.sampleIndex - startSample) / visibleSamples) * rect.width;
          if (hx >= mx && hx <= mx + mw) {
            onHitAction(hit.sampleIndex, 'toggle-select');
          }
        });
      }
      setMarquee(null);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas || !audioBuffer) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const [startRatio, endRatio] = zoomRange;
    const startSample = startRatio * audioBuffer.length;
    const visibleSamples = (endRatio - startRatio) * audioBuffer.length;
    const currentSample = Math.floor(startSample + (x / rect.width) * visibleSamples);
    setHoverSample(currentSample);
  };

  const handleClick = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas || !audioBuffer) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const [startRatio, endRatio] = zoomRange;
    const startSample = startRatio * audioBuffer.length;
    const visibleSamples = (endRatio - startRatio) * audioBuffer.length;
    const clickedSample = Math.floor(startSample + (x / rect.width) * visibleSamples);

    const tolerance = (visibleSamples / rect.width) * 15; // 15px tolerance
    const nearestHit = engineHits.find(h => Math.abs(h.sampleIndex - clickedSample) < tolerance);

    if (activeTool === 'pencil') {
      onHitAction(clickedSample, 'add');
    } else if (nearestHit) {
      if (activeTool === 'eraser') {
        onHitAction(nearestHit.sampleIndex, 'toggle-mute');
      } else if (activeTool === 'lock') {
        onHitAction(nearestHit.sampleIndex, 'toggle-lock');
      } else if (activeTool === 'pointer') {
        onHitAction(nearestHit.sampleIndex, 'toggle-select');
      }
    }
  };

  return (
    <div className="relative border-x border-slate-300">
      <canvas
        ref={canvasRef}
        width={1200}
        height={300}
        className={`w-full h-[300px] bg-white transition-all ${
          activeTool === 'eraser' ? 'cursor-crosshair' : 'cursor-default'
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverSample(null)}
        onClick={handleClick}
      />
    </div>
  );
};
