import { Router, Response } from 'express';
import { prisma } from '../config/database';
import { authenticate, AuthRequest, requireTrustedOrAbove } from '../middleware/auth';
import { parsePagination, paginatedResponse } from '../utils/pagination';
import { AppError } from '../middleware/errorHandler';
import { PostType, Tradition } from '@prisma/client';
import { z } from 'zod';

const router = Router();

const createPostSchema = z.object({
  content: z.string().max(1000).optional(),
  postType: z.nativeEnum(PostType).default(PostType.TEXT),
  mediaUrls: z.array(z.string().url()).max(5).default([]),
  linkUrl: z.string().url().optional(),
  traditionTags: z.array(z.nativeEnum(Tradition)).default([]),
  libraryRefId: z.string().uuid().optional(),
});

// POST /posts
router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = createPostSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
  if (!parsed.data.content && parsed.data.mediaUrls.length === 0 && !parsed.data.linkUrl) {
    throw new AppError('Post must have content, media, or a link', 400);
  }
  const post = await prisma.post.create({
    data: {
      ...parsed.data,
      authorId: req.user!.id,
      isBhikkhuPost: req.user!.isVerifiedClergy,
    },
    include: {
      author: { select: { id: true, displayName: true, profilePhoto: true, role: true, isVerifiedClergy: true } },
    },
  });
  res.status(201).json(post);
});

// GET /posts/:id
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const post = await prisma.post.findUnique({
    where: { id: req.params.id, isDeleted: false },
    include: {
      author: { select: { id: true, displayName: true, profilePhoto: true, role: true, isVerifiedClergy: true } },
      comments: { take: 20, orderBy: { createdAt: 'asc' } },
      _count: { select: { likes: true, comments: true } },
    },
  });
  if (!post) throw new AppError('Post not found', 404);

  // Enrich comments with author display names
  const authorIds = [...new Set(post.comments.map(c => c.authorId))];
  const authors = authorIds.length
    ? await prisma.user.findMany({
        where: { id: { in: authorIds } },
        select: { id: true, displayName: true, profilePhoto: true },
      })
    : [];
  const authorMap = Object.fromEntries(authors.map(a => [a.id, a]));
  const enrichedComments = post.comments.map(c => ({ ...c, author: authorMap[c.authorId] ?? null }));

  res.json({ ...post, comments: enrichedComments });
});

// POST /posts/:id/like
router.post('/:id/like', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const post = await prisma.post.findUnique({ where: { id: req.params.id } });
  if (!post) throw new AppError('Post not found', 404);
  const existing = await prisma.like.findUnique({
    where: { postId_userId: { postId: req.params.id, userId: req.user!.id } },
  });
  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
    res.json({ liked: false });
  } else {
    await prisma.like.create({ data: { postId: req.params.id, userId: req.user!.id } });
    res.json({ liked: true });
  }
});

// POST /posts/:id/comment
router.post('/:id/comment', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { content, parentId } = req.body;
  if (!content || content.length > 500) throw new AppError('Comment must be 1–500 characters', 400);
  const comment = await prisma.comment.create({
    data: { postId: req.params.id, authorId: req.user!.id, content, parentId },
  });
  res.status(201).json(comment);
});

// POST /posts/:id/report
router.post('/:id/report', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { reason, details } = req.body;
  if (!reason) throw new AppError('Reason required', 400);
  await prisma.contentReport.create({
    data: { reporterId: req.user!.id, postId: req.params.id, reason, details },
  });
  res.json({ message: 'Report submitted. Thank you.' });
});

// DELETE /posts/:id  (soft delete — own posts or moderator)
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const post = await prisma.post.findUnique({ where: { id: req.params.id } });
  if (!post) throw new AppError('Post not found', 404);
  const isMod = ['MODERATOR', 'SUPER_ADMIN'].includes(req.user!.role);
  if (post.authorId !== req.user!.id && !isMod) throw new AppError('Forbidden', 403);
  await prisma.post.update({ where: { id: req.params.id }, data: { isDeleted: true } });
  res.json({ message: 'Post removed' });
});

export default router;
