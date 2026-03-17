'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/schema';
import { CardList } from '@/components/review/CardList';
import { useThemeStore } from '@/lib/stores/theme-store';
import { State } from 'ts-fsrs';
import type { Card } from '@/types/database';

interface CardListModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  filterType: 'all' | 'new' | 'learning' | 'review' | 'dueToday' | 'dueThisWeek';
}

export function CardListModal({ isOpen, onClose, title, filterType }: CardListModalProps) {
  const { currentTheme } = useThemeStore();
  const isDark = currentTheme === 'tamkeen-dark';
  
  const cards = useLiveQuery(async () => {
    const allCards = await db.cards.toArray();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    let filtered: Card[];
    
    switch (filterType) {
      case 'all':
        filtered = allCards;
        break;
      case 'new':
        filtered = allCards.filter(c => c.state === State.New);
        break;
      case 'learning':
        filtered = allCards.filter(c => c.state === State.Learning);
        break;
      case 'review':
        filtered = allCards.filter(c => c.state === State.Review);
        break;
      case 'dueToday':
        filtered = allCards.filter(c => c.due <= tomorrow);
        break;
      case 'dueThisWeek':
        filtered = allCards.filter(c => c.due > tomorrow && c.due <= nextWeek);
        break;
      default:
        filtered = allCards;
    }
    
    return filtered.sort((a, b) => a.pageNumber - b.pageNumber);
  }, [filterType]);
  
  if (!isOpen) return null;
  
  const overlayClass = isDark 
    ? 'bg-black/70' 
    : 'bg-black/50';
  
  const modalClass = isDark
    ? 'bg-tamkeenDark-background border-2 border-tamkeenDark-primary/30'
    : 'bg-tamkeen-background border-2 border-tamkeen-accent/20';
  
  const cardStyle = isDark 
    ? 'bg-tamkeenDark-surface/90 backdrop-blur-sm border-2 border-tamkeenDark-primary/30 hover:border-tamkeenDark-accent hover:shadow-xl hover:shadow-tamkeenDark-accent/30'
    : 'bg-tamkeen-surface/90 backdrop-blur-sm border-2 border-tamkeen-accent/20 hover:border-tamkeen-primary hover:shadow-xl hover:shadow-tamkeen-primary/20';
  
  const titleClass = isDark ? 'text-tamkeenDark-primary' : 'text-tamkeen-primary';
  const textClass = isDark ? 'text-tamkeenDark-text' : 'text-tamkeen-text';
  const mutedClass = isDark ? 'text-tamkeenDark-textMuted' : 'text-tamkeen-textMuted';

  const closeButtonClass = isDark
    ? 'bg-tamkeenDark-surface/90 text-tamkeenDark-text hover:bg-tamkeenDark-primary hover:text-tamkeenDark-background'
    : 'bg-tamkeen-surface/90 text-tamkeen-text hover:bg-tamkeen-primary hover:text-tamkeen-surface';
  
  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${overlayClass} backdrop-blur-sm`} onClick={onClose}>
      <div 
        className={`${modalClass} rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-current border-opacity-20">
          <h2 className={`text-2xl font-bold ${titleClass}`}>
            {title} {cards && `(${cards.length})`}
          </h2>
          <button 
            onClick={onClose}
            className={`${closeButtonClass} px-4 py-2 rounded-lg font-semibold transition-all`}
          >
            ✕ Close
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!cards ? (
            <div className={`text-center p-8 ${textClass}`}>Loading cards...</div>
          ) : cards.length === 0 ? (
            <div className={`${cardStyle} p-8 text-center rounded-xl`}>
              <p className={`text-xl ${titleClass} mb-2`}>No cards found</p>
              <p className={mutedClass}>There are no cards matching this filter</p>
            </div>
          ) : (
            <CardList cards={cards} emptyMessage="No cards found" />
          )}
        </div>
      </div>
    </div>
  );
}
