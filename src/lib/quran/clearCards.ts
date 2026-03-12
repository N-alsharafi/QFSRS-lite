import { db } from '@/lib/db/schema';

/**
 * Clear all cards from the database
 * Useful for development when you want to reset card data
 */
export async function clearAllCards() {
  const count = await db.cards.count();
  await db.cards.clear();
  console.log(`✅ Cleared ${count} cards from database`);
  return count;
}

/**
 * Clear entire database (cards, reviews, config)
 */
export async function clearEntireDatabase() {
  await db.delete();
  console.log('✅ Entire database deleted');
}
