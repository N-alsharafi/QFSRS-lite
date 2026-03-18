'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { useThemeStore } from '@/lib/stores/theme-store';
import { IslamicPattern } from '@/components/ui/IslamicPattern';
import { db } from '@/lib/db/schema';
import Link from 'next/link';
import { AddToCartForm } from '@/components/questionnaire/AddToCartForm';
import { SelectionCart } from '@/components/questionnaire/SelectionCart';
import { initializeCardsForPageRange } from '@/lib/quran/initializeCards';
import { resolveCart, groupResolvedPages, type CartEntry } from '@/lib/quran/cartResolution';
import { groupCardsByPageRanges, type PageRangeGroup } from '@/lib/quran/cardGrouping';
import { getPageSurahs } from '@/lib/quran/metadata';
import { State } from 'ts-fsrs';
import type { Card } from '@/types/database';
import type { Page } from 'quran-meta/hafs';
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
type SettingsTab = 'config' | 'cards';

function formatStateSummary(cards: Card[]): string {
  const counts = {
    new: cards.filter((c) => c.state === State.New).length,
    learning: cards.filter((c) => c.state === State.Learning || c.state === State.Relearning).length,
    review: cards.filter((c) => c.state === State.Review).length,
  };
  const parts: string[] = [];
  if (counts.new) parts.push(`${counts.new} New`);
  if (counts.learning) parts.push(`${counts.learning} Learning`);
  if (counts.review) parts.push(`${counts.review} Review`);
  return parts.length ? parts.join(', ') : '—';
}

interface ManageContentTabProps {
  isDark: boolean;
  styles: {
    title: string;
    subtitle: string;
    card: string;
    button: string;
    input: string;
    label: string;
    decorative: string;
  };
  cartEntries: CartEntry[];
  setCartEntries: React.Dispatch<React.SetStateAction<CartEntry[]>>;
}

