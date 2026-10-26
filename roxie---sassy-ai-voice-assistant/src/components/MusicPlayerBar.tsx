import React from 'react';
import { Music, Play, Pause, Disc } from 'lucide-react';
import { lofiPlayer, MusicVibe } from '../services/audio/LoFiPlayer';
import { ThemeConfig } from '../types/assistant';

interface MusicPlayerBarProps {
  isPlaying: boolean;
  vibe: MusicVibe;
  onToggle: () => void;
  onChangeVibe: (vibe: MusicVibe) => void;
  theme: ThemeConfig;
}

export const MusicPlayerBar: React.FC<MusicPlayerBarProps> = ({
  isPlaying,
  vibe,
  onToggle,
  onChangeVibe,
  theme,
}) => {
  const vibes: Array<{ id: MusicVibe; label: string }> = [
    { id: 'chill_lofi', label: 'Lo-Fi Chill' },
    { id: 'cyberpunk', label: 'Cyberpunk' },
    { id: 'ambient_rain', label: 'Rain Drops' },
    { id: 'synthwave', label: 'Synthwave' },
  ];

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-xs shadow-lg select-none">
      <button
        onClick={onToggle}
        className={`p-1.5 rounded-full transition-all ${
          isPlaying
            ? 'bg-pink-500 text-white shadow-[0_0_10px_rgba(236,72,153,0.5)]'
            : 'bg-white/10 text-white/70 hover:text-white'
        }`}
        title={isPlaying ? 'Pause BGM' : 'Play Lo-Fi Music'}
      >
        {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
      </button>

      <div className="flex items-center gap-1.5 text-white/80">
        <Disc className={`w-3.5 h-3.5 ${isPlaying ? 'animate-spin text-pink-400' : 'text-white/40'}`} />
        <span className="font-mono text-[11px] font-medium hidden sm:inline">BGM:</span>
      </div>

      <select
        value={vibe}
        onChange={(e) => onChangeVibe(e.target.value as MusicVibe)}
        className="bg-transparent text-[11px] font-medium text-white/90 border-none focus:outline-none cursor-pointer"
      >
        {vibes.map((v) => (
          <option key={v.id} value={v.id} className="bg-neutral-900 text-white">
            {v.label}
          </option>
        ))}
      </select>

      {/* Mini equalizer animation when playing */}
      {isPlaying && (
        <div className="flex items-end gap-0.5 h-3 ml-1">
          <span className="w-0.5 h-3 bg-pink-400 rounded-full animate-bounce delay-75" />
          <span className="w-0.5 h-2 bg-pink-300 rounded-full animate-bounce delay-150" />
          <span className="w-0.5 h-2.5 bg-pink-400 rounded-full animate-bounce delay-200" />
        </div>
      )}
    </div>
  );
};
