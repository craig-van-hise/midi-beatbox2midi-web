import React, { useRef, useEffect, useState } from 'react';

interface WaveformMinimapProps {
  audioBuffer: Float32Array | null;
  zoomRange: [number, number];
  setZoomRange: React.Dispatch<React.SetStateAction<[number, number]>>;
  loopRange: [number, number];
  sampleRate: number;
}

export const WaveformMinimap: React.FC<WaveformMinimapProps> = ({
  audioBuffer,
  zoomRange,
  setZoomRange,
  loopRange,
  sampleRate,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState<'left' | 'right' | 'center' | null>(null);
  const PADDING = 16; // Internal padding to prevent handle/locator clipping

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !audioBuffer) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const drawWidth = width - (PADDING * 2);
    ctx.clearRect(0, 0, width, height);

    // Helper to map 0-1 range to padded pixel range
    const toX = (ratio: number) => PADDING + ratio * drawWidth;

    // Draw Real Waveform (RMS/Peaks)
    ctx.beginPath();
    ctx.strokeStyle = '#0f172a'; // slate-900
    ctx.lineWidth = 1;

    const samplesPerPixel = audioBuffer.length / drawWidth;
    const amp = height / 2;

    for (let i = 0; i < drawWidth; i++) {
      let min = 0;
      let max = 0;
      const start = Math.floor(i * samplesPerPixel);
      const end = Math.floor((i + 1) * samplesPerPixel);
      
      for (let s = start; s < end; s++) {
        const val = audioBuffer[s];
        if (val < min) min = val;
        if (val > max) max = val;
      }
      
      const px = PADDING + i;
      ctx.moveTo(px, amp + min * amp);
      ctx.lineTo(px, amp + max * amp);
    }
    ctx.stroke();

    // Draw zoom overlay
    const startX = toX(zoomRange[0]);
    const endX = toX(zoomRange[1]);

    // Semi-transparent box
    ctx.fillStyle = 'rgba(0, 102, 255, 0.1)';
    ctx.fillRect(startX, 0, endX - startX, height);
    
    // Borders
    ctx.strokeStyle = '#0066ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(startX, 0, endX - startX, height);

    // Handles with Grips
    const drawHandle = (x: number) => {
      ctx.save();
      
      // Vertical line
      ctx.strokeStyle = '#0066ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();

      // Grip Pill
      const pillWidth = 10;
      const pillHeight = 20;
      const pillX = x - pillWidth / 2;
      const pillY = (height - pillHeight) / 2;

      ctx.fillStyle = '#0066ff';
      ctx.beginPath();
      ctx.roundRect(pillX, pillY, pillWidth, pillHeight, 4);
      ctx.fill();

      // 3 small horizontal lines inside pill
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 1.5;
      for (let j = 0; j < 3; j++) {
        const lineY = pillY + 5 + j * 5;
        ctx.beginPath();
        ctx.moveTo(pillX + 2, lineY);
        ctx.lineTo(pillX + pillWidth - 2, lineY);
        ctx.stroke();
      }

      ctx.restore();
    };

    drawHandle(startX);
    drawHandle(endX);

    // Draw L/R locators
    const duration = audioBuffer.length / sampleRate; 
    
    const drawLocator = (time: number, label: string) => {
      const lx = toX(time / duration);
      ctx.save();
      ctx.strokeStyle = '#000000'; // Solid black
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(lx, 0);
      ctx.lineTo(lx, height);
      ctx.stroke();
      // Small triangle
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      if (label === 'L') {
        ctx.moveTo(lx, 0); ctx.lineTo(lx + 8, 0); ctx.lineTo(lx, 6);
      } else {
        ctx.moveTo(lx, 0); ctx.lineTo(lx - 8, 0); ctx.lineTo(lx, 6);
      }
      ctx.fill();
      ctx.restore();
    };
    drawLocator(loopRange[0], 'L');
    drawLocator(loopRange[1], 'R');

  }, [audioBuffer, zoomRange, loopRange, sampleRate]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const drawWidth = width - (PADDING * 2 * (width / 1200)); // Scaled padding
    const xRatio = (e.clientX - rect.left - (PADDING * (width / 1200))) / drawWidth;
    
    const startX = zoomRange[0];
    const endX = zoomRange[1];
    const threshold = 20 / drawWidth; // Increased threshold

    let type: 'left' | 'right' | 'center' | null = null;
    if (Math.abs(xRatio - startX) < threshold) type = 'left';
    else if (Math.abs(xRatio - endX) < threshold) type = 'right';
    else if (xRatio > startX && xRatio < endX) type = 'center';

    if (!type) return;
    setIsDragging(type);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const currentRect = canvas.getBoundingClientRect();
      const currentWidth = currentRect.width;
      const currentDrawWidth = currentWidth - (PADDING * 2 * (currentWidth / 1200));
      let newRatio = (moveEvent.clientX - currentRect.left - (PADDING * (currentWidth / 1200))) / currentDrawWidth;
      newRatio = Math.max(0, Math.min(1, newRatio));

      const duration = audioBuffer!.length / sampleRate; 
      const snapThreshold = 0.04; // 4% of width - more liberal
      const lNorm = loopRange[0] / duration;
      const rNorm = loopRange[1] / duration;

      // Snapping logic
      if (!moveEvent.shiftKey && (type === 'left' || type === 'right')) {
        if (Math.abs(newRatio - lNorm) < snapThreshold) newRatio = lNorm;
        else if (Math.abs(newRatio - rNorm) < snapThreshold) newRatio = rNorm;
      }
      
      setZoomRange(prev => {
        let [start, end] = prev;
        if (type === 'left') {
          start = Math.min(newRatio, end - 0.01);
        } else if (type === 'right') {
          end = Math.max(newRatio, start + 0.01);
        } else if (type === 'center') {
          const width = end - start;
          start = Math.max(0, Math.min(1 - width, newRatio - width / 2));
          end = start + width;
        }
        return [start, end];
      });
    };

    const handleMouseUp = () => {
      setIsDragging(null);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div className="p-2 overflow-visible">
      <canvas
        ref={canvasRef}
        width={1200}
        height={40}
        className={`w-full h-[40px] rounded bg-white bg-opacity-50 transition-all ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        onMouseDown={handleMouseDown}
      />
    </div>
  );
};
