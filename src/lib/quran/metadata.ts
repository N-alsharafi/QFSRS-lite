import { 
  getSurahMeta as getSurahMetaFromLib,
  getPageMeta as getPageMetaFromLib, 
  getAyahMeta as getAyahMetaFromLib,
  findPage,
  findJuzByAyahId,
  getJuzMeta,
  getRubAlHizbMeta,
  HizbQuarterList,
  type Surah,
  type Page,
  type AyahNo,
  type Juz,
  type RubAlHizbId
} from 'quran-meta/hafs';
import { surahNames } from 'quran-meta/i18n';

/**
 * Get surah metadata by number (1-114)
 */
export function getSurahMeta(surahNumber: Surah) {
  const surah = getSurahMetaFromLib(surahNumber);
  const startPage = findPage(surahNumber);
  const enNames = surahNames.en[surahNumber];
  
  return {
    name: surah.name,
    transliteration: enNames[0],
    translation: enNames[1],
    page: startPage,
    ayahs: surah.ayahCount,
    type: surah.isMeccan ? 'Meccan' : 'Medinan'
  };
}

/**
 * Get page metadata (which verses are on this page)
 */
export function getPageMeta(pageNumber: Page) {
  return getPageMetaFromLib(pageNumber);
}

/**
 * Get verse metadata
 */
export function getAyahMeta(surahNumber: Surah, ayahNumber: AyahNo) {
  const ayahId = ((surahNumber - 1) * 1000 + ayahNumber) as any;
  return getAyahMetaFromLib(ayahId);
}

/**
 * Get first and last verses of a page
 */
export function getPageVerseRange(pageNumber: Page) {
  const pageMeta = getPageMetaFromLib(pageNumber);
  return {
    first: { surah: pageMeta.first[0], ayah: pageMeta.first[1] },
    last: { surah: pageMeta.last[0], ayah: pageMeta.last[1] }
  };
}

/**
 * Get first and last verses of a surah
 */
export function getSurahVerseRange(surahNumber: Surah) {
  const surah = getSurahMetaFromLib(surahNumber);
  return {
    first: { surah: surahNumber, ayah: 1 as AyahNo },
    last: { surah: surahNumber, ayah: surah.ayahCount as AyahNo }
  };
}

/**
 * Get all 114 surah names for dashboard grid
 */
export function getAllSurahs() {
  return Array.from({ length: 114 }, (_, i) => {
    const surahNum = (i + 1) as Surah;
    const surah = getSurahMetaFromLib(surahNum);
    const enNames = surahNames.en[surahNum];
    
    const startPage = findPage(surahNum);
    const juz = findJuzByAyahId(surah.firstAyahId); // Get Juz for first ayah of surah
    
    let endPage: number;
    
    if (i < 113) {
      const nextStartPage = findPage((i + 2) as Surah);
      // If next surah shares the same page, this surah only occupies that one page
      endPage = nextStartPage > startPage ? nextStartPage - 1 : startPage;
    } else {
      // Last surah ends on page 604
      endPage = 604;
    }
    
    return {
      number: surahNum,
      arabicName: surah.name,
      transliteration: enNames[0],
      translation: enNames[1],
      totalAyahs: surah.ayahCount,
      startPage,
      endPage,
      totalPages: endPage - startPage + 1,
      revelationType: surah.isMeccan ? 'Meccan' : 'Medinan',
      juz,
    };
  });
}

/**
 * Determine if a surah should have one card or multiple (page-based) cards
 * Returns true if surah spans multiple pages
 */
export function isMultiPageSurah(surahNumber: number): boolean {
  const surahs = getAllSurahs();
  const surah = surahs[surahNumber - 1];
  return surah.totalPages > 1;
}

/**
 * Get the page range for a surah
 */
export function getSurahPageRange(surahNumber: number): { start: number; end: number } {
  const surahs = getAllSurahs();
  const surah = surahs[surahNumber - 1];
  return { start: surah.startPage, end: surah.endPage };
}

/**
 * Get all 30 Juz with their surahs
 * A surah appears under a Juz if any of its pages fall within that Juz
 */
