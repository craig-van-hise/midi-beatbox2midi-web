import React, { useState, useEffect } from 'react';
import { useHitManager, HitState } from './hooks/useHitManager';
import { useAudioPlayback } from './hooks/useAudioPlayback';
import { Controls } from './components/Controls';
import { WaveformMinimap } from './components/WaveformMinimap';
import { RulerCanvas } from './components/RulerCanvas';
import { SlicerCanvas } from './components/SlicerCanvas';
import { Toolbar, Tool } from './components/Toolbar';
import { Transport } from './components/Transport';
import { Upload, Music, Settings, Info, AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  const {
    audioBuffer,
    fullAudioBuffer,
    renderableHits,
    hitStates,
    selectedHitIndices,
    setSelectedHitIndices,
    params,
    setParams,
    loadFile,
    toggleHitState,
    batchToggleHitState,
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
    playSlice,
    returnToZero,
    seek,
  } = useAudioPlayback(fullAudioBuffer);

  const [zoomRange, setZoomRange] = useState<[number, number]>([0, 1]);
  const [activeTool, setActiveTool] = useState<Tool>('pointer');
  const [tempo, setTempo] = useState(120.000);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is focused on an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedHitIndices.length > 0) {
          batchToggleHitState(selectedHitIndices, 'muted');
          setSelectedHitIndices([]);
        }
      } else if (e.key.toLowerCase() === 'm') {
        if (selectedHitIndices.length > 0) {
          batchToggleHitState(selectedHitIndices, 'muted');
        }
      } else if (e.key.toLowerCase() === 'l') {
        if (selectedHitIndices.length > 0) {
          batchToggleHitState(selectedHitIndices, 'locked');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedHitIndices, batchToggleHitState, setSelectedHitIndices]);

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
        setSelectedHitIndices(prev => 
          prev.includes(sampleIndex) 
            ? prev.filter(idx => idx !== sampleIndex) 
            : [...prev, sampleIndex]
        );
        break;
      case 'batch-select':
        // This will be used by marquee
        setSelectedHitIndices(prev => {
          // If we want to add to selection or replace? 
          // Marquee usually replaces or adds with shift. 
          // For now, let's just add unique ones.
          const next = [...prev];
          // Assuming sampleIndex is passed as a special value or we change the signature.
          // Let's just handle it in SlicerCanvas for now or add a new action.
          return next;
        });
        break;
    }
  };

  return (
    <div className="min-h-screen pb-20 px-6 pt-4 max-w-[1400px] mx-auto flex flex-col gap-4">
      <header className="flex items-center justify-between py-2 border-b border-slate-100">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-hit-blue rounded-lg flex items-center justify-center text-white shadow-md">
            <Music size={18} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tighter leading-none">
              BEATBOX<span className="text-hit-blue">2</span>MIDI
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Transient Slicer</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors shadow-sm mr-2">
            <Upload size={16} className="text-slate-400" />
            <span className="text-xs font-bold text-slate-600">Import</span>
            <input type="file" accept="audio/*" onChange={handleFileChange} className="hidden" />
          </label>
          
          <button className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-lg text-slate-400" title="MIDI Panic">
            <AlertCircle size={18} />
          </button>
          <button className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-lg text-slate-400" title="Info">
            <Info size={18} />
          </button>
          <button className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-lg text-slate-400" title="Settings">
            <Settings size={18} />
          </button>
        </div>
      </header>

      <main 
        className="flex-1 overflow-hidden"
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDrop={(e) => {
          e.preventDefault(); e.stopPropagation();
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

        <div className="glass rounded-xl overflow-hidden shadow-inner flex flex-col">
          <div className="px-4 py-2 bg-white bg-opacity-40 flex items-center justify-between border-b border-slate-200">
            <Toolbar activeTool={activeTool} setActiveTool={setActiveTool} />
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Workspace
            </div>
          </div>
          
          <RulerCanvas 
            zoomRange={zoomRange}
            totalSamples={audioBuffer?.length || 0}
            sampleRate={sampleRate}
            tempo={tempo}
            timeSignature={[4, 4]}
            loopRange={loopRange}
            onSeek={seek}
          />

          <SlicerCanvas 
            audioBuffer={audioBuffer}
            renderableHits={renderableHits}
            zoomRange={zoomRange}
            activeTool={activeTool}
            onHitAction={handleHitAction}
            selectedHitIndices={selectedHitIndices}
            setSelectedHitIndices={setSelectedHitIndices}
            isPlaying={isPlaying}
            currentTime={currentTime}
            sampleRate={sampleRate}
            loopRange={loopRange}
            setLoopRange={setLoopRange}
            playSlice={playSlice}
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
        onRTZ={returnToZero}
        currentTime={currentTime}
      />
    </div>
  );
};

export default App;
