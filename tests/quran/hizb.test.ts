import { describe, it, expect } from 'vitest';
import { 
  getAllHizbQuartersWithSurahs,
  getAllHizbHalvesWithSurahs,
  getAllHizbsWithSurahs
} from '@/lib/quran/metadata';

describe('Hizb Quarter (Rub al-Hizb) Metadata', () => {
  it('should return exactly 240 quarters', () => {
    const quarters = getAllHizbQuartersWithSurahs();
    expect(quarters).toHaveLength(240);
  });
  
  it('should have valid structure for each quarter', () => {
    const quarters = getAllHizbQuartersWithSurahs();
    const firstQuarter = quarters[0];
    
    expect(firstQuarter).toHaveProperty('number');
    expect(firstQuarter).toHaveProperty('juz');
    expect(firstQuarter).toHaveProperty('juzPart');
    expect(firstQuarter).toHaveProperty('hizbId');
    expect(firstQuarter).toHaveProperty('startPage');
    expect(firstQuarter).toHaveProperty('endPage');
    expect(firstQuarter).toHaveProperty('surahs');
    expect(Array.isArray(firstQuarter.surahs)).toBe(true);
  });
  
  it('should have first quarter starting at page 1', () => {
    const quarters = getAllHizbQuartersWithSurahs();
    expect(quarters[0].startPage).toBe(1);
  });
  
  it('should have last quarter ending at page 604', () => {
    const quarters = getAllHizbQuartersWithSurahs();
    expect(quarters[quarters.length - 1].endPage).toBe(604);
  });
  
  it('should have each quarter in a valid Juz (1-30)', () => {
    const quarters = getAllHizbQuartersWithSurahs();
    quarters.forEach(quarter => {
      expect(quarter.juz).toBeGreaterThanOrEqual(1);
      expect(quarter.juz).toBeLessThanOrEqual(30);
    });
  });
  
  it('should have ascending page ranges', () => {
    const quarters = getAllHizbQuartersWithSurahs();
    for (let i = 1; i < quarters.length; i++) {
      expect(quarters[i].startPage).toBeGreaterThanOrEqual(quarters[i - 1].startPage);
    }
  });
  
  it('should have at least one surah in each quarter', () => {
    const quarters = getAllHizbQuartersWithSurahs();
    quarters.forEach(quarter => {
      expect(quarter.surahs.length).toBeGreaterThan(0);
    });
  });
});

describe('Hizb Halves Metadata', () => {
  it('should return exactly 120 halves (240 quarters / 2)', () => {
    const halves = getAllHizbHalvesWithSurahs();
    expect(halves).toHaveLength(120);
  });
  
  it('should have valid structure for each half', () => {
    const halves = getAllHizbHalvesWithSurahs();
    const firstHalf = halves[0];
    
    expect(firstHalf).toHaveProperty('number');
    expect(firstHalf).toHaveProperty('juz');
    expect(firstHalf).toHaveProperty('startPage');
    expect(firstHalf).toHaveProperty('endPage');
    expect(firstHalf).toHaveProperty('surahs');
    expect(Array.isArray(firstHalf.surahs)).toBe(true);
  });
  
  it('should have first half starting at page 1', () => {
    const halves = getAllHizbHalvesWithSurahs();
    expect(halves[0].startPage).toBe(1);
  });
  
  it('should have last half ending at page 604', () => {
    const halves = getAllHizbHalvesWithSurahs();
    expect(halves[halves.length - 1].endPage).toBe(604);
  });
  
  it('should have each half spanning more pages than a single quarter', () => {
    const quarters = getAllHizbQuartersWithSurahs();
    const halves = getAllHizbHalvesWithSurahs();
    
    // First half should cover more pages than first quarter
    const firstQuarterPages = quarters[0].endPage - quarters[0].startPage + 1;
    const firstHalfPages = halves[0].endPage - halves[0].startPage + 1;
    
    expect(firstHalfPages).toBeGreaterThanOrEqual(firstQuarterPages);
  });
  
  it('should have at least one surah in each half', () => {
    const halves = getAllHizbHalvesWithSurahs();
    halves.forEach(half => {
      expect(half.surahs.length).toBeGreaterThan(0);
    });
  });
});

