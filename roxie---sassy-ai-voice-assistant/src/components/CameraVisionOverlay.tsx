import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { ThemeConfig } from '../types/assistant';

interface CameraVisionOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onFrameCaptured: (base64Jpeg: string) => void;
  theme: ThemeConfig;
}

export const CameraVisionOverlay: React.FC<CameraVisionOverlayProps> = ({
  isOpen,
  onClose,
  onFrameCaptured,
  theme,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Start webcam
  useEffect(() => {
    if (!isOpen) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      return;
    }

    let isMounted = true;

    async function initCamera() {
      try {
        setError(null);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: facingMode,
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: false,
        });

        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      } catch (err: any) {
        console.error('[Camera] Access failed:', err);
        setError('Camera permission needed for Vision mode.');
      }
    }

    initCamera();

    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [isOpen, facingMode]);

  // Capture frames at 1 FPS (1000ms interval) to stream to Gemini Live
  useEffect(() => {
    if (!isOpen || !isActive) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const interval = setInterval(() => {
      const video = videoRef.current;
      if (!video || video.readyState < 2 || !ctx) return;

      canvas.width = 480;
      canvas.height = 360;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Get JPEG base64 without prefix
      const dataUrl = canvas.toDataURL('image/jpeg', 0.65);
      const base64 = dataUrl.split(',')[1];
      if (base64) {
        onFrameCaptured(base64);
      }
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [isOpen, isActive, onFrameCaptured]);

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-28 right-4 sm:right-6 z-40 w-44 sm:w-56 overflow-hidden rounded-2xl bg-neutral-900/90 border border-white/20 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
      {/* Header bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-black/40 border-b border-white/10 text-white text-[11px] font-mono">
        <div className="flex items-center gap-1.5 font-bold text-pink-300">
          <Camera className="w-3.5 h-3.5 animate-pulse" />
          <span>ROXIE VISION</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'))}
            className="p-1 rounded hover:bg-white/10 text-white/70 hover:text-white"
            title="Switch front/back camera"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
          <button
            onClick={() => setIsActive(!isActive)}
            className="p-1 rounded hover:bg-white/10 text-white/70 hover:text-white"
            title={isActive ? 'Pause Vision' : 'Resume Vision'}
          >
            {isActive ? <Eye className="w-3 h-3 text-emerald-400" /> : <EyeOff className="w-3 h-3 text-amber-400" />}
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-white/10 text-white/70 hover:text-white"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Video Viewfinder */}
      <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
        {error ? (
          <p className="text-[10px] text-red-300 p-2 text-center leading-tight">{error}</p>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform -scale-x-100"
            />
            {/* Cyberpunk viewfinder crosshairs */}
            <div className="absolute inset-2 border border-white/20 rounded-lg pointer-events-none" />
            <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/60 px-1.5 py-0.5 rounded text-[9px] font-mono text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>1 FPS LIVE</span>
            </div>
          </>
        )}
      </div>

      <div className="p-1.5 bg-black/50 text-[10px] text-white/60 text-center font-mono">
        Show things to Roxie & ask!
      </div>
    </div>
  );
};
