

> **Role:** Expert C++ DSP Engineer
> 
> **Context:** You just wrote `Engine.cpp` based on the `Engine.h` contract. My architect correctly pointed out that we cannot move forward without strict verification.
> 
> **The Task:** Write a standalone, dependency-free C++ test suite named `EngineTests.cpp`. Do not use external frameworks like Google Test or Catch2; use standard `<cassert>`, `<iostream>`, and `<cmath>` in a standard `main()` function so we can compile and run it instantly from the command line.
> 
> **Required Test Cases:**
> 
> 1. **Test 1: The Synthetic Metronome (Phase 1 Verification)**
>    * Generate a synthetic `std::vector<float>` representing exactly 2 seconds of audio at 44100Hz.
>    * Fill it with absolute digital silence (0.0f), except for a sharp impulse (e.g., a few samples of 1.0f) exactly every 0.5 seconds (representing a perfect 120 BPM click track).
>    * Run `processAudio()` and `calculateOnsets()`.
>    * **Assert:** `getTransients()` must return exactly 4 hits, and their `sampleIndex` values must match the mathematical locations of our synthetic impulses (within the margin of error of our hop size $H=256$).
> 
> 2. **Test 2: Perfect Rhythm Induction (Phase 2 Verification)**
>    * Using the state from Test 1, run `extractTempoMap()`.
>    * **Assert:** `getGlobalEstimatedBPM()` must return exactly `120.0f` (allow for a tiny floating-point epsilon).
> 
> 3. **Test 3: The User Anchor Override**
>    * Inject a user anchor using `addUserAnchor()` targeting a specific synthetic hit.
>    * Re-run `extractTempoMap()`.
>    * **Assert:** Verify that the `getMetricalGrid()` perfectly aligns the `midiTick` of that specific `sampleIndex` to the exact value requested by the anchor.
> 
> 4. **Test 4: The Hot-Path Memory Stress Test**
>    * Run `processAudio()` in a tight loop 1,000 times using the same buffer. 
>    * *Note:* While standard C++ can't easily assert zero allocations without a custom allocator, ensuring this loop runs without segfaults or massive slowdowns validates that our vectors are properly pre-allocated.
> 
> Output the entire `EngineTests.cpp` file, and provide the simple `g++` or `clang++` terminal command required to compile `Engine.cpp` and `EngineTests.cpp` together so I can run the verification immediately.
