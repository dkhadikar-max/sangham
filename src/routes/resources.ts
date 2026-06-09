import { Router, Response } from 'express';
import { prisma } from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { ResourceType } from '@prisma/client';

const router = Router();

const RESOURCE_SELECT = {
  id: true, type: true, title: true, description: true,
  url: true, thumbnailUrl: true, creator: true, durationSecs: true,
  language: true, createdAt: true,
  contributor: { select: { id: true, displayName: true, profilePhoto: true } },
  _count: { select: { lessons: true } },
} as const;

// GET /resources?associationId=&projectId=&type=&q=
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { associationId, projectId, type, q, limit = '20', page = '1' } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const where: Record<string, unknown> = { isPublished: true };
  if (associationId) where.associationId = associationId as string;
  if (projectId)     where.projectId     = projectId as string;
  if (type && Object.values(ResourceType).includes(type as ResourceType)) where.type = type;
  if (q) where.title = { contains: q as string, mode: 'insensitive' };

  const [items, total] = await Promise.all([
    prisma.resource.findMany({ where, skip, take: Number(limit), orderBy: { createdAt: 'desc' }, select: RESOURCE_SELECT }),
    prisma.resource.count({ where }),
  ]);
  res.json({ data: items, total });
});

// GET /resources/:id
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const resource = await prisma.resource.findUnique({
    where: { id: req.params.id, isPublished: true },
    include: {
      contributor: { select: { id: true, displayName: true, profilePhoto: true } },
      thread: { include: { posts: { where: { isDeleted: false }, orderBy: { createdAt: 'asc' }, take: 50, include: { author: { select: { id: true, displayName: true, profilePhoto: true } } } } } },
    },
  });
  if (!resource) { res.status(404).json({ error: 'Resource not found' }); return; }
  res.json(resource);
});

// POST /resources
router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { type, title, description, url, thumbnailUrl, creator, durationSecs, language = 'en', associationId, projectId } = req.body;
  if (!type || !Object.values(ResourceType).includes(type)) {
    res.status(400).json({ error: 'valid type required' }); return;
  }
  if (!title?.trim()) { res.status(400).json({ error: 'title required' }); return; }
  if (!url?.trim())   { res.status(400).json({ error: 'url required' }); return; }

  const resource = await prisma.resource.create({
    data: {
      type, title: title.trim(), description: description?.trim() || null,
      url: url.trim(), thumbnailUrl: thumbnailUrl || null,
      creator: creator?.trim() || null,
      durationSecs: durationSecs ? Number(durationSecs) : null,
      language, contributorId: req.user!.id,
      associationId: associationId || null,
      projectId: projectId || null,
    },
    select: RESOURCE_SELECT,
  });

  // Increment contributor score
  await prisma.contributionScore.upsert({
    where: { userId: req.user!.id },
    create: { userId: req.user!.id, resourcesShared: 1, totalScore: 1 },
    update: { resourcesShared: { increment: 1 }, totalScore: { increment: 1 } },
  });

  res.status(201).json(resource);
});

// DELETE /resources/:id (own or moderator)
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const resource = await prisma.resource.findUnique({ where: { id: req.params.id } });
  if (!resource) { res.status(404).json({ error: 'Not found' }); return; }
  const isMod = ['MODERATOR', 'SUPER_ADMIN'].includes(req.user!.role);
  if (resource.contributorId !== req.user!.id && !isMod) {
    res.status(403).json({ error: 'Forbidden' }); return;
  }
  await prisma.resource.update({ where: { id: req.params.id }, data: { isPublished: false } });
  res.json({ message: 'Resource removed' });
});

export default router;
