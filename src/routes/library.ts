import { Router, Response } from 'express';
import { prisma } from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { parsePagination, paginatedResponse } from '../utils/pagination';
import { AppError } from '../middleware/errorHandler';
import { redis, CACHE_TTL } from '../config/redis';
import { searchEsLibrary, indexLibraryTexts, getEsClient, ES_INDEX } from '../config/elasticsearch';
import { UserRole } from '@prisma/client';
import { env } from '../config/env';
import { aiTutorLimiter } from '../middleware/rateLimiter';

const router = Router();

// GET /library/search?q=&collection=&tradition=&language=&limit=&page=
router.get('/search', async (req: AuthRequest, res: Response): Promise<void> => {
  const { q, collection, tradition, language } = req.query;
  const { limit, skip } = parsePagination(req.query as Record<string, unknown>);
  const { collectionId } = req.query;

  // ── Elasticsearch path (when ELASTICSEARCH_URL is configured) ─────────────
  if (q && typeof q === 'string') {
    const esResult = await searchEsLibrary(
      q,
      {
        tradition: tradition as string | undefined,
        language:  language  as string | undefined,
        collectionId: collectionId as string | undefined,
      },
      limit,
      skip,
    );
    if (esResult) {
      const texts = await prisma.libraryText.findMany({
        where: { id: { in: esResult.ids }, isSearchable: true },
        select: {
          id: true, title: true, author: true, translator: true, language: true,
          licence: true, attribution: true, externalId: true, sourceUrl: true, coverUrl: true,
          collection: { select: { name: true, tradition: true, sourceUrl: true } },
        },
      });
      // Preserve ES ranking order
      const ordered = esResult.ids.map(id => texts.find(t => t.id === id)).filter(Boolean);
      const params = parsePagination(req.query as Record<string, unknown>);
      res.json(paginatedResponse(ordered, esResult.total, params));
      return;
    }
  }

  // ── Postgres ILIKE fallback ───────────────────────────────────────────────
  const where: Record<string, unknown> = { isSearchable: true };
  if (tradition)   where.collection = { tradition };
  if (language)    where.language = language;
  if (collectionId) where.collectionId = collectionId;
  else if (collection) where.collection = { ...(where.collection as object), name: { contains: collection as string, mode: 'insensitive' } };

  if (q) {
    where.OR = [
      { title:      { contains: q as string, mode: 'insensitive' } },
      { author:     { contains: q as string, mode: 'insensitive' } },
      { translator: { contains: q as string, mode: 'insensitive' } },
    ];
  }

  const sort = req.query.sort as string | undefined;
  const orderBy = sort === 'recent' ? { createdAt: 'desc' as const } : { title: 'asc' as const };

  const [texts, total] = await Promise.all([
    prisma.libraryText.findMany({
      where, take: limit, skip, orderBy,
      select: {
        id: true, title: true, author: true, translator: true, language: true,
        licence: true, attribution: true, externalId: true, sourceUrl: true, coverUrl: true,
        createdAt: true,
        _count: { select: { segments: true } },
        collection: { select: { name: true, tradition: true, sourceUrl: true } },
      },
    }),
    prisma.libraryText.count({ where }),
  ]);
  const params = parsePagination(req.query as Record<string, unknown>);
  const mapped = texts.map((t: any) => ({ ...t, segmentsTotal: t._count?.segments ?? 0, _count: undefined }));
  res.json(paginatedResponse(mapped, total, params));
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

// GET /library/texts/:id/progress — get user's reading progress for a text
router.get('/texts/:id/progress', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const progress = await prisma.readingProgress.findUnique({
    where: { userId_textId: { userId: req.user!.id, textId: req.params.id } },
  });
  res.json(progress || { currentSegment: 0, percentComplete: 0, isCompleted: false });
});

// PUT /library/texts/:id/progress — upsert reading progress
router.put('/texts/:id/progress', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { currentSegment, percentComplete, timeSpentSeconds } = req.body;
  if (typeof percentComplete !== 'number') throw new AppError('percentComplete required', 400);
  const progress = await prisma.readingProgress.upsert({
    where: { userId_textId: { userId: req.user!.id, textId: req.params.id } },
    create: {
      userId: req.user!.id,
      textId: req.params.id,
      currentSegment: currentSegment || 0,
      percentComplete,
      isCompleted: percentComplete >= 99,
      timeSpentSeconds: timeSpentSeconds || 0,
      lastReadAt: new Date(),
    },
    update: {
      currentSegment: currentSegment || 0,
      percentComplete,
      isCompleted: percentComplete >= 99,
      timeSpentSeconds: timeSpentSeconds || 0,
      lastReadAt: new Date(),
    },
  });
  res.json(progress);
});

// GET /library/texts/:id/highlights — get user's highlights for a text
router.get('/texts/:id/highlights', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const highlights = await prisma.highlight.findMany({
    where: { userId: req.user!.id, textId: req.params.id },
    orderBy: { createdAt: 'asc' },
    select: { id: true, segmentId: true, selectedText: true, color: true, note: true, isPublic: true, createdAt: true },
  });
  res.json(highlights);
});

