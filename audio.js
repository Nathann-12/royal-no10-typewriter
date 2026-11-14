// Real CC0 studio mechanical typewriter & cotton paper Web Audio sample engine
import {SFX_B64} from './sfx_bank.js';

function b64ToArrayBuffer(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) {
    bytes[i] = bin.charCodeAt(i);
  }
  return bytes.buffer;
}

const KEY_POOL = ['key_01', 'key_02', 'key_03', 'key_04', 'key_05', 'key_06'];

export class TypewriterAudio {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.compressor = null;
    this.outputGain = null;
    this.soundEnabled = true;
    this.rainEnabled = false;
    this.buffers = {};
    this._preloadPromise = null;
    this._keyIndex = 0;
    this._rainNodes = null;
    this._rainBuffer = null;
  }

  ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.soundEnabled ? 1.0 : 0.0;

      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.value = -10;
      this.compressor.knee.value = 12;
      this.compressor.ratio.value = 2.6;
      this.compressor.attack.value = 0.002;
      this.compressor.release.value = 0.06;

      this.outputGain = this.ctx.createGain();
      this.outputGain.gain.value = 1.25;

      this.masterGain.connect(this.compressor);
      this.compressor.connect(this.outputGain);
      this.outputGain.connect(this.ctx.destination);

      this._preloadSamples();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  _preloadSamples() {
    if (this._preloadPromise || !this.ctx) {
      return this._preloadPromise || Promise.resolve();
    }
    const entries = Object.entries(SFX_B64);
    this._preloadPromise = Promise.all(
      entries.map(async ([name, b64]) => {
        try {
          const decoded = await this.ctx.decodeAudioData(b64ToArrayBuffer(b64));
          this.buffers[name] = decoded;
        } catch (err) {
          console.warn(`Failed to decode sample "${name}":`, err);
        }
      })
    );
    return this._preloadPromise;
  }

  setSoundEnabled(enabled) {
    this.soundEnabled = Boolean(enabled);
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(
        this.soundEnabled ? 1.0 : 0.0,
        this.ctx.currentTime,
        0.02
      );
    }
  }

  _triggerBuffer(buf, {gain = 0.9, rate = 1.0, pan = 0} = {}) {
    if (!this.ctx || !this.soundEnabled || !buf) return;
    const now = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.playbackRate.setValueAtTime(rate, now);

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, now);

    if (pan !== 0 && typeof this.ctx.createStereoPanner === 'function') {
      const panner = this.ctx.createStereoPanner();
      panner.pan.setValueAtTime(Math.max(-1, Math.min(1, pan)), now);
      src.connect(g);
      g.connect(panner);
      panner.connect(this.masterGain);
    } else {
      src.connect(g);
      g.connect(this.masterGain);
    }
    src.start(now);
  }

  _playSample(name, opts = {}) {
    if (!this.soundEnabled) return;
    const requestedAt = performance.now();
    this.ensureContext();
    const buf = this.buffers[name];
    if (buf) {
      this._triggerBuffer(buf, opts);
      return;
    }
    this._preloadSamples().then(() => {
      if (performance.now() - requestedAt > 250) return;
      const loaded = this.buffers[name];
      if (loaded) {
        this._triggerBuffer(loaded, opts);
      }
    });
  }

  playKeyStrike(pitchOffset = 0) {
    // Advance round-robin with subtle skip so rapid typing spans all real typebars naturally
    const step = 1 + (Math.random() > 0.65 ? 1 : 0);
    this._keyIndex = (this._keyIndex + step) % KEY_POOL.length;
    const clip = KEY_POOL[this._keyIndex];
    const rate = 0.96 + pitchOffset * 0.015 + Math.random() * 0.07;
    const gain = 0.88 + Math.random() * 0.14;
    const pan = Math.max(-0.22, Math.min(0.22, pitchOffset * 0.06));
    this._playSample(clip, {gain, rate, pan});
  }

  playKeyRelease() {
    this._playSample('release_01', {
      gain: 0.28 + Math.random() * 0.08,
      rate: 0.94 + Math.random() * 0.12,
      pan: (Math.random() - 0.5) * 0.08,
    });
  }

  playSpace() {
    this._playSample('space_01', {
      gain: 0.96,
      rate: 0.97 + Math.random() * 0.05,
      pan: 0,
    });
  }

  playBackspace() {
    this._playSample('backspace_01', {
      gain: 0.88,
      rate: 0.97 + Math.random() * 0.06,
      pan: 0.08,
    });
  }

  playBell() {
    this._playSample('bell_01', {
      gain: 0.92,
      rate: 1.0,
      pan: -0.14,
    });
  }

  playCarriageReturn() {
    this._playSample('carriage_01', {
      gain: 0.98,
      rate: 0.98 + Math.random() * 0.04,
      pan: 0.04,
    });
  }

  playPaperPullOut() {
    this._playSample('paper_eject', {
      gain: 1.0,
      rate: 0.98 + Math.random() * 0.04,
      pan: -0.05,
    });
  }

  playPaperPlace() {
    this._playSample('paper_place', {
      gain: 0.95,
      rate: 0.97 + Math.random() * 0.05,
      pan: -0.34,
    });
  }

  playPaperPick() {
    this._playSample('paper_pick', {
      gain: 0.95,
      rate: 0.98 + Math.random() * 0.04,
      pan: 0.34,
    });
  }

  playPaperFeed() {
    this._playSample('paper_feed', {
      gain: 1.0,
      rate: 0.98 + Math.random() * 0.03,
      pan: 0,
    });
  }

  _ensureRainBuffer() {
    if (this._rainBuffer || !this.ctx) return this._rainBuffer;
    const len = this.ctx.sampleRate * 4;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const ch = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i += 1) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.035 * white) / 1.035;
      ch[i] = last * 3.1;
    }
    this._rainBuffer = buf;
    return buf;
  }

  toggleRain() {
    this.ensureContext();
    this.rainEnabled = !this.rainEnabled;

    if (this.rainEnabled) {
      if (!this._rainNodes) {
        const src = this.ctx.createBufferSource();
        src.buffer = this._ensureRainBuffer();
        src.loop = true;

        const lp = this.ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 1450;

        const hp = this.ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 140;

        const rainGain = this.ctx.createGain();
        rainGain.gain.value = 0.0001;

        src.connect(hp);
        hp.connect(lp);
        lp.connect(rainGain);
        rainGain.connect(this.masterGain);
        src.start();
        this._rainNodes = {src, gain: rainGain};
      }
      this._rainNodes.gain.gain.setTargetAtTime(0.18, this.ctx.currentTime, 0.35);
    } else if (this._rainNodes) {
      this._rainNodes.gain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.25);
    }
    return this.rainEnabled;
  }
}
