/**
 * AudioProcessor.js
 * 
 * Bridges the Web Audio API with the Beatbox2MIDI C++ WASM Engine.
 * Handles audio decoding, WASM memory management, and data extraction.
 */

export class AudioProcessor {
  constructor() {
    this.module = null;
    this.engine = null;
    this.sampleRate = 44100; // Default, will be updated during decoding
  }

  /**
   * 1. INITIALIZATION
   * Loads the WASM module and instantiates the BeatboxEngine class.
   * @param {Function} BeatboxEngineFactory - The factory function from BeatboxEngine.js
   */
  async init(BeatboxEngineFactory) {
    // Instantiate the WASM module
    this.module = await BeatboxEngineFactory();
    
    // Create the C++ engine instance (BeatboxEngine is the EXPORT_NAME from emcc)
    // We initialize it with the default sample rate, but will update if needed.
    this.engine = new this.module.BeatboxEngine(this.sampleRate);
    
    console.log("BeatboxEngine WASM initialized successfully.");
  }

  /**
   * 2. AUDIO DECODING
   * Takes a file/blob, decodes it to a mono Float32Array.
   * @param {File|Blob} fileOrBlob 
   * @returns {Promise<{audioBuffer: AudioBuffer, mono: Float32Array}>}
   */
  async loadAudioFile(fileOrBlob) {
    const arrayBuffer = await fileOrBlob.arrayBuffer();
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    // Always recreate the engine on new file load to ensure a clean buffer state
    if (this.engine) {
        this.engine.delete();
    }
    this.sampleRate = audioBuffer.sampleRate;
    this.engine = new this.module.BeatboxEngine(this.sampleRate);

    // Downmix to mono if necessary
    let mono;
    if (audioBuffer.numberOfChannels > 1) {
      const left = audioBuffer.getChannelData(0);
      const right = audioBuffer.getChannelData(1);
      mono = new Float32Array(left.length);
      for (let i = 0; i < left.length; i++) {
        mono[i] = (left[i] + right[i]) / 2;
      }
    } else {
      mono = audioBuffer.getChannelData(0);
    }

    return { audioBuffer, mono };
  }

  /**
   * 3. THE WASM HANDOFF (Memory Management)
   * Efficiently passes a JS Float32Array into the WASM heap.
   * @param {Float32Array} audioData 
   */
  feedEngine(audioData) {
    if (!this.engine || !this.module) throw new Error("Engine not initialized");

    const nSamples = audioData.length;
    
    // Debug: Check if we actually have signal
    let maxAmp = 0;
    for(let i=0; i<Math.min(nSamples, 1000); i++) {
        const a = Math.abs(audioData[i]);
        if (a > maxAmp) maxAmp = a;
    }
    console.log(`feedEngine: Feeding ${nSamples} samples. Max amp (first 1000): ${maxAmp.toFixed(4)}`);
    const bytesPerElement = 4; // Float32 is 4 bytes
    
    // Step A: Allocate memory on the WASM heap
    // This returns a pointer (byte offset) to the allocated block.
    const ptr = this.module._malloc(nSamples * bytesPerElement);
    
    try {
      // Step B: Copy the JS data into the WASM heap
      // We create a view starting at the pointer and set the data.
      // ptr / bytesPerElement gives the index in the HEAPF32 array.
      if (!this.module.HEAPF32) {
          throw new Error("WASM HEAPF32 not available. Ensure EXPORTED_RUNTIME_METHODS=['HEAPF32'] was used during compilation.");
      }
      this.module.HEAPF32.set(audioData, ptr / bytesPerElement);

      // Step C: Call the C++ processAudio method
      // The binding expects (uintptr_t ptr, size_t numSamples)
      this.engine.processAudio(ptr, nSamples);
      
    } finally {
      // Step D: ALWAYS free the memory to prevent leaks
      // This is wrapped in a try-finally to ensure cleanup even if processAudio fails.
      this.module._free(ptr);
    }
  }

  /**
   * 4. WRAPPER METHODS
   * Triggers the DSP calculations within the C++ engine.
   */
  setSensitivityMultiplier(value) {
    if (this.engine) this.engine.setSensitivityMultiplier(value);
  }

  setNoiseFloorOffset(value) {
    if (this.engine) this.engine.setNoiseFloorOffset(value);
  }

  setRefractoryPeriodMs(value) {
    if (this.engine) this.engine.setRefractoryPeriodMs(value);
  }

  calculateOnsets() {
    if (!this.engine) return;
    this.engine.calculateOnsets();
  }

  extractTempoMap() {
    if (!this.engine) return;
    this.engine.extractTempoMap();
  }

  /**
   * 5. DATA EXTRACTION
   * Converts C++ vectors to standard JS arrays and cleans up memory.
   */
  getTransients() {
    if (!this.engine) return [];

    // This returns an Emscripten-wrapped C++ vector
    const cppVector = this.engine.getTransients();
    const result = [];

    try {
      const size = cppVector.size();
      for (let i = 0; i < size; i++) {
        const hit = cppVector.get(i);
        // We copy the properties into a plain JS object
        result.push({
          sampleIndex: hit.sampleIndex,
          velocity: hit.velocity
        });
      }
    } finally {
      // CRITICAL: Explicitly delete the C++ vector to avoid WASM memory leaks
      cppVector.delete();
    }

    return result;
  }

  getMetricalGrid() {
    if (!this.engine) return [];

    const cppVector = this.engine.getMetricalGrid();
    const result = [];

    try {
      const size = cppVector.size();
      for (let i = 0; i < size; i++) {
        const node = cppVector.get(i);
        result.push({
          sampleIndex: node.sampleIndex,
          midiTick: node.midiTick,
          instantaneousBPM: node.instantaneousBPM
        });
      }
    } finally {
      cppVector.delete();
    }

    return result;
  }

  getGlobalEstimatedBPM() {
    return this.engine ? this.engine.getGlobalEstimatedBPM() : 120;
  }

  /**
   * Cleanup
   */
  dispose() {
    if (this.engine) {
      this.engine.delete();
      this.engine = null;
    }
  }
}
