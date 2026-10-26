import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LiveSession } from './services/live/LiveSession';
import { LiveState, ThemeConfig, ThemeKey, VoiceName, ToolCallAction } from './types/assistant';
import { THEMES } from './utils/themes';
import { soundEffects } from './utils/soundEffects';
import { lofiPlayer, MusicVibe } from './services/audio/LoFiPlayer';
import { StatusHeader } from './components/StatusHeader';
import { OrbVisualizer } from './components/OrbVisualizer';
import { WaveformVisualizer } from './components/WaveformVisualizer';
import { MicButton } from './components/MicButton';
import { ToolActionOverlay } from './components/ToolActionOverlay';
import { SettingsDrawer } from './components/SettingsDrawer';
import { SparksModal } from './components/SparksModal';
import { CameraVisionOverlay } from './components/CameraVisionOverlay';
import { TimerWidget, ActiveTimer } from './components/TimerWidget';
import { NotesDrawer, NoteItem } from './components/NotesDrawer';
import { MusicPlayerBar } from './components/MusicPlayerBar';
import { AlertCircle, Sparkles, ShieldCheck } from 'lucide-react';

const LOCAL_STORAGE_NOTES_KEY = 'roxie_voice_notes_v1';

export default function App() {
  const [state, setState] = useState<LiveState>('disconnected');
  const [themeKey, setThemeKey] = useState<ThemeKey>('neon_pink');
  const [voice, setVoice] = useState<VoiceName>('Aoede');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Tools & Actions
  const [activeTool, setActiveTool] = useState<ToolCallAction | null>(null);
  const [reaction, setReaction] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Camera Vision Mode
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);

  // Active Timer
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);

  // Notes & Scratchpad
  const [notes, setNotes] = useState<NoteItem[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_NOTES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (_) {
      return [];
    }
  });
  const [showNotes, setShowNotes] = useState<boolean>(false);

  // Background Lo-Fi Music Player
  const [isMusicPlaying, setIsMusicPlaying] = useState<boolean>(false);
  const [musicVibe, setMusicVibe] = useState<MusicVibe>('chill_lofi');

  // Drawers & Modals
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showSparks, setShowSparks] = useState<boolean>(false);

  // Audio visualization data updated at 60fps
  const [audioData, setAudioData] = useState<{
    micLevel: number;
    speakerLevel: number;
    speakerFrequencies: Uint8Array;
  }>({
    micLevel: 0,
    speakerLevel: 0,
    speakerFrequencies: new Uint8Array(64),
  });

  const sessionRef = useRef<LiveSession | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const currentTheme: ThemeConfig = THEMES[themeKey] || THEMES.neon_pink;

  // Persist notes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_NOTES_KEY, JSON.stringify(notes));
    } catch (_) {}
  }, [notes]);

  // Note management handlers
  const handleAddNote = (text: string, title?: string) => {
    const newNote: NoteItem = {
      id: Math.random().toString(36).substring(2, 9),
      text,
      title: title || 'Voice Note',
      timestamp: Date.now(),
    };
    setNotes((prev) => [newNote, ...prev]);
  };

  const handleDeleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  // Music handlers
  const handleToggleMusic = () => {
    const playing = lofiPlayer.toggle(musicVibe);
    setIsMusicPlaying(playing);
  };

  const handleChangeVibe = (newVibe: MusicVibe) => {
    setMusicVibe(newVibe);
    lofiPlayer.setVibe(newVibe);
  };

  // Handle Tool Calls executed by Gemini Live
  const handleToolCall = useCallback((toolCall: ToolCallAction) => {
    setActiveTool(toolCall);

    if (toolCall.name === 'openWebsite') {
      const url = toolCall.args?.url;
      if (url) {
        try {
          const finalUrl = url.startsWith('http') ? url : `https://${url}`;
          window.open(finalUrl, '_blank', 'noopener,noreferrer');
        } catch (e) {
          console.warn('[Tool] Browser blocked auto-popup, showing UI card:', e);
        }
      }
    } else if (toolCall.name === 'changeTheme') {
      const requestedTheme = toolCall.args?.theme as ThemeKey;
      if (requestedTheme && THEMES[requestedTheme]) {
        setThemeKey(requestedTheme);
      }
    } else if (toolCall.name === 'showReaction') {
      const reactionType = toolCall.args?.reactionType || 'wink';
      setReaction(reactionType);
      setTimeout(() => setReaction(null), 6000);
    } else if (toolCall.name === 'controlMusic') {
      const action = toolCall.args?.action;
      const vibe = (toolCall.args?.vibe as MusicVibe) || 'chill_lofi';
      if (action === 'play') {
        lofiPlayer.play(vibe);
        setIsMusicPlaying(true);
        setMusicVibe(vibe);
      } else if (action === 'pause') {
        lofiPlayer.pause();
        setIsMusicPlaying(false);
      } else if (action === 'change_vibe') {
        lofiPlayer.setVibe(vibe);
        setMusicVibe(vibe);
      }
    } else if (toolCall.name === 'setTimer') {
      const duration = Number(toolCall.args?.durationSeconds) || 60;
      const label = toolCall.args?.label || 'Voice Timer';
      setActiveTimer({
        id: Math.random().toString(36).substring(2, 9),
        label,
        totalSeconds: duration,
        remainingSeconds: duration,
        isRunning: true,
      });
    } else if (toolCall.name === 'saveNote') {
      const noteText = toolCall.args?.text || '';
      const noteTitle = toolCall.args?.title || 'Voice Memo';
      if (noteText) {
        handleAddNote(noteText, noteTitle);
      }
    }

    // Auto-dismiss tool overlay after 12s if not dismissed manually
    setTimeout(() => {
      setActiveTool((prev) => (prev?.id === toolCall.id ? null : prev));
    }, 12000);
  }, []);

  // Initialize LiveSession
  useEffect(() => {
    const session = new LiveSession({
      onStateChange: (newState) => {
        setState(newState);
      },
      onToolCall: (toolCall) => {
        handleToolCall(toolCall);
      },
      onError: (msg) => {
        setErrorMessage(msg);
        setTimeout(() => setErrorMessage(null), 8000);
      },
    });

    sessionRef.current = session;

    // Visualization render loop (60fps)
    const updateVisuals = () => {
      if (sessionRef.current) {
        const data = sessionRef.current.getVisualizerData();
        setAudioData({
          micLevel: data.micLevel,
          speakerLevel: data.speakerLevel,
          speakerFrequencies: data.speakerFrequencies,
        });
      }
      animFrameRef.current = requestAnimationFrame(updateVisuals);
    };

    animFrameRef.current = requestAnimationFrame(updateVisuals);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      session.disconnect();
      lofiPlayer.pause();
    };
  }, [handleToolCall]);

  // Connect or disconnect voice session
  const toggleSession = async () => {
    setErrorMessage(null);
    if (!sessionRef.current) return;

    if (state === 'disconnected') {
      try {
        await sessionRef.current.connect(voice);
      } catch (err: any) {
        setErrorMessage(err?.message || 'Failed to start session');
      }
    } else {
      sessionRef.current.disconnect();
    }
  };

  const toggleMute = () => {
    if (!sessionRef.current) return;
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    sessionRef.current.setMute(nextMuted);
  };

  const toggleSound = () => {
    const nextSound = !soundEnabled;
    setSoundEnabled(nextSound);
    soundEffects.enabled = nextSound;
  };

  return (
    <div
      className="relative w-screen h-screen overflow-hidden flex flex-col justify-between text-white select-none transition-all duration-700 font-sans"
      style={{
        background: currentTheme.gradientBg,
      }}
    >
      {/* Background ambient futuristic grid lines */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-40 z-0" />

      {/* Top HUD Header */}
      <StatusHeader
        state={state}
        theme={currentTheme}
        onOpenSettings={() => setShowSettings(true)}
        onOpenSparks={() => setShowSparks(true)}
        onOpenNotes={() => setShowNotes(true)}
        onToggleCamera={() => setIsCameraOpen(!isCameraOpen)}
        isCameraOpen={isCameraOpen}
        notesCount={notes.length}
        isMuted={isMuted}
        onToggleMute={toggleMute}
      />

      {/* Floating Tool Action Card Overlay */}
      <ToolActionOverlay
        activeTool={activeTool}
        onDismiss={() => setActiveTool(null)}
        theme={currentTheme}
      />

      {/* Active Voice Timer Widget */}
      <TimerWidget
        timer={activeTimer}
        onDismiss={() => setActiveTimer(null)}
        theme={currentTheme}
      />

      {/* Camera Vision Viewfinder */}
      <CameraVisionOverlay
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onFrameCaptured={(base64) => sessionRef.current?.sendVideoFrame(base64)}
        theme={currentTheme}
      />

      {/* Error Banner */}
      {errorMessage && (
        <div className="fixed top-20 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50 flex items-start gap-2.5 p-3.5 rounded-2xl bg-red-950/90 border border-red-500/40 text-red-200 text-xs backdrop-blur-xl shadow-2xl animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-white">Voice Connection Note</p>
            <p className="mt-0.5 leading-snug">{errorMessage}</p>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-red-400 hover:text-white text-xs font-bold p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Center Main Stage (Orb & Persona Status) */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 max-w-xl mx-auto w-full">
        {/* Roxie Sassy Status / Subtitle Pill */}
        <div className="mb-4 sm:mb-6 flex items-center justify-center">
          <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-lg flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: currentTheme.accent }}
            />
            <span className="text-xs font-medium tracking-wide text-white/90">
              {state === 'disconnected' && 'Roxie স্ট্যান্ডবাই আছে · Call চাপুন'}
              {state === 'connecting' && 'কানেক্ট হচ্ছে... লাইভ লিংক তৈরি হচ্ছে'}
              {state === 'listening' && (isMuted ? 'Mic Muted · আনমিউট করে কথা বলুন' : 'শুনছি · বাংলায় বা ইংরেজিতে বলুন')}
              {state === 'speaking' && 'রক্সি কথা বলছে...'}
            </span>
          </div>
        </div>

        {/* Central Reactive Holographic Orb */}
        <OrbVisualizer
          state={state}
          theme={currentTheme}
          micLevel={audioData.micLevel}
          speakerLevel={audioData.speakerLevel}
          speakerFrequencies={audioData.speakerFrequencies}
          reaction={reaction}
        />

        {/* Fluid Sine Audio Waveform */}
        <div className="mt-4 sm:mt-6 w-full flex justify-center">
          <WaveformVisualizer
            state={state}
            theme={currentTheme}
            micLevel={audioData.micLevel}
            speakerLevel={audioData.speakerLevel}
            speakerFrequencies={audioData.speakerFrequencies}
          />
        </div>

        {/* Ambient Lo-Fi Music Pill & Quick Sparks */}
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          <MusicPlayerBar
            isPlaying={isMusicPlaying}
            vibe={musicVibe}
            onToggle={handleToggleMusic}
            onChangeVibe={handleChangeVibe}
            theme={currentTheme}
          />

          {state === 'disconnected' && (
            <button
              onClick={() => setShowSparks(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-xs transition-all active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              <span>আইডিয়া দেখুন</span>
            </button>
          )}
        </div>
      </main>

      {/* Bottom Control Bar with Central Power/Mic Button */}
      <footer className="relative z-20 w-full pb-6 pt-2 px-6 flex flex-col items-center justify-center gap-2.5">
        <MicButton
          state={state}
          theme={currentTheme}
          onToggle={toggleSession}
          isMuted={isMuted}
          onToggleMute={toggleMute}
        />

        {/* Minimalist Audio Specs / Security footnote */}
        <div className="flex items-center gap-2 text-[10px] text-white/40 font-mono tracking-wider">
          <ShieldCheck className="w-3 h-3 text-emerald-400/80" />
          <span>Real-time Audio & Vision · Voice AI</span>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <SettingsDrawer
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        currentTheme={currentTheme}
        onSelectTheme={(t) => setThemeKey(t)}
        currentVoice={voice}
        onSelectVoice={(v) => setVoice(v)}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
      />

      <SparksModal
        isOpen={showSparks}
        onClose={() => setShowSparks(false)}
        theme={currentTheme}
      />

      <NotesDrawer
        isOpen={showNotes}
        onClose={() => setShowNotes(false)}
        notes={notes}
        onDeleteNote={handleDeleteNote}
        onAddNote={handleAddNote}
        theme={currentTheme}
      />
    </div>
  );
}