// POST /library/highlights — create a highlight
router.post('/highlights', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { textId, segmentId, selectedText, color, note } = req.body;
  if (!textId || !segmentId || !selectedText) throw new AppError('textId, segmentId, selectedText required', 400);
  const segment = await prisma.librarySegment.findUnique({ where: { id: segmentId }, select: { id: true, textId: true } });
  if (!segment || segment.textId !== textId) throw new AppError('Segment not found in text', 404);
  const highlight = await prisma.highlight.create({
    data: {
      userId: req.user!.id,
      textId,
      segmentId,
      selectedText: selectedText.slice(0, 2000),
      color: color || '#FEF08A',
      note: note ? note.slice(0, 1000) : null,
    },
    select: { id: true, segmentId: true, selectedText: true, color: true, note: true, createdAt: true },
  });
  res.status(201).json(highlight);
});

// PATCH /library/highlights/:id — update note or color
router.patch('/highlights/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { color, note } = req.body;
  const hl = await prisma.highlight.findUnique({ where: { id: req.params.id }, select: { userId: true } });
  if (!hl) throw new AppError('Highlight not found', 404);
  if (hl.userId !== req.user!.id) throw new AppError('Not your highlight', 403);
  const updated = await prisma.highlight.update({
    where: { id: req.params.id },
    data: { ...(color ? { color } : {}), ...(note !== undefined ? { note } : {}) },
    select: { id: true, segmentId: true, selectedText: true, color: true, note: true, updatedAt: true },
  });
  res.json(updated);
});

// DELETE /library/highlights/:id
router.delete('/highlights/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const hl = await prisma.highlight.findUnique({ where: { id: req.params.id }, select: { userId: true } });
  if (!hl) throw new AppError('Highlight not found', 404);
  if (hl.userId !== req.user!.id) throw new AppError('Not your highlight', 403);
  await prisma.highlight.delete({ where: { id: req.params.id } });
  res.json({ deleted: true });
});

// GET /library/my-reading — authenticated: texts in progress + completed
router.get('/my-reading', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const progress = await prisma.readingProgress.findMany({
    where: { userId: req.user!.id, percentComplete: { gt: 0 } },
    orderBy: { lastReadAt: 'desc' },
    take: 20,
    include: {
      text: {
        select: {
          id: true, title: true, author: true, language: true, sourceUrl: true, coverUrl: true,
          collection: { select: { name: true, tradition: true, sourceUrl: true } },
        },
      },
    },
  });
  res.json(progress.map(p => ({
    ...p.text,
    progress: {
      currentSegment: p.currentSegment,
      percentComplete: Number(p.percentComplete),
      isCompleted: p.isCompleted,
      lastReadAt: p.lastReadAt,
    },
  })));
});

// GET /library/my-bookmarks — authenticated
router.get('/my-bookmarks', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const bookmarks = await prisma.bookmark.findMany({
    where: { userId: req.user!.id },
    include: {
      text: {
        select: {
          id: true, title: true, author: true, language: true, sourceUrl: true, coverUrl: true,
          collection: { select: { name: true, tradition: true, sourceUrl: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 30,
  });
  res.json(bookmarks.map((b: any) => b.text));
});

// POST /library/submissions — authenticated user publishes an article or short book
router.post('/submissions', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { title, body, category } = req.body;
  if (!title || typeof title !== 'string' || title.trim().length < 3)
    throw new AppError('title is required (min 3 chars)', 400);
  if (!body || typeof body !== 'string' || body.trim().length < 50)
    throw new AppError('body is required (min 50 chars)', 400);

  const validCategories = ['ESSAY', 'ARTICLE', 'STORY', 'POEM', 'SPEECH', 'OTHER'];
  const cat = (typeof category === 'string' && validCategories.includes(category.toUpperCase()))
    ? category.toUpperCase() : 'ARTICLE';

  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { displayName: true, email: true },
  });
  const authorName = user?.displayName || user?.email?.split('@')[0] || 'Anonymous';

  // Auto-create the community writings collection (idempotent)
  const collection = await prisma.libraryCollection.upsert({
    where:  { slug: 'community-writings' },
    create: {
      slug:        'community-writings',
      name:        'Community Writings',
      tradition:   'MULTIPLE',
      description: 'Articles, essays, speeches and reflections submitted by Sangham members.',
      sourceUrl:   '',
      licence:     'CC_BY',
    },
    update: {},
  });

  const text = await prisma.libraryText.create({
    data: {
      collectionId: collection.id,
      externalId:   null,
      title:        title.trim(),
      author:       authorName,
      language:     'en',
      licence:      'CC_BY',
      sourceUrl:    '',
      attribution:  `${authorName} · Submitted via Sangham · CC BY`,
      isSearchable: true,
    },
  });

  // Split body into paragraphs and store as segments
  const paragraphs = body
    .split(/\n{2,}/)
    .map((p: string) => p.replace(/[ \t]+/g, ' ').trim())
    .filter((p: string) => p.length > 0);

  if (paragraphs.length > 0) {
    await prisma.librarySegment.createMany({
      data: paragraphs.map((content: string, i: number) => ({
        textId:     text.id,
        segmentKey: `p${i}`,
        content,
        sequence:   i,
        chapterRef: i === 0 ? cat : undefined,
      })),
    });
  }

  res.status(201).json({ id: text.id, title: text.title, author: text.author });
});

// ── Library AI companion ───────────────────────────────────────────────────────

async function callLibraryAI(systemPrompt: string, userContent: string): Promise<string> {
  if (env.GEMINI_API_KEY) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: [{ role: 'user', parts: [{ text: userContent }] }],
            generationConfig: { maxOutputTokens: 512, temperature: 0.7 },
          }),
        },
      );
      if (res.ok) {
        const data = await res.json() as { candidates?: { content: { parts: { text: string }[] } }[] };
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        if (text) return text;
      }
    } catch { /* fall through to Anthropic */ }
  }
  if (!env.ANTHROPIC_API_KEY) throw new AppError('AI companion temporarily unavailable', 502);
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: systemPrompt,
      messages: [{ role: 'user', content: userContent }],
    }),
  });
  if (!res.ok) throw new AppError('AI companion temporarily unavailable', 502);
  const data = await res.json() as { content: { text: string }[] };
  return data.content?.[0]?.text ?? '';
}

