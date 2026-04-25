import React, { useState, useEffect } from 'react';
import { useHitManager, HitState } from './hooks/useHitManager';
import { useAudioPlayback } from './hooks/useAudioPlayback';
import { Controls } from './components/Controls';
import { WaveformMinimap } from './components/WaveformMinimap';
import { RulerCanvas } from './components/RulerCanvas';
import { SlicerCanvas } from './components/SlicerCanvas';
import { Toolbar, Tool } from './components/Toolbar';
import { Transport } from './components/Transport';
import { Upload, Music } from 'lucide-react';

const App: React.FC = () => {
  const {
    audioBuffer,
    fullAudioBuffer,
    engineHits,
    hitStates,
    params,
    setParams,
    loadFile,
    toggleHitState,
    sampleRate,
  } = useHitManager();

  const {
    isPlaying,
    currentTime,
    loopRange,
    setLoopRange,
    isLooping,
    setIsLooping,
    togglePlay,
  } = useAudioPlayback(fullAudioBuffer);

  const [zoomRange, setZoomRange] = useState<[number, number]>([0, 0.25]);
  const [activeTool, setActiveTool] = useState<Tool>('pointer');
  const [tempo, setTempo] = useState(120.000);
  const [selectedHits, setSelectedHits] = useState<Set<number>>(new Set());

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        selectedHits.forEach(sampleIndex => {
          toggleHitState(sampleIndex, 'muted');
        });
        setSelectedHits(new Set());
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedHits, toggleHitState]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
  };

  const handleHitAction = (sampleIndex: number, action: string) => {
    switch (action) {
      case 'toggle-lock':
        toggleHitState(sampleIndex, 'locked');
        break;
      case 'toggle-mute':
        toggleHitState(sampleIndex, 'muted');
        break;
      case 'add':
        toggleHitState(sampleIndex, 'user-added');
        break;
      case 'toggle-select':
        setSelectedHits(prev => {
          const next = new Set(prev);
          if (next.has(sampleIndex)) next.delete(sampleIndex);
          else next.add(sampleIndex);
          return next;
        });
        break;
    }
  };

  return (
    <div className="min-h-screen pb-24 px-8 pt-8 max-w-[1400px] mx-auto">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tighter flex items-center gap-3">
            <div className="w-10 h-10 bg-hit-blue rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <Music size={24} />
            </div>
            BEATBOX<span className="text-hit-blue">2</span>MIDI
          </h1>
          <p className="text-slate-400 text-sm font-medium mt-1 uppercase tracking-widest">Transient Slicer</p>
        </div>

        <label className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors shadow-sm">
          <Upload size={18} className="text-slate-400" />
          <span className="text-sm font-bold text-slate-600">Import Audio</span>
          <input type="file" accept="audio/*" onChange={handleFileChange} className="hidden" />
        </label>
      </header>

      <main 
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const file = e.dataTransfer.files?.[0];
          if (file && (file.type.startsWith('audio/') || file.name.endsWith('.wav'))) {
            loadFile(file);
          }
        }}
      >
        <Controls params={params} setParams={setParams} />

        <WaveformMinimap 
          audioBuffer={audioBuffer} 
          zoomRange={zoomRange} 
          setZoomRange={setZoomRange} 
        />

        <div className="glass rounded-xl overflow-hidden mb-4 shadow-inner">
          <div className="p-4 bg-white bg-opacity-40 flex items-center justify-between border-b border-slate-200">
            <Toolbar activeTool={activeTool} setActiveTool={setActiveTool} />
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Main Workspace
            </div>
          </div>
          
          <RulerCanvas 
            zoomRange={zoomRange}
            totalSamples={audioBuffer?.length || 0}
            sampleRate={sampleRate}
            tempo={tempo}
            timeSignature={[4, 4]}
          />

          <SlicerCanvas 
            audioBuffer={audioBuffer}
            engineHits={engineHits}
            hitStates={hitStates}
            zoomRange={zoomRange}
            activeTool={activeTool}
            onHitAction={handleHitAction}
            selectedHits={selectedHits}
            isPlaying={isPlaying}
            currentTime={currentTime}
            sampleRate={sampleRate}
            loopRange={loopRange}
            setLoopRange={setLoopRange}
          />
        </div>
      </main>

      <Transport 
        tempo={tempo}
        setTempo={setTempo}
        isPlaying={isPlaying}
        setIsPlaying={togglePlay}
        isLooping={isLooping}
        setIsLooping={setIsLooping}
      />
    </div>
  );
};

export default App;
