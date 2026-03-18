import { describe, it, expect, beforeEach } from 'vitest';
import { getJuzName, getHizbName } from '@/lib/quran/verseText';
import { getAllJuzWithSurahs, getAllHizbQuartersWithSurahs } from '@/lib/quran/metadata';
import type { RubAlHizbId } from 'quran-meta/hafs';

/**
 * Integration tests for SurahGrid component data flow
 * Tests the full pipeline: metadata -> verse text -> component data
 */
describe('SurahGrid Integration Tests', () => {
  describe('Juz data preparation (simulating juzProgress useLiveQuery)', () => {
    it('should load verse names for all 30 Juzs', async () => {
      const juzWithSurahs = getAllJuzWithSurahs();
      expect(juzWithSurahs.length).toBe(30);
      
      // Simulate what the component does
      const juzData = await Promise.all(
        juzWithSurahs.map(async (juz) => {
          const verseName = await getJuzName(juz.number);
          
          return {
            number: juz.number,
            startPage: juz.startPage,
            endPage: juz.endPage,
            verseName,
            totalCards: 0, // No cards in test
            masteredCards: 0,
            learningCards: 0,
            masteredPercent: 0,
            learningPercent: 0,
          };
        })
      );
      
      console.log('Sample Juz data:');
      juzData.slice(0, 5).forEach(juz => {
        console.log(`  Juz ${juz.number}: "${juz.verseName}"`);
      });
      
      // Verify all Juzs have verse names
      expect(juzData.length).toBe(30);
      juzData.forEach((juz, index) => {
        expect(juz.verseName).toBeTruthy();
        expect(juz.verseName).not.toBe(`Juz ${juz.number}`); // Should not be fallback
        expect(juz.number).toBe(index + 1);
      });
      
      // Verify uniqueness (except for potentially short verses)
      const uniqueNames = new Set(juzData.map(j => j.verseName));
      expect(uniqueNames.size).toBeGreaterThan(25); // Most should be unique
    });

    it('should have 4-word snippets for most Juzs', async () => {
      const juzWithSurahs = getAllJuzWithSurahs();
      
      const wordCounts = await Promise.all(
        juzWithSurahs.map(async (juz) => {
          const verseName = await getJuzName(juz.number);
          const words = verseName.split(/\s+/);
          return {
            juz: juz.number,
            wordCount: words.length,
            name: verseName
          };
        })
      );
      
      const fourWordJuzs = wordCounts.filter(j => j.wordCount === 4);
      const shorterJuzs = wordCounts.filter(j => j.wordCount < 4);
      
      console.log(`Juzs with 4 words: ${fourWordJuzs.length}/30`);
      console.log('Juzs with fewer than 4 words:', shorterJuzs);
      
      // Most Juzs should have 4 words
      expect(fourWordJuzs.length).toBeGreaterThan(25);
      
      // All should have at least 1 word
      wordCounts.forEach(j => {
        expect(j.wordCount).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('Hizb data preparation (simulating hizbProgress useLiveQuery)', () => {
    it('should load verse names for Hizb Quarters', async () => {
      const hizbsQuarter = getAllHizbQuartersWithSurahs();
      expect(hizbsQuarter.length).toBe(240);
      
      // Test first 10 for performance
      const testHizbs = hizbsQuarter.slice(0, 10);
      
      const hizbData = await Promise.all(
        testHizbs.map(async (hizb: any) => {
          const verseName = await getHizbName(hizb.quarterId as RubAlHizbId);
          
          return {
            number: hizb.number,
            startPage: hizb.startPage,
            endPage: hizb.endPage,
            verseName,
            totalCards: 0,
            masteredCards: 0,
            learningCards: 0,
            masteredPercent: 0,
            learningPercent: 0,
          };
        })
      );
      
      console.log('Sample Hizb Quarter data:');
      hizbData.forEach(hizb => {
        console.log(`  Hizb Quarter ${hizb.number}: "${hizb.verseName}"`);
      });
      
      // Verify all Hizbs have verse names
      expect(hizbData.length).toBe(10);
      hizbData.forEach(hizb => {
        expect(hizb.verseName).toBeTruthy();
        expect(hizb.verseName).not.toMatch(/Hizb Quarter/); // Should not be fallback
      });
    });
  });

  describe('getName function simulation', () => {
    it('should correctly format Juz display data', async () => {
      const juzWithSurahs = getAllJuzWithSurahs();
      const juz1 = juzWithSurahs[0];
      
      const verseName = await getJuzName(juz1.number);
      
      // Simulate the getName function logic for Juz
      const displayData = {
        arabic: verseName || `Juz ${juz1.number}`,
        transliteration: '', // Verse text is already in Arabic
      };
      
      console.log('Juz 1 display data:', displayData);
      
      // Check structure rather than exact text (Unicode normalization issues)
      expect(displayData.arabic).toBeTruthy();
      expect(displayData.arabic).not.toBe('Juz 1'); // Should not be fallback
      expect(displayData.arabic.length).toBeGreaterThan(15); // Reasonable Arabic text length
      expect(displayData.transliteration).toBe('');
    });

    it('should correctly format Hizb display data', async () => {
      const hizbsQuarter = getAllHizbQuartersWithSurahs();
      const hizb1 = hizbsQuarter[0];
      
      const verseName = await getHizbName(hizb1.quarterId as RubAlHizbId);
      
      // Simulate the getName function logic for Hizb
      const displayData = {
        arabic: verseName || `Hizb Quarter ${hizb1.number}`,
        transliteration: '',
      };
      
      console.log('Hizb Quarter 1 display data:', displayData);
      
      // Check structure rather than exact text (Unicode normalization issues)
      expect(displayData.arabic).toBeTruthy();
      expect(displayData.arabic).not.toMatch(/Hizb Quarter/); // Should not be fallback
      expect(displayData.arabic.length).toBeGreaterThan(15); // Reasonable Arabic text length
      expect(displayData.transliteration).toBe('');
    });
  });

  describe('Card rendering structure', () => {
    it('should have correct structure for Juz cards', async () => {
      const verseName = await getJuzName(1);
      const juzNumber = 1;
      
      // Simulate card structure
      const cardData = {
        type: 'juz',
        number: juzNumber,
        arabic: verseName,
        label: `Juz ${juzNumber}`,
        pageRange: '1-21',
      };
      
      console.log('Juz card structure:', cardData);
      
      // Verify structure matches component expectations
      expect(cardData.arabic).toBeTruthy(); // Should have Arabic verse text on top
      expect(cardData.label).toBe('Juz 1'); // Should have label below
      expect(cardData.arabic).not.toBe(cardData.label); // Arabic and label should be different
    });

    it('should have correct structure for Hizb cards', async () => {
      const verseName = await getHizbName(1 as RubAlHizbId);
      const hizbNumber = 1;
      
      // Simulate card structure
      const cardData = {
        type: 'hizb-quarter',
        number: hizbNumber,
        arabic: verseName,
        label: `Hizb Quarter ${hizbNumber}`,
        pageRange: '1-5',
      };
      
      console.log('Hizb card structure:', cardData);
      
      // Verify structure matches component expectations
      expect(cardData.arabic).toBeTruthy(); // Should have Arabic verse text on top
      expect(cardData.label).toBe('Hizb Quarter 1'); // Should have label below
      expect(cardData.arabic).not.toBe(cardData.label); // Arabic and label should be different
    });
  });

  describe('Juz vs Hizb consistency', () => {
    it('Juz 1 and Hizb Quarter 1 should display same verse (both start at 1:1)', async () => {
      const juzName = await getJuzName(1);
      const hizbName = await getHizbName(1 as RubAlHizbId);
      
      console.log('Juz 1 arabic:', juzName);
      console.log('Hizb Quarter 1 arabic:', hizbName);
      
      expect(juzName).toBe(hizbName);
    });

    it('Juz 2 and Hizb Quarter 9 should display same verse (both start at 2:142)', async () => {
      const juzName = await getJuzName(2);
      const hizbName = await getHizbName(9 as RubAlHizbId);
      
      console.log('Juz 2 arabic:', juzName);
      console.log('Hizb Quarter 9 arabic:', hizbName);
      
      expect(juzName).toBe(hizbName);
    });
  });
});
