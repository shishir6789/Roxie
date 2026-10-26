import React from 'react';
import { Mic, MicOff, Power, Radio, Volume2, Loader2 } from 'lucide-react';
import { LiveState, ThemeConfig } from '../types/assistant';

interface MicButtonProps {
  state: LiveState;
  theme: ThemeConfig;
  onToggle: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const MicButton: React.FC<MicButtonProps> = ({
  state,
  theme,
  onToggle,
  isMuted,
  onToggleMute,
}) => {
  const isConnected = state === 'listening' || state === 'speaking';
  const isConnecting = state === 'connecting';

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative flex items-center justify-center">
        {/* Pulsing halo rings when connected or speaking */}
        {isConnected && (
          <>
            <div
              className="absolute -inset-4 rounded-full opacity-40 animate-ping pointer-events-none"
              style={{ backgroundColor: theme.primaryHex }}
            />
            <div
              className="absolute -inset-8 rounded-full opacity-20 animate-pulse pointer-events-none"
              style={{ backgroundColor: theme.secondaryHex }}
            />
          </>
        )}

        {/* Main Central Power/Mic Button */}
        <button
          onClick={onToggle}
          disabled={isConnecting}
          aria-label={isConnected ? 'Disconnect voice call' : 'Start voice call with Roxie'}
          className={`relative z-10 w-20 h-20 sm:w-22 sm:h-22 rounded-full flex flex-col items-center justify-center transition-all duration-300 active:scale-95 shadow-2xl focus:outline-none focus:ring-4 focus:ring-white/20 ${
            isConnected
              ? 'bg-gradient-to-tr from-red-600 via-rose-500 to-pink-600 text-white shadow-[0_0_40px_rgba(244,63,94,0.6)]'
              : isConnecting
              ? 'bg-neutral-800 text-white/50 border border-white/20'
              : `bg-gradient-to-tr ${theme.primary} text-white shadow-[0_0_35px_${theme.glow}] hover:scale-105`
          }`}
        >
          {isConnecting ? (
            <Loader2 className="w-8 h-8 animate-spin text-white" />
          ) : isConnected ? (
            state === 'speaking' ? (
              <Volume2 className="w-8 h-8 text-white animate-pulse" />
            ) : (
              <Radio className="w-8 h-8 text-white animate-pulse" />
            )
          ) : (
            <Power className="w-8 h-8 text-white" />
          )}

          <span className="text-[10px] font-mono font-bold tracking-wider uppercase mt-1">
            {isConnected ? 'End' : isConnecting ? 'Linking' : 'Call'}
          </span>
        </button>

        {/* Small floating quick-mute toggle button if connected */}
        {isConnected && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleMute();
            }}
            title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            className={`absolute -right-3 -bottom-1 z-20 w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md border transition-all ${
              isMuted
                ? 'bg-amber-500/90 text-white border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.6)]'
                : 'bg-neutral-900/90 text-white/80 border-white/20 hover:text-white'
            }`}
          >
            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* State label under button */}
      <div className="flex flex-col items-center">
        <p className="text-xs font-mono font-medium tracking-widest uppercase text-white/60">
          {state === 'disconnected' && 'Tap Call to Talk'}
          {state === 'connecting' && 'Connecting to Roxie...'}
          {state === 'listening' && (isMuted ? 'Mic Muted' : 'Listening · Speak casually')}
          {state === 'speaking' && 'Roxie is speaking · Tap to end'}
        </p>
      </div>
    </div>
  );
};
