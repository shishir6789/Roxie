/**
 * AudioStreamer manages gapless playback of 24kHz PCM audio chunks from Gemini Live API
 * using Web Audio API AudioBufferSourceNodes and tracks audio frequency/amplitude for visualization.
 */
export class AudioStreamer {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private nextStartTime: number = 0;
  private activeSources: Set<AudioBufferSourceNode> = new Set();
  private isPlaying: boolean = false;
  private isMuted: boolean = false;
  private volume: number = 1.0;
  private onPlaybackStateChange?: (isPlaying: boolean) => void;

  constructor(onPlaybackStateChange?: (isPlaying: boolean) => void) {
    this.onPlaybackStateChange = onPlaybackStateChange;
  }

  public init() {
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      // 24kHz matches Gemini Live model output format, fallback if unsupported
      try {
        this.audioCtx = new AudioCtx({ sampleRate: 24000 });
      } catch (e) {
        this.audioCtx = new AudioCtx();
      }
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;

      this.gainNode = this.audioCtx.createGain();
      this.gainNode.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.audioCtx.currentTime);

      this.gainNode.connect(this.analyser);
      this.analyser.connect(this.audioCtx.destination);
      this.nextStartTime = this.audioCtx.currentTime;
    }

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
  }

  public queueAudioChunk(base64Pcm: string) {
    if (!base64Pcm) return;
    this.init();
    if (!this.audioCtx || !this.gainNode) return;

    try {
      // Decode base64 to binary
      const binaryString = atob(base64Pcm);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Convert 16-bit linear PCM little-endian to Float32 [-1, 1]
      const int16 = new Int16Array(bytes.buffer);
      if (int16.length === 0) return;

      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) {
        float32[i] = int16[i] / 32768.0;
      }

      // Create AudioBuffer at 24000Hz (mono)
      const buffer = this.audioCtx.createBuffer(1, float32.length, 24000);
      buffer.copyToChannel(float32, 0);

      // Create source node
      const source = this.audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(this.gainNode);

      // Schedule gapless playback
      const currentTime = this.audioCtx.currentTime;
      if (this.nextStartTime < currentTime) {
        // Small 25ms jitter buffer to prevent pops
        this.nextStartTime = currentTime + 0.025;
      }

      source.start(this.nextStartTime);
      this.nextStartTime += buffer.duration;

      this.activeSources.add(source);
      if (!this.isPlaying) {
        this.isPlaying = true;
        this.onPlaybackStateChange?.(true);
      }

      source.onended = () => {
        this.activeSources.delete(source);
        if (this.activeSources.size === 0) {
          this.isPlaying = false;
          this.onPlaybackStateChange?.(false);
        }
      };
    } catch (err) {
      console.error('[AudioStreamer] Error decoding audio chunk:', err);
    }
  }

  /**
   * Handle user interruption - immediately kill all queued and playing audio
   */
  public handleInterruption() {
    if (this.activeSources.size > 0) {
      for (const source of this.activeSources) {
        try {
          source.stop();
          source.disconnect();
        } catch (_) {}
      }
      this.activeSources.clear();
    }

    if (this.audioCtx) {
      this.nextStartTime = this.audioCtx.currentTime;
    }

    if (this.isPlaying) {
      this.isPlaying = false;
      this.onPlaybackStateChange?.(false);
    }
  }

  public getVisualizerData(): { level: number; frequencies: Uint8Array } {
    if (!this.analyser || !this.isPlaying) {
      return { level: 0, frequencies: new Uint8Array(64) };
    }

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i];
    }
    const average = sum / bufferLength;
    const level = Math.min(1, average / 128);

    return { level, frequencies: dataArray };
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
    if (this.gainNode && this.audioCtx) {
      this.gainNode.gain.setValueAtTime(muted ? 0 : this.volume, this.audioCtx.currentTime);
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.gainNode && this.audioCtx && !this.isMuted) {
      this.gainNode.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);
    }
  }

  public cleanup() {
    this.handleInterruption();
    if (this.audioCtx) {
      try {
        this.audioCtx.close();
      } catch (_) {}
      this.audioCtx = null;
    }
  }
}
