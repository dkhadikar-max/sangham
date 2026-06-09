import { Router, Response } from 'express';
import { prisma } from '../config/database';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth';
import { UserRole } from '@prisma/client';
import { seedBuddhistTexts } from '../scripts/seedLibrary';

const router = Router();
const adminRoles = [UserRole.MODERATOR, UserRole.SUPER_ADMIN];

// POST /admin/bootstrap — one-time promotion (no auth, uses BOOTSTRAP_SECRET env var)
router.post('/bootstrap', async (req: AuthRequest, res: Response): Promise<void> => {
  const bootstrapSecret = process.env.BOOTSTRAP_SECRET;
  if (!bootstrapSecret) { res.status(503).json({ error: 'BOOTSTRAP_SECRET not configured on server' }); return; }
  const { secret, email } = req.body;
  if (!secret || secret !== bootstrapSecret) { res.status(401).json({ error: 'Invalid bootstrap secret' }); return; }
  if (!email) { res.status(400).json({ error: 'email required' }); return; }
  const user = await prisma.user.findFirst({ where: { email } });
  if (!user) { res.status(404).json({ error: `No user found with email: ${email}` }); return; }
  await prisma.user.update({ where: { id: user.id }, data: { role: UserRole.SUPER_ADMIN } });
  res.json({ message: `${email} is now SUPER_ADMIN`, userId: user.id, displayName: user.displayName });
});

// GET /admin/me — return current admin user info (for panel auth check)
router.get('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { id: true, email: true, displayName: true, role: true, profilePhoto: true },
  });
  if (!user) { res.status(404).json({ error: 'User not found' }); return; }
  if (user.role !== UserRole.MODERATOR && user.role !== UserRole.SUPER_ADMIN) {
    res.status(403).json({ error: 'Admin access required' }); return;
  }
  res.json(user);
});

// GET /admin/stats
router.get('/stats', authenticate, requireRole(UserRole.SUPER_ADMIN), async (_req: AuthRequest, res: Response): Promise<void> => {
  const [users, posts, sessions, events, assocs, reports, activeUsers] = await Promise.all([
    prisma.user.count(),
    prisma.post.count({ where: { isDeleted: false } }),
    prisma.liveSession.count(),
    prisma.event.count(),
    prisma.association.count(),
    prisma.contentReport.count({ where: { isResolved: false } }),
    prisma.user.count({ where: { isActive: true } }),
  ]);
  res.json({ users, activeUsers, posts, sessions, events, associations: assocs, openReports: reports });
});

// GET /admin/users
router.get('/users', authenticate, requireRole(...adminRoles), async (req: AuthRequest, res: Response): Promise<void> => {
  const { q, role, page = '1', limit = '50' } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const where: Record<string, unknown> = {};
  if (q) where.displayName = { contains: q as string, mode: 'insensitive' };
  if (role) where.role = role as UserRole;
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where, skip, take: Number(limit),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, email: true, displayName: true, role: true,
        isActive: true, isVerifiedClergy: true, isVerifiedTeacher: true,
        country: true, createdAt: true,
        _count: { select: { posts: true, followers: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);
  res.json({ data: users, total });
});

// PUT /admin/users/:id/role
router.put('/users/:id/role', authenticate, requireRole(UserRole.SUPER_ADMIN), async (req: AuthRequest, res: Response): Promise<void> => {
  const { role } = req.body;
  if (!Object.values(UserRole).includes(role)) { res.status(400).json({ error: 'Invalid role' }); return; }
  await prisma.user.update({ where: { id: req.params.id }, data: { role } });
  res.json({ message: 'Role updated' });
});

// PUT /admin/users/:id/ban
router.put('/users/:id/ban', authenticate, requireRole(...adminRoles), async (req: AuthRequest, res: Response): Promise<void> => {
  const { ban } = req.body;
  await prisma.user.update({ where: { id: req.params.id }, data: { isActive: !ban } });
  res.json({ message: ban ? 'User banned' : 'User unbanned' });
});

// GET /admin/moderation/queue
router.get('/moderation/queue', authenticate, requireRole(...adminRoles), async (_req: AuthRequest, res: Response): Promise<void> => {
  const reports = await prisma.contentReport.findMany({
    where: { isResolved: false },
    orderBy: { createdAt: 'asc' },
    take: 50,
    include: { post: { select: { id: true, content: true, authorId: true } } },
  });
  res.json(reports);
});

// PUT /admin/content/:id/action
router.put('/content/:id/action', authenticate, requireRole(...adminRoles), async (req: AuthRequest, res: Response): Promise<void> => {
  const { action, reason } = req.body;
  const report = await prisma.contentReport.findUnique({ where: { id: req.params.id } });
  if (!report) { res.status(404).json({ error: 'Report not found' }); return; }

  await prisma.contentReport.update({ where: { id: req.params.id }, data: { isResolved: true } });

  if (action === 'remove' && report.postId) {
    await prisma.post.update({ where: { id: report.postId }, data: { isDeleted: true } });
  }
  if (action !== 'dismiss') {
    await prisma.moderationAction.create({
      data: { moderatorId: req.user!.id, targetId: report.postId || report.reporterId, targetType: 'post', action, reason: reason || 'Policy violation' },
    });
  }
  res.json({ message: `Action '${action}' applied` });
});

// GET /admin/associations
router.get('/associations', authenticate, requireRole(...adminRoles), async (_req: AuthRequest, res: Response): Promise<void> => {
  const assocs = await prisma.association.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: {
      id: true, name: true, category: true, country: true, city: true,
      isVerified: true, createdAt: true,
      _count: { select: { members: { where: { isActive: true } } } },
    },
  });
  res.json(assocs);
});

// PUT /admin/associations/:id/verify
router.put('/associations/:id/verify', authenticate, requireRole(...adminRoles), async (req: AuthRequest, res: Response): Promise<void> => {
  const { verify } = req.body;
  await prisma.association.update({ where: { id: req.params.id }, data: { isVerified: !!verify } });
  res.json({ message: verify ? 'Community verified' : 'Verification removed' });
});

// POST /admin/seed-library
router.post('/seed-library', authenticate, requireRole(UserRole.SUPER_ADMIN), async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await seedBuddhistTexts();
    res.json({ message: `Seeded ${result.total} texts`, ...result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
