'use client';

import { useState, useEffect } from 'react';
import { getAllJuzWithSurahs, getAllSurahs } from '@/lib/quran/metadata';
import { getJuzName } from '@/lib/quran/verseText';

export type RangeType = 'juz' | 'surah' | 'page';

export interface PageRange {
  start: number;
  end: number;
}

export interface SurahRange {
  start: number;
  end: number;
}

export interface SelectedRange {
  type: RangeType;
  // For page mode (single range per add; cart handles multiple entries)
  pageRanges?: PageRange[];
  // For surah mode (single range per add; cart handles multiple entries)
  surahRanges?: SurahRange[];
  // For juz mode
  juzNumbers?: number[];
}

interface RangeSelectorProps {
  selectedRange: SelectedRange;
  onChange: (range: SelectedRange) => void;
  isDark: boolean;
  styles: any;
}

export function RangeSelector({ selectedRange, onChange, isDark, styles }: RangeSelectorProps) {
  const [rangeType, setRangeType] = useState<RangeType>('page');
  const [juzNames, setJuzNames] = useState<Record<number, string>>({});
  
  // Temporary inputs for adding new ranges
  const [tempStartPage, setTempStartPage] = useState<string>('');
  const [tempEndPage, setTempEndPage] = useState<string>('');
  const [tempStartSurah, setTempStartSurah] = useState<string>('');
  const [tempEndSurah, setTempEndSurah] = useState<string>('');
  
  const allSurahs = getAllSurahs();
  const allJuz = getAllJuzWithSurahs();

  // Load Juz names
  useEffect(() => {
    const loadJuzNames = async () => {
      const names: Record<number, string> = {};
      for (const juz of allJuz) {
        names[juz.number] = await getJuzName(juz.number);
      }
      setJuzNames(names);
    };
    loadJuzNames();
  }, []);

  const handleTypeChange = (type: RangeType) => {
    setRangeType(type);
    onChange({ type });
    setTempStartPage('');
    setTempEndPage('');
    setTempStartSurah('');
    setTempEndSurah('');
  };

  // Update page range immediately when valid (single range, cart supports multiple adds)
  const syncPageRange = (startStr: string, endStr: string) => {
    const start = parseInt(startStr);
    const end = parseInt(endStr);
    if (!isNaN(start) && !isNaN(end) && start >= 1 && end <= 604 && start <= end) {
      onChange({ type: 'page', pageRanges: [{ start, end }] });
    } else {
      onChange({ type: 'page', pageRanges: [] });
    }
  };

  // Update surah range immediately when valid (single range, cart supports multiple adds)
  const syncSurahRange = (startStr: string, endStr: string) => {
    const start = parseInt(startStr);
    const end = parseInt(endStr);
    if (!isNaN(start) && !isNaN(end) && start >= 1 && end <= 114 && start <= end) {
      onChange({ type: 'surah', surahRanges: [{ start, end }] });
    } else {
      onChange({ type: 'surah', surahRanges: [] });
    }
  };

  const buttonBase = isDark
    ? 'bg-tamkeenDark-surface/90 backdrop-blur-sm border-2 border-tamkeenDark-primary/30 text-tamkeenDark-text'
    : 'bg-tamkeen-surface/90 backdrop-blur-sm border-2 border-tamkeen-accent/20 text-tamkeen-text';
  
  const buttonActive = isDark
    ? 'bg-tamkeenDark-primary text-tamkeenDark-background border-tamkeenDark-primary'
    : 'bg-tamkeen-primary text-tamkeen-surface border-tamkeen-primary';

  return (
    <div className="space-y-6">
      {/* Type Selector */}
      <div>
        <label className={`block text-sm font-semibold mb-3 ${styles.label}`}>
          Select By
        </label>
        <div className="flex gap-3">
          <button
            onClick={() => handleTypeChange('page')}
            className={`flex-1 px-4 py-2.5 rounded-lg font-semibold transition-all hover:scale-105 ${
              rangeType === 'page' ? buttonActive : buttonBase
            }`}
          >
            Page
          </button>
          <button
            onClick={() => handleTypeChange('surah')}
            className={`flex-1 px-4 py-2.5 rounded-lg font-semibold transition-all hover:scale-105 ${
              rangeType === 'surah' ? buttonActive : buttonBase
            }`}
          >
            Surah
          </button>
          <button
            onClick={() => handleTypeChange('juz')}
            className={`flex-1 px-4 py-2.5 rounded-lg font-semibold transition-all hover:scale-105 ${
              rangeType === 'juz' ? buttonActive : buttonBase
            }`}
          >
            Juz
          </button>
        </div>
      </div>

      {/* Range Input based on type */}
      {rangeType === 'page' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-xs font-semibold mb-2 ${styles.label}`}>
                From Page
              </label>
              <input
                type="text"
                placeholder="1"
                value={tempStartPage}
                onChange={(e) => {
                  const v = e.target.value;
                  setTempStartPage(v);
                  syncPageRange(v, tempEndPage);
                }}
                className={`w-full px-4 py-2.5 rounded-lg ${styles.input} outline-none transition-all`}
              />
            </div>
            <div>
              <label className={`block text-xs font-semibold mb-2 ${styles.label}`}>
                To Page
              </label>
              <input
                type="text"
                placeholder="604"
                value={tempEndPage}
                onChange={(e) => {
                  const v = e.target.value;
                  setTempEndPage(v);
                  syncPageRange(tempStartPage, v);
                }}
                className={`w-full px-4 py-2.5 rounded-lg ${styles.input} outline-none transition-all`}
              />
            </div>
          </div>
          {selectedRange.pageRanges && selectedRange.pageRanges.length > 0 && (
            <p className={`text-xs ${styles.subtitle}`}>
              {selectedRange.pageRanges[0].end - selectedRange.pageRanges[0].start + 1} pages selected
            </p>
          )}
        </div>
      )}

      {rangeType === 'surah' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-xs font-semibold mb-2 ${styles.label}`}>
                From Surah
              </label>
              <select
                value={tempStartSurah}
                onChange={(e) => {
                  const v = e.target.value;
                  setTempStartSurah(v);
                  syncSurahRange(v, tempEndSurah);
                }}
                className={`w-full px-4 py-2.5 rounded-lg ${styles.input} outline-none transition-all`}
              >
                <option value="">Select...</option>
                {allSurahs.map(surah => (
                  <option key={surah.number} value={surah.number}>
                    {surah.number}. {surah.transliteration}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={`block text-xs font-semibold mb-2 ${styles.label}`}>
                To Surah
              </label>
              <select
                value={tempEndSurah}
                onChange={(e) => {
                  const v = e.target.value;
                  setTempEndSurah(v);
                  syncSurahRange(tempStartSurah, v);
                }}
                className={`w-full px-4 py-2.5 rounded-lg ${styles.input} outline-none transition-all`}
              >
                <option value="">Select...</option>
                {allSurahs.map(surah => (
                  <option key={surah.number} value={surah.number}>
                    {surah.number}. {surah.transliteration}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {selectedRange.surahRanges && selectedRange.surahRanges.length > 0 && (
            <p className={`text-xs ${styles.subtitle}`}>
              {selectedRange.surahRanges[0].start === selectedRange.surahRanges[0].end
                ? `Surah ${allSurahs[selectedRange.surahRanges[0].start - 1]?.transliteration} selected`
                : `${selectedRange.surahRanges[0].end - selectedRange.surahRanges[0].start + 1} surahs selected`}
            </p>
          )}
        </div>
      )}

      {rangeType === 'juz' && (
        <div className="space-y-4">
          <label className={`block text-xs font-semibold mb-2 ${styles.label}`}>
            Select Juz (you can select multiple)
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto p-2">
            {allJuz.map(juz => {
              const isSelected = selectedRange.juzNumbers?.includes(juz.number) || false;
              return (
                <button
                  key={juz.number}
                  onClick={() => {
                    const current = selectedRange.juzNumbers || [];
                    const newSelection = isSelected
                      ? current.filter(j => j !== juz.number)
                      : [...current, juz.number].sort((a, b) => a - b);
                    onChange({
                      type: 'juz',
                      juzNumbers: newSelection
                    });
                  }}
                  className={`p-3 rounded-lg text-sm transition-all hover:scale-105 ${
                    isSelected ? buttonActive : buttonBase
                  }`}
                >
                  <div className="font-bold mb-1">Juz {juz.number}</div>
                  <div className={`text-xs arabic-clear ${
                    isSelected 
                      ? (isDark ? 'text-tamkeenDark-background' : 'text-tamkeen-surface')
                      : (isDark ? 'text-tamkeenDark-textMuted' : 'text-tamkeen-textMuted')
                  }`}>
                    {juzNames[juz.number] || '...'}
                  </div>
                  <div className={`text-xs mt-1 ${
                    isSelected
                      ? (isDark ? 'text-tamkeenDark-background/80' : 'text-tamkeen-surface/80')
                      : (isDark ? 'text-tamkeenDark-textMuted' : 'text-tamkeen-textMuted')
                  }`}>
                    Pages {juz.startPage}-{juz.endPage}
                  </div>
                </button>
              );
            })}
          </div>
          {selectedRange.juzNumbers && selectedRange.juzNumbers.length > 0 && (
            <p className={`text-xs ${styles.subtitle}`}>
              Selected: {selectedRange.juzNumbers.length} Juz
            </p>
          )}
        </div>
      )}
    </div>
  );
}
