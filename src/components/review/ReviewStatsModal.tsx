'use client';

import { useState, useEffect } from 'react';
import { useThemeStore } from '@/lib/stores/theme-store';
import {
  scheduleCardReview,
  scheduleBulkReview,
  penaltyToGrade,
  calculatePenalty,
} from '@/lib/review/scheduleReview';
import { getPageFirstVerseSnippet } from '@/lib/quran/verseText';
import type { Card } from '@/types/database';
import { Rating } from 'ts-fsrs';

interface ReviewStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Single card (one page) or multiple cards (multi-page range) */
  cards: Card[];
  /** Label for display, e.g. "Page 5" or "Pages 20–22" */
  label: string;
  onSuccess?: () => void;
}

/** Per-page stats for multi-page review */
interface PageStats {
  hesitations: number;
  mistakes: number;
  forgets: number;
}

/** Collapse sorted page numbers into "5-10,11,12" format */
function collapseToRanges(pages: number[]): string {
  if (pages.length === 0) return '';
  const sorted = [...pages].sort((a, b) => a - b);
  const parts: string[] = [];
  let start = sorted[0];
  let end = sorted[0];
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === end + 1) {
      end = sorted[i];
    } else {
      parts.push(start === end ? `${start}` : `${start}-${end}`);
      start = sorted[i];
      end = sorted[i];
    }
  }
  parts.push(start === end ? `${start}` : `${start}-${end}`);
  return parts.join(',');
}

/** Parse "5-10,11,12" format into array of page numbers. Invalid/duplicate entries are skipped. */
function parsePageRange(input: string): number[] {
  const seen = new Set<number>();
  const result: number[] = [];
  const parts = input.trim().split(/\s*,\s*/).filter(Boolean);
  for (const part of parts) {
    const dash = part.indexOf('-');
    if (dash === -1) {
      const n = parseInt(part, 10);
      if (!isNaN(n) && n >= 1 && n <= 604 && !seen.has(n)) {
        seen.add(n);
        result.push(n);
      }
    } else {
      const a = parseInt(part.slice(0, dash), 10);
      const b = parseInt(part.slice(dash + 1), 10);
      if (!isNaN(a) && !isNaN(b) && a >= 1 && b <= 604 && a <= b) {
        for (let p = a; p <= b; p++) {
          if (!seen.has(p)) {
            seen.add(p);
            result.push(p);
          }
        }
      }
    }
  }
  return result.sort((a, b) => a - b);
}

type StatVariant = 'hesitation' | 'mistake' | 'forget';

const STAT_COLORS: Record<StatVariant, { light: string; dark: string }> = {
  hesitation: {
    light: 'bg-tamkeen-hesitation/25 border-tamkeen-hesitation/60 hover:border-tamkeen-hesitation text-amber-800',
    dark: 'bg-tamkeenDark-hesitation/25 border-tamkeenDark-hesitation/60 hover:border-tamkeenDark-hesitation text-tamkeenDark-hesitation',
  },
  mistake: {
    light: 'bg-tamkeen-mistake/25 border-tamkeen-mistake/60 hover:border-tamkeen-mistake text-red-800',
    dark: 'bg-tamkeenDark-mistake/25 border-tamkeenDark-mistake/60 hover:border-tamkeenDark-mistake text-tamkeenDark-mistake',
  },
  forget: {
    light: 'bg-tamkeen-forget/30 border-tamkeen-forget/60 hover:border-tamkeen-forget text-gray-700',
    dark: 'bg-tamkeenDark-forget/25 border-tamkeenDark-forget/60 hover:border-tamkeenDark-forget text-tamkeenDark-forget',
  },
};

