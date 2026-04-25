import React, { useRef, useEffect } from 'react';

interface RulerCanvasProps {
  zoomRange: [number, number];
  totalSamples: number;
  sampleRate: number;
  tempo: number;
  timeSignature: [number, number];
}

export const RulerCanvas: React.FC<RulerCanvasProps> = ({
  zoomRange,
  totalSamples,
  sampleRate,
  tempo,
  timeSignature,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const [startRatio, endRatio] = zoomRange;
    const startSample = startRatio * totalSamples;
    const endSample = endRatio * totalSamples;
    const visibleSamples = endSample - startSample;

    if (visibleSamples <= 0 || sampleRate <= 0 || tempo <= 0) return;

    const beatsPerSecond = tempo / 60;
    const samplesPerBeat = sampleRate / beatsPerSecond;
    const [num, den] = timeSignature;
    const samplesPerMeasure = samplesPerBeat * num;

    // Draw grid lines and text
    ctx.strokeStyle = '#94a3b8'; // slate-400
    ctx.fillStyle = '#64748b'; // slate-500
    ctx.font = '10px Inter';
    ctx.textAlign = 'left';

    const startMeasure = Math.floor(startSample / samplesPerMeasure);
    const endMeasure = Math.ceil(endSample / samplesPerMeasure);

    for (let m = startMeasure; m <= endMeasure; m++) {
      const measureSample = m * samplesPerMeasure;
      const x = ((measureSample - startSample) / visibleSamples) * width;

      if (x >= 0 && x <= width) {
        ctx.beginPath();
        ctx.moveTo(x, height);
        ctx.lineTo(x, height - 15);
        ctx.stroke();
        ctx.fillText(`M${m + 1}`, x + 4, 12);
      }

      // Sub-beats
      for (let b = 1; b < num; b++) {
        const beatSample = measureSample + b * samplesPerBeat;
        const bx = ((beatSample - startSample) / visibleSamples) * width;
        if (bx >= 0 && bx <= width) {
          ctx.beginPath();
          ctx.moveTo(bx, height);
          ctx.lineTo(bx, height - 8);
          ctx.stroke();
        }
      }
    }
  }, [zoomRange, totalSamples, sampleRate, tempo, timeSignature]);

  return (
    <canvas
      ref={canvasRef}
      width={1200}
      height={24}
      className="w-full h-[24px] bg-slate-200 border-b border-slate-300"
    />
  );
};
