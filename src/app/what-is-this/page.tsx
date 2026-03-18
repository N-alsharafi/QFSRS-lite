'use client';

import { useThemeStore } from '@/lib/stores/theme-store';
import { IslamicPattern } from '@/components/ui/IslamicPattern';
import Link from 'next/link';
import NextConfig from '../../../next.config';
/** Base path for the app, check next.config, its basepath is defined, set it here */
let basePath = NextConfig.basePath;
if (basePath) {
  /** If basepath is defined, set it to the basepath */
  basePath = `/${basePath}`;
} else {
  /** If basepath is not defined, set it to empty string */
  basePath = '';
}
export default function WhatIsThisPage() {
  const { currentTheme } = useThemeStore();
  const isDark = currentTheme === 'tamkeen-dark';

  const bgClass = isDark ? 'bg-tamkeenDark-background' : 'bg-tamkeen-background';
  const buttonClass = isDark
    ? 'bg-tamkeenDark-surface/90 backdrop-blur-sm border-2 border-tamkeenDark-primary/30 text-tamkeenDark-primary hover:border-tamkeenDark-accent hover:shadow-xl hover:shadow-tamkeenDark-accent/30'
    : 'bg-tamkeen-surface/90 backdrop-blur-sm border-2 border-tamkeen-accent/20 text-tamkeen-primary hover:border-tamkeen-primary hover:shadow-xl hover:shadow-tamkeen-primary/20';

  const textClass = isDark ? 'text-tamkeenDark-text' : 'text-tamkeen-text';
  const mutedClass = isDark ? 'text-tamkeenDark-textMuted' : 'text-tamkeen-textMuted';
  const cardClass = isDark ? 'border-tamkeenDark-primary/30 bg-tamkeenDark-surface/50' : 'border-tamkeen-accent/20 bg-tamkeen-surface/50';
  const titleClass = isDark ? 'text-tamkeenDark-primary' : 'text-tamkeen-primary';

  return (
    <div className={`relative min-h-screen ${bgClass} transition-colors duration-500`}>
      <IslamicPattern theme={currentTheme} />

      <Link
        href={`${basePath}/`}
        className={`fixed top-6 left-6 z-50 px-6 py-3 rounded-xl ${buttonClass} font-semibold hover:scale-105 transition-all`}
      >
        ← Back
      </Link>

      <main className="relative z-10 max-w-4xl mx-auto p-6 pt-24 pb-16">
        <div className={textClass}>
          <h1 className={`text-3xl md:text-4xl font-bold mb-4 ${titleClass}`}>
            How Nuqat Uses FSRS to Manage Quran Memorization
          </h1>
          <p className={`text-lg ${mutedClass} mb-8`}>
            A technical overview of the spaced repetition system powering this app.
          </p>

          <article className={`rounded-2xl p-6 md:p-8 border-2 ${cardClass}`}>
            <h2 className={`text-xl font-bold mb-6 ${titleClass}`}>
              Technical implementation (written by agent, reviewed by me)
            </h2>

            <h3 className={`font-bold mb-2 mt-6 first:mt-0 ${titleClass}`}>Modeling the Quran by Page</h3>
            <p className={`${mutedClass} leading-relaxed`}>
                Nuqat models the Quran as <strong className={textClass}>one flashcard per page</strong>. The Mushaf has 604 pages;
                each page becomes a card with its own stability, difficulty, and due date. For multi-page surahs (e.g. Al-Baqarah),
                each page is a separate card. For single-page surahs (e.g. Al-Ikhlas), the card represents the whole page with all the surahs on it.
                This page-based granularity aims to model how people typically memorize from a physical copy.
              </p>

            <h3 className={`font-bold mb-2 mt-6 ${titleClass}`}>FSRS Parameters and how they're managed</h3>
              <p className={`${mutedClass} leading-relaxed mb-4`}>
                FSRS (Free Spaced Repetition Scheduler) is the algorithm behind review scheduling. Nuqat exposes these parameters in Settings:
              </p>
              <ul className={`space-y-2 ${mutedClass} list-disc list-inside`}>
                <li><strong className={textClass}>Desired retention</strong> (70%–98%): Target probability you remember a card at review time. Higher = short intervals, fewer lapses; lower = longer intervals, more lapses.</li>
                <li><strong className={textClass}>Daily review limit</strong>: Maximum pages you aim to review per day. Stored as a preference; the app shows all due cards and lets you choose what to review.</li>
                <li><strong className={textClass}>Fuzz</strong>: When enabled, adds ±5% random variation to due dates to spread reviews and avoid many cards clustering on the same day.</li>
              </ul>

            <h3 className={`font-bold mb-2 mt-6 ${titleClass}`}>Hesitations, Mistakes, and Lapses</h3>
              <p className={`${mutedClass} leading-relaxed mb-4`}>
                Instead of raw FSRS grades (1–4), Nuqat uses recitation-quality stats. During review you log:
              </p>
              <ul className={`space-y-1 ${mutedClass} mb-4`}>
                <li><strong className={textClass}>Hesitations</strong> – Minor stutters, slips (1 penalty each)</li>
                <li><strong className={textClass}>Mistakes</strong> – Meaning-altering errors (4 penalty each)</li>
                <li><strong className={textClass}>Forgets</strong> – Total blackout, prompt required (5 penalty each)</li>
              </ul>
              <p className={`${mutedClass} leading-relaxed mb-2`}>
                These are combined into a penalty score: <code className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10">forgets×5 + mistakes×4 + hesitations×1</code>. The score maps to an FSRS grade:
              </p>
              <ul className={`space-y-1 ${mutedClass}`}>
                <li>≥10 → Again (Forgot)</li>
                <li>≥6 → Hard</li>
                <li>≥3 → Good</li>
                <li>&lt;3 → Easy</li>
              </ul>

            <h3 className={`font-bold mb-2 mt-6 ${titleClass}`}>When to Review Next</h3>
              <p className={`${mutedClass} leading-relaxed`}>
                After each review, FSRS updates the card&apos;s <strong className={textClass}>stability</strong> (how well it&apos;s memorized) and <strong className={textClass}>due date</strong>.
                Better grades (Easy, Good) extend the interval; Again or Hard shorten it or trigger relearning. Each card gets a <code className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10">due</code> date
                — the next suggested review. The app fetches cards with <code className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10">due ≤ today</code> and shows them in the &quot;Due Today&quot; section.
              </p>

            <h3 className={`font-bold mb-2 mt-6 ${titleClass}`}>Prioritizing When Many Are Due</h3>
              <p className={`${mutedClass} leading-relaxed mb-4`}>
                If 30 pages are due and your limit is 15, how do we decide which to show first?
              </p>
              <p className={`${mutedClass} leading-relaxed mb-4`}>
                <strong className={textClass}>Currently:</strong> The app shows <em>all</em> due cards in <strong className={textClass}>page order</strong> (ascending by page number).
                The daily limit is a personal target, not a hard cap. You see the full list and choose what to review.
              </p>
              <p className={`${mutedClass} leading-relaxed`}>
                <strong className={textClass}>Possible prioritization</strong> (for a future version): When due count exceeds the limit, we could surface a &quot;top N&quot; subset by: (1) <em>most overdue first</em> — cards past due get priority;
                (2) <em>lowest stability first</em> — fragile memories before well-established ones; or (3) a mix of both. For now, page order keeps reviews in Quran sequence.
              </p>
          </article>
        </div>
      </main>
    </div>
  );
}
