'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useThemeStore } from '@/lib/stores/theme-store';
import { IslamicPattern } from '@/components/ui/IslamicPattern';
import { db } from '@/lib/db/schema';
import { v4 as uuidv4 } from 'uuid';
import Link from 'next/link';

type QuestionnaireStep = 'config' | 'cards';

export default function QuestionnairePage() {
  const router = useRouter();
  const { currentTheme } = useThemeStore();
  const isDark = currentTheme === 'tamkeen-dark';
  const [currentStep, setCurrentStep] = useState<QuestionnaireStep>('config');

  // Tamkeen theme styles
  const styles = isDark ? {
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
  } : {
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

  // Step 1: General Config
  const [desiredRetention, setDesiredRetention] = useState(0.85);
  const [dailyNewLimit, setDailyNewLimit] = useState(0); // Set to unlimited (0) by default
  const [dailyReviewLimit, setDailyReviewLimit] = useState('40');
  const [enableFuzz, setEnableFuzz] = useState(true);

  // Validation for daily review limit
  const isDailyReviewLimitValid = () => {
    const num = parseInt(dailyReviewLimit);
    return !isNaN(num) && num >= 1 && num <= 604;
  };

  const handleSaveConfig = async () => {
    if (!isDailyReviewLimitValid()) {
      return; // Don't proceed if invalid
    }
    
    try {
      const now = new Date();
      
      // Save config to database
      await db.config.add({
        id: uuidv4(),
        userId: null, // For future multi-user support
        desiredRetention,
        dailyNewLimit: 0, // Always unlimited
        dailyReviewLimit: parseInt(dailyReviewLimit),
        enableFuzz,
        createdAt: now,
        updatedAt: now,
      });
      
      console.log('Config saved successfully');
      setCurrentStep('cards');
    } catch (error) {
      console.error('Error saving config:', error);
    }
  };

  const handleSkip = () => {
    router.push('/review');
  };

  const buttonClass = isDark 
    ? 'bg-tamkeenDark-surface/90 backdrop-blur-sm border-2 border-tamkeenDark-primary/30 text-tamkeenDark-primary hover:border-tamkeenDark-accent hover:shadow-xl hover:shadow-tamkeenDark-accent/30' 
    : 'bg-tamkeen-surface/90 backdrop-blur-sm border-2 border-tamkeen-accent/20 text-tamkeen-primary hover:border-tamkeen-primary hover:shadow-xl hover:shadow-tamkeen-primary/20';

  return (
    <div className={`relative min-h-screen ${styles.background} transition-colors duration-500`}>
      <IslamicPattern theme={currentTheme} />
      
      {/* Floating Back Button */}
      <Link
        href="/"
        className={`fixed top-6 left-6 z-50 px-6 py-3 rounded-xl ${buttonClass} font-semibold hover:scale-105 transition-all`}
      >
        ← Back
      </Link>

      <main className="relative z-10 max-w-4xl mx-auto p-6 pt-24">
        {/* Header */}
        <div className="text-center mb-12">
          <div className={`mx-auto w-32 h-1 ${styles.decorative} rounded-full mb-6`} />
          <h1 className={`text-4xl md:text-5xl font-bold ${styles.title} mb-4`}>
            Let's tune the system to your needs
          </h1>
          <p className={`text-lg ${styles.subtitle} max-w-2xl mx-auto`}>
            Your answers to the questions in this section are adjusting the system to your goals, you can change them later.
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-center gap-2 mb-8">
          <div className={`h-2 w-16 rounded-full ${currentStep === 'config' ? styles.decorative : styles.input}`} />
          <div className={`h-2 w-16 rounded-full ${currentStep === 'cards' ? styles.decorative : styles.input}`} />
        </div>

        {/* Step Content */}
        <div className={`${styles.card} rounded-2xl shadow-xl p-8 md:p-12`}>
          {currentStep === 'config' && (
            <div className="space-y-8">
              <div>
                <h2 className={`text-2xl font-bold ${styles.title} mb-6`}>
                  General Configuration
                </h2>
                <p className={`${styles.subtitle} mb-8`}>
                  These questions relate to the volume and frequency of your reviews.
                </p>
              </div>

              {/* Desired Retention */}
              <div>
                <label className={`block text-sm font-semibold mb-3 ${styles.label}`}>
                  Desired Retention Rate: {(desiredRetention * 100).toFixed(0)}%
                </label>
                
                {/* Custom Slider */}
                <div className="relative w-full h-8 mb-2">
                  {/* Track with gradient */}
                  <div 
                    className="absolute inset-0 rounded-full overflow-hidden"
                    style={{
                      background: `linear-gradient(to right, 
                        ${isDark ? '#10b981' : '#22c55e'} 0%, 
                        ${isDark ? '#f59e0b' : '#fbbf24'} 50%, 
                        ${isDark ? '#ef4444' : '#f87171'} 100%)`
                    }}
                  />
                  
                  {/* Thumb */}
                  <input
                    type="range"
                    min="0.7"
                    max="0.98"
                    step="0.01"
                    value={desiredRetention}
                    onChange={(e) => setDesiredRetention(parseFloat(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  
                  {/* Visual thumb indicator */}
                  <div 
                    className={`absolute top-1/2 -translate-y-1/2 w-5 h-10 rounded-lg shadow-lg pointer-events-none transition-all ${
                      isDark ? 'bg-tamkeenDark-surface border-2 border-tamkeenDark-text' : 'bg-white border-2 border-gray-700'
                    }`}
                    style={{
                      left: `calc(${(desiredRetention - 0.7) / (0.98 - 0.7) * 100}% - 10px)`
                    }}
                  >
                    {/* Drag indicator lines */}
                    <div className="absolute inset-0 flex items-center justify-center gap-0.5">
                      <div className={`w-0.5 h-5 rounded-full ${isDark ? 'bg-tamkeenDark-text/30' : 'bg-gray-400'}`} />
                      <div className={`w-0.5 h-5 rounded-full ${isDark ? 'bg-tamkeenDark-text/30' : 'bg-gray-400'}`} />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between text-xs mb-2">
                  <span className={`${styles.subtitle}`}>70% - Easier</span>
                  <span className={`${styles.subtitle}`}>98% - Harder</span>
                </div>
                
                <p className={`text-xs ${styles.subtitle} mt-2`}>
                  Higher = More reviews, better retention. Lower = Fewer reviews, may forget more.
                </p>
              </div>

              {/* Daily New Cards Limit - commented out for now */}
              {/* <div>
                <label className={`block text-sm font-semibold mb-3 ${styles.label}`}>
                  Daily New Cards Limit
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={dailyNewLimit}
                  onChange={(e) => setDailyNewLimit(parseInt(e.target.value) || 0)}
                  className={`w-full px-4 py-3 rounded-lg ${styles.input} outline-none transition-all`}
                />
                <p className={`text-xs ${styles.subtitle} mt-2`}>
                  Maximum number of new cards to learn each day. Set to 0 for unlimited.
                </p>
              </div> */}

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
                <p className={`text-xs mt-2 ${isDailyReviewLimitValid() ? styles.subtitle : 'text-red-500'}`}>
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
                    Adds ±5% random variation to due dates. This helps spread out the review workload and prevents multiple cards from being due on the same day. One drawback might be sporadic reviews.
                  </p>
                </div>
                
                {/* Toggle Switch */}
                <button
                  type="button"
                  onClick={() => setEnableFuzz(!enableFuzz)}
                  className={`relative inline-flex h-8 w-14 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    enableFuzz
                      ? isDark ? 'bg-tamkeenDark-primary focus:ring-tamkeenDark-accent' : 'bg-tamkeen-primary focus:ring-tamkeen-accent'
                      : isDark ? 'bg-tamkeenDark-background/50 focus:ring-tamkeenDark-primary' : 'bg-gray-300 focus:ring-tamkeen-primary'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full transition-transform ${
                      enableFuzz
                        ? 'translate-x-7 bg-white'
                        : 'translate-x-1 bg-white'
                    }`}
                  />
                </button>
              </div>

              {/* Buttons */}
              <div className="flex gap-4 pt-6">
                <button
                  onClick={handleSkip}
                  className={`flex-1 px-6 py-3 rounded-lg ${styles.buttonSecondary} font-semibold transition-all hover:scale-105`}
                >
                  Skip for Now
                </button>
                <button
                  onClick={handleSaveConfig}
                  disabled={!isDailyReviewLimitValid()}
                  className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
                    isDailyReviewLimitValid()
                      ? `${styles.button} hover:scale-105`
                      : 'bg-gray-400 text-gray-200 cursor-not-allowed opacity-50'
                  }`}
                >
                  Next Step →
                </button>
              </div>
            </div>
          )}

          {currentStep === 'cards' && (
            <div className="space-y-8">
              <div>
                <h2 className={`text-2xl font-bold ${styles.title} mb-6`}>
                  Step 2: What Do You Already Know?
                </h2>
                <p className={`${styles.subtitle} mb-8`}>
                  Tell us what you've already memorized so we can set up your cards accordingly
                </p>
              </div>

              {/* TODO: Card initialization form will go here */}
              <div className={`text-center py-12 ${styles.subtitle}`}>
                <p className="text-lg mb-4">Card initialization form coming next...</p>
                <p className="text-sm">You'll be able to specify which pages/surahs you know</p>
              </div>

              {/* Buttons */}
              <div className="flex gap-4 pt-6">
                <button
                  onClick={() => setCurrentStep('config')}
                  className={`flex-1 px-6 py-3 rounded-lg ${styles.buttonSecondary} font-semibold transition-all hover:scale-105`}
                >
                  ← Back
                </button>
                <button
                  onClick={() => router.push('/review')}
                  className={`flex-1 px-6 py-3 rounded-lg ${styles.button} font-semibold transition-all hover:scale-105`}
                >
                  Finish Setup
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
