import { describe, it, expect, beforeEach } from 'vitest';
import { useSRSStore } from '@/lib/stores/srs-store';

describe('SRSStore', () => {
  beforeEach(() => {
    useSRSStore.getState().resetSession();
  });

  it('should initialize with default values', () => {
    const state = useSRSStore.getState();
    expect(state.sessionStartTime).toBeNull();
    expect(state.reviewCount).toBe(0);
    expect(state.forgetCount).toBe(0);
    expect(state.majorMistakeCount).toBe(0);
    expect(state.hesitationCount).toBe(0);
    expect(state.peekCount).toBe(0);
    expect(state.totalPenaltyPoints).toBe(0);
  });

  it('should start a session with timestamp', () => {
    const { startSession } = useSRSStore.getState();
    startSession();
    
    const state = useSRSStore.getState();
    expect(state.sessionStartTime).toBeInstanceOf(Date);
    expect(state.reviewCount).toBe(0);
    expect(state.forgetCount).toBe(0);
  });

  it('should end a session', () => {
    const { startSession, endSession } = useSRSStore.getState();
    startSession();
    endSession();
    
    const state = useSRSStore.getState();
    expect(state.sessionStartTime).toBeNull();
  });

  describe('Disfluency Tracking', () => {
    it('should record forgets with 10 penalty points each', () => {
      const { recordForget } = useSRSStore.getState();
      
      recordForget();
      let state = useSRSStore.getState();
      expect(state.forgetCount).toBe(1);
      expect(state.totalPenaltyPoints).toBe(10);
      
      recordForget();
      state = useSRSStore.getState();
      expect(state.forgetCount).toBe(2);
      expect(state.totalPenaltyPoints).toBe(20);
    });

    it('should record major mistakes with 5 penalty points each', () => {
      const { recordMajorMistake } = useSRSStore.getState();
      
      recordMajorMistake();
      let state = useSRSStore.getState();
      expect(state.majorMistakeCount).toBe(1);
      expect(state.totalPenaltyPoints).toBe(5);
      
      recordMajorMistake();
      state = useSRSStore.getState();
      expect(state.majorMistakeCount).toBe(2);
      expect(state.totalPenaltyPoints).toBe(10);
    });

    it('should record hesitations with 1 penalty point each', () => {
      const { recordHesitation } = useSRSStore.getState();
      
      recordHesitation();
      let state = useSRSStore.getState();
      expect(state.hesitationCount).toBe(1);
      expect(state.totalPenaltyPoints).toBe(1);
      
      recordHesitation();
      recordHesitation();
      state = useSRSStore.getState();
      expect(state.hesitationCount).toBe(3);
      expect(state.totalPenaltyPoints).toBe(3);
    });

    it('should record peeks without penalty points', () => {
      const { recordPeek } = useSRSStore.getState();
      
      recordPeek();
      recordPeek();
      recordPeek();
      
      const state = useSRSStore.getState();
      expect(state.peekCount).toBe(3);
      expect(state.totalPenaltyPoints).toBe(0);
    });

    it('should calculate combined penalty points correctly', () => {
      const { recordForget, recordMajorMistake, recordHesitation } = useSRSStore.getState();
      
      recordForget();        // 10 points
      recordMajorMistake();  // 5 points
      recordHesitation();    // 1 point
      recordHesitation();    // 1 point
      
      const state = useSRSStore.getState();
      expect(state.totalPenaltyPoints).toBe(17);
    });
  });

  describe('FSRS Grade Suggestion', () => {
    it('should suggest Grade 4 (Easy) for perfect recall (0 points)', () => {
      const { getSuggestedGrade } = useSRSStore.getState();
      expect(getSuggestedGrade()).toBe(4);
    });

    it('should suggest Grade 3 (Good) for minor stutters (1-4 points)', () => {
      const { recordHesitation, getSuggestedGrade } = useSRSStore.getState();
      
      recordHesitation(); // 1 point
      expect(getSuggestedGrade()).toBe(3);
      
      recordHesitation(); // 2 points
      expect(getSuggestedGrade()).toBe(3);
      
      recordHesitation(); // 3 points
      expect(getSuggestedGrade()).toBe(3);
      
      recordHesitation(); // 4 points
      expect(getSuggestedGrade()).toBe(3);
    });

    it('should suggest Grade 2 (Hard) for major mistakes (5-9 points)', () => {
      const { recordMajorMistake, recordHesitation, getSuggestedGrade } = useSRSStore.getState();
      
      recordMajorMistake(); // 5 points
      expect(getSuggestedGrade()).toBe(2);
      
      recordHesitation(); // 6 points total
      expect(getSuggestedGrade()).toBe(2);
      
      recordHesitation(); // 7 points
      recordHesitation(); // 8 points
      recordHesitation(); // 9 points
      expect(getSuggestedGrade()).toBe(2);
    });

    it('should suggest Grade 1 (Again) for lapses (10+ points)', () => {
      const { recordForget, recordMajorMistake, getSuggestedGrade } = useSRSStore.getState();
      
      recordForget(); // 10 points
      expect(getSuggestedGrade()).toBe(1);
      
      // Test mixed disfluencies totaling 10+
      useSRSStore.getState().resetSession();
      recordMajorMistake(); // 5 points
      recordMajorMistake(); // 10 points total
      expect(getSuggestedGrade()).toBe(1);
    });
  });

  it('should record completed reviews', () => {
    const { recordReview } = useSRSStore.getState();
    
    recordReview();
    recordReview();
    recordReview();
    
    const state = useSRSStore.getState();
    expect(state.reviewCount).toBe(3);
  });

  it('should calculate session duration', async () => {
    const { startSession, getSessionDuration } = useSRSStore.getState();
    
    startSession();
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const duration = getSessionDuration();
    expect(duration).toBeGreaterThan(90); // At least 90ms
    expect(duration).toBeLessThan(200);   // Less than 200ms
  });

  it('should reset all session metrics', () => {
    const { 
      startSession, 
      recordForget, 
      recordMajorMistake, 
      recordHesitation, 
      recordPeek,
      recordReview,
      resetSession 
    } = useSRSStore.getState();
    
    startSession();
    recordForget();
    recordMajorMistake();
    recordHesitation();
    recordPeek();
    recordReview();
    
    resetSession();
    
    const state = useSRSStore.getState();
    expect(state.sessionStartTime).toBeNull();
    expect(state.reviewCount).toBe(0);
    expect(state.forgetCount).toBe(0);
    expect(state.majorMistakeCount).toBe(0);
    expect(state.hesitationCount).toBe(0);
    expect(state.peekCount).toBe(0);
    expect(state.totalPenaltyPoints).toBe(0);
  });

  it('should maintain accurate penalty points after reset', () => {
    const { recordForget, recordMajorMistake, resetSession, calculatePenaltyPoints } = useSRSStore.getState();
    
    recordForget();        // 10 points
    recordMajorMistake();  // 15 points total
    expect(calculatePenaltyPoints()).toBe(15);
    
    resetSession();
    expect(calculatePenaltyPoints()).toBe(0);
    
    recordMajorMistake();  // 5 points
    expect(calculatePenaltyPoints()).toBe(5);
  });
});