describe('Full Hizb Metadata', () => {
  it('should return exactly 60 full hizbs (240 quarters / 4)', () => {
    const hizbs = getAllHizbsWithSurahs();
    expect(hizbs).toHaveLength(60);
  });
  
  it('should have valid structure for each hizb', () => {
    const hizbs = getAllHizbsWithSurahs();
    const firstHizb = hizbs[0];
    
    expect(firstHizb).toHaveProperty('number');
    expect(firstHizb).toHaveProperty('juz');
    expect(firstHizb).toHaveProperty('startPage');
    expect(firstHizb).toHaveProperty('endPage');
    expect(firstHizb).toHaveProperty('surahs');
    expect(Array.isArray(firstHizb.surahs)).toBe(true);
  });
  
  it('should have first hizb starting at page 1', () => {
    const hizbs = getAllHizbsWithSurahs();
    expect(hizbs[0].startPage).toBe(1);
  });
  
  it('should have last hizb ending at page 604', () => {
    const hizbs = getAllHizbsWithSurahs();
    expect(hizbs[hizbs.length - 1].endPage).toBe(604);
  });
  
  it('should have each full hizb spanning more pages than a half hizb', () => {
    const halves = getAllHizbHalvesWithSurahs();
    const hizbs = getAllHizbsWithSurahs();
    
    // First full hizb should cover more pages than first half
    const firstHalfPages = halves[0].endPage - halves[0].startPage + 1;
    const firstHizbPages = hizbs[0].endPage - hizbs[0].startPage + 1;
    
    expect(firstHizbPages).toBeGreaterThanOrEqual(firstHalfPages);
  });
  
  it('should have at least one surah in each hizb', () => {
    const hizbs = getAllHizbsWithSurahs();
    hizbs.forEach(hizb => {
      expect(hizb.surahs.length).toBeGreaterThan(0);
    });
  });
  
  it('should have each hizb in a valid Juz (1-30)', () => {
    const hizbs = getAllHizbsWithSurahs();
    hizbs.forEach(hizb => {
      expect(hizb.juz).toBeGreaterThanOrEqual(1);
      expect(hizb.juz).toBeLessThanOrEqual(30);
    });
  });
  
  it('should have 2 full hizbs per Juz (approximately)', () => {
    const hizbs = getAllHizbsWithSurahs();
    // 60 hizbs / 30 juz = 2 per juz on average
    const hizbsPerJuz: Record<number, number> = {};
    hizbs.forEach(hizb => {
      hizbsPerJuz[hizb.juz] = (hizbsPerJuz[hizb.juz] || 0) + 1;
    });
    
    // Each juz should have 1-3 hizbs (allowing for boundaries)
    Object.values(hizbsPerJuz).forEach(count => {
      expect(count).toBeGreaterThanOrEqual(1);
      expect(count).toBeLessThanOrEqual(3);
    });
  });
});

describe('Hizb Divisions Consistency', () => {
  it('should have quarters that combine into halves correctly', () => {
    const quarters = getAllHizbQuartersWithSurahs();
    const halves = getAllHizbHalvesWithSurahs();
    
    // First half should start where first quarter starts
    expect(halves[0].startPage).toBe(quarters[0].startPage);
    
    // First half should end where second quarter ends
    expect(halves[0].endPage).toBe(quarters[1].endPage);
  });
  
  it('should have halves that combine into full hizbs correctly', () => {
    const halves = getAllHizbHalvesWithSurahs();
    const hizbs = getAllHizbsWithSurahs();
    
    // First hizb should start where first half starts
    expect(hizbs[0].startPage).toBe(halves[0].startPage);
    
    // First hizb should end where second half ends
    expect(hizbs[0].endPage).toBe(halves[1].endPage);
  });
  
  it('should have no gaps in page coverage across quarters', () => {
    const quarters = getAllHizbQuartersWithSurahs();
    
    for (let i = 1; i < quarters.length; i++) {
      const prevEnd = quarters[i - 1].endPage;
      const currStart = quarters[i].startPage;
      
      // Current quarter should start at or very close to where previous ended
      expect(Math.abs(currStart - prevEnd)).toBeLessThanOrEqual(1);
    }
  });
});

describe('Hizb Surah Content', () => {
  it('should have Al-Fatiha in first quarter', () => {
    const quarters = getAllHizbQuartersWithSurahs();
    const firstQuarter = quarters[0];
    
    const fatiha = firstQuarter.surahs.find(s => s.number === 1);
    expect(fatiha).toBeDefined();
    expect(fatiha?.arabicName).toBe('الفَاتِحة');
  });
  
  it('should have Al-Baqarah spanning multiple quarters', () => {
    const quarters = getAllHizbQuartersWithSurahs();
    
    // Count how many quarters contain Al-Baqarah
    const quartersWithBaqarah = quarters.filter(q => 
      q.surahs.some(s => s.number === 2)
    );
    
    // Al-Baqarah is very long, should appear in many quarters
    expect(quartersWithBaqarah.length).toBeGreaterThan(10);
  });
  
  it('should have An-Nas (114) in last quarter', () => {
    const quarters = getAllHizbQuartersWithSurahs();
    const lastQuarter = quarters[quarters.length - 1];
    
    const nas = lastQuarter.surahs.find(s => s.number === 114);
    expect(nas).toBeDefined();
    expect(nas?.number).toBe(114);
    expect(nas?.transliteration).toBe('An-Naas');
  });
  
  it('should not have duplicate surahs within a single quarter', () => {
    const quarters = getAllHizbQuartersWithSurahs();
    
    quarters.forEach(quarter => {
      const surahNumbers = quarter.surahs.map(s => s.number);
      const uniqueNumbers = new Set(surahNumbers);
      expect(surahNumbers.length).toBe(uniqueNumbers.size);
    });
  });
  
  it('should not have duplicate surahs within a single half', () => {
    const halves = getAllHizbHalvesWithSurahs();
    
    halves.forEach(half => {
      const surahNumbers = half.surahs.map(s => s.number);
      const uniqueNumbers = new Set(surahNumbers);
      expect(surahNumbers.length).toBe(uniqueNumbers.size);
    });
  });
  
  it('should not have duplicate surahs within a single full hizb', () => {
    const hizbs = getAllHizbsWithSurahs();
    
    hizbs.forEach(hizb => {
      const surahNumbers = hizb.surahs.map(s => s.number);
      const uniqueNumbers = new Set(surahNumbers);
      expect(surahNumbers.length).toBe(uniqueNumbers.size);
    });
  });
});
