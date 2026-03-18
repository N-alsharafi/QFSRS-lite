import { describe, it, expect } from 'vitest';
import { getAllJuzWithSurahs } from '@/lib/quran/metadata';

describe('Juz Hierarchy', () => {
  it('should have all 30 Juz', () => {
    const juzList = getAllJuzWithSurahs();
    expect(juzList).toHaveLength(30);
  });

  it('should have surahs in each Juz', () => {
    const juzList = getAllJuzWithSurahs();
    
    juzList.forEach(juz => {
      expect(juz.surahs.length).toBeGreaterThan(0);
      expect(juz.startPage).toBeDefined();
      expect(juz.endPage).toBeDefined();
    });
  });

  it('should show Al-Baqarah in multiple Juz', () => {
    const juzList = getAllJuzWithSurahs();
    
    // Count how many Juz contain Al-Baqarah (Surah 2)
    const juzWithBaqarah = juzList.filter(juz => 
      juz.surahs.some(surah => surah.number === 2)
    );
    
    // Al-Baqarah spans multiple Juz (should be in Juz 1, 2, and part of 3)
    expect(juzWithBaqarah.length).toBeGreaterThan(1);
  });

  it('should show short surahs in only one Juz', () => {
    const juzList = getAllJuzWithSurahs();
    
    // Count how many Juz contain Al-Ikhlas (Surah 112)
    const juzWithIkhlas = juzList.filter(juz => 
      juz.surahs.some(surah => surah.number === 112)
    );
    
    // Al-Ikhlas is short and should only appear in one Juz
    expect(juzWithIkhlas.length).toBe(1);
  });

  it('should have all 114 surahs across all Juz', () => {
    const juzList = getAllJuzWithSurahs();
    
    // Collect unique surah numbers across all Juz
    const uniqueSurahs = new Set<number>();
    juzList.forEach(juz => {
      juz.surahs.forEach(surah => {
        uniqueSurahs.add(surah.number);
      });
    });
    
    expect(uniqueSurahs.size).toBe(114);
  });
});
