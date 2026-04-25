
> **Project:** Beatbox2MIDI - Phase 1 Prototype
> **Role:** Expert Frontend Web Developer & UI/UX Engineer
> 
> **Context:** > I am providing you with the compiled WebAssembly backend (`BeatboxEngine.js`/`.wasm`), the bridge class (`AudioProcessor.js`), and a UI mockup (`Beatbox2MIDI.jpg`). Your task is to build the front-end web application prototype. 
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
> * **Mode 2: Transcribe Mode (Toggled via "TEMPO FLATTEN" button)**
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
>     * The bright cyan "TEMPO FLATTEN" toggle.
> 3.  **Waveform Overview:** A top minimap of the audio with a draggable bounding box that dictates the zoom/pan of the Main Canvas below.
> 4.  **Main Canvas (Synchronized Lanes):**
>     * *Tempo Lane:* A dual-line graph showing the "Performed Tempo" (jagged) and the user-defined/averaged "Target Tempo" (flat).
>     * *Time Signature Lane:* Displays the current meter blocks.
>     * *Bars & Beats Lane:* The interactive ruler for FLEXED/FIXED dragging.
>     * *Audio Lane:* The waveform with the interactive blue Transient Pin overlay.
> 5.  **Footer Placeholder:** A static section stating "Phase 2: Rhythm Transcription & Drum Sequencer. (Parked)."
> 6.  **Transport Bar:** Standard DAW playback controls (Play, Stop, Loop, Return-to-Zero) and an Export icon.
> 
> **Integration Instructions:**
> Use the provided `AudioProcessor.js` class to handle all audio ingestion and WASM bridging. Connect the UI sliders to the processor's setter methods, and use the data returned by `getTransients()` and `getMetricalGrid()` to draw the canvas lanes.
> 
> Please generate the HTML, CSS, and modular JavaScript required to build this interface using standard web technologies (Vanilla JS, Canvas API, or a lightweight framework if highly optimal for the synchronized lanes).