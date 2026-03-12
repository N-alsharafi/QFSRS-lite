import { Rating, State } from 'ts-fsrs';

/**
 * Card interface for FSRS tracking at the Page Level (Phase 1: 604 pages)
 * Each card represents one page of the Quran with its spaced repetition state
 */
export interface Card {
  /** UUID v4 - Unique identifier for the card (future-proof for backend sync) */
  id: string;
  
  /** User ID - null for MVP single-user mode, populated in Phase 3 for multi-user sync
   * This allows future backend sync without schema migration */
  userId: string | null;
  
  /** Page number in the Quran (1-604) */
  pageNumber: number;
  
  /** FSRS card state: New, Learning, Review, or Relearning */
  state: State;
  
  /** Next review date - when this card is scheduled to be reviewed */
  due: Date;
  
  /** Memory stability (S) - How well this page is memorized (higher = more stable) */
  stability: number;
  
  /** Difficulty (D) - Inherent difficulty of this page (0-10, higher = harder) */
  difficulty: number;
  
  /** Number of days since the last review */
  elapsed_days: number;
  
  /** Number of days scheduled for the current interval */
  scheduled_days: number;
  
  /** Total number of reviews (repetitions) for this card */
  reps: number;
  
  /** Number of times the card was forgotten (graded "Again") */
  lapses: number;
  
  /** Optional: Date of the most recent review */
  last_review?: Date;
  
  /** Timestamp when this card was first created */
  createdAt: Date;
  
  /** Timestamp when this card was last modified */
  updatedAt: Date;
}

/**
 * ReviewLog interface for storing review history
 * Used for the Sync Outbox Pattern - logs are queued here for future cloud sync
 */
export interface ReviewLog {
  /** UUID v4 - Unique identifier for this review log entry */
  id: string;
  
  /** User ID - null for MVP single-user mode, populated in Phase 3 for multi-user sync */
  userId: string | null;
  
  /** UUID v4 - Reference to the Card that was reviewed */
  cardId: string;
  
  /** User's rating: 1 (Again), 2 (Hard), 3 (Good), 4 (Easy) */
  rating: Rating;
  
  /** Card state after this review: New, Learning, Review, or Relearning */
  state: State;
  
  /** Next review date calculated after this review */
  due: Date;
  
  /** Memory stability after this review */
  stability: number;
  
  /** Difficulty after this review */
  difficulty: number;
  
  /** Days elapsed since the previous review when this review happened */
  elapsed_days: number;
  
  /** Days elapsed in the previous interval (before this review) */
  last_elapsed_days: number;
  
  /** Number of days scheduled for the next interval */
  scheduled_days: number;
  
  /** Timestamp when the review was conducted (from FSRS algorithm) */
  review: Date;
  
  /** Timestamp when the user actually performed the review */
  reviewedAt: Date;
  
  /** Whether this log has been synced to the backend (false = pending sync) */
  synced: boolean;
}

/**
 * Config interface for user preferences and FSRS parameters
 * Controls the behavior of the spaced repetition algorithm
 */
export interface Config {
  /** UUID v4 - Unique identifier for this config entry */
  id: string;
  
  /** User ID - null for MVP single-user mode, populated in Phase 3 for multi-user sync */
  userId: string | null;
  
  /** Desired retention rate (0.0-1.0) - Default: 0.90 (90% retention probability)
   * Higher values = longer intervals but fewer lapses
   * Lower values = shorter intervals but more frequent reviews */
  desiredRetention: number;
  
  /** Maximum number of new cards (pages) to introduce per day
   * Prevents overwhelming the user with too many new pages at once */
  dailyNewLimit: number;
  
  /** Maximum number of review cards to show per day
   * Helps manage daily study workload */
  dailyReviewLimit: number;
  
  /** Enable FSRS Fuzz - Adds ±5% random variation to due dates
   * Prevents card clustering (multiple cards due on the same day)
   * Spreads out the review workload more evenly */
  enableFuzz: boolean;
  
  /** Timestamp when this config was created */
  createdAt: Date;
  
  /** Timestamp when this config was last modified */
  updatedAt: Date;
}

/** FSRS Rating scale for manual grading:
 * 1 = Again (Forgot) - Total blackout, prompt required (10+ penalty points)
 * 2 = Hard - Major mistakes, meaning altered (5 penalty points)
 * 3 = Good - Minor stutters, 1-2 slips (1 penalty point)
 * 4 = Easy - Perfect, immediate flawless recall (0 penalty points)
 */
export { Rating, State };
