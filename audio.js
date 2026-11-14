// Procedural Web Audio API sound engine for the Royal No. 10 mechanical typewriter.
// Uses normalized pink/white noise buffers and a warm master compressor so keystrokes,
// platen ratchets, and cotton paper swishes sound punchy, tactile, and clip-free.

export class TypewriterAudio {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.compressor = null;
    this.outputGain = null;
    this.soundEnabled = true;
    this.rainEnabled = false;
    this.noiseBuffer = null;
    this.crispBuffer = null;
    this.rainNodes = null;
  }

  ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 1.35;

      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-14, this.ctx.currentTime);
      this.compressor.knee.setValueAtTime(12, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(4, this.ctx.currentTime);
      this.compressor.attack.setValueAtTime(0.002, this.ctx.currentTime);
      this.compressor.release.setValueAtTime(0.08, this.ctx.currentTime);

      this.outputGain = this.ctx.createGain();
      this.outputGain.gain.value = 1.65;

      this.masterGain.connect(this.compressor);
      this.compressor.connect(this.outputGain);
      this.outputGain.connect(this.ctx.destination);

      this.noiseBuffer = this._createNoiseBuffer(2.0, 0.28);
      this.crispBuffer = this._createNoiseBuffer(2.0, 0.85);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  _createNoiseBuffer(seconds, brightness = 0.3) {
    const length = Math.floor(this.ctx.sampleRate * seconds);
    const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0;
    let peak = 0;
    const mix = 1 - brightness;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = lastOut * mix + white * brightness;
      data[i] = lastOut;
      const a = Math.abs(lastOut);
      if (a > peak) peak = a;
    }
    const norm = peak > 0 ? 0.96 / peak : 1;
    for (let i = 0; i < length; i++) data[i] *= norm;
    return buffer;
  }

  setSoundEnabled(enabled) {
    this.soundEnabled = enabled;
  }

  playKeyStrike(pitchOffset = 0) {
    if (!this.soundEnabled) return;
    this.ensureContext();
    const now = this.ctx.currentTime + 0.004;
    const jitter = (Math.random() - 0.5) * 0.12 + pitchOffset * 0.04;

    this._noiseBurst(now, 0.016, 2800 * (1 + jitter), 1.8, 0.58);

    const impactTime = now + 0.015;
    this._noiseBurst(impactTime, 0.028, 1650 * (1 + jitter), 1.3, 0.85);
    this._bodyThump(impactTime, 178 * (1 + jitter * 0.6), 62, 0.06, 0.62);
    this._tonePing(impactTime, 920 * (1 + jitter * 0.3), 0.065, 0.095);
  }

  playKeyRelease() {
    if (!this.soundEnabled) return;
    this.ensureContext();
    const now = this.ctx.currentTime + 0.003;
    this._noiseBurst(now, 0.014, 3400 + Math.random() * 500, 2.2, 0.18);
  }

  playSpace() {
    if (!this.soundEnabled) return;
    this.ensureContext();
    const now = this.ctx.currentTime + 0.004;
    const jitter = (Math.random() - 0.5) * 0.08;
    this._noiseBurst(now, 0.026, 980 * (1 + jitter), 1.2, 0.55);
    this._bodyThump(now, 124 * (1 + jitter), 46, 0.08, 0.7);
  }

  playBackspace() {
    if (!this.soundEnabled) return;
    this.ensureContext();
    const now = this.ctx.currentTime + 0.004;
    this._noiseBurst(now, 0.02, 2000, 2.0, 0.48);
    this._bodyThump(now, 220, 92, 0.05, 0.42);
  }

  playBell() {
    if (!this.soundEnabled) return;
    this.ensureContext();
    const now = this.ctx.currentTime + 0.004;
    const partials = [
      {freq: 1860, gain: 0.42, dur: 1.4},
      {freq: 2795, gain: 0.22, dur: 0.95},
      {freq: 3740, gain: 0.11, dur: 0.6},
    ];
    for (const p of partials) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(p.freq, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(p.gain, now + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + p.dur);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + p.dur + 0.02);
    }
  }

  playCarriageReturn() {
    if (!this.soundEnabled) return;
    this.ensureContext();
    const now = this.ctx.currentTime + 0.004;
    this._noiseBurst(now, 0.026, 2100, 1.7, 0.58);

    const steps = 9;
    for (let i = 0; i < steps; i++) {
      const t = now + 0.038 + i * 0.024;
      this._noiseBurst(t, 0.013, 1450 + i * 90, 2.4, 0.34);
    }
    const stopTime = now + 0.038 + steps * 0.024 + 0.02;
    this._bodyThump(stopTime, 128, 42, 0.095, 0.78);
    this._noiseBurst(stopTime, 0.032, 820, 1.2, 0.5);
  }

  // Pulling typed sheet upward out of platen & lifting it through the air
  playPaperPullOut() {
    if (!this.soundEnabled) return;
    this.ensureContext();
    const now = this.ctx.currentTime + 0.005;

    // Rapid accelerating platen-release ticks
    let t = now;
    for (let i = 0; i < 9; i++) {
      const step = 0.024 - i * 0.0016;
      this._noiseBurst(t, 0.013, 2100 + i * 140, 2.6, 0.38 + i * 0.02);
      this._bodyThump(t, 320 + i * 18, 130, 0.018, 0.24);
      t += step;
    }

    // Full crisp cotton bond slide swish & flutter
    this._paperSweep(now + 0.015, 0.29, 1050, 3100, 0.95, 0.85);
    this._paperSweep(now + 0.07, 0.24, 3600, 1900, 1.3, 0.52);
  }

  // Laying finished sheet neatly onto the left stack
  playPaperPlace() {
    if (!this.soundEnabled) return;
    this.ensureContext();
    const now = this.ctx.currentTime + 0.004;
    this._paperSweep(now, 0.14, 1750, 760, 0.9, 0.64);
    this._bodyThump(now + 0.022, 122, 46, 0.07, 0.45);
    this._noiseBurst(now + 0.025, 0.048, 1200, 1.2, 0.42);
  }

  // Lifting fresh blank cotton sheet from right supply pile & slotting behind platen
  playPaperPick() {
    if (!this.soundEnabled) return;
    this.ensureContext();
    const now = this.ctx.currentTime + 0.004;
    this._paperSweep(now, 0.21, 1450, 3300, 1.1, 0.62);
    this._noiseBurst(now + 0.11, 0.04, 2500, 1.7, 0.34);
    const slotAt = now + 0.30;
    this._paperSweep(slotAt, 0.09, 1850, 950, 1.1, 0.48);
    this._bodyThump(slotAt + 0.01, 172, 68, 0.048, 0.38);
  }

  // Turning platen knob to feed fresh sheet around cylinder with crisp pawl ratchet clicks
  playPaperFeed() {
    if (!this.soundEnabled) return;
    this.ensureContext();
    const now = this.ctx.currentTime + 0.004;

    // Gentle curved cotton paper curl sound
    this._paperSweep(now + 0.02, 0.44, 780, 1850, 0.9, 0.68);

    // 11 tactile knurled platen ratchet clicks
    let t = now;
    const count = 11;
    for (let i = 0; i < count; i++) {
      const ease = i / count;
      const gap = 0.028 + ease * ease * 0.024;
      const amp = 0.5 + (i === count - 1 ? 0.16 : 0);
      this._noiseBurst(t, 0.013, 2550 + (i % 3) * 190, 2.6, amp);
      this._bodyThump(t, 385, 145, 0.02, 0.28);
      t += gap;
    }
  }

  toggleRain() {
    this.ensureContext();
    this.rainEnabled = !this.rainEnabled;
    if (this.rainEnabled) this._startRain();
    else this._stopRain();
    return this.rainEnabled;
  }

  _startRain() {
    if (this.rainNodes) return;
    const now = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;

    const lowpass = this.ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 1100;

    const highpass = this.ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 180;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.36, now + 1.0);

    src.connect(highpass);
    highpass.connect(lowpass);
    lowpass.connect(gain);
    gain.connect(this.masterGain);
    src.start(now);
    this.rainNodes = {src, gain};
  }

  _stopRain() {
    if (!this.rainNodes) return;
    const now = this.ctx.currentTime;
    const {src, gain} = this.rainNodes;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(Math.max(gain.gain.value, 0.0001), now);
    gain.gain.linearRampToValueAtTime(0.0001, now + 0.6);
    setTimeout(() => {
      try {
        src.stop();
        src.disconnect();
      } catch {
        // ignore
      }
    }, 650);
    this.rainNodes = null;
  }

  _noiseBurst(time, duration, freq, q, peakGain) {
    const src = this.ctx.createBufferSource();
    src.buffer = this.crispBuffer || this.noiseBuffer;
    src.playbackRate.value = 0.88 + Math.random() * 0.28;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(freq, time);
    filter.Q.setValueAtTime(q, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(peakGain, time + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    src.start(time, Math.random() * 1.1, duration + 0.015);
  }

  _paperSweep(time, duration, startFreq, endFreq, q, peakGain) {
    const src = this.ctx.createBufferSource();
    src.buffer = this.crispBuffer || this.noiseBuffer;
    src.playbackRate.value = 0.92 + Math.random() * 0.18;

    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.setValueAtTime(380, time);

    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(startFreq, time);
    bp.frequency.exponentialRampToValueAtTime(Math.max(120, endFreq), time + duration);
    bp.Q.setValueAtTime(q, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(peakGain, time + duration * 0.14);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    src.connect(hp);
    hp.connect(bp);
    bp.connect(gain);
    gain.connect(this.masterGain);
    src.start(time, Math.random() * 0.9, duration + 0.02);
  }

  _bodyThump(time, startFreq, endFreq, duration, peakGain) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(startFreq, time);
    osc.frequency.exponentialRampToValueAtTime(endFreq, time + duration);

    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(peakGain, time + 0.0025);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(time);
    osc.stop(time + duration + 0.015);
  }

  _tonePing(time, freq, duration, peakGain) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(peakGain, time + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(time);
    osc.stop(time + duration + 0.015);
  }
}
