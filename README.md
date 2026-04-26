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
