import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ReaderState {
  currentPage: number;
  currentSurah: number | null;
  navigationHistory: number[];
  
  navigateToPage: (page: number) => void;
  navigateToSurah: (surah: number, startingPage: number) => void;
  goBack: () => void;
  nextPage: () => void;
  previousPage: () => void;
}

export const useReaderStore = create<ReaderState>()(
  persist(
    (set) => ({
      currentPage: 1,
      currentSurah: null,
      navigationHistory: [],

      navigateToPage: (page: number) => set((state) => {
        if (page < 1 || page > 604) return state;
        return {
          currentPage: page,
          navigationHistory: [...state.navigationHistory, state.currentPage],
        };
      }),

      navigateToSurah: (surah: number, startingPage: number) => set((state) => {
        if (surah < 1 || surah > 114) return state;
        if (startingPage < 1 || startingPage > 604) return state;
        return {
          currentPage: startingPage,
          currentSurah: surah,
          navigationHistory: [...state.navigationHistory, state.currentPage],
        };
      }),

      goBack: () => set((state) => {
        if (state.navigationHistory.length === 0) return state;
        const history = [...state.navigationHistory];
        const previousPage = history.pop()!;
        return {
          currentPage: previousPage,
          navigationHistory: history,
        };
      }),

      nextPage: () => set((state) => {
        if (state.currentPage >= 604) return state;
        return {
          currentPage: state.currentPage + 1,
          navigationHistory: [...state.navigationHistory, state.currentPage],
        };
      }),

      previousPage: () => set((state) => {
        if (state.currentPage <= 1) return state;
        return {
          currentPage: state.currentPage - 1,
          navigationHistory: [...state.navigationHistory, state.currentPage],
        };
      }),
    }),
    {
      name: 'reader-storage',
    }
  )
);