function ManageContentTab({ isDark, styles, cartEntries, setCartEntries }: ManageContentTabProps) {
  const allCards = useLiveQuery(() => db.cards.toArray(), []) ?? [];
  const groups = groupCardsByPageRanges(allCards);

  const [removeModalGroup, setRemoveModalGroup] = useState<PageRangeGroup | null>(null);
  const [removeFromPage, setRemoveFromPage] = useState(1);
  const [removeToPage, setRemoveToPage] = useState(1);

  // Keep page range in sync when modal opens
  useEffect(() => {
    if (removeModalGroup) {
      setRemoveFromPage(removeModalGroup.startPage);
      setRemoveToPage(removeModalGroup.endPage);
    }
  }, [removeModalGroup]);

  const handleRemoveClick = (group: PageRangeGroup) => {
    setRemoveModalGroup(group);
  };

  const handleRemoveConfirm = async () => {
    if (!removeModalGroup) return;
    const from = Math.max(removeModalGroup.startPage, Math.min(removeModalGroup.endPage, removeFromPage));
    const to = Math.max(from, Math.min(removeModalGroup.endPage, removeToPage));
    const idsToDelete = removeModalGroup.cards
      .filter((c) => c.pageNumber >= from && c.pageNumber <= to)
      .map((c) => c.id);
    if (idsToDelete.length === 0) {
      setRemoveModalGroup(null);
      return;
    }
    try {
      await db.cards.bulkDelete(idsToDelete);
      setRemoveModalGroup(null);
    } catch (e) {
      console.error('Failed to remove cards:', e);
      alert('Failed to remove cards.');
    }
  };

  const handleRemoveCancel = () => {
    setRemoveModalGroup(null);
  };

  return (
    <div className="space-y-8">
      {/* Existing content */}
      <div>
        <h2 className={`text-2xl font-bold ${styles.title} mb-2`}>Your Memorized Content</h2>
        <p className={`${styles.subtitle} mb-4`}>
          View and manage your flashcards. Each group shows status and due info.
        </p>

        {groups.length === 0 ? (
          <div className={`${styles.card} p-6 rounded-xl`}>
            <p className={styles.subtitle}>No flashcards yet. Add content below.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {groups.map((group) => {
              const key = `${group.startPage}-${group.endPage}`;
              const surahHint =
                group.cards.length === 1
                  ? getPageSurahs(group.cards[0].pageNumber as Page)
                        .map((ps) => ps.transliteration)
                        .join(', ')
                  : group.label;
              return (
                <div
                  key={key}
                  className={`${styles.card} flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl`}
                >
                  <div>
                    <p className={`font-semibold ${styles.title}`}>
                      {group.cards.length === 1
                        ? `Page ${group.startPage}`
                        : `Pages ${group.startPage}–${group.endPage}`}
                    </p>
                    <p className={`text-sm ${styles.subtitle}`}>{surahHint}</p>
                    <p className={`text-xs mt-1 ${styles.subtitle}`}>
                      {formatStateSummary(group.cards)} • {group.cards.length} card(s)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveClick(group)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      isDark
                        ? 'bg-red-900/40 text-red-300 hover:bg-red-800/50'
                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                    }`}
                  >
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add more content */}
      <div>
        <h3 className={`text-xl font-bold ${styles.title} mb-2`}>Add More Content</h3>
        <p className={`${styles.subtitle} mb-4`}>
          Add pages, surahs, or juz by range. Each addition can have its own confidence level.
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start">
          <AddToCartForm
            onAddEntry={(entry) => setCartEntries((prev) => [...prev, entry])}
            isDark={isDark}
            styles={styles}
          />
          <SelectionCart
            entries={cartEntries}
            onRemoveEntry={(id) => setCartEntries((prev) => prev.filter((e) => e.id !== id))}
            isDark={isDark}
            styles={styles}
          />
        </div>
      </div>

      {/* Remove confirmation modal */}
      {removeModalGroup && (
        <RemoveConfirmModal
          group={removeModalGroup}
          fromPage={removeFromPage}
          toPage={removeToPage}
          setFromPage={setRemoveFromPage}
          setToPage={setRemoveToPage}
          onConfirm={handleRemoveConfirm}
          onCancel={handleRemoveCancel}
          isDark={isDark}
          styles={styles}
        />
      )}
    </div>
  );
}

interface RemoveConfirmModalProps {
  group: PageRangeGroup;
  fromPage: number;
  toPage: number;
  setFromPage: (n: number) => void;
  setToPage: (n: number) => void;
  onConfirm: () => void;
  onCancel: () => void;
  isDark: boolean;
  styles: { title: string; subtitle: string; input: string; label: string; button: string };
}

function RemoveConfirmModal({
  group,
  fromPage,
  toPage,
  setFromPage,
  setToPage,
  onConfirm,
  onCancel,
  isDark,
  styles,
}: RemoveConfirmModalProps) {
  const { startPage, endPage } = group;
  const countToRemove = group.cards.filter(
    (c) => c.pageNumber >= Math.min(fromPage, toPage) && c.pageNumber <= Math.max(fromPage, toPage)
  ).length;

  const modalClass = isDark
    ? 'bg-tamkeenDark-surface border-tamkeenDark-primary/30 text-tamkeenDark-text'
    : 'bg-tamkeen-surface border-tamkeen-accent/20 text-tamkeen-text';
  const cancelClass = isDark
    ? 'bg-tamkeenDark-surface/50 text-tamkeenDark-text hover:bg-tamkeenDark-primary/20'
    : 'bg-tamkeen-surface/50 text-tamkeen-text hover:bg-tamkeen-primary/20';

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="remove-modal-title"
    >
      <div
        className={`${modalClass} max-w-md w-full rounded-2xl border-2 p-6 shadow-xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="remove-modal-title" className={`text-lg font-bold ${styles.title} mb-2`}>
          Remove flashcards
        </h2>
        <p className={`text-sm ${styles.subtitle} mb-4`}>
          Choose the page range to remove. All flashcards in this range will be deleted (including progress).
        </p>
        <div className="flex gap-4 mb-4">
          <div>
            <label className={`block text-xs ${styles.subtitle} mb-1`} htmlFor="remove-from">
              From page
            </label>
            <input
              id="remove-from"
              type="number"
              min={startPage}
              max={endPage}
              value={fromPage}
              onChange={(e) => setFromPage(parseInt(e.target.value, 10) || startPage)}
              className={`w-full px-3 py-2 rounded-lg ${styles.input}`}
            />
          </div>
          <div>
            <label className={`block text-xs ${styles.subtitle} mb-1`} htmlFor="remove-to">
              To page
            </label>
            <input
              id="remove-to"
              type="number"
              min={startPage}
              max={endPage}
              value={toPage}
              onChange={(e) => setToPage(parseInt(e.target.value, 10) || endPage)}
              className={`w-full px-3 py-2 rounded-lg ${styles.input}`}
            />
          </div>
        </div>
        <p className={`text-xs ${styles.subtitle} mb-4`}>
          Valid range: {startPage}–{endPage}. {countToRemove} card(s) will be removed.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className={`flex-1 py-2.5 rounded-xl font-semibold ${cancelClass}`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl font-semibold ${styles.button}`}
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { currentTheme } = useThemeStore();
  const isDark = currentTheme === 'tamkeen-dark';
  const [activeTab, setActiveTab] = useState<SettingsTab>('config');
  const [isLoading, setIsLoading] = useState(true);
  const [configId, setConfigId] = useState<string | null>(null);

  // General Config (Tab 1)
  const [desiredRetention, setDesiredRetention] = useState(0.85);
  const [dailyReviewLimit, setDailyReviewLimit] = useState('40');
  const [enableFuzz, setEnableFuzz] = useState(true);

  // Cards (Tab 2)
  const [cartEntries, setCartEntries] = useState<CartEntry[]>([]);

  // Apply feedback
  const [isApplying, setIsApplying] = useState(false);
  const [applyFeedback, setApplyFeedback] = useState<'success' | null>(null);

  const styles = isDark
    ? {
        background: 'bg-tamkeenDark-background',
        card: 'bg-tamkeenDark-surface/90 backdrop-blur-sm border-2 border-tamkeenDark-primary/30',
        title: 'text-tamkeenDark-primary',
        subtitle: 'text-tamkeenDark-textMuted',
        text: 'text-tamkeenDark-text',
        button: 'bg-tamkeenDark-primary text-tamkeenDark-background hover:bg-tamkeenDark-accent',
        buttonSecondary: 'bg-tamkeenDark-surface border-2 border-tamkeenDark-primary/30 text-tamkeenDark-text hover:border-tamkeenDark-accent',
        input: 'bg-tamkeenDark-background border-2 border-tamkeenDark-primary/30 text-tamkeenDark-text focus:border-tamkeenDark-accent',
        label: 'text-tamkeenDark-text',
        decorative: 'bg-gradient-to-br from-tamkeenDark-primary to-tamkeenDark-accent',
      }
    : {
        background: 'bg-tamkeen-background',
        card: 'bg-tamkeen-surface/90 backdrop-blur-sm border-2 border-tamkeen-accent/20',
        title: 'text-tamkeen-primary',
        subtitle: 'text-tamkeen-textMuted',
        text: 'text-tamkeen-text',
        button: 'bg-tamkeen-primary text-tamkeen-surface hover:bg-tamkeen-accent',
        buttonSecondary: 'bg-tamkeen-surface border-2 border-tamkeen-accent/20 text-tamkeen-text hover:border-tamkeen-primary',
        input: 'bg-tamkeen-surface border-2 border-tamkeen-accent/20 text-tamkeen-text focus:border-tamkeen-primary',
        label: 'text-tamkeen-text',
        decorative: 'bg-gradient-to-br from-tamkeen-primary to-tamkeen-accent',
      };

  const isDailyReviewLimitValid = () => {
    const num = parseInt(dailyReviewLimit);
    return !isNaN(num) && num >= 1 && num <= 604;
  };

  const isStep2Valid = () => {
    if (cartEntries.length === 0) return true; // OK to apply with no new cards
    const resolved = resolveCart(cartEntries);
    return resolved.size > 0;
  };

  useEffect(() => {
    async function loadConfig() {
      const configs = await db.config.toArray();
      if (configs.length === 0) {
        alert('Please complete the Questionnaire first to edit settings.');
        router.push('/questionnaire');
        return;
      }
      const config = configs[0];
      setConfigId(config.id);
      setDesiredRetention(config.desiredRetention);
      setDailyReviewLimit(String(config.dailyReviewLimit));
      setEnableFuzz(config.enableFuzz);
      setIsLoading(false);
    }
    loadConfig();
  }, [router]);

  const handleApply = async () => {
    if (!isDailyReviewLimitValid()) return;
    if (!configId) return;

    setIsApplying(true);
    setApplyFeedback(null);

    try {
      const now = new Date();

      // Update config
      await db.config.update(configId, {
        desiredRetention,
        dailyReviewLimit: parseInt(dailyReviewLimit),
        enableFuzz,
        updatedAt: now,
      });

      // Add new cards from cart if any
      if (cartEntries.length > 0 && isStep2Valid()) {
        const resolved = resolveCart(cartEntries);
        const groups = groupResolvedPages(resolved);
        for (const group of groups) {
          const { pages, cardOptions } = group;
          if (pages.length === 0) continue;
          const startPage = Math.min(...pages);
          const endPage = Math.max(...pages);
          await initializeCardsForPageRange(startPage, endPage, cardOptions);
        }
        setCartEntries([]);
      }

      router.refresh();
      setApplyFeedback('success');
      setTimeout(() => setApplyFeedback(null), 2000);
    } catch (error) {
      console.error('Error applying settings:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setIsApplying(false);
    }
  };

  const buttonClass = isDark
    ? 'bg-tamkeenDark-surface/90 backdrop-blur-sm border-2 border-tamkeenDark-primary/30 text-tamkeenDark-primary hover:border-tamkeenDark-accent hover:shadow-xl hover:shadow-tamkeenDark-accent/30'
    : 'bg-tamkeen-surface/90 backdrop-blur-sm border-2 border-tamkeen-accent/20 text-tamkeen-primary hover:border-tamkeen-primary hover:shadow-xl hover:shadow-tamkeen-primary/20';

  if (isLoading) {
    return (
      <div className={`relative min-h-screen ${styles.background} transition-colors duration-500`}>
        <IslamicPattern theme={currentTheme} />
        <div className={`relative z-10 flex min-h-screen items-center justify-center ${styles.text}`}>
          Loading settings…
        </div>
      </div>
    );
  }

  return (
    <div className={`relative min-h-screen ${styles.background} transition-colors duration-500`}>
      <IslamicPattern theme={currentTheme} />

      <Link
        href={`${basePath}/`}
        className={`fixed top-6 left-6 z-50 px-6 py-3 rounded-xl ${buttonClass} font-semibold hover:scale-105 transition-all`}
      >
        ← Back
      </Link>

      <main className={`relative z-10 p-6 pt-24 ${activeTab === 'cards' ? 'max-w-7xl mx-auto' : 'max-w-4xl mx-auto'}`}>
        <div className="text-center mb-8">
          <div className={`mx-auto w-32 h-1 ${styles.decorative} rounded-full mb-6`} />
          <h1 className={`text-4xl md:text-5xl font-bold ${styles.title} mb-4`}>
            Settings
          </h1>
          <p className={`text-lg ${styles.subtitle} max-w-2xl mx-auto`}>
            Edit your questionnaire answers and manage your memorized content.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`flex-1 max-w-[200px] py-3 px-6 rounded-xl font-semibold transition-all ${
              activeTab === 'config' ? styles.decorative : styles.buttonSecondary
            } ${activeTab === 'config' ? 'text-white' : ''}`}
          >
            General
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cards')}
            className={`flex-1 max-w-[200px] py-3 px-6 rounded-xl font-semibold transition-all ${
              activeTab === 'cards' ? styles.decorative : styles.buttonSecondary
            } ${activeTab === 'cards' ? 'text-white' : ''}`}
          >
            Manage Content
          </button>
        </div>

        {/* Tab Content */}
        <div className={`${styles.card} rounded-2xl shadow-xl p-8 md:p-12`}>
          {activeTab === 'config' && (
            <div className="space-y-8">
              <div>
                <h2 className={`text-2xl font-bold ${styles.title} mb-2`}>
                  General Configuration
                </h2>
                <p className={`${styles.subtitle} mb-6`}>
                  Volume and frequency of your reviews.
                </p>
              </div>

              {/* Desired Retention */}
              <div>
                <label className={`block text-sm font-semibold mb-3 ${styles.label}`}>
                  Desired Retention Rate: {(desiredRetention * 100).toFixed(0)}%
                </label>
                <div className="relative w-full h-8 mb-2">
                  <div
                    className="absolute inset-0 rounded-full overflow-hidden"
                    style={{
                      background: `linear-gradient(to right, 
                        ${isDark ? '#10b981' : '#22c55e'} 0%, 
                        ${isDark ? '#f59e0b' : '#fbbf24'} 50%, 
                        ${isDark ? '#ef4444' : '#f87171'} 100%)`,
                    }}
                  />
                  <input
                    type="range"
                    min="0.7"
                    max="0.98"
                    step="0.01"
                    value={desiredRetention}
                    onChange={(e) => setDesiredRetention(parseFloat(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div
                    className={`absolute top-1/2 -translate-y-1/2 w-5 h-10 rounded-lg shadow-lg pointer-events-none transition-all ${
                      isDark ? 'bg-tamkeenDark-surface border-2 border-tamkeenDark-text' : 'bg-white border-2 border-gray-700'
                    }`}
                    style={{
                      left: `calc(${(desiredRetention - 0.7) / (0.98 - 0.7) * 100}% - 10px)`,
                    }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center gap-0.5">
                      <div className={`w-0.5 h-5 rounded-full ${isDark ? 'bg-tamkeenDark-text/30' : 'bg-gray-400'}`} />
                      <div className={`w-0.5 h-5 rounded-full ${isDark ? 'bg-tamkeenDark-text/30' : 'bg-gray-400'}`} />
                    </div>
                  </div>
                </div>
                <div className="flex justify-between text-xs mb-2">
                  <span className={styles.subtitle}>70% - Easier</span>
                  <span className={styles.subtitle}>98% - Harder</span>
                </div>
              </div>

              {/* Daily Review Limit */}
              <div>
                <label className={`block text-sm font-semibold mb-3 ${styles.label}`}>
                  Daily Review Limit
                </label>
                <input
                  type="text"
                  value={dailyReviewLimit}
                  onChange={(e) => setDailyReviewLimit(e.target.value)}
                  placeholder="Enter a number between 1 and 604"
                  className={`w-full px-4 py-3 rounded-lg outline-none transition-all ${
                    isDailyReviewLimitValid()
                      ? styles.input
                      : 'bg-red-500/10 border-2 border-red-500 text-red-500 placeholder:text-red-400'
                  }`}
                />
                <p
                  className={`text-xs mt-2 ${isDailyReviewLimitValid() ? styles.subtitle : 'text-red-500'}`}
                >
                  {isDailyReviewLimitValid()
                    ? 'Maximum number of pages you are willing to review in a day (1-604).'
                    : 'Please enter a valid number between 1 and 604.'}
                </p>
              </div>

              {/* Enable Fuzz */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <label htmlFor="enableFuzz" className={`block text-sm font-semibold mb-2 ${styles.label}`}>
                    Enable Due Date randomization
                  </label>
                  <p className={`text-xs ${styles.subtitle}`}>
                    Adds ±5% random variation to due dates to spread out the review workload.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEnableFuzz(!enableFuzz)}
                  className={`relative inline-flex h-8 w-14 flex-shrink-0 items-center rounded-full transition-colors ${
                    enableFuzz
                      ? isDark ? 'bg-tamkeenDark-primary' : 'bg-tamkeen-primary'
                      : isDark ? 'bg-tamkeenDark-background/50' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full transition-transform ${
                      enableFuzz ? 'translate-x-7 bg-white' : 'translate-x-1 bg-white'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'cards' && (
            <ManageContentTab isDark={isDark} styles={styles} cartEntries={cartEntries} setCartEntries={setCartEntries} />
          )}

          {/* Apply Button */}
          <div className="mt-8 pt-6 border-t border-current/10">
            <button
              onClick={handleApply}
              disabled={
                isApplying ||
                !isDailyReviewLimitValid() ||
                (activeTab === 'cards' && cartEntries.length > 0 && !isStep2Valid())
              }
              className={`w-full py-3 rounded-xl font-semibold transition-all ${
                isDailyReviewLimitValid() && !isApplying
                  ? `${styles.button} hover:scale-[1.02]`
                  : 'bg-gray-400 text-gray-200 cursor-not-allowed opacity-50'
              }`}
            >
              {isApplying ? 'Saving…' : 'Apply Changes'}
            </button>
            {applyFeedback === 'success' && (
              <p
                className={`mt-3 text-center text-sm font-medium ${
                  isDark ? 'text-emerald-400' : 'text-emerald-600'
                }`}
              >
                Changes saved!
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
