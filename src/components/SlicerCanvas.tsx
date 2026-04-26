import React, { useRef, useEffect, useState } from 'react';
import { HitState } from '../hooks/useHitManager';
import { Tool } from './Toolbar';

interface SlicerCanvasProps {
  audioBuffer: Float32Array | null;
  renderableHits: any[];
  zoomRange: [number, number];
  setZoomRange: React.Dispatch<React.SetStateAction<[number, number]>>;
  activeTool: Tool;
  onHitAction: (sampleIndex: number, action: 'toggle-lock' | 'toggle-mute' | 'add' | 'remove' | 'toggle-select') => void;
  selectedHitIndices: number[];
  setSelectedHitIndices: React.Dispatch<React.SetStateAction<number[]>>;
  isPlaying: boolean;
  currentTime: number; // in seconds
  sampleRate: number;
  loopRange: [number, number]; // in seconds
  setLoopRange: React.Dispatch<React.SetStateAction<[number, number]>>;
  playSlice: (startTime: number, endTime: number, onComplete?: () => void, returnToStart?: boolean) => void;
}

export const SlicerCanvas: React.FC<SlicerCanvasProps> = ({
  audioBuffer,
  renderableHits,
  zoomRange,
  setZoomRange,
  activeTool,
  onHitAction,
  selectedHitIndices,
  setSelectedHitIndices,
  isPlaying,
  currentTime,
  sampleRate,
  loopRange,
  setLoopRange,
  playSlice,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoverSample, setHoverSample] = useState<number | null>(null);
  const [hoveredHitIndex, setHoveredHitIndex] = useState<number | null>(null);
  const [marquee, setMarquee] = useState<{ start: { x: number, y: number }, end: { x: number, y: number } } | null>(null);

  // Phase 2: Trackpad Scroll Zoom
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault(); // Stop page scroll
      const rect = canvas.getBoundingClientRect();
      const mouseXRatio = (e.clientX - rect.left) / rect.width;
      const zoomSpeed = 0.001; // Adjust for trackpad sensitivity
      
      // e.deltaY > 0 is zoom out, e.deltaY < 0 is zoom in
      const zoomDelta = e.deltaY * zoomSpeed;

      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        // Horizontal Scroll
        const scrollSpeed = 0.001;
        const delta = e.deltaX * scrollSpeed;
        setZoomRange(prev => {
          const width = prev[1] - prev[0];
          let newStart = prev[0] + delta;
          let newEnd = prev[1] + delta;
          
          if (newStart < 0) {
            newStart = 0;
            newEnd = width;
          } else if (newEnd > 1) {
            newEnd = 1;
            newStart = 1 - width;
          }
          
          return [newStart, newEnd];
        });
      } else {
        // Anchor-based Zoom
        setZoomRange(prev => {
          const currentRange = prev[1] - prev[0];
          // Prevent zooming in too close
          if (zoomDelta < 0 && currentRange < 0.01) return prev;

          let newStart = prev[0] - (zoomDelta * mouseXRatio);
          let newEnd = prev[1] + (zoomDelta * (1 - mouseXRatio));

          // Clamp bounds
          newStart = Math.max(0, newStart);
          newEnd = Math.min(1, newEnd);
          
          // Prevent flipping or too small range
          if (newEnd - newStart < 0.005) {
            const center = prev[0] + currentRange * mouseXRatio;
            newStart = Math.max(0, center - 0.0025);
            newEnd = Math.min(1, center + 0.0025);
          }
          return [newStart, newEnd];
        });
      }
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [setZoomRange]);

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
    ctx.strokeStyle = '#0f172a'; // slate-900
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
    renderableHits.forEach((hit) => {
      const isSelected = selectedHitIndices.includes(hit.sampleIndex);
      const isHovered = hoveredHitIndex === hit.sampleIndex;
      const x = ((hit.sampleIndex - startSample) / visibleSamples) * width;

      if (x < 0 || x > width) return;

      let color = isSelected ? '#FF8C00' : '#0066ff'; // orange if selected, blue default
      if (hit.state === 'muted' && !isSelected) color = '#808080';
      else if ((hit.state === 'locked' || hit.state === 'user-added') && !isSelected) {
        color = '#0066ff';
      }

      if (isHovered && !isSelected) {
        // Brighten color for hover
        ctx.shadowBlur = 10;
        ctx.shadowColor = color;
      }

      ctx.save();
      
      // Vertical line (only if not muted)
      if (hit.state !== 'muted') {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = isHovered ? 3 : ((hit.state === 'locked' || hit.state === 'user-added') ? 2 : 1);
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Triangle Marker (not for locked hits)
      if (hit.state !== 'locked') {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(x - 8, 0);
        ctx.lineTo(x + 8, 0);
        ctx.lineTo(x, 12);
        ctx.fill();
      }

      // Padlock Icon for Locked Hits (Centered at top)
      if (hit.state === 'locked') {
        ctx.strokeStyle = isSelected ? 'white' : '#cbd5e1';
        ctx.fillStyle = color;
        ctx.lineWidth = 1.5;
        
        const px = x - 5;
        const py = 5;
        // Erase line behind lock
        ctx.clearRect(px - 2, py - 4, 14, 14);

        ctx.fillRect(px - 1, py, 12, 8); // body
        ctx.beginPath();
        ctx.arc(x, py, 5, Math.PI, 0); // shackle
        ctx.stroke();
      }

      ctx.restore();
      ctx.shadowBlur = 0; // reset shadow
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
      ctx.strokeStyle = 'rgba(100, 150, 255, 0.8)';
      ctx.fillStyle = 'rgba(100, 150, 255, 0.3)';
      ctx.setLineDash([5, 5]);
      const mx = Math.min(marquee.start.x, marquee.end.x);
      const my = Math.min(marquee.start.y, marquee.end.y);
      const mw = Math.abs(marquee.start.x - marquee.end.x);
      const mh = Math.abs(marquee.start.y - marquee.end.y);
      ctx.fillRect(mx, my, mw, mh);
      ctx.strokeRect(mx, my, mw, mh);
      ctx.restore();
    }

      // 5. Loop Locators (Black Flagpoles)
      const drawLocator = (time: number, label: string) => {
        const lx = ((time * sampleRate - startSample) / visibleSamples) * width;
        if (lx < 0 || lx > width) return;
        ctx.save();
        
        // Flagpole
        ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(lx, 0);
      ctx.lineTo(lx, height);
      ctx.stroke();

      // Triangle Head (Larger, top hugging)
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      const triWidth = 24;
      const triHeight = 24;
      if (label === 'L') {
        ctx.moveTo(lx, 0);
        ctx.lineTo(lx + triWidth, 0);
        ctx.lineTo(lx, triHeight);
      } else {
        ctx.moveTo(lx, 0);
        ctx.lineTo(lx - triWidth, 0);
        ctx.lineTo(lx, triHeight);
      }
      ctx.fill();
      
      // Label "L" or "R"
      ctx.fillStyle = 'white';
      ctx.font = 'bold 11px Inter';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const textX = label === 'L' ? lx + 7 : lx - 7;
      ctx.fillText(label, textX, 2);

      ctx.restore();
    };
    drawLocator(loopRange[0], 'L');
    drawLocator(loopRange[1], 'R');

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
  }, [audioBuffer, renderableHits, zoomRange, activeTool, hoverSample, hoveredHitIndex, marquee, selectedHitIndices, isPlaying, currentTime, sampleRate, loopRange]);

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
    const lineThresholdPx = 4; // strictly 4 pixels wide for the line
    const lineThreshold = (lineThresholdPx / rect.width) * (visibleSamples / sampleRate);
    const lTime = loopRange[0];
    const rTime = loopRange[1];
    const lX = ((lTime * sampleRate - startSample) / visibleSamples) * rect.width;
    const rX = ((rTime * sampleRate - startSample) / visibleSamples) * rect.width;

    const isLeftLine = Math.abs(mouseTime - lTime) < lineThreshold;
    const isRightLine = Math.abs(mouseTime - rTime) < lineThreshold;
    const isLeftTriangle = y <= 16 && x >= lX && x <= lX + 24;
    const isRightTriangle = y <= 16 && x <= rX && x >= rX - 24;

    let draggingLocator: 'left' | 'right' | null = null;
    if (isLeftLine || isLeftTriangle) draggingLocator = 'left';
    else if (isRightLine || isRightTriangle) draggingLocator = 'right';

    let isMarqueePossible = (activeTool === 'pointer' && hoveredHitIndex === null && !draggingLocator);
    let wasDragged = false;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const mx = moveEvent.clientX - rect.left;
      const my = moveEvent.clientY - rect.top;
      
      if (Math.abs(mx - x) > 3 || Math.abs(my - y) > 3) {
        wasDragged = true;
      }

      if (draggingLocator) {
        let finalTime = (startSample + (mx / rect.width) * visibleSamples) / sampleRate;
        if (!moveEvent.shiftKey) {
          let closestHitTime = finalTime;
          let minDiff = Infinity;
          const snapThreshold = 0.05;
          renderableHits.forEach(hit => {
            const hitTime = hit.sampleIndex / sampleRate;
            const diff = Math.abs(hitTime - finalTime);
            if (diff < minDiff && diff < snapThreshold) {
              minDiff = diff;
              closestHitTime = hitTime;
            }
          });
          finalTime = closestHitTime;
        }
        setLoopRange((prev: [number, number]) => {
          let [lStart, lEnd] = prev;
          if (draggingLocator === 'left') lStart = Math.max(0, Math.min(finalTime, lEnd - 0.05));
          else lEnd = Math.max(lStart + 0.05, Math.min(finalTime, totalSamples / sampleRate));
          
          return [lStart, lEnd] as [number, number];
        });
      } else if (isMarqueePossible && wasDragged) {
        setMarquee({ start: { x, y }, end: { x: mx, y: my } });
      }
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      const mx = upEvent.clientX - rect.left;
      const my = upEvent.clientY - rect.top;

      if (draggingLocator) {
        // Final sync of zoom handles to locators after dragging is complete
        setLoopRange((final: [number, number]) => {
          const duration = audioBuffer.length / sampleRate;
          setZoomRange([final[0] / duration, final[1] / duration]);
          return final;
        });
      } else if (isMarqueePossible && wasDragged) {
        const mx1 = Math.min(x, mx);
        const mx2 = Math.max(x, mx);
        const newSelection: number[] = [];
        renderableHits.forEach(hit => {
          const hx = ((hit.sampleIndex - startSample) / visibleSamples) * rect.width;
          if (hx >= mx1 && hx <= mx2) {
            newSelection.push(hit.sampleIndex);
          }
        });
        if (upEvent.shiftKey) {
          setSelectedHitIndices(prev => [...new Set([...prev, ...newSelection])]);
        } else {
          setSelectedHitIndices(newSelection);
        }
      } else if (!wasDragged) {
        // HANDLE SINGLE CLICK
        const clickedSample = Math.floor(startSample + (mx / rect.width) * visibleSamples);
        const clickedTime = clickedSample / sampleRate;

        // NEW: Check if click was in the top hitzone (triangles/locks)
        // Restricted to top zone ONLY for pointer tool
        const isHitZone = (activeTool === 'pointer') ? (my <= 20) : true;

        const tolerancePx = activeTool === 'pointer' ? 8 : 10;
        const toleranceSamples = (visibleSamples / rect.width) * tolerancePx;
        let nearestHit = isHitZone ? renderableHits.find(h => Math.abs(h.sampleIndex - clickedSample) < toleranceSamples) : null;
        
        if (activeTool === 'pencil') {
          onHitAction(clickedSample, 'add');
        } else if (nearestHit) {
          if (activeTool === 'eraser') onHitAction(nearestHit.sampleIndex, 'toggle-mute');
          else if (activeTool === 'lock') onHitAction(nearestHit.sampleIndex, 'toggle-lock');
          else if (activeTool === 'pointer') onHitAction(nearestHit.sampleIndex, 'toggle-select');
        } else if (activeTool === 'pointer') {
          // Negative space click: deselect and audition
          setSelectedHitIndices([]);
          
          const sortedHits = [...renderableHits].sort((a, b) => a.sampleIndex - b.sampleIndex);
          let sliceStart = 0;
          let sliceEnd = audioBuffer.length / sampleRate;
          for (let i = 0; i < sortedHits.length; i++) {
            const hitTime = sortedHits[i].sampleIndex / sampleRate;
            if (hitTime < clickedTime) sliceStart = hitTime;
            else { sliceEnd = hitTime; break; }
          }
          playSlice(sliceStart, sliceEnd, undefined, true);
        }
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
    const y = e.clientY - rect.top;
    
    const [startRatio, endRatio] = zoomRange;
    const totalSamples = audioBuffer.length;
    const startSample = startRatio * totalSamples;
    const visibleSamples = (endRatio - startRatio) * totalSamples;
    
    const currentSample = Math.floor(startSample + (x / rect.width) * visibleSamples);
    setHoverSample(currentSample);

    // Context-Aware Hitbox Hover Detection
    let foundHit: number | null = null;
    const isHitZone = (activeTool === 'pointer') ? (y <= 20) : true;
    
    if (isHitZone) {
      const tolerancePx = activeTool === 'pointer' ? 8 : 10;
      const toleranceSamples = (visibleSamples / rect.width) * tolerancePx;

      renderableHits.forEach(hit => {
        const dist = Math.abs(hit.sampleIndex - currentSample);
        if (dist < toleranceSamples) {
          foundHit = hit.sampleIndex;
        }
      });
    }
    setHoveredHitIndex(foundHit);
  };

  const getCursor = () => {
    if (isPlaying) {
      return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='orange' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolygon points='11 5 6 9 2 9 2 15 6 15 11 19 11 5'%3E%3C/polygon%3E%3Cpath d='M19.07 4.93a10 10 0 0 1 0 14.14'%3E%3C/path%3E%3Cpath d='M15.54 8.46a5 5 0 0 1 0 7.07'%3E%3C/path%3E%3C/svg%3E") 12 12, auto`;
    }
    switch (activeTool) {
      case 'eraser':
        return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='red' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cline x1='18' y1='6' x2='6' y2='18'%3E%3C/line%3E%3Cline x1='6' y1='6' x2='18' y2='18'%3E%3C/line%3E%3C/svg%3E") 12 12, crosshair`;
      case 'lock':
        return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='blue' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='11' width='18' height='11' rx='2' ry='2'%3E%3C/rect%3E%3Cpath d='M7 11V7a5 5 0 0 1 10 0v4'%3E%3C/path%3E%3C/svg%3E") 12 12, auto`;
      case 'pencil':
        return 'crosshair';
      default:
        return 'default';
    }
  };

  return (
    <div className="relative border-x border-slate-300">
      <canvas
        ref={canvasRef}
        width={1200}
        height={300}
        style={{ cursor: getCursor() }}
        className="w-full h-[300px] bg-white transition-all"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => {
          setHoverSample(null);
          setMarquee(null);
        }}
      />
    </div>
  );
};
