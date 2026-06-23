import { Router, Response } from 'express';
import { prisma } from '../config/database';
import { authenticate, AuthRequest, requireTrustedOrAbove } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { SessionType, Tradition, SessionStatus, UserRole } from '@prisma/client';
import { generateAgoraChannelName, getAgoraConfig, generateRtcToken, isAgoraConfigured } from '../utils/agora';
import { z } from 'zod';

const router = Router();

const createSessionSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(2000).optional(),
  sessionType: z.nativeEnum(SessionType),
  traditionTag: z.nativeEnum(Tradition).optional(),
  language: z.string().default('en'),
  scheduledAt: z.string().datetime(),
  maxViewers: z.number().int().min(0).default(0),
  rsvpRequired: z.boolean().default(false),
});

// POST /sessions
router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  if (!isAgoraConfigured()) throw new AppError('Live sessions are not yet available on this instance', 503);
  if (!requireTrustedOrAbove.includes(req.user!.role)) throw new AppError('Trusted member or above required', 403);
  const parsed = createSessionSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }

  const session = await prisma.liveSession.create({
    data: {
      ...parsed.data,
      scheduledAt: new Date(parsed.data.scheduledAt),
      hostId: req.user!.id,
      agoraChannel: generateAgoraChannelName(),
    },
    include: { host: { select: { id: true, displayName: true, isVerifiedClergy: true } } },
  });
  res.status(201).json(session);
});

// GET /sessions — list upcoming
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { tradition, type } = req.query;
  const where: Record<string, unknown> = { status: { in: [SessionStatus.SCHEDULED, SessionStatus.LIVE] }, scheduledAt: { gte: new Date() } };
  if (tradition) where.traditionTag = tradition;
  if (type) where.sessionType = type;
  const sessions = await prisma.liveSession.findMany({
    where, orderBy: { scheduledAt: 'asc' }, take: 30,
    include: { host: { select: { id: true, displayName: true, profilePhoto: true, isVerifiedClergy: true } }, _count: { select: { attendees: true } } },
  });
  res.json(sessions);
});

// GET /sessions/:id
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const session = await prisma.liveSession.findUnique({
    where: { id: req.params.id },
    include: {
      host: { select: { id: true, displayName: true, profilePhoto: true, isVerifiedClergy: true } },
      _count: { select: { attendees: true } },
    },
  });
  if (!session) throw new AppError('Session not found', 404);
  res.json(session);
});

// POST /sessions/:id/start  (host only)
router.post('/:id/start', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const session = await prisma.liveSession.findUnique({ where: { id: req.params.id } });
  if (!session) throw new AppError('Session not found', 404);
  if (session.hostId !== req.user!.id) throw new AppError('Only the host can start this session', 403);
  if (session.status !== SessionStatus.SCHEDULED) throw new AppError('Session cannot be started', 400);

  const updated = await prisma.liveSession.update({
    where: { id: req.params.id },
    data: { status: SessionStatus.LIVE, startedAt: new Date() },
  });
  const agoraConfig = getAgoraConfig();
  const token = generateRtcToken(session.agoraChannel, 0, 'host');
  res.json({ session: updated, agora: { appId: agoraConfig.appId, channel: session.agoraChannel, role: 'host', token } });
});

// POST /sessions/:id/join  (viewer)
router.post('/:id/join', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const session = await prisma.liveSession.findUnique({ where: { id: req.params.id } });
  if (!session) throw new AppError('Session not found', 404);
  if (session.status === SessionStatus.CANCELLED) throw new AppError('Session was cancelled', 400);

  await prisma.sessionAttendee.upsert({
    where: { sessionId_userId: { sessionId: req.params.id, userId: req.user!.id } },
    create: { sessionId: req.params.id, userId: req.user!.id },
    update: { joinedAt: new Date(), leftAt: null },
  });
  const agoraConfig = getAgoraConfig();
  const token = generateRtcToken(session.agoraChannel, 0, 'audience');
  res.json({ agora: { appId: agoraConfig.appId, channel: session.agoraChannel, role: 'audience', token } });
});

// POST /sessions/:id/end  (host only)
router.post('/:id/end', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const session = await prisma.liveSession.findUnique({ where: { id: req.params.id } });
  if (!session) throw new AppError('Session not found', 404);
  if (session.hostId !== req.user!.id) throw new AppError('Only the host can end this session', 403);

  await prisma.liveSession.update({
    where: { id: req.params.id },
    data: { status: SessionStatus.ENDED, endedAt: new Date() },
  });
  res.json({ message: 'Session ended. Recording will be available within 30 minutes.' });
});

// GET /sessions/:id/recording
router.get('/:id/recording', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const session = await prisma.liveSession.findUnique({ where: { id: req.params.id }, select: { recordingUrl: true, status: true } });
  if (!session) throw new AppError('Session not found', 404);
  if (!session.recordingUrl) { res.status(202).json({ message: 'Recording not yet available' }); return; }
  res.json({ recordingUrl: session.recordingUrl });
});

export default router;
