class SoundEngine {
  private ctx: AudioContext | null = null;
  public muted = false;

  private ensureContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume = 0.12,
    delay = 0,
    endFreq?: number,
  ) {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const start = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (endFreq !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, endFreq), start + duration);
    }

    gain.gain.setValueAtTime(0.001, start);
    gain.gain.linearRampToValueAtTime(volume, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(start);
    osc.stop(start + duration + 0.02);
  }

  playPop() {
    this.playTone(420, 0.07, 'triangle', 0.09, 0, 580);
  }

  playPetHappy(combo = 1) {
    const base = 440 + Math.min(combo, 8) * 38;
    this.playTone(base, 0.1, 'sine', 0.11, 0, base * 1.18);
    this.playTone(base * 1.25, 0.13, 'triangle', 0.09, 0.06);
  }

  playEat() {
    this.playTone(280, 0.07, 'triangle', 0.12, 0, 190);
    this.playTone(340, 0.07, 'triangle', 0.12, 0.09, 220);
    this.playTone(520, 0.12, 'sine', 0.1, 0.19, 640);
  }

  playSoap() {
    this.playTone(580, 0.08, 'sine', 0.08, 0, 820);
    this.playTone(720, 0.09, 'sine', 0.07, 0.06, 980);
  }

  playSplash() {
    this.playTone(320, 0.12, 'sine', 0.09, 0, 620);
    this.playTone(480, 0.14, 'triangle', 0.07, 0.07, 740);
  }

  playTowel() {
    this.playTone(523.25, 0.12, 'triangle', 0.1, 0);
    this.playTone(659.25, 0.14, 'triangle', 0.1, 0.08);
    this.playTone(783.99, 0.2, 'sine', 0.12, 0.16);
  }

  playSleep() {
    this.playTone(392, 0.22, 'sine', 0.08, 0);
    this.playTone(329.63, 0.28, 'sine', 0.08, 0.16);
  }

  playWake() {
    this.playTone(523.25, 0.12, 'triangle', 0.1, 0);
    this.playTone(659.25, 0.12, 'triangle', 0.1, 0.09);
    this.playTone(783.99, 0.16, 'triangle', 0.11, 0.18);
  }

  playCoin(combo = 1) {
    const pitchBoost = Math.min(combo - 1, 6) * 40;
    this.playTone(987.77 + pitchBoost, 0.08, 'square', 0.05, 0);
    this.playTone(1318.51 + pitchBoost, 0.18, 'sine', 0.11, 0.06);
  }

  playStarCoin() {
    this.playTone(880, 0.08, 'triangle', 0.1, 0);
    this.playTone(1174.66, 0.09, 'triangle', 0.1, 0.06);
    this.playTone(1567.98, 0.22, 'sine', 0.12, 0.12);
  }

  playBad() {
    this.playTone(180, 0.16, 'sawtooth', 0.08, 0, 95);
  }

  playWin() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      this.playTone(freq, 0.16, 'triangle', 0.11, i * 0.09);
    });
  }

  playLevelUp() {
    const notes = [440, 554.37, 659.25, 880, 1108.73];
    notes.forEach((freq, i) => {
      this.playTone(freq, 0.18, 'sine', 0.12, i * 0.08);
    });
  }

  playUnlock() {
    const notes = [587.33, 739.99, 880, 1174.66];
    notes.forEach((freq, i) => {
      this.playTone(freq, 0.2, 'triangle', 0.12, i * 0.09);
    });
  }
}

export const sfx = new SoundEngine();
