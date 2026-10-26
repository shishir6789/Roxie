/**
 * LoFiPlayer generates procedural, royalty-free lo-fi & ambient music using Web Audio API.
 * Features automatic audio ducking when speech is detected.
 */
export type MusicVibe = 'chill_lofi' | 'cyberpunk' | 'ambient_rain' | 'synthwave';

export class LoFiPlayer {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private currentVibe: MusicVibe = 'chill_lofi';
  private masterGain: GainNode | null = null;
  private duckGain: GainNode | null = null;
  private timerId: any = null;
  private noiseNode: AudioNode | null = null;
  private volume: number = 0.35;
  private stepIndex: number = 0;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.duckGain = this.ctx.createGain();

        this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
        this.duckGain.gain.setValueAtTime(1.0, this.ctx.currentTime);

        this.masterGain.connect(this.duckGain);
        this.duckGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // Create vinyl crackle / ambient rain texture
  private startVinylNoise() {
    const ctx = this.getContext();
    if (!ctx || !this.masterGain) return;

    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      // Pink-ish noise with sporadic crackle
      const crackle = Math.random() < 0.003 ? (Math.random() * 2 - 1) * 0.4 : 0;
      output[i] = (Math.random() * 2 - 1) * 0.03 + crackle;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, ctx.currentTime);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.08, ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    whiteNoise.start();
    this.noiseNode = whiteNoise;
  }

  // Play a dreamy chord
  private playChord(freqs: number[], duration: number) {
    const ctx = this.getContext();
    if (!ctx || !this.masterGain) return;

    const now = ctx.currentTime;
    freqs.forEach((freq) => {
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      // Lo-fi warm sound design
      osc.type = this.currentVibe === 'cyberpunk' ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(freq, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(this.currentVibe === 'synthwave' ? 1200 : 650, now);

      noteGain.gain.setValueAtTime(0.0001, now);
      noteGain.gain.linearRampToValueAtTime(0.05, now + 0.4);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(filter);
      filter.connect(noteGain);
      noteGain.connect(this.masterGain!);

      osc.start(now);
      osc.stop(now + duration);
    });
  }

  public play(vibe: MusicVibe = 'chill_lofi') {
    this.currentVibe = vibe;
    const ctx = this.getContext();
    if (!ctx) return;

    if (this.isPlaying) return;
    this.isPlaying = true;

    this.startVinylNoise();

    // Chord progressions (MIDI notes converted to Hz)
    // Progression: Dm9 -> G13 -> Cmaj9 -> Am9
    const progressions: Record<MusicVibe, number[][]> = {
      chill_lofi: [
        [146.83, 220.0, 261.63, 329.63], // Dm9
        [196.0, 246.94, 329.63, 392.0],  // G13
        [130.81, 196.0, 246.94, 293.66], // Cmaj9
        [110.0, 164.81, 220.0, 261.63],  // Am9
      ],
      cyberpunk: [
        [110.0, 164.81, 207.65, 329.63], // A mysterious minor
        [98.0, 146.83, 196.0, 293.66],   // G minor deep
        [87.31, 130.81, 174.61, 261.63], // F major 7
        [123.47, 185.0, 246.94, 369.99], // B sus
      ],
      ambient_rain: [
        [130.81, 196.0, 261.63, 329.63], // C peaceful
        [146.83, 220.0, 293.66, 349.23], // Dm
        [164.81, 246.94, 329.63, 392.0],  // Em
        [174.61, 261.63, 349.23, 440.0],  // F
      ],
      synthwave: [
        [146.83, 220.0, 293.66, 369.99],
        [110.0, 164.81, 220.0, 277.18],
        [130.81, 196.0, 261.63, 329.63],
        [98.0, 146.83, 196.0, 246.94],
      ],
    };

    const chords = progressions[vibe] || progressions.chill_lofi;
    const chordDuration = 4.2;

    const loop = () => {
      if (!this.isPlaying) return;
      const currentChord = chords[this.stepIndex % chords.length];
      this.playChord(currentChord, chordDuration);
      this.stepIndex++;
      this.timerId = setTimeout(loop, (chordDuration - 0.4) * 1000);
    };

    loop();
  }

  public pause() {
    this.isPlaying = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    if (this.noiseNode) {
      try {
        (this.noiseNode as AudioScheduledSourceNode).stop();
      } catch (_) {}
      this.noiseNode = null;
    }
  }

  public toggle(vibe?: MusicVibe) {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play(vibe || this.currentVibe);
    }
    return this.isPlaying;
  }

  public setVibe(vibe: MusicVibe) {
    this.currentVibe = vibe;
    if (this.isPlaying) {
      this.pause();
      this.play(vibe);
    }
  }

  // Automatic Audio Ducking (lowers background music volume when Roxie speaks)
  public duck(isDucking: boolean) {
    if (!this.duckGain || !this.ctx) return;
    const now = this.ctx.currentTime;
    const targetGain = isDucking ? 0.15 : 1.0;
    this.duckGain.gain.cancelScheduledValues(now);
    this.duckGain.gain.linearRampToValueAtTime(targetGain, now + 0.3);
  }

  public getStatus(): { isPlaying: boolean; vibe: MusicVibe } {
    return { isPlaying: this.isPlaying, vibe: this.currentVibe };
  }
}

export const lofiPlayer = new LoFiPlayer();
