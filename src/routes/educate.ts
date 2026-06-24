import { Router, Response } from 'express';
import { prisma } from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { env } from '../config/env';
import { aiTutorLimiter } from '../middleware/rateLimiter';

const router = Router();

function isAIConfigured(): boolean {
  return Boolean(env.GEMINI_API_KEY || env.ANTHROPIC_API_KEY);
}

// ── AI provider ───────────────────────────────────────────────────────────────

async function callAI(systemPrompt: string, userContent: string): Promise<string> {
  // Primary: Gemini 2.0 Flash — free tier (1,500 req/day, 1M tokens/day)
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

  // Fallback: Anthropic Haiku with prompt caching
  if (!env.ANTHROPIC_API_KEY) throw new AppError('AI Tutor temporarily unavailable', 502);

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'prompt-caching-2024-07-31',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: userContent }],
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error('[AI Tutor] Anthropic error:', err);
    throw new AppError('AI Tutor temporarily unavailable', 502);
  }
  const data = await res.json() as { content: { text: string }[] };
  return data.content?.[0]?.text ?? '';
}

// ── Response cache (in-memory, resets on deploy, warms in ~1 week) ────────────

const _aiCache = new Map<string, { r: string; t: number }>();
const AI_CACHE_TTL = 24 * 3_600_000; // 24 h

function _getCached(key: string): string | null {
  const e = _aiCache.get(key);
  if (!e) return null;
  if (Date.now() - e.t > AI_CACHE_TTL) { _aiCache.delete(key); return null; }
  return e.r;
}
function _setCached(key: string, r: string): void {
  if (_aiCache.size > 2000) _aiCache.clear(); // safety cap
  _aiCache.set(key, { r, t: Date.now() });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function computeRepLevel(totalLessons: number, totalPaths: number): string {
  if (totalPaths >= 3 && totalLessons >= 40) return 'MENTOR';
  if (totalPaths >= 2 && totalLessons >= 20) return 'CONTRIBUTOR';
  if (totalLessons >= 10) return 'PRACTITIONER';
  if (totalLessons >= 3)  return 'LEARNER';
  return 'EXPLORER';
}

async function refreshReputation(userId: string) {
  const totalLessons = await prisma.educateLessonProgress.count({
    where: { enrollment: { userId } },
  });
  const totalPaths = await prisma.educateEnrollment.count({
    where: { userId, percentComplete: { gte: 100 } },
  });
  const totalExercises = await prisma.educateLessonProgress.count({
    where: { enrollment: { userId }, exerciseDone: true },
  });
  const level = computeRepLevel(totalLessons, totalPaths) as 'EXPLORER' | 'LEARNER' | 'PRACTITIONER' | 'CONTRIBUTOR' | 'MENTOR';

  await prisma.educateUserReputation.upsert({
    where: { userId },
    create: { userId, level, totalLessons, totalPaths, totalExercises },
    update: { level, totalLessons, totalPaths, totalExercises },
  });
}

// ── Routes ────────────────────────────────────────────────────────────────────

// GET /educate/paths — all active paths
router.get('/paths', async (_req: AuthRequest, res: Response): Promise<void> => {
  const paths = await prisma.educatePath.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, slug: true, domain: true, title: true, tagline: true, description: true, circleTag: true, sortOrder: true, phases: true },
  });
  res.json(paths);
});

// GET /educate/paths/:slug — single path detail
router.get('/paths/:slug', async (req: AuthRequest, res: Response): Promise<void> => {
  const path = await prisma.educatePath.findUnique({
    where: { slug: req.params.slug },
  });
  if (!path) throw new AppError('Path not found', 404);

  let enrollment = null;
  if (req.headers.authorization) {
    try {
      const { authenticate: auth } = await import('../middleware/auth');
      // try to get userId from token without hard-requiring auth
      const jwt = await import('jsonwebtoken');
      const token = req.headers.authorization.split(' ')[1];
      const payload = jwt.default.verify(token, env.JWT_SECRET) as { userId: string };
      enrollment = await prisma.educateEnrollment.findUnique({
        where: { userId_pathId: { userId: payload.userId, pathId: path.id } },
        include: { lessonProgress: true },
      });
    } catch { /* unauthenticated — return path without enrollment */ }
  }

  res.json({ path, enrollment });
});

// GET /educate/my-paths — authenticated: user's active enrollments
router.get('/my-paths', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const enrollments = await prisma.educateEnrollment.findMany({
    where: { userId: req.user!.id },
    orderBy: { lastActivityAt: 'desc' },
    include: {
      path: { select: { slug: true, title: true, tagline: true, domain: true, phases: true } },
      lessonProgress: true,
    },
  });
  res.json(enrollments);
});

