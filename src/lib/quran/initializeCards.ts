import { db } from '@/lib/db/schema';
import { State } from 'ts-fsrs';
import { v4 as uuidv4 } from 'uuid';
import { getAllSurahs, isMultiPageSurah, getSurahPageRange } from './metadata';
import type { Card } from '@/types/database';

/**
 * Card initialization options based on user's memorization level and goals
 */
export interface CardInitOptions {
  /** Initial FSRS state based on user's confidence/memorization level */
  initialState: State;
  /** Initial stability value (higher = better retention, suggested range: 0–unlimited) */
  initialStability?: number;
  /** Initial difficulty (0-10, lower = easier) */
  initialDifficulty?: number;
  /** 
   * Number of times the user has reviewed this material (important for long-term memorizers)
   * Users can estimate: memorization duration × review frequency
   * Example: 4 years × 52 weeks × 1 review/week = ~200 reps
   */
  initialReps?: number;
  /** When the card should be due (defaults to now for New, future for Review) */
  dueDate?: Date;
}

/**
 * Page-specific options to override base options for individual pages
 * Useful when user says "I memorized pages 1-30 but page 15 is weak and page 20 is hard"
 */
export interface PageSpecificOptions {
  /** Page number to apply these options to */
  pageNumber: number;
  /** Override initial state for this page */
  initialState?: State;
  /** Override stability for this page (e.g., lower if user makes mistakes) */
  initialStability?: number;
  /** Override difficulty for this page (e.g., higher if page is harder) */
  initialDifficulty?: number;
  /** Override reps for this page */
  initialReps?: number;
  /** Override due date for this page */
  dueDate?: Date;
}

/**
 * Initialize cards for specific surahs based on user's questionnaire responses.
 * This function should be called AFTER the user completes the onboarding questionnaire.
 * 
 * @param surahNumbers - Array of surah numbers (1-114) to initialize cards for
 * @param options - Card initialization options based on user's memorization level
 * 
 * @example
 * // User has been reviewing Al-Fatiha for years (high reps)
 * await initializeCardsForSurahs([1], { 
 *   initialState: State.Review, 
 *   initialStability: 150,
 *   initialReps: 300, // User has reviewed it ~300 times over the years
 *   dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Due in 30 days
 * });
 * 
 * // User just started learning Al-Baqarah
 * await initializeCardsForSurahs([2], { 
 *   initialState: State.Learning,
 *   initialStability: 5,
 *   initialReps: 2 // Just reviewed it twice
 * });
 */
export async function initializeCardsForSurahs(
  surahNumbers: number[],
  options: CardInitOptions = {
    initialState: State.New,
    initialStability: 0,
    initialDifficulty: 0,
    initialReps: 0,
  }
) {
  const allSurahs = getAllSurahs();
  const cards: Card[] = [];
  
  const now = new Date();
  const dueDate = options.dueDate || now;
  
  for (const surahNum of surahNumbers) {
    // Validate surah number
    if (surahNum < 1 || surahNum > 114) {
      console.warn(`Invalid surah number: ${surahNum}. Skipping.`);
      continue;
    }
    
    const surah = allSurahs[surahNum - 1];
    const isMultiPage = isMultiPageSurah(surah.number);
    
    if (isMultiPage) {
      // Long surah: Create one card per page
      const { start, end } = getSurahPageRange(surah.number);
      
      for (let page = start; page <= end; page++) {
        cards.push({
          id: uuidv4(),
          userId: null,
          surahNumber: surah.number,
          pageNumber: page,
          state: options.initialState,
          due: dueDate,
          stability: options.initialStability || 0,
          difficulty: options.initialDifficulty || 0,
          elapsed_days: 0,
          scheduled_days: 0,
          reps: options.initialReps || 0,
          lapses: 0, // Let FSRS track lapses going forward
          createdAt: now,
          updatedAt: now,
        });
      }
    } else {
      // Short surah: Create one card for the entire surah
      cards.push({
        id: uuidv4(),
        userId: null,
        surahNumber: surah.number,
        pageNumber: surah.startPage,
        state: options.initialState,
        due: dueDate,
        stability: options.initialStability || 0,
        difficulty: options.initialDifficulty || 0,
        elapsed_days: 0,
        scheduled_days: 0,
        reps: options.initialReps || 0,
        lapses: 0, // Let FSRS track lapses going forward
        createdAt: now,
        updatedAt: now,
      });
    }
  }
  
  if (cards.length > 0) {
    await db.cards.bulkAdd(cards);
    console.log(`✅ Initialized ${cards.length} cards for ${surahNumbers.length} surahs`);
  }
  
  return cards.length;
}

/**
 * Initialize cards for a range of surahs (useful for "I've memorized Juz 1-5" scenarios)
 * 
 * @example
 * // User has memorized Juz 1 (Surahs 1-2, partial)
 * await initializeCardsForSurahRange(1, 2, { initialState: State.Review, initialStability: 80 });
 */
