

> **Role:** Expert WASM Integration Specialist
> 
> **Context:** You have successfully built and verified the pure C++ `Beatbox2MIDI_Engine`. We are now on Sprint 3, Step 8. We need to compile this stateless black box into WebAssembly so our JavaScript Web Audio API frontend can instantiate it.
> 
> **The Task:** > 1. Write the Emscripten bindings using `embind` to expose the `Beatbox2MIDI_Engine` class and its methods to JavaScript.
> 2. Provide the exact Emscripten (`emcc`) build command to compile `Engine.cpp` into a `.wasm` module and its accompanying `.js` glue code.
> 
> **Strict Engineering Constraints:**
> * **Wrapper Block:** Add the `EMSCRIPTEN_BINDINGS` block directly into a new file named `WasmBindings.cpp` (or at the bottom of `Engine.cpp` wrapped in `#ifdef __EMSCRIPTEN__` to keep the core code portable for our future JUCE desktop port).
> * **Data Structures:** You must expose the custom structs `HitPoint` and `MetricalNode` so JavaScript can read the `sampleIndex`, `velocity`, `midiTick`, and `instantaneousBPM` properties via getter methods or value objects.
> * **Vector Returns:** Ensure that methods returning `std::vector<HitPoint>` and `std::vector<MetricalNode>` are correctly registered via `register_vector` so JavaScript can iterate over the returned arrays smoothly.
> * **Memory Access:** Ensure the `processAudio(const float* audioData, size_t numSamples)` function is bound in a way that allows JavaScript to pass a `Float32Array` from the Web Audio API into the WASM heap efficiently.
> 
> Please output the bindings code and the final `emcc` terminal command (including flags for optimization like `-O3`, `-s MODULARIZE=1`, and `-s EXPORT_NAME="BeatboxEngine"`).