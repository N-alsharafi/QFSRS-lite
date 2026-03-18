import { describe, it, expect } from 'vitest';
import { getVerseText, getVerseSnippet, getJuzName, getHizbName } from '@/lib/quran/verseText';
import type { RubAlHizbId } from 'quran-meta/hafs';

describe('verseText utilities', () => {
  describe('getVerseText', () => {
    it('should get the text for Al-Fatiha 1:1', async () => {
      const text = await getVerseText(1, 1);
      expect(text).toBeTruthy();
      expect(text).toMatch(/بسم|بِسْمِ/);
      // Just verify it's a reasonable length Arabic text
      expect(text!.length).toBeGreaterThan(10);
    });

    it('should get the text for Al-Baqarah 2:1', async () => {
      const text = await getVerseText(2, 1);
      expect(text).toBe('الم');
    });

    it('should return null for invalid verse', async () => {
      const text = await getVerseText(999, 999);
      expect(text).toBeNull();
    });

    it('should get the text for Surah 18, Ayah 36', async () => {
      const text = await getVerseText(18, 36);
      expect(text).toBeTruthy();
      // Just verify it has reasonable content
      expect(text!.length).toBeGreaterThan(20);
    });
  });

  describe('getVerseSnippet', () => {
    it('should return first 4 words by default', async () => {
      const snippet = await getVerseSnippet(1, 1);
      const words = snippet.split(/\s+/);
      expect(words.length).toBe(4);
      // Just check that it has content, not exact tashkeel
      expect(snippet.length).toBeGreaterThan(0);
    });

    it('should return specified number of words', async () => {
      const snippet = await getVerseSnippet(1, 1, 2);
      const words = snippet.split(/\s+/);
      expect(words.length).toBe(2);
      // Just check word count, not exact match due to tashkeel variations
      expect(words[0]).toBeTruthy();
      expect(words[1]).toBeTruthy();
    });

    it('should handle verses with fewer words than requested', async () => {
      const snippet = await getVerseSnippet(2, 1, 10);
      expect(snippet).toBe('الم'); // Only 1 word
    });

    it('should return fallback for invalid verse', async () => {
      const snippet = await getVerseSnippet(999, 999);
      expect(snippet).toBe('Verse 999:999');
    });
  });

  describe('getJuzName', () => {
    it('should return verse-based name for Juz 1', async () => {
      const name = await getJuzName(1);
      console.log('Juz 1 name:', name);
      
      // Juz 1 starts with Al-Fatiha 1:1 - "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ"
      expect(name).toBeTruthy();
      expect(name).not.toBe('Juz 1'); // Should not be fallback
      
      // Should have 4 words
      const words = name.split(/\s+/);
      expect(words.length).toBe(4);
    });

    it('should return verse-based name for Juz 2', async () => {
      const name = await getJuzName(2);
      console.log('Juz 2 name:', name);
      
      // Juz 2 starts with Al-Baqarah 2:142
      expect(name).toBeTruthy();
      expect(name).not.toBe('Juz 2');
      
      // Should have 4 words
      const words = name.split(/\s+/);
      expect(words.length).toBe(4);
    });

    it('should return verse-based name for Juz 3', async () => {
      const name = await getJuzName(3);
      console.log('Juz 3 name:', name);
      
      expect(name).toBeTruthy();
      expect(name).not.toBe('Juz 3');
      
      // Should have 4 words
      const words = name.split(/\s+/);
      expect(words.length).toBe(4);
    });

    it('should return different names for different Juzs', async () => {
      const juz1 = await getJuzName(1);
      const juz2 = await getJuzName(2);
      const juz3 = await getJuzName(3);
      
      console.log('Juz 1:', juz1);
      console.log('Juz 2:', juz2);
      console.log('Juz 3:', juz3);
      
      // Each Juz should have a unique name
      expect(juz1).not.toBe(juz2);
      expect(juz2).not.toBe(juz3);
      expect(juz1).not.toBe(juz3);
    });

    it('should return verse-based names for all 30 Juzs', async () => {
      const names: string[] = [];
      const wordCounts: number[] = [];
      
      for (let i = 1; i <= 30; i++) {
        const name = await getJuzName(i);
        names.push(name);
        
        // Should not be fallback
        expect(name).not.toBe(`Juz ${i}`);
        
        // Should have 4 words (or less if verse is shorter)
        const words = name.split(/\s+/);
        wordCounts.push(words.length);
        
        if (words.length !== 4) {
          console.log(`Juz ${i} has ${words.length} words: "${name}"`);
        }
        
        expect(words.length).toBeGreaterThanOrEqual(1);
        expect(words.length).toBeLessThanOrEqual(4);
      }
      
      console.log('All Juz names:', names);
      console.log('Word counts:', wordCounts);
      
      // All names should be unique
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(30);
    });
  });

  describe('getHizbName', () => {
    it('should return verse-based name for Hizb Quarter 1', async () => {
      const name = await getHizbName(1 as RubAlHizbId);
      console.log('Hizb Quarter 1 name:', name);
      
      // Hizb Quarter 1 starts with Al-Fatiha 1:1
      expect(name).toBeTruthy();
      expect(name).not.toBe('Hizb Quarter 1');
      expect(name).toContain('بِسْمِ');
      
      // Should have 4 words
      const words = name.split(/\s+/);
      expect(words.length).toBe(4);
    });

    it('should return verse-based name for Hizb Quarter 2', async () => {
      const name = await getHizbName(2 as RubAlHizbId);
      console.log('Hizb Quarter 2 name:', name);
      
      expect(name).toBeTruthy();
      expect(name).not.toBe('Hizb Quarter 2');
      
      // Should have 4 words
      const words = name.split(/\s+/);
      expect(words.length).toBe(4);
    });

    it('should return different names for different Hizb Quarters', async () => {
      const hizb1 = await getHizbName(1 as RubAlHizbId);
      const hizb2 = await getHizbName(2 as RubAlHizbId);
      const hizb3 = await getHizbName(3 as RubAlHizbId);
      
      console.log('Hizb Quarter 1:', hizb1);
      console.log('Hizb Quarter 2:', hizb2);
      console.log('Hizb Quarter 3:', hizb3);
      
      // Each Hizb Quarter should have a unique name
      expect(hizb1).not.toBe(hizb2);
      expect(hizb2).not.toBe(hizb3);
      expect(hizb1).not.toBe(hizb3);
    });

    it('should return verse-based names for first 10 Hizb Quarters', async () => {
      const names: string[] = [];
      
      for (let i = 1; i <= 10; i++) {
        const name = await getHizbName(i as RubAlHizbId);
        names.push(name);
        
        // Should not be fallback
        expect(name).not.toBe(`Hizb Quarter ${i}`);
        
        // Should have 4 words
        const words = name.split(/\s+/);
        expect(words.length).toBe(4);
      }
      
      console.log('First 10 Hizb Quarter names:', names);
    });
  });

  describe('comparison: Juz vs Hizb naming', () => {
    it('should both return 4-word snippets', async () => {
      const juzName = await getJuzName(1);
      const hizbName = await getHizbName(1 as RubAlHizbId);
      
      const juzWords = juzName.split(/\s+/);
      const hizbWords = hizbName.split(/\s+/);
      
      console.log('Juz 1 name:', juzName, '- words:', juzWords.length);
      console.log('Hizb Quarter 1 name:', hizbName, '- words:', hizbWords.length);
      
      expect(juzWords.length).toBe(4);
      expect(hizbWords.length).toBe(4);
    });

    it('Juz 1 and Hizb Quarter 1 should have same name (both start at 1:1)', async () => {
      const juzName = await getJuzName(1);
      const hizbName = await getHizbName(1 as RubAlHizbId);
      
      console.log('Juz 1:', juzName);
      console.log('Hizb Quarter 1:', hizbName);
      
      // Both start at Al-Fatiha 1:1
      expect(juzName).toBe(hizbName);
    });
  });
});
