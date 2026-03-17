import type { Card } from '@/types/database';
import { getAllSurahs, getAllJuzWithSurahs } from './metadata';

export interface PageRangeGroup {
  startPage: number;
  endPage: number;
  cards: Card[];
  label: string;
  /** Juz number if range falls within a single Juz, else null */
  juz: number | null;
  /** Surah numbers present in this range */
  surahs: number[];
}

/**
 * Sort cards by page number (sequential order for Quran review)
 */
export function sortCardsByPage(cards: Card[]): Card[] {
  return [...cards].sort((a, b) => a.pageNumber - b.pageNumber);
}

/**
 * Group cards into consecutive page ranges (no gaps).
 * E.g. [20, 21, 22, 25, 26] -> [{20-22}, {25-26}]
 */
export function groupCardsByPageRanges(cards: Card[]): PageRangeGroup[] {
  const sorted = sortCardsByPage(cards);
  if (sorted.length === 0) return [];

  const allSurahs = getAllSurahs();
  const allJuz = getAllJuzWithSurahs();

  const groups: PageRangeGroup[] = [];
  let currentGroup: Card[] = [sorted[0]];
  let startPage = sorted[0].pageNumber;

  for (let i = 1; i < sorted.length; i++) {
    const card = sorted[i];
    const prevPage = sorted[i - 1].pageNumber;

    if (card.pageNumber === prevPage + 1) {
      currentGroup.push(card);
    } else {
      groups.push(buildGroup(currentGroup, startPage, allSurahs, allJuz));
      currentGroup = [card];
      startPage = card.pageNumber;
    }
  }
  groups.push(buildGroup(currentGroup, startPage, allSurahs, allJuz));

  return groups;
}

function buildGroup(
  cards: Card[],
  startPage: number,
  allSurahs: ReturnType<typeof getAllSurahs>,
  allJuz: ReturnType<typeof getAllJuzWithSurahs>
): PageRangeGroup {
  const endPage = cards[cards.length - 1].pageNumber;
  const pageSet = new Set(cards.map((c) => c.pageNumber));

  const surahs = new Set<number>();
  for (const page of pageSet) {
    const surahsOnPage = allSurahs.filter(
      (s) => s.startPage <= page && s.endPage >= page
    );
    surahsOnPage.forEach((s) => surahs.add(s.number));
  }

  let juz: number | null = null;
  for (const j of allJuz) {
    const pagesInJuz = new Set<number>();
    for (let p = j.startPage; p <= j.endPage; p++) pagesInJuz.add(p);
    const allInJuz = [...pageSet].every((p) => pagesInJuz.has(p));
    if (allInJuz && pageSet.size > 0) {
      juz = j.number;
      break;
    }
  }

  const label = startPage === endPage ? `Page ${startPage}` : `Pages ${startPage}–${endPage}`;

  return {
    startPage,
    endPage,
    cards,
    label,
    juz,
    surahs: Array.from(surahs).sort((a, b) => a - b),
  };
}
