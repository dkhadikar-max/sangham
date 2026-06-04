import Redis from 'ioredis';
import { env } from './env';

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

redis.on('error', (err) => console.error('Redis error:', err));

export async function connectRedis(): Promise<void> {
  await redis.connect();
  console.log('✅ Redis connected');
}

export const CACHE_TTL = {
  FEED: 60,          // 1 minute
  USER_PROFILE: 300, // 5 minutes
  LIBRARY_TEXT: 3600,// 1 hour
  DAILY_VERSE: 86400,// 24 hours
};
