/**
 * Theme Constants
 * 
 * Central source of truth for Tamkeen theme colors.
 * These values should match:
 * - tailwind.config.ts (Tailwind color definitions)
 * - src/app/globals.css (CSS variables)
 * - public/manifest.json (PWA theme colors)
 */

export const TAMKEEN_COLORS = {
  light: {
    primary: '#CC7722',
    accent: '#556B2F',
    background: '#F0EBE3',
    surface: '#FFFFFF',
    text: '#2D2416',
    textMuted: '#5A4A3A',
  },
  dark: {
    primary: '#E89952',
    accent: '#8FBC8F',
    background: '#0F1A13',
    surface: '#1A2820',
    text: '#F0EBE3',
    textMuted: '#B8C4B8',
  },
} as const;

// Default theme color for PWA manifest and viewport
export const DEFAULT_THEME_COLOR = TAMKEEN_COLORS.light.primary;