/** Single-page: clickable stat box with + and − */
function StatBox({
  label,
  value,
  variant,
  onIncrement,
  onDecrement,
  isDark,
}: {
  label: string;
  value: number;
  variant: StatVariant;
  onIncrement: () => void;
  onDecrement: () => void;
  isDark: boolean;
}) {
  const colorClass = isDark ? STAT_COLORS[variant].dark : STAT_COLORS[variant].light;
  const mutedClass = isDark ? 'text-tamkeenDark-textMuted' : 'text-tamkeen-textMuted';

  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className={`text-xs ${mutedClass}`}>{label}</span>
      <div
        className={`flex items-center justify-center gap-1.5 rounded-lg border-2 p-2 min-w-[64px] cursor-pointer select-none transition-all active:scale-95 ${colorClass}`}
        onClick={onIncrement}
        onContextMenu={(e) => {
          e.preventDefault();
          onDecrement();
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onIncrement();
          }
          if (e.key === 'Backspace') onDecrement();
        }}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onDecrement();
          }}
          className="opacity-60 hover:opacity-100 w-5 h-5 flex items-center justify-center rounded text-sm font-bold"
          aria-label={`Decrease ${label}`}
        >
          −
        </button>
        <span className="text-xl font-bold min-w-[2ch] text-center">
          {value}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onIncrement();
          }}
          className="opacity-60 hover:opacity-100 w-5 h-5 flex items-center justify-center rounded text-sm font-bold"
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

/** Multi-page: click only increments (no +/−) */
function IncrementBox({
  value,
  variant,
  onClick,
  isDark,
}: {
  value: number;
  variant: StatVariant;
  onClick: () => void;
  isDark: boolean;
}) {
  const colorClass = isDark ? STAT_COLORS[variant].dark : STAT_COLORS[variant].light;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className={`w-9 h-9 flex items-center justify-center rounded-lg border-2 cursor-pointer select-none transition-all active:scale-95 ${colorClass}`}
    >
      <span className="text-base font-bold">{value}</span>
    </div>
  );
}

