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
- **UI**: Tailwind CSS, Lucide-React
- **Icons**: Music, Sliders, Zap, VolumeX, Timer, Play, Square, Repeat

## 3. System Capabilities & Status

### Audio Engine [STABLE]
- [x] High-fidelity WAV/Audio decoding.
- [x] Mono-summing during import.
- [x] Synced playhead tracking with `requestAnimationFrame`.
- [x] Looping playback with interactive locators.

### DSP Engine (WASM) [STABLE]
- [x] Transient detection via Energy/Onset algorithm.
- [x] Memory-efficient data transfer (Direct HEAP access).
- [x] **Parameter Control**: Sensitivity, Noise Floor, and Refractory sliders are fully operational.
- [x] **True Zero Sensitivity**: Implemented normalized sensitivity scaling (0.0-1.0) with global flux peak tracking for a "True Zero" hit threshold.

### Visualizer & Interaction [WIP]
- [x] Multi-level waveform rendering (Minimap + Main Canvas).
- [x] Viewport zooming and scrolling.
- [ ] **Interaction Tools**: Pointer/Marquee, Eraser, and Lock tool logic in `SlicerCanvas.tsx` is pending completion.
- [ ] **UI Polish**: Loop locators need full-height lines, top-aligned triangles, and 'L/R' labels.

## 4. Current Work-in-Progress
**Transient Interaction & UI Polish**:
- Implementing tool logic in `SlicerCanvas.tsx` (Marquee, Eraser, Lock).
- Polishing Loop Locator UI components for better visual feedback.

## 5. Recent Evolution
The system was recently enhanced with a robust sensitivity control system. We transitioned to a normalized 0.0-1.0 UI scale and implemented "True Zero" thresholding in the C++ engine, which tracks the global maximum flux to guarantee zero hits at the lowest sensitivity setting. Previous issues with disconnected parameter sliders have been resolved.
