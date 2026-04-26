import React, { useState, useEffect, useRef } from 'react';
import { useHitManager, HitState } from './hooks/useHitManager';
import { useAudioPlayback } from './hooks/useAudioPlayback';
import { Controls } from './components/Controls';
import { WaveformMinimap } from './components/WaveformMinimap';
import { RulerCanvas } from './components/RulerCanvas';
import { SlicerCanvas } from './components/SlicerCanvas';
import { Toolbar, Tool } from './components/Toolbar';
import { Transport } from './components/Transport';
import { Upload, Music, Settings, Info, AlertCircle, Mic, FileAudio, Radio } from 'lucide-react';

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

  const [zoomRange, setZoomRange] = useState<[number, number]>([0, 1]);
  const [activeTool, setActiveTool] = useState<Tool>('pointer');
  const [tempo, setTempo] = useState(120.000);
  const [timeSignature, setTimeSignature] = useState<[number, number]>([4, 4]);
  const [metronomeEnabled, setMetronomeEnabled] = useState(false);

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
  } = useAudioPlayback(fullAudioBuffer, metronomeEnabled, tempo, timeSignature);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isRecordingMic, setIsRecordingMic] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);

  const startMicRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const file = new File([audioBlob], "recorded_audio.wav", { type: 'audio/wav' });
        loadFile(file);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecordingMic(true);
    } catch (err) {
      console.error("Microphone access denied or failed", err);
    }
  };

  const stopMicRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecordingMic(false);
  };

  const stateRef = useRef({
    selectedHitIndices,
    audioBuffer,
    renderableHits,
    sampleRate,
    currentTime,
    batchToggleHitState,
    toggleHitState,
    playSlice,
    togglePlay,
    setSelectedHitIndices,
    loopRange,
    seek
  });

  useEffect(() => {
    stateRef.current = {
      selectedHitIndices,
      audioBuffer,
      renderableHits,
      sampleRate,
      currentTime,
      batchToggleHitState,
      toggleHitState,
      playSlice,
      togglePlay,
      setSelectedHitIndices,
      loopRange,
      seek
    };
  }, [selectedHitIndices, audioBuffer, renderableHits, sampleRate, currentTime, batchToggleHitState, toggleHitState, playSlice, togglePlay, setSelectedHitIndices, loopRange, seek]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is focused on an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const { 
        audioBuffer, renderableHits, sampleRate, currentTime, 
        selectedHitIndices, batchToggleHitState, toggleHitState, 
        playSlice, togglePlay, setSelectedHitIndices 
      } = stateRef.current;

      if (e.key === 'Escape') {
        setSelectedHitIndices([]);
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedHitIndices.length > 0) {
          e.preventDefault();
          batchToggleHitState(selectedHitIndices, 'muted');
          setSelectedHitIndices([]);
        }
      } else if (e.key.toLowerCase() === 'm') {
        if (selectedHitIndices.length > 0) {
          e.preventDefault();
          batchToggleHitState(selectedHitIndices, 'muted');
          setSelectedHitIndices([]);
        }
      } else if (e.key.toLowerCase() === 'l') {
        if (selectedHitIndices.length > 0) {
          e.preventDefault();
          batchToggleHitState(selectedHitIndices, 'locked');
          setSelectedHitIndices([]);
        }
      } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        if (!audioBuffer) return;

        const { 
          audioBuffer: buf, renderableHits: hits, sampleRate: sr, currentTime: ct, 
          selectedHitIndices: sel, batchToggleHitState: batch, toggleHitState: toggle, 
          playSlice: play, loopRange: loop, setSelectedHitIndices: setSel, seek: doSeek
        } = stateRef.current;

        const lBound = loop[0];
        const rBound = loop[1];
        // Include ALL hits (including muted) in boundaries to allow toggling
        const allHits = hits.sort((a: any, b: any) => a.sampleIndex - b.sampleIndex);

        const sliceBoundaries: { time: number, hitIndex?: number }[] = [{ time: lBound }];
        allHits.forEach((h: any) => {
          const t = h.sampleIndex / sr;
          if (t > lBound + 0.002 && t < rBound - 0.002) {
            sliceBoundaries.push({ time: t, hitIndex: h.sampleIndex });
          }
        });
        sliceBoundaries.push({ time: rBound });

        // Find current slice
        let currentSliceIdx = 0;
        for (let i = 0; i < sliceBoundaries.length - 1; i++) {
          if (ct >= sliceBoundaries[i].time - 0.005 && ct < sliceBoundaries[i+1].time - 0.005) {
            currentSliceIdx = i;
            break;
          }
        }

        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          const currentBoundary = sliceBoundaries[currentSliceIdx];
          if (currentBoundary.hitIndex !== undefined) {
            const newState = e.key === 'ArrowUp' ? 'locked' : 'muted';
            toggle(currentBoundary.hitIndex, newState);
            setSel(prev => prev.filter(idx => idx !== currentBoundary.hitIndex));
          }
        } 
        else if (e.key === 'ArrowLeft') {
          let targetIdx = currentSliceIdx - 1;
          if (targetIdx < 0) targetIdx = sliceBoundaries.length - 2;
          const start = sliceBoundaries[targetIdx].time;
          const end = sliceBoundaries[targetIdx + 1].time;
          play(start, end, undefined, true);
        } 
        else if (e.key === 'ArrowRight') {
          let targetIdx = currentSliceIdx + 1;
          if (targetIdx > sliceBoundaries.length - 2) targetIdx = 0;
          const start = sliceBoundaries[targetIdx].time;
          const end = sliceBoundaries[targetIdx + 1].time;
          play(start, end, undefined, true);
        }
      }
    };

    // Use capture phase to ensure we catch events before focused UI elements
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
  };

  const handleHitAction = (sampleIndex: number, action: string) => {
    switch (action) {
      case 'toggle-lock':
        toggleHitState(sampleIndex, 'locked');
        setSelectedHitIndices(prev => prev.filter(idx => idx !== sampleIndex));
        break;
      case 'toggle-mute':
        toggleHitState(sampleIndex, 'muted');
        setSelectedHitIndices(prev => prev.filter(idx => idx !== sampleIndex));
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
        className="flex-1 overflow-hidden relative"
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingOver(true); }}
        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingOver(false); }}
        onDrop={(e) => {
          e.preventDefault(); e.stopPropagation(); setIsDraggingOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file && (file.type.startsWith('audio/') || file.name.endsWith('.wav'))) {
            loadFile(file);
          }
        }}
      >
        {!audioBuffer ? (
          <div className={`h-full min-h-[400px] flex flex-col items-center justify-center border-4 border-dashed rounded-3xl transition-all duration-300 p-12 ${
            isDraggingOver 
              ? 'border-hit-blue bg-blue-50 bg-opacity-50 scale-[0.99] shadow-inner' 
              : 'border-slate-200 bg-slate-50'
          }`}>
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-8 transition-transform duration-500 ${isDraggingOver ? 'scale-110' : ''}`}>
              {isDraggingOver ? (
                <FileAudio size={48} className="text-hit-blue animate-bounce" />
              ) : (
                <div className="relative">
                  <div className="relative bg-white p-6 rounded-full shadow-lg border border-slate-100">
                    <Music size={32} className="text-hit-blue" />
                  </div>
                </div>
              )}
            </div>
            
            <h2 className="text-3xl font-black text-slate-800 tracking-tight mb-3">
              Ready to Slice?
            </h2>
            <p className="text-slate-500 font-medium mb-10 text-center max-w-md">
              Drag & Drop .WAV files here or use your microphone to start slicing your beats.
            </p>

            <div className="flex items-center gap-4 flex-wrap justify-center">
              <label className="flex items-center gap-3 bg-white border-2 border-slate-200 px-8 py-4 rounded-2xl cursor-pointer hover:border-hit-blue hover:text-hit-blue transition-all shadow-sm font-bold text-slate-600">
                <Upload size={20} />
                <span>Browse Files</span>
                <input type="file" accept="audio/*" onChange={handleFileChange} className="hidden" />
              </label>

              <button 
                onClick={isRecordingMic ? stopMicRecording : startMicRecording}
                className={`flex items-center gap-3 px-8 py-4 rounded-2xl transition-all font-bold shadow-sm ${
                  isRecordingMic 
                    ? 'bg-red-500 text-white animate-pulse' 
                    : 'bg-slate-800 text-white hover:bg-slate-700'
                }`}
              >
                {isRecordingMic ? <Radio size={20} /> : <Mic size={20} />}
                <span>{isRecordingMic ? 'Stop Recording' : 'Record Mic'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 h-full overflow-y-auto overflow-x-hidden pr-2">
            <Controls params={params} setParams={setParams} />

            <WaveformMinimap 
              audioBuffer={audioBuffer} 
              zoomRange={zoomRange} 
              setZoomRange={setZoomRange} 
              loopRange={loopRange}
              sampleRate={sampleRate}
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
                timeSignature={timeSignature}
                loopRange={loopRange}
                onSeek={seek}
              />

              <SlicerCanvas 
                audioBuffer={audioBuffer}
                renderableHits={renderableHits}
                zoomRange={zoomRange}
                setZoomRange={setZoomRange}
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
          </div>
        )}
      </main>

      <Transport 
        tempo={tempo}
        setTempo={setTempo}
        timeSignature={timeSignature}
        setTimeSignature={setTimeSignature}
        metronomeEnabled={metronomeEnabled}
        setMetronomeEnabled={setMetronomeEnabled}
        isRecording={isRecordingMic}
        toggleRecording={isRecordingMic ? stopMicRecording : startMicRecording}
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