// POST /educate/paths/:slug/enroll — enroll the authenticated user in a path
router.post('/paths/:slug/enroll', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const path = await prisma.educatePath.findUnique({ where: { slug: req.params.slug } });
  if (!path) throw new AppError('Path not found', 404);

  const enrollment = await prisma.educateEnrollment.upsert({
    where: { userId_pathId: { userId: req.user!.id, pathId: path.id } },
    create: { userId: req.user!.id, pathId: path.id },
    update: { lastActivityAt: new Date() },
    include: { lessonProgress: true },
  });
  res.status(201).json(enrollment);
});

// POST /educate/enrollments/:id/lesson — mark lesson complete
router.post('/enrollments/:id/lesson', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { lessonKey, exerciseDone } = req.body;
  if (!lessonKey || typeof lessonKey !== 'string') throw new AppError('lessonKey required', 400);

  const enrollment = await prisma.educateEnrollment.findUnique({
    where: { id: req.params.id },
    include: { path: true, lessonProgress: true },
  });
  if (!enrollment) throw new AppError('Enrollment not found', 404);
  if (enrollment.userId !== req.user!.id) throw new AppError('Not your enrollment', 403);

  await prisma.educateLessonProgress.upsert({
    where: { enrollmentId_lessonKey: { enrollmentId: enrollment.id, lessonKey } },
    create: { enrollmentId: enrollment.id, lessonKey, exerciseDone: !!exerciseDone },
    update: { exerciseDone: !!exerciseDone },
  });

  // Recount after upsert to avoid double-counting repeated completions
  const phases = enrollment.path.phases as unknown as { lessons: object[] }[];
  const totalLessons = phases.reduce((sum, p) => sum + p.lessons.length, 0);
  const completedCount = await prisma.educateLessonProgress.count({ where: { enrollmentId: enrollment.id } });
  const percent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  // Identify completed position from lessonKey
  const [phaseStr, lessonStr] = lessonKey.split('.');
  const phaseIdx = parseInt(phaseStr, 10);
  const lessonIdx = parseInt(lessonStr, 10);

  // Advance to next lesson, carrying over to next phase when at the end
  const currentPhaseLen = phases[phaseIdx]?.lessons?.length ?? 0;
  let nextPhase = phaseIdx;
  let nextLesson = lessonIdx + 1;
  if (nextLesson >= currentPhaseLen) {
    nextPhase = phaseIdx + 1;
    nextLesson = 0;
  }

  // Update enrollment progress and streak
  const lastActivity = enrollment.lastActivityAt;
  const today = new Date();
  const daysSinceLast = Math.floor((today.getTime() - lastActivity.getTime()) / 86400000);
  const newStreak = daysSinceLast <= 1 ? enrollment.streak + 1 : 1;

  const updated = await prisma.educateEnrollment.update({
    where: { id: enrollment.id },
    data: {
      currentPhase: nextPhase,
      currentLesson: nextLesson,
      percentComplete: Math.min(percent, 100),
      streak: newStreak,
      lastActivityAt: new Date(),
    },
    include: { lessonProgress: true },
  });

  // Async reputation update (non-blocking)
  refreshReputation(req.user!.id).catch(() => {});

  res.json(updated);
});

// GET /educate/reputation — user's learning reputation
router.get('/reputation', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const rep = await prisma.educateUserReputation.findUnique({
    where: { userId: req.user!.id },
  });
  res.json(rep || { level: 'EXPLORER', totalLessons: 0, totalPaths: 0, totalExercises: 0, longestStreak: 0 });
});

// POST /educate/search — match query to relevant paths
router.get('/search', async (req: AuthRequest, res: Response): Promise<void> => {
  const q = typeof req.query.q === 'string' ? req.query.q.toLowerCase().trim() : '';
  if (!q) { res.json([]); return; }

  const DOMAIN_KEYWORDS: Record<string, string[]> = {
    AI_AUTOMATION:       ['ai', 'artificial intelligence', 'automation', 'prompt', 'chatgpt', 'claude', 'machine learning', 'agent'],
    ENTREPRENEURSHIP:    ['entrepreneur', 'startup', 'business', 'founder', 'venture', 'idea', 'product', 'launch'],
    SALES:               ['sales', 'selling', 'close', 'prospect', 'outreach', 'revenue', 'client', 'crm'],
    LEADERSHIP:          ['leadership', 'leader', 'manage', 'team', 'strategy', 'ceo', 'executive', 'culture'],
    NETWORKING:          ['networking', 'network', 'connection', 'relationship', 'referral', 'community'],
    WEALTH_FUNDAMENTALS: ['wealth', 'money', 'finance', 'invest', 'saving', 'income', 'financial', 'stocks', 'mutual fund'],
    BUDDHISM_MEDITATION: ['buddhism', 'buddhist', 'meditation', 'dharma', 'mindfulness', 'vipassana', 'metta', 'sangha', 'ambedkar'],
  };

  const matches = Object.entries(DOMAIN_KEYWORDS)
    .filter(([, keywords]) => keywords.some(k => q.includes(k)))
    .map(([domain]) => domain);

  const paths = await prisma.educatePath.findMany({
    where: {
      isActive: true,
      ...(matches.length ? { domain: { in: matches as any[] } } : {}),
    },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, slug: true, domain: true, title: true, tagline: true, phases: true },
  });

  // If no domain matched, return all paths
  if (paths.length === 0) {
    const all = await prisma.educatePath.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, slug: true, domain: true, title: true, tagline: true, phases: true },
    });
    res.json(all);
    return;
  }

  res.json(paths);
});

