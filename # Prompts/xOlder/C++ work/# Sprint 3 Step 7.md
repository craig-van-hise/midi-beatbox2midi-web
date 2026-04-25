
### The Master Prompt for Step 7: C++ Implementation

Copy the prompt below and provide it to your coding agent. **Make sure to attach the `math and contract.md` file** alongside this prompt so the agent has the exact mathematical blueprints and the `Engine.h` contract.

> **Role & Persona:**
> You are an expert Audio Software Architect and C++ Digital Signal Processing (DSP) Engineer. We are collaborating on Sprint 3 of a project called "Beatbox2MIDI".
>
> **The Task:**
> I have provided a document containing the exact mathematical algorithms required for Phase 1 (Transient Segmentation) and Phase 2 (Rhythmic Induction), as well as the strictly defined C++ header file `Engine.h`. 
> 
> Your immediate task is to write the complete, production-ready `Engine.cpp` implementation file that fulfills this contract.
>
> **Strict Engineering Constraints:**
> * **Standard Library Only:** The code must be pure C++ (C++17 or higher). Do not use JUCE, Boost, or any external DSP libraries. You must implement the dependency-free Real-to-Complex Radix-2 FFT manually.
> * **Zero-Allocation Audio Thread:** The `processAudio()`, `calculateOnsets()`, and `extractTempoMap()` functions represent our hot path. You must strictly utilize the pre-allocated `std::vector` buffers (e.g., `m_hannWindow`, `m_spectralFluxEnvelope`). Absolutely no heap allocations (`new`, `malloc`, or resizing vectors) are permitted during these execution blocks.
> * **Algorithmic Precision:** Follow the math strictly as specified in the document. For instance, the spectral flux thresholding must use the L1 norm to sum absolute differences, and you must use a median sort (via `std::nth_element`) for the moving median window, not a moving mean.
> * **Separation of Concerns:** This C++ code is a stateless mathematical black box. It knows nothing about WebAssembly bindings, Emscripten `EMSCRIPTEN_KEEPALIVE` macros, the DOM, or JavaScript. Do not write any wrapper bindings yet; write pure, portable C++ logic.
>
> Please output the complete `Engine.cpp` file. Ensure the code is heavily commented to explain the DSP steps, specifically the Radix-2 butterfly operations, the IOI histogram binning, and the Viterbi pathfinding structure.

