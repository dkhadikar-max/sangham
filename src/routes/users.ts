import { Router, Response } from 'express';
import { prisma } from '../config/database';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth';
import { parsePagination, paginatedResponse } from '../utils/pagination';
import { AppError } from '../middleware/errorHandler';
import { UserRole, Tradition, ProfessionalTag } from '@prisma/client';
import { z } from 'zod';

const router = Router();

const updateProfileSchema = z.object({
  displayName: z.string().min(2).max(80).optional(),
  bio: z.string().max(500).optional(),
  country: z.string().length(2).optional(),
  city: z.string().optional(),
  traditions: z.array(z.nativeEnum(Tradition)).optional(),
  languages: z.array(z.string()).optional(),
  templeAffiliation: z.string().optional(),
  // Self-assignable roles only — MODERATOR/SUPER_ADMIN granted by admins
  role: z.enum(['PRACTITIONER', 'BHIKKHU', 'BHIKKHUNI', 'SCHOLAR']).optional(),
});

// GET /users/:id
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: {
      id: true, displayName: true, bio: true, profilePhoto: true, coverImage: true,
      country: true, city: true, traditions: true, role: true, isVerifiedClergy: true,
      languages: true, templeAffiliation: true, createdAt: true,
      _count: { select: { followers: true, following: true, posts: true } },
    },
  });
  if (!user) throw new AppError('User not found', 404);
  res.json(user);
});

// PUT /users/me
router.put('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
  const updated = await prisma.user.update({
    where: { id: req.user!.id },
    data: parsed.data,
    select: { id: true, displayName: true, bio: true, country: true, traditions: true },
  });
  res.json(updated);
});

// PUT /users/me/tags
router.put('/me/tags', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { tags } = req.body;
  if (!Array.isArray(tags)) { res.status(400).json({ error: 'tags must be an array' }); return; }
  const validTags = Object.values(ProfessionalTag);
  const cleaned = (tags as string[]).filter((t): t is ProfessionalTag => validTags.includes(t as ProfessionalTag));
  await prisma.userTag.deleteMany({ where: { userId: req.user!.id } });
  if (cleaned.length > 0) {
    await prisma.userTag.createMany({
      data: cleaned.map(tag => ({ userId: req.user!.id, tag })),
    });
  }
  res.json({ tags: cleaned });
});

// POST /users/:id/follow
router.post('/:id/follow', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  if (req.params.id === req.user!.id) throw new AppError('Cannot follow yourself', 400);
  const target = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!target) throw new AppError('User not found', 404);
  await prisma.follow.upsert({
    where: { followerId_followedId: { followerId: req.user!.id, followedId: req.params.id } },
    create: { followerId: req.user!.id, followedId: req.params.id },
    update: {},
  });
  res.json({ message: 'Followed successfully' });
});

// DELETE /users/:id/follow
router.delete('/:id/follow', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  await prisma.follow.deleteMany({
    where: { followerId: req.user!.id, followedId: req.params.id },
  });
  res.json({ message: 'Unfollowed' });
});

// GET /users/me/feed
router.get('/me/feed', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { limit, skip } = parsePagination(req.query as Record<string, unknown>);
  const followedIds = await prisma.follow.findMany({
    where: { followerId: req.user!.id },
    select: { followedId: true },
  });
  const ids = followedIds.map(f => f.followedId);
  ids.push(req.user!.id); // include own posts

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where: { authorId: { in: ids }, isDeleted: false },
      orderBy: { createdAt: 'desc' },
      take: limit, skip,
      include: {
        author: { select: { id: true, displayName: true, profilePhoto: true, role: true, isVerifiedClergy: true } },
        _count: { select: { likes: true, comments: true } },
      },
    }),
    prisma.post.count({ where: { authorId: { in: ids }, isDeleted: false } }),
  ]);
  const params = parsePagination(req.query as Record<string, unknown>);
  res.json(paginatedResponse(posts, total, params));
});

// POST /clergy/apply
router.post('/clergy/apply', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const existing = await prisma.clergyApplication.findUnique({ where: { userId: req.user!.id } });
  if (existing) throw new AppError('Application already submitted', 409);
  const app = await prisma.clergyApplication.create({
    data: {
      userId: req.user!.id,
      templeAffiliation: req.body.templeAffiliation,
      vinayaTradition: req.body.vinayaTradition,
      notes: req.body.notes,
    },
  });
  res.status(201).json(app);
});

// PUT /clergy/:id/review  (admin only)
router.put('/clergy/:id/review',
  authenticate,
  requireRole(UserRole.MODERATOR, UserRole.SUPER_ADMIN),
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { status, rejectionReason } = req.body;
    const app = await prisma.clergyApplication.update({
      where: { id: req.params.id },
      data: {
        status,
        reviewedBy: req.user!.id,
        reviewedAt: new Date(),
        rejectionReason: rejectionReason || null,
      },
    });
    if (status === 'APPROVED') {
      await prisma.user.update({
        where: { id: app.userId },
        data: {
          isVerifiedClergy: true,
          role: req.body.clergyRole || UserRole.BHIKKHU,
        },
      });
    }
    res.json(app);
  }
);

export default router;
