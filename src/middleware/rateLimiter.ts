import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

export const apiLimiter = rateLimit({
  windowMs: env.NODE_ENV === 'test' ? 0 : parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
  max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { error: 'Too many auth attempts, please try again in 15 minutes.' },
});

export const publicLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: 'Rate limit exceeded for public endpoints.' },
});

export const aiTutorLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  keyGenerator: (req: any) => req.user?.id || req.ip || 'unknown',
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'AI Tutor limit reached — please wait before asking again.' },
});
