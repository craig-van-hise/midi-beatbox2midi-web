
### Part 1: Algorithmic Synthesis & Architecture

Our DSP engine operates in two strictly separated, sequential phases. This separation ensures we do not blow out the WASM memory heap and maintains $O(N)$ or $O(N \log N)$ bounds.

**Phase 1: Transient Segmentation (The Onset Engine)**
* **Transform:** We will use a dependency-free Real-to-Complex Radix-2 FFT. [cite_start]We apply a Hann window [cite: 71] [cite_start]with $N=1024$ and a hop size $H=256$ to balance sub-bass kick frequencies with the temporal sharpness needed for hi-hats[cite: 59, 65].
* [cite_start]**Spectral Flux:** We process the linear magnitude spectrum with a logarithmic compression factor of $\gamma=10.0$[cite: 269]. [cite_start]We extract the positive energy flux using Half-Wave Rectification (HWR)[cite: 106]. [cite_start]Critically, we sum these differences using the **L1 norm** (absolute differences), which mathematically prevents narrow resonant whistling from overpowering the broadband fricative noise of vocal hi-hats[cite: 120, 122, 124].
* [cite_start]**Dynamic Thresholding:** We extract the local noise floor using a moving median window of $W=17$ frames[cite: 269]. [cite_start]A median sort (via `std::nth_element`) is strictly required over a moving mean to prevent massive plosive peaks from self-masking the threshold[cite: 162, 167]. The threshold $T(m)$ at frame $m$ is calculated as:
    $$T(m)=(\alpha\cdot median_{j\in W}SF(m+j))+\delta$$
    [cite_start]We apply a default multiplier $\alpha=1.5$ and a noise floor offset $\delta=0.02$[cite: 185, 269].
* [cite_start]**Refractory Lockout:** To prevent double-triggering on jagged vocal snares, we enforce a strict 40 ms lockout[cite: 270]. [cite_start]Validated peaks are mapped back to the sample domain via $i=m\cdot H+\frac{N}{2}$[cite: 210].

**Phase 2: Rhythmic Induction (The Tracking Engine)**
* [cite_start]**Global Tempo:** We calculate all-order Inter-Onset Intervals (IOI) up to a maximum perceptual limit of 2.5 seconds ($S_{max}=2.5\times F_{s}$) to bypass the "missing pulse" syncopation problem[cite: 409, 415]. [cite_start]We bin these intervals, apply a Gaussian smoothing kernel, and use a Two-Way Mismatch (TWM) error function to find the fundamental tactus (BPM)[cite: 439, 454].
* [cite_start]**Multi-Agent Tracking:** We initialize an agent pool (capped at $K=100$) [cite: 569] based on the TWM hypotheses. [cite_start]Each agent projects a phase $\phi_n$ and period $P_n$[cite: 489, 490]. [cite_start]When an outer-window match occurs, the agent branches to handle intentional human drift vs. syncopated rest[cite: 516, 519].
* [cite_start]**Pathfinding & Anchors:** Surviving agents are scored using a log-ratio squared-error penalty $F(\Delta t, P_n) = -[log_2(\frac{t_i - \phi_n}{P_n})]^2$[cite: 547]. [cite_start]User-defined anchors trigger a dynamic programming / Viterbi bidirectional pass to rigidly lock the tempo map to user intent[cite: 578, 607].

---

### Part 2: The WASM C++ Contract (`Engine.h`)

This is the precise API our JavaScript Web Audio frontend will call. It uses strictly primitive data types and flat arrays to facilitate easy Emscripten binding (`emscripten::val` or direct memory views). It maintains state internally without allocating during the `process` call.

```cpp
#pragma once
#include <vector>
#include <cstdint>

// ---------------------------------------------------------
// DATA STRUCTURES (Serialized to JS via Emscripten)
// ---------------------------------------------------------

struct HitPoint {
    uint32_t sampleIndex; 
    float velocity;       // Normalized 0.0 - 1.0 (Log-scaled magnitude)
};

struct MetricalNode {
    uint32_t sampleIndex;
    uint32_t midiTick;    // Based on 480 PPQ standard
    float instantaneousBPM; 
};

// ---------------------------------------------------------
// THE DSP ENGINE BLACK BOX
// ---------------------------------------------------------
class Beatbox2MIDI_Engine {
public:
    Beatbox2MIDI_Engine(float sampleRate);
    ~Beatbox2MIDI_Engine() = default;

    // --- PHASE 1: ONSET DETECTION PARAMETERS ---
    // Exposed to JS UI Inspector panel
    void setFftWindowSize(int size = 1024);
    void setHopSize(int size = 256);
    void setLogCompressionGamma(float gamma = 10.0f);
    void setMedianWindowFrames(int frames = 17);
    void setSensitivityMultiplier(float alpha = 1.5f);
    void setNoiseFloorOffset(float delta = 0.02f);
    void setRefractoryPeriodMs(float ms = 40.0f);

    // --- PHASE 2: RHYTHM TRACKING PARAMETERS ---
    void setAgentLearningRate(float rate = 0.20f); 
    void setMaxAgents(int maxAgents = 100);

    // --- USER OVERRIDES (The "Anchor" & Fractional Logic) ---
    // Clears all existing anchors
    void clearUserAnchors();
    // Forces the algorithm to map a specific sample index to a specific MIDI tick
    void addUserAnchor(uint32_t sampleIndex, uint32_t targetMidiTick);
    // Overrides grid interpolation for Time Signatures (e.g., 7/8)
    void addTimeSignature(uint32_t startMidiTick, int numerator, int denominator);
    // Defines a localized tuplet ratio (e.g., 7 in the space of 4)
    void addTuplet(uint32_t startMidiTick, uint32_t endMidiTick, int notesToFit, int spaceOccupied);

    // --- THE CORE PROCESSING PIPELINE ---
    // 1. JS passes a pointer to the Float32Array containing the audio chunk.
    // Memory is strictly managed; no allocations happen inside this function.
    void processAudio(const float* audioData, size_t numSamples);

    // 2. JS calls this to trigger the Phase 1 math.
    void calculateOnsets();

    // 3. JS calls this to trigger the Phase 2 IOI & Agent tracking.
    void extractTempoMap();

    // --- DATA RETRIEVAL ---
    // Returns the raw transient hits for rendering the UI overlay over the waveform
    std::vector<HitPoint> getTransients() const;
    
    // Returns the finalized tempo map for the bottom Piano Roll pane and MIDI export
    std::vector<MetricalNode> getMetricalGrid() const;
    
    // Diagnostic: Returns the global underlying BPM derived from the IOI histogram
    float getGlobalEstimatedBPM() const;

private:
    float m_sampleRate;
    std::vector<float> m_audioBuffer;
    
    // Pre-allocated DSP buffers to strictly avoid heap allocation during processing
    std::vector<float> m_hannWindow;
    std::vector<float> m_spectralFluxEnvelope;
    std::vector<float> m_thresholdEnvelope;
    
    // Internal State Machine Data
    std::vector<HitPoint> m_detectedHits;
    std::vector<MetricalNode> m_tempoMap;
    
    // Private methods for core math
    void computeFFT(std::vector<float>& real, std::vector<float>& imag);
    void executeViterbiPathfinding();
};
```
