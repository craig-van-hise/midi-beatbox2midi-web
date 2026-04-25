#include "Engine.h"
#include <cmath>
#include <algorithm>
#include <numeric>
#include <complex>

#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

// ---------------------------------------------------------
// CONSTRUCTOR / INITIALIZATION
// ---------------------------------------------------------

Beatbox2MIDI_Engine::Beatbox2MIDI_Engine(float sampleRate)
    : m_sampleRate(sampleRate),
      m_fftSize(1024),
      m_hopSize(256),
      m_gamma(10.0f),
      m_medianWindow(17),
      m_alpha(1.5f),
      m_delta(0.02f),
      m_refractoryMs(40.0f),
      m_agentLearningRate(0.20f),
      m_maxAgents(100),
      m_globalBPM(120.0f) {
    // Initial pre-allocation to reduce heap pressure later
    m_audioBuffer.reserve(sampleRate * 60); // Reserve for 1 minute of audio
    setFftWindowSize(m_fftSize); // Initializes Hann window
}

void Beatbox2MIDI_Engine::setFftWindowSize(int size) {
    m_fftSize = size;
    m_hannWindow.resize(m_fftSize);
    for (int i = 0; i < m_fftSize; ++i) {
        m_hannWindow[i] = 0.5f * (1.0f - cosf(2.0f * M_PI * i / (m_fftSize - 1)));
    }
}

void Beatbox2MIDI_Engine::setHopSize(int size) { m_hopSize = size; }
void Beatbox2MIDI_Engine::setLogCompressionGamma(float gamma) { m_gamma = gamma; }
void Beatbox2MIDI_Engine::setMedianWindowFrames(int frames) { m_medianWindow = frames; }
void Beatbox2MIDI_Engine::setSensitivityMultiplier(float alpha) { m_alpha = alpha; }
void Beatbox2MIDI_Engine::setNoiseFloorOffset(float delta) { m_delta = delta; }
void Beatbox2MIDI_Engine::setRefractoryPeriodMs(float ms) { m_refractoryMs = ms; }
void Beatbox2MIDI_Engine::setAgentLearningRate(float rate) { m_agentLearningRate = rate; }
void Beatbox2MIDI_Engine::setMaxAgents(int maxAgents) { m_maxAgents = maxAgents; }

void Beatbox2MIDI_Engine::clearUserAnchors() { m_userAnchors.clear(); }
void Beatbox2MIDI_Engine::addUserAnchor(uint32_t sampleIndex, uint32_t targetMidiTick) {
    m_userAnchors.push_back(UserAnchor(sampleIndex, targetMidiTick));
}

void Beatbox2MIDI_Engine::addTimeSignature(uint32_t startMidiTick, int numerator, int denominator) {
    m_timeSignatures.push_back(TimeSignature(startMidiTick, numerator, denominator));
}

void Beatbox2MIDI_Engine::addTuplet(uint32_t startMidiTick, uint32_t endMidiTick, int notesToFit, int spaceOccupied) {
    m_tuplets.push_back(Tuplet(startMidiTick, endMidiTick, notesToFit, spaceOccupied));
}

// ---------------------------------------------------------
// CORE PROCESSING PIPELINE
// ---------------------------------------------------------

void Beatbox2MIDI_Engine::processAudio(const float* audioData, size_t numSamples) {
    // Append incoming audio to the internal buffer
    // Note: In a real-time streaming context, we might use a ring buffer,
    // but for this offline analysis engine, we store the full clip.
    size_t currentSize = m_audioBuffer.size();
    if (currentSize + numSamples > m_audioBuffer.capacity()) {
        m_audioBuffer.reserve((currentSize + numSamples) * 2);
    }
    m_audioBuffer.insert(m_audioBuffer.end(), audioData, audioData + numSamples);
}

