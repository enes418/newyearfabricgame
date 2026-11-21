// 100% Procedural Web Audio API Christmas Sound & Music Engine (Zero external assets)

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private muted = false;
  private musicEnabled = true;
  private musicTimer: number | null = null;
  private noteIndex = 0;
  private lastMachineSfx = 0;

  // Cozy Jingle Bells / Winter Celesta melody in C Major (frequencies in Hz)
  private readonly melody: Array<{ freq: number; dur: number }> = [
    { freq: 659.25, dur: 0.35 }, // E5
    { freq: 659.25, dur: 0.35 }, // E5
    { freq: 659.25, dur: 0.7 },  // E5
    { freq: 659.25, dur: 0.35 }, // E5
    { freq: 659.25, dur: 0.35 }, // E5
    { freq: 659.25, dur: 0.7 },  // E5
    { freq: 659.25, dur: 0.35 }, // E5
    { freq: 783.99, dur: 0.35 }, // G5
    { freq: 523.25, dur: 0.5 },  // C5
    { freq: 587.33, dur: 0.2 },  // D5
    { freq: 659.25, dur: 1.0 },  // E5

    { freq: 698.46, dur: 0.35 }, // F5
    { freq: 698.46, dur: 0.35 }, // F5
    { freq: 698.46, dur: 0.45 }, // F5
    { freq: 698.46, dur: 0.25 }, // F5
    { freq: 698.46, dur: 0.35 }, // F5
    { freq: 659.25, dur: 0.35 }, // E5
    { freq: 659.25, dur: 0.35 }, // E5
    { freq: 659.25, dur: 0.35 }, // E5
    { freq: 783.99, dur: 0.35 }, // G5
    { freq: 783.99, dur: 0.35 }, // G5
    { freq: 698.46, dur: 0.35 }, // F5
    { freq: 587.33, dur: 0.35 }, // D5
    { freq: 523.25, dur: 1.1 },  // C5

    // Soft Winter Bridge (We Wish You a Merry Christmas motif)
    { freq: 392.0, dur: 0.35 },  // G4
    { freq: 523.25, dur: 0.35 }, // C5
    { freq: 523.25, dur: 0.2 },  // C5
    { freq: 587.33, dur: 0.2 },  // D5
    { freq: 523.25, dur: 0.2 },  // C5
    { freq: 493.88, dur: 0.2 },  // B4
    { freq: 440.0, dur: 0.4 },   // A4
    { freq: 440.0, dur: 0.4 },   // A4
    { freq: 587.33, dur: 0.4 },  // D5
    { freq: 659.25, dur: 0.2 },  // E5
    { freq: 587.33, dur: 0.2 },  // D5
    { freq: 523.25, dur: 0.2 },  // C5
    { freq: 493.88, dur: 0.4 },  // B4
    { freq: 392.0, dur: 0.8 },   // G4
  ];

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();

      this.masterGain.gain.value = this.muted ? 0 : 0.7;
      this.musicGain.gain.value = this.musicEnabled ? 0.14 : 0;
      this.sfxGain.gain.value = 0.45;

      this.musicGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public unlock() {
    const ctx = this.ensureContext();
    if (ctx && this.musicEnabled && !this.muted && this.musicTimer === null) {
      this.startMusicLoop();
    }
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.7, this.ctx.currentTime, 0.04);
    }
    if (!muted && this.musicEnabled && this.musicTimer === null) {
      this.startMusicLoop();
    }
  }

  public setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(enabled ? 0.14 : 0, this.ctx.currentTime, 0.08);
    }
    if (enabled && !this.muted && this.musicTimer === null) {
      this.startMusicLoop();
    } else if (!enabled && this.musicTimer !== null) {
      window.clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
  }

  private startMusicLoop() {
    if (this.musicTimer !== null) return;
    const scheduleNext = () => {
      if (!this.musicEnabled || this.muted) {
        this.musicTimer = null;
        return;
      }
      const ctx = this.ctx;
      if (ctx && ctx.state === 'running' && this.musicGain) {
        const note = this.melody[this.noteIndex % this.melody.length];
        this.noteIndex++;
        this.playCelestaNote(note.freq, note.dur);
        this.musicTimer = window.setTimeout(scheduleNext, note.dur * 1000);
      } else {
        this.musicTimer = window.setTimeout(scheduleNext, 450);
      }
    };
    this.musicTimer = window.setTimeout(scheduleNext, 300);
  }

  private playCelestaNote(freq: number, dur: number) {
    if (!this.ctx || !this.musicGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const harm = this.ctx.createOscillator();
    const env = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    harm.type = 'triangle';
    harm.frequency.setValueAtTime(freq * 2, now);

    const harmGain = this.ctx.createGain();
    harmGain.gain.setValueAtTime(0.18, now);

    env.gain.setValueAtTime(0.001, now);
    env.gain.linearRampToValueAtTime(0.45, now + 0.02);
    env.gain.exponentialRampToValueAtTime(0.001, now + Math.max(0.3, dur * 1.15));

    osc.connect(env);
    harm.connect(harmGain);
    harmGain.connect(env);
    env.connect(this.musicGain);

    osc.start(now);
    harm.start(now);
    osc.stop(now + dur * 1.25);
    harm.stop(now + dur * 1.25);
  }

  public playClick() {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(760, now + 0.045);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.07);
  }

  public playError() {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(190, now);
    osc.frequency.linearRampToValueAtTime(135, now + 0.14);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.17);
  }

  public playMachineTick() {
    if (this.muted) return;
    const nowMs = performance.now();
    if (nowMs - this.lastMachineSfx < 480) return;
    this.lastMachineSfx = nowMs;

    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running' || !this.sfxGain) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.05);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.07);
  }

  public playWrapPop() {
    if (this.muted) return;
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running' || !this.sfxGain) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(340, now);
    osc.frequency.exponentialRampToValueAtTime(620, now + 0.07);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  public playRibbonChime() {
    if (this.muted) return;
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running' || !this.sfxGain) return;
    const now = ctx.currentTime;

    [880, 1174.66].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.045);

      gain.gain.setValueAtTime(0.1, now + idx * 0.045);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.045 + 0.18);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now + idx * 0.045);
      osc.stop(now + idx * 0.045 + 0.2);
    });
  }

  public playCoinEarned() {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;

    [987.77, 1318.51].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.06);

      gain.gain.setValueAtTime(0.24, now + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.24);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now + i * 0.06);
      osc.stop(now + i * 0.06 + 0.26);
    });
  }

  public playTruckHorn() {
    if (this.muted) return;
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running' || !this.sfxGain) return;
    const now = ctx.currentTime;

    [293.66, 369.99].forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.11, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now);
      osc.stop(now + 0.26);
    });
  }

  public playOrderComplete() {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;

    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const t = now + i * 0.075;
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.26, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t);
      osc.stop(t + 0.38);
    });
  }

  public playTrainWhistle() {
    if (this.muted) return;
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running' || !this.sfxGain) return;
    const now = ctx.currentTime;

    [392, 493.88, 587.33].forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now);
      osc.stop(now + 0.45);
    });
  }

  public playGoldenSparkle() {
    if (this.muted) return;
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running' || !this.sfxGain) return;
    const now = ctx.currentTime;

    [1046.5, 1318.51, 1567.98].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const t = now + idx * 0.05;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.14, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t);
      osc.stop(t + 0.3);
    });
  }

  public dispose() {
    if (this.musicTimer !== null) {
      window.clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }
}

export const soundEngine = new SoundEngine();