export function getAllJuzWithSurahs() {
  const allSurahs = getAllSurahs();
  
  return Array.from({ length: 30 }, (_, i) => {
    const juzNum = (i + 1) as Juz;
    const juzMeta = getJuzMeta(juzNum);
    
    // Get page range for this Juz using findPage on first and last ayahs
    const juzStartPage = findPage(juzMeta.first[0] as Surah, juzMeta.first[1] as AyahNo);
    const juzEndPage = findPage(juzMeta.last[0] as Surah, juzMeta.last[1] as AyahNo);
    
    // Find all surahs that have content in this Juz
    const surahsInJuz = allSurahs.filter(surah => {
      const surahStart = surah.startPage;
      const surahEnd = surah.endPage;
      
      // Check if surah's page range overlaps with this Juz's page range
      return (surahStart <= juzEndPage) && (surahEnd >= juzStartPage);
    });
    
    return {
      number: juzNum,
      startPage: juzStartPage,
      endPage: juzEndPage,
      surahs: surahsInJuz,
    };
  });
}

/**
 * Get all Hizb quarters (Rub al-Hizb) with their surahs
 * There are 240 quarters in the Quran (indices 1-240 in HizbQuarterList)
 */
export function getAllHizbQuartersWithSurahs() {
  const allSurahs = getAllSurahs();
  const totalQuarters = 240; // HizbQuarterList has 242 entries, but only 1-240 are valid quarters
  
  return Array.from({ length: totalQuarters }, (_, i) => {
    const quarterNum = (i + 1) as RubAlHizbId; // Quarter IDs go from 1 to 240
    const quarterMeta = getRubAlHizbMeta(quarterNum);
    
    const startPage = findPage(quarterMeta.first[0] as Surah, quarterMeta.first[1] as AyahNo);
    const endPage = findPage(quarterMeta.last[0] as Surah, quarterMeta.last[1] as AyahNo);
    
    // Find surahs in this quarter
    const surahsInQuarter = allSurahs.filter(surah => {
      return (surah.startPage <= endPage) && (surah.endPage >= startPage);
    });
    
    return {
      number: quarterNum,
      juz: quarterMeta.juz,
      juzPart: quarterMeta.juzPart,
      hizbId: quarterMeta.hizbId,
      startPage,
      endPage,
      surahs: surahsInQuarter,
    };
  });
}

/**
 * Group quarters into halves (2 quarters = 1 half)
 */
export function getAllHizbHalvesWithSurahs() {
  const quarters = getAllHizbQuartersWithSurahs();
  const halves = [];
  
  for (let i = 0; i < quarters.length; i += 2) {
    const q1 = quarters[i];
    const q2 = quarters[i + 1];
    
    if (q2) {
      const combinedSurahs = [...q1.surahs];
      q2.surahs.forEach(surah => {
        if (!combinedSurahs.find(s => s.number === surah.number)) {
          combinedSurahs.push(surah);
        }
      });
      
      halves.push({
        number: Math.floor(i / 2) + 1,
        juz: q1.juz,
        startPage: q1.startPage,
        endPage: q2.endPage,
        surahs: combinedSurahs.sort((a, b) => a.number - b.number),
      });
    }
  }
  
  return halves;
}

/**
 * Group quarters into full Hizbs (4 quarters = 1 Hizb)
 */
export function getAllHizbsWithSurahs() {
  const quarters = getAllHizbQuartersWithSurahs();
  const hizbs = [];
  
  for (let i = 0; i < quarters.length; i += 4) {
    const q1 = quarters[i];
    const q4 = quarters[i + 3];
    
    if (q4) {
      const combinedSurahs = new Map();
      
      for (let j = 0; j < 4; j++) {
        const q = quarters[i + j];
        if (q) {
          q.surahs.forEach(surah => {
            combinedSurahs.set(surah.number, surah);
          });
        }
      }
      
      hizbs.push({
        number: Math.floor(i / 4) + 1,
        juz: q1.juz,
        startPage: q1.startPage,
        endPage: q4.endPage,
        surahs: Array.from(combinedSurahs.values()).sort((a, b) => a.number - b.number),
      });
    }
  }
  
  return hizbs;
}
