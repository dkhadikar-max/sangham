import { Router, Response } from 'express';
import { prisma } from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { StudyCircleStatus } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

const router = Router();

const CIRCLE_SELECT = {
  id: true, topic: true, description: true, scheduleDescription: true, status: true, createdAt: true,
  facilitator: { select: { id: true, displayName: true, profilePhoto: true } },
  event: { select: { id: true, title: true, startsAt: true } },
  _count: { select: { members: true } },
} as const;

// GET /study-circles?associationId=&status=
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { associationId, facilitatorId, status, limit = '20', page = '1' } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const where: Record<string, unknown> = {};
  if (associationId)  where.associationId  = associationId as string;
  if (facilitatorId)  where.facilitatorId  = facilitatorId as string;
  if (status && Object.values(StudyCircleStatus).includes(status as StudyCircleStatus)) where.status = status;

  const [items, total] = await Promise.all([
    prisma.studyCircle.findMany({ where, skip, take: Number(limit), orderBy: { createdAt: 'desc' }, select: CIRCLE_SELECT }),
    prisma.studyCircle.count({ where }),
  ]);
  res.json({ data: items, total });
});

// GET /study-circles/:id
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  // Optional auth — only used to compute the caller's own isMember flag
  let userId: string | null = null;
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as { userId: string };
      userId = payload.userId;
    } catch { /* anonymous browsing */ }
  }

  const circle = await prisma.studyCircle.findUnique({
    where: { id: req.params.id },
    include: {
      facilitator: { select: { id: true, displayName: true, profilePhoto: true } },
      event: { select: { id: true, title: true, startsAt: true, onlineUrl: true } },
      members: {
        take: 30,
        orderBy: { joinedAt: 'asc' },
        include: { user: { select: { id: true, displayName: true, profilePhoto: true } } },
      },
      thread: {
        include: {
          posts: {
            where: { isDeleted: false },
            orderBy: { createdAt: 'asc' },
            take: 50,
            include: { author: { select: { id: true, displayName: true, profilePhoto: true } } },
          },
        },
      },
      _count: { select: { members: true } },
    },
  });
  if (!circle) { res.status(404).json({ error: 'Study circle not found' }); return; }

  const isMember = userId
    ? !!(await prisma.studyCircleMember.findUnique({ where: { studyCircleId_userId: { studyCircleId: req.params.id, userId } } }))
    : false;

  res.json({ ...circle, isMember });
});

// POST /study-circles
router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { associationId, topic, description, scheduleDescription, eventId } = req.body;
  if (!associationId) { res.status(400).json({ error: 'associationId required' }); return; }
  if (!topic?.trim()) { res.status(400).json({ error: 'topic required' }); return; }

  const membership = await prisma.associationMember.findUnique({
    where: { associationId_userId: { associationId, userId: req.user!.id } },
  });
  const isMod = ['MODERATOR', 'SUPER_ADMIN'].includes(req.user!.role);
  if (!membership && !isMod) { res.status(403).json({ error: 'Must be a community member to create a study circle' }); return; }

  const circle = await prisma.studyCircle.create({
    data: {
      associationId, topic: topic.trim(),
      description: description?.trim() || null,
      facilitatorId: req.user!.id,
      scheduleDescription: scheduleDescription?.trim() || null,
      eventId: eventId || null,
    },
    select: CIRCLE_SELECT,
  });

  // Auto-join as facilitator
  await prisma.studyCircleMember.create({ data: { studyCircleId: circle.id, userId: req.user!.id } });

  await prisma.contributionScore.upsert({
    where: { userId: req.user!.id },
    create: { userId: req.user!.id, studyCirclesFacilitated: 1, totalScore: 2 },
    update: { studyCirclesFacilitated: { increment: 1 }, totalScore: { increment: 2 } },
  });

  res.status(201).json(circle);
});

// POST /study-circles/:id/join
router.post('/:id/join', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const circle = await prisma.studyCircle.findUnique({ where: { id: req.params.id } });
  if (!circle || circle.status === StudyCircleStatus.CLOSED) {
    res.status(404).json({ error: 'Study circle not found or closed' }); return;
  }
  await prisma.studyCircleMember.upsert({
    where: { studyCircleId_userId: { studyCircleId: req.params.id, userId: req.user!.id } },
    create: { studyCircleId: req.params.id, userId: req.user!.id },
    update: {},
  });
  res.json({ message: 'Joined study circle' });
});

// DELETE /study-circles/:id/leave
router.delete('/:id/leave', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const circle = await prisma.studyCircle.findUnique({ where: { id: req.params.id } });
  if (!circle) { res.status(404).json({ error: 'Not found' }); return; }
  if (circle.facilitatorId === req.user!.id) {
    res.status(400).json({ error: 'Facilitator cannot leave. Close the circle instead.' }); return;
  }
  await prisma.studyCircleMember.deleteMany({
    where: { studyCircleId: req.params.id, userId: req.user!.id },
  });
  res.json({ message: 'Left study circle' });
});

// PUT /study-circles/:id/status (facilitator or mod)
router.put('/:id/status', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const circle = await prisma.studyCircle.findUnique({ where: { id: req.params.id } });
  if (!circle) { res.status(404).json({ error: 'Not found' }); return; }
  const isMod = ['MODERATOR', 'SUPER_ADMIN'].includes(req.user!.role);
  if (circle.facilitatorId !== req.user!.id && !isMod) {
    res.status(403).json({ error: 'Forbidden' }); return;
  }
  const { status } = req.body;
  if (!status || !Object.values(StudyCircleStatus).includes(status)) {
    res.status(400).json({ error: 'valid status required' }); return;
  }
  const updated = await prisma.studyCircle.update({ where: { id: req.params.id }, data: { status }, select: CIRCLE_SELECT });
  res.json(updated);
});

export default router;
