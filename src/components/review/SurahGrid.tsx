'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/schema';
import { 
  getAllJuzWithSurahs, 
  getAllSurahs,
  getAllHizbsWithSurahs,
  getAllHizbHalvesWithSurahs,
  getAllHizbQuartersWithSurahs
} from '@/lib/quran/metadata';
import { getJuzName, getHizbName } from '@/lib/quran/verseText';
import { State } from 'ts-fsrs';
import { useThemeStore } from '@/lib/stores/theme-store';
import type { RubAlHizbId } from 'quran-meta/hafs';

type ViewMode = 'juz' | 'surah' | 'hizb-full' | 'hizb-half' | 'hizb-quarter';

export function SurahGrid() {
  const { currentTheme } = useThemeStore();
  const isDark = currentTheme === 'tamkeen-dark';
  const [viewMode, setViewMode] = useState<ViewMode>('juz');
  
  const juzWithSurahs = getAllJuzWithSurahs();
  const allSurahs = getAllSurahs();
  
  // Only compute hizb data when needed for that view mode
  const hizbsFull = viewMode === 'hizb-full' ? getAllHizbsWithSurahs() : [];
  const hizbsHalf = viewMode === 'hizb-half' ? getAllHizbHalvesWithSurahs() : [];
  const hizbsQuarter = viewMode === 'hizb-quarter' ? getAllHizbQuartersWithSurahs() : [];
  
  // Calculate progress for each grouping type
  const juzProgress = useLiveQuery(async () => {
    const allCards = await db.cards.toArray();
    
    // Fetch all Juz names in parallel
    const juzData = await Promise.all(
      juzWithSurahs.map(async (juz) => {
        // Get cards whose page falls within this Juz's page range
        const juzCards = allCards.filter(card =>
          card.pageNumber >= juz.startPage && card.pageNumber <= juz.endPage
        );
        
        const totalCards = juzCards.length;
        const masteredCards = juzCards.filter(c => c.state === State.Review && c.stability > 100).length;
        const learningCards = juzCards.filter(c => c.state === State.Learning || c.state === State.Relearning).length;
        
        const masteredPercent = totalCards > 0 ? (masteredCards / totalCards) * 100 : 0;
        const learningPercent = totalCards > 0 ? (learningCards / totalCards) * 100 : 0;
        
        // Get verse-based name for the Juz (first 4 words of first verse)
        const verseName = await getJuzName(juz.number);
        
        return {
          number: juz.number,
          startPage: juz.startPage,
          endPage: juz.endPage,
          verseName, // Verse text (first 4 words)
          totalCards,
          masteredCards,
          learningCards,
          masteredPercent,
          learningPercent,
        };
      })
    );
    
    return juzData;
  });
  
  const surahProgress = useLiveQuery(async () => {
    const allCards = await db.cards.toArray();
    
    return allSurahs.map(surah => {
      const surahCards = allCards.filter(card => card.surahNumber === surah.number);
      
      const totalCards = surahCards.length;
      const masteredCards = surahCards.filter(c => c.state === State.Review && c.stability > 100).length;
      const learningCards = surahCards.filter(c => c.state === State.Learning || c.state === State.Relearning).length;
      
      const masteredPercent = totalCards > 0 ? (masteredCards / totalCards) * 100 : 0;
      const learningPercent = totalCards > 0 ? (learningCards / totalCards) * 100 : 0;
      
      return {
        ...surah,
        totalCards,
        masteredCards,
        learningCards,
        masteredPercent,
        learningPercent,
      };
    });
  });
  
  const hizbProgress = useLiveQuery(async () => {
    if (!viewMode.startsWith('hizb')) return null;
    
    const allCards = await db.cards.toArray();
    
    const hizbs = viewMode === 'hizb-full' ? hizbsFull :
                  viewMode === 'hizb-half' ? hizbsHalf :
                  viewMode === 'hizb-quarter' ? hizbsQuarter : [];
    
    if (hizbs.length === 0) return [];
    
    // Fetch all Hizb names in parallel
    const hizbData = await Promise.all(
      hizbs.map(async (hizb: any) => {
        // Get cards whose page falls within this Hizb's page range
        const hizbCards = allCards.filter(card =>
          card.pageNumber >= hizb.startPage && card.pageNumber <= hizb.endPage
        );
        
        const totalCards = hizbCards.length;
        const masteredCards = hizbCards.filter(c => c.state === State.Review && c.stability > 100).length;
        const learningCards = hizbCards.filter(c => c.state === State.Learning || c.state === State.Relearning).length;
        
        const masteredPercent = totalCards > 0 ? (masteredCards / totalCards) * 100 : 0;
        const learningPercent = totalCards > 0 ? (learningCards / totalCards) * 100 : 0;
        
        // Get verse-based name for the Hizb (first 4 words of first verse)
        const verseName = await getHizbName(hizb.quarterId as RubAlHizbId);
        
        return {
          number: hizb.number,
          juz: hizb.juz,
          startPage: hizb.startPage,
          endPage: hizb.endPage,
          verseName, // Verse text (first 4 words)
          totalCards,
          masteredCards,
          learningCards,
          masteredPercent,
          learningPercent,
        };
      })
    );
    
    return hizbData;
  }, [viewMode, hizbsFull, hizbsHalf, hizbsQuarter]);
  
  const titleClass = isDark ? 'text-tamkeenDark-primary' : 'text-tamkeen-primary';
  
  const buttonBase = isDark
    ? 'bg-tamkeenDark-surface/90 backdrop-blur-sm border-2 border-tamkeenDark-primary/30 text-tamkeenDark-text'
    : 'bg-tamkeen-surface/90 backdrop-blur-sm border-2 border-tamkeen-accent/20 text-tamkeen-text';
  
  const buttonActive = isDark
    ? 'bg-tamkeenDark-primary text-tamkeenDark-background border-tamkeenDark-primary'
    : 'bg-tamkeen-primary text-tamkeen-surface border-tamkeen-primary';
  
  const isLoading = !juzProgress || !surahProgress || 
    (viewMode.startsWith('hizb') && hizbProgress === undefined);
  
  if (isLoading) {
    return <div className="text-center p-4">Loading index...</div>;
  }
  
  return (
    <div dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <h2 className={`text-2xl font-bold ${titleClass}`}>
          Index
        </h2>
      </div>
      
      {/* View Mode Selector */}
      <div className="flex flex-wrap items-center w-full mb-6 gap-3" dir="ltr">
        <button
          onClick={() => setViewMode('juz')}
          className={`flex-1 min-w-[100px] px-4 py-2.5 rounded-lg font-semibold transition-all hover:scale-105 ${
            viewMode === 'juz' ? buttonActive : buttonBase
          }`}
        >
          Juz
        </button>
        
        <button
          onClick={() => setViewMode('surah')}
          className={`flex-1 min-w-[100px] px-4 py-2.5 rounded-lg font-semibold transition-all hover:scale-105 ${
            viewMode === 'surah' ? buttonActive : buttonBase
          }`}
        >
          Surah
        </button>
        
        <div className="flex flex-1 min-w-[240px]">
          <button
            onClick={() => setViewMode('hizb-full')}
            className={`flex-1 px-3 py-2.5 rounded-l-lg font-semibold transition-all hover:scale-105 text-sm ${
              viewMode === 'hizb-full' ? buttonActive : buttonBase
            }`}
          >
            Hizb
          </button>
          <button
            onClick={() => setViewMode('hizb-half')}
            className={`flex-1 px-3 py-2.5 font-semibold transition-all hover:scale-105 border-l-0 text-sm ${
              viewMode === 'hizb-half' ? buttonActive : buttonBase
            }`}
          >
            Half
          </button>
          <button
            onClick={() => setViewMode('hizb-quarter')}
            className={`flex-1 px-3 py-2.5 rounded-r-lg font-semibold transition-all hover:scale-105 border-l-0 text-sm ${
              viewMode === 'hizb-quarter' ? buttonActive : buttonBase
            }`}
          >
            Quarter
          </button>
        </div>
      </div>
      
      {/* Content based on view mode */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {viewMode === 'juz' && juzProgress.map(juz => (
          <UnifiedCard key={juz.number} item={juz} isDark={isDark} type="juz" />
        ))}
        
        {viewMode === 'surah' && surahProgress.map(surah => (
          <UnifiedCard key={surah.number} item={surah} isDark={isDark} type="surah" />
        ))}
        
        {viewMode.startsWith('hizb') && hizbProgress && hizbProgress.map(hizb => (
          <UnifiedCard 
            key={hizb.number} 
            item={hizb} 
            isDark={isDark} 
            type={viewMode}
          />
        ))}
      </div>
    </div>
  );
}

// Helper functions for Hizb numbering
function getHizbHalfLabel(halfNumber: number): string {
  // There are 2 halves per Hizb
  const hizbNumber = Math.ceil(halfNumber / 2);
  const halfWithinHizb = ((halfNumber - 1) % 2) + 1;
  return `Hizb ${hizbNumber} Half ${halfWithinHizb}`;
}

function getHizbQuarterLabel(quarterNumber: number): string {
  // There are 4 quarters per Hizb
  const hizbNumber = Math.ceil(quarterNumber / 4);
  const quarterWithinHizb = ((quarterNumber - 1) % 4) + 1;
  return `Hizb ${hizbNumber} Quarter ${quarterWithinHizb}`;
}

// Unified Card Component
interface UnifiedCardProps {
  item: any;
  isDark: boolean;
  type: 'juz' | 'surah' | 'hizb-full' | 'hizb-half' | 'hizb-quarter';
}

function UnifiedCard({ item, isDark, type }: UnifiedCardProps) {
  const hasCards = item.totalCards > 0;
  
  const getColor = () => {
    if (!hasCards) return 'bg-gray-400';
    if (item.masteredPercent >= 80) return isDark ? 'bg-green-600' : 'bg-green-500';
    if (item.masteredPercent >= 50) return isDark ? 'bg-yellow-600' : 'bg-yellow-500';
    if (item.learningPercent >= 30) return isDark ? 'bg-orange-600' : 'bg-orange-500';
    return isDark ? 'bg-red-600' : 'bg-red-500';
  };
  
  const cardStyle = isDark 
    ? 'bg-tamkeenDark-surface/90 backdrop-blur-sm border-2 border-tamkeenDark-primary/30 hover:border-tamkeenDark-accent hover:shadow-xl hover:shadow-tamkeenDark-accent/30'
    : 'bg-tamkeen-surface/90 backdrop-blur-sm border-2 border-tamkeen-accent/20 hover:border-tamkeen-primary hover:shadow-xl hover:shadow-tamkeen-primary/20';
  
  const textClass = isDark ? 'text-tamkeenDark-text' : 'text-tamkeen-text';
  const mutedClass = isDark ? 'text-tamkeenDark-textMuted' : 'text-tamkeen-textMuted';
  
  // Get name based on type
  const getName = () => {
    if (type === 'surah') {
      return {
        arabic: item.arabicName,
        transliteration: item.transliteration,
      };
    }
    
    // For Juz/Hizb, use verse name (first 3 words of first verse)
    return {
      arabic: item.verseName || '', // Fallback to empty string, not to Juz/Hizb label
      transliteration: '', // Verse text is already in Arabic
    };
  };
  
  const name = getName();
  const number = item.number;
  const pageRange = `${item.startPage}-${item.endPage}`;
  
  return (
    <div className={`${cardStyle} p-6 rounded-lg hover:scale-105 transition-all cursor-pointer relative`}>
      {/* Number on the right */}
      <div className={`absolute top-4 right-4 text-3xl font-bold ${textClass} opacity-30`}>
        {number}
      </div>
      
      {/* Name centered */}
      <div className="text-center mb-3 pt-2">
        {type === 'surah' ? (
          <>
            <div className={`text-lg arabic-clear ${textClass} font-semibold mb-1`}>
              {name.arabic}
            </div>
            <div className={`text-sm ${mutedClass}`}>
              {name.transliteration}
            </div>
          </>
        ) : (
          <>
            {/* Arabic verse text on top */}
            {name.arabic && (
              <div className={`text-lg arabic-clear ${textClass} font-semibold mb-1`}>
                {name.arabic}
              </div>
            )}
            {/* Juz/Hizb label below */}
            <div className={`text-sm ${mutedClass}`}>
              {type === 'juz' ? `Juz ${number}` : 
               type === 'hizb-full' ? `Hizb ${number}` :
               type === 'hizb-half' ? getHizbHalfLabel(number) :
               getHizbQuarterLabel(number)}
            </div>
          </>
        )}
      </div>
      
      {/* Page range */}
      <div className={`text-center text-xs ${mutedClass} mb-3`}>
        Pages {pageRange}
      </div>
      
      {/* Progress (only if cards exist) */}
      {hasCards && (
        <>
          <div className={`w-full h-2 ${getColor()} rounded-full mb-2`} />
          <div className={`text-center text-xs ${mutedClass}`}>
            {item.masteredCards}/{item.totalCards} cards
          </div>
        </>
      )}
    </div>
  );
}
