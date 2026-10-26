import { LiveState, ToolCallAction, VoiceName } from '../../types/assistant';
import { AudioStreamer } from '../audio/AudioStreamer';
import { MicRecorder } from '../audio/MicRecorder';
import { soundEffects } from '../../utils/soundEffects';
import { lofiPlayer } from '../audio/LoFiPlayer';

export interface LiveSessionCallbacks {
  onStateChange: (state: LiveState) => void;
  onToolCall: (toolCall: ToolCallAction) => void;
  onError: (errorMessage: string) => void;
}

export class LiveSession {
  private ws: WebSocket | null = null;
  private streamer: AudioStreamer;
  private recorder: MicRecorder;
  private state: LiveState = 'disconnected';
  private callbacks: LiveSessionCallbacks;
  private isMuted: boolean = false;
  private pingInterval: any = null;

  constructor(callbacks: LiveSessionCallbacks) {
    this.callbacks = callbacks;

    // AudioStreamer for playing Roxie's speech
    this.streamer = new AudioStreamer((isPlaying) => {
      if (this.state === 'disconnected' || this.state === 'connecting') return;
      if (isPlaying) {
        this.setState('speaking');
        lofiPlayer.duck(true);
      } else {
        // Returned to listening
        this.setState('listening');
        lofiPlayer.duck(false);
      }
    });

    // MicRecorder for streaming user speech to Gemini Live
    this.recorder = new MicRecorder((base64Pcm) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN && !this.isMuted) {
        this.ws.send(
          JSON.stringify({
            type: 'audio_in',
            data: base64Pcm,
          })
        );
      }
    });
  }

  private setState(newState: LiveState) {
    if (this.state !== newState) {
      this.state = newState;
      this.callbacks.onStateChange(newState);
    }
  }

  public async connect(voice: VoiceName = 'Aoede'): Promise<void> {
    if (this.state !== 'disconnected') return;

    this.setState('connecting');

    try {
      // 1. Start microphone stream first with clear user prompt
      try {
        await this.recorder.start();
      } catch (micErr: any) {
        console.error('[LiveSession] Microphone access failed:', micErr);
        this.callbacks.onError('মাইক্রোফোন পারমিশন প্রয়োজন! ব্রাউজার চাইলে "Allow" চাপুন। (Please allow microphone access)');
        this.disconnect();
        return;
      }

      // 2. Initialize AudioContext for playback
      this.streamer.init();

      // 3. Connect WebSocket to /live
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/live`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('[LiveSession] WebSocket opened, starting session with voice:', voice);
        this.ws?.send(
          JSON.stringify({
            type: 'start',
            voice: voice,
          })
        );

        // Keep connection warm with subtle ping
        this.pingInterval = setInterval(() => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 15000);
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === 'status') {
            if (msg.status === 'connected') {
              soundEffects.playConnectChime();
              this.setState('listening');
            } else if (msg.status === 'disconnected') {
              this.setState('disconnected');
            }
          } else if (msg.type === 'audio_out') {
            // Model generated audio chunk
            if (msg.data) {
              this.streamer.queueAudioChunk(msg.data);
            }
          } else if (msg.type === 'interrupted') {
            console.log('[LiveSession] Model speech interrupted by user');
            this.streamer.handleInterruption();
            this.setState('listening');
            lofiPlayer.duck(false);
          } else if (msg.type === 'turn_complete') {
            // Model finished turn
          } else if (msg.type === 'tool_call') {
            console.log('[LiveSession] Tool call received:', msg.call);
            soundEffects.playActionChirp();
            this.callbacks.onToolCall({
              id: msg.call.id,
              name: msg.call.name,
              args: msg.call.args,
              timestamp: Date.now(),
            });
          } else if (msg.type === 'error') {
            console.error('[LiveSession] Server error:', msg.message);
            this.callbacks.onError(msg.message || 'An error occurred during voice session.');
          }
        } catch (err) {
          console.error('[LiveSession] Error handling WS message:', err);
        }
      };

      this.ws.onerror = (e) => {
        console.error('[LiveSession] WebSocket error:', e);
        this.callbacks.onError('কানেকশন এরর হয়েছে। দয়া করে পেজটি রিফ্রেশ (Reload) দিয়ে আবার Call চাপুন।');
        this.disconnect();
      };

      this.ws.onclose = () => {
        console.log('[LiveSession] WebSocket closed');
        if (this.state !== 'disconnected') {
          soundEffects.playDisconnectChime();
          this.disconnect();
        }
      };
    } catch (err: any) {
      console.error('[LiveSession] Failed to connect:', err);
      this.callbacks.onError(err?.message || 'Could not access microphone or connect.');
      this.disconnect();
    }
  }

  // Stream video JPEG frame for camera vision mode
  public sendVideoFrame(base64Jpeg: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN && base64Jpeg) {
      this.ws.send(
        JSON.stringify({
          type: 'video_in',
          data: base64Jpeg,
        })
      );
    }
  }

  public disconnect(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    if (this.ws) {
      try {
        if (this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ type: 'stop' }));
        }
        this.ws.close();
      } catch (_) {}
      this.ws = null;
    }

    this.recorder.stop();
    this.streamer.cleanup();
    lofiPlayer.duck(false);
    this.setState('disconnected');
  }

  public setMute(muted: boolean): void {
    this.isMuted = muted;
    this.streamer.setMute(muted);
  }

  public isMicMuted(): boolean {
    return this.isMuted;
  }

  public getState(): LiveState {
    return this.state;
  }

  public getVisualizerData(): {
    micLevel: number;
    speakerLevel: number;
    speakerFrequencies: Uint8Array;
    micFrequencies: Uint8Array;
  } {
    const streamerData = this.streamer.getVisualizerData();
    const micLevel = this.recorder.getMicLevel();
    const micFrequencies = this.recorder.getFrequencies();

    return {
      micLevel,
      speakerLevel: streamerData.level,
      speakerFrequencies: streamerData.frequencies,
      micFrequencies,
    };
  }
}
