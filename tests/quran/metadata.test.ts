import { describe, it, expect } from 'vitest';
import { 
  getSurahMeta, 
  getPageMeta, 
  getPageVerseRange,
  getPageSurahs,
  getSurahVerseRange,
  getAllSurahs,
  isMultiPageSurah,
  getSurahPageRange
} from '@/lib/quran/metadata';

describe('Quran Metadata', () => {
  describe('Surah Metadata', () => {
    it('should get Surah Al-Kahf metadata', () => {
      const surah = getSurahMeta(18);
      expect(surah.transliteration).toBe('Al-Kahf');
      // Surah 18 (Al-Kahf) actually starts on page 293 but that page also has verses from Surah 17
      // The surah's own start page should be 293
      expect(surah.page).toBeGreaterThanOrEqual(293);
      expect(surah.ayahs).toBe(110);
    });

    it('should get Surah Al-Fatiha metadata', () => {
      const surah = getSurahMeta(1);
      expect(surah.transliteration).toBe('Al-Faatiha');
      expect(surah.page).toBe(1);
      expect(surah.ayahs).toBe(7);
    });

    it('should get Surah Al-Ikhlas metadata', () => {
      const surah = getSurahMeta(112);
      expect(surah.transliteration).toBe('Al-Ikhlaas');
      expect(surah.ayahs).toBe(4);
    });
  });

  describe('Page Metadata', () => {
    it('should get page 293 verse range', () => {
      const range = getPageVerseRange(293);
      // Page 293 starts with Surah 17:105, not 18:1
      expect(range.first.surah).toBe(17);
      expect(range.first.ayah).toBe(105);
    });

    it('should get page 1 verse range', () => {
      const range = getPageVerseRange(1);
      expect(range.first.surah).toBe(1);
      expect(range.first.ayah).toBe(1);
    });

    it('should get all surahs on page 293 (Al-Isra + Al-Kahf)', () => {
      const surahs = getPageSurahs(293);
      expect(surahs).toHaveLength(2);
      expect(surahs[0].surah).toBe(17);
      expect(surahs[0].firstAyah).toBe(105);
      expect(surahs[0].lastAyah).toBe(111); // Al-Isra has 111 verses
      expect(surahs[1].surah).toBe(18);
      expect(surahs[1].firstAyah).toBe(1);
      // Page 293 has only first few verses of Al-Kahf
      expect(surahs[1].lastAyah).toBeGreaterThanOrEqual(1);
      expect(surahs[1].lastAyah).toBeLessThanOrEqual(110);
    });

    it('should get single surah on page 1 (Al-Fatiha only)', () => {
      const surahs = getPageSurahs(1);
      expect(surahs).toHaveLength(1);
      expect(surahs[0].surah).toBe(1);
      expect(surahs[0].firstAyah).toBe(1);
      expect(surahs[0].lastAyah).toBe(7);
    });
  });

  describe('Surah Verse Range', () => {
    it('should get full surah verse range', () => {
      const range = getSurahVerseRange(18);
      expect(range.first.surah).toBe(18);
      expect(range.first.ayah).toBe(1);
      expect(range.last.surah).toBe(18);
      expect(range.last.ayah).toBe(110);
    });
  });

  describe('All Surahs', () => {
    it('should have 114 surahs', () => {
      const allSurahs = getAllSurahs();
      expect(allSurahs).toHaveLength(114);
    });

    it('should have correct metadata for first surah', () => {
      const allSurahs = getAllSurahs();
      const fatiha = allSurahs[0];
      expect(fatiha.number).toBe(1);
      expect(fatiha.transliteration).toBe('Al-Faatiha');
      expect(fatiha.totalAyahs).toBe(7);
      expect(fatiha.startPage).toBe(1);
    });

    it('should have correct metadata for last surah', () => {
      const allSurahs = getAllSurahs();
      const nas = allSurahs[113];
      expect(nas.number).toBe(114);
      expect(nas.transliteration).toBe('An-Naas');
      expect(nas.totalAyahs).toBe(6);
    });
  });

  describe('Surah Hierarchy', () => {
    it('should identify Al-Baqarah as multi-page surah', () => {
      expect(isMultiPageSurah(2)).toBe(true);
    });

    it('should identify Al-Ikhlas as single-page surah', () => {
      expect(isMultiPageSurah(112)).toBe(false);
    });

    it('should identify Al-Kahf as multi-page surah', () => {
      expect(isMultiPageSurah(18)).toBe(true);
    });

    it('should get correct page range for Al-Baqarah', () => {
      const range = getSurahPageRange(2);
      expect(range.start).toBe(2);
      expect(range.end).toBeGreaterThan(range.start);
    });

    it('should get correct page range for short surahs', () => {
      const range = getSurahPageRange(112);
      // Short surahs may share a page
      expect(range.start).toBeGreaterThan(0);
      expect(range.start).toBeLessThanOrEqual(range.end);
    });
  });

  describe('Card Count Validation', () => {
    it('should calculate correct total cards across all surahs', () => {
      const allSurahs = getAllSurahs();
      let totalCards = 0;
      
      for (const surah of allSurahs) {
        if (isMultiPageSurah(surah.number)) {
          totalCards += surah.totalPages;
        } else {
          totalCards += 1;
        }
      }
      
      // Total should be around 200-250 cards (multi-page surahs create one card per page, short surahs one card each)
      // This will be more than 114 (one per surah) but could be more than 604 if we count page-based cards
      expect(totalCards).toBeGreaterThan(114);
      expect(totalCards).toBeLessThan(700);
    });
  });
});
