import { Router, Response } from 'express';
import { prisma } from '../config/database';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth';
import { parsePagination, paginatedResponse } from '../utils/pagination';
import { AppError } from '../middleware/errorHandler';
import { UserRole, Tradition, ProfessionalTag, ProfessionType, VisibilityLevel } from '@prisma/client';
import { z } from 'zod';
import { createNotification } from '../utils/notify';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

const router = Router();

const updateProfileSchema = z.object({
  displayName: z.string().min(2).max(80).optional(),
  bio: z.string().max(500).optional(),
  country: z.string().length(2).optional(),
  city: z.string().optional(),
  traditions: z.array(z.nativeEnum(Tradition)).optional(),
  languages: z.array(z.string()).optional(),
  preferredLanguage: z.enum(['en', 'hi', 'mr', 'ne', 'si', 'th', 'ta', 'te', 'kn', 'bn', 'gu', 'pa', 'ja', 'ko', 'zh']).optional(),
  templeAffiliation: z.string().optional(),
  profilePhoto: z.string().url().optional(),
  coverImage: z.string().url().optional(),
  // Self-assignable roles only — MODERATOR/SUPER_ADMIN granted by admins
  role: z.enum(['PRACTITIONER', 'BHIKKHU', 'BHIKKHUNI', 'SCHOLAR']).optional(),
  professionType:   z.nativeEnum(ProfessionType).optional().nullable(),
  customProfession: z.string().max(100).optional().nullable(),
  interestTags:     z.array(z.string()).optional(),
  intentTags:       z.array(z.string()).optional(),
});

// GET /users/me/followers — people who follow me, annotated with isFollowingBack
router.get('/me/followers', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { limit, skip } = parsePagination(req.query as Record<string, unknown>);

  const [rows, total] = await Promise.all([
    prisma.follow.findMany({
      where: { followedId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take: limit, skip,
      include: {
        follower: {
          select: {
            id: true, displayName: true, profilePhoto: true, bio: true,
            traditions: true, country: true, city: true, role: true,
            isVerifiedClergy: true, isVerifiedTeacher: true,
            tags: { select: { tag: true } },
          },
        },
      },
    }),
    prisma.follow.count({ where: { followedId: req.user!.id } }),
  ]);

  const followerIds = rows.map(r => r.followerId);
  const iFollowSet = new Set(
    (await prisma.follow.findMany({
      where: { followerId: req.user!.id, followedId: { in: followerIds } },
      select: { followedId: true },
    })).map(f => f.followedId)
  );

  const data = rows.map(r => ({ ...r.follower, followedAt: r.createdAt, isFollowingBack: iFollowSet.has(r.followerId) }));
  res.json(paginatedResponse(data, total, parsePagination(req.query as Record<string, unknown>)));
});

// GET /users/me/following — people I follow, annotated with followsBack
router.get('/me/following', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { limit, skip } = parsePagination(req.query as Record<string, unknown>);

  const [rows, total] = await Promise.all([
    prisma.follow.findMany({
      where: { followerId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take: limit, skip,
      include: {
        followed: {
          select: {
            id: true, displayName: true, profilePhoto: true, bio: true,
            traditions: true, country: true, city: true, role: true,
            isVerifiedClergy: true, isVerifiedTeacher: true,
            tags: { select: { tag: true } },
          },
        },
      },
    }),
    prisma.follow.count({ where: { followerId: req.user!.id } }),
  ]);

  const followedIds = rows.map(r => r.followedId);
  const followsBackSet = new Set(
    (await prisma.follow.findMany({
      where: { followerId: { in: followedIds }, followedId: req.user!.id },
      select: { followerId: true },
    })).map(f => f.followerId)
  );

  const data = rows.map(r => ({ ...r.followed, followedAt: r.createdAt, followsBack: followsBackSet.has(r.followedId) }));
  res.json(paginatedResponse(data, total, parsePagination(req.query as Record<string, unknown>)));
});

