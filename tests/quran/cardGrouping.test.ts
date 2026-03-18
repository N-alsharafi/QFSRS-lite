import { describe, it, expect } from 'vitest';
import { sortCardsByPage, groupCardsByPageRanges } from '@/lib/quran/cardGrouping';
import type { Card } from '@/types/database';
import { State } from 'ts-fsrs';

function createCard(pageNumber: number, id: string): Card {
  return {
    id,
    userId: null,
    surahNumber: 1,
    pageNumber,
    state: State.Review,
    due: new Date(),
    stability: 10,
    difficulty: 5,
    elapsed_days: 0,
    scheduled_days: 7,
    reps: 0,
    lapses: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe('cardGrouping', () => {
  describe('sortCardsByPage', () => {
    it('should sort cards by page number ascending', () => {
      const cards = [
        createCard(300, 'c1'),
        createCard(20, 'c2'),
        createCard(21, 'c3'),
      ];
      const sorted = sortCardsByPage(cards);
      expect(sorted.map((c) => c.pageNumber)).toEqual([20, 21, 300]);
    });

    it('should not mutate the original array', () => {
      const cards = [createCard(2, 'c1'), createCard(1, 'c2')];
      sortCardsByPage(cards);
      expect(cards[0].pageNumber).toBe(2);
    });
  });

  describe('groupCardsByPageRanges', () => {
    it('should group consecutive pages', () => {
      const cards = [
        createCard(20, 'c1'),
        createCard(21, 'c2'),
        createCard(22, 'c3'),
      ];
      const groups = groupCardsByPageRanges(cards);
      expect(groups).toHaveLength(1);
      expect(groups[0].startPage).toBe(20);
      expect(groups[0].endPage).toBe(22);
      expect(groups[0].cards).toHaveLength(3);
      expect(groups[0].label).toBe('Pages 20–22');
    });

    it('should split into separate groups when there are gaps', () => {
      const cards = [
        createCard(20, 'c1'),
        createCard(21, 'c2'),
        createCard(25, 'c3'),
        createCard(26, 'c4'),
      ];
      const groups = groupCardsByPageRanges(cards);
      expect(groups).toHaveLength(2);
      expect(groups[0].startPage).toBe(20);
      expect(groups[0].endPage).toBe(21);
      expect(groups[0].cards).toHaveLength(2);
      expect(groups[1].startPage).toBe(25);
      expect(groups[1].endPage).toBe(26);
      expect(groups[1].cards).toHaveLength(2);
    });

    it('should handle single page as single group', () => {
      const cards = [createCard(1, 'c1')];
      const groups = groupCardsByPageRanges(cards);
      expect(groups).toHaveLength(1);
      expect(groups[0].label).toBe('Page 1');
      expect(groups[0].startPage).toBe(1);
      expect(groups[0].endPage).toBe(1);
    });

    it('should handle empty array', () => {
      const groups = groupCardsByPageRanges([]);
      expect(groups).toHaveLength(0);
    });

    it('should sort cards before grouping', () => {
      const cards = [
        createCard(22, 'c1'),
        createCard(20, 'c2'),
        createCard(21, 'c3'),
      ];
      const groups = groupCardsByPageRanges(cards);
      expect(groups).toHaveLength(1);
      expect(groups[0].cards.map((c) => c.pageNumber)).toEqual([20, 21, 22]);
    });
  });
});
