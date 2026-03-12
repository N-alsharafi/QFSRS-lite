'use client';

import Link from "next/link";
import { useThemeStore } from '@/lib/stores/theme-store';
import { ThemeSwitcher } from '@/components/ui/ThemeSwitcher';
import { IslamicPattern } from '@/components/ui/IslamicPattern';

export default function Home() {
  const { currentTheme } = useThemeStore();
  const isDark = currentTheme === 'tamkeen-dark';

  // Tamkeen theme styles
  const styles = isDark ? {
    background: 'bg-tamkeenDark-background',
    card: 'bg-tamkeenDark-surface/90 backdrop-blur-sm border-2 border-tamkeenDark-primary/30',
    title: 'text-tamkeenDark-primary',
    subtitle: 'text-tamkeenDark-textMuted',
    text: 'text-tamkeenDark-text',
    accent: 'bg-tamkeenDark-primary text-tamkeenDark-background font-semibold',
    accentBorder: 'border-tamkeenDark-accent',
    hover: 'hover:border-tamkeenDark-accent hover:shadow-xl hover:shadow-tamkeenDark-accent/30',
    decorative: 'bg-gradient-to-br from-tamkeenDark-primary to-tamkeenDark-accent',
  } : {
    background: 'bg-tamkeen-background',
    card: 'bg-tamkeen-surface/90 backdrop-blur-sm border-2 border-tamkeen-accent/20',
    title: 'text-tamkeen-primary',
    subtitle: 'text-tamkeen-textMuted',
    text: 'text-tamkeen-text',
    accent: 'bg-tamkeen-primary text-tamkeen-surface font-semibold',
    accentBorder: 'border-tamkeen-primary',
    hover: 'hover:border-tamkeen-primary hover:shadow-xl hover:shadow-tamkeen-primary/20',
    decorative: 'bg-gradient-to-br from-tamkeen-primary to-tamkeen-accent',
  };

  return (
    <div className={`relative flex min-h-screen flex-col items-center justify-center ${styles.background} transition-colors duration-500`}>
      {/* Islamic Geometric Pattern Background */}
      <IslamicPattern theme={currentTheme} />

      <main className="relative z-10 flex w-full max-w-7xl flex-col items-center gap-16 px-8 py-20">
        {/* Hero Section with Arabic Calligraphy */}
        <div className="text-center">
          {/* Decorative Top Border */}
          <div className={`mx-auto w-32 h-1 ${styles.decorative} rounded-full mb-12`} />
          
          {/* Arabic Calligraphy */}
          <div className={`relative ${styles.title} mb-20`}>
            <div 
              className="arabic-text text-8xl md:text-9xl font-bold tracking-wider"
              style={{ 
                textShadow: '3px 3px 6px rgba(0,0,0,0.15)'
              }}
            >
              راجِع
            </div>
            {/* Subtle glow effect */}
            <div 
              className={`absolute inset-0 arabic-text text-8xl md:text-9xl font-bold tracking-wider blur-2xl opacity-30 ${styles.title}`}
              aria-hidden="true"
            >
              راجِع
            </div>
          </div>

          {/* English Subtitle */}
          <div className="space-y-4 mb-12">
            <h2 className={`text-4xl md:text-5xl font-bold ${styles.title}`}>
              Raj3
            </h2>
            <p className={`text-xl md:text-2xl ${styles.subtitle} max-w-4xl mx-auto`}>
              Master Quran memorization through the power of spaced repetition
            </p>
          </div>

          {/* Decorative Bottom Border */}
          <div className={`mx-auto w-32 h-1 ${styles.decorative} rounded-full`} />
        </div>

        {/* Theme Switcher */}
        <div className={`${styles.card} rounded-2xl shadow-xl overflow-hidden p-8`}>
          <div className={`text-center mb-6`}>
            <h3 className={`text-2xl font-bold mb-2 ${styles.title}`}>
              Appearance
            </h3>
            <p className={`text-sm ${styles.subtitle}`}>
              Choose light or dark mode
            </p>
          </div>
          <ThemeSwitcher />
        </div>

        {/* Feature Cards with Islamic-inspired design */}
        <div className="grid gap-8 md:grid-cols-2 w-full max-w-4xl">
          <Link
            href="/reader"
            className={`group relative flex flex-col items-center gap-6 rounded-2xl ${styles.card} p-10 shadow-xl transition-all hover:scale-105 ${styles.hover}`}
          >
            {/* Decorative corner */}
            <div className={`absolute top-0 right-0 w-20 h-20 ${styles.decorative} opacity-10 rounded-bl-full`} />
            <div className={`absolute bottom-0 left-0 w-20 h-20 ${styles.decorative} opacity-10 rounded-tr-full`} />
            
            <div className="text-6xl group-hover:scale-110 transition-transform">📖</div>
            <h3 className={`text-3xl font-bold ${styles.title}`}>
              Start Reading
            </h3>
            <p className={`text-center ${styles.subtitle} leading-relaxed`}>
              Experience the Quran with spatial consistency, designed for deep memorization
            </p>
            <div className={`mt-2 px-4 py-1 rounded-full text-sm ${styles.accent}`}>
              Begin Journey →
            </div>
          </Link>

          <div className={`group relative flex flex-col items-center gap-6 rounded-2xl ${styles.card} p-10 shadow-xl transition-all hover:scale-105 ${styles.hover}`}>
            {/* Decorative corner */}
            <div className={`absolute top-0 right-0 w-20 h-20 ${styles.decorative} opacity-10 rounded-bl-full`} />
            <div className={`absolute bottom-0 left-0 w-20 h-20 ${styles.decorative} opacity-10 rounded-tr-full`} />
            
            <div className="text-6xl group-hover:scale-110 transition-transform">🎯</div>
            <h3 className={`text-3xl font-bold ${styles.title}`}>
              Review Sessions
            </h3>
            <p className={`text-center ${styles.subtitle} leading-relaxed`}>
              Optimize your retention with FSRS-powered intelligent review scheduling
            </p>
            <div className={`mt-2 px-4 py-1 rounded-full text-sm ${styles.accent}`}>
              Coming Soon
            </div>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mt-8`}>
          {[
            { icon: '👋', title: 'Open Source', desc: 'You can contribute the features you want' },
            { icon: '📴', title: 'Offline', desc: 'Your data is only on your device' },
            { icon: '🎓', title: 'Science-Based', desc: 'FSRS spaced repetition' },
          ].map((feature, i) => (
            <div
              key={i}
              className={`flex flex-col items-center gap-3 p-6 rounded-xl ${styles.card} shadow-lg text-center transition-all hover:scale-105`}
            >
              <div className="text-4xl">{feature.icon}</div>
              <h4 className={`font-bold text-lg ${styles.title}`}>{feature.title}</h4>
              <p className={`text-sm ${styles.subtitle}`}>{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className={`text-center space-y-4 mt-8 ${styles.text}`}>
          <p className={`text-sm ${styles.subtitle} max-w-2xl mx-auto leading-relaxed`}>
            This version of Raj3 runs completely on your local machine. No accounts, no tracking, no cloud storage.
          </p>
        </div>
      </main>
    </div>
  );
}