export async function initializeCardsForSurahRange(
  startSurah: number,
  endSurah: number,
  options: CardInitOptions
) {
  const surahNumbers = Array.from(
    { length: endSurah - startSurah + 1 },
    (_, i) => startSurah + i
  );
  return initializeCardsForSurahs(surahNumbers, options);
}

/**
 * Initialize cards for a specific page range (useful for "I've memorized up to page X")
 * This creates one card per page, automatically determining which surah each page belongs to.
 * Supports fine-grained customization for individual pages.
 * 
 * @param startPage - Starting page number (1-604)
 * @param endPage - Ending page number (1-604)
 * @param baseOptions - Default options for all pages
 * @param pageSpecificOptions - Optional array of per-page overrides
 * 
 * @example
 * // Simple: User has memorized up to page 30 with uniform quality
 * await initializeCardsForPageRange(1, 30, { 
 *   initialState: State.Review,
 *   initialStability: 100,
 *   initialReps: 200
 * });
 * 
 * @example
 * // Fine-grained: User memorized pages 1-30 but struggles with pages 15 and 20
 * await initializeCardsForPageRange(1, 30, 
 *   {
 *     initialState: State.Review,
 *     initialStability: 100,
 *     initialReps: 200
 *   },
 *   [
 *     { pageNumber: 15, initialStability: 50 },      // Makes mistakes on page 15
 *     { pageNumber: 20, initialDifficulty: 8 }       // Page 20 is difficult
 *   ]
 * );
 */
export async function initializeCardsForPageRange(
  startPage: number,
  endPage: number,
  baseOptions: CardInitOptions,
  pageSpecificOptions?: PageSpecificOptions[]
) {
  // Validate page range
  if (startPage < 1 || startPage > 604 || endPage < 1 || endPage > 604) {
    console.warn(`Invalid page range: ${startPage}-${endPage}. Pages must be 1-604.`);
    return 0;
  }
  
  if (startPage > endPage) {
    console.warn(`Invalid page range: startPage (${startPage}) > endPage (${endPage})`);
    return 0;
  }
  
  const allSurahs = getAllSurahs();
  const cards: Card[] = [];
  const now = new Date();
  
  // Create a map of page-specific options for quick lookup
  const pageOptionsMap = new Map<number, PageSpecificOptions>();
  if (pageSpecificOptions) {
    pageSpecificOptions.forEach(opt => {
      pageOptionsMap.set(opt.pageNumber, opt);
    });
  }
  
  // For each page in the range, find which surah it belongs to and create a card
  for (let page = startPage; page <= endPage; page++) {
    // Find the surah this page belongs to
    const surah = allSurahs.find(s => page >= s.startPage && page <= s.endPage);
    
    if (!surah) {
      console.warn(`Could not find surah for page ${page}`);
      continue;
    }
    
    // Get page-specific overrides if they exist
    const pageOverrides = pageOptionsMap.get(page);
    
    // Merge base options with page-specific overrides
    const finalState = pageOverrides?.initialState ?? baseOptions.initialState;
    const finalStability = pageOverrides?.initialStability ?? baseOptions.initialStability ?? 0;
    const finalDifficulty = pageOverrides?.initialDifficulty ?? baseOptions.initialDifficulty ?? 0;
    const finalReps = pageOverrides?.initialReps ?? baseOptions.initialReps ?? 0;
    const finalDueDate = pageOverrides?.dueDate ?? baseOptions.dueDate ?? now;
    
    cards.push({
      id: uuidv4(),
      userId: null,
      surahNumber: surah.number,
      pageNumber: page,
      state: finalState,
      due: finalDueDate,
      stability: finalStability,
      difficulty: finalDifficulty,
      elapsed_days: 0,
      scheduled_days: 0,
      reps: finalReps,
      lapses: 0, // Let FSRS track lapses going forward
      createdAt: now,
      updatedAt: now,
    });
  }
  
  if (cards.length > 0) {
    await db.cards.bulkAdd(cards);
    
    // Count unique surahs for logging
    const uniqueSurahs = new Set(cards.map(c => c.surahNumber));
    console.log(`✅ Initialized ${cards.length} cards for pages ${startPage}-${endPage}`);
    console.log(`📖 Spanning ${uniqueSurahs.size} surah(s)`);
  }
  
  return cards.length;
}

/**
 * Get count of how many cards would be created for given surahs (without creating them)
 * Useful for showing users preview in questionnaire
 */
export function getCardCountForSurahs(surahNumbers: number[]): number {
  const allSurahs = getAllSurahs();
  let count = 0;
  
  for (const surahNum of surahNumbers) {
    if (surahNum < 1 || surahNum > 114) continue;
    
    const surah = allSurahs[surahNum - 1];
    if (isMultiPageSurah(surah.number)) {
      const { start, end } = getSurahPageRange(surah.number);
      count += end - start + 1;
    } else {
      count += 1;
    }
  }
  
  return count;
}