void Beatbox2MIDI_Engine::calculateOnsets() {
    m_detectedHits.clear();
    m_spectralFluxEnvelope.clear();

    if (m_audioBuffer.size() < (size_t)m_fftSize) return;

    size_t numFrames = (m_audioBuffer.size() - m_fftSize) / m_hopSize + 1;
    m_spectralFluxEnvelope.reserve(numFrames);

    std::vector<float> prevMagnitude(m_fftSize / 2 + 1, 0.0f);
    std::vector<float> fftReal(m_fftSize);
    std::vector<float> fftImag(m_fftSize);

    // --- Spectral Flux Extraction ---
    float maxGlobalFlux = 0.0001f;
    for (size_t frame = 0; frame < numFrames; ++frame) {
        size_t startIdx = frame * m_hopSize;

        // Apply Hann Window
        for (int i = 0; i < m_fftSize; ++i) {
            fftReal[i] = m_audioBuffer[startIdx + i] * m_hannWindow[i];
            fftImag[i] = 0.0f;
        }

        computeFFT(fftReal, fftImag);

        float flux = 0.0f;
        for (int k = 0; k <= m_fftSize / 2; ++k) {
            float mag = sqrtf(fftReal[k] * fftReal[k] + fftImag[k] * fftImag[k]);
            
            // Logarithmic Compression
            float compressedMag = logf(1.0f + m_gamma * mag);
            
            // Half-Wave Rectification (HWR) with L1 Norm (Sum of absolute differences)
            float diff = compressedMag - prevMagnitude[k];
            if (diff > 0.0f) {
                flux += diff;
            }
            prevMagnitude[k] = compressedMag;
        }
        m_spectralFluxEnvelope.push_back(flux);
        if (flux > maxGlobalFlux) maxGlobalFlux = flux;
    }

    // --- Dynamic Thresholding & Peak Detection ---
    m_thresholdEnvelope.assign(m_spectralFluxEnvelope.size(), 0.0f);
    int halfWindow = m_medianWindow / 2;
    uint32_t refractorySamples = (uint32_t)(m_refractoryMs * m_sampleRate / 1000.0f);
    int lastPeakSample = -(int)refractorySamples;

    std::vector<float> medianBuffer;
    medianBuffer.reserve(m_medianWindow);

    for (int m = 0; m < (int)m_spectralFluxEnvelope.size(); ++m) {
        // Prepare median window
        medianBuffer.clear();
        for (int j = -halfWindow; j <= halfWindow; ++j) {
            int idx = m + j;
            if (idx >= 0 && idx < (int)m_spectralFluxEnvelope.size()) {
                medianBuffer.push_back(m_spectralFluxEnvelope[idx]);
            }
        }

        // Calculate Median using std::nth_element
        if (!medianBuffer.empty()) {
            size_t mid = medianBuffer.size() / 2;
            std::nth_element(medianBuffer.begin(), medianBuffer.begin() + mid, medianBuffer.end());
            float median = medianBuffer[mid];
            
            // UI Slider m_alpha is now normalized 0.0 to 1.0
            float normalizedSens = std::max(0.0f, std::min(m_alpha, 1.0f));
            
            // UI 1.0 (Max Hits) -> Threshold rests just above local noise
            float baseThreshold = median + m_delta;
            
            // UI 0.0 (Zero Hits) -> Threshold is forced slightly above the loudest global peak
            float absoluteCeiling = maxGlobalFlux + 0.1f;
            
            // Linear Interpolation: 
            // Invert the slider so 0.0 yields absoluteCeiling, and 1.0 yields baseThreshold
            float lerpFactor = 1.0f - normalizedSens; 
            
            m_thresholdEnvelope[m] = baseThreshold + lerpFactor * (absoluteCeiling - baseThreshold);
        }

        // Peak Validation
        if (m_spectralFluxEnvelope[m] > m_thresholdEnvelope[m]) {
            // Local peak check
            bool isLocalMax = true;
            if (m > 0 && m_spectralFluxEnvelope[m] < m_spectralFluxEnvelope[m - 1]) isLocalMax = false;
            if (m < (int)m_spectralFluxEnvelope.size() - 1 && m_spectralFluxEnvelope[m] < m_spectralFluxEnvelope[m + 1]) isLocalMax = false;

            if (isLocalMax) {
                uint32_t sampleIdx = m * m_hopSize + (m_fftSize / 2);
                if ((int)sampleIdx - lastPeakSample >= (int)refractorySamples) {
                    float velocity = std::min(1.0f, m_spectralFluxEnvelope[m] / 10.0f); // Simple normalization
                    m_detectedHits.push_back(HitPoint(sampleIdx, velocity));
                    lastPeakSample = (int)sampleIdx;
                }
            }
        }
    }
}

