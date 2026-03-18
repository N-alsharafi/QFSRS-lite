import { describe, it, expect, beforeEach } from 'vitest';
import { QuranFSRSDatabase } from '@/lib/db/schema';
import { generateUUID } from '@/lib/utils/uuid';
import { State } from 'ts-fsrs';

describe('Database Schema', () => {
  let db: QuranFSRSDatabase;

  beforeEach(async () => {
    db = new QuranFSRSDatabase();
    await db.delete();
    db = new QuranFSRSDatabase();
  });

  it('should create database with correct tables', () => {
    expect(db.cards).toBeDefined();
    expect(db.reviewLogs).toBeDefined();
    expect(db.config).toBeDefined();
  });

  it('should add a card with UUID primary key', async () => {
    const cardId = generateUUID();
    const card = {
      id: cardId,
      pageNumber: 293,
      state: State.New,
      due: new Date(),
      stability: 0,
      difficulty: 0,
      elapsed_days: 0,
      scheduled_days: 0,
      reps: 0,
      lapses: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.cards.add(card);
    const retrieved = await db.cards.get(cardId);

    expect(retrieved).toBeDefined();
    expect(retrieved?.pageNumber).toBe(293);
    expect(typeof retrieved?.id).toBe('string');
  });

  it('should validate Surah 18 metadata - starts on Page 293', async () => {
    const cardId = generateUUID();
    const surah18Card = {
      id: cardId,
      pageNumber: 293,
      state: State.New,
      due: new Date(),
      stability: 0,
      difficulty: 0,
      elapsed_days: 0,
      scheduled_days: 0,
      reps: 0,
      lapses: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.cards.add(surah18Card);
    const retrieved = await db.cards.where('pageNumber').equals(293).first();

    expect(retrieved).toBeDefined();
    expect(retrieved?.pageNumber).toBe(293);
  });

  it('should add and retrieve review logs', async () => {
    const logId = generateUUID();
    const cardId = generateUUID();
    
    const reviewLog = {
      id: logId,
      cardId: cardId,
      rating: 4,
      state: State.Review,
      due: new Date(),
      stability: 10,
      difficulty: 5,
      elapsed_days: 1,
      last_elapsed_days: 0,
      scheduled_days: 3,
      review: new Date(),
      reviewedAt: new Date(),
      synced: false,
    };

    await db.reviewLogs.add(reviewLog);
    const retrieved = await db.reviewLogs.get(logId);

    expect(retrieved).toBeDefined();
    expect(retrieved?.cardId).toBe(cardId);
    expect(retrieved?.synced).toBe(false);
  });

  it('should store and retrieve config with defaults', async () => {
    const configId = generateUUID();
    const config = {
      id: configId,
      desiredRetention: 0.90,
      dailyNewLimit: 20,
      dailyReviewLimit: 100,
      enableFuzz: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.config.add(config);
    const retrieved = await db.config.get(configId);

    expect(retrieved).toBeDefined();
    expect(retrieved?.desiredRetention).toBe(0.90);
    expect(retrieved?.enableFuzz).toBe(true);
  });
});
