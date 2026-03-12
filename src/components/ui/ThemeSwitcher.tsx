'use client';

import { useThemeStore } from '@/lib/stores/theme-store';

export function ThemeSwitcher() {
  const { currentTheme, toggleDarkMode } = useThemeStore();
  
  const isDark = currentTheme === 'tamkeen-dark';

  return (
    <div className="flex items-center justify-center gap-4">
      <span className={`text-sm font-medium ${
        isDark ? 'text-tamkeenDark-textMuted' : 'text-tamkeen-textMuted'
      }`}>
        Light
      </span>
      
      <button
        onClick={toggleDarkMode}
        className={`
          relative inline-flex h-10 w-20 items-center rounded-full transition-all duration-300
          ${isDark 
            ? 'bg-tamkeenDark-accent shadow-lg shadow-tamkeenDark-accent/30' 
            : 'bg-tamkeen-accent shadow-md'
          }
        `}
        role="switch"
        aria-checked={isDark}
        aria-label="Toggle dark mode"
      >
        <span
          className={`
            inline-flex h-8 w-8 items-center justify-center transform rounded-full
            shadow-lg transition-transform duration-300 text-lg
            ${isDark 
              ? 'translate-x-11 bg-tamkeenDark-surface' 
              : 'translate-x-1 bg-tamkeen-surface'
            }
          `}
        >
          {isDark ? '🌙' : '☀️'}
        </span>
      </button>
      
      <span className={`text-sm font-medium ${
        isDark ? 'text-tamkeenDark-textMuted' : 'text-tamkeen-textMuted'
      }`}>
        Dark
      </span>
    </div>
  );
}
