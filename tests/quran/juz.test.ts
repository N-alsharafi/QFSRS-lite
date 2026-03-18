import { describe, it, expect } from 'vitest';
import { getAllSurahs } from '@/lib/quran/metadata';

describe('Juz Information', () => {
  it('should have juz information for all surahs', () => {
    const surahs = getAllSurahs();
    
    // Check that all surahs have juz information
    surahs.forEach(surah => {
      expect(surah.juz).toBeDefined();
      expect(surah.juz).toBeGreaterThanOrEqual(1);
      expect(surah.juz).toBeLessThanOrEqual(30);
    });
  });

  it('should have correct juz for first surah', () => {
    const surahs = getAllSurahs();
    const fatiha = surahs[0];
    expect(fatiha.juz).toBe(1);
  });

  it('should have correct juz for Al-Kahf (Surah 18)', () => {
    const surahs = getAllSurahs();
    const kahf = surahs[17]; // Index 17 = Surah 18
    expect(kahf.juz).toBe(15);
  });

  it('should group surahs correctly by juz', () => {
    const surahs = getAllSurahs();
    const surahsByJuz: Record<number, typeof surahs> = {};
    
    surahs.forEach(surah => {
      if (!surahsByJuz[surah.juz]) {
        surahsByJuz[surah.juz] = [];
      }
      surahsByJuz[surah.juz].push(surah);
    });

    // Should have at least 25 Juz (some short surahs may share Juz)
    expect(Object.keys(surahsByJuz).length).toBeGreaterThanOrEqual(25);
    expect(Object.keys(surahsByJuz).length).toBeLessThanOrEqual(30);
    
    // Each Juz should have at least one surah
    Object.values(surahsByJuz).forEach(juzSurahs => {
      expect(juzSurahs.length).toBeGreaterThan(0);
    });
  });

  it('should have all 114 surahs distributed across juz', () => {
    const surahs = getAllSurahs();
    const surahsByJuz: Record<number, typeof surahs> = {};
    
    surahs.forEach(surah => {
      if (!surahsByJuz[surah.juz]) {
        surahsByJuz[surah.juz] = [];
      }
      surahsByJuz[surah.juz].push(surah);
    });

    const totalSurahs = Object.values(surahsByJuz).reduce((sum, juzSurahs) => sum + juzSurahs.length, 0);
    expect(totalSurahs).toBe(114);
  });
});