// POST /educate/ai-tutor — context-aware AI lesson assistant
router.post('/ai-tutor', authenticate, aiTutorLimiter, async (req: AuthRequest, res: Response): Promise<void> => {
  if (!isAIConfigured()) throw new AppError('AI Tutor is not yet available on this instance', 503);

  const { action, pathSlug, phaseIndex, lessonIndex, lessonTitle, concepts, userQuestion, completedLessons, percentComplete } = req.body;
  const validActions = ['explain', 'quiz', 'summarize', 'exercise', 'simplify'];
  if (!action || !validActions.includes(action)) throw new AppError(`action must be one of: ${validActions.join(', ')}`, 400);
  if (!pathSlug) throw new AppError('pathSlug required', 400);

  const path = await prisma.educatePath.findUnique({ where: { slug: pathSlug } });
  if (!path) throw new AppError('Path not found', 404);

  const phases = path.phases as unknown as { title: string; lessons: { title: string; overview?: string; concepts: string[]; actionTask: string; reflection: string }[] }[];
  const phase = phases[phaseIndex ?? 0];
  const lesson = phase?.lessons[lessonIndex ?? 0];

  const completedCount = Array.isArray(completedLessons) ? completedLessons.length : 0;
  const pct = typeof percentComplete === 'number' ? Math.round(percentComplete) : 0;

  const systemPrompt = `You are the Sangham Educate AI Tutor — a concise, accurate, and warm learning companion.
You are helping a learner on the "${path.title}" learning path.
Current phase: "${phase?.title ?? 'Introduction'}".
Current lesson: "${lesson?.title ?? lessonTitle ?? 'Introduction'}".
Key concepts in this lesson: ${(lesson?.concepts ?? concepts ?? []).join(', ')}.
Learner progress: ${completedCount} lesson${completedCount !== 1 ? 's' : ''} completed · ${pct}% of this path done.

Rules you must follow without exception:
1. Be concise. Aim for 150-250 words per response.
2. Distinguish facts from interpretation. Use phrases like "Research suggests..." or "Many practitioners find..." when appropriate.
3. If you are uncertain, say so explicitly. Never fabricate statistics, citations, or examples.
4. Stay grounded in this lesson's concepts. Do not invent frameworks not in the lesson.
5. For Buddhist content: identify traditions accurately (Theravada, Mahayana, Vajrayana, Navayana/Ambedkarite).
6. You are a learning companion, not a teacher, guru, or authority. Acknowledge learner autonomy.
7. Acknowledge prior progress when relevant — this learner has already completed ${completedCount} lesson${completedCount !== 1 ? 's' : ''}.`;

  const actionPrompts: Record<string, string> = {
    explain:   `Explain the core idea of this lesson in plain language as if speaking to a smart beginner. Use one concrete, everyday example.`,
    quiz:      `Create 3 short-answer questions that test understanding of this lesson's key concepts. After each question, provide the ideal answer in 1-2 sentences.`,
    summarize: `Summarize this lesson in 5 bullet points. Each bullet should capture one essential insight a learner should remember.`,
    exercise:  `Create one practical exercise the learner can do in the next 24 hours that will directly apply the concepts from this lesson. Be specific about the steps.`,
    simplify:  userQuestion ? `The learner has a question: "${userQuestion}". Answer it simply and clearly, using an analogy if helpful.` : `Explain this lesson's most complex concept using the simplest possible language and a real-world analogy.`,
  };

  const userContent = actionPrompts[action];

  // Static actions are the same for every user on the same lesson — cache them.
  // 'simplify' has the user's own question in it, so it is never cached.
  const isCacheable = action !== 'simplify';
  const cacheKey = `${pathSlug}:${phaseIndex ?? 0}:${lessonIndex ?? 0}:${action}`;
  const cached = isCacheable ? _getCached(cacheKey) : null;

  const text = cached ?? await callAI(systemPrompt, userContent);
  if (isCacheable && !cached) _setCached(cacheKey, text);

  res.json({ action, response: text });
});

export default router;
