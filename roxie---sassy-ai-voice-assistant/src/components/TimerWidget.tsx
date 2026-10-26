import React, { useEffect, useState } from 'react';
import { Timer as TimerIcon, X, Play, Pause, Bell } from 'lucide-react';
import { ThemeConfig } from '../types/assistant';

export interface ActiveTimer {
  id: string;
  label: string;
  totalSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
}

interface TimerWidgetProps {
  timer: ActiveTimer | null;
  onDismiss: () => void;
  theme: ThemeConfig;
}

export const TimerWidget: React.FC<TimerWidgetProps> = ({ timer, onDismiss, theme }) => {
  const [currentTimer, setCurrentTimer] = useState<ActiveTimer | null>(timer);

  useEffect(() => {
    setCurrentTimer(timer);
  }, [timer]);

  useEffect(() => {
    if (!currentTimer || !currentTimer.isRunning || currentTimer.remainingSeconds <= 0) return;

    const interval = setInterval(() => {
      setCurrentTimer((prev) => {
        if (!prev) return null;
        if (prev.remainingSeconds <= 1) {
          // Play timer alarm chime
          try {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            const ctx = new AudioCtx();
            const now = ctx.currentTime;
            [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = 'triangle';
              osc.frequency.setValueAtTime(freq, now + idx * 0.12);
              gain.gain.setValueAtTime(0.12, now + idx * 0.12);
              gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.3);
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.start(now + idx * 0.12);
              osc.stop(now + idx * 0.12 + 0.3);
            });
          } catch (_) {}

          return { ...prev, remainingSeconds: 0, isRunning: false };
        }
        return { ...prev, remainingSeconds: prev.remainingSeconds - 1 };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentTimer?.isRunning, currentTimer?.remainingSeconds]);

  if (!currentTimer) return null;

  const minutes = Math.floor(currentTimer.remainingSeconds / 60);
  const seconds = currentTimer.remainingSeconds % 60;
  const isFinished = currentTimer.remainingSeconds === 0;

  const progressPercent = currentTimer.totalSeconds > 0
    ? (currentTimer.remainingSeconds / currentTimer.totalSeconds) * 100
    : 0;

  return (
    <div className="fixed top-24 left-4 sm:left-6 z-40 animate-in fade-in slide-in-from-left-4 duration-300">
      <div
        className="w-56 p-3.5 rounded-2xl bg-neutral-900/90 border border-white/20 shadow-2xl backdrop-blur-xl text-white"
        style={{ boxShadow: `0 0 30px -5px ${theme.glow}` }}
      >
        <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs font-mono">
          <div className="flex items-center gap-1.5 font-bold text-amber-400">
            <TimerIcon className="w-4 h-4" />
            <span className="truncate">{currentTimer.label || 'Timer'}</span>
          </div>
          <button
            onClick={onDismiss}
            className="p-1 rounded-full text-white/50 hover:text-white hover:bg-white/10"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="py-2.5 flex items-center justify-between">
          <div className="text-2xl font-mono font-extrabold tracking-wider text-white">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>

          <div className="flex items-center gap-1.5">
            {isFinished ? (
              <div className="flex items-center gap-1 text-xs font-bold text-emerald-400 animate-bounce">
                <Bell className="w-4 h-4" />
                <span>Time!</span>
              </div>
            ) : (
              <button
                onClick={() =>
                  setCurrentTimer((prev) =>
                    prev ? { ...prev, isRunning: !prev.isRunning } : null
                  )
                }
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                title={currentTimer.isRunning ? 'Pause' : 'Resume'}
              >
                {currentTimer.isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-pink-500 transition-all duration-1000"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
};
