// Web Audio API Synthesizer for Casino & Gaming Floor
// Generates realistic, latency-free physical bell chimes and hit pings without external audio dependencies.

class CasinoSoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    // Check localStorage for muted preference
    try {
      const storedMute = localStorage.getItem('tiggy_sound_muted');
      if (storedMute === 'true') {
        this.isMuted = true;
      }
    } catch {}
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    return this.ctx;
  }

  public isSoundMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    try {
      localStorage.setItem('tiggy_sound_muted', this.isMuted ? 'true' : 'false');
    } catch {}
    if (!this.isMuted) {
      this.playHitNumberBell();
    }
    return this.isMuted;
  }

  /**
   * Crisp, metallic bell chime when a player "hits a number" (e.g. in Keno, Roulette, Plinko).
   * Synthesizes fundamental frequency + harmonic overtones with rapid exponential decay.
   */
  public playHitNumberBell(pitchMultiplier = 1.0) {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // High bright bell (A5 = 880Hz, C6 = 1046.5Hz, E6 = 1318.5Hz)
      const baseFreq = 1046.5 * pitchMultiplier;

      // Master gain for this bell strike
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.35, now);
      masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
      masterGain.connect(ctx.destination);

      // 1. Fundamental tone
      const osc1 = ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(baseFreq, now);

      // 2. Harmonic overtone 1 (Major 3rd / 5th harmonic for bell sparkle)
      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(baseFreq * 2.01, now);

      // 3. High metallic overtone (gives physical bell strike feel)
      const osc3 = ctx.createOscillator();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(baseFreq * 3.14, now);

      // Gain envelopes for harmonics
      const gain2 = ctx.createGain();
      gain2.gain.setValueAtTime(0.4, now);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

      const gain3 = ctx.createGain();
      gain3.gain.setValueAtTime(0.2, now);
      gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc1.connect(masterGain);
      osc2.connect(gain2);
      gain2.connect(masterGain);
      osc3.connect(gain3);
      gain3.connect(masterGain);

      osc1.start(now);
      osc2.start(now);
      osc3.start(now);

      osc1.stop(now + 1.2);
      osc2.stop(now + 0.8);
      osc3.stop(now + 0.4);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  /**
   * Harmonious multi-bell celebration chime when a round finishes with a win or payout.
   */
  public playWinChime() {
    if (this.isMuted) return;
    const notes = [1.0, 1.25, 1.5, 2.0]; // C, E, G, High C
    notes.forEach((ratio, idx) => {
      setTimeout(() => {
        this.playHitNumberBell(ratio);
      }, idx * 110);
    });
  }

  /**
   * Jackpot celebratory bell ringing
   */
  public playJackpotBells() {
    if (this.isMuted) return;
    const pattern = [1.0, 1.25, 1.5, 1.8, 2.0, 2.25];
    pattern.forEach((ratio, idx) => {
      setTimeout(() => {
        this.playHitNumberBell(ratio);
      }, idx * 90);
    });
    setTimeout(() => {
      this.playWinChime();
    }, 600);
  }

  /**
   * Soft ball click / drop sound
   */
  public playBallTick() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.05);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch {}
  }
}

export const soundManager = new CasinoSoundManager();
