

> **Role:** Expert React, Web Audio, and HTML5 Canvas Developer
> 
> **Context:** We are building a "Transient Slicer" MVP (similar to Propellerheads ReCycle or Cubase Hitpoints). You have access to my local `BeatboxEngine.wasm` and `AudioProcessor.js` bridge class.
> 
> **The Goal:** Build a local React application that loads an audio file, runs it through our WASM engine, and displays a highly interactive HTML5 Canvas waveform. The UI must instantly update the slice markers as the user drags the detection sliders, without needing a "Calculate" button.
> 
> **Core Architecture & State Management:**
> We need a custom hook or state manager (e.g., `useHitManager`) to handle the "ReCycle Workflow". 
> * **`engineHits`:** Updated real-time via `processor.getTransients()` whenever the Sensitivity, Noise Floor, or Refractory sliders change.
> * **`hitStates`:** A persistent map storing user overrides (key: `sampleIndex`, value: `'locked' | 'muted' | 'user-added'`).
> * **Drawing Rules:**
>     * Untouched Engine Hit: Standard cyan line/marker.
>     * `'muted'` Hit: Faint, gray dashed line (user erased it, but can click to restore).
>     * `'locked'` Hit: Bold blue line with a lock icon. Survives even if slider changes cause it to drop from `engineHits`.
>     * `'user-added'` Hit: Bold blue line with a pencil icon.
> 
> **UI Layout Requirements (Card-Based, Tailwind CSS, Light Theme):**
> Global Background: `bg-slate-100`.
> 
> **1. Card 1: Controls (Top)**
> * Sliders for `Sensitivity` (0.0 to 5.0), `Noise Floor` (-0.1 to 0.1), and `Refractory Period` (0 to 100ms). *Crucial: Dragging these must trigger a debounced WASM recalculation and UI re-render instantly.*
> 
> **2. Card 2: Overview (Minimap)**
> * HTML5 Canvas drawing the full waveform with a draggable, semi-transparent bounding box to control the main canvas zoom.
> 
> **3. Card 3: Main Workspace (Synchronized)**
> * **Toolbar (Top Left):** Toggle buttons for tools: `Pointer` (select/lock), `Pencil` (add hit), `Eraser` (mute hit).
> * **Bars & Beats Ruler (Top):** A dynamic canvas ruler displaying measures/beats. This is mathematically driven by the *Fixed Tempo* and *Fixed Time Signature* in the transport bar.
> * **Waveform Canvas (Bottom):** Draws the zoomed audio waveform and the interactive Hit Point lines/triangles based on the drawing rules above.
> 
> **4. Transport Bar (Bottom Docked)**
> * **Inputs:** `Fixed Tempo` (numeric, e.g., 120 BPM) and `Fixed Time Signature` (e.g., 4/4). Changing these strictly updates the visual spacing of the Bars & Beats Ruler above the audio.
> * **Locators:** `Left Locator` and `Right Locator` inputs/visuals to define the Loop region.
> * **Playback Controls:** Play, Stop, Loop Toggle. Playback must utilize the Web Audio API to play the loaded buffer, respecting the Loop locators.
> 
> **Task:** > Generate the React component structure (`App.tsx`, `SlicerCanvas.tsx`, `Transport.tsx`, etc.) and the state management logic required to make this vertical slice functional. Connect the UI to the existing `AudioProcessor` methods (`setSensitivityMultiplier`, `calculateOnsets`, `getTransients`). Ensure the Canvas rendering logic handles the muted/locked states elegantly.