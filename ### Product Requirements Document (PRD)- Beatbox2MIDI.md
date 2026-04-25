

### Product Requirements Document (PRD): Beatbox2MIDI

#### 1. Product Vision & Scope
* **Core Objective:** A transcription assistant tool designed to map unquantized, human audio (primarily beatboxing) into an idealized, mathematical rhythmic grid.
* **Philosophy:** "Anti-human timing." The app is not designed to extract groove; it treats human micro-timing as noise to be filtered out, allowing users to transcribe complex, additive rhythms into legible musical notation and MIDI.
* **Development Phasing:** The project is strictly divided. **Phase 1 (Current)** handles audio ingestion, onset detection, and rhythmic mapping. **Phase 2 (Parked)** handles machine learning classification and MIDI sequencing.


## Revised PRD Section: 2. The Workspace (UI / Canvas Layout)

This section defines the literal visual architecture of the application. The interface is styled as a single-window DAW (Digital Audio Workstation) with distinct horizontal sections.

**2.1 Header & Global Navigation**
* **Title Bar:** Left-aligned application branding ("VV | Beatbox2MIDI").
* **Utility Icons (Right-aligned):** * *Info Button (i):* Triggers a tooltip or modal explaining the app's current mode.
    * *Settings Button (Gear):* Opens a modal for global preferences, including the "Auto-Calculate on Import" toggle and the "Tempo Averaging Window" BPM threshold.

**2.2 The Inspector & Control Bar**
This pane contains the primary parameters and triggers for the DSP engine.
* **Onset Parameters:** Sliders with numeric input boxes for `Sensitivity (α)`, `Noise Floor (δ)`, and `Refractory Period (ms)`.
* **Subdivision Dropdown:** A selector (e.g., "16th", "Triplet") that dictates the visual grid and biases the algorithm's pulse detection.
* **Action Triggers:** "Calculate Onsets" and "Analyze Rhythm" buttons.
* **Mode Toggle:** The primary "TEMPO FLATTEN" (or "Transcribe Mode") toggle switch, colored brightly to indicate the transition from Mapping Mode to Transcribe Mode.

**2.3 Waveform Overview (Minimap)**
* A dedicated, narrow horizontal lane at the top of the canvas displaying the entire loaded audio file.
* Features a draggable and resizable bounding box (viewport selector) that controls the zoom level and scroll position of the Main Canvas directly below it.

**2.4 The Main Canvas (The Mapping Zone)**
The core workspace, displaying synchronized horizontal lanes based on the zoomed region selected in the Overview.
* **Tempo Lane:** A dual-line graph showing the *Performed Tempo* (jagged, calculated line) and the *Target Tempo* (flat, average, or manually edited line).
* **Time Signature Lane:** Displays distinct blocks/markers (e.g., 4/4, 7/8) that update based on bar line manipulation.
* **Bars and Beats Lane (The Ruler):** Displays the primary barlines and the 2nd-level subdividers. This is the primary interaction zone for `FLEXED` and `FIXED` dragging.
* **Audio Lane:** Displays the zoomed-in, static audio waveform. 
* **Transient Overlay:** Superimposed on the audio lane; displays interactive vertical lines (e.g., blue pins) marking the detected or user-defined onset slices.
* **Transient Toolbar:** A floating or docked toolset (Pointer, Pencil, Eraser) for manually adding, moving, or deleting transient slices.

**2.5 MIDI/Sequencer Lane (Phase 2 Placeholder)**
* A distinct horizontal section at the bottom of the canvas. 
* During Phase 1 development, this remains a static visual placeholder containing text indicating: *"Phase 2: Rhythm Transcription & Drum Sequencer. (Parked)."*

**2.6 Footer & Transport**
* **Transport Controls:** Centered at the bottom, featuring standard DAW playback buttons: Play, Stop, Loop Toggle, and Return-to-Zero (Skip to Beginning).
* **Export Menu:** An icon in the bottom right corner to trigger the final MIDI file export (and eventual notation export).


#### 3. The DSP "Best Guess" Engine (Phase 1 WASM Backend)
* **Stage A: Transient Slicing:** Utilizes Spectral Flux and Dynamic Thresholding to find hits (controlled via UI Inspector parameters: Sensitivity, Noise Floor, Refractory Period).
* **Stage B: Rhythmic Induction:** Utilizes IOI (Inter-Onset Intervals) and multi-agent tracking to generate initial guesses for downbeats, the basic pulse (biased by the UI's subdivision dropdown), and the fluctuating Performed Tempo.

#### 4. User Override Mechanics (The Core Interactions)
* **Bar Line Manipulation:**
    * **FLEXED Dragging (Standard):** Warps the visual ruler to fit the static audio waveform. Adjusts the Performed Tempo map without altering the time signature. *The measure fits the audio.*
    * **FIXED Dragging (Modifier+Drag):** Snaps a bar line to a new grid point. The ruler's visual equidistant spacing stays intact, but the *Time Signature* mathematically updates to reflect the new boundaries.
* **Subdivider Manipulation:** Dragging 2nd-level markers to define asymmetrical/additive groupings (e.g., grouping 7/8 as 3+2+2).

#### 5. The "Transcribe Mode" Toggle
* **Function:** A primary UI state-switch that transitions the workspace from Phase 1 (Mapping) into Phase 2 (Transcription/Sequencing).
* **Visual Shift:** Forces the flexible ruler to become rigidly equidistant (a "time unit box system"). The raw audio visually squishes and stretches to align with this mathematical ideal. Playback switches from linear audio to triggered, quantized slices.

---

#### 6. [PARKED] Phase 2: Transcribe, Classify & Sequence 
*This section defines the future state of the application. Engineering for these features is strictly out of scope for the current sprint.*

* **Algorithmic Drum Classification:** Upon entering Transcribe Mode, the app will run a secondary DSP pass (e.g., Principal Component Analysis, MFCC extraction, or a lightweight ML model) to separate the sliced transient buffers into specific drum classes (Kick, Snare, Hi-Hat, etc.).
* **The Sequencer Lanes:** A piano-roll style interface below the audio canvas featuring dedicated lanes for the assigned drum sounds.
* **Classification Overrides:** The user can select one or multiple transcribed hits and drag them vertically to different lanes to correct the algorithm's "best guesses."
* **Velocity Extraction:** The engine will extract amplitude data from the sliced audio to automatically assign MIDI velocity values to the transcribed notes.
* **Export Subsystem:** Final generation of standardized, rigidly quantized MIDI files, built with future expansion in mind for exporting standard Drum Staff notation.

***

