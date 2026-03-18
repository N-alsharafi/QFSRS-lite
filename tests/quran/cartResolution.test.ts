import { describe, it, expect } from 'vitest';
import {
  resolveCart,
  resolveCartEntries,
  groupResolvedPages,
  getResolvedPageCount,
  type CartEntry,
  type FilledGeneralConfig,
} from '@/lib/quran/cartResolution';
import { getAllSurahs, getAllJuzWithSurahs } from '@/lib/quran/metadata';

const makeConfig = (
  overrides: Partial<FilledGeneralConfig> = {}
): FilledGeneralConfig => ({
  confidence: 'good',
  timeKnown: '3-years',
  reviewFrequency: 'weekly',
  ...overrides,
});

const makeEntry = (
  partial: Omit<CartEntry, 'config'> & { config?: Partial<FilledGeneralConfig> }
): CartEntry => ({
  id: `entry-${Math.random().toString(36).slice(2)}`,
  config: makeConfig(partial.config),
  label: 'test',
  ...partial,
});

describe('cartResolution', () => {
  describe('resolveCart', () => {
    it('should return empty map for empty entries', () => {
      const resolved = resolveCart([]);
      expect(resolved.size).toBe(0);
    });

    it('should resolve a single page range entry', () => {
      const entries: CartEntry[] = [
        makeEntry({
          type: 'page',
          pageRanges: [{ start: 1, end: 5 }],
          label: 'Pages 1-5',
        }),
      ];
      const resolved = resolveCart(entries);
      expect(resolved.size).toBe(5);
      for (let p = 1; p <= 5; p++) {
        expect(resolved.has(p)).toBe(true);
        expect(resolved.get(p)!.config.confidence).toBe('good');
      }
    });

    it('should resolve a single surah entry', () => {
      const entries: CartEntry[] = [
        makeEntry({
          type: 'surah',
          surahRanges: [{ start: 1, end: 1 }],
          label: 'Al-Fatiha',
        }),
      ];
      const resolved = resolveCart(entries);
      expect(resolved.size).toBe(1);
      expect(resolved.has(1)).toBe(true);
    });

    it('should resolve a single juz entry', () => {
      const entries: CartEntry[] = [
        makeEntry({
          type: 'juz',
          juzNumbers: [1],
          label: 'Juz 1',
        }),
      ];
      const allJuz = getAllJuzWithSurahs();
      const juz1 = allJuz.find((j) => j.number === 1)!;
      const expectedPages = juz1.endPage - juz1.startPage + 1;
      const resolved = resolveCart(entries);
      expect(resolved.size).toBe(expectedPages);
    });

    it('should maintain atomicity - one card per page only', () => {
      const entries: CartEntry[] = [
        makeEntry({
          type: 'page',
          pageRanges: [
            { start: 1, end: 10 },
            { start: 5, end: 15 },
          ],
          label: 'Overlapping ranges',
        }),
      ];
      const resolved = resolveCart(entries);
      const pages = Array.from(resolved.keys()).sort((a, b) => a - b);
      const unique = [...new Set(pages)];
      expect(pages).toEqual(unique);
      expect(resolved.size).toBe(15); // 1-15, no duplicates
    });

    it('Surah Al-Baqarah + Juz 2: Juz 2 has precedence for overlapping pages (smaller range = more specific)', () => {
      const allSurahs = getAllSurahs();
      const allJuz = getAllJuzWithSurahs();

      const surah2 = allSurahs[1]; // Al-Baqarah
      const juz2 = allJuz.find((j) => j.number === 2)!;

      // Surah 2 spans multiple Juz (pages 2 to ~49)
      expect(surah2.startPage).toBeLessThan(juz2.startPage);
      expect(surah2.endPage).toBeGreaterThan(juz2.endPage);

      // Overlap: pages that are in both Surah 2 and Juz 2
      const overlapStart = Math.max(surah2.startPage, juz2.startPage);
      const overlapEnd = Math.min(surah2.endPage, juz2.endPage);
      expect(overlapStart).toBeLessThanOrEqual(overlapEnd);

      const entries: CartEntry[] = [
        makeEntry({
          id: 'surah-2',
          type: 'surah',
          surahRanges: [{ start: 2, end: 2 }],
          config: makeConfig({ confidence: 'perfect' }),
          label: 'Al-Baqarah',
        }),
        makeEntry({
          id: 'juz-2',
          type: 'juz',
          juzNumbers: [2],
          config: makeConfig({ confidence: 'weak' }),
          label: 'Juz 2',
        }),
      ];

      const resolved = resolveCart(entries);

      // For pages in the overlap (Surah 2 ∩ Juz 2), Juz 2 wins because it has smaller page range (more specific)
      for (let p = overlapStart; p <= overlapEnd; p++) {
        const r = resolved.get(p);
        expect(r).toBeDefined();
        expect(r!.config.confidence).toBe('weak'); // Juz 2's config
      }

      // For pages in Surah 2 but NOT in Juz 2 (e.g. pages 2 to juz2.startPage-1), Surah 2 wins
      for (let p = surah2.startPage; p < overlapStart; p++) {
        const r = resolved.get(p);
        expect(r).toBeDefined();
        expect(r!.config.confidence).toBe('perfect'); // Surah 2's config
      }

      // For pages in Juz 2 but NOT in Surah 2 (Juz 2 contains start of Surah 3), Juz 2 wins
      for (let p = juz2.startPage; p <= juz2.endPage; p++) {
        if (p < overlapStart || p > overlapEnd) {
          const r = resolved.get(p);
          expect(r).toBeDefined();
          expect(r!.config.confidence).toBe('weak');
        }
      }
    });

    it('single page selection beats surah selection for that page', () => {
      const entries: CartEntry[] = [
        makeEntry({
          id: 'surah',
          type: 'surah',
          surahRanges: [{ start: 2, end: 2 }],
          config: makeConfig({ confidence: 'good' }),
          label: 'Al-Baqarah',
        }),
        makeEntry({
          id: 'page',
          type: 'page',
          pageRanges: [{ start: 20, end: 20 }],
          config: makeConfig({ confidence: 'veryWeak' }),
          label: 'Page 20',
        }),
      ];

      const resolved = resolveCart(entries);
      const page20 = resolved.get(20);
      expect(page20).toBeDefined();
      expect(page20!.config.confidence).toBe('veryWeak'); // Single page is most specific
    });

    it('smaller page range beats larger page range regardless of type', () => {
      // Page range 1-10 (10 pages) vs Juz 1 (~21 pages)
      const allJuz = getAllJuzWithSurahs();
      const juz1 = allJuz.find((j) => j.number === 1)!;

      const entries: CartEntry[] = [
        makeEntry({
          id: 'juz',
          type: 'juz',
          juzNumbers: [1],
          config: makeConfig({ confidence: 'perfect' }),
          label: 'Juz 1',
        }),
        makeEntry({
          id: 'pages',
          type: 'page',
          pageRanges: [{ start: 1, end: 10 }],
          config: makeConfig({ confidence: 'weak' }),
          label: 'Pages 1-10',
        }),
      ];

      const resolved = resolveCart(entries);
      // Pages 1-10: page range (10 pages) is smaller than Juz 1 (~21 pages), so pages wins
      for (let p = 1; p <= 10; p++) {
        expect(resolved.get(p)!.config.confidence).toBe('weak');
      }
      // Pages 11 to end of Juz 1: only Juz covers these
      for (let p = 11; p <= juz1.endPage; p++) {
        expect(resolved.get(p)!.config.confidence).toBe('perfect');
      }
    });

    it('last entry wins when same page count (tie-break)', () => {
      const entries: CartEntry[] = [
        makeEntry({
          id: 'first',
          type: 'page',
          pageRanges: [{ start: 1, end: 5 }],
          config: makeConfig({ confidence: 'good' }),
          label: 'First',
        }),
        makeEntry({
          id: 'second',
          type: 'page',
          pageRanges: [{ start: 1, end: 5 }],
          config: makeConfig({ confidence: 'weak' }),
          label: 'Second',
        }),
      ];

      const resolved = resolveCart(entries);
      expect(resolved.get(1)!.config.confidence).toBe('weak'); // Last wins
    });
  });

  describe('resolveCartEntries', () => {
    it('should return sorted array of ResolvedPage by page number', () => {
      const entries: CartEntry[] = [
        makeEntry({
          type: 'page',
          pageRanges: [{ start: 10, end: 12 }],
          label: 'Pages',
        }),
      ];
      const resolved = resolveCartEntries(entries);
      expect(resolved).toHaveLength(3);
      expect(resolved[0].pageNumber).toBe(10);
      expect(resolved[1].pageNumber).toBe(11);
      expect(resolved[2].pageNumber).toBe(12);
    });
  });

  describe('groupResolvedPages', () => {
    it('should group contiguous pages with same config', () => {
      const entries: CartEntry[] = [
        makeEntry({
          type: 'page',
          pageRanges: [{ start: 1, end: 5 }],
          label: 'Pages 1-5',
        }),
      ];
      const resolved = resolveCart(entries);
      const groups = groupResolvedPages(resolved);
      expect(groups).toHaveLength(1);
      expect(groups[0].pages).toEqual([1, 2, 3, 4, 5]);
    });

    it('should split into multiple groups when config differs', () => {
      const entries: CartEntry[] = [
        makeEntry({
          id: 'a',
          type: 'page',
          pageRanges: [{ start: 1, end: 3 }],
          config: makeConfig({ confidence: 'perfect' }),
          label: 'A',
        }),
        makeEntry({
          id: 'b',
          type: 'page',
          pageRanges: [{ start: 5, end: 7 }],
          config: makeConfig({ confidence: 'weak' }),
          label: 'B',
        }),
      ];
      const resolved = resolveCart(entries);
      const groups = groupResolvedPages(resolved);
      expect(groups).toHaveLength(2);
      expect(groups[0].pages).toEqual([1, 2, 3]);
      expect(groups[1].pages).toEqual([5, 6, 7]);
    });
  });

  describe('getResolvedPageCount', () => {
    it('should return correct unique page count', () => {
      const entries: CartEntry[] = [
        makeEntry({
          type: 'page',
          pageRanges: [
            { start: 1, end: 10 },
            { start: 5, end: 15 },
          ],
          label: 'Overlapping',
        }),
      ];
      const resolved = resolveCart(entries);
      expect(getResolvedPageCount(resolved)).toBe(15);
    });
  });
});