// GET /users/:id
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  // Optional auth for privacy enforcement
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as { userId: string };
      const u = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, role: true, isVerifiedClergy: true, isActive: true, isContributor: true, contributorSince: true },
      });
      if (u?.isActive) req.user = u;
    } catch { /* anonymous browsing */ }
  }

  const [user, settings] = await Promise.all([
    prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true, displayName: true, bio: true, profilePhoto: true, coverImage: true,
        country: true, city: true, traditions: true, role: true,
        isVerifiedClergy: true, isVerifiedTeacher: true, isContributor: true, contributorSince: true,
        languages: true, preferredLanguage: true, templeAffiliation: true, createdAt: true,
        tags: { select: { tag: true } },
        _count: { select: { followers: true, following: true, posts: true, associations: true, projectMemberships: true, events: true } },
      },
    }),
    prisma.privacySettings.findUnique({ where: { userId: req.params.id } }),
  ]);
  if (!user) throw new AppError('User not found', 404);

  const visibility: VisibilityLevel = settings?.profileVisibility ?? VisibilityLevel.PUBLIC;

  if (visibility === VisibilityLevel.ANONYMOUS) {
    res.json({ id: user.id, displayName: 'Anonymous', profilePhoto: null, _count: user._count });
    return;
  }
  if (visibility === VisibilityLevel.COMMUNITY || visibility === VisibilityLevel.CONNECTIONS) {
    if (!req.user) { res.status(401).json({ error: 'Sign in to view this profile' }); return; }
    if (visibility === VisibilityLevel.CONNECTIONS) {
      const connected = await prisma.follow.findFirst({
        where: { followerId: req.user.id, followedId: req.params.id },
      });
      if (!connected) { res.status(403).json({ error: 'This profile is visible to connections only' }); return; }
    }
  }
  res.json(user);
});

// GET /users/:id/posts
router.get('/:id/posts', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { limit, skip } = parsePagination(req.query as Record<string, unknown>);
  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where: { authorId: req.params.id, isDeleted: false },
      orderBy: { createdAt: 'desc' },
      take: limit, skip,
      include: {
        author: { select: { id: true, displayName: true, profilePhoto: true, role: true, isVerifiedClergy: true } },
        _count: { select: { likes: true, comments: true } },
      },
    }),
    prisma.post.count({ where: { authorId: req.params.id, isDeleted: false } }),
  ]);
  res.json(paginatedResponse(posts, total, parsePagination(req.query as Record<string, unknown>)));
});

// PUT /users/me
router.put('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
  const updated = await prisma.user.update({
    where: { id: req.user!.id },
    data: parsed.data,
    select: { id: true, displayName: true, bio: true, country: true, traditions: true, preferredLanguage: true, professionType: true, customProfession: true, interestTags: true, intentTags: true },
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
  const [target, actor] = await Promise.all([
    prisma.user.findUnique({ where: { id: req.params.id } }),
    prisma.user.findUnique({ where: { id: req.user!.id }, select: { displayName: true } }),
  ]);
  if (!target) throw new AppError('User not found', 404);
  await prisma.follow.upsert({
    where: { followerId_followedId: { followerId: req.user!.id, followedId: req.params.id } },
    create: { followerId: req.user!.id, followedId: req.params.id },
    update: {},
  });
  res.json({ message: 'Followed successfully' });
  void createNotification(
    req.params.id, 'follow', 'New Connection',
    `${actor?.displayName ?? 'Someone'} connected with you`,
    { userId: req.user!.id }
  );
});

// DELETE /users/:id/follow
router.delete('/:id/follow', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  await prisma.follow.deleteMany({
    where: { followerId: req.user!.id, followedId: req.params.id },
  });
  res.json({ message: 'Unfollowed' });
});

// GET /users/me/community-feed — posts from members of the user's communities (spec: Active Discussions)
router.get('/me/community-feed', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { limit, skip } = parsePagination(req.query as Record<string, unknown>);

  // Get all association IDs the user belongs to
  const memberships = await prisma.associationMember.findMany({
    where: { userId: req.user!.id, isActive: true },
    select: { associationId: true },
  });

  if (!memberships.length) {
    res.json(paginatedResponse([], 0, parsePagination(req.query as Record<string, unknown>)));
    return;
  }

  const assocIds = memberships.map(m => m.associationId);

  // Get all user IDs in those communities
  const communityMembers = await prisma.associationMember.findMany({
    where: { associationId: { in: assocIds }, isActive: true },
    select: { userId: true },
  });

  const memberIds = [...new Set(communityMembers.map(m => m.userId))];

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where: { authorId: { in: memberIds }, isDeleted: false },
      orderBy: { createdAt: 'desc' },
      take: limit, skip,
      include: {
        author: { select: { id: true, displayName: true, profilePhoto: true, role: true, isVerifiedClergy: true } },
        _count: { select: { likes: true, comments: true } },
      },
    }),
    prisma.post.count({ where: { authorId: { in: memberIds }, isDeleted: false } }),
  ]);
  res.json(paginatedResponse(posts, total, parsePagination(req.query as Record<string, unknown>)));
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
