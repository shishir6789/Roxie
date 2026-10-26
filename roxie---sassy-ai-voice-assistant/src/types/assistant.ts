export type LiveState = 'disconnected' | 'connecting' | 'listening' | 'speaking';

export type ThemeKey = 'neon_pink' | 'cyberpunk_cyan' | 'midnight_purple' | 'emerald_glow' | 'sunset_amber';

export type VoiceName = 'Aoede' | 'Kore' | 'Zephyr' | 'Puck' | 'Fenrir';

export interface ThemeConfig {
  id: ThemeKey;
  name: string;
  tagline: string;
  primary: string;
  primaryHex: string;
  secondary: string;
  secondaryHex: string;
  accent: string;
  glow: string;
  gradientBg: string;
  orbGradient: string;
  ringColor: string;
}

export interface ToolCallAction {
  id: string;
  name: string;
  args: Record<string, any>;
  timestamp: number;
}

export interface ReactionEvent {
  id: string;
  type: string;
  caption: string;
  timestamp: number;
}

export interface AudioVisualizationData {
  micLevel: number; // 0 to 1
  speakerLevel: number; // 0 to 1
  frequencies: Uint8Array;
}
