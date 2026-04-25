import React, { useRef, useEffect, useState } from 'react';

interface WaveformMinimapProps {
  audioBuffer: Float32Array | null;
  zoomRange: [number, number];
  setZoomRange: React.Dispatch<React.SetStateAction<[number, number]>>;
}

export const WaveformMinimap: React.FC<WaveformMinimapProps> = ({
  audioBuffer,
  zoomRange,
  setZoomRange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState<'left' | 'right' | 'center' | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !audioBuffer) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Draw Real Waveform (RMS/Peaks)
    ctx.beginPath();
    ctx.strokeStyle = '#0f172a'; // slate-900
    ctx.lineWidth = 1;

    const samplesPerPixel = audioBuffer.length / width;
    const amp = height / 2;

    for (let i = 0; i < width; i++) {
      let min = 0;
      let max = 0;
      const start = Math.floor(i * samplesPerPixel);
      const end = Math.floor((i + 1) * samplesPerPixel);
      
      for (let s = start; s < end; s++) {
        const val = audioBuffer[s];
        if (val < min) min = val;
        if (val > max) max = val;
      }
      
      ctx.moveTo(i, amp + min * amp);
      ctx.lineTo(i, amp + max * amp);
    }
    ctx.stroke();

    // Draw zoom overlay
    const startX = zoomRange[0] * width;
    const endX = zoomRange[1] * width;

    // Semi-transparent box
    ctx.fillStyle = 'rgba(0, 102, 255, 0.1)';
    ctx.fillRect(startX, 0, endX - startX, height);
    
    // Borders
    ctx.strokeStyle = '#0066ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(startX, 0, endX - startX, height);

    // Handles with Grips
    const drawHandle = (x: number, side: 'left' | 'right') => {
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

    drawHandle(startX, 'left');
    drawHandle(endX, 'right');

  }, [audioBuffer, zoomRange]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const startX = zoomRange[0];
    const endX = zoomRange[1];
    const threshold = 15 / rect.width; // Increased threshold for larger handles

    let type: 'left' | 'right' | 'center' | null = null;
    if (Math.abs(x - startX) < threshold) type = 'left';
    else if (Math.abs(x - endX) < threshold) type = 'right';
    else if (x > startX && x < endX) type = 'center';

    if (!type) return;
    setIsDragging(type);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newX = Math.max(0, Math.min(1, (moveEvent.clientX - rect.left) / rect.width));
      
      setZoomRange(prev => {
        let [start, end] = prev;
        if (type === 'left') {
          start = Math.min(newX, end - 0.01);
        } else if (type === 'right') {
          end = Math.max(newX, start + 0.01);
        } else if (type === 'center') {
          const width = end - start;
          start = Math.max(0, Math.min(1 - width, newX - width / 2));
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
    <div className="glass rounded-xl p-2 mb-3 overflow-visible">
      <canvas
        ref={canvasRef}
        width={1200}
        height={40}
        className={`w-full h-[40px] rounded bg-white bg-opacity-50 transition-all ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        style={{ overflow: 'visible' }}
        onMouseDown={handleMouseDown}
      />
    </div>
  );
};
