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

interface VerseContextProps {
  /** The page number this card/section is on (used to derive previous/next page verses) */
  pageNumber: number;
}

/**
 * Shows the last verse of the previous page and the first verse of the next page
 * to help users identify where they are in the Quran.
 * Uses getVerseText (quran-search-engine) for actual Arabic verse text.
 */
export function VerseContext({ pageNumber }: VerseContextProps) {
  const { currentTheme } = useThemeStore();
  const isDark = currentTheme === 'tamkeen-dark';

  const [prevVerse, setPrevVerse] = useState<{ surah: number; ayah: number; text: string } | null>(null);
  const [nextVerse, setNextVerse] = useState<{ surah: number; ayah: number; text: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadVerses() {
      setLoading(true);

      const prevRange = pageNumber > 1 ? getPageVerseRange((pageNumber - 1) as Page) : null;
      const nextRange = pageNumber < 604 ? getPageVerseRange((pageNumber + 1) as Page) : null;

      const [prevText, nextText] = await Promise.all([
        prevRange ? getVerseText(prevRange.last.surah, prevRange.last.ayah) : null,
        nextRange ? getVerseText(nextRange.first.surah, nextRange.first.ayah) : null,
      ]);

      if (cancelled) return;

      setPrevVerse(
        prevRange && prevText
          ? { surah: prevRange.last.surah, ayah: prevRange.last.ayah, text: prevText }
          : null
      );
      setNextVerse(
        nextRange && nextText
          ? { surah: nextRange.first.surah, ayah: nextRange.first.ayah, text: nextText }
          : null
      );
      setLoading(false);
    }

    loadVerses();
    return () => {
      cancelled = true;
    };
  }, [pageNumber]);

  const cardStyle = isDark
    ? 'bg-tamkeenDark-surface/90 backdrop-blur-sm border-2 border-tamkeenDark-primary/30'
    : 'bg-tamkeen-surface/90 backdrop-blur-sm border-2 border-tamkeen-accent/20';

  const verseBoxStyle = isDark
    ? 'bg-tamkeenDark-background/50 backdrop-blur-sm border border-tamkeenDark-primary/20'
    : 'bg-tamkeen-background/50 backdrop-blur-sm border border-tamkeen-accent/10';

  const mutedClass = isDark ? 'text-tamkeenDark-textMuted' : 'text-tamkeen-textMuted';
  const primaryClass = isDark ? 'text-tamkeenDark-primary' : 'text-tamkeen-primary';

  if (loading) {
    return (
      <div className={`${cardStyle} p-4 rounded-lg`}>
        <p className={`text-sm ${mutedClass} text-center`}>Loading verse context...</p>
      </div>
    );
  }

  const hasAny = prevVerse || nextVerse;
  if (!hasAny) {
    return (
      <div className={`${cardStyle} p-4 rounded-lg`}>
        <p className={`text-sm ${mutedClass} text-center`}>
          Page {pageNumber} — Beginning and end of Quran
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${cardStyle} p-4 rounded-lg`}>
      {prevVerse && (
        <div>
          <p className={`text-sm font-semibold ${mutedClass} mb-2`}>
            Last verse of page {pageNumber - 1}: {getSurahMeta(prevVerse.surah as Surah).transliteration}{' '}
            {prevVerse.ayah}
          </p>
          <div className={`${verseBoxStyle} p-3 rounded-lg`}>
            <p className={`text-lg arabic-clear text-right leading-[calc(1em+14px)] ${primaryClass}`} dir="rtl">
            {AYAH_BRACKET_CLOSE}{prevVerse.text}{AYAH_END}{AYAH_BRACKET_OPEN}
            </p>
          </div>
        </div>
      )}

      {nextVerse && (
        <div className={prevVerse ? 'border-t border-current/10 pt-4' : ''}>
          <p className={`text-sm font-semibold ${mutedClass} mb-2`}>
            First verse of page {pageNumber + 1}: {getSurahMeta(nextVerse.surah as Surah).transliteration}{' '}
            {nextVerse.ayah}
          </p>
          <div className={`${verseBoxStyle} p-3 rounded-lg`}>
            <p className={`text-lg arabic-clear text-right leading-[calc(1em+14px)] ${primaryClass}`} dir="rtl">
            {AYAH_BRACKET_CLOSE}{nextVerse.text}{AYAH_END}{AYAH_BRACKET_OPEN}
            </p>
          </div>
        </div>
      )}

      <p className={`text-xs ${mutedClass} text-center pt-2 border-t border-current/10`}>
        Context around page {pageNumber}
      </p>
    </div>
  );
}
