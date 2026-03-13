/**
 * Verse Text Utilities
 * 
 * This file provides utilities for retrieving Arabic verse text from the Quran
 * using the quran-search-engine package.
 */

import { loadQuranData } from 'quran-search-engine';
import { getJuzMeta, getRubAlHizbMeta, type RubAlHizbId, type Juz } from 'quran-meta/hafs';

// Cache for loaded Quran data
let quranDataCache: Awaited<ReturnType<typeof loadQuranData>> | null = null;

/**
 * Load and cache Quran data
 * @returns Array of all 6236 verses with metadata
 */
async function getQuranData() {
  if (!quranDataCache) {
    quranDataCache = await loadQuranData();
  }
  return quranDataCache;
}

/**
 * Get the text of a specific verse
 * @param surahNumber - The surah number (1-114)
 * @param ayahNumber - The ayah number within the surah
 * @returns The full Arabic text of the verse, or null if not found
 */
export async function getVerseText(
  surahNumber: number,
  ayahNumber: number
): Promise<string | null> {
  const data = await getQuranData();
  const verse = data.find(v => v.sura_id === surahNumber && v.aya_id === ayahNumber);
  return verse ? verse.standard_full : null;
}

/**
 * Get the first few words of a verse for naming purposes
 * @param surahNumber - The surah number (1-114)
 * @param ayahNumber - The ayah number within the surah
 * @param wordCount - Number of words to extract (default: 4)
 * @returns The first few words of the verse, or a fallback name
 */
export async function getVerseSnippet(
  surahNumber: number,
  ayahNumber: number,
  wordCount: number = 4
): Promise<string> {
  const verseText = await getVerseText(surahNumber, ayahNumber);
  
  if (!verseText) {
    return `Verse ${surahNumber}:${ayahNumber}`;
  }
  
  // Split by spaces and take first N words
  const words = verseText.trim().split(/\s+/);
  return words.slice(0, wordCount).join(' ');
}

/**
 * Get a descriptive name for a Juz based on its first verse
 * @param juzNumber - The Juz number (1-30)
 * @returns A name based on the first 4 words of the first verse in that Juz
 */
export async function getJuzName(juzNumber: number): Promise<string> {
  try {
    const juzMeta = getJuzMeta(juzNumber as Juz);
    const firstAyah = juzMeta.firstAyahId;
    
    // Find the surah and ayah for this ayahId
    const data = await getQuranData();
    const verse = data.find(v => v.gid === firstAyah);
    
    if (verse) {
      return await getVerseSnippet(verse.sura_id, verse.aya_id, 4);
    }
  } catch (error) {
    console.error(`Error getting Juz name for ${juzNumber}:`, error);
  }
  
  return `Juz ${juzNumber}`;
}

/**
 * Get a descriptive name for a Hizb (or Hizb quarter/half) based on its first verse
 * @param hizbQuarterId - The Hizb quarter ID (1-240)
 * @returns A name based on the first 4 words of the first verse in that section
 */
export async function getHizbName(hizbQuarterId: RubAlHizbId): Promise<string> {
  try {
    const hizbMeta = getRubAlHizbMeta(hizbQuarterId);
    const firstAyah = hizbMeta.firstAyahId;
    
    // Find the surah and ayah for this ayahId
    const data = await getQuranData();
    const verse = data.find(v => v.gid === firstAyah);
    
    if (verse) {
      return await getVerseSnippet(verse.sura_id, verse.aya_id, 4);
    }
  } catch (error) {
    console.error(`Error getting Hizb name for ${hizbQuarterId}:`, error);
  }
  
  return `Hizb Quarter ${hizbQuarterId}`;
}
