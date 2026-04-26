### FILE: project_tree.txt


/Users/vv2024/Documents/Repos - vv2024/WebApps/midi/midi-beatbox2midi-web
├── # Prompts
|  ├── # 13.md
|  ├── # 14.md
|  └── xOlder
|     ├── # 1.md
|     ├── # 10.md
|     ├── # 11.md
|     ├── # 12.md
|     ├── # 2.md
|     ├── # 3.md
|     ├── # 4.md
|     ├── # 5.md
|     ├── # 6.md
|     ├── # 7.md
|     ├── # 8.md
|     ├── # 9.md
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
├── Reports
|  ├── 2026-04-26_Slicer_Interaction_Refinement_Report.md
|  ├── brief 2.md
|  ├── brief.md
|  ├── diagnostic report WASM params.md
|  └── diganostic report parameter updates.md
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

directory: 417 file: 2853

ignored: directory (34)


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


### FILE: README.md

# Beatbox2MIDI - Transient Slicer

[![GitHub Repo](https://img.shields.io/badge/GitHub-Repository-blue?logo=github)](https://github.com/craig-van-hise/midi-beatbox2midi-web)

A modern web application for slicing beatbox recordings into MIDI transients using a C++ DSP engine compiled to WebAssembly.

## Features
- **WASM DSP**: Real-time transient detection using a high-performance C++ engine.
- **Precision Slicing**: Advanced interaction model with Marquee selection, Lock/Mute tools, and "In Situ" auditioning.
- **Onboarding**: Drag & Drop landing zone and direct microphone recording pipeline.
- **Transport**: Full-featured transport with tempo, time signature, metronome, and loop locators.

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


