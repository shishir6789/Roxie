import React, { useEffect, useRef } from 'react';
import { LiveState, ThemeConfig } from '../types/assistant';

interface WaveformVisualizerProps {
  state: LiveState;
  theme: ThemeConfig;
  micLevel: number;
  speakerLevel: number;
  speakerFrequencies: Uint8Array;
}

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  state,
  theme,
  micLevel,
  speakerLevel,
  speakerFrequencies,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let phase = 0;

    const render = () => {
      phase += 0.08;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      const isSpeaking = state === 'speaking';
      const isListening = state === 'listening';
      const isActive = isSpeaking || isListening;

      const amplitude = isSpeaking
        ? Math.max(12, speakerLevel * 48)
        : isListening
        ? Math.max(8, micLevel * 36)
        : 3;

      // Draw 3 layered sine waves with gradient
      const waveCount = 3;
      for (let w = 0; w < waveCount; w++) {
        ctx.beginPath();
        const currentAmp = amplitude * (1 - w * 0.25);
        const freq = 0.015 + w * 0.008;
        const speed = phase * (1 + w * 0.3);

        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, `${theme.secondaryHex}00`);
        gradient.addColorStop(0.2, `${theme.secondaryHex}${isActive ? '99' : '33'}`);
        gradient.addColorStop(0.5, `${theme.primaryHex}${isActive ? 'ff' : '66'}`);
        gradient.addColorStop(0.8, `${theme.secondaryHex}${isActive ? '99' : '33'}`);
        gradient.addColorStop(1, `${theme.secondaryHex}00`);

        ctx.strokeStyle = gradient;
        ctx.lineWidth = w === 0 ? 3 : 1.5;
        ctx.shadowColor = theme.primaryHex;
        ctx.shadowBlur = isActive ? 12 : 4;

        for (let x = 0; x < width; x += 3) {
          // Attenuate at edges for organic fade
          const edgeFade = Math.sin((x / width) * Math.PI);
          const y = centerY + Math.sin(x * freq + speed) * currentAmp * edgeFade;

          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }

      // Draw subtle frequency bars in background when speaking
      if (isSpeaking && speakerFrequencies && speakerFrequencies.length > 0) {
        const barCount = 32;
        const barWidth = 4;
        const spacing = (width - 40) / barCount;

        ctx.fillStyle = `${theme.primaryHex}33`;
        for (let i = 0; i < barCount; i++) {
          const freqVal = speakerFrequencies[i * 2] || 0;
          const barHeight = (freqVal / 255) * 32;
          const x = 20 + i * spacing;
          ctx.fillRect(x, centerY - barHeight / 2, barWidth, barHeight);
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [state, theme, micLevel, speakerLevel, speakerFrequencies]);

  return (
    <div className="w-full max-w-md h-20 flex items-center justify-center px-4 relative">
      <canvas
        ref={canvasRef}
        width={400}
        height={80}
        className="w-full h-full block"
      />
    </div>
  );
};
