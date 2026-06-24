import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';
import { signToken, signRefreshToken } from '../utils/jwt';
import { authLimiter } from '../middleware/rateLimiter';
import { AppError } from '../middleware/errorHandler';
import { z } from 'zod';
import { zodMessage } from '../utils/zodError';

const router = Router();

// Fields returned on login/register — keeps state.user fully hydrated
const SESSION_USER_SELECT = {
  id: true, displayName: true, role: true, preferredLanguage: true,
  profilePhoto: true, bio: true, country: true, city: true,
  isActive: true, isVerifiedClergy: true, isVerifiedTeacher: true,
  isContributor: true, contributorSince: true,
  traditions: true, languages: true,
  professionType: true, customProfession: true,
  interestTags: true, intentTags: true,
  email: true,
} as const;

const registerSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().min(7).optional(),
  password: z.string().min(8),
  displayName: z.string().min(2).max(80),
  country: z.string().length(2).optional(),
}).refine(d => d.email || d.phone, { message: 'Email or phone required' });

const loginSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  password: z.string(),
});

// POST /auth/register
router.post('/register', authLimiter, async (req: Request, res: Response): Promise<void> => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: zodMessage(parsed.error) }); return; }
  const { email, phone, password, displayName, country } = parsed.data;

  const existing = await prisma.user.findFirst({
    where: { OR: [email ? { email } : {}, phone ? { phone } : {}] },
  });
  if (existing) throw new AppError('Account already exists', 409);

  const passwordHash = await bcrypt.hash(password, 12);
  const created = await prisma.user.create({
    data: { email, phone, displayName, country, passwordHash } as any,
    select: { id: true },
  });

  // Create default privacy settings so user appears in Discover immediately
  await prisma.privacySettings.create({
    data: {
      userId:              created.id,
      showInDiscovery:     true,
      profileVisibility:   'PUBLIC',
      messagingPermission: 'CONNECTIONS_ONLY',
      locationVisibility:  'CITY_ONLY',
      activityVisibility:  'PUBLIC',
      anonymousBrowsing:   false,
    },
  });

  const user = await prisma.user.findUnique({ where: { id: created.id }, select: SESSION_USER_SELECT });
  res.status(201).json({
    token: signToken(created.id),
    refreshToken: signRefreshToken(created.id),
    user,
  });
});

// POST /auth/login
router.post('/login', authLimiter, async (req: Request, res: Response): Promise<void> => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: zodMessage(parsed.error) }); return; }
  const { email, phone, password } = parsed.data;

  const raw = await prisma.user.findFirst({
    where: { OR: [email ? { email } : {}, phone ? { phone } : {}] },
  }) as any;
  if (!raw) throw new AppError('Invalid credentials', 401);

  const valid = await bcrypt.compare(password, raw.passwordHash || '');
  if (!valid) throw new AppError('Invalid credentials', 401);

  const [user] = await Promise.all([
    prisma.user.findUnique({ where: { id: raw.id }, select: SESSION_USER_SELECT }),
    prisma.user.update({ where: { id: raw.id }, data: { lastActiveAt: new Date() } }),
  ]);

  res.json({
    token: signToken(raw.id),
    refreshToken: signRefreshToken(raw.id),
    user,
  });
});

// POST /auth/refresh
router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body;
  if (!refreshToken) { res.status(400).json({ error: 'Refresh token required' }); return; }
  try {
    const { verifyToken } = await import('../utils/jwt');
    const payload = verifyToken(refreshToken);
    const user = await prisma.user.findUnique({ where: { id: payload.userId }, select: { id: true, isActive: true } });
    if (!user?.isActive) throw new AppError('User inactive', 401);
    res.json({ token: signToken(user.id) });
  } catch {
    throw new AppError('Invalid refresh token', 401);
  }
});

export default router;
