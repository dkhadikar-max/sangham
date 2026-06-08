import { Router, Response } from 'express';
import { prisma } from '../config/database';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth';
import { UserRole } from '@prisma/client';
import { seedBuddhistTexts } from '../scripts/seedLibrary';

const router = Router();
const adminRoles = [UserRole.MODERATOR, UserRole.SUPER_ADMIN];

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
  const { action, reason } = req.body; // action: remove | warn | dismiss
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

// GET /admin/stats  (super admin)
router.get('/stats', authenticate, requireRole(UserRole.SUPER_ADMIN), async (_req: AuthRequest, res: Response): Promise<void> => {
  const [users, posts, sessions, events, assocs, reports] = await Promise.all([
    prisma.user.count(),
    prisma.post.count({ where: { isDeleted: false } }),
    prisma.liveSession.count(),
    prisma.event.count(),
    prisma.association.count(),
    prisma.contentReport.count({ where: { isResolved: false } }),
  ]);
  res.json({ users, posts, sessions, events, associations: assocs, openReports: reports });
});

// POST /admin/seed-library  — one-shot Buddhist text seeder
router.post('/seed-library', authenticate, requireRole(UserRole.SUPER_ADMIN), async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await seedBuddhistTexts();
    res.json({ message: `Seeded ${result.total} texts`, ...result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
