

> **Role:** Expert WASM Integration Specialist
> 
> **Context:** Your `WasmBindings.cpp` file caused a fatal compiler error during the `emcc` build process. 
> 
> **The Error:** > `src-cpp/WasmBindings.cpp:35:10: error: no member named 'method' in 'emscripten::class_<Beatbox2MIDI_Engine>'`
> 
> **The Problem:** You hallucinated the `embind` syntax. Embind uses `.function()`, not `.method()`, to bind class member functions.
> 
> **The Task:**
> 1. Rewrite `WasmBindings.cpp` to correctly use `.function()` for all class methods instead of `.method()`.
> 2. **Execute the build yourself.** Do not just give me the command to run. Use your terminal capabilities to run the `emcc` build command and verify that it compiles without errors.
> 3. Verify and confirm to me only when `BeatboxEngine.js` and `BeatboxEngine.wasm` *actually exist* in the `src-cpp` directory.