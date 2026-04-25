#ifdef __EMSCRIPTEN__
#include <emscripten/bind.h>
#include <emscripten/val.h>
#include "Engine.h"

using namespace emscripten;

// ---------------------------------------------------------
// WASM BINDINGS (Emscripten Embind)
// ---------------------------------------------------------

EMSCRIPTEN_BINDINGS(beatbox2midi) {
    
    // --- Data Structures ---
    
    value_object<HitPoint>("HitPoint")
        .field("sampleIndex", &HitPoint::sampleIndex)
        .field("velocity", &HitPoint::velocity);

    value_object<MetricalNode>("MetricalNode")
        .field("sampleIndex", &MetricalNode::sampleIndex)
        .field("midiTick", &MetricalNode::midiTick)
        .field("instantaneousBPM", &MetricalNode::instantaneousBPM);

    // --- Vectors (Arrays in JS) ---
    
    register_vector<HitPoint>("HitPointVector");
    register_vector<MetricalNode>("MetricalNodeVector");

    // --- The Engine Class ---
    
    class_<Beatbox2MIDI_Engine>("BeatboxEngine")
        .constructor<float>()
        
        // Phase 1 Params
        .function("setFftWindowSize", &Beatbox2MIDI_Engine::setFftWindowSize)
        .function("setHopSize", &Beatbox2MIDI_Engine::setHopSize)
        .function("setLogCompressionGamma", &Beatbox2MIDI_Engine::setLogCompressionGamma)
        .function("setMedianWindowFrames", &Beatbox2MIDI_Engine::setMedianWindowFrames)
        .function("setSensitivityMultiplier", &Beatbox2MIDI_Engine::setSensitivityMultiplier)
        .function("setNoiseFloorOffset", &Beatbox2MIDI_Engine::setNoiseFloorOffset)
        .function("setRefractoryPeriodMs", &Beatbox2MIDI_Engine::setRefractoryPeriodMs)
        
        // Phase 2 Params
        .function("setAgentLearningRate", &Beatbox2MIDI_Engine::setAgentLearningRate)
        .function("setMaxAgents", &Beatbox2MIDI_Engine::setMaxAgents)
        
        // User Anchors
        .function("clearUserAnchors", &Beatbox2MIDI_Engine::clearUserAnchors)
        .function("addUserAnchor", &Beatbox2MIDI_Engine::addUserAnchor)
        .function("addTimeSignature", &Beatbox2MIDI_Engine::addTimeSignature)
        .function("addTuplet", &Beatbox2MIDI_Engine::addTuplet)
        
        // Core Pipeline
        .function("processAudio", optional_override([](Beatbox2MIDI_Engine& self, uintptr_t ptr, size_t numSamples) {
            self.processAudio(reinterpret_cast<const float*>(ptr), numSamples);
        }))
        
        .function("calculateOnsets", &Beatbox2MIDI_Engine::calculateOnsets)
        .function("extractTempoMap", &Beatbox2MIDI_Engine::extractTempoMap)
        
        // Data Retrieval
        .function("getTransients", &Beatbox2MIDI_Engine::getTransients)
        .function("getMetricalGrid", &Beatbox2MIDI_Engine::getMetricalGrid)
        .function("getGlobalEstimatedBPM", &Beatbox2MIDI_Engine::getGlobalEstimatedBPM);
}
#endif
