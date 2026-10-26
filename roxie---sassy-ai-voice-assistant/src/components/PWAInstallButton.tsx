import React, { useState } from 'react';
import { Download, Smartphone, X, Check, Share } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { ThemeConfig } from '../types/assistant';

interface PWAInstallButtonProps {
  theme: ThemeConfig;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ theme }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  // If already running as an installed PWA on device home screen, hide button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 shadow-md shadow-pink-500/30 transition-all active:scale-95"
        title="ফোন বা পিসিতে অ্যাপ হিসেবে ইনস্টল করুন"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install App</span>
      </button>
    );
  }

  // Fallback button for iOS Safari or manual guide
  return (
    <>
      <button
        onClick={() => setShowGuide(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-medium text-white/80 hover:text-white transition-all active:scale-95"
        title="How to install as mobile app"
      >
        <Smartphone className="w-3.5 h-3.5 text-pink-400" />
        <span className="hidden sm:inline">Get App</span>
      </button>

      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-sm rounded-3xl bg-neutral-900 border border-white/20 p-6 shadow-2xl text-white"
            style={{ boxShadow: `0 0 50px -10px ${theme.glow}` }}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-pink-400" />
                <h3 className="text-base font-bold">Install Roxie as an App</h3>
              </div>
              <button
                onClick={() => setShowGuide(false)}
                className="p-1 rounded-full text-white/50 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3.5 text-xs text-white/80 leading-relaxed">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <p className="font-bold text-white text-sm">📱 Android Phone (Chrome):</p>
                <p>1. ব্রাউজারের উপরে ডানে ৩-ডট মেনুতে (⋮) ট্যাপ করুন।</p>
                <p>2. <span className="font-semibold text-pink-300">&ldquo;Install App&rdquo;</span> বা <span className="font-semibold text-pink-300">&ldquo;Add to Home screen&rdquo;</span> চাপুন।</p>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <p className="font-bold text-white text-sm">🍎 iPhone / iPad (Safari):</p>
                <p className="flex items-center gap-1">
                  1. সাফারির নিচে <Share className="w-3.5 h-3.5 text-blue-400" /> <strong>Share</strong> বাটনে ট্যাপ করুন।
                </p>
                <p>2. নিচে স্ক্রোল করে <strong className="text-pink-300">&ldquo;Add to Home Screen&rdquo;</strong> চাপুন।</p>
              </div>

              <p className="text-[11px] text-white/50 text-center font-mono">
                * এরপর আপনার ফোনের হোম স্ক্রিনে অ্যাপ আইকন তৈরি হয়ে যাবে এবং ফুলস্ক্রিনে চলবে!
              </p>
            </div>

            <button
              onClick={() => setShowGuide(false)}
              className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 font-semibold text-xs transition-colors"
            >
              বুঝেছি
            </button>
          </div>
        </div>
      )}
    </>
  );
};
