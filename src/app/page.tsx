'use client';

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useThemeStore } from '@/lib/stores/theme-store';
import { ThemeSwitcher } from '@/components/ui/ThemeSwitcher';
import { IslamicPattern } from '@/components/ui/IslamicPattern';
import { db } from '@/lib/db/schema';
import { exportUserData, importUserData, type ExportData } from '@/lib/db/exportImport';
import NextConfig from '../../next.config';

/** Base path for the app, check next.config, its basepath is defined, set it here */
let basePath = NextConfig.basePath;
if (basePath) {
  /** If basepath is defined, set it to the basepath */
  basePath = `/${basePath}`;
} else {
  /** If basepath is not defined, set it to empty string */
  basePath = '';
}

export default function Home() {
  const router = useRouter();
  const { currentTheme } = useThemeStore();
  const isDark = currentTheme === 'tamkeen-dark';
  const [hasConfig, setHasConfig] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    db.config.count().then((n) => setHasConfig(n > 0));
  }, []);

  const handleExport = async () => {
    const data = await exportUserData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Nuqat-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text) as ExportData;
      await importUserData(data);
      setHasConfig(true);
      router.refresh();
    } catch (err) {
      alert('Invalid backup file. Please select a valid Nuqat export.');
    }
    e.target.value = '';
  };

  const handleReviewClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Check if config exists
    const configs = await db.config.toArray();
    
    if (configs.length === 0) {
      // No config, redirect to questionnaire
      router.push(`${basePath}/questionnaire`);
    } else {
      // Config exists, go to review page
      router.push(`${basePath}/review`);
    }
  };

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

      <main className="relative z-10 flex w-full max-w-screen-2xl flex-col items-center gap-16 px-8 py-20">
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
              نُقَط
            </div>
            {/* Subtle glow effect */}
            <div 
              className={`absolute inset-0 arabic-text text-8xl md:text-9xl font-bold tracking-wider blur-2xl opacity-30 ${styles.title}`}
              aria-hidden="true"
            >
              نُقَط
            </div>
          </div>

          {/* English Subtitle */}
          <div className="space-y-4 mb-12">
            <h2 className={`text-4xl md:text-5xl font-bold ${styles.title}`}>
              Nuqat
            </h2>
            <p className={`text-xl md:text-2xl ${styles.subtitle} max-w-4xl mx-auto`}>
              Master Quran memorization through the power of spaced repetition
            </p>
          </div>

          {/* Decorative Bottom Border */}
          <div className={`mx-auto w-32 h-1 ${styles.decorative} rounded-full`} />
        </div>

        {/* Feature Cards with Islamic-inspired design */}
        <div className="grid gap-8 md:grid-cols-2 w-full max-w-4xl">
          <Link
            href={`${basePath}/reader`}
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

          <button
            onClick={handleReviewClick}
            className={`group relative flex flex-col items-center gap-6 rounded-2xl ${styles.card} p-10 shadow-xl transition-all hover:scale-105 ${styles.hover} w-full`}
          >
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
              View Dashboard →
            </div>
          </button>
        </div>


        {/* What is this? | Appearance | Backup & Restore | Settings | Suggest/Report */}
        <div className="w-full max-w-[100vw] px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 w-full items-start">
            {/* What is this? */}
          <Link
            href={`${basePath}/what-is-this`}
            className={`group relative flex flex-col items-center gap-4 rounded-2xl ${styles.card} p-8 shadow-xl transition-all hover:scale-105 ${styles.hover}`}
          >
            <div className={`absolute top-0 right-0 w-20 h-20 ${styles.decorative} opacity-10 rounded-bl-full`} />
            <div className={`absolute bottom-0 left-0 w-20 h-20 ${styles.decorative} opacity-10 rounded-tr-full`} />
            <div className="text-4xl group-hover:scale-110 transition-transform">📜</div>
            <div className="text-center">
              <h3 className={`text-xl font-bold mb-1 ${styles.title}`}>
                What is this?
              </h3>
              <p className={`text-sm ${styles.subtitle}`}>
                Spaced repetition & Quran memorization
              </p>
            </div>
            <div className={`mt-auto px-4 py-1 rounded-full text-sm ${styles.accent}`}>
              Read more →
            </div>
          </Link>

          {/* Theme Switcher */}
          <div className={`${styles.card} rounded-2xl shadow-xl overflow-hidden p-8`}>
            <div className="text-center mb-6">
              <h3 className={`text-2xl font-bold mb-2 ${styles.title}`}>
                Appearance
              </h3>
              <p className={`text-sm ${styles.subtitle}`}>
                Choose light or dark mode
              </p>
            </div>
            <ThemeSwitcher />
          </div>

          {/* Export/Import */}
          <div className={`${styles.card} rounded-2xl shadow-xl overflow-hidden p-8`}>
            <div className="text-center mb-6">
              <h3 className={`text-2xl font-bold mb-2 ${styles.title}`}>
                Backup & Restore
              </h3>
              <p className={`text-sm ${styles.subtitle}`}>
                Export or import your settings and progress
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleExport}
                disabled={!hasConfig}
                title="Export settings & progress"
                className={`flex flex-col items-center justify-center gap-1 w-20 py-3 rounded-xl text-xs font-medium transition-all ${
                  hasConfig
                    ? isDark
                      ? 'bg-tamkeenDark-primary/90 text-tamkeenDark-background hover:opacity-90'
                      : 'bg-tamkeen-primary/90 text-tamkeen-surface hover:opacity-90'
                    : 'bg-gray-400/30 text-gray-400 cursor-not-allowed'
                }`}
              >
                <span className="text-2xl">📤</span>
                Export
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                title="Import settings & progress"
                className={`flex flex-col items-center justify-center gap-1 w-20 py-3 rounded-xl text-xs font-medium transition-all ${
                  isDark
                    ? 'border-2 border-tamkeenDark-primary/30 text-tamkeenDark-text hover:border-tamkeenDark-accent'
                    : 'border-2 border-tamkeen-accent/20 text-tamkeen-text hover:border-tamkeen-primary'
                }`}
              >
                <span className="text-2xl">📥</span>
                Import
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </div>
          </div>

          {/* Settings */}
          <button
            type="button"
            onClick={() => {
              if (!hasConfig) {
                alert('Please complete the Questionnaire first to edit settings.');
                router.push(`${basePath}/questionnaire`);
                return;
              }
              return router.push(`${basePath}/settings`);
            }}
            className={`group relative flex flex-col items-center gap-4 rounded-2xl ${styles.card} p-8 shadow-xl transition-all hover:scale-105 ${styles.hover} w-full text-left`}
          >
            <div className={`absolute top-0 right-0 w-20 h-20 ${styles.decorative} opacity-10 rounded-bl-full`} />
            <div className={`absolute bottom-0 left-0 w-20 h-20 ${styles.decorative} opacity-10 rounded-tr-full`} />
            <div className="text-4xl group-hover:scale-110 transition-transform">⚙️</div>
            <div className="text-center">
              <h3 className={`text-xl font-bold mb-1 ${styles.title}`}>
                Settings
              </h3>
              <p className={`text-sm ${styles.subtitle}`}>
                Edit questionnaire answers
              </p>
            </div>
            <div className={`mt-auto px-4 py-1 rounded-full text-sm ${styles.accent}`}>
              Open Settings →
            </div>
          </button>

          {/* Suggest features / Report bugs */}
          <a
            href="https://github.com/N-alsharafi/QFSRS-lite/issues"
            target="_blank"
            rel="noopener noreferrer"
            className={`group relative flex flex-col items-center gap-4 rounded-2xl ${styles.card} p-8 shadow-xl transition-all hover:scale-105 ${styles.hover}`}
          >
            <div className={`absolute top-0 right-0 w-20 h-20 ${styles.decorative} opacity-10 rounded-bl-full`} />
            <div className={`absolute bottom-0 left-0 w-20 h-20 ${styles.decorative} opacity-10 rounded-tr-full`} />
            <div className="text-4xl group-hover:scale-110 transition-transform">💬</div>
            <div className="text-center">
              <h3 className={`text-xl font-bold mb-1 ${styles.title}`}>
                Suggest / Report
              </h3>
              <p className={`text-sm ${styles.subtitle}`}>
                What would you like to see added/fixed?
              </p>
            </div>
            <div className={`mt-auto px-4 py-1 rounded-full text-sm ${styles.accent}`}>
              Open GitHub →
            </div>
          </a>
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
            This version of Nuqat runs completely on your local machine. No accounts, no tracking, no cloud storage.
          </p>
        </div>
      </main>
    </div>
  );
}
