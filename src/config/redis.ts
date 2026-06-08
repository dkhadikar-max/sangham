import Redis from 'ioredis';
import { env } from './env';

const noopRedis = {
  get: async () => null,
  setex: async () => null,
  del: async () => null,
  on: () => noopRedis,
} as unknown as Redis;

export const redis: Redis = env.REDIS_URL
  ? new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      retryStrategy: (times) => Math.min(times * 200, 5000),
    })
  : noopRedis;

if (env.REDIS_URL) {
  redis.on('error', (err) => console.error('Redis error:', err));
}

export async function connectRedis(): Promise<void> {
  if (!env.REDIS_URL) throw new Error('REDIS_URL not configured');
  await (redis as Redis).connect();
  console.log('✅ Redis connected');
}

export const CACHE_TTL = {
  FEED: 60,           // 1 minute
  USER_PROFILE: 300,  // 5 minutes
  LIBRARY_TEXT: 3600, // 1 hour
  DAILY_VERSE: 86400, // 24 hours
};
