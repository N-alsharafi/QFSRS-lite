'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/schema';
import { CardList } from '@/components/review/CardList';
import { useThemeStore } from '@/lib/stores/theme-store';

export function DueCardsPanel() {
  const { currentTheme } = useThemeStore();
  const isDark = currentTheme === 'tamkeen-dark';

  const dueCards = useLiveQuery(async () => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const cards = await db.cards
      .where('due')
      .belowOrEqual(today)
      .toArray();

    return cards.sort((a, b) => a.pageNumber - b.pageNumber);
  });

  const titleClass = isDark ? 'text-tamkeenDark-primary' : 'text-tamkeen-primary';
  const textClass = isDark ? 'text-tamkeenDark-text' : 'text-tamkeen-text';

  if (!dueCards) {
    return <div className={`text-center p-4 ${textClass}`}>Loading due cards...</div>;
  }

  if (dueCards.length === 0) {
    return (
      <CardList
        cards={[]}
        emptyMessage="🎉 No cards due today!"
        emptySubMessage="Great job staying on top of your reviews"
      />
    );
  }

  return (
    <div>
      <h2 className={`text-2xl font-bold mb-4 ${titleClass}`}>
        Due Today ({dueCards.length})
      </h2>
      <CardList cards={dueCards} emptyMessage="No cards due" />
    </div>
  );
}
