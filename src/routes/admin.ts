import { Router, Response } from 'express';
import { prisma } from '../config/database';
import { Prisma } from '@prisma/client';
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
  const [users, posts, sessions, events, assocs, reports, activeUsers, contributors, pendingClergy] = await Promise.all([
    prisma.user.count(),
    prisma.post.count({ where: { isDeleted: false } }),
    prisma.liveSession.count(),
    prisma.event.count(),
    prisma.association.count(),
    prisma.contentReport.count({ where: { isResolved: false } }),
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.count({ where: { isContributor: true } }),
    prisma.clergyApplication.count({ where: { status: 'PENDING' } }),
  ]);
  res.json({ users, activeUsers, posts, sessions, events, associations: assocs, openReports: reports, contributors, pendingClergy });
});

// GET /admin/users — raw SQL to avoid Prisma findMany visibility issues
router.get('/users', authenticate, requireRole(...adminRoles), async (req: AuthRequest, res: Response): Promise<void> => {
  const { q, role, page = '1', limit = '50' } = req.query;
  const pageNum  = Math.max(1, Number(page)  || 1);
  const limitNum = Math.max(1, Math.min(200, Number(limit) || 50));
  const skip     = (pageNum - 1) * limitNum;

  // Build WHERE fragments safely with Prisma.sql
  const conditions: Prisma.Sql[] = [];
  if (q)    conditions.push(Prisma.sql`u.display_name ILIKE ${'%' + (q as string) + '%'}`);
  if (role) conditions.push(Prisma.sql`u.role = ${role as string}`);
  const where = conditions.length
    ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`
    : Prisma.empty;

  type UserRow = {
    id: string; email: string | null; phone: string | null;
    displayName: string; role: string;
    isActive: boolean; isVerifiedClergy: boolean; isVerifiedTeacher: boolean;
    country: string | null; createdAt: Date;
    postsCount: bigint; followersCount: bigint;
  };

  const [rows, countResult] = await Promise.all([
    prisma.$queryRaw<UserRow[]>`
      SELECT
        u.id,
        u.email,
        u.phone,
        u.display_name        AS "displayName",
        u.role::text,
        u.is_active           AS "isActive",
        u.is_verified_clergy  AS "isVerifiedClergy",
        u.is_verified_teacher AS "isVerifiedTeacher",
        u.country,
        u.created_at          AS "createdAt",
        (SELECT COUNT(*) FROM posts p WHERE p.author_id = u.id AND p.is_deleted = false)::int AS "postsCount",
        (SELECT COUNT(*) FROM follows f WHERE f.followed_id = u.id)::int                      AS "followersCount"
      FROM users u
      ${where}
      ORDER BY u.created_at DESC
      LIMIT ${limitNum} OFFSET ${skip}
    `,
    prisma.$queryRaw<{ total: bigint }[]>`SELECT COUNT(*) AS total FROM users u ${where}`,
  ]);

  const users = rows.map(u => ({
    id:                u.id,
    email:             u.email,
    phone:             u.phone,
    displayName:       u.displayName,
    role:              u.role,
    isActive:          u.isActive,
    isVerifiedClergy:  u.isVerifiedClergy,
    isVerifiedTeacher: u.isVerifiedTeacher,
    country:           u.country,
    createdAt:         u.createdAt,
    _count: { posts: Number(u.postsCount), followers: Number(u.followersCount) },
  }));

  res.json({ data: users, total: Number(countResult[0]?.total ?? 0) });
});

// DELETE /admin/users/test-cleanup — remove all users except the requesting admin
router.delete('/users/test-cleanup', authenticate, requireRole(UserRole.SUPER_ADMIN), async (req: AuthRequest, res: Response): Promise<void> => {
  const adminId = req.user!.id;
  // Must delete in FK order — messages and moderation_actions have no onDelete: Cascade
  await prisma.$executeRaw`DELETE FROM messages WHERE sender_id != ${adminId} OR recipient_id != ${adminId}`;
  await prisma.$executeRaw`DELETE FROM moderation_actions WHERE moderator_id != ${adminId}`;
  const deleted = await prisma.$executeRaw`DELETE FROM users WHERE id != ${adminId}`;
  res.json({ deleted, message: `Deleted ${deleted} test user(s). Your admin account was preserved.` });
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

// DELETE /admin/users/:id — permanently remove a user (SUPER_ADMIN only, cannot self-delete)
router.delete('/users/:id', authenticate, requireRole(UserRole.SUPER_ADMIN), async (req: AuthRequest, res: Response): Promise<void> => {
  if (req.params.id === req.user!.id) {
    res.status(400).json({ error: 'Cannot delete your own account' }); return;
  }
  const target = await prisma.user.findUnique({ where: { id: req.params.id }, select: { id: true, email: true, displayName: true, role: true } });
  if (!target) { res.status(404).json({ error: 'User not found' }); return; }
  if (target.role === UserRole.SUPER_ADMIN) {
    res.status(400).json({ error: 'Cannot delete another Super Admin' }); return;
  }
  await prisma.user.delete({ where: { id: req.params.id } });
  res.json({ message: `User ${target.displayName} (${target.email || target.id}) permanently deleted` });
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

// GET /admin/debug/counts — raw SQL vs Prisma comparison to diagnose data discrepancies
router.get('/debug/counts', authenticate, requireRole(UserRole.SUPER_ADMIN), async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Raw SQL — bypasses Prisma query builder entirely
    const rawResult = await prisma.$queryRaw<{ count: bigint }[]>`SELECT COUNT(*) as count FROM users`;
    const rawCount = Number(rawResult[0]?.count ?? 0);

    // Prisma ORM count — same method used by /admin/stats
    const prismaCount = await prisma.user.count();

    // Prisma findMany count — same method used by /admin/users
    const findManyResult = await prisma.user.findMany({ select: { id: true }, take: 5, orderBy: { createdAt: 'desc' } });

    // Database URL hint — shows which DB we're actually connected to (no password)
    const dbUrl = process.env.DATABASE_URL || '';
    const dbHint = dbUrl.replace(/:([^@]+)@/, ':***@').substring(0, 80);

    res.json({
      raw_sql_count: rawCount,
      prisma_count: prismaCount,
      findmany_sample_count: findManyResult.length,
      findmany_sample_ids: findManyResult.map(u => u.id),
      counts_match: rawCount === prismaCount,
      db_hint: dbHint,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
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
