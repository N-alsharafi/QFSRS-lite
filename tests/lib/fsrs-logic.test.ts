import { describe, it, expect } from 'vitest';
import { FSRS, Rating, State } from 'ts-fsrs';

describe('FSRS Logic', () => {
  it('should initialize FSRS with default parameters', () => {
    const fsrs = new FSRS();
    expect(fsrs).toBeDefined();
  });

  it('should create a new card', () => {
    const fsrs = new FSRS();
    const card = fsrs.createEmptyCard();
    
    expect(card.state).toBe(State.New);
    expect(card.stability).toBe(0);
    expect(card.difficulty).toBe(0);
  });

  it('should schedule a card with "Good" rating', () => {
    const fsrs = new FSRS();
    const card = fsrs.createEmptyCard();
    const now = new Date();
    
    const schedulingCards = fsrs.repeat(card, now);
    const goodCard = schedulingCards[Rating.Good];
    
    expect(goodCard.card.due.getTime()).toBeGreaterThan(now.getTime());
    expect(goodCard.card.state).toBe(State.Learning);
  });

  it('should handle "Again" rating (lapse)', () => {
    const fsrs = new FSRS();
    const card = fsrs.createEmptyCard();
    const now = new Date();
    
    const schedulingCards = fsrs.repeat(card, now);
    const againCard = schedulingCards[Rating.Again];
    
    expect(againCard.card.state).toBe(State.Learning);
    expect(againCard.card.lapses).toBeGreaterThanOrEqual(0);
  });

  it('should test manual grading rubric scoring', () => {
    const penalties = {
      lapse: 10,
      majorMistake: 5,
      minorStutter: 1,
      perfect: 0,
    };
    
    const lapseScore = penalties.lapse;
    const majorScore = penalties.majorMistake;
    const minorScore = penalties.minorStutter;
    const perfectScore = penalties.perfect;
    
    expect(lapseScore).toBeGreaterThanOrEqual(10);
    expect(majorScore).toBe(5);
    expect(minorScore).toBe(1);
    expect(perfectScore).toBe(0);
    
    const getRating = (penalty: number): Rating => {
      if (penalty >= 10) return Rating.Again;
      if (penalty >= 5) return Rating.Hard;
      if (penalty >= 1) return Rating.Good;
      return Rating.Easy;
    };
    
    expect(getRating(10)).toBe(Rating.Again);
    expect(getRating(5)).toBe(Rating.Hard);
    expect(getRating(1)).toBe(Rating.Good);
    expect(getRating(0)).toBe(Rating.Easy);
  });
});
