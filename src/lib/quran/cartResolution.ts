/**
 * Cart resolution for questionnaire Step 2.
 *
 * Maintains atomicity: one card per page. Resolves overlapping selections using
 * page-range-based specificity: smaller selections (fewer pages) override larger ones.
 *
 * Example: Surah 2 (48 pages) + Page 20 (1 page) → Page 20 gets page config, rest gets surah config.
 * Example: Surah 2 (48 pages) + Juz 2 (20 pages) → For overlapping pages, Juz 2 wins (smaller range).
 */

import { getAllSurahs, getAllJuzWithSurahs } from './metadata';
import type { CardInitOptions } from './initializeCards';
import { calculateCardParameters } from './questionnaireCalculations';
import type { ConfidenceLevel, TimeKnown, ReviewFrequency } from './questionnaireCalculations';

/** Filled config (all fields required) - used when entry is added to cart */
export interface FilledGeneralConfig {
  confidence: ConfidenceLevel;
  timeKnown: TimeKnown;
  reviewFrequency: ReviewFrequency;
}

export type RangeType = 'page' | 'surah' | 'juz';

export interface PageRange {
  start: number;
  end: number;
}

export interface SurahRange {
  start: number;
  end: number;
}

export interface CartEntry {
  id: string;
  type: RangeType;
  pageRanges?: PageRange[];
  surahRanges?: SurahRange[];
  juzNumbers?: number[];
  config: FilledGeneralConfig;
  /** Human-readable label for display */
  label: string;
}

/** Resolved page with the config that won (from most specific selection) */
export interface ResolvedPage {
  pageNumber: number;
  config: FilledGeneralConfig;
  sourceLabel: string;
  /** Specificity: 1/pageCount. Higher = more specific (smaller selection wins). */
  specificity: number;
}

/** Group of contiguous pages sharing the same config */
export interface ResolvedGroup {
  pages: number[];
  config: FilledGeneralConfig;
  sourceLabel: string;
  cardOptions: CardInitOptions;
}

/**
 * Expand a cart entry to a list of (pageNumber, config, specificity) tuples.
 * Specificity is 1/pageCount: smaller selections (fewer pages) get higher specificity.
 * This ensures Juz (20 pages) overrides Surah (48 pages) for overlapping pages when
 * the surah spans multiple Juz, e.g. Al-Baqarah.
 */
function expandEntryToPages(entry: CartEntry): Array<{ page: number; config: FilledGeneralConfig; specificity: number; label: string }> {
  const pages: number[] = [];

  if (entry.type === 'page' && entry.pageRanges && entry.pageRanges.length > 0) {
    for (const range of entry.pageRanges) {
      for (let p = range.start; p <= range.end; p++) {
        if (p >= 1 && p <= 604) pages.push(p);
      }
    }
  } else if (entry.type === 'surah' && entry.surahRanges && entry.surahRanges.length > 0) {
    const allSurahs = getAllSurahs();
    for (const range of entry.surahRanges) {
      for (let surahNum = range.start; surahNum <= range.end; surahNum++) {
        const surah = allSurahs[surahNum - 1];
        if (surah) {
          for (let p = surah.startPage; p <= surah.endPage; p++) pages.push(p);
        }
      }
    }
  } else if (entry.type === 'juz' && entry.juzNumbers && entry.juzNumbers.length > 0) {
    const allJuz = getAllJuzWithSurahs();
    for (const juzNum of entry.juzNumbers) {
      const juz = allJuz.find((j) => j.number === juzNum);
      if (juz) {
        for (let p = juz.startPage; p <= juz.endPage; p++) pages.push(p);
      }
    }
  }

  const uniquePages = [...new Set(pages)];
  const pageCount = uniquePages.length;
  const specificity = pageCount > 0 ? 1 / pageCount : 0;

  return uniquePages.map((page) => ({
    page,
    config: entry.config,
    specificity,
    label: entry.label,
  }));
}

/**
 * Resolve all cart entries to a final page→config map.
 * More specific selections override less specific ones.
 * Order of entries matters only for same-specificity ties (last wins).
 */
export function resolveCart(entries: CartEntry[]): Map<number, ResolvedPage> {
  const resolved = new Map<number, ResolvedPage>();

  for (const entry of entries) {
    const expanded = expandEntryToPages(entry);

    for (const { page, config, specificity, label } of expanded) {
      const existing = resolved.get(page);
      const shouldOverwrite =
        !existing || specificity >= existing.specificity;

      // Smaller selection (higher specificity) wins. Same specificity: last added wins.
      if (shouldOverwrite) {
        resolved.set(page, {
          pageNumber: page,
          config,
          sourceLabel: label,
          specificity,
        });
      }
    }
  }

  return resolved;
}

/**
 * Group resolved pages into contiguous ranges with same config.
 * Used for efficient card initialization.
 */
export function groupResolvedPages(
  resolved: Map<number, ResolvedPage>
): ResolvedGroup[] {
  const sortedPages = Array.from(resolved.keys()).sort((a, b) => a - b);
  const groups: ResolvedGroup[] = [];
  let currentGroup: ResolvedPage[] = [];

  for (const pageNum of sortedPages) {
    const resolvedPage = resolved.get(pageNum)!;
    const last = currentGroup[currentGroup.length - 1];
    const sameConfig =
      last &&
      last.config.confidence === resolvedPage.config.confidence &&
      last.config.timeKnown === resolvedPage.config.timeKnown &&
      last.config.reviewFrequency === resolvedPage.config.reviewFrequency;

    if (sameConfig && last && pageNum === last.pageNumber + 1) {
      currentGroup.push(resolvedPage);
    } else {
      if (currentGroup.length > 0) {
        groups.push(buildGroup(currentGroup));
      }
      currentGroup = [resolvedPage];
    }
  }

  if (currentGroup.length > 0) {
    groups.push(buildGroup(currentGroup));
  }

  return groups;
}

function buildGroup(pages: ResolvedPage[]): ResolvedGroup {
  const first = pages[0];
  if (
    !first.config.confidence ||
    !first.config.timeKnown ||
    !first.config.reviewFrequency
  ) {
    throw new Error('Invalid config in resolved page');
  }
  const cardOptions = calculateCardParameters(
    first.config.confidence,
    first.config.timeKnown,
    first.config.reviewFrequency
  );
  return {
    pages: pages.map((p) => p.pageNumber),
    config: first.config,
    sourceLabel: first.sourceLabel,
    cardOptions,
  };
}

/**
 * Get total unique page count from resolved cart.
 */
export function getResolvedPageCount(resolved: Map<number, ResolvedPage>): number {
  return resolved.size;
}

/** Resolve cart entries to an array of ResolvedPage (for display) */
export function resolveCartEntries(entries: CartEntry[]): ResolvedPage[] {
  const map = resolveCart(entries);
  return Array.from(map.values()).sort((a, b) => a.pageNumber - b.pageNumber);
}