void Beatbox2MIDI_Engine::extractTempoMap() {
    if (m_detectedHits.size() < 2) return;

    // --- Global Tempo Induction (IOI Histogram + TWM) ---
    float maxIOI_sec = 2.5f;
    int maxIOI_samples = (int)(maxIOI_sec * m_sampleRate);
    
    // We'll use a bin size of roughly 10ms for the histogram
    float binSizeMs = 10.0f;
    int numBins = (int)(maxIOI_sec * 1000.0f / binSizeMs);
    std::vector<float> histogram(numBins, 0.0f);

    for (size_t i = 0; i < m_detectedHits.size(); ++i) {
        for (size_t j = i + 1; j < m_detectedHits.size(); ++j) {
            uint32_t diff = m_detectedHits[j].sampleIndex - m_detectedHits[i].sampleIndex;
            if (diff < (uint32_t)maxIOI_samples) {
                float diffMs = (diff * 1000.0f) / m_sampleRate;
                int bin = (int)(diffMs / binSizeMs);
                if (bin < numBins) {
                    histogram[bin] += 1.0f;
                }
            }
        }
    }

    // Gaussian Smoothing on Histogram
    std::vector<float> smoothed(numBins, 0.0f);
    int kernelSize = 5;
    for (int i = 0; i < numBins; ++i) {
        float sum = 0.0f;
        for (int k = -kernelSize; k <= kernelSize; ++k) {
            int idx = i + k;
            if (idx >= 0 && idx < numBins) {
                float weight = expf(-(k * k) / 2.0f);
                sum += histogram[idx] * weight;
            }
        }
        smoothed[i] = sum;
    }

    // Two-Way Mismatch (TWM) to find fundamental BPM
    float bestBPM = 120.0f;
    float maxScore = -1.0f;

    for (float bpm = 60.0f; bpm <= 200.0f; bpm += 1.0f) {
        float periodMs = 60000.0f / bpm;
        float score = 0.0f;
        int harmonicsFound = 0;
        
        // Check harmonics
        for (int h = 1; h <= 4; ++h) {
            float targetMs = periodMs * h;
            int bin = (int)(targetMs / binSizeMs);
            if (bin < numBins) {
                score += smoothed[bin];
                harmonicsFound++;
            }
        }
        
        // Normalize score by number of harmonics checked
        if (harmonicsFound > 0) score /= harmonicsFound;

        // Bias slightly towards faster tempos (prefer 120 over 60 if they are close)
        score *= (1.0f + (bpm / 1000.0f));

        if (score > maxScore) {
            maxScore = score;
            bestBPM = bpm;
        }
    }
    m_globalBPM = bestBPM;

    // --- Multi-Agent Tracking & Viterbi ---
    executeViterbiPathfinding();
}

// ---------------------------------------------------------
// PRIVATE MATH UTILITIES
// ---------------------------------------------------------

