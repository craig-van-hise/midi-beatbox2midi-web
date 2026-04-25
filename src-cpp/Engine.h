#pragma once
#include <vector>
#include <cstdint>

// ---------------------------------------------------------
// DATA STRUCTURES (Serialized to JS via Emscripten)
// ---------------------------------------------------------

struct HitPoint {
    uint32_t sampleIndex; 
    float velocity;       // Normalized 0.0 - 1.0 (Log-scaled magnitude)
    HitPoint() : sampleIndex(0), velocity(0.0f) {}
    HitPoint(uint32_t s, float v) : sampleIndex(s), velocity(v) {}
};

struct MetricalNode {
    uint32_t sampleIndex;
    uint32_t midiTick;    // Based on 480 PPQ standard
    float instantaneousBPM; 
    MetricalNode() : sampleIndex(0), midiTick(0), instantaneousBPM(0.0f) {}
    MetricalNode(uint32_t s, uint32_t t, float bpm) : sampleIndex(s), midiTick(t), instantaneousBPM(bpm) {}
};

// ---------------------------------------------------------
// THE DSP ENGINE BLACK BOX
// ---------------------------------------------------------
class Beatbox2MIDI_Engine {
public:
    Beatbox2MIDI_Engine(float sampleRate);
    ~Beatbox2MIDI_Engine() {}

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

    // --- Hyperparameters ---
    int m_fftSize;
    int m_hopSize;
    float m_gamma;
    int m_medianWindow;
    float m_alpha;
    float m_delta;
    float m_refractoryMs;
    float m_agentLearningRate;
    int m_maxAgents;

    // --- User Anchors & Structures ---
    struct UserAnchor {
        uint32_t sampleIndex;
        uint32_t midiTick;
        UserAnchor() : sampleIndex(0), midiTick(0) {}
        UserAnchor(uint32_t s, uint32_t t) : sampleIndex(s), midiTick(t) {}
    };
    std::vector<UserAnchor> m_userAnchors;

    struct TimeSignature {
        uint32_t startMidiTick;
        int numerator;
        int denominator;
        TimeSignature() : startMidiTick(0), numerator(4), denominator(4) {}
        TimeSignature(uint32_t s, int n, int d) : startMidiTick(s), numerator(n), denominator(d) {}
    };
    std::vector<TimeSignature> m_timeSignatures;

    struct Tuplet {
        uint32_t startMidiTick;
        uint32_t endMidiTick;
        int notesToFit;
        int spaceOccupied;
        Tuplet() : startMidiTick(0), endMidiTick(0), notesToFit(0), spaceOccupied(0) {}
        Tuplet(uint32_t s, uint32_t e, int n, int sp) : startMidiTick(s), endMidiTick(e), notesToFit(n), spaceOccupied(sp) {}
    };
    std::vector<Tuplet> m_tuplets;

    float m_globalBPM;

    // Functor for sorting anchors (C++98 compatible)
    struct CompareAnchors {
        bool operator()(const UserAnchor& a, const UserAnchor& b) const {
            return a.sampleIndex < b.sampleIndex;
        }
    };
};
