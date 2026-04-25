
> **Role:** Expert Web Audio API & WASM Integration Engineer
> 
> **Context:** We have successfully compiled our C++ DSP engine into `BeatboxEngine.wasm` with `embind`. We are now on Sprint 3, Step 9. We need to write the JavaScript backend that bridges the browser's audio environment to our WASM module.
> 
> **The Task:** Write a clean, dependency-free ES6 class named `AudioProcessor.js`. This class must handle file decoding, WASM memory management, and data extraction. It should not contain any DOM manipulation or UI code; it strictly serves as the API for the front-end to use.
> 
> **Required Methods & Logic:**
> 1. **Initialization:** A method to load and instantiate the WASM module (`BeatboxEngine()`).
> 2. **Audio Decoding:** A method `loadAudioFile(fileOrBlob)` that takes a user's uploaded file, uses an `OfflineAudioContext` or standard `AudioContext` to `decodeAudioData`, and extracts a mono `Float32Array` (downmixing stereo if necessary).
> 3. **The WASM Handoff (Crucial):** A method `feedEngine()` that takes the decoded `Float32Array`. It must:
>    * Allocate memory on the WASM heap using `Module._malloc`.
>    * Copy the JS float array into the WASM heap using `Module.HEAPF32.set`.
>    * Call the WASM `processAudio(pointer, length)`.
>    * Safely free the memory using `Module._free` to prevent memory leaks.
> 4. **Wrapper Methods:** Write clean JS wrapper functions for `calculateOnsets()` and `extractTempoMap()`.
> 5. **Data Extraction:** Write methods like `getTransients()` that call the WASM vector return, iterate through the C++ vector using `.size()` and `.get(i)`, push the `sampleIndex` and `velocity` into a standard JavaScript Array of objects, and then explicitly `.delete()` the C++ vector to prevent Emscripten memory leaks.
> 
> Please output the complete `AudioProcessor.js` file, heavily commented to explain the memory management steps during the WASM handoff.
