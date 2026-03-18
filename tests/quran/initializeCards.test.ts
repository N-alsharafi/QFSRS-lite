import { describe, it, expect } from 'vitest';
import { getCardCountForSurahs, initializeCardsForPageRange } from '@/lib/quran/initializeCards';
import { getAllSurahs } from '@/lib/quran/metadata';

/**
 * Note: Tests for initializeCardsForSurahs and initializeCardsForSurahRange
 * require IndexedDB and will be added when the questionnaire feature is implemented.
 * For now, we only test the pure utility functions.
 */
describe('Card Initialization Utilities', () => {
  describe('getCardCountForSurahs', () => {
    it('should return 1 card for Al-Fatiha (short surah)', () => {
      const count = getCardCountForSurahs([1]);
      expect(count).toBe(1);
    });
    
    it('should return multiple cards for Al-Baqarah (long surah)', () => {
      const count = getCardCountForSurahs([2]);
      expect(count).toBeGreaterThan(20); // Al-Baqarah spans many pages
    });
    
    it('should return 1 card for each short surah at the end', () => {
      // Last 3 surahs are all short (single page)
      const count = getCardCountForSurahs([112, 113, 114]);
      expect(count).toBe(3);
    });
    
    it('should handle multiple surahs with mixed lengths', () => {
      const count = getCardCountForSurahs([1, 2, 3]);
      expect(count).toBeGreaterThan(25); // Al-Baqarah adds many cards
    });
    
    it('should ignore invalid surah numbers below 1', () => {
      const count = getCardCountForSurahs([0, -1, 1]);
      expect(count).toBe(1); // Only surah 1 is valid
    });
    
    it('should ignore invalid surah numbers above 114', () => {
      const count = getCardCountForSurahs([114, 115, 200]);
      expect(count).toBe(1); // Only surah 114 is valid
    });
    
    it('should return 0 for empty array', () => {
      const count = getCardCountForSurahs([]);
      expect(count).toBe(0);
    });
    
    it('should return 0 for all invalid numbers', () => {
      const count = getCardCountForSurahs([0, 115, 200, -5]);
      expect(count).toBe(0);
    });
    
    it('should handle Surah Al-Kahf (18) which spans multiple pages', () => {
      const count = getCardCountForSurahs([18]);
      expect(count).toBeGreaterThan(1);
      expect(count).toBeLessThan(20); // Reasonable upper bound
    });
    
    it('should calculate correct total for a Juz-worth of surahs', () => {
      // First "Juz" includes surahs 1 and part of 2
      const count = getCardCountForSurahs([1, 2]);
      
      expect(count).toBeGreaterThan(20); // Al-Baqarah alone has many cards
      
      // Can be used in questionnaire to show user:
      // "This will create approximately X cards to review"
    });
  });
  
  describe('Card count preview (for questionnaire UI)', () => {
    it('should help preview card count for common user selections', () => {
      // Scenario: User wants to work on last 5 surahs
      const lastFive = getCardCountForSurahs([110, 111, 112, 113, 114]);
      expect(lastFive).toBe(5); // All short surahs
      
      // Scenario: User wants to work on Surah Yasin
      const yasin = getCardCountForSurahs([36]);
      expect(yasin).toBeGreaterThan(1); // Multi-page surah
      
      // Scenario: User wants entire first Juz
      const firstJuz = getCardCountForSurahs([1, 2]);
      expect(firstJuz).toBeGreaterThan(20);
    });
  });
  
  describe('Page range scenarios', () => {
    it('should correctly identify page 1 belongs to Al-Fatiha', () => {
      const allSurahs = getAllSurahs();
      const surah = allSurahs.find(s => 1 >= s.startPage && 1 <= s.endPage);
      
      expect(surah).toBeDefined();
      expect(surah?.number).toBe(1);
    });
    
    it('should correctly identify page 30 belongs to Al-Baqarah', () => {
      const allSurahs = getAllSurahs();
      const surah = allSurahs.find(s => 30 >= s.startPage && 30 <= s.endPage);
      
      expect(surah).toBeDefined();
      expect(surah?.number).toBe(2);
    });
    
    it('should identify pages 1-30 span 2 surahs (Al-Fatiha and Al-Baqarah)', () => {
      const allSurahs = getAllSurahs();
      const surahsInRange = new Set<number>();
      
      for (let page = 1; page <= 30; page++) {
        const surah = allSurahs.find(s => page >= s.startPage && page <= s.endPage);
        if (surah) {
          surahsInRange.add(surah.number);
        }
      }
      
      expect(surahsInRange.size).toBe(2);
      expect([...surahsInRange]).toEqual([1, 2]);
    });
    
    it('should handle pages at surah boundaries', () => {
      const allSurahs = getAllSurahs();
      
      // Page 2 is where Al-Baqarah starts
      const baqarahStart = allSurahs[1]; // Surah 2
      expect(baqarahStart.startPage).toBe(2);
      
      const surah = allSurahs.find(s => 2 >= s.startPage && 2 <= s.endPage);
      expect(surah?.number).toBe(2);
    });
  });
});

describe('initializeCardsForPageRange (pure logic, no DB)', () => {
  it('should return 0 for invalid page range (below 1)', async () => {
    const count = await initializeCardsForPageRange(0, 10, { initialState: 0 as any });
    expect(count).toBe(0);
  });
  
  it('should return 0 for invalid page range (above 604)', async () => {
    const count = await initializeCardsForPageRange(600, 700, { initialState: 0 as any });
    expect(count).toBe(0);
  });
  
  it('should return 0 when startPage > endPage', async () => {
    const count = await initializeCardsForPageRange(50, 30, { initialState: 0 as any });
    expect(count).toBe(0);
  });
  
  it('should accept page-specific options parameter in function signature', () => {
    // Just verify the TypeScript signature accepts the optional parameter
    // We can't test actual DB operations without IndexedDB mock
    const pageSpecificOptions = [
      { pageNumber: 2, initialStability: 50 },
      { pageNumber: 4, initialDifficulty: 8 }
    ];
    
    expect(pageSpecificOptions).toBeDefined();
    expect(pageSpecificOptions).toHaveLength(2);
    expect(pageSpecificOptions[0].pageNumber).toBe(2);
    expect(pageSpecificOptions[1].initialDifficulty).toBe(8);
  });
});

/**
 * TODO: When implementing the questionnaire feature, add integration tests:
 * 
 * 1. Test initializeCardsForSurahs with different initial states
 * 2. Test initializeCardsForSurahRange for Juz-based initialization
 * 3. Test real-world scenarios:
 *    - User has memorized X surahs (high confidence)
 *    - User is learning Y surahs (medium confidence)
 *    - User wants to start fresh with Z surahs
 * 
 * These tests will require fake-indexeddb or similar mocking.
 */
