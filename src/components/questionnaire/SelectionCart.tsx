'use client';

import { useMemo } from 'react';
import { resolveCartEntries, type ResolvedPage, type CartEntry } from '@/lib/quran/cartResolution';
import { CONFIDENCE_LABELS, TIME_LABELS, FREQUENCY_LABELS } from '@/lib/quran/questionnaireCalculations';
import type { ConfidenceLevel } from '@/lib/quran/questionnaireCalculations';

interface SelectionCartProps {
  entries: CartEntry[];
  onRemoveEntry: (id: string) => void;
  isDark: boolean;
  styles: any;
}

/** Group resolved pages by config for display */
function groupByConfig(pages: ResolvedPage[]): Map<string, { config: ResolvedPage['config']; pages: number[]; label: string }> {
  const groups = new Map<string, { config: ResolvedPage['config']; pages: number[]; label: string }>();
  
  for (const p of pages) {
    const key = `${p.config.confidence}-${p.config.timeKnown}-${p.config.reviewFrequency}`;
    if (!groups.has(key)) {
      groups.set(key, {
        config: p.config,
        pages: [],
        label: `${CONFIDENCE_LABELS[p.config.confidence as ConfidenceLevel]?.split(' - ')[0] || p.config.confidence} • ${TIME_LABELS[p.config.timeKnown] || p.config.timeKnown}`,
      });
    }
    groups.get(key)!.pages.push(p.pageNumber);
  }
  
  return groups;
}

export function SelectionCart({ entries, onRemoveEntry, isDark, styles }: SelectionCartProps) {
  const resolved = useMemo(() => resolveCartEntries(entries), [entries]);
  const grouped = useMemo(() => groupByConfig(resolved), [resolved]);

  const buttonBase = isDark
    ? 'bg-tamkeenDark-surface/90 border border-tamkeenDark-primary/30 text-tamkeenDark-text'
    : 'bg-tamkeen-surface/90 border border-tamkeen-accent/20 text-tamkeen-text';

  const formatPageRanges = (pages: number[]): string => {
    pages.sort((a, b) => a - b);
    const ranges: string[] = [];
    let start = pages[0];
    let end = pages[0];
    
    for (let i = 1; i <= pages.length; i++) {
      if (i < pages.length && pages[i] === end + 1) {
        end = pages[i];
      } else {
        ranges.push(start === end ? `p.${start}` : `pp.${start}-${end}`);
        if (i < pages.length) {
          start = pages[i];
          end = pages[i];
        }
      }
    }
    return ranges.join(', ');
  };

  const getEntryLabel = (entry: CartEntry): string => {
    if (entry.type === 'page' && entry.pageRanges?.length) {
      const total = entry.pageRanges.reduce((s, r) => s + (r.end - r.start + 1), 0);
      return `Pages (${total})`;
    }
    if (entry.type === 'surah' && entry.surahRanges?.length) {
      const r = entry.surahRanges[0];
      return r.start === r.end ? `Surah ${r.start}` : `Surah ${r.start}-${r.end}`;
    }
    if (entry.type === 'juz' && entry.juzNumbers?.length) {
      return `Juz ${entry.juzNumbers.join(', ')}`;
    }
    return 'Selection';
  };

  return (
    <div className={`sticky top-24 ${buttonBase} rounded-xl p-5 shadow-lg max-h-[calc(100vh-8rem)] overflow-hidden flex flex-col`}>
      <h3 className={`text-lg font-bold mb-4 ${styles.title}`}>
        Your Selection
      </h3>
      <p className={`text-sm mb-4 ${styles.subtitle}`}>
        One card per page. More specific selections override broader ones.
      </p>

      {/* Resolved summary */}
      <div className="mb-4">
        <div className={`text-2xl font-bold ${styles.title}`}>
          {resolved.length} unique page{resolved.length !== 1 ? 's' : ''}
        </div>
        <div className={`text-xs ${styles.subtitle} mt-1`}>
          Will be added to database
        </div>
      </div>

      {/* Grouped by config */}
      {grouped.size > 0 && (
        <div className="space-y-3 flex-1 overflow-y-auto min-h-0">
          {Array.from(grouped.entries()).map(([key, { config, pages, label }]) => (
            <div
              key={key}
              className={`p-3 rounded-lg ${
                isDark 
                  ? 'bg-tamkeenDark-background/50 border border-tamkeenDark-primary/20' 
                  : 'bg-tamkeen-background/50 border border-tamkeen-accent/20'
              }`}
            >
              <div className={`font-semibold text-sm ${styles.title}`}>{label}</div>
              <div className={`text-xs mt-1 ${styles.subtitle}`}>
                {pages.length} page{pages.length !== 1 ? 's' : ''}: {formatPageRanges(pages)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Added entries (can remove) */}
      {entries.length > 0 && (
        <div className="mt-4 pt-4 border-t border-current border-opacity-20">
          <div className={`text-xs font-semibold mb-2 ${styles.subtitle}`}>Added:</div>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className={`flex items-center justify-between p-2 rounded text-sm ${
                  isDark ? 'bg-tamkeenDark-background/30' : 'bg-tamkeen-background/30'
                }`}
              >
                <span className={`truncate ${styles.text}`}>
                  {getEntryLabel(entry)} ({entry.config.confidence})
                </span>
                <button
                  onClick={() => onRemoveEntry(entry.id)}
                  className={`ml-2 flex-shrink-0 px-2 py-0.5 rounded text-xs font-semibold transition-all ${
                    isDark
                      ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                      : 'bg-red-500/10 text-red-600 hover:bg-red-500/20'
                  }`}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {entries.length === 0 && (
        <div className={`text-sm italic ${styles.subtitle} flex-1`}>
          Add memorized content by page, surah, or juz. Each add can have its own confidence level.
        </div>
      )}
    </div>
  );
}
