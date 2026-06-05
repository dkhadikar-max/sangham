/**
 * Intent-Based Networking — Priority 2
 * Intents are the core mechanism for expressing what you're looking for.
 */
import { Router, Response } from 'express';
import { prisma } from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { parsePagination, paginatedResponse } from '../utils/pagination';
import { AppError } from '../middleware/errorHandler';
import { IntentCategory, IntentStatus, IntentScope, VisibilityLevel } from '@prisma/client';
import { z } from 'zod';

const router = Router();

const createIntentSchema = z.object({
  title:       z.string().min(3).max(120),
  category:    z.nativeEnum(IntentCategory),
  description: z.string().max(500).optional(),
  scope:       z.nativeEnum(IntentScope).default(IntentScope.CITY),
  visibility:  z.nativeEnum(VisibilityLevel).default(VisibilityLevel.COMMUNITY),
  expiresAt:   z.string().datetime().optional(),
});

// POST /intents — create an intent
router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = createIntentSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }

  // Max 3 open intents per user
  const openCount = await prisma.intent.count({
    where: { userId: req.user!.id, status: IntentStatus.OPEN }
  });
  if (openCount >= 3) throw new AppError('Maximum 3 open intents allowed at a time', 400);

  const intent = await prisma.intent.create({
    data: {
      ...parsed.data,
      userId: req.user!.id,
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : undefined,
    },
    include: { user: { select: { id: true, displayName: true, profilePhoto: true, isVerifiedClergy: true } } },
  });
  res.status(201).json(intent);
});

// GET /intents — browse open intents (filtered)
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { category, scope, city, state, country } = req.query;
  const { limit, skip } = parsePagination(req.query as Record<string, unknown>);

  const where: Record<string, unknown> = {
    status: IntentStatus.OPEN,
    visibility: { in: [VisibilityLevel.PUBLIC, VisibilityLevel.COMMUNITY] },
    OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
  };
  if (category) where.category = category;
  if (scope)    where.scope    = scope;

  const [intents, total] = await Promise.all([
    prisma.intent.findMany({
      where, take: limit, skip,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, displayName: true, profilePhoto: true, traditions: true, role: true,
          isVerifiedClergy: true, isVerifiedTeacher: true,
          location: { select: { city: true, state: true, country: true } } } },
        _count: { select: { responses: true } },
      },
    }),
    prisma.intent.count({ where }),
  ]);
  const params = parsePagination(req.query as Record<string, unknown>);
  res.json(paginatedResponse(intents, total, params));
});

// GET /intents/mine — own intents
router.get('/mine', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const intents = await prisma.intent.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { responses: true } } },
  });
  res.json(intents);
});

// GET /intents/:id
router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const intent = await prisma.intent.findUnique({
    where: { id: req.params.id },
    include: {
      user: { select: { id: true, displayName: true, profilePhoto: true, traditions: true, role: true,
        isVerifiedClergy: true, isVerifiedTeacher: true } },
      responses: {
        take: 10,
        include: { user: { select: { id: true, displayName: true, profilePhoto: true } } },
      },
    },
  });
  if (!intent) throw new AppError('Intent not found', 404);
  res.json(intent);
});

// POST /intents/:id/respond — respond to an intent
router.post('/:id/respond', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const intent = await prisma.intent.findUnique({ where: { id: req.params.id } });
  if (!intent) throw new AppError('Intent not found', 404);
  if (intent.userId === req.user!.id) throw new AppError('Cannot respond to your own intent', 400);
  if (intent.status !== IntentStatus.OPEN) throw new AppError('This intent is no longer open', 400);

  const response = await prisma.intentResponse.upsert({
    where: { intentId_userId: { intentId: req.params.id, userId: req.user!.id } },
    create: { intentId: req.params.id, userId: req.user!.id, message: req.body.message },
    update: { message: req.body.message },
  });

  // Auto-send a DM thread starter (ciphertext = system placeholder)
  await prisma.message.create({
    data: {
      senderId: req.user!.id,
      recipientId: intent.userId,
      ciphertext: `[Intent response: "${intent.title}"] ${req.body.message || ''}`.trim(),
    },
  });

  res.status(201).json(response);
});

// PATCH /intents/:id — update status (own intents only)
router.patch('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const intent = await prisma.intent.findUnique({ where: { id: req.params.id } });
  if (!intent) throw new AppError('Intent not found', 404);
  if (intent.userId !== req.user!.id) throw new AppError('Forbidden', 403);

  const { status, title, description } = req.body;
  const updated = await prisma.intent.update({
    where: { id: req.params.id },
    data: { ...(status && { status }), ...(title && { title }), ...(description && { description }) },
  });
  res.json(updated);
});

// DELETE /intents/:id — close/remove own intent
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const intent = await prisma.intent.findUnique({ where: { id: req.params.id } });
  if (!intent) throw new AppError('Intent not found', 404);
  if (intent.userId !== req.user!.id) throw new AppError('Forbidden', 403);
  await prisma.intent.update({ where: { id: req.params.id }, data: { status: IntentStatus.CLOSED } });
  res.json({ message: 'Intent closed' });
});

export default router;
