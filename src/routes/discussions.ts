import { Router, Response } from 'express';
import { prisma } from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

type EntityType = 'course' | 'resource' | 'study-circle' | 'project';

function threadWhere(entityType: EntityType, entityId: string) {
  switch (entityType) {
    case 'course':        return { courseId: entityId };
    case 'resource':      return { resourceId: entityId };
    case 'study-circle':  return { studyCircleId: entityId };
    case 'project':       return { projectId: entityId };
  }
}

// GET /discussions/:entityType/:entityId — get or create thread + posts
router.get('/:entityType/:entityId', async (req: AuthRequest, res: Response): Promise<void> => {
  const { entityType, entityId } = req.params;
  if (!['course', 'resource', 'study-circle', 'project'].includes(entityType)) {
    res.status(400).json({ error: 'Invalid entity type' }); return;
  }

  const where = threadWhere(entityType as EntityType, entityId);
  let thread = await prisma.discussionThread.findFirst({ where });

  if (!thread) {
    // Create thread lazily on first access
    thread = await prisma.discussionThread.create({
      data: { title: 'Discussion', ...where },
    });
  }

  const posts = await prisma.discussionPost.findMany({
    where: { threadId: thread.id, isDeleted: false },
    orderBy: { createdAt: 'asc' },
    take: 100,
    include: { author: { select: { id: true, displayName: true, profilePhoto: true } } },
  });

  res.json({ threadId: thread.id, posts });
});

// POST /discussions/:entityType/:entityId — post a message
router.post('/:entityType/:entityId', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { entityType, entityId } = req.params;
  if (!['course', 'resource', 'study-circle', 'project'].includes(entityType)) {
    res.status(400).json({ error: 'Invalid entity type' }); return;
  }

  const { content, parentId } = req.body;
  if (!content?.trim() || content.length > 2000) {
    res.status(400).json({ error: 'content required (max 2000 characters)' }); return;
  }

  const where = threadWhere(entityType as EntityType, entityId);
  let thread = await prisma.discussionThread.findFirst({ where });
  if (!thread) {
    thread = await prisma.discussionThread.create({ data: { title: 'Discussion', ...where } });
  }

  const post = await prisma.discussionPost.create({
    data: {
      threadId: thread.id,
      authorId: req.user!.id,
      content: content.trim(),
      parentId: parentId || null,
    },
    include: { author: { select: { id: true, displayName: true, profilePhoto: true } } },
  });

  res.status(201).json(post);
});

// DELETE /discussions/posts/:postId
router.delete('/posts/:postId', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const post = await prisma.discussionPost.findUnique({ where: { id: req.params.postId } });
  if (!post) { res.status(404).json({ error: 'Post not found' }); return; }
  const isMod = ['MODERATOR', 'SUPER_ADMIN'].includes(req.user!.role);
  if (post.authorId !== req.user!.id && !isMod) {
    res.status(403).json({ error: 'Forbidden' }); return;
  }
  await prisma.discussionPost.update({ where: { id: req.params.postId }, data: { isDeleted: true } });
  res.json({ message: 'Post removed' });
});

export default router;
