import { Router, Response } from 'express';
import { prisma } from '../config/database';
import { authenticate, AuthRequest, requireTrustedOrAbove } from '../middleware/auth';
import { parsePagination, paginatedResponse } from '../utils/pagination';
import { AppError } from '../middleware/errorHandler';
import { EventType, RsvpStatus, Tradition } from '@prisma/client';
import { z } from 'zod';

const router = Router();

const createEventSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(3000).optional(),
  eventType: z.nativeEnum(EventType),
  traditionTag: z.nativeEnum(Tradition).optional(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime().optional(),
  timezone: z.string(),
  locationName: z.string().optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  onlineUrl: z.string().url().optional(),
  capacity: z.number().int().min(0).default(0),
  associationId: z.string().uuid().optional(),
  isRecurring: z.boolean().default(false),
  recurrenceRule: z.string().optional(),
});

// POST /events
router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  if (!requireTrustedOrAbove.includes(req.user!.role)) throw new AppError('Trusted member or above required', 403);
  const parsed = createEventSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }

  const event = await prisma.event.create({
    data: {
      ...parsed.data,
      startsAt: new Date(parsed.data.startsAt),
      endsAt: parsed.data.endsAt ? new Date(parsed.data.endsAt) : undefined,
      organiserId: req.user!.id,
    },
    include: { organiser: { select: { id: true, displayName: true } } },
  });
  res.status(201).json(event);
});

// GET /events/nearby?lat=&lng=&radius_km=&tradition=&type=
router.get('/nearby', async (req: AuthRequest, res: Response): Promise<void> => {
  const { lat, lng, radius_km = '50', tradition, type } = req.query;
  if (!lat || !lng) throw new AppError('lat and lng are required', 400);

  const latN = parseFloat(lat as string);
  const lngN = parseFloat(lng as string);
  const radiusKm = parseFloat(radius_km as string);

  // Haversine approximation using bounding box
  const latDelta = radiusKm / 111;
  const lngDelta = radiusKm / (111 * Math.cos((latN * Math.PI) / 180));

  const where: Record<string, unknown> = {
    isPublished: true,
    startsAt: { gte: new Date() },
    lat: { gte: latN - latDelta, lte: latN + latDelta },
    lng: { gte: lngN - lngDelta, lte: lngN + lngDelta },
  };
  if (tradition) where.traditionTag = tradition;
  if (type) where.eventType = type;

  const events = await prisma.event.findMany({
    where, orderBy: { startsAt: 'asc' }, take: 50,
    include: {
      organiser: { select: { id: true, displayName: true, profilePhoto: true } },
      _count: { select: { rsvps: true } },
    },
  });
  res.json(events);
});

// GET /events — general listing
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { tradition, type, q, mode } = req.query;
  const { limit, skip } = parsePagination(req.query as Record<string, unknown>);
  const where: Record<string, unknown> = { isPublished: true, startsAt: { gte: new Date() } };
  if (tradition) where.traditionTag = tradition;
  if (type) where.eventType = type;
  if (q) where.title = { contains: q as string, mode: 'insensitive' };
  if (mode === 'online')  { where.onlineUrl = { not: null }; where.locationName = null; }
  if (mode === 'offline') { where.locationName = { not: null }; where.onlineUrl = null; }
  if (mode === 'hybrid')  { where.onlineUrl = { not: null }; where.locationName = { not: null }; }
  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where, orderBy: { startsAt: 'asc' }, take: limit, skip,
      include: {
        organiser: { select: { id: true, displayName: true } },
        association: { select: { id: true, name: true } },
        _count: { select: { rsvps: true } },
      },
    }),
    prisma.event.count({ where }),
  ]);
  const params = parsePagination(req.query as Record<string, unknown>);
  res.json(paginatedResponse(events, total, params));
});

// GET /events/:id — full detail
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const event = await prisma.event.findUnique({
    where: { id: req.params.id },
    include: {
      organiser: { select: { id: true, displayName: true, profilePhoto: true, role: true, isVerifiedClergy: true, isVerifiedTeacher: true } },
      association: { select: { id: true, name: true } },
      _count: { select: { rsvps: true } },
    },
  });
  if (!event) throw new AppError('Event not found', 404);
  res.json(event);
});

// POST /events/:id/rsvp
router.post('/:id/rsvp', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { status } = req.body;
  if (!Object.values(RsvpStatus).includes(status)) throw new AppError('Invalid RSVP status', 400);

  const event = await prisma.event.findUnique({ where: { id: req.params.id } });
  if (!event) throw new AppError('Event not found', 404);

  // Check capacity
  if (event.capacity > 0 && status === RsvpStatus.GOING) {
    const goingCount = await prisma.eventRsvp.count({ where: { eventId: req.params.id, status: RsvpStatus.GOING } });
    if (goingCount >= event.capacity) throw new AppError('Event is at capacity', 409);
  }

  const rsvp = await prisma.eventRsvp.upsert({
    where: { eventId_userId: { eventId: req.params.id, userId: req.user!.id } },
    create: { eventId: req.params.id, userId: req.user!.id, status },
    update: { status },
  });
  res.json(rsvp);
});

export default router;
