import React from 'react';
import { X, Volume2, Check, Sparkles, Sliders } from 'lucide-react';
import { ThemeConfig, ThemeKey, VoiceName } from '../types/assistant';
import { THEMES } from '../utils/themes';
import { soundEffects } from '../utils/soundEffects';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: ThemeConfig;
  onSelectTheme: (themeKey: ThemeKey) => void;
  currentVoice: VoiceName;
  onSelectVoice: (voice: VoiceName) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({
  isOpen,
  onClose,
  currentTheme,
  onSelectTheme,
  currentVoice,
  onSelectVoice,
  soundEnabled,
  onToggleSound,
}) => {
  if (!isOpen) return null;

  const voices: Array<{ id: VoiceName; label: string; desc: string }> = [
    { id: 'Aoede', label: 'Aoede (Recommended)', desc: 'Youthful, breezy, flirty & sassy female voice' },
    { id: 'Kore', label: 'Kore', desc: 'Clear, charismatic, confident female tone' },
    { id: 'Zephyr', label: 'Zephyr', desc: 'Bright, upbeat & expressive tone' },
    { id: 'Puck', label: 'Puck', desc: 'Playful, mischievous, energetic tone' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-neutral-900/95 border border-white/15 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl text-white max-h-[90vh] overflow-y-auto no-scrollbar"
        style={{
          boxShadow: `0 -10px 40px -10px ${currentTheme.glow}`,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-pink-400" />
            <h2 className="text-lg font-bold">Roxie Settings & Aura</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6 py-4">
          {/* Voice Persona Selection */}
          <div>
            <label className="text-xs font-mono font-bold tracking-wider uppercase text-white/60 block mb-2.5">
              Neural Voice Model
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {voices.map((v) => (
                <button
                  key={v.id}
                  onClick={() => {
                    onSelectVoice(v.id);
                    soundEffects.playActionChirp();
                  }}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    currentVoice === v.id
                      ? 'bg-pink-500/15 border-pink-500 text-white shadow-[0_0_15px_rgba(236,72,153,0.3)]'
                      : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{v.label}</span>
                    {currentVoice === v.id && <Check className="w-4 h-4 text-pink-400" />}
                  </div>
                  <p className="text-xs text-white/50 mt-1 leading-snug">{v.desc}</p>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-white/40 mt-1.5 font-mono">
              * Voice changes take effect on your next call connection.
            </p>
          </div>

          {/* Aura Theme Selection */}
          <div>
            <label className="text-xs font-mono font-bold tracking-wider uppercase text-white/60 block mb-2.5">
              Interface Color Aura
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Object.values(THEMES).map((thm) => (
                <button
                  key={thm.id}
                  onClick={() => {
                    onSelectTheme(thm.id);
                    soundEffects.playActionChirp();
                  }}
                  className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                    currentTheme.id === thm.id
                      ? 'bg-white/15 border-white text-white shadow-lg'
                      : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                  }`}
                >
                  <div
                    className="w-7 h-7 rounded-full flex-shrink-0 shadow-md border border-white/20"
                    style={{ backgroundColor: thm.primaryHex }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm truncate">{thm.name}</span>
                      {currentTheme.id === thm.id && <Check className="w-4 h-4 text-white" />}
                    </div>
                    <p className="text-[11px] text-white/50 truncate">{thm.tagline}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Sound FX Toggle */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/5 text-pink-400">
                <Volume2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold">Futuristic Sound Cues</p>
                <p className="text-xs text-white/50">Synth chimes for connect & tool calls</p>
              </div>
            </div>
            <button
              onClick={onToggleSound}
              className={`w-12 h-6.5 rounded-full transition-colors relative flex items-center p-0.5 ${
                soundEnabled ? 'bg-pink-600' : 'bg-neutral-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  soundEnabled ? 'translate-x-5.5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Tech Spec Pill */}
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-xs text-white/60 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-white/80">
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              <span>Neural Voice Assistant</span>
            </div>
            <p>High-Definition Real-Time Audio & Vision</p>
            <p>Input: 16kHz PCM16 Mono · Output: 24kHz Web Audio</p>
            <p>Tools: Web Browser, Weather, Lo-Fi Music, Timer, Notes</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 font-semibold text-sm transition-all text-white"
        >
          Done
        </button>
      </div>
    </div>
  );
};
