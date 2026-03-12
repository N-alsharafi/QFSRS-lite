import { create } from 'zustand';

/**
 * SRS Store - Session metrics tracking for review sessions
 * Tracks disfluencies according to the manual grading rubric
 */
interface SRSState {
  sessionStartTime: Date | null;
  reviewCount: number;
  
  /** Lapses/Forgets - Total blackout, prompt required (10+ penalty points → Grade 1: Again) */
  forgetCount: number;
  
  /** Major Mistakes - Meaning altered, multiple hesitations (5 penalty points → Grade 2: Hard) */
  majorMistakeCount: number;
  
  /** Minor Stutters/Hesitations - Correct with 1-2 minor slips (1 penalty point → Grade 3: Good) */
  hesitationCount: number;
  
  /** Word Peeks - Number of times user clicked to reveal a hidden word */
  peekCount: number;
  
  /** Total penalty points accumulated in this session */
  totalPenaltyPoints: number;
  
  startSession: () => void;
  endSession: () => void;
  
  /** Record a complete forget/lapse (5 penalty points) */
  recordForget: () => void;
  
  /** Record a major mistake (4 penalty points) */
  recordMajorMistake: () => void;
  
  /** Record a minor hesitation/stutter (1 penalty point) */
  recordHesitation: () => void;
  
  /** Record a word peek (no penalty points, but tracked for awareness) */
  recordPeek: () => void;
  
  /** Record a completed review */
  recordReview: () => void;
  
  /** Reset all session metrics */
  resetSession: () => void;
  
  /** Get session duration in milliseconds */
  getSessionDuration: () => number;
  
  /** Calculate total penalty points based on disfluencies */
  calculatePenaltyPoints: () => number;
  
  /** Get suggested FSRS grade based on penalty points */
  getSuggestedGrade: () => 1 | 2 | 3 | 4;
}

export const useSRSStore = create<SRSState>((set, get) => ({
  sessionStartTime: null,
  reviewCount: 0,
  forgetCount: 0,
  majorMistakeCount: 0,
  hesitationCount: 0,
  peekCount: 0,
  totalPenaltyPoints: 0,

  startSession: () => set({
    sessionStartTime: new Date(),
    reviewCount: 0,
    forgetCount: 0,
    majorMistakeCount: 0,
    hesitationCount: 0,
    peekCount: 0,
    totalPenaltyPoints: 0,
  }),

  endSession: () => set({
    sessionStartTime: null,
  }),

  recordForget: () => set((state) => {
    const newForgetCount = state.forgetCount + 1;
    const newPenalty = get().calculatePenaltyPoints();
    return {
      forgetCount: newForgetCount,
      totalPenaltyPoints: newPenalty,
    };
  }),

  recordMajorMistake: () => set((state) => {
    const newMajorCount = state.majorMistakeCount + 1;
    const newPenalty = get().calculatePenaltyPoints();
    return {
      majorMistakeCount: newMajorCount,
      totalPenaltyPoints: newPenalty,
    };
  }),

  recordHesitation: () => set((state) => {
    const newHesitationCount = state.hesitationCount + 1;
    const newPenalty = get().calculatePenaltyPoints();
    return {
      hesitationCount: newHesitationCount,
      totalPenaltyPoints: newPenalty,
    };
  }),

  recordPeek: () => set((state) => ({
    peekCount: state.peekCount + 1,
  })),

  recordReview: () => set((state) => ({
    reviewCount: state.reviewCount + 1,
  })),

  resetSession: () => set({
    sessionStartTime: null,
    reviewCount: 0,
    forgetCount: 0,
    majorMistakeCount: 0,
    hesitationCount: 0,
    peekCount: 0,
    totalPenaltyPoints: 0,
  }),

  getSessionDuration: () => {
    const state = get();
    if (!state.sessionStartTime) return 0;
    return Date.now() - state.sessionStartTime.getTime();
  },

  calculatePenaltyPoints: () => {
    const state = get();
    return (
      state.forgetCount * 5 +        // Lapses: 5 points each
      state.majorMistakeCount * 4 +   // Major mistakes: 4 points each
      state.hesitationCount * 1       // Minor stutters: 1 point each
    );
  },

  getSuggestedGrade: () => {
    const penalty = get().calculatePenaltyPoints();
    
    // Manual Grading Rubric:
    // 10+ points = Grade 1 (Again) - Forgot/Lapsed
    // 6-9 points = Grade 2 (Hard) - Major mistakes
    // 3-5 points = Grade 3 (Good) - Minor stutters
    // 0 points = Grade 4 (Easy) - Perfect recall
    
    if (penalty >= 10) return 1; // Again
    if (penalty >= 6) return 2;  // Hard
    if (penalty >= 3) return 3;  // Good
    return 4;                     // Easy
  },
}));
