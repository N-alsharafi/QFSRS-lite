import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  penaltyToGrade,
  calculatePenalty,
  scheduleCardReview,
  scheduleBulkReview,
} from '@/lib/review/scheduleReview';
import { Rating, State } from 'ts-fsrs';
import type { Card } from '@/types/database';

const mockConfigToArray = vi.fn();
const mockCardsUpdate = vi.fn();
const mockReviewLogsAdd = vi.fn();
const mockTransaction = vi.fn(async (_mode: string, ...args: unknown[]) => {
  const fn = args[args.length - 1];
  if (typeof fn === 'function') return await fn();
});

vi.mock('@/lib/db/schema', () => ({
  db: {
    config: {
      toArray: () => mockConfigToArray(),
    },
    cards: {
      update: (id: string, data: unknown) => mockCardsUpdate(id, data),
    },
    reviewLogs: {
      add: (log: unknown) => mockReviewLogsAdd(log),
    },
    transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}));

function createTestCard(overrides: Partial<Card> = {}): Card {
  const now = new Date();
  return {
    id: 'test-card-id',
    userId: null,
    surahNumber: 1,
    pageNumber: 1,
    state: State.New,
    due: now,
    stability: 0,
    difficulty: 0,
    elapsed_days: 0,
    scheduled_days: 0,
    reps: 0,
    lapses: 0,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('penaltyToGrade', () => {
  it('should return Again (1) for penalty >= 10', () => {
    expect(penaltyToGrade(10)).toBe(Rating.Again);
    expect(penaltyToGrade(15)).toBe(Rating.Again);
    expect(penaltyToGrade(100)).toBe(Rating.Again);
  });

  it('should return Hard (2) for penalty 6-9', () => {
    expect(penaltyToGrade(6)).toBe(Rating.Hard);
    expect(penaltyToGrade(7)).toBe(Rating.Hard);
    expect(penaltyToGrade(9)).toBe(Rating.Hard);
  });

  it('should return Good (3) for penalty 3-5', () => {
    expect(penaltyToGrade(3)).toBe(Rating.Good);
    expect(penaltyToGrade(4)).toBe(Rating.Good);
    expect(penaltyToGrade(5)).toBe(Rating.Good);
  });

  it('should return Easy (4) for penalty 0-2', () => {
    expect(penaltyToGrade(0)).toBe(Rating.Easy);
    expect(penaltyToGrade(1)).toBe(Rating.Easy);
    expect(penaltyToGrade(2)).toBe(Rating.Easy);
  });
});

describe('calculatePenalty', () => {
  it('should return 0 when all counts are 0', () => {
    expect(calculatePenalty(0, 0, 0)).toBe(0);
  });

  it('should count hesitations as 1 point each', () => {
    expect(calculatePenalty(1, 0, 0)).toBe(1);
    expect(calculatePenalty(5, 0, 0)).toBe(5);
  });

  it('should count mistakes as 4 points each', () => {
    expect(calculatePenalty(0, 1, 0)).toBe(4);
    expect(calculatePenalty(0, 2, 0)).toBe(8);
  });

  it('should count forgets as 5 points each', () => {
    expect(calculatePenalty(0, 0, 1)).toBe(5);
    expect(calculatePenalty(0, 0, 2)).toBe(10);
  });

  it('should combine all disfluencies correctly', () => {
    // 2 hesitations (2) + 1 mistake (4) + 1 forget (5) = 11
    expect(calculatePenalty(2, 1, 1)).toBe(11);
    // 3 hesitations (3) + 2 mistakes (8) + 0 forgets = 11
    expect(calculatePenalty(3, 2, 0)).toBe(11);
  });
});

describe('scheduleCardReview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConfigToArray.mockResolvedValue([
      {
        id: 'c1',
        desiredRetention: 0.9,
        enableFuzz: false,
      },
    ]);
    mockCardsUpdate.mockResolvedValue(undefined);
    mockReviewLogsAdd.mockResolvedValue(undefined);
  });

  it('should update the card and add a review log', async () => {
    const card = createTestCard();

    await scheduleCardReview(card, Rating.Good);

    expect(mockConfigToArray).toHaveBeenCalled();
    expect(mockTransaction).toHaveBeenCalledWith('rw', expect.anything(), expect.anything(), expect.any(Function));
    expect(mockCardsUpdate).toHaveBeenCalledWith(card.id, expect.any(Object));
    expect(mockReviewLogsAdd).toHaveBeenCalledTimes(1);
  });

  it('should pass updated card data with new due date', async () => {
    const card = createTestCard();
    const beforeDue = card.due.getTime();

    await scheduleCardReview(card, Rating.Good);

    const updateCall = mockCardsUpdate.mock.calls[0];
    const updatedCard = updateCall[1];
    expect(updatedCard.due).toBeInstanceOf(Date);
    expect(updatedCard.updatedAt).toBeInstanceOf(Date);
    expect(updatedCard.stability).toBeDefined();
    expect(updatedCard.difficulty).toBeDefined();
    expect(updatedCard.state).toBeDefined();
  });

  it('should add review log with correct cardId and rating', async () => {
    const card = createTestCard({ id: 'my-card-123' });

    await scheduleCardReview(card, Rating.Again);

    const logCall = mockReviewLogsAdd.mock.calls[0][0];
    expect(logCall.cardId).toBe('my-card-123');
    expect(logCall.rating).toBe(Rating.Again);
    expect(logCall.synced).toBe(false);
  });

  it('should use default config when no config in db', async () => {
    mockConfigToArray.mockResolvedValue([]);
    const card = createTestCard();

    await scheduleCardReview(card, Rating.Good);

    expect(mockCardsUpdate).toHaveBeenCalled();
    expect(mockReviewLogsAdd).toHaveBeenCalled();
  });
});

