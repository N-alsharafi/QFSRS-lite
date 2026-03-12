import { create } from 'zustand';
import type { ReviewLog } from '@/types/database';
import { db } from '@/lib/db/schema';

interface SyncOutboxState {
  pendingLogs: ReviewLog[];
  isSyncing: boolean;
  
  loadPendingLogs: () => Promise<void>;
  addLog: (log: ReviewLog) => Promise<void>;
  markSynced: (logId: string) => Promise<void>;
  getPendingCount: () => number;
}

export const useSyncOutboxStore = create<SyncOutboxState>((set, get) => ({
  pendingLogs: [],
  isSyncing: false,

  loadPendingLogs: async () => {
    const logs = await db.reviewLogs
      .where('synced')
      .equals(0)
      .toArray();
    set({ pendingLogs: logs });
  },

  addLog: async (log: ReviewLog) => {
    await db.reviewLogs.add(log);
    set((state) => ({
      pendingLogs: [...state.pendingLogs, log],
    }));
  },

  markSynced: async (logId: string) => {
    await db.reviewLogs.update(logId, { synced: true });
    set((state) => ({
      pendingLogs: state.pendingLogs.filter((log) => log.id !== logId),
    }));
  },

  getPendingCount: () => {
    return get().pendingLogs.length;
  },
}));
