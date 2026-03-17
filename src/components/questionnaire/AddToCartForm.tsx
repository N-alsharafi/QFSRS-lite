'use client';

import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { RangeSelector, type SelectedRange, type PageRange, type SurahRange } from './RangeSelector';
import { GeneralConfigForm, type GeneralConfig } from './GeneralConfigForm';
import type { CartEntry } from '@/lib/quran/cartResolution';
import { getAllSurahs, getAllJuzWithSurahs } from '@/lib/quran/metadata';
import { CONFIDENCE_LABELS } from '@/lib/quran/questionnaireCalculations';

interface AddToCartFormProps {
  onAddEntry: (entry: CartEntry) => void;
  isDark: boolean;
  styles: any;
}

export function AddToCartForm({
  onAddEntry,
  isDark,
  styles,
}: AddToCartFormProps) {
  const [draftRange, setDraftRange] = useState<SelectedRange>({ type: 'page' });
  const [draftConfig, setDraftConfig] = useState<GeneralConfig>({
    confidence: 'okay',
    timeKnown: null,
    reviewFrequency: null,
    makesManyMistakes: false,
    isDifficult: false,
  });

  const allSurahs = getAllSurahs();

  const getEntryLabel = (entry: CartEntry): string => {
    if (!entry.config.confidence) return 'Unknown';
    const confLabel = CONFIDENCE_LABELS[entry.config.confidence].split(' - ')[0];
    if (entry.type === 'page' && entry.pageRanges?.length) {
      const ranges = entry.pageRanges.map(r => `P${r.start}-${r.end}`).join(', ');
      return `Pages ${ranges} (${confLabel})`;
    }
    if (entry.type === 'surah' && entry.surahRanges?.length) {
      const ranges = entry.surahRanges.map(r => {
        const start = allSurahs[r.start - 1]?.transliteration || r.start;
        const end = allSurahs[r.end - 1]?.transliteration || r.end;
        return r.start === r.end ? start : `${start}-${end}`;
      }).join(', ');
      return `Surah ${ranges} (${confLabel})`;
    }
    if (entry.type === 'juz' && entry.juzNumbers?.length) {
      return `Juz ${entry.juzNumbers.join(', ')} (${confLabel})`;
    }
    return confLabel;
  };

  const canAdd = (): boolean => {
    const hasRange =
      (draftRange.type === 'page' && draftRange.pageRanges && draftRange.pageRanges.length > 0) ||
      (draftRange.type === 'surah' && draftRange.surahRanges && draftRange.surahRanges.length > 0) ||
      (draftRange.type === 'juz' && draftRange.juzNumbers && draftRange.juzNumbers.length > 0);
    const hasConfig = draftConfig.confidence && draftConfig.timeKnown && draftConfig.reviewFrequency;
    return !!hasRange && !!hasConfig;
  };

  const handleAddToCart = () => {
    if (!canAdd()) return;
    const filledConfig = {
      confidence: draftConfig.confidence!,
      timeKnown: draftConfig.timeKnown!,
      reviewFrequency: draftConfig.reviewFrequency!,
      makesManyMistakes: draftConfig.makesManyMistakes ?? false,
      isDifficult: draftConfig.isDifficult ?? false,
    };
    const entry: CartEntry = {
      id: uuidv4(),
      type: draftRange.type,
      config: filledConfig,
      label: getEntryLabel({ type: draftRange.type, config: filledConfig, pageRanges: draftRange.pageRanges, surahRanges: draftRange.surahRanges, juzNumbers: draftRange.juzNumbers, id: '', label: '' }),
    };
    if (draftRange.type === 'page' && draftRange.pageRanges) {
      entry.pageRanges = [...draftRange.pageRanges];
    } else if (draftRange.type === 'surah' && draftRange.surahRanges) {
      entry.surahRanges = [...draftRange.surahRanges];
    } else if (draftRange.type === 'juz' && draftRange.juzNumbers) {
      entry.juzNumbers = [...draftRange.juzNumbers];
    }
    onAddEntry(entry);
    setDraftRange({ type: draftRange.type });
    setDraftConfig({ confidence: 'okay', timeKnown: null, reviewFrequency: null, makesManyMistakes: false, isDifficult: false });
  };

  const draftPageCount = (): number => {
    if (draftRange.type === 'page' && draftRange.pageRanges?.length) {
      return draftRange.pageRanges.reduce((s, r) => s + (r.end - r.start + 1), 0);
    }
    if (draftRange.type === 'surah' && draftRange.surahRanges?.length) {
      return draftRange.surahRanges.reduce((sum, r) => {
        let count = 0;
        for (let i = r.start; i <= r.end; i++) {
          const surah = allSurahs[i - 1];
          if (surah) count += surah.endPage - surah.startPage + 1;
        }
        return sum + count;
      }, 0);
    }
    if (draftRange.type === 'juz' && draftRange.juzNumbers?.length) {
      const allJuz = getAllJuzWithSurahs();
      return draftRange.juzNumbers.reduce((s, n) => {
        const j = allJuz.find((j: any) => j.number === n);
        return s + (j ? j.endPage - j.startPage + 1 : 0);
      }, 0);
    }
    return 0;
  };

  const buttonBase = isDark
    ? 'bg-tamkeenDark-surface/90 border-2 border-tamkeenDark-primary/30 text-tamkeenDark-text'
    : 'bg-tamkeen-surface/90 border-2 border-tamkeen-accent/20 text-tamkeen-text';
  const buttonActive = isDark
    ? 'bg-tamkeenDark-primary text-tamkeenDark-background'
    : 'bg-tamkeen-primary text-tamkeen-surface';

  return (
    <div className="space-y-6">
      <p className={`text-sm ${styles.subtitle}`}>
        Add what you&apos;ve memorized. Each addition can have its own confidence level. 
        More specific selections (e.g. single page) override broader ones (e.g. entire surah).
      </p>

      <RangeSelector
        selectedRange={draftRange}
        onChange={setDraftRange}
        isDark={isDark}
        styles={styles}
      />

      {draftPageCount() > 0 && (
        <>
          <div className={`h-px ${isDark ? 'bg-tamkeenDark-primary/30' : 'bg-tamkeen-accent/20'}`} />
          <GeneralConfigForm
            config={draftConfig}
            onChange={setDraftConfig}
            cardCount={draftPageCount()}
            isDark={isDark}
            styles={styles}
          />
          <button
            onClick={handleAddToCart}
            disabled={!canAdd()}
            className={`w-full px-6 py-3 rounded-lg font-semibold transition-all ${
              canAdd() ? `${buttonActive} hover:scale-[1.02]` : 'bg-gray-400 text-gray-200 cursor-not-allowed opacity-50'
            }`}
          >
            + Add to Pile
          </button>
        </>
      )}
    </div>
  );
}
