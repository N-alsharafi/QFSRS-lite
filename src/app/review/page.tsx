'use client';

import { useState } from 'react';
import { useThemeStore } from '@/lib/stores/theme-store';
import { SurahGrid } from '@/components/review/SurahGrid';
import { ReviewStats } from '@/components/review/ReviewStats';
import { CardListModal, type CardListFilterType, type CardListFilterParams } from '@/components/review/CardListModal';
import { IslamicPattern } from '@/components/ui/IslamicPattern';
import Link from 'next/link';

export default function ReviewDashboard() {
  const { currentTheme } = useThemeStore();
  const isDark = currentTheme === 'tamkeen-dark';

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    filterType: CardListFilterType;
    title: string;
    filterParams?: CardListFilterParams;
  }>({
    isOpen: false,
    filterType: 'all',
    title: '',
  });

  const handleStatClick = (
    filterType: CardListFilterType,
    title: string
  ) => {
    setModalState({
      isOpen: true,
      filterType,
      title,
    });
  };

  const handleIndexCardClick = (
    filterType: 'surah' | 'pageRange',
    title: string,
    filterParams: CardListFilterParams
  ) => {
    setModalState({
      isOpen: true,
      filterType,
      title,
      filterParams,
    });
  };

  const handleCloseModal = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };
  
  const bgClass = isDark ? 'bg-tamkeenDark-background' : 'bg-tamkeen-background';
  const buttonClass = isDark 
    ? 'bg-tamkeenDark-surface/90 backdrop-blur-sm border-2 border-tamkeenDark-primary/30 text-tamkeenDark-primary hover:border-tamkeenDark-accent hover:shadow-xl hover:shadow-tamkeenDark-accent/30' 
    : 'bg-tamkeen-surface/90 backdrop-blur-sm border-2 border-tamkeen-accent/20 text-tamkeen-primary hover:border-tamkeen-primary hover:shadow-xl hover:shadow-tamkeen-primary/20';
  
  return (
    <div className={`relative min-h-screen ${bgClass} transition-colors duration-500`}>
      <IslamicPattern theme={currentTheme} />
      
      {/* Floating Back Button */}
      <Link 
        href="/" 
        className={`fixed top-6 left-6 z-50 px-6 py-3 rounded-xl ${buttonClass} font-semibold hover:scale-105 transition-all`}
      >
        ← Back
      </Link>
      
      <main className="relative z-10 max-w-7xl mx-auto p-6 pt-24 space-y-8">
        <ReviewStats onStatClick={handleStatClick} />
        <SurahGrid onCardClick={handleIndexCardClick} />
      </main>
      
      {modalState.isOpen && (
        <CardListModal
          isOpen={modalState.isOpen}
          onClose={handleCloseModal}
          title={modalState.title}
          filterType={modalState.filterType}
          filterParams={modalState.filterParams}
        />
      )}
    </div>
  );
}
