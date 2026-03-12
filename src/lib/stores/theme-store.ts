import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'tamkeen' | 'tamkeen-dark';

export const themeNames = {
  'tamkeen': 'Tamkeen Light',
  'tamkeen-dark': 'Tamkeen Dark',
} as const;

export const themeDescriptions = {
  'tamkeen': 'Warm Minimalism - Earthy rust, sand, and olive tones for focused study',
  'tamkeen-dark': 'Warm Minimalism - Dark mode with greenish undertones and warm rust accents',
} as const;

interface ThemeState {
  currentTheme: Theme;
  setTheme: (theme: Theme) => void;
  toggleDarkMode: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      currentTheme: 'tamkeen',
      
      setTheme: (theme: Theme) => set({ currentTheme: theme }),
      
      toggleDarkMode: () => {
        const current = get().currentTheme;
        const newTheme = current === 'tamkeen' ? 'tamkeen-dark' : 'tamkeen';
        set({ currentTheme: newTheme });
      },
    }),
    {
      name: 'theme-storage',
    }
  )
);