export function ReviewStatsModal({
  isOpen,
  onClose,
  cards,
  label,
  onSuccess,
}: ReviewStatsModalProps) {
  const { currentTheme } = useThemeStore();
  const isDark = currentTheme === 'tamkeen-dark';

  const [hesitations, setHesitations] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [forgets, setForgets] = useState(0);

  /** Multi-page: stats per page */
  const [statsByPage, setStatsByPage] = useState<Record<number, PageStats>>({});

  /** Multi-page: which pages were reviewed (format: "5-10,11,12"). Default: full range. */
  const defaultPageRange = collapseToRanges(cards.map((c) => c.pageNumber));
  const [pageRangeInput, setPageRangeInput] = useState(defaultPageRange);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMultiPage = cards.length > 1;

  /** Reset page range when cards change (e.g. modal reopened with different filter) */
  const cardsPageKey = cards.map((c) => c.pageNumber).join(',');
  useEffect(() => {
    if (isMultiPage) {
      setPageRangeInput(collapseToRanges(cards.map((c) => c.pageNumber)));
    }
  }, [isMultiPage, cardsPageKey]);

  /** Parsed pages intersected with cards we have - only these get reviewed */
  const availablePages = new Set(cards.map((c) => c.pageNumber));
  const selectedPages = parsePageRange(pageRangeInput).filter((p) => availablePages.has(p));
  const cardsToReview = cards.filter((c) => selectedPages.includes(c.pageNumber));

  const modalClass = isDark
    ? 'bg-tamkeenDark-surface border-tamkeenDark-primary/30'
    : 'bg-tamkeen-surface border-tamkeen-accent/20';
  const titleClass = isDark ? 'text-tamkeenDark-primary' : 'text-tamkeen-primary';
  const textClass = isDark ? 'text-tamkeenDark-text' : 'text-tamkeen-text';
  const mutedClass = isDark ? 'text-tamkeenDark-textMuted' : 'text-tamkeen-textMuted';
  const buttonClass = isDark
    ? 'bg-tamkeenDark-primary text-tamkeenDark-background hover:bg-tamkeenDark-accent'
    : 'bg-tamkeen-surface/50 hover:bg-tamkeen-primary/20';
  const cancelClass = isDark
    ? 'bg-tamkeenDark-surface/50 hover:bg-tamkeenDark-primary/20'
    : 'bg-tamkeen-surface/50 hover:bg-tamkeen-primary/20';

  const getStatsForPage = (page: number): PageStats =>
    statsByPage[page] ?? { hesitations: 0, mistakes: 0, forgets: 0 };

  const handleMultiPageStatsChange = (page: number, key: keyof PageStats, delta: number) => {
    setStatsByPage((prev) => {
      const current = prev[page] ?? { hesitations: 0, mistakes: 0, forgets: 0 };
      const nextVal = Math.max(0, (current[key] ?? 0) + delta);
      return {
        ...prev,
        [page]: { ...current, [key]: nextVal },
      };
    });
  };

  const handlePageClick = (page: number) => {
    setStatsByPage((prev) => {
      const next = { ...prev };
      delete next[page];
      return next;
    });
  };

  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      if (cards.length === 1) {
        const penalty = calculatePenalty(hesitations, mistakes, forgets);
        const grade = penaltyToGrade(penalty);
        await scheduleCardReview(cards[0], grade);
      } else {
        await scheduleBulkReview(cardsToReview, (card) => {
          const stats = getStatsForPage(card.pageNumber);
          const penalty = calculatePenalty(stats.hesitations, stats.mistakes, stats.forgets);
          return penaltyToGrade(penalty);
        });
      }
      onSuccess?.();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setHesitations(0);
      setMistakes(0);
      setForgets(0);
      setStatsByPage({});
      setPageRangeInput(defaultPageRange);
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  const suggestedGrade = isMultiPage
    ? null
    : penaltyToGrade(calculatePenalty(hesitations, mistakes, forgets));
  const gradeLabels: Record<number, string> = {
    [Rating.Again]: 'Again',
    [Rating.Hard]: 'Hard',
    [Rating.Good]: 'Good',
    [Rating.Easy]: 'Easy',
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-modal-title"
    >
      <div
        className={`${modalClass} max-w-md w-full rounded-2xl border-2 p-5 shadow-xl max-h-[90vh] overflow-hidden flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="review-modal-title" className={`text-lg font-bold ${titleClass} mb-1`}>
          Review: {label}
        </h2>

        {isMultiPage ? (
          <>
            <div className="mb-3">
              <label className={`block text-xs ${mutedClass} mb-1`} htmlFor="page-range-input">
                Pages reviewed (e.g. 5-10,13,15)
              </label>
              <input
                id="page-range-input"
                type="text"
                value={pageRangeInput}
                onChange={(e) => setPageRangeInput(e.target.value)}
                placeholder="1-40"
                className={`w-full px-3 py-2 rounded-lg border-2 text-sm ${
                  isDark
                    ? 'bg-tamkeenDark-background border-tamkeenDark-primary/30 text-tamkeenDark-text focus:border-tamkeenDark-accent'
                    : 'bg-tamkeen-background border-tamkeen-accent/30 text-tamkeen-text focus:border-tamkeen-primary'
                } outline-none`}
              />
            </div>
            <p className={`text-sm ${mutedClass} mb-3`}>
              Click a page to reset its stats. Click a box to add.
            </p>
            {cardsToReview.length === 0 ? (
              <p className={`text-sm ${mutedClass} mb-6`}>
                No pages in range. Enter pages you have cards for (e.g. {defaultPageRange}).
              </p>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-2 mb-6">
                {cardsToReview.map((card) => (
                  <MultiPageListRow
                    key={card.id}
                    card={card}
                    stats={getStatsForPage(card.pageNumber)}
                    onStatsChange={handleMultiPageStatsChange}
                    onPageClick={handlePageClick}
                    isDark={isDark}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <p className={`text-sm ${mutedClass} mb-3`}>
              H / M / F. Click box to increment or − to decrement.
            </p>
            <div className="flex justify-center gap-4 mb-3">
              <StatBox
                label="Hesitations"
                value={hesitations}
                variant="hesitation"
                onIncrement={() => setHesitations((v) => v + 1)}
                onDecrement={() => setHesitations((v) => Math.max(0, v - 1))}
                isDark={isDark}
              />
              <StatBox
                label="Mistakes"
                value={mistakes}
                variant="mistake"
                onIncrement={() => setMistakes((v) => v + 1)}
                onDecrement={() => setMistakes((v) => Math.max(0, v - 1))}
                isDark={isDark}
              />
              <StatBox
                label="Forgets"
                value={forgets}
                variant="forget"
                onIncrement={() => setForgets((v) => v + 1)}
                onDecrement={() => setForgets((v) => Math.max(0, v - 1))}
                isDark={isDark}
              />
            </div>
            <p className={`text-sm ${mutedClass} mb-4`}>
              Suggested grade: <strong className={textClass}>{gradeLabels[suggestedGrade!]}</strong>
            </p>
          </>
        )}

        {error && (
          <p className="text-red-500 text-sm mb-4" role="alert">
            {error}
          </p>
        )}

        <div className="flex gap-3 shrink-0">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || (isMultiPage && cardsToReview.length === 0)}
            className={`flex-1 py-3 rounded-xl font-semibold transition-all disabled:opacity-50 ${buttonClass}`}
          >
            {isSubmitting ? 'Saving…' : 'Save Review'}
          </button>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className={`px-6 py-3 rounded-xl font-semibold ${cancelClass} ${textClass} disabled:opacity-50`}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/** Multi-page row with hover tooltip for verse snippet */
function MultiPageListRow({
  card,
  stats,
  onStatsChange,
  onPageClick,
  isDark,
}: {
  card: Card;
  stats: PageStats;
  onStatsChange: (page: number, key: keyof PageStats, delta: number) => void;
  onPageClick: (page: number) => void;
  isDark: boolean;
}) {
  const [snippet, setSnippet] = useState<string | null>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (hovered && !snippet) {
      getPageFirstVerseSnippet(card.pageNumber, 6).then(setSnippet);
    }
  }, [card.pageNumber, hovered, snippet]);

  const boxClass = isDark
    ? 'bg-tamkeenDark-surface border-tamkeenDark-primary/30 hover:border-tamkeenDark-accent'
    : 'bg-tamkeen-surface border-tamkeen-accent/20 hover:border-tamkeen-primary';
  const textClass = isDark ? 'text-tamkeenDark-text' : 'text-tamkeen-text';
  const mutedClass = isDark ? 'text-tamkeenDark-textMuted' : 'text-tamkeen-textMuted';

  return (
    <div
      className={`flex items-center gap-4 py-3 px-4 rounded-xl border-2 ${boxClass}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="flex-1 min-w-0 cursor-pointer select-none"
        onClick={() => onPageClick(card.pageNumber)}
      >
        {hovered && snippet ? (
          <span className={`text-sm arabic-clear ${textClass}`}>{snippet}</span>
        ) : (
          <span className={`font-bold ${textClass}`}>Page {card.pageNumber}</span>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={`text-xs ${mutedClass} w-4`}>H</span>
        <IncrementBox
          value={stats.hesitations}
          variant="hesitation"
          onClick={() => onStatsChange(card.pageNumber, 'hesitations', 1)}
          isDark={isDark}
        />
        <span className={`text-xs ${mutedClass} w-4`}>M</span>
        <IncrementBox
          value={stats.mistakes}
          variant="mistake"
          onClick={() => onStatsChange(card.pageNumber, 'mistakes', 1)}
          isDark={isDark}
        />
        <span className={`text-xs ${mutedClass} w-4`}>F</span>
        <IncrementBox
          value={stats.forgets}
          variant="forget"
          onClick={() => onStatsChange(card.pageNumber, 'forgets', 1)}
          isDark={isDark}
        />
      </div>
    </div>
  );
}
