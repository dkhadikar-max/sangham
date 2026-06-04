import { Router, Response } from 'express';
import { prisma } from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { parsePagination, paginatedResponse } from '../utils/pagination';
import { AppError } from '../middleware/errorHandler';
import { redis, CACHE_TTL } from '../config/redis';

const router = Router();

// GET /library/search?q=&collection=&tradition=&language=&limit=&page=
router.get('/search', async (req: AuthRequest, res: Response): Promise<void> => {
  const { q, collection, tradition, language } = req.query;
  const { limit, skip } = parsePagination(req.query as Record<string, unknown>);

  const where: Record<string, unknown> = { isSearchable: true };
  if (tradition) where.collection = { tradition };
  if (language) where.language = language;
  if (collection) where.collection = { ...(where.collection as object), name: { contains: collection as string, mode: 'insensitive' } };

  // Basic text search via Postgres ILIKE (Elasticsearch integration is a separate service)
  if (q) {
    where.OR = [
      { title: { contains: q as string, mode: 'insensitive' } },
      { author: { contains: q as string, mode: 'insensitive' } },
      { translator: { contains: q as string, mode: 'insensitive' } },
    ];
  }

  const [texts, total] = await Promise.all([
    prisma.libraryText.findMany({
      where, take: limit, skip,
      include: { collection: { select: { name: true, tradition: true } } },
      select: {
        id: true, title: true, author: true, translator: true, language: true,
        licence: true, attribution: true, collection: true, externalId: true,
      },
    }),
    prisma.libraryText.count({ where }),
  ]);
  const params = parsePagination(req.query as Record<string, unknown>);
  res.json(paginatedResponse(texts, total, params));
});

// GET /library/texts/:id
router.get('/texts/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const cacheKey = `library:text:${req.params.id}`;
  const cached = await redis.get(cacheKey).catch(() => null);
  if (cached) { res.json(JSON.parse(cached)); return; }

  const text = await prisma.libraryText.findUnique({
    where: { id: req.params.id },
    include: {
      collection: { select: { name: true, tradition: true, licence: true, sourceUrl: true } },
      segments: { orderBy: { sequence: 'asc' }, select: { id: true, segmentKey: true, content: true, verseNumber: true, chapterRef: true, sequence: true } },
    },
  });
  if (!text) throw new AppError('Text not found', 404);
  await redis.setex(cacheKey, CACHE_TTL.LIBRARY_TEXT, JSON.stringify(text)).catch(() => {});
  res.json(text);
});

// POST /library/texts/:id/bookmarks
router.post('/texts/:id/bookmarks', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const text = await prisma.libraryText.findUnique({ where: { id: req.params.id } });
  if (!text) throw new AppError('Text not found', 404);
  await prisma.bookmark.upsert({
    where: { userId_textId: { userId: req.user!.id, textId: req.params.id } },
    create: { userId: req.user!.id, textId: req.params.id },
    update: {},
  });
  res.json({ bookmarked: true });
});

// DELETE /library/texts/:id/bookmarks
router.delete('/texts/:id/bookmarks', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  await prisma.bookmark.deleteMany({ where: { userId: req.user!.id, textId: req.params.id } });
  res.json({ bookmarked: false });
});

// POST /library/segments/:id/annotations
router.post('/segments/:id/annotations', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { content, isPublic } = req.body;
  if (!content || content.length > 1000) throw new AppError('Annotation must be 1–1000 characters', 400);
  const annotation = await prisma.annotation.create({
    data: { userId: req.user!.id, segmentId: req.params.id, content, isPublic: !!isPublic },
  });
  res.status(201).json(annotation);
});

// GET /library/daily-verse
router.get('/daily-verse', async (_req: AuthRequest, res: Response): Promise<void> => {
  const cacheKey = 'library:daily_verse';
  const cached = await redis.get(cacheKey).catch(() => null);
  if (cached) { res.json(JSON.parse(cached)); return; }

  // Pick a deterministic but rotating verse based on day-of-year
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const totalSegments = await prisma.librarySegment.count();
  if (totalSegments === 0) { res.json({ message: 'Library not yet seeded' }); return; }
  const verse = await prisma.librarySegment.findFirst({
    skip: dayOfYear % totalSegments,
    include: { text: { select: { title: true, attribution: true, licence: true } } },
  });
  await redis.setex(cacheKey, CACHE_TTL.DAILY_VERSE, JSON.stringify(verse)).catch(() => {});
  res.json(verse);
});

// GET /library/collections
router.get('/collections', async (_req: AuthRequest, res: Response): Promise<void> => {
  const collections = await prisma.libraryCollection.findMany({
    where: { isActive: true },
    select: { id: true, name: true, tradition: true, description: true, licence: true, _count: { select: { texts: true } } },
  });
  res.json(collections);
});

export default router;
