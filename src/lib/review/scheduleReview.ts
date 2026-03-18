/**
 * Schedule review - applies FSRS algorithm and persists to DB
 */

import { FSRS, Rating, generatorParameters, type Grade } from 'ts-fsrs';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/db/schema';
import type { Card, ReviewLog, Config } from '@/types/database';

/** Convert penalty points to FSRS grade (1-4) */
export function penaltyToGrade(penalty: number): Grade {
  if (penalty >= 10) return Rating.Again;
  if (penalty >= 6) return Rating.Hard;
  if (penalty >= 3) return Rating.Good;
  return Rating.Easy;
}

/** Calculate penalty from disfluency counts (srs-store rubric) */
export function calculatePenalty(hesitations: number, mistakes: number, forgets: number): number {
  return forgets * 5 + mistakes * 4 + hesitations * 1;
}

/** Convert our Card to ts-fsrs Card format */
function toFSRSCard(card: Card) {
  return {
    due: card.due,
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsed_days,
    scheduled_days: card.scheduled_days,
    learning_steps: 0,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state,
    last_review: card.last_review ?? undefined,
  };
}

/** Convert ts-fsrs result + our metadata to our Card format */
function fromFSRSCard(
  fsrsCard: { due: Date; stability: number; difficulty: number; elapsed_days: number; scheduled_days: number; reps: number; lapses: number; state: number },
  ourCard: Card
): Partial<Card> {
  return {
    due: fsrsCard.due,
    stability: fsrsCard.stability,
    difficulty: fsrsCard.difficulty,
    elapsed_days: fsrsCard.elapsed_days,
    scheduled_days: fsrsCard.scheduled_days,
    reps: fsrsCard.reps,
    lapses: fsrsCard.lapses,
    state: fsrsCard.state,
    last_review: fsrsCard.due,
    updatedAt: new Date(),
  };
}

/** Convert ts-fsrs log to our ReviewLog format */
function toOurReviewLog(
  fsrsLog: { rating: number; state: number; due: Date; stability: number; difficulty: number; elapsed_days: number; last_elapsed_days: number; scheduled_days: number; review: Date },
  cardId: string
): ReviewLog {
  const now = new Date();
  return {
    id: uuidv4(),
    userId: null,
    cardId,
    rating: fsrsLog.rating,
    state: fsrsLog.state,
    due: fsrsLog.due,
    stability: fsrsLog.stability,
    difficulty: fsrsLog.difficulty,
    elapsed_days: fsrsLog.elapsed_days,
    last_elapsed_days: fsrsLog.last_elapsed_days ?? 0,
    scheduled_days: fsrsLog.scheduled_days,
    review: fsrsLog.review,
    reviewedAt: now,
    synced: false,
  };
}

async function getFSRSConfig(): Promise<{ request_retention: number; enable_fuzz: boolean }> {
  const configs = await db.config.toArray();
  const config = configs[0] as Config | undefined;
  return {
    request_retention: config?.desiredRetention ?? 0.9,
    enable_fuzz: config?.enableFuzz ?? false,
  };
}

/**
 * Perform a single card review and persist to DB
 */
export async function scheduleCardReview(card: Card, grade: Grade): Promise<void> {
  const { request_retention, enable_fuzz } = await getFSRSConfig();
  const params = generatorParameters({
    request_retention,
    enable_fuzz,
    enable_short_term: false,
  });
  const fsrs = new FSRS(params);

  const fsrsCard = toFSRSCard(card);
  const now = new Date();
  const result = fsrs.next(fsrsCard, now, grade);

  const updatedCard = fromFSRSCard(result.card, card);
  const reviewLog = toOurReviewLog(result.log, card.id);

  await db.transaction('rw', db.cards, db.reviewLogs, async () => {
    await db.cards.update(card.id, updatedCard);
    await db.reviewLogs.add(reviewLog);
  });
}

/**
 * Perform bulk reviews for multiple cards (e.g. multi-page range)
 * Each card gets its own grade based on per-page mistake allocation
 */
export async function scheduleBulkReview(
  cards: Card[],
  getGradeForCard: (card: Card) => Grade
): Promise<void> {
  const { request_retention, enable_fuzz } = await getFSRSConfig();
  const params = generatorParameters({
    request_retention,
    enable_fuzz,
    enable_short_term: false,
  });
  const fsrs = new FSRS(params);
  const now = new Date();

  const updates: Array<{ cardId: string; cardUpdate: Partial<Card>; log: ReviewLog }> = [];

  for (const card of cards) {
    const grade = getGradeForCard(card);
    const fsrsCard = toFSRSCard(card);
    const result = fsrs.next(fsrsCard, now, grade);
    updates.push({
      cardId: card.id,
      cardUpdate: fromFSRSCard(result.card, card),
      log: toOurReviewLog(result.log, card.id),
    });
  }

  await db.transaction('rw', db.cards, db.reviewLogs, async () => {
    for (const { cardId, cardUpdate, log } of updates) {
      await db.cards.update(cardId, cardUpdate);
      await db.reviewLogs.add(log);
    }
  });
}
