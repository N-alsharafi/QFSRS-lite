'use client';

import { useState, useEffect } from 'react';
import type { 
  ConfidenceLevel, 
  TimeKnown, 
  ReviewFrequency 
} from '@/lib/quran/questionnaireCalculations';
import { 
  CONFIDENCE_LABELS, 
  TIME_LABELS, 
  FREQUENCY_LABELS,
  getParametersPreview 
} from '@/lib/quran/questionnaireCalculations';

export interface GeneralConfig {
  confidence: ConfidenceLevel | null;
  timeKnown: TimeKnown | null;
  reviewFrequency: ReviewFrequency | null;
  /** User makes many mistakes on this range → lower initial stability */
  makesManyMistakes?: boolean;
  /** Range is particularly difficult → higher initial difficulty */
  isDifficult?: boolean;
}

interface GeneralConfigFormProps {
  config: GeneralConfig;
  onChange: (config: GeneralConfig) => void;
  cardCount: number;
  isDark: boolean;
  styles: any;
}

export function GeneralConfigForm({ config, onChange, cardCount, isDark, styles }: GeneralConfigFormProps) {
  const [preview, setPreview] = useState<any>(null);

  // Update preview when config changes
  useEffect(() => {
    if (config.confidence && config.timeKnown && config.reviewFrequency) {
      const params = getParametersPreview(config.confidence, config.timeKnown, config.reviewFrequency);
      // Apply makesManyMistakes: 50% stability (same as card creation)
      if (config.makesManyMistakes && params.stability) {
        params.stability = Math.floor(params.stability * 0.5);
      }
      setPreview(params);
    } else {
      setPreview(null);
    }
  }, [config]);

  const confidenceLevels: ConfidenceLevel[] = ['perfect', 'good', 'okay', 'weak', 'veryWeak'];
  const confidenceColor = 'from-green-500 via-yellow-300 to-red-600';

  const getConfidenceIndex = () => {
    if (!config.confidence) return 2; // Default to 'okay'
    return confidenceLevels.indexOf(config.confidence);
  };

  const handleConfidenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const index = parseInt(e.target.value);
    onChange({
      ...config,
      confidence: confidenceLevels[index]
    });
  };

  const confidenceIndex = getConfidenceIndex();
  const gradientClass = confidenceColor;

  return (
    <div className="space-y-6">
      {/* Confidence Slider */}
      <div>
        <label className={`block text-sm font-semibold mb-3 ${styles.label}`}>
          How confident are you with this material?
        </label>
        <div className="space-y-3">
          <div className="relative">
            <div className={`h-8 rounded-full bg-gradient-to-r ${gradientClass} opacity-80`} />
            <input
              type="range"
              min="0"
              max="4"
              step="1"
              value={confidenceIndex}
              onChange={handleConfidenceChange}
              className="absolute inset-0 w-full h-8 opacity-0 cursor-pointer"
            />
            <div
              className={`absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full ${
                isDark ? 'bg-tamkeenDark-surface' : 'bg-tamkeen-surface'
              } border-4 ${
                isDark ? 'border-tamkeenDark-primary' : 'border-tamkeen-primary'
              } shadow-lg pointer-events-none transition-all`}
              style={{ left: `calc(${(confidenceIndex / 4) * 100}% - 12px)` }}
            />
          </div>
          <p className={`text-sm text-center ${styles.subtitle}`}>
            {config.confidence ? CONFIDENCE_LABELS[config.confidence] : CONFIDENCE_LABELS.okay}
          </p>
        </div>
      </div>

      {/* Time Known */}
      <div>
        <label className={`block text-sm font-semibold mb-2 ${styles.label}`}>
          When did you memorize this?
        </label>
        <select
          value={config.timeKnown || ''}
          onChange={(e) => onChange({
            ...config,
            timeKnown: e.target.value as TimeKnown || null
          })}
          className={`w-full px-4 py-2.5 rounded-lg ${styles.input} outline-none transition-all`}
        >
          <option value="">Select time...</option>
          {Object.entries(TIME_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* Review Frequency */}
      <div>
        <label className={`block text-sm font-semibold mb-2 ${styles.label}`}>
          How often have you been reviewing it?
        </label>
        <select
          value={config.reviewFrequency || ''}
          onChange={(e) => onChange({
            ...config,
            reviewFrequency: e.target.value as ReviewFrequency || null
          })}
          className={`w-full px-4 py-2.5 rounded-lg ${styles.input} outline-none transition-all`}
        >
          <option value="">Select frequency...</option>
          {Object.entries(FREQUENCY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* Range-level overrides */}
      <div className="space-y-4">
        <label className={`block text-sm font-semibold mb-3 ${styles.label}`}>
          Additional notes for this range
        </label>

        {/* Makes many mistakes toggle */}
        <div className="flex items-center justify-between gap-4">
          <span className={`text-sm flex-1 ${styles.label}`}>
            I make many mistakes on this range
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={!!config.makesManyMistakes}
            onClick={() => onChange({ ...config, makesManyMistakes: !config.makesManyMistakes })}
            className={`relative inline-flex h-8 w-14 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              config.makesManyMistakes
                ? isDark ? 'bg-tamkeenDark-primary focus:ring-tamkeenDark-accent' : 'bg-tamkeen-primary focus:ring-tamkeen-accent'
                : isDark ? 'bg-tamkeenDark-background/50 focus:ring-tamkeenDark-primary' : 'bg-gray-300 focus:ring-tamkeen-primary'
            }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                config.makesManyMistakes ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Is difficult toggle */}
        <div className="flex items-center justify-between gap-4">
          <span className={`text-sm flex-1 ${styles.label}`}>
            This range is particularly difficult
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={!!config.isDifficult}
            onClick={() => onChange({ ...config, isDifficult: !config.isDifficult })}
            className={`relative inline-flex h-8 w-14 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              config.isDifficult
                ? isDark ? 'bg-tamkeenDark-primary focus:ring-tamkeenDark-accent' : 'bg-tamkeen-primary focus:ring-tamkeen-accent'
                : isDark ? 'bg-tamkeenDark-background/50 focus:ring-tamkeenDark-primary' : 'bg-gray-300 focus:ring-tamkeen-primary'
            }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                config.isDifficult ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Preview Box */}
      {preview && cardCount > 0 && (
        <div className={`p-6 rounded-lg ${
          isDark 
            ? 'bg-tamkeenDark-surface/50 border-2 border-tamkeenDark-primary/30' 
            : 'bg-tamkeen-surface/50 border-2 border-tamkeen-accent/20'
        }`}>
          <h3 className={`text-lg font-bold mb-4 ${styles.title}`}>Preview</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className={styles.subtitle}>Will create:</span>
              <span className={`font-bold ${styles.title}`}>{cardCount} cards</span>
            </div>
            <div className="flex justify-between">
              <span className={styles.subtitle}>Past reviews:</span>
              <span className={`font-bold ${styles.title}`}>{preview.reps} reviews</span>
            </div>
            <div className="flex justify-between">
              <span className={styles.subtitle}>Stability:</span>
              <span className={`font-bold ${styles.title}`}>{preview.stability} days</span>
            </div>
            <div className="flex justify-between">
              <span className={styles.subtitle}>Next due:</span>
              <span className={`font-bold ${styles.title}`}>
                {preview.daysUntilDue === 0 ? 'Today' : `In ${preview.daysUntilDue} day${preview.daysUntilDue > 1 ? 's' : ''}`}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
