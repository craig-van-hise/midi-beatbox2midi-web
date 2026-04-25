
> **Project:** Beatbox2MIDI - Phase 1 Prototype
> **Role:** Expert Frontend Web Developer & UI/UX Engineer
> 
> **Context:** > I am providing you with four specific files to build this prototype:
> 1. `BeatboxEngine.wasm` (The compiled C++ DSP engine)
> 2. `BeatboxEngine.js` (The Emscripten JavaScript bindings)
> 3. `AudioProcessor.js` (The bridge class handling Web Audio and memory)
> 4. `Beatbox2MIDI.jpg` (The UI layout mockup)
> 
> **CRITICAL ARCHITECTURE NOTE:** The actual compiled WebAssembly binary (`BeatboxEngine.wasm`) cannot be attached to this prompt due to file type restrictions. I will manually drop it into the project's root directory after you generate the workspace. Please write all your initialization and fetch logic assuming `BeatboxEngine.wasm` will be sitting in the exact same directory as `BeatboxEngine.js`.
> 
> **Product Vision & Philosophy:**
> We are building a transcription assistant tool that maps unquantized, human audio (beatboxing) into an idealized, mathematical rhythmic grid. Our philosophy is "anti-human timing." We do not extract groove; we treat human micro-timing as noise to be filtered out, allowing users to transcribe complex, additive rhythms into legible musical quantization.
> 
> **Phase Constraints:** > We are currently strictly building Phase 1 (Mapping Mode). Do not write any DSP classification, automatic drum assignment, or MIDI sequencer logic. The MIDI sequencer pane at the bottom of the UI is strictly a static placeholder for Phase 2.
> 
> **Core Mechanics (The State Machine):**
> * **Mode 1: Mapping Mode (Default)**
>     * *Visuals:* The audio waveform is static. The grid and rulers warp and bend over the waveform to reflect human timing drift.
>     * *Playback:* Linear raw audio playback.
> * **Mode 2: Transcribe Mode (Toggled via the bright cyan "TRANSCRIBE MODE" toggle)**
>     * *Visuals:* The grid snaps to a rigid, equidistant "time unit box system." The audio waveform visually stretches/squishes to align to this rigid grid.
> 
> **User Override Mechanics (The Core Interactions):**
> * **Bar Line Manipulation:**
>     * *FLEXED Dragging (Standard Drag):* Warps the visual ruler grid to fit the static audio waveform. Adjusts the calculated Performed Tempo but leaves the time signature intact. The measure fits the audio.
>     * *FIXED Dragging (Modifier+Drag):* Snaps the bar line to a new mathematical grid point. The ruler's visual spacing stays intact, but the Time Signature of the affected measures updates to accommodate the shift.
> * **Transient Editing:** Using a dedicated Toolbar (Pointer, Pencil, Eraser) to manually add, move, or delete the "blue pin" onset slices on the canvas.
> 
> **UI Layout Requirements (Match the provided Mockup):**
> 1.  **Header:** Title Bar, Info Button, and a Settings Gear (opens a modal with an "Auto-Calculate on Import" toggle and a "Tempo Averaging Window" numeric input for BPM tolerance).
> 2.  **Inspector Bar:** >     * Sliders/Inputs for `Sensitivity (α)`, `Noise Floor (δ)`, and `Refractory Period (ms)`.
>     * A "16th" subdivision dropdown that visually updates the canvas grid.
>     * Buttons for "Calculate Onsets" and "Analyze Rhythm" (which trigger methods in `AudioProcessor.js`).
>     * The bright cyan **"TRANSCRIBE MODE"** toggle. *(CRITICAL NOTE: The attached mockup image incorrectly labels this button as "TEMPO FLATTEN". You must ignore the image text and render it as "TRANSCRIBE MODE").*
> 3.  **Waveform Overview:** A top minimap of the audio with a draggable bounding box that dictates the zoom/pan of the Main Canvas below.
> 4.  **Main Canvas (Synchronized Lanes):**
>     * *Tempo Lane:* A dual-line graph showing the "Performed Tempo" (jagged) and the user-defined/averaged "Target Tempo" (flat).
>     * *Time Signature Lane:* Displays the current meter blocks.
>     * *Bars & Beats Lane:* The interactive ruler for FLEXED/FIXED dragging.
>     * *Audio Lane:* The waveform with the interactive blue Transient Pin overlay.
> 5.  **Footer Placeholder:** A static section stating "Phase 2: Rhythm Transcription & Drum Sequencer. (Parked)."
> 6.  **Transport Bar:** Standard DAW playback controls (Play, Stop, Loop, Return-to-Zero) and an Export icon.
> 
> **Integration & Tech Stack Instructions:**
> * **Framework:** Build the UI using **React** with **TypeScript**.
> * **Styling & Theme (CRITICAL):** Use **Tailwind CSS** for all layout and styling. **You must strictly build a Light Theme UI.** Do NOT use any `dark:` Tailwind classes. Explicitly force a light background. Match the exact color palette of the provided image: use off-white and light-gray backgrounds (e.g., `bg-gray-50`, `bg-slate-100`), dark text for high contrast, and the bright cyan accent color for the "TRANSCRIBE MODE" button, active state elements, and the transient marker pins.
> * **Icons:** Use **Lucide React** (`lucide-react`) for all UI iconography (e.g., Settings gear, Info, Transport controls, Toolbar tools).
> * **Component Structure:** Break the UI down into modular, maintainable React components (e.g., `<Header />`, `<Inspector />`, `<WaveformOverview />`, `<MainCanvas />`, `<Transport />`).
> * **State Management:** Use standard React Hooks (`useState`, `useRef`, `useEffect`) to manage the synchronization between the minimap viewport, the main canvas zoom/pan, and the underlying audio engine state.
> * **Backend Integration:** Import and wrap the provided `AudioProcessor.js` class inside a React `useEffect` or custom hook to handle all audio ingestion and WASM bridging. Connect the UI sliders to the processor's setter methods, and use the data returned by `getTransients()` and `getMetricalGrid()` to dynamically draw the canvas lanes.