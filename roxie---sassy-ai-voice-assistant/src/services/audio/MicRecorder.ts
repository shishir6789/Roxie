/**
 * MicRecorder captures microphone input at 16kHz mono, encodes to 16-bit linear PCM (little-endian),
 * converts to Base64, and tracks mic audio amplitude for the listening visualizer.
 */
export class MicRecorder {
  private audioCtx: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private isRecording: boolean = false;
  private onAudioData: (base64Pcm: string) => void;
  private micLevel: number = 0;

  constructor(onAudioData: (base64Pcm: string) => void) {
    this.onAudioData = onAudioData;
  }

  public async start(): Promise<void> {
    if (this.isRecording) return;

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      });

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      // Try initializing with 16000 sampleRate directly
      try {
        this.audioCtx = new AudioCtx({ sampleRate: 16000 });
      } catch (_) {
        this.audioCtx = new AudioCtx();
      }

      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }

      this.sourceNode = this.audioCtx.createMediaStreamSource(this.mediaStream);

      // Analyser node for live mic meter
      this.analyserNode = this.audioCtx.createAnalyser();
      this.analyserNode.fftSize = 256;
      this.analyserNode.smoothingTimeConstant = 0.5;

      // 4096 buffer size gives ~256ms at 16kHz, smooth packet streaming
      this.processorNode = this.audioCtx.createScriptProcessor(4096, 1, 1);

      this.processorNode.onaudioprocess = (e) => {
        if (!this.isRecording) return;

        const inputChannelData = e.inputBuffer.getChannelData(0);

        // Calculate live mic level for visualizer
        let sumSquares = 0;
        for (let i = 0; i < inputChannelData.length; i++) {
          sumSquares += inputChannelData[i] * inputChannelData[i];
        }
        const rms = Math.sqrt(sumSquares / inputChannelData.length);
        this.micLevel = Math.min(1, rms * 4.5);

        // Downsample if AudioContext is not 16000Hz
        const actualSampleRate = this.audioCtx?.sampleRate || 16000;
        const resampled = this.resampleTo16k(inputChannelData, actualSampleRate);

        // Convert to 16-bit PCM little-endian
        const base64 = this.floatTo16BitPCM(resampled);
        this.onAudioData(base64);
      };

      this.sourceNode.connect(this.analyserNode);
      this.analyserNode.connect(this.processorNode);
      this.processorNode.connect(this.audioCtx.destination);

      this.isRecording = true;
    } catch (err) {
      console.error('[MicRecorder] Failed to start microphone:', err);
      throw err;
    }
  }

  private resampleTo16k(input: Float32Array, inputSampleRate: number): Float32Array {
    if (inputSampleRate === 16000) return input;
    const ratio = inputSampleRate / 16000;
    const outputLength = Math.round(input.length / ratio);
    const output = new Float32Array(outputLength);
    for (let i = 0; i < outputLength; i++) {
      const idx = Math.min(Math.floor(i * ratio), input.length - 1);
      output[i] = input[idx];
    }
    return output;
  }

  private floatTo16BitPCM(input: Float32Array): string {
    const output = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }

    const bytes = new Uint8Array(output.buffer);
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  public getMicLevel(): number {
    return this.isRecording ? this.micLevel : 0;
  }

  public getFrequencies(): Uint8Array {
    if (!this.analyserNode || !this.isRecording) {
      return new Uint8Array(64);
    }
    const data = new Uint8Array(this.analyserNode.frequencyBinCount);
    this.analyserNode.getByteFrequencyData(data);
    return data;
  }

  public stop(): void {
    this.isRecording = false;
    this.micLevel = 0;

    if (this.processorNode) {
      this.processorNode.onaudioprocess = null;
      this.processorNode.disconnect();
      this.processorNode = null;
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    if (this.analyserNode) {
      this.analyserNode.disconnect();
      this.analyserNode = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.audioCtx) {
      try {
        this.audioCtx.close();
      } catch (_) {}
      this.audioCtx = null;
    }
  }
}
