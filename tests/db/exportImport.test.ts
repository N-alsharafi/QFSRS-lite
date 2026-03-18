import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportUserData, importUserData, type ExportData } from '@/lib/db/exportImport';
import { State } from 'ts-fsrs';

// Mock functions - must be declared before vi.mock (hoisted)
const mockConfigToArray = vi.fn();
const mockCardsToArray = vi.fn();
const mockReviewLogsToArray = vi.fn();
const mockConfigClear = vi.fn();
const mockCardsClear = vi.fn();
const mockReviewLogsClear = vi.fn();
const mockConfigBulkAdd = vi.fn();
const mockCardsBulkAdd = vi.fn();
const mockReviewLogsBulkAdd = vi.fn();
const mockTransaction = vi.fn(async (_mode: string, ...args: unknown[]) => {
  const fn = args[args.length - 1];
  if (typeof fn === 'function') return await fn();
});

vi.mock('@/lib/db/schema', () => ({
  db: {
    config: {
      toArray: () => mockConfigToArray(),
      clear: () => mockConfigClear(),
      bulkAdd: (x: unknown) => mockConfigBulkAdd(x),
    },
    cards: {
      toArray: () => mockCardsToArray(),
      clear: () => mockCardsClear(),
      bulkAdd: (x: unknown) => mockCardsBulkAdd(x),
    },
    reviewLogs: {
      toArray: () => mockReviewLogsToArray(),
      clear: () => mockReviewLogsClear(),
      bulkAdd: (x: unknown) => mockReviewLogsBulkAdd(x),
    },
    transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}));

describe('exportUserData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConfigToArray.mockResolvedValue([]);
    mockCardsToArray.mockResolvedValue([]);
    mockReviewLogsToArray.mockResolvedValue([]);
  });

  it('should return ExportData with version 1', async () => {
    const result = await exportUserData();
    expect(result.version).toBe(1);
    expect(result.exportedAt).toBeDefined();
    expect(typeof result.exportedAt).toBe('string');
  });

  it('should include config, cards, reviewLogs arrays', async () => {
    const result = await exportUserData();
    expect(Array.isArray(result.config)).toBe(true);
    expect(Array.isArray(result.cards)).toBe(true);
    expect(Array.isArray(result.reviewLogs)).toBe(true);
  });

  it('should serialize config dates as ISO strings', async () => {
    const now = new Date();
    mockConfigToArray.mockResolvedValue([
      {
        id: 'c1',
        desiredRetention: 0.9,
        dailyNewLimit: 0,
        dailyReviewLimit: 40,
        enableFuzz: true,
        userId: null,
        createdAt: now,
        updatedAt: now,
      },
    ]);

    const result = await exportUserData();
    expect(result.config).toHaveLength(1);
    expect(typeof result.config[0].createdAt).toBe('string');
    expect(typeof result.config[0].updatedAt).toBe('string');
    expect(result.config[0].createdAt).toBe(now.toISOString());
  });

  it('should serialize card dates as ISO strings', async () => {
    const now = new Date();
    const card = {
      id: 'card1',
      userId: null,
      surahNumber: 1,
      pageNumber: 1,
      state: State.Review,
      due: now,
      stability: 10,
      difficulty: 5,
      elapsed_days: 0,
      scheduled_days: 7,
      reps: 5,
      lapses: 0,
      createdAt: now,
      updatedAt: now,
    };
    mockCardsToArray.mockResolvedValue([card]);

    const result = await exportUserData();
    expect(result.cards).toHaveLength(1);
    expect(typeof result.cards[0].due).toBe('string');
    expect(typeof result.cards[0].createdAt).toBe('string');
    expect(typeof result.cards[0].updatedAt).toBe('string');
  });

  it('should serialize card last_review when present', async () => {
    const now = new Date();
    const card = {
      id: 'card1',
      userId: null,
      surahNumber: 1,
      pageNumber: 1,
      state: State.Review,
      due: now,
      stability: 10,
      difficulty: 5,
      elapsed_days: 0,
      scheduled_days: 7,
      reps: 5,
      lapses: 0,
      last_review: now,
      createdAt: now,
      updatedAt: now,
    };
    mockCardsToArray.mockResolvedValue([card]);

    const result = await exportUserData();
    expect(result.cards[0].last_review).toBeDefined();
    expect(typeof result.cards[0].last_review).toBe('string');
  });

  it('should omit last_review when not present on card', async () => {
    const now = new Date();
    const card = {
      id: 'card1',
      userId: null,
      surahNumber: 1,
      pageNumber: 1,
      state: State.Review,
      due: now,
      stability: 10,
      difficulty: 5,
      elapsed_days: 0,
      scheduled_days: 7,
      reps: 5,
      lapses: 0,
      createdAt: now,
      updatedAt: now,
    };
    mockCardsToArray.mockResolvedValue([card]);

    const result = await exportUserData();
    expect(result.cards[0]).not.toHaveProperty('last_review');
  });

  it('should serialize reviewLog dates as ISO strings', async () => {
    const now = new Date();
    const log = {
      id: 'log1',
      userId: null,
      cardId: 'card1',
      rating: 3,
      state: State.Review,
      due: now,
      stability: 10,
      difficulty: 5,
      elapsed_days: 0,
      last_elapsed_days: 0,
      scheduled_days: 7,
      review: now,
      reviewedAt: now,
      synced: false,
    };
    mockReviewLogsToArray.mockResolvedValue([log]);

    const result = await exportUserData();
    expect(result.reviewLogs).toHaveLength(1);
    expect(typeof result.reviewLogs[0].due).toBe('string');
    expect(typeof result.reviewLogs[0].review).toBe('string');
    expect(typeof result.reviewLogs[0].reviewedAt).toBe('string');
  });
});

