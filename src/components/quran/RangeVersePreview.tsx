'use client';

import { useState, useEffect } from 'react';
import { getSurahMeta, getPageVerseRange } from '@/lib/quran/metadata';
import { getVerseText } from '@/lib/quran/verseText';
import { useThemeStore } from '@/lib/stores/theme-store';
import type { Page, Surah } from 'quran-meta/hafs';

/** Arabic End of Ayah (U+06DD) - decorative verse ending symbol */
const AYAH_END = '\u06DD';
/** Ornate verse number brackets (U+FD3E, U+FD3F) */
const AYAH_BRACKET_OPEN = '\uFD3E';
const AYAH_BRACKET_CLOSE = '\uFD3F';

interface RangeVersePreviewProps {
  startPage: number;
  endPage: number;
}

/**
 * Shows the first verse of the first page and the last verse of the last page
 * in a page range, so users can preview the full range.
 */
export function RangeVersePreview({ startPage, endPage }: RangeVersePreviewProps) {
  const { currentTheme } = useThemeStore();
  const isDark = currentTheme === 'tamkeen-dark';

  const [firstVerse, setFirstVerse] = useState<{ surah: number; ayah: number; text: string } | null>(null);
  const [lastVerse, setLastVerse] = useState<{ surah: number; ayah: number; text: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadVerses() {
      setLoading(true);

      const firstRange = getPageVerseRange(startPage as Page);
      const lastRange = startPage === endPage ? firstRange : getPageVerseRange(endPage as Page);

      const [firstText, lastText] = await Promise.all([
        getVerseText(firstRange.first.surah, firstRange.first.ayah),
        getVerseText(lastRange.last.surah, lastRange.last.ayah),
      ]);

      if (cancelled) return;

      setFirstVerse(
        firstText
          ? { surah: firstRange.first.surah, ayah: firstRange.first.ayah, text: firstText }
          : null
      );
      setLastVerse(
        lastText
          ? { surah: lastRange.last.surah, ayah: lastRange.last.ayah, text: lastText }
          : null
      );
      setLoading(false);
    }

    loadVerses();
    return () => {
      cancelled = true;
    };
  }, [startPage, endPage]);

  const verseBoxStyle = isDark
    ? 'bg-tamkeenDark-background/50 backdrop-blur-sm border border-tamkeenDark-primary/20'
    : 'bg-tamkeen-background/50 backdrop-blur-sm border border-tamkeen-accent/10';

  const mutedClass = isDark ? 'text-tamkeenDark-textMuted' : 'text-tamkeen-textMuted';
  const primaryClass = isDark ? 'text-tamkeenDark-primary' : 'text-tamkeen-primary';

  if (loading) {
    return (
      <div className="p-4">
        <p className={`text-sm ${mutedClass} text-center`}>Loading verse preview...</p>
      </div>
    );
  }

  const hasAny = firstVerse || lastVerse;
  if (!hasAny) return null;

  const verseContent = (verse: { surah: number; ayah: number; text: string }, label: string) => (
    <div>
      <p className={`text-sm font-semibold ${mutedClass} mb-2`}>
        {label}: {getSurahMeta(verse.surah as Surah).transliteration} {verse.ayah}
      </p>
      <div className={`${verseBoxStyle} p-3 rounded-lg`}>
        <p className={`text-lg arabic-clear text-right leading-[calc(1em+3px)] ${primaryClass}`} dir="rtl">
          {AYAH_BRACKET_CLOSE}{verse.text}{AYAH_END}{AYAH_BRACKET_OPEN}
        </p>
      </div>
    </div>
  );

  const isSameVerse =
    firstVerse &&
    lastVerse &&
    firstVerse.surah === lastVerse.surah &&
    firstVerse.ayah === lastVerse.ayah;

  return (
    <div className="space-y-4">
      {firstVerse && verseContent(firstVerse, 'First verse')}
      {lastVerse && !isSameVerse && (
        <div className={firstVerse ? 'border-t border-current/10 pt-4' : ''}>
          {verseContent(lastVerse, 'Last verse')}
        </div>
      )}
    </div>
  );
}
