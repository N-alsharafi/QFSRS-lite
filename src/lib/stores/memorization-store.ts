import { create } from 'zustand';
import { useSRSStore } from './srs-store';

/**
 * Memorization Store - Manages Hidden Mode and word peek functionality
 * 
 * **NOTE: This is for Phase 2 (Future Feature)**
 * MVP Phase 1 does NOT use this store. In MVP, users recite from pure memory
 * with no visual display at all. This store will be used later when we implement
 * the page layout where users can see Quran text and toggle hidden mode.
 * 
 * Phase 1 (MVP): Blind recitation prompt → self-report → grade
 * Phase 2 (Later): Display text → Hidden Mode → Peek words → grade
 * 
 * Integrates with SRSStore to track peek counts for review sessions
 */
interface MemorizationState {
  /** Whether Hidden Mode is active (all text masked) */
  isHiddenMode: boolean;
  
  /** Set of word IDs that are currently visible (peeked) */
  visibleWordIds: Set<string>;
  
  /** Map of timers for auto-hiding peeked words after 5 seconds */
  peekTimers: Map<string, NodeJS.Timeout>;
  
  /** Toggle Hidden Mode on/off */
  toggleHiddenMode: () => void;
  
  /** Reveal a word for specified duration (default 5000ms) and track in SRS */
  peekWord: (wordId: string, duration?: number) => void;
  
  /** Manually hide a word before timer expires */
  hideWord: (wordId: string) => void;
  
  /** Clear all peeked words and timers */
  clearAllPeeks: () => void;
}

export const useMemorizationStore = create<MemorizationState>((set, get) => ({
  isHiddenMode: false,
  visibleWordIds: new Set<string>(),
  peekTimers: new Map<string, NodeJS.Timeout>(),

  toggleHiddenMode: () => set((state) => ({
    isHiddenMode: !state.isHiddenMode,
  })),

  peekWord: (wordId: string, duration = 5000) => {
    const state = get();
    
    // Clear existing timer if word is already peeked
    if (state.peekTimers.has(wordId)) {
      clearTimeout(state.peekTimers.get(wordId)!);
    }

    // Add word to visible set
    const newVisibleWordIds = new Set(state.visibleWordIds);
    const isNewPeek = !newVisibleWordIds.has(wordId);
    newVisibleWordIds.add(wordId);

    // Record peek in SRS store (only for new peeks, not re-peeks)
    if (isNewPeek) {
      useSRSStore.getState().recordPeek();
    }

    // Set timer to auto-hide after duration (5 seconds by default)
    const timer = setTimeout(() => {
      set((state) => {
        const updatedVisibleWordIds = new Set(state.visibleWordIds);
        updatedVisibleWordIds.delete(wordId);
        const updatedTimers = new Map(state.peekTimers);
        updatedTimers.delete(wordId);
        return {
          visibleWordIds: updatedVisibleWordIds,
          peekTimers: updatedTimers,
        };
      });
    }, duration);

    const newTimers = new Map(state.peekTimers);
    newTimers.set(wordId, timer);

    set({
      visibleWordIds: newVisibleWordIds,
      peekTimers: newTimers,
    });
  },

  hideWord: (wordId: string) => {
    const state = get();
    
    // Clear timer if exists
    if (state.peekTimers.has(wordId)) {
      clearTimeout(state.peekTimers.get(wordId)!);
    }

    // Remove word from visible set
    const newVisibleWordIds = new Set(state.visibleWordIds);
    newVisibleWordIds.delete(wordId);
    const newTimers = new Map(state.peekTimers);
    newTimers.delete(wordId);

    set({
      visibleWordIds: newVisibleWordIds,
      peekTimers: newTimers,
    });
  },

  clearAllPeeks: () => {
    const state = get();
    
    // Clear all timers
    state.peekTimers.forEach((timer) => clearTimeout(timer));

    set({
      visibleWordIds: new Set<string>(),
      peekTimers: new Map<string, NodeJS.Timeout>(),
    });
  },
}));
