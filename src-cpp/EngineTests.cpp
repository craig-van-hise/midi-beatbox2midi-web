#include "Engine.h"
#include <iostream>
#include <vector>
#include <cassert>
#include <cmath>
#include <iomanip>

// Simple helper for floating point comparison
bool approxEqual(float a, float b, float epsilon = 0.01f) {
    return std::abs(a - b) < epsilon;
}

void runTest1_SyntheticMetronome() {
    std::cout << "[Test 1] The Synthetic Metronome (Phase 1)... " << std::flush;
    
    float sampleRate = 44100.0f;
    Beatbox2MIDI_Engine engine(sampleRate);
    
    // 2 seconds of audio
    size_t numSamples = (size_t)(2.0f * sampleRate);
    std::vector<float> audio(numSamples, 0.0f);
    
    // Impulses every 0.5 seconds starting at 0.1s
    std::vector<uint32_t> expectedIndices;
    for (float t = 0.1f; t < 1.9f; t += 0.5f) {
        uint32_t idx = (uint32_t)(t * sampleRate);
        for (int k = 0; k < 10; ++k) {
            if (idx + k < numSamples) audio[idx + k] = 1.0f;
        }
        expectedIndices.push_back(idx);
    }
    
    engine.processAudio(audio.data(), audio.size());
    engine.calculateOnsets();
    
    auto hits = engine.getTransients();
    
    // Expected 4 hits
    if (hits.size() != 4) {
        std::cerr << "\nFAILED: Expected 4 hits, got " << hits.size() << std::endl;
        assert(hits.size() == 4);
    }
    
    // Check indices (within hop size H=256 margin)
    uint32_t hopSize = 256;
    for (size_t i = 0; i < hits.size(); ++i) {
        bool match = false;
        std::cout << "\n  Hit " << i << ": index=" << hits[i].sampleIndex << " (t=" << (float)hits[i].sampleIndex / sampleRate << "s)" << std::flush;
        for (auto expected : expectedIndices) {
            // Compare hit.sampleIndex (center of frame) against expected impulse sample
            if (std::abs((int)hits[i].sampleIndex - (int)expected) < (int)hopSize * 3) {
                match = true;
                break;
            }
        }
        if (!match) {
            std::cerr << "\nFAILED: Hit " << i << " at index " << hits[i].sampleIndex 
                      << " did not match any expected impulse location." << std::endl;
            assert(match);
        }
    }
    std::cout << "\n  ";
    
    std::cout << "PASSED" << std::endl;
}

void runTest2_PerfectRhythmInduction() {
    std::cout << "[Test 2] Perfect Rhythm Induction (Phase 2)... " << std::flush;
    
    float sampleRate = 44100.0f;
    Beatbox2MIDI_Engine engine(sampleRate);
    
    size_t numSamples = (size_t)(4.0f * sampleRate); // Use 4s for better histogram
    std::vector<float> audio(numSamples, 0.0f);
    
    for (float t = 0.1f; t < 3.9f; t += 0.5f) { // 120 BPM
        uint32_t idx = (uint32_t)(t * sampleRate);
        for (int k = 0; k < 10; ++k) audio[idx + k] = 1.0f;
    }
    
    engine.processAudio(audio.data(), audio.size());
    engine.calculateOnsets();
    engine.extractTempoMap();
    
    float bpm = engine.getGlobalEstimatedBPM();
    if (!approxEqual(bpm, 120.0f, 2.0f)) { // Allow 2 BPM margin for binning
        std::cerr << "\nFAILED: Expected ~120 BPM, got " << bpm << std::endl;
        assert(approxEqual(bpm, 120.0f, 2.0f));
    }
    
    std::cout << "PASSED (" << std::fixed << std::setprecision(1) << bpm << " BPM)" << std::endl;
}

void runTest3_UserAnchorOverride() {
    std::cout << "[Test 3] User Anchor Override... " << std::flush;
    
    float sampleRate = 44100.0f;
    Beatbox2MIDI_Engine engine(sampleRate);
    
    // Simple 120 BPM sequence
    size_t numSamples = (size_t)(2.0f * sampleRate);
    std::vector<float> audio(numSamples, 0.0f);
    for (float t = 0.1f; t < 1.9f; t += 0.5f) {
        uint32_t idx = (uint32_t)(t * sampleRate);
        for (int k = 0; k < 10; ++k) audio[idx + k] = 1.0f;
    }
    
    engine.processAudio(audio.data(), audio.size());
    engine.calculateOnsets();
    
    auto hits = engine.getTransients();
    assert(!hits.empty());
    
    // Set an anchor for the second hit (index 1) to be exactly tick 1920 (1 bar in 4/4)
    uint32_t targetTick = 1920;
    engine.addUserAnchor(hits[1].sampleIndex, targetTick);
    
    engine.extractTempoMap();
    auto grid = engine.getMetricalGrid();
    
    bool found = false;
    for (const auto& node : grid) {
        if (node.sampleIndex == hits[1].sampleIndex) {
            if (node.midiTick != targetTick) {
                std::cerr << "\nFAILED: Anchor mismatch. Expected " << targetTick 
                          << " ticks, got " << node.midiTick << std::endl;
                assert(node.midiTick == targetTick);
            }
            found = true;
            break;
        }
    }
    assert(found);
    
    std::cout << "PASSED" << std::endl;
}

void runTest4_MemoryStressTest() {
    std::cout << "[Test 4] Hot-Path Memory Stress Test... " << std::flush;
    
    float sampleRate = 44100.0f;
    Beatbox2MIDI_Engine engine(sampleRate);
    
    std::vector<float> audio(1024, 0.5f);
    
    // Tight loop of 1,000 calls
    for (int i = 0; i < 1000; ++i) {
        engine.processAudio(audio.data(), audio.size());
    }
    
    // Ensure we can still calculate
    engine.calculateOnsets();
    
    std::cout << "PASSED (1,000 iterations)" << std::endl;
}

int main() {
    std::cout << "=== Beatbox2MIDI Engine Verification Suite ===" << std::endl;
    
    try {
        runTest1_SyntheticMetronome();
        runTest2_PerfectRhythmInduction();
        runTest3_UserAnchorOverride();
        runTest4_MemoryStressTest();
        
        std::cout << "==============================================" << std::endl;
        std::cout << "ALL TESTS PASSED SUCCESSFULLY!" << std::endl;
    } catch (const std::exception& e) {
        std::cerr << "\nTerminated with exception: " << e.what() << std::endl;
        return 1;
    }
    
    return 0;
}
