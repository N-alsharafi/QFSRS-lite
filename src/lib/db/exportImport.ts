/**
 * Export/import user data (config, cards, review logs) for backup/restore.
 * Useful when browser cache is cleared.
 */

import { db } from './schema';
import type { Config, Card, ReviewLog } from '@/types/database';

/** Serialized export format (dates as ISO strings) */
export interface ExportData {
  version: 1;
  exportedAt: string;
  config: Array<Omit<Config, 'createdAt' | 'updatedAt'> & { createdAt: string; updatedAt: string }>;
  cards: Array<Omit<Card, 'due' | 'createdAt' | 'updatedAt' | 'last_review'> & { due: string; createdAt: string; updatedAt: string; last_review?: string }>;
  reviewLogs: Array<Omit<ReviewLog, 'due' | 'review' | 'reviewedAt'> & { due: string; review: string; reviewedAt: string }>;
}

function serializeConfig(c: Config) {
  return {
    ...c,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

function serializeCard(c: Card) {
  const { last_review, due, createdAt, updatedAt, ...rest } = c;
  return {
    ...rest,
    due: due.toISOString(),
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
    ...(last_review && { last_review: last_review.toISOString() }),
  };
}

function serializeReviewLog(r: ReviewLog) {
  return {
    ...r,
    due: r.due.toISOString(),
    review: r.review.toISOString(),
    reviewedAt: r.reviewedAt.toISOString(),
  };
}

export async function exportUserData(): Promise<ExportData> {
  const [configs, cards, reviewLogs] = await Promise.all([
    db.config.toArray(),
    db.cards.toArray(),
    db.reviewLogs.toArray(),
  ]);
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    config: configs.map(serializeConfig),
    cards: cards.map(serializeCard),
    reviewLogs: reviewLogs.map(serializeReviewLog),
  };
}

export async function importUserData(data: ExportData): Promise<void> {
  if (!data || data.version !== 1 || !Array.isArray(data.config)) {
    throw new Error('Invalid or unsupported backup file');
  }
  const configs = data.config.map((c) => ({
    ...c,
    createdAt: new Date(c.createdAt),
    updatedAt: new Date(c.updatedAt),
  }));
  const cards: Card[] = data.cards.map((c) => {
    const { last_review, due, createdAt, updatedAt, ...rest } = c;
    const card: Card = {
      ...rest,
      due: new Date(due),
      createdAt: new Date(createdAt),
      updatedAt: new Date(updatedAt),
    };
    if (last_review) card.last_review = new Date(last_review);
    return card;
  });
  const reviewLogs = data.reviewLogs.map((r) => ({
    ...r,
    due: new Date(r.due),
    review: new Date(r.review),
    reviewedAt: new Date(r.reviewedAt),
  }));
  await db.transaction('rw', db.config, db.cards, db.reviewLogs, async () => {
    await db.config.clear();
    await db.cards.clear();
    await db.reviewLogs.clear();
    if (configs.length > 0) await db.config.bulkAdd(configs);
    if (cards.length > 0) await db.cards.bulkAdd(cards);
    if (reviewLogs.length > 0) await db.reviewLogs.bulkAdd(reviewLogs);
  });
}