describe('scheduleBulkReview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConfigToArray.mockResolvedValue([
      {
        id: 'c1',
        desiredRetention: 0.9,
        enableFuzz: false,
      },
    ]);
    mockCardsUpdate.mockResolvedValue(undefined);
    mockReviewLogsAdd.mockResolvedValue(undefined);
  });

  it('should update all cards and add one review log per card', async () => {
    const cards = [
      createTestCard({ id: 'card-1', pageNumber: 1 }),
      createTestCard({ id: 'card-2', pageNumber: 2 }),
    ];

    await scheduleBulkReview(cards, () => Rating.Good);

    expect(mockCardsUpdate).toHaveBeenCalledTimes(2);
    expect(mockReviewLogsAdd).toHaveBeenCalledTimes(2);
  });

  it('should call getGradeForCard for each card with correct grade', async () => {
    const cards = [
      createTestCard({ id: 'card-1', pageNumber: 1 }),
      createTestCard({ id: 'card-2', pageNumber: 2 }),
    ];
    const getGradeForCard = vi.fn()
      .mockReturnValueOnce(Rating.Again)
      .mockReturnValueOnce(Rating.Easy);

    await scheduleBulkReview(cards, getGradeForCard);

    expect(getGradeForCard).toHaveBeenCalledTimes(2);
    expect(getGradeForCard).toHaveBeenNthCalledWith(1, cards[0]);
    expect(getGradeForCard).toHaveBeenNthCalledWith(2, cards[1]);

    const log1 = mockReviewLogsAdd.mock.calls[0][0];
    const log2 = mockReviewLogsAdd.mock.calls[1][0];
    expect(log1.rating).toBe(Rating.Again);
    expect(log2.rating).toBe(Rating.Easy);
  });

  it('should handle empty cards array', async () => {
    await scheduleBulkReview([], () => Rating.Good);

    expect(mockCardsUpdate).not.toHaveBeenCalled();
    expect(mockReviewLogsAdd).not.toHaveBeenCalled();
  });
});
