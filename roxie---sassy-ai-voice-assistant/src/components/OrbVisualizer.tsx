import React, { useEffect, useRef } from 'react';
import { LiveState, ThemeConfig } from '../types/assistant';

interface OrbVisualizerProps {
  state: LiveState;
  theme: ThemeConfig;
  micLevel: number;
  speakerLevel: number;
  speakerFrequencies: Uint8Array;
  reaction?: string | null;
}

export const OrbVisualizer: React.FC<OrbVisualizerProps> = ({
  state,
  theme,
  micLevel,
  speakerLevel,
  reaction,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Render fluid reactive particle aura & wave ripples on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let angle = 0;

    const render = () => {
      angle += 0.03;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const baseRadius = 88;

      // Determine audio reactivity multiplier
      const energy = state === 'speaking' ? speakerLevel * 50 : state === 'listening' ? micLevel * 40 : 4;
      const currentRadius = baseRadius + energy;

      // Outer glowing halo
      const grad = ctx.createRadialGradient(
        centerX,
        centerY,
        baseRadius * 0.4,
        centerX,
        centerY,
        currentRadius + 60
      );

      if (state === 'speaking') {
        grad.addColorStop(0, `${theme.primaryHex}dd`);
        grad.addColorStop(0.5, `${theme.secondaryHex}66`);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else if (state === 'listening') {
        grad.addColorStop(0, `${theme.primaryHex}aa`);
        grad.addColorStop(0.6, `${theme.secondaryHex}44`);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else if (state === 'connecting') {
        grad.addColorStop(0, `${theme.primaryHex}88`);
        grad.addColorStop(0.7, `${theme.secondaryHex}33`);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else {
        grad.addColorStop(0, `${theme.primaryHex}44`);
        grad.addColorStop(0.8, 'rgba(0, 0, 0, 0)');
      }

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, currentRadius + 60, 0, Math.PI * 2);
      ctx.fill();

      // Fluid wavy outline around orb
      ctx.save();
      ctx.strokeStyle = state === 'speaking' ? theme.primaryHex : `${theme.primaryHex}aa`;
      ctx.lineWidth = state === 'speaking' ? 3.5 : 2;
      ctx.shadowColor = theme.primaryHex;
      ctx.shadowBlur = state === 'speaking' ? 24 : 12;

      ctx.beginPath();
      const points = 32;
      for (let i = 0; i <= points; i++) {
        const theta = (i / points) * Math.PI * 2;
        const wave = Math.sin(theta * 4 + angle * 2) * (energy * 0.35);
        const r = currentRadius + wave;
        const x = centerX + Math.cos(theta) * r;
        const y = centerY + Math.sin(theta) * r;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();

      // Orbital cyber rings
      const ringCount = 2;
      for (let r = 0; r < ringCount; r++) {
        ctx.save();
        ctx.translate(centerX, centerY);
        const ringAngle = (angle * (r === 0 ? 1 : -0.7)) + (r * Math.PI / 3);
        ctx.rotate(ringAngle);
        ctx.strokeStyle = `${theme.secondaryHex}${state === 'speaking' ? '88' : '44'}`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(0, 0, currentRadius + 24 + r * 14, (currentRadius + 24 + r * 14) * 0.38, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Orbital particle dots
        const dotAngle = angle * (r === 0 ? 2 : -1.5);
        const dotX = Math.cos(dotAngle) * (currentRadius + 24 + r * 14);
        const dotY = Math.sin(dotAngle) * ((currentRadius + 24 + r * 14) * 0.38);
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = theme.accent;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(dotX, dotY, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [state, theme, micLevel, speakerLevel]);

  return (
    <div className="relative flex items-center justify-center select-none">
      {/* Background canvas for dynamic fluid waves & orbital rings */}
      <canvas
        ref={canvasRef}
        width={360}
        height={360}
        className="absolute pointer-events-none z-0"
      />

      {/* Central Core Holographic Orb */}
      <div
        className={`relative z-10 w-44 h-44 rounded-full flex items-center justify-center transition-all duration-300 ${
          state === 'speaking'
            ? 'scale-105 shadow-[0_0_60px_' + theme.primaryHex + ']'
            : state === 'listening'
            ? 'scale-100 shadow-[0_0_40px_' + theme.glow + ']'
            : state === 'connecting'
            ? 'animate-pulse shadow-[0_0_50px_' + theme.glow + ']'
            : 'scale-95 opacity-80 shadow-[0_0_20px_rgba(255,255,255,0.05)]'
        }`}
        style={{
          background: `radial-gradient(circle at 35% 35%, rgba(255, 255, 255, 0.45) 0%, ${theme.primaryHex} 45%, ${theme.secondaryHex} 80%, #0d0a14 100%)`,
        }}
      >
        {/* Inner holographic glass shimmer layer */}
        <div className="absolute inset-1 rounded-full bg-gradient-to-tr from-white/10 via-transparent to-white/30 pointer-events-none" />

        {/* Dynamic Center Expression/Reaction */}
        <div className="relative z-20 flex flex-col items-center justify-center text-center">
          {reaction ? (
            <div className="text-4xl animate-bounce">
              {reaction === 'wink' && '😉'}
              {reaction === 'smirk' && '😏'}
              {reaction === 'tease' && '😜'}
              {reaction === 'heart' && '💖'}
              {reaction === 'fire' && '🔥'}
              {reaction === 'laugh' && '😂'}
              {reaction === 'drama' && '💅'}
              {reaction === 'kiss' && '💋'}
              {reaction === 'eye_roll' && '🙄'}
              {!['wink', 'smirk', 'tease', 'heart', 'fire', 'laugh', 'drama', 'kiss', 'eye_roll'].includes(reaction) && '✨'}
            </div>
          ) : state === 'speaking' ? (
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-6 bg-white/90 rounded-full animate-bounce delay-75 shadow-sm" />
              <span className="w-1.5 h-10 bg-white rounded-full animate-bounce delay-150 shadow-md" />
              <span className="w-1.5 h-7 bg-white/90 rounded-full animate-bounce delay-200 shadow-sm" />
              <span className="w-1.5 h-11 bg-white rounded-full animate-bounce delay-100 shadow-md" />
              <span className="w-1.5 h-6 bg-white/90 rounded-full animate-bounce delay-300 shadow-sm" />
            </div>
          ) : state === 'listening' ? (
            <div className="flex flex-col items-center">
              <div className="relative flex items-center justify-center">
                <span className="w-3 h-3 rounded-full bg-white shadow-lg animate-ping absolute" />
                <span className="w-3.5 h-3.5 rounded-full bg-white shadow-md relative" />
              </div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-white/90 mt-2 font-mono">
                Listening
              </span>
            </div>
          ) : state === 'connecting' ? (
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              <span className="text-[10px] uppercase tracking-widest font-semibold text-white/80 mt-2 font-mono">
                Linking...
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-full overflow-hidden p-1 shadow-lg animate-pulse-slow">
                <img
                  src="/logo.png"
                  alt="Neon Flame Emblem"
                  className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(236,72,153,0.8)]"
                />
              </div>
              <span className="text-[10px] uppercase tracking-widest font-semibold text-white/80 mt-1 font-mono">
                Standby
              </span>
            </div>
          )}
        </div>

        {/* Ambient Ring Glow */}
        <div
          className={`absolute -inset-3 rounded-full border border-white/20 transition-all duration-700 pointer-events-none ${
            state === 'speaking' ? 'animate-spin border-white/40' : state === 'listening' ? 'border-white/30' : 'opacity-20'
          }`}
          style={{ animationDuration: '12s' }}
        />
      </div>
    </div>
  );
};