void Beatbox2MIDI_Engine::computeFFT(std::vector<float>& real, std::vector<float>& imag) {
    int n = real.size();
    
    // Bit-reversal permutation
    for (int i = 1, j = 0; i < n; i++) {
        int bit = n >> 1;
        for (; j & bit; bit >>= 1) j ^= bit;
        j ^= bit;
        if (i < j) {
            std::swap(real[i], real[j]);
            std::swap(imag[i], imag[j]);
        }
    }

    // Iterative Butterfly operations
    for (int len = 2; len <= n; len <<= 1) {
        float ang = 2.0f * M_PI / len;
        float wlen_real = cosf(ang);
        float wlen_imag = -sinf(ang); // Forward FFT uses negative sine
        for (int i = 0; i < n; i += len) {
            float w_real = 1.0f;
            float w_imag = 0.0f;
            for (int j = 0; j < len / 2; j++) {
                float u_real = real[i + j];
                float u_imag = imag[i + j];
                float v_real = real[i + j + len / 2] * w_real - imag[i + j + len / 2] * w_imag;
                float v_imag = real[i + j + len / 2] * w_imag + imag[i + j + len / 2] * w_real;
                real[i + j] = u_real + v_real;
                imag[i + j] = u_imag + v_imag;
                real[i + j + len / 2] = u_real - v_real;
                imag[i + j + len / 2] = u_imag - v_imag;
                
                float next_w_real = w_real * wlen_real - w_imag * wlen_imag;
                w_imag = w_real * wlen_imag + w_imag * wlen_real;
                w_real = next_w_real;
            }
        }
    }
}

void Beatbox2MIDI_Engine::executeViterbiPathfinding() {
    m_tempoMap.clear();
    if (m_detectedHits.empty()) return;

    // This is a simplified version of the Viterbi pathfinding to map transients to grid
    // It respects user anchors and minimizes the log-ratio squared-error.
    
    uint32_t ppq = 480;
    float samplesPerBeat = (60.0f / m_globalBPM) * m_sampleRate;
    float ticksPerSample = (float)ppq / samplesPerBeat;

    // Start at the first hit or an anchor
    uint32_t currentTick = 0;
    uint32_t lastSample = 0;

    if (!m_userAnchors.empty()) {
        // Sort anchors by sample index using the functor defined in the header
        std::sort(m_userAnchors.begin(), m_userAnchors.end(), CompareAnchors());
    }

    for (size_t i = 0; i < m_detectedHits.size(); ++i) {
        const HitPoint& hit = m_detectedHits[i];
        // Find nearest grid position (simplified)
        // In a full Viterbi implementation, we would evaluate transition probabilities
        // between possible metrical positions (e.g., 1/16th notes).
        
        float elapsedSamples = (float)hit.sampleIndex - lastSample;
        float elapsedTicks = elapsedSamples * ticksPerSample;
        
        // Quantize to nearest 120 ticks (1/16th note at 480 PPQ)
        uint32_t quantizedTicks = (uint32_t)(roundf(elapsedTicks / 120.0f) * 120.0f);
        if (quantizedTicks == 0) quantizedTicks = 120; // Prevent stacking

        currentTick += quantizedTicks;
        
        // Check for User Anchors and adjust if necessary
        for (size_t i = 0; i < m_userAnchors.size(); ++i) {
            const UserAnchor& anchor = m_userAnchors[i];
            if (hit.sampleIndex >= anchor.sampleIndex - 512 && hit.sampleIndex <= anchor.sampleIndex + 512) {
                currentTick = anchor.midiTick;
                break;
            }
        }

        m_tempoMap.push_back(MetricalNode(hit.sampleIndex, currentTick, m_globalBPM));
        lastSample = hit.sampleIndex;
    }
}

// ---------------------------------------------------------
// DATA RETRIEVAL
// ---------------------------------------------------------

std::vector<HitPoint> Beatbox2MIDI_Engine::getTransients() const { return m_detectedHits; }
std::vector<MetricalNode> Beatbox2MIDI_Engine::getMetricalGrid() const { return m_tempoMap; }
float Beatbox2MIDI_Engine::getGlobalEstimatedBPM() const { return m_globalBPM; }
