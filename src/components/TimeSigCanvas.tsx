import React, { useRef, useEffect } from 'react';

interface TimeSigCanvasProps {
  zoomRange: [number, number];
  totalSamples: number;
  sampleRate: number;
  tempo: number;
  timeSignature: [number, number];
  setTimeSignature: (sig: [number, number]) => void;
}

export const TimeSigCanvas: React.FC<TimeSigCanvasProps> = ({
  zoomRange,
  totalSamples,
  sampleRate,
  tempo,
  timeSignature,
  setTimeSignature,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Use internal dimensions for drawing
    const width = canvas.width;
    const height = canvas.height;
    const [start, end] = zoomRange;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Fallback if no audio loaded
    const effectiveTotalSamples = totalSamples > 0 ? totalSamples : (sampleRate * 120); 
    const visibleSamples = effectiveTotalSamples * (end - start);
    const startSample = effectiveTotalSamples * start;

    if (visibleSamples <= 0) return;

    const beatsPerMeasure = timeSignature[0];
    const beatsPerSecond = (tempo || 120) / 60;
    const samplesPerBeat = (sampleRate || 44100) / beatsPerSecond;
    const samplesPerMeasure = samplesPerBeat * beatsPerMeasure;

    const startMeasure = Math.floor(startSample / samplesPerMeasure);
    // Draw 100 measures max to avoid infinite loop if math fails
    const endMeasure = Math.min(startMeasure + 100, Math.ceil((startSample + visibleSamples) / samplesPerMeasure));

    const flagWidth = 24;
    const flagHeight = 32;

    for (let m = startMeasure; m <= endMeasure; m++) {
      const measureSample = m * samplesPerMeasure;
      const x = ((measureSample - startSample) / visibleSamples) * width;
      
      if (x + flagWidth >= 0 && x <= width + flagWidth) {
        const lx = Math.round(x) + 0.5; // Back to 0.5 hack for thin lines if needed, but barlines are bold
        
        ctx.save();
        
        // Vertical Separator Line (Measure - BOLD Black)
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(lx, 0);
        ctx.lineTo(lx, height);
        ctx.stroke();

        // Translate for flag box
        ctx.translate(lx, (height - flagHeight) / 2);

        // Flag Box (Square DAW style)
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.fillRect(0, 0, flagWidth, flagHeight);
        ctx.strokeRect(0, 0, flagWidth, flagHeight);

        // Text
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 11px "Google Sans Flex", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        ctx.fillText(timeSignature[0].toString(), flagWidth / 2, flagHeight / 3);
        
        // Divider
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.moveTo(4, flagHeight / 2);
        ctx.lineTo(flagWidth - 4, flagHeight / 2);
        ctx.stroke();
        
        ctx.fillText(timeSignature[1].toString(), flagWidth / 2, (flagHeight * 2) / 3 + 2);
        
        ctx.restore();
      }
    }

    // DRAW BORDER AROUND CANVAS FOR DEBUGGING (Temporary)
    // ctx.strokeStyle = 'red';
    // ctx.lineWidth = 1;
    // ctx.strokeRect(0, 0, width, height);
  };

  useEffect(() => {
    // Initial draw
    draw();
    
    // Resize handling
    const resizeObserver = new ResizeObserver(() => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        draw();
      }
    });

    if (canvasRef.current) {
      resizeObserver.observe(canvasRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [zoomRange, totalSamples, sampleRate, tempo, timeSignature]);

  // Also redraw on prop changes
  useEffect(() => {
    draw();
  }, [zoomRange, totalSamples, sampleRate, tempo, timeSignature]);

  const handleClick = (e: React.MouseEvent) => {
    const input = window.prompt("Enter new time signature (e.g., 3/4):", `${timeSignature[0]}/${timeSignature[1]}`);
    if (input) {
      const parts = input.split('/');
      if (parts.length === 2) {
        const num = parseInt(parts[0]);
        const den = parseInt(parts[1]);
        if (!isNaN(num) && !isNaN(den) && den > 0) {
          setTimeSignature([num, den]);
        }
      }
    }
  };

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full cursor-pointer"
      onClick={handleClick}
    />
  );
};
