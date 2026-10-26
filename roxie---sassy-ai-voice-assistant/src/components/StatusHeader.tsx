import React from 'react';
import { Sliders, Sparkles, Volume2, VolumeX, Camera, StickyNote } from 'lucide-react';
import { LiveState, ThemeConfig } from '../types/assistant';
import { PWAInstallButton } from './PWAInstallButton';

interface StatusHeaderProps {
  state: LiveState;
  theme: ThemeConfig;
  onOpenSettings: () => void;
  onOpenSparks: () => void;
  onOpenNotes: () => void;
  onToggleCamera: () => void;
  isCameraOpen: boolean;
  notesCount: number;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const StatusHeader: React.FC<StatusHeaderProps> = ({
  state,
  theme,
  onOpenSettings,
  onOpenSparks,
  onOpenNotes,
  onToggleCamera,
  isCameraOpen,
  notesCount,
  isMuted,
  onToggleMute,
}) => {
  const isConnected = state === 'listening' || state === 'speaking';

  return (
    <header className="w-full flex items-center justify-between px-3 sm:px-6 py-3.5 z-40 select-none">
      {/* Brand & Persona Badge with User's Neon Flame Emblem */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <div className="relative">
          <div
            className={`w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center p-0.5 shadow-lg border transition-all ${
              isConnected
                ? 'border-pink-500 shadow-[0_0_18px_' + theme.primaryHex + '] scale-105'
                : 'border-white/15 bg-neutral-900'
            }`}
          >
            <img
              src="/logo.png"
              alt="Roxie Flame Logo"
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
          {/* Live indicator dot */}
          <span
            className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-neutral-950 ${
              isConnected
                ? 'bg-emerald-400 animate-pulse'
                : state === 'connecting'
                ? 'bg-amber-400 animate-ping'
                : 'bg-neutral-600'
            }`}
          />
        </div>

        <div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-white flex items-center gap-1.5 font-sans">
              ROXIE
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-white/10 text-pink-300 font-semibold border border-white/10 uppercase">
                VOICE AI
              </span>
            </h1>
          </div>
          <p className="text-[10px] sm:text-[11px] text-white/50 font-medium">বাংলা ও English AI Voice</p>
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* In-App PWA Install Button */}
        <PWAInstallButton theme={theme} />

        {/* Camera Vision Mode */}
        <button
          onClick={onToggleCamera}
          className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl border text-xs font-medium transition-all backdrop-blur-md active:scale-95 ${
            isCameraOpen
              ? 'bg-pink-600 border-pink-400 text-white shadow-[0_0_12px_rgba(236,72,153,0.5)]'
              : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/80 hover:text-white'
          }`}
          title="Camera Vision Mode (Show things to Roxie)"
        >
          <Camera className="w-3.5 h-3.5 text-pink-300" />
          <span className="hidden md:inline">Vision</span>
        </button>

        {/* Notes / Scratchpad */}
        <button
          onClick={onOpenNotes}
          className="relative flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white text-xs font-medium transition-all backdrop-blur-md active:scale-95"
          title="Voice Scratchpad & Notes"
        >
          <StickyNote className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden md:inline">Notes</span>
          {notesCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-amber-500 text-black text-[10px] font-bold flex items-center justify-center">
              {notesCount}
            </span>
          )}
        </button>

        {/* Voice Sparks/Topics Button */}
        <button
          onClick={onOpenSparks}
          className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white text-xs font-medium transition-all backdrop-blur-md active:scale-95"
          title="Banter Sparks & Conversation Starters"
        >
          <Sparkles className="w-3.5 h-3.5 text-pink-400" />
          <span className="hidden lg:inline">Sparks</span>
        </button>

        {/* Mute Speaker / Mic */}
        {isConnected && (
          <button
            onClick={onToggleMute}
            className={`p-2 rounded-xl border transition-all active:scale-95 ${
              isMuted
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-white/5 border-white/10 text-white/70 hover:text-white'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        )}

        {/* Settings / Persona Customizer */}
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-all active:scale-95"
          title="Voice & Theme Settings"
        >
          <Sliders className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
