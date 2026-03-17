/**
 * Questionnaire calculation utilities
 * 
 * Converts user questionnaire responses into FSRS parameters
 */

import { State } from 'ts-fsrs';
import type { CardInitOptions } from './initializeCards';

export type ConfidenceLevel = 'perfect' | 'good' | 'okay' | 'weak' | 'veryWeak';
export type TimeKnown = '1-month' | '3-months' | '6-months' | '1-year' | '3-years' | '5-years' | '10-years';
export type ReviewFrequency = 'daily' | '3-4-times' | 'weekly' | 'biweekly' | 'monthly' | 'bi-monthly' | 'rarely';

// Confidence multipliers (0.0 - 1.0) - applied to time-based stability
const CONFIDENCE_MULTIPLIERS: Record<ConfidenceLevel, number> = {
  perfect: 1.2,   // 120% of time-based stability
  good: 0.8,     // 80% of time-based stability
  okay: 0.6,      // 60% of time-based stability
  weak: 0.4,      // 40% of time-based stability
  veryWeak: 0.2, // 20% of time-based stability
};

// Time-based stability base values (before confidence multiplier)
//I might come back and edit these numbers
const TIME_STABILITY_BASE: Record<TimeKnown, number> = {
  '1-month': 20,
  '3-months': 40,
  '6-months': 60,
  '1-year': 80,
  '3-years': 120,
  '5-years': 160,
  '10-years': 200,
};

// Time periods in weeks
const TIME_IN_WEEKS: Record<TimeKnown, number> = {
  '1-month': 4,
  '3-months': 12,
  '6-months': 24,
  '1-year': 52,
  '3-years': 156,
  '5-years': 260,
  '10-years': 520,
};

// Review frequencies per week
const FREQUENCY_PER_WEEK: Record<ReviewFrequency, number> = {
  'daily': 7,
  '3-4-times': 3.5,
  'weekly': 1,
  'biweekly': 0.5,
  'monthly': 0.25,
  'bi-monthly': 0.125,
  'rarely': 0.1,
};

// Confidence to FSRS State mapping
const CONFIDENCE_TO_STATE: Record<ConfidenceLevel, State> = {
  perfect: State.Review,
  good: State.Review,
  okay: State.Review,
  weak: State.Relearning,
  veryWeak: State.Relearning,
};

// Confidence to days until due
// I messed with these, originally it was (30,14,7,1,0)
const CONFIDENCE_TO_DAYS_DUE: Record<ConfidenceLevel, number> = {
  perfect: 60,   // 2 months
  good: 21,      // 3 weeks
  okay: 7,       // 1 week
  weak: 3,       // 3 days
  veryWeak: 1,   // 1 day
};

/**
 * Calculate stability based on confidence and time known
 * Formula: Stability = TIME_BASE[timeKnown] × CONFIDENCE_MULTIPLIER[confidence]
 * 
 * @example
 * calculateStability('good', '10-years') // 200 × 0.75 = 150
 * calculateStability('good', '1-month')  // 20 × 0.75 = 15
 */
export function calculateStability(
  confidence: ConfidenceLevel,
  timeKnown: TimeKnown
): number {
  const baseStability = TIME_STABILITY_BASE[timeKnown];
  const multiplier = CONFIDENCE_MULTIPLIERS[confidence];
  return Math.floor(baseStability * multiplier);
}

/**
 * Calculate initial reps (review count) based on time known and review frequency
 * Formula: Reps = weeks × reviews_per_week
 * 
 * @example
 * calculateInitialReps('3-years', 'weekly') // 156 weeks × 1/week = 156 reps
 * calculateInitialReps('1-year', 'daily')   // 52 weeks × 7/week = 364 reps
 */
export function calculateInitialReps(
  timeKnown: TimeKnown,
  reviewFrequency: ReviewFrequency
): number {
  const weeks = TIME_IN_WEEKS[timeKnown];
  const reviewsPerWeek = FREQUENCY_PER_WEEK[reviewFrequency];
  return Math.floor(weeks * reviewsPerWeek);
}

/**
 * Calculate all card initialization parameters from questionnaire responses
 * 
 * @param confidence - User's confidence level
 * @param timeKnown - How long ago they memorized this
 * @param reviewFrequency - How often they review
 * @returns Complete CardInitOptions object ready for card initialization
 * 
 * @example
 * calculateCardParameters('good', '3-years', 'weekly')
 * // Returns: {
 * //   initialState: State.Review,
 * //   initialStability: 90,
 * //   initialReps: 156,
 * //   initialDifficulty: 0,
 * //   dueDate: Date (14 days from now)
 * // }
 */
export function calculateCardParameters(
  confidence: ConfidenceLevel,
  timeKnown: TimeKnown,
  reviewFrequency: ReviewFrequency
): CardInitOptions {
  const initialStability = calculateStability(confidence, timeKnown);
  const initialReps = calculateInitialReps(timeKnown, reviewFrequency);
  const initialState = CONFIDENCE_TO_STATE[confidence];
  const daysUntilDue = CONFIDENCE_TO_DAYS_DUE[confidence];
  
  const dueDate = new Date(Date.now() + daysUntilDue * 24 * 60 * 60 * 1000);
  
  return {
    initialState,
    initialStability,
    initialDifficulty: 0, // Default, can be overridden per-page
    initialReps,
    dueDate,
  };
}

/**
 * Get user-friendly labels for dropdowns
 */
export const CONFIDENCE_LABELS: Record<ConfidenceLevel, string> = {
  perfect: 'Perfect - Could recite flawlessly right now',
  good: 'Good - Might hesitate on a few words',
  okay: 'Okay - Would make 1-2 mistakes',
  weak: 'Weak - Remember flow but would make 3-4 mistakes or completely lapse on some verses',
  veryWeak: 'Very Weak - Need to relearn most of it',
};

export const TIME_LABELS: Record<TimeKnown, string> = {
  '1-month': 'Within last month',
  '3-months': '2-6 months ago',
  '6-months': '6-12 months ago',
  '1-year': '1-2 years ago',
  '3-years': '3-5 years ago',
  '5-years': '5-10 years ago',
  '10-years': '10+ years ago',
};

export const FREQUENCY_LABELS: Record<ReviewFrequency, string> = {
  'daily': 'Daily (7×/week)',
  '3-4-times': '3-4 times per week',
  'weekly': 'Weekly (1×/week)',
  'biweekly': 'Every 2 weeks',
  'monthly': 'Monthly',
  'bi-monthly': 'Every 2 months',
  'rarely': 'Rarely / Not in months',
};

/**
 * Get a formatted preview of card parameters
 */
export function getParametersPreview(
  confidence: ConfidenceLevel,
  timeKnown: TimeKnown,
  reviewFrequency: ReviewFrequency
) {
  const params = calculateCardParameters(confidence, timeKnown, reviewFrequency);
  const stability = params.initialStability || 0;
  const reps = params.initialReps || 0;
  const daysUntilDue = CONFIDENCE_TO_DAYS_DUE[confidence];
  
  return {
    stability,
    reps,
    daysUntilDue,
    state: params.initialState,
    dueDate: params.dueDate,
  };
}
