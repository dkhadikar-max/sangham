/**
 * Daily Verse Job
 * Run at midnight UTC via cron (e.g., node-cron or AWS EventBridge)
 * Rotates the featured library segment and busts the Redis cache.
 */
import { redis } from '../config/redis';

export async function rotateDailyVerse(): Promise<void> {
  await redis.del('library:daily_verse');
  console.log('[Job] Daily verse cache cleared — next request will populate it.');
}
