import React from 'react';
import { ExternalLink, Sparkles, Globe, Search, Palette, X, CloudSun, Music, Timer, StickyNote, Wind, Droplets } from 'lucide-react';
import { ToolCallAction, ThemeConfig } from '../types/assistant';

interface ToolActionOverlayProps {
  activeTool: ToolCallAction | null;
  onDismiss: () => void;
  theme: ThemeConfig;
}

export const ToolActionOverlay: React.FC<ToolActionOverlayProps> = ({
  activeTool,
  onDismiss,
  theme,
}) => {
  if (!activeTool) return null;

  const { name, args } = activeTool;

  const handleOpenLink = (url: string) => {
    if (!url) return;
    const finalUrl = url.startsWith('http') ? url : `https://${url}`;
    window.open(finalUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed top-20 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
      <div
        className="relative overflow-hidden rounded-2xl p-4.5 backdrop-blur-xl border border-white/20 shadow-2xl text-white"
        style={{
          background: `linear-gradient(135deg, rgba(20, 20, 30, 0.9) 0%, rgba(30, 20, 40, 0.9) 100%)`,
          boxShadow: `0 10px 40px -10px ${theme.glow}, 0 0 20px rgba(0,0,0,0.5)`,
        }}
      >
        {/* Dismiss Button */}
        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 text-white/50 hover:text-white p-1 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Tool: getWeather */}
        {name === 'getWeather' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-wider uppercase text-amber-400">
              <CloudSun className="w-4 h-4" />
              <span>Live Weather Report</span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {args.city || 'Weather'}
                </h3>
                <p className="text-xs text-white/70">{args.condition || 'Clear'}</p>
              </div>
              <div className="text-3xl font-extrabold text-amber-300 font-mono">
                {args.temperature || '28°C'}
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-white/60 pt-2 border-t border-white/10">
              {args.humidity && (
                <div className="flex items-center gap-1">
                  <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Humidity: {args.humidity}</span>
                </div>
              )}
              {args.wind && (
                <div className="flex items-center gap-1">
                  <Wind className="w-3.5 h-3.5 text-teal-400" />
                  <span>Wind: {args.wind}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tool: controlMusic */}
        {name === 'controlMusic' && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-wider uppercase text-pink-400">
              <Music className="w-4 h-4" />
              <span>Lo-Fi Music Controller</span>
            </div>
            <p className="text-xs text-white/90 font-medium">
              Action: <span className="font-bold uppercase text-pink-300">{args.action}</span>
              {args.vibe && <span> · Vibe: <span className="capitalize">{args.vibe?.replace('_', ' ')}</span></span>}
            </p>
            {args.comment && (
              <p className="text-xs text-white/70 italic">&ldquo;{args.comment}&rdquo;</p>
            )}
          </div>
        )}

        {/* Tool: setTimer */}
        {name === 'setTimer' && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-wider uppercase text-amber-400">
              <Timer className="w-4 h-4" />
              <span>Voice Timer Activated</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white">{args.label || 'Timer'}</span>
              <span className="text-sm font-mono text-amber-300 font-bold">
                {Math.floor((args.durationSeconds || 60) / 60)}m {(args.durationSeconds || 60) % 60}s
              </span>
            </div>
          </div>
        )}

        {/* Tool: saveNote */}
        {name === 'saveNote' && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-wider uppercase text-amber-300">
              <StickyNote className="w-4 h-4" />
              <span>Note Saved to Scratchpad</span>
            </div>
            <p className="text-xs text-white/90 bg-white/5 p-2 rounded-xl border border-white/10 font-sans">
              &ldquo;{args.text}&rdquo;
            </p>
          </div>
        )}

        {/* Tool: openWebsite */}
        {name === 'openWebsite' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-wider uppercase text-pink-400">
              <Globe className="w-4 h-4" />
              <span>Browser Action Triggered</span>
            </div>

            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                <span>{args.siteName || 'Website'}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 font-normal">
                  Roxie Action
                </span>
              </h3>
              {args.reason && (
                <p className="text-xs text-white/80 mt-1 italic font-serif">
                  &ldquo;{args.reason}&rdquo;
                </p>
              )}
            </div>

            <button
              onClick={() => handleOpenLink(args.url)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-medium text-xs text-white bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 shadow-lg shadow-pink-500/30 transition-all active:scale-98"
            >
              <span>Visit {args.siteName || 'Page'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Tool: searchWeb */}
        {name === 'searchWeb' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-wider uppercase text-cyan-400">
              <Search className="w-4 h-4" />
              <span>Web Search</span>
            </div>

            <div>
              <p className="text-xs text-white/60">Searching for:</p>
              <h3 className="text-sm font-semibold text-white mt-0.5">&ldquo;{args.query}&rdquo;</h3>
            </div>

            <button
              onClick={() => handleOpenLink(`https://www.google.com/search?q=${encodeURIComponent(args.query || '')}`)}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-medium text-xs text-white bg-cyan-600 hover:bg-cyan-500 transition-all"
            >
              <span>View Search Results</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Tool: changeTheme */}
        {name === 'changeTheme' && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-wider uppercase text-purple-400">
              <Palette className="w-4 h-4" />
              <span>Vibe Switch</span>
            </div>
            <p className="text-xs text-white/90 font-medium">
              Aura switched to <span className="font-bold underline capitalize">{args.theme?.replace('_', ' ')}</span>
            </p>
            {args.comment && (
              <p className="text-xs text-white/70 italic">&ldquo;{args.comment}&rdquo;</p>
            )}
          </div>
        )}

        {/* Tool: showReaction */}
        {name === 'showReaction' && (
          <div className="space-y-2 text-center py-1">
            <div className="text-3xl animate-bounce">
              {args.reactionType === 'heart' && '💖'}
              {args.reactionType === 'wink' && '😉'}
              {args.reactionType === 'smirk' && '😏'}
              {args.reactionType === 'fire' && '🔥'}
              {args.reactionType === 'tease' && '😜'}
              {args.reactionType === 'drama' && '💅'}
              {args.reactionType === 'kiss' && '💋'}
              {!['heart', 'wink', 'smirk', 'fire', 'tease', 'drama', 'kiss'].includes(args.reactionType) && '✨'}
            </div>
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-pink-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{args.caption || 'Roxie reacted!'}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
