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

  const { collectionId } = req.query;
  const where: Record<string, unknown> = { isSearchable: true };
  if (tradition) where.collection = { tradition };
  if (language) where.language = language;
  if (collectionId) where.collectionId = collectionId;                           // filter by exact collection UUID
  else if (collection) where.collection = { ...(where.collection as object), name: { contains: collection as string, mode: 'insensitive' } };

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
      select: {
        id: true, title: true, author: true, translator: true, language: true,
        licence: true, attribution: true, externalId: true,
        collection: { select: { name: true, tradition: true } },
      },
    }),
    prisma.libraryText.count({ where }),
  ]);
  const params = parsePagination(req.query as Record<string, unknown>);
  res.json(paginatedResponse(texts, total, params));
});

// GET /library/texts/:id?segOffset=0&segLimit=100
router.get('/texts/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const segOffset = req.query.segOffset !== undefined ? parseInt(req.query.segOffset as string, 10) : 0;
  const segLimit  = req.query.segLimit  !== undefined ? parseInt(req.query.segLimit  as string, 10) : 100;
  const isPaginated = req.query.segOffset !== undefined || req.query.segLimit !== undefined;

  // Cache only full first-page requests
  const cacheKey = `library:text:${req.params.id}:${segOffset}:${segLimit}`;
  const cached = await redis.get(cacheKey).catch(() => null);
  if (cached) { res.json(JSON.parse(cached)); return; }

  const [text, segmentsTotal] = await Promise.all([
    prisma.libraryText.findUnique({
      where: { id: req.params.id },
      include: {
        collection: { select: { name: true, tradition: true, licence: true, sourceUrl: true } },
        segments: {
          orderBy: { sequence: 'asc' },
          skip: segOffset,
          take: segLimit,
          select: { id: true, segmentKey: true, content: true, verseNumber: true, chapterRef: true, sequence: true },
        },
      },
    }),
    prisma.librarySegment.count({ where: { textId: req.params.id } }),
  ]);
  if (!text) throw new AppError('Text not found', 404);

  const result = { ...text, segmentsTotal, segOffset, segLimit };
  if (!isPaginated) await redis.setex(cacheKey, CACHE_TTL.LIBRARY_TEXT, JSON.stringify(result)).catch(() => {});
  res.json(result);
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

// GET /library/daily-verse?lang=en
// Fallback hierarchy: requested lang → en → any
router.get('/daily-verse', async (req: AuthRequest, res: Response): Promise<void> => {
  const requested = typeof req.query.lang === 'string' && req.query.lang.trim()
    ? req.query.lang.trim().toLowerCase()
    : 'en';

  // Resolve effective language with fallback
  let effectiveLang = requested;
  let total = await prisma.librarySegment.count({ where: { text: { language: effectiveLang } } });

  if (total === 0 && effectiveLang !== 'en') {
    effectiveLang = 'en';
    total = await prisma.librarySegment.count({ where: { text: { language: 'en' } } });
  }

  const useAny = total === 0;
  if (useAny) {
    total = await prisma.librarySegment.count();
  }

  if (total === 0) { res.json({ message: 'Library not yet seeded' }); return; }

  const cacheKey = `library:daily_verse:${useAny ? 'any' : effectiveLang}`;
  const cached = await redis.get(cacheKey).catch(() => null);
  if (cached) { res.json(JSON.parse(cached)); return; }

  // Deterministic rotation: different verse each day, same verse for all users on the same day
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const where = useAny ? {} : { text: { language: effectiveLang } };
  const verse = await prisma.librarySegment.findFirst({
    where,
    orderBy: { id: 'asc' },
    skip: dayOfYear % total,
    include: { text: { select: { title: true, attribution: true, licence: true, language: true } } },
  });
  if (!verse) { res.json({ message: 'No verse found' }); return; }

  const result = { ...verse, resolvedLang: effectiveLang, requestedLang: requested };
  await redis.setex(cacheKey, CACHE_TTL.DAILY_VERSE, JSON.stringify(result)).catch(() => {});
  res.json(result);
});

// GET /library/collections
router.get('/collections', async (_req: AuthRequest, res: Response): Promise<void> => {
  const collections = await prisma.libraryCollection.findMany({
    where: { isActive: true },
    select: {
      id: true, name: true, tradition: true, description: true, licence: true,
      _count: { select: { texts: true } },
      texts: { select: { language: true }, distinct: ['language'] },
    },
    orderBy: { name: 'asc' },
  });
  const result = collections.map(c => ({
    ...c,
    languages: [...new Set(c.texts.map((t: any) => t.language))],
    texts: undefined,
  }));
  res.json(result);
});

// GET /library/my-bookmarks — authenticated
router.get('/my-bookmarks', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const bookmarks = await prisma.bookmark.findMany({
    where: { userId: req.user!.id },
    include: {
      text: {
        select: {
          id: true, title: true, author: true, language: true,
          collection: { select: { name: true, tradition: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 30,
  });
  res.json(bookmarks.map((b: any) => b.text));
});

export default router;
