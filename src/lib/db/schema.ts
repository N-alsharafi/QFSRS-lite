import Dexie, { type EntityTable } from 'dexie';
import type { Card, ReviewLog, Config } from '@/types/database';

export class QuranFSRSDatabase extends Dexie {
  cards!: EntityTable<Card, 'id'>;
  reviewLogs!: EntityTable<ReviewLog, 'id'>;
  config!: EntityTable<Config, 'id'>;

  constructor() {
    super('QuranFSRSDB');
    
    this.version(1).stores({
      cards: 'id, userId, pageNumber, state, due, updatedAt',
      reviewLogs: 'id, userId, cardId, reviewedAt, synced',
      config: 'id, userId',
    });
  }
}

export const db = new QuranFSRSDatabase();
