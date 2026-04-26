# Project State - Beatbox2MIDI

## 1. Architecture Map
```
src/
├── App.tsx (Main Coordinator)
├── hooks/
│   ├── useHitManager.ts (WASM State & Param logic)
│   └── useAudioPlayback.ts (Web Audio Engine)
├── components/
│   ├── SlicerCanvas.tsx (Main Interaction Surface)
│   ├── WaveformMinimap.tsx (Overview & Zoom)
│   ├── RulerCanvas.tsx (Timeline/Grid)
│   ├── Toolbar.tsx (Tool Selection)
│   ├── Transport.tsx (Playback Controls)
│   └── Controls.tsx (DSP Parameters)
└── lib/
    └── AudioProcessor.js (JS/WASM Bridge)
```

## 2. Tech Stack Audit
- **Core**: React 18, TypeScript, Vite
- **DSP**: C++ WASM (compiled via Emscripten)
- **Audio**: Web Audio API (AudioBufferSourceNode, AudioContext)
- **UI**: Tailwind CSS, Lucide-React, Glassmorphism
- **Icons**: Music, Sliders, Zap, VolumeX, Timer, Play, Square, Repeat, Mic, Upload, FileAudio

## 3. System Capabilities & Status

### Audio Engine [STABLE]
- [x] High-fidelity WAV/Audio decoding & Mono-summing.
- [x] Synced playhead tracking with `requestAnimationFrame`.
- [x] Looping playback with interactive locators (draggable flags/poles).
- [x] **Audition Engine**: "In Situ" slice previewing with auto-return playhead logic.

### DSP Engine (WASM) [STABLE]
- [x] Transient detection via Energy/Onset algorithm with memory-efficient HEAP access.
- [x] **Normalized Thresholding**: Sensitivity (0-1.0) mapped to backend flux peaks for "True Zero" hits.
- [x] **Parameter Control**: Real-time updates for Sensitivity, Noise Floor, and Refractory periods.

### Visualizer & Interaction [STABLE]
- [x] Multi-level waveform rendering (Minimap + Main Canvas) with trackpad zoom/scroll.
- [x] **Precision Interaction**: Pointer tool restricted to top zone; Eraser/Lock tools full-height.
- [x] **Navigation**: Loop-aware arrow key navigation with 5ms epsilon and wrap-around logic.
- [x] **Marquee Selection**: Multi-hit selection with distinct orange highlighting for muted/active hits.

### Onboarding & Transport [STABLE]
- [x] **Empty State Dropzone**: Drag-and-drop WAV support with visual feedback.
- [x] **Microphone Pipeline**: Direct recording from system mic into the slicer.
- [x] **Global Transport**: Integrated tempo, time signature, and metronome controls.

## 4. Current Work-in-Progress
- [ ] **MIDI Export**: Implementing the logic to convert transient boundaries into MIDI file/stream.
- [ ] **UI Polish**: Finalizing glassmorphism transitions and responsive layout refinements.

## 5. Recent Evolution
The system has matured from a DSP prototype into a high-fidelity interaction surface. Recent updates added a robust Audition Engine for "in situ" slice previewing and a precision arrow-navigation system that respects loop boundaries. We also implemented a dedicated onboarding flow with drag-and-drop support and a microphone recording pipeline, completing the core lifecycle from input to interaction.
