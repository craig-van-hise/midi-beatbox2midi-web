### FILE: project_tree.txt


/Users/vv2024/Documents/Repos - vv2024/WebApps/midi/midi-beatbox2midi-web
├── # Prompts
|  ├── # 1.md
|  ├── # 2.md
|  ├── # 3.md
|  ├── # 4.md
|  ├── # 5.md
|  ├── # 6.md
|  ├── # 7.md
|  └── xOlder
|     ├── # Prompt for AI Studio v2.md
|     ├── # Prompt for AI Studio.md
|     ├── # demo HPD.md
|     ├── # fix.md
|     └── C++ work
|        ├── # Sprint 3 Step 7 testing.md
|        ├── # Sprint 3 Step 7.md
|        ├── # Sprint 3 Step 8.md
|        └── # Sprint 3 Step 9.md
├── ### Product Requirements Document (PRD)- Beatbox2MIDI.md
├── Foundational Docs
|  ├── Beat Tracking Algorithm Research Report.pdf
|  ├── Beatboxing Transient Detection DSP Report.pdf
|  ├── TODO Beatbox2MIDI.md
|  ├── UI mock ups
|  |  ├── Beatbox2MIDI.png
|  |  └── xOlder
|  |     ├── Gemini_Generated_Image_5xapml5xapml5xap.png
|  |     ├── Gemini_Generated_Image_68id3u68id3u68id.png
|  |     ├── Gemini_Generated_Image_927y2o927y2o927y.png
|  |     ├── Gemini_Generated_Image_fcm5uyfcm5uyfcm5.png
|  |     ├── Gemini_Generated_Image_k8s124k8s124k8s1.png
|  |     ├── Gemini_Generated_Image_vvyga9vvyga9vvyg.png
|  |     └── Gemini_Generated_Image_w6t31pw6t31pw6t3.png
|  └── math and contract.md
├── PROJECT_CONTEXT_BUNDLE.md
├── PROJECT_STATE.md
├── PROJECT_TREE.txt
├── README.md
├── diagnostic report WASM params.md
├── diganostic report parameter updates.md
├── index.html
├── llms.txt
├── package-lock.json
├── package.json
├── postcss.config.js
├── public
|  ├── BeatboxEngine.js
|  └── BeatboxEngine.wasm
├── src
|  ├── App.tsx
|  ├── components
|  |  ├── Controls.tsx
|  |  ├── RulerCanvas.tsx
|  |  ├── SlicerCanvas.tsx
|  |  ├── Toolbar.tsx
|  |  ├── Transport.tsx
|  |  └── WaveformMinimap.tsx
|  ├── hooks
|  |  ├── useAudioPlayback.ts
|  |  └── useHitManager.ts
|  ├── index.css
|  ├── lib
|  |  └── AudioProcessor.js
|  └── main.tsx
├── src-cpp
|  ├── BeatboxEngine.js
|  ├── BeatboxEngine.wasm
|  ├── Engine.cpp
|  ├── Engine.h
|  ├── Engine.o
|  ├── EngineTests
|  ├── EngineTests.cpp
|  └── WasmBindings.cpp
├── tailwind.config.js
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts

directory: 415 file: 2838

ignored: directory (33)


[2K[1G

### FILE: PROJECT_STATE.md

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


### FILE: README.md

# Beatbox2MIDI - Transient Slicer

A modern web application for slicing beatbox recordings into MIDI transients using a C++ DSP engine compiled to WebAssembly.

## Project Structure
```
.
├── index.html
├── package.json
├── public
│   ├── BeatboxEngine.js
│   └── BeatboxEngine.wasm
├── src
│   ├── App.tsx
│   ├── components
│   │   ├── Controls.tsx
│   │   ├── RulerCanvas.tsx
│   │   ├── SlicerCanvas.tsx
│   │   ├── Toolbar.tsx
│   │   ├── Transport.tsx
│   │   └── WaveformMinimap.tsx
│   ├── hooks
│   │   ├── useAudioPlayback.ts
│   │   └── useHitManager.ts
│   ├── index.css
│   ├── lib
│   │   └── AudioProcessor.js
│   └── main.tsx
└── src-cpp
    ├── Engine.cpp
    ├── Engine.h
    ├── WasmBindings.cpp
    └── BeatboxEngine.js (Build Artifact)
```

## Quick Start
1.  **Install dependencies**: `npm install`
2.  **Run dev server**: `npm run dev`
3.  **Build WASM (Optional)**: See `src-cpp` instructions.

## Tech Stack
- **Framework**: React 18 (Vite)
- **DSP**: C++ (WASM)
- **Styling**: Tailwind CSS + Glassmorphism
- **Audio**: Web Audio API


