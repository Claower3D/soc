// Web Audio API Synthesizer for Meditation Chimes and Ambient Frequencies
class SpiritualSoundEngine {
  private ctx: AudioContext | null = null;
  private activeGenerators: Map<string, { osc?: OscillatorNode; gain: GainNode; noiseSource?: AudioBufferSourceNode }> = new Map();
  private isMuted: boolean = false;

  private getContext(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Play an authentic Tibetan singing bowl / zen bell chime
  playZenBowl(frequency: number = 432, duration: number = 3.5) {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      // Fundamental + 2 harmonics for rich bell timbre
      const harmonics = [
        { freq: frequency, gain: 0.5, decay: duration },
        { freq: frequency * 2.02, gain: 0.25, decay: duration * 0.75 },
        { freq: frequency * 3.01, gain: 0.12, decay: duration * 0.5 },
        { freq: frequency * 0.5, gain: 0.2, decay: duration * 1.1 }
      ];

      harmonics.forEach(h => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(h.freq, now);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(h.gain, now + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + h.decay);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + h.decay + 0.1);
      });
    } catch {
      // AudioContext might be blocked until user gesture
    }
  }

  // Play a soft high crystal bell for affirmations
  playCrystalChime() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const freqs = [880, 1174, 1318]; // A5, D6, E6 triad

      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);

        gain.gain.setValueAtTime(0.0001, now + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.2, now + idx * 0.07 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.07 + 1.8);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 1.9);
      });
    } catch {
      // Ignored
    }
  }

  // Continuous sound layers (432Hz, 528Hz, rain, ocean)
  toggleContinuousTone(id: string, frequency: number, volume: number = 0.2, type: OscillatorType = 'sine'): boolean {
    const ctx = this.getContext();
    if (this.activeGenerators.has(id)) {
      this.stopContinuous(id);
      return false;
    }

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(volume, now + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      this.activeGenerators.set(id, { osc, gain });
      return true;
    } catch {
      return false;
    }
  }

  // Generate pink/white filtered noise for rain / ocean
  toggleNoise(id: string, filterType: BiquadFilterType, cutoff: number, volume: number = 0.15): boolean {
    const ctx = this.getContext();
    if (this.activeGenerators.has(id)) {
      this.stopContinuous(id);
      return false;
    }

    try {
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      // Generate brown/pink noise
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = data[i];
        data[i] *= 3.5; // Gain adjustment
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = buffer;
      noiseSource.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = filterType;
      filter.frequency.value = cutoff;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 1.2);

      noiseSource.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noiseSource.start();
      this.activeGenerators.set(id, { noiseSource, gain });
      return true;
    } catch {
      return false;
    }
  }

  setVolume(id: string, volume: number) {
    const gen = this.activeGenerators.get(id);
    if (gen && this.ctx) {
      gen.gain.gain.setTargetAtTime(volume, this.ctx.currentTime, 0.1);
    }
  }

  stopContinuous(id: string) {
    const gen = this.activeGenerators.get(id);
    if (gen && this.ctx) {
      try {
        const now = this.ctx.currentTime;
        gen.gain.gain.linearRampToValueAtTime(0.0001, now + 0.8);
        setTimeout(() => {
          if (gen.osc) {
            gen.osc.stop();
            gen.osc.disconnect();
          }
          if (gen.noiseSource) {
            gen.noiseSource.stop();
            gen.noiseSource.disconnect();
          }
          this.activeGenerators.delete(id);
        }, 850);
      } catch {
        this.activeGenerators.delete(id);
      }
    }
  }

  stopAll() {
    for (const key of Array.from(this.activeGenerators.keys())) {
      this.stopContinuous(key);
    }
  }

  isPlaying(id: string): boolean {
    return this.activeGenerators.has(id);
  }
}

export const spiritualAudio = new SpiritualSoundEngine();
