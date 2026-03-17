'use client';

import { useState } from 'react';
import { getPageSurahs } from '@/lib/quran/metadata';
import { groupCardsByPageRanges, type PageRangeGroup } from '@/lib/quran/cardGrouping';
import { VerseContext } from '@/components/quran/VerseContext';
import { RangeVersePreview } from '@/components/quran/RangeVersePreview';
import { useThemeStore } from '@/lib/stores/theme-store';
import type { Card } from '@/types/database';
import type { Page } from 'quran-meta/hafs';

interface CardListProps {
  cards: Card[];
  /** Optional: render a custom empty state */
  emptyMessage?: string;
  /** Optional: subtitle for empty state */
  emptySubMessage?: string;
}

export function CardList({ cards, emptyMessage = 'No cards found', emptySubMessage = 'There are no cards matching this filter' }: CardListProps) {
  const { currentTheme } = useThemeStore();
  const isDark = currentTheme === 'tamkeen-dark';
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const groups = groupCardsByPageRanges(cards);

  const cardStyle = isDark
    ? 'bg-tamkeenDark-surface/90 backdrop-blur-sm border-2 border-tamkeenDark-primary/30 hover:border-tamkeenDark-accent hover:shadow-xl hover:shadow-tamkeenDark-accent/30'
    : 'bg-tamkeen-surface/90 backdrop-blur-sm border-2 border-tamkeen-accent/20 hover:border-tamkeen-primary hover:shadow-xl hover:shadow-tamkeen-primary/20';

  const titleClass = isDark ? 'text-tamkeenDark-primary' : 'text-tamkeen-primary';
  const textClass = isDark ? 'text-tamkeenDark-text' : 'text-tamkeen-text';
  const mutedClass = isDark ? 'text-tamkeenDark-textMuted' : 'text-tamkeen-textMuted';
  const buttonClass = isDark
    ? 'bg-tamkeenDark-primary text-tamkeenDark-background hover:bg-tamkeenDark-accent'
    : 'bg-tamkeen-primary text-tamkeen-surface hover:bg-tamkeen-accent';

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  if (cards.length === 0) {
    return (
      <div className={`${cardStyle} p-8 text-center rounded-xl`}>
        <p className={`text-xl ${titleClass} mb-2`}>{emptyMessage}</p>
        <p className={mutedClass}>{emptySubMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {groups.map((group) => {
        const key = `${group.startPage}-${group.endPage}`;
        const isExpanded = expandedGroups.has(key);

        if (group.cards.length === 1) {
          const card = group.cards[0];
          const pageSurahs = getPageSurahs(card.pageNumber as Page);
          return (
            <div key={card.id} className={`${cardStyle} p-6 rounded-xl transition-all`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className={`text-xl font-bold ${titleClass}`}>Page {card.pageNumber}</h3>
                  <p className={`text-sm ${mutedClass}`}>
                    {pageSurahs
                      .map((ps) =>
                        ps.firstAyah === ps.lastAyah
                          ? `${ps.transliteration} • Verse ${ps.firstAyah}`
                          : `${ps.transliteration} • Verses ${ps.firstAyah}-${ps.lastAyah}`
                      )
                      .join(' , ')}
                  </p>
                </div>
                <button
                  className={`${buttonClass} px-6 py-3 rounded-lg font-semibold hover:scale-105 transition-transform`}
                >
                  Review Now
                </button>
              </div>
              <VerseContext pageNumber={card.pageNumber} />
            </div>
          );
        }

        return (
          <GroupSection
            key={key}
            group={group}
            isExpanded={isExpanded}
            onToggle={() => toggleGroup(key)}
            cardStyle={cardStyle}
            titleClass={titleClass}
            mutedClass={mutedClass}
            buttonClass={buttonClass}
          />
        );
      })}
    </div>
  );
}

interface GroupSectionProps {
  group: PageRangeGroup;
  isExpanded: boolean;
  onToggle: () => void;
  cardStyle: string;
  titleClass: string;
  mutedClass: string;
  buttonClass: string;
}

function GroupSection({
  group,
  isExpanded,
  onToggle,
  cardStyle,
  titleClass,
  mutedClass,
  buttonClass,
}: GroupSectionProps) {
  const juzLabel = group.juz != null ? ` · Juz ${group.juz}` : '';
  const expandButtonClass = titleClass;

  const firstPageSurahs = getPageSurahs(group.startPage as Page);
  const lastPageSurahs = getPageSurahs(group.endPage as Page);
  const surahLabel =
    group.startPage === group.endPage
      ? firstPageSurahs
          .map((ps) =>
            ps.firstAyah === ps.lastAyah
              ? `${ps.transliteration} • Verse ${ps.firstAyah}`
              : `${ps.transliteration} • Verses ${ps.firstAyah}-${ps.lastAyah}`
          )
          .join(' · ')
      : firstPageSurahs
          .map((ps) =>
            ps.firstAyah === ps.lastAyah
              ? `${ps.transliteration} ${ps.firstAyah}`
              : `${ps.transliteration} ${ps.firstAyah}-${ps.lastAyah}`
          )
          .join(', ') +
        ' … ' +
        lastPageSurahs
          .map((ps) =>
            ps.firstAyah === ps.lastAyah
              ? `${ps.transliteration} ${ps.lastAyah}`
              : `${ps.transliteration} ${ps.firstAyah}-${ps.lastAyah}`
          )
          .join(', ');

  return (
    <div className={`${cardStyle} rounded-xl overflow-hidden`}>
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className={`text-xl font-bold ${titleClass}`}>
              {group.label}{juzLabel}
            </h3>
            <p className={`text-sm ${mutedClass}`}>{surahLabel}</p>
            {group.cards.length > 1 && (
              <p className={`text-xs ${mutedClass} mt-1`}>
                {group.cards.length} pages
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              className={`${buttonClass} px-6 py-3 rounded-lg font-semibold hover:scale-105 transition-transform`}
            >
              Review Now
            </button>
            <button
              type="button"
              onClick={onToggle}
              className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-xl font-bold ${expandButtonClass} hover:opacity-80 transition-opacity`}
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? '−' : '+'}
            </button>
          </div>
        </div>
        <RangeVersePreview startPage={group.startPage} endPage={group.endPage} />
      </div>

      {isExpanded && (
        <div className="p-3 pt-0 space-y-3 border-t border-current/10">
          {group.cards.map((card) => {
            const pageSurahs = getPageSurahs(card.pageNumber as Page);
            return (
              <div key={card.id} className={`${cardStyle} p-6 rounded-xl transition-all`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className={`text-xl font-bold ${titleClass}`}>Page {card.pageNumber}</h3>
                    <p className={`text-sm ${mutedClass}`}>
                      {pageSurahs
                        .map((ps) =>
                          ps.firstAyah === ps.lastAyah
                            ? `${ps.transliteration} • Verse ${ps.firstAyah}`
                            : `${ps.transliteration} • Verses ${ps.firstAyah}-${ps.lastAyah}`
                        )
                        .join(' · ')}
                    </p>
                  </div>
                  <button
                    className={`${buttonClass} px-6 py-3 rounded-lg font-semibold hover:scale-105 transition-transform`}
                  >
                    Review Now
                  </button>
                </div>
                <VerseContext pageNumber={card.pageNumber} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