const ACTION_PROMPTS: Record<string, string> = {
  explain:   'You are a knowledgeable Dharma teacher. Explain the selected passage clearly and concisely in 2-3 paragraphs. Use accessible language.',
  summarize: 'You are a Dharma scholar. Summarize the key teaching in 3-5 bullet points. Be concise and precise.',
  example:   'You are a practical Dharma teacher. Provide 1-2 concrete modern-day examples of how this teaching applies to everyday life.',
  context:   'You are a Buddhist/Dharmic historian. Explain the historical and traditional context of this passage in 2-3 paragraphs.',
};

// POST /library/texts/:id/ai
router.post('/texts/:id/ai', authenticate, aiTutorLimiter, async (req: AuthRequest, res: Response): Promise<void> => {
  const { action, passage } = req.body;
  if (!action || typeof action !== 'string') throw new AppError('action is required', 400);

  const systemPrompt = ACTION_PROMPTS[action] ?? ACTION_PROMPTS.explain;

  const text = await prisma.libraryText.findUnique({
    where: { id: req.params.id },
    select: {
      title: true,
      author: true,
      collection: { select: { name: true, tradition: true } },
      segments: { select: { content: true }, take: 5, orderBy: { sequence: 'asc' } },
    },
  });
  if (!text) throw new AppError('Text not found', 404);

  const contextLines = [
    `Text: "${text.title}"${text.author ? ` by ${text.author}` : ''}`,
    text.collection?.name ? `Collection: ${text.collection.name}` : '',
    passage ? `\nSelected passage:\n"${passage}"` : `\nOpening passage:\n"${text.segments.map((s: { content: string }) => s.content).join(' ').slice(0, 600)}"`,
  ].filter(Boolean).join('\n');

  const result = await callLibraryAI(systemPrompt, contextLines);
  res.json({ result });
});

// POST /library/index — admin: index all library texts into Elasticsearch
// No-op (200) when ELASTICSEARCH_URL is not configured.
router.post('/index', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  if (req.user!.role !== UserRole.SUPER_ADMIN) throw new AppError('Admin only', 403);

  const esClient = getEsClient();
  if (!esClient) {
    res.json({ message: 'Elasticsearch not configured — ELASTICSEARCH_URL not set', indexed: 0 });
    return;
  }

  // Ensure index exists with mapping
  const exists = await esClient.indices.exists({ index: ES_INDEX });
  if (!exists) {
    await esClient.indices.create({
      index: ES_INDEX,
      mappings: {
        properties: {
          title:     { type: 'text', analyzer: 'standard' },
          author:    { type: 'text', analyzer: 'standard' },
          content:   { type: 'text', analyzer: 'standard' },
          tradition: { type: 'keyword' },
          language:  { type: 'keyword' },
        },
      },
    });
  }

  const BATCH = 100;
  let offset = 0;
  let indexed = 0;

  for (;;) {
    const texts = await prisma.libraryText.findMany({
      where: { isSearchable: true },
      take: BATCH,
      skip: offset,
      select: {
        id: true, title: true, author: true, language: true,
        segments: { select: { content: true }, take: 200, orderBy: { sequence: 'asc' } },
        collection: { select: { tradition: true } },
      },
    });
    if (texts.length === 0) break;

    await indexLibraryTexts(texts.map(t => ({
      id: t.id,
      title: t.title,
      author: t.author,
      language: t.language,
      tradition: t.collection?.tradition ?? null,
      content: t.segments.map((s: { content: string }) => s.content).join('\n'),
    })));

    indexed += texts.length;
    offset  += texts.length;
    if (texts.length < BATCH) break;
  }

  res.json({ message: `Indexed ${indexed} texts into ${ES_INDEX}`, indexed });
});

export default router;
