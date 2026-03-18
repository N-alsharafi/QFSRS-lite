'use client';

import { useThemeStore } from '@/lib/stores/theme-store';
import { IslamicPattern } from '@/components/ui/IslamicPattern';
import Link from 'next/link';

export default function ReaderPage() {
  const { currentTheme } = useThemeStore();
  const isDark = currentTheme === 'tamkeen-dark';

  const bgClass = isDark ? 'bg-tamkeenDark-background' : 'bg-tamkeen-background';
  const buttonClass = isDark
    ? 'bg-tamkeenDark-surface/90 backdrop-blur-sm border-2 border-tamkeenDark-primary/30 text-tamkeenDark-primary hover:border-tamkeenDark-accent hover:shadow-xl hover:shadow-tamkeenDark-accent/30'
    : 'bg-tamkeen-surface/90 backdrop-blur-sm border-2 border-tamkeen-accent/20 text-tamkeen-primary hover:border-tamkeen-primary hover:shadow-xl hover:shadow-tamkeen-primary/20';

  const textClass = isDark ? 'text-tamkeenDark-text' : 'text-tamkeen-text';
  const mutedClass = isDark ? 'text-tamkeenDark-textMuted' : 'text-tamkeen-textMuted';

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

      <main className="relative z-10 max-w-7xl mx-auto p-6 pt-24 flex items-center justify-center min-h-[80vh]">
        <div className={`text-center max-w-2xl ${textClass}`}>
          {/* Construction icons */}
          <div className="flex justify-center gap-4 mb-6 text-5xl md:text-6xl">
            <span role="img" aria-hidden="true">🚧</span>
            <span role="img" aria-hidden="true">🏗️</span>
            <span role="img" aria-hidden="true">🔧</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Coming Soon
          </h1>
          <p className={`text-lg md:text-xl ${mutedClass}`}>
            The Quran reader is under construction and will be available soon.
            You&apos;ll be able to read, navigate, and review with integrated spaced repetition.
          </p>
        </div>
      </main>
    </div>
  );
}