describe('importUserData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw on null data', async () => {
    await expect(importUserData(null as unknown as ExportData)).rejects.toThrow(
      'Invalid or unsupported backup file'
    );
  });

  it('should throw on wrong version', async () => {
    const data = { version: 2, exportedAt: '', config: [], cards: [], reviewLogs: [] } as unknown as ExportData;
    await expect(importUserData(data)).rejects.toThrow('Invalid or unsupported backup file');
  });

  it('should throw when config is not an array', async () => {
    const data = { version: 1, exportedAt: '', config: null, cards: [], reviewLogs: [] } as unknown as ExportData;
    await expect(importUserData(data)).rejects.toThrow('Invalid or unsupported backup file');
  });

  it('should clear tables and bulkAdd imported data', async () => {
    const now = new Date().toISOString();
    const data: ExportData = {
      version: 1,
      exportedAt: now,
      config: [
        {
          id: 'c1',
          desiredRetention: 0.9,
          dailyNewLimit: 0,
          dailyReviewLimit: 40,
          enableFuzz: true,
          userId: null,
          createdAt: now,
          updatedAt: now,
        },
      ],
      cards: [],
      reviewLogs: [],
    };

    await importUserData(data);

    expect(mockTransaction).toHaveBeenCalled();
    expect(mockConfigClear).toHaveBeenCalled();
    expect(mockCardsClear).toHaveBeenCalled();
    expect(mockReviewLogsClear).toHaveBeenCalled();
    expect(mockConfigBulkAdd).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'c1',
          desiredRetention: 0.9,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        }),
      ])
    );
  });

  it('should deserialize card dates to Date objects', async () => {
    const now = new Date().toISOString();
    const data: ExportData = {
      version: 1,
      exportedAt: now,
      config: [],
      cards: [
        {
          id: 'card1',
          userId: null,
          surahNumber: 1,
          pageNumber: 1,
          state: 2,
          due: now,
          stability: 10,
          difficulty: 5,
          elapsed_days: 0,
          scheduled_days: 7,
          reps: 5,
          lapses: 0,
          createdAt: now,
          updatedAt: now,
        },
      ],
      reviewLogs: [],
    };

    await importUserData(data);

    expect(mockCardsBulkAdd).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'card1',
          due: expect.any(Date),
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        }),
      ])
    );
  });

  it('should deserialize card last_review when present', async () => {
    const now = new Date().toISOString();
    const data: ExportData = {
      version: 1,
      exportedAt: now,
      config: [],
      cards: [
        {
          id: 'card1',
          userId: null,
          surahNumber: 1,
          pageNumber: 1,
          state: 2,
          due: now,
          stability: 10,
          difficulty: 5,
          elapsed_days: 0,
          scheduled_days: 7,
          reps: 5,
          lapses: 0,
          last_review: now,
          createdAt: now,
          updatedAt: now,
        },
      ],
      reviewLogs: [],
    };

    await importUserData(data);

    const addedCards = mockCardsBulkAdd.mock.calls[0][0] as Array<{ last_review?: Date }>;
    expect(addedCards[0].last_review).toBeInstanceOf(Date);
  });

  it('should not call bulkAdd when arrays are empty', async () => {
    const data: ExportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      config: [],
      cards: [],
      reviewLogs: [],
    };

    await importUserData(data);

    expect(mockConfigBulkAdd).not.toHaveBeenCalled();
    expect(mockCardsBulkAdd).not.toHaveBeenCalled();
    expect(mockReviewLogsBulkAdd).not.toHaveBeenCalled();
  });

  it('should deserialize reviewLog dates to Date objects', async () => {
    const now = new Date().toISOString();
    const data: ExportData = {
      version: 1,
      exportedAt: now,
      config: [],
      cards: [],
      reviewLogs: [
        {
          id: 'log1',
          userId: null,
          cardId: 'card1',
          rating: 3,
          state: 2,
          due: now,
          stability: 10,
          difficulty: 5,
          elapsed_days: 0,
          last_elapsed_days: 0,
          scheduled_days: 7,
          review: now,
          reviewedAt: now,
          synced: false,
        },
      ],
    };

    await importUserData(data);

    expect(mockReviewLogsBulkAdd).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'log1',
          due: expect.any(Date),
          review: expect.any(Date),
          reviewedAt: expect.any(Date),
        }),
      ])
    );
  });
});
