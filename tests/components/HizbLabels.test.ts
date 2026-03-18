import { describe, it, expect } from 'vitest';

/**
 * Tests for Hizb Half and Quarter labeling logic
 * These functions are used in SurahGrid.tsx
 */

// Copy of helper functions from SurahGrid for testing
function getHizbHalfLabel(halfNumber: number): string {
  // There are 2 halves per Hizb
  const hizbNumber = Math.ceil(halfNumber / 2);
  const halfWithinHizb = ((halfNumber - 1) % 2) + 1;
  return `Hizb ${hizbNumber} Half ${halfWithinHizb}`;
}

function getHizbQuarterLabel(quarterNumber: number): string {
  // There are 4 quarters per Hizb
  const hizbNumber = Math.ceil(quarterNumber / 4);
  const quarterWithinHizb = ((quarterNumber - 1) % 4) + 1;
  return `Hizb ${hizbNumber} Quarter ${quarterWithinHizb}`;
}

describe('Hizb Labeling Functions', () => {
  describe('getHizbHalfLabel', () => {
    it('should correctly label Hizb 1 halves', () => {
      expect(getHizbHalfLabel(1)).toBe('Hizb 1 Half 1');
      expect(getHizbHalfLabel(2)).toBe('Hizb 1 Half 2');
    });

    it('should correctly label Hizb 2 halves', () => {
      expect(getHizbHalfLabel(3)).toBe('Hizb 2 Half 1');
      expect(getHizbHalfLabel(4)).toBe('Hizb 2 Half 2');
    });

    it('should correctly label Hizb 3 halves', () => {
      expect(getHizbHalfLabel(5)).toBe('Hizb 3 Half 1');
      expect(getHizbHalfLabel(6)).toBe('Hizb 3 Half 2');
    });

    it('should correctly label Hizb 10 halves', () => {
      expect(getHizbHalfLabel(19)).toBe('Hizb 10 Half 1');
      expect(getHizbHalfLabel(20)).toBe('Hizb 10 Half 2');
    });

    it('should handle all 120 halves (60 Hizbs)', () => {
      const labels: string[] = [];
      
      for (let i = 1; i <= 120; i++) {
        const label = getHizbHalfLabel(i);
        labels.push(label);
        
        // Should always be "Hizb X Half Y"
        expect(label).toMatch(/^Hizb \d+ Half [12]$/);
      }
      
      console.log('First 10 half labels:', labels.slice(0, 10));
      console.log('Last 5 half labels:', labels.slice(-5));
      
      // Verify we have all unique labels (2 halves × 60 Hizbs = 120)
      const uniqueLabels = new Set(labels);
      expect(uniqueLabels.size).toBe(120);
    });
  });

  describe('getHizbQuarterLabel', () => {
    it('should correctly label Hizb 1 quarters', () => {
      expect(getHizbQuarterLabel(1)).toBe('Hizb 1 Quarter 1');
      expect(getHizbQuarterLabel(2)).toBe('Hizb 1 Quarter 2');
      expect(getHizbQuarterLabel(3)).toBe('Hizb 1 Quarter 3');
      expect(getHizbQuarterLabel(4)).toBe('Hizb 1 Quarter 4');
    });

    it('should correctly label Hizb 2 quarters', () => {
      expect(getHizbQuarterLabel(5)).toBe('Hizb 2 Quarter 1');
      expect(getHizbQuarterLabel(6)).toBe('Hizb 2 Quarter 2');
      expect(getHizbQuarterLabel(7)).toBe('Hizb 2 Quarter 3');
      expect(getHizbQuarterLabel(8)).toBe('Hizb 2 Quarter 4');
    });

    it('should correctly label Hizb 3 quarters', () => {
      expect(getHizbQuarterLabel(9)).toBe('Hizb 3 Quarter 1');
      expect(getHizbQuarterLabel(10)).toBe('Hizb 3 Quarter 2');
      expect(getHizbQuarterLabel(11)).toBe('Hizb 3 Quarter 3');
      expect(getHizbQuarterLabel(12)).toBe('Hizb 3 Quarter 4');
    });

    it('should correctly label Hizb 10 quarters', () => {
      expect(getHizbQuarterLabel(37)).toBe('Hizb 10 Quarter 1');
      expect(getHizbQuarterLabel(38)).toBe('Hizb 10 Quarter 2');
      expect(getHizbQuarterLabel(39)).toBe('Hizb 10 Quarter 3');
      expect(getHizbQuarterLabel(40)).toBe('Hizb 10 Quarter 4');
    });

    it('should correctly label Hizb 60 quarters (last Hizb)', () => {
      expect(getHizbQuarterLabel(237)).toBe('Hizb 60 Quarter 1');
      expect(getHizbQuarterLabel(238)).toBe('Hizb 60 Quarter 2');
      expect(getHizbQuarterLabel(239)).toBe('Hizb 60 Quarter 3');
      expect(getHizbQuarterLabel(240)).toBe('Hizb 60 Quarter 4');
    });

    it('should handle all 240 quarters (60 Hizbs)', () => {
      const labels: string[] = [];
      
      for (let i = 1; i <= 240; i++) {
        const label = getHizbQuarterLabel(i);
        labels.push(label);
        
        // Should always be "Hizb X Quarter Y"
        expect(label).toMatch(/^Hizb \d+ Quarter [1234]$/);
      }
      
      console.log('First 8 quarter labels:', labels.slice(0, 8));
      console.log('Last 8 quarter labels:', labels.slice(-8));
      
      // Verify we have all unique labels (4 quarters × 60 Hizbs = 240)
      const uniqueLabels = new Set(labels);
      expect(uniqueLabels.size).toBe(240);
    });
  });

  describe('Edge cases and patterns', () => {
    it('should have consistent pattern: quarters = halves × 2', () => {
      // Quarter 1, 2 = Half 1
      expect(getHizbQuarterLabel(1)).toContain('Hizb 1');
      expect(getHizbQuarterLabel(2)).toContain('Hizb 1');
      expect(getHizbHalfLabel(1)).toContain('Hizb 1');
      
      // Quarter 3, 4 = Half 2
      expect(getHizbQuarterLabel(3)).toContain('Hizb 1');
      expect(getHizbQuarterLabel(4)).toContain('Hizb 1');
      expect(getHizbHalfLabel(2)).toContain('Hizb 1');
      
      // Quarter 5, 6 = Half 3
      expect(getHizbQuarterLabel(5)).toContain('Hizb 2');
      expect(getHizbQuarterLabel(6)).toContain('Hizb 2');
      expect(getHizbHalfLabel(3)).toContain('Hizb 2');
    });

    it('should have 2 halves per full Hizb', () => {
      for (let hizbNum = 1; hizbNum <= 10; hizbNum++) {
        const halfStart = (hizbNum - 1) * 2 + 1;
        const half1 = getHizbHalfLabel(halfStart);
        const half2 = getHizbHalfLabel(halfStart + 1);
        
        expect(half1).toBe(`Hizb ${hizbNum} Half 1`);
        expect(half2).toBe(`Hizb ${hizbNum} Half 2`);
      }
    });

    it('should have 4 quarters per full Hizb', () => {
      for (let hizbNum = 1; hizbNum <= 10; hizbNum++) {
        const quarterStart = (hizbNum - 1) * 4 + 1;
        
        for (let q = 1; q <= 4; q++) {
          const label = getHizbQuarterLabel(quarterStart + q - 1);
          expect(label).toBe(`Hizb ${hizbNum} Quarter ${q}`);
        }
      }
    });
  });

  describe('Real-world examples', () => {
    it('should match expected labels for commonly referenced Hizbs', () => {
      // Common references
      const examples = [
        { number: 1, label: 'Hizb 1 Quarter 1' },
        { number: 4, label: 'Hizb 1 Quarter 4' },
        { number: 5, label: 'Hizb 2 Quarter 1' },
        { number: 9, label: 'Hizb 3 Quarter 1' }, // Start of Juz 2
        { number: 17, label: 'Hizb 5 Quarter 1' }, // Start of Juz 3
        { number: 240, label: 'Hizb 60 Quarter 4' }, // Last quarter
      ];
      
      examples.forEach(({ number, label }) => {
        expect(getHizbQuarterLabel(number)).toBe(label);
      });
    });
  });
});
