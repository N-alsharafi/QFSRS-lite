'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/schema';
import { State } from 'ts-fsrs';
import { useThemeStore } from '@/lib/stores/theme-store';

interface ReviewStatsProps {
  onStatClick: (filterType: 'all' | 'new' | 'learning' | 'review' | 'dueToday' | 'dueThisWeek', title: string) => void;
}

export function ReviewStats({ onStatClick }: ReviewStatsProps) {
  const { currentTheme } = useThemeStore();
  const isDark = currentTheme === 'tamkeen-dark';
  
  const stats = useLiveQuery(async () => {
    const allCards = await db.cards.toArray();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    return {
      total: allCards.length,
      new: allCards.filter(c => c.state === State.New).length,
      learning: allCards.filter(c => c.state === State.Learning).length,
      review: allCards.filter(c => c.state === State.Review).length,
      dueToday: allCards.filter(c => c.due <= tomorrow).length,
      dueSoon: allCards.filter(c => c.due > tomorrow && c.due <= nextWeek).length,
    };
  });
  
  if (!stats) return <div className="text-center p-4">Loading stats...</div>;
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <StatCard 
        label="Total Cards" 
        value={stats.total} 
        color="primary" 
        isDark={isDark} 
        onClick={() => onStatClick('all', 'All Cards')}
      />
      <StatCard 
        label="New" 
        value={stats.new} 
        color="muted" 
        isDark={isDark} 
        onClick={() => onStatClick('new', 'New Cards')}
      />
      <StatCard 
        label="Learning" 
        value={stats.learning} 
        color="accent" 
        isDark={isDark} 
        onClick={() => onStatClick('learning', 'Learning Cards')}
      />
      <StatCard 
        label="Review" 
        value={stats.review} 
        color="primary" 
        isDark={isDark} 
        onClick={() => onStatClick('review', 'Review Cards')}
      />
      <StatCard 
        label="Due Today" 
        value={stats.dueToday} 
        color="primary" 
        isDark={isDark} 
        onClick={() => onStatClick('dueToday', 'Due Today')}
      />
      <StatCard 
        label="Due This Week" 
        value={stats.dueSoon} 
        color="accent" 
        isDark={isDark} 
        onClick={() => onStatClick('dueThisWeek', 'Due This Week')}
      />
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  color: 'primary' | 'accent' | 'muted';
  isDark: boolean;
  onClick: () => void;
}

function StatCard({ label, value, color, isDark, onClick }: StatCardProps) {
  const colorClass = isDark
    ? color === 'primary' ? 'text-tamkeenDark-primary'
      : color === 'accent' ? 'text-tamkeenDark-accent'
      : 'text-tamkeenDark-textMuted'
    : color === 'primary' ? 'text-tamkeen-primary'
      : color === 'accent' ? 'text-tamkeen-accent'
      : 'text-tamkeen-textMuted';
  
  const cardStyle = isDark 
    ? 'bg-tamkeenDark-surface/90 backdrop-blur-sm border-2 border-tamkeenDark-primary/30 hover:border-tamkeenDark-accent hover:shadow-xl hover:shadow-tamkeenDark-accent/30'
    : 'bg-tamkeen-surface/90 backdrop-blur-sm border-2 border-tamkeen-accent/20 hover:border-tamkeen-primary hover:shadow-xl hover:shadow-tamkeen-primary/20';
  
  const textClass = isDark ? 'text-tamkeenDark-text' : 'text-tamkeen-text';
  
  return (
    <button 
      onClick={onClick}
      className={`${cardStyle} p-6 rounded-xl text-center hover:scale-105 transition-all cursor-pointer`}
    >
      <div className={`text-4xl font-bold ${colorClass} mb-2`}>{value}</div>
      <div className={`text-sm ${textClass}`}>{label}</div>
    </button>
  );
}
