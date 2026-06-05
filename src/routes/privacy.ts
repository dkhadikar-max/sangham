/**
 * Privacy Settings — Priority 3
 * Users control exactly what others can see about them.
 */
import { Router, Response } from 'express';
import { prisma } from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { VisibilityLevel, MessagingPermission, LocationVisibility, ProfessionalTag } from '@prisma/client';
import { z } from 'zod';

const router = Router();

const privacySchema = z.object({
  profileVisibility:   z.nativeEnum(VisibilityLevel).optional(),
  messagingPermission: z.nativeEnum(MessagingPermission).optional(),
  locationVisibility:  z.nativeEnum(LocationVisibility).optional(),
  activityVisibility:  z.nativeEnum(VisibilityLevel).optional(),
  showInDiscovery:     z.boolean().optional(),
  anonymousBrowsing:   z.boolean().optional(),
});

const locationSchema = z.object({
  country:    z.string().length(2).optional(),
  state:      z.string().max(100).optional(),
  city:       z.string().max(100).optional(),
  area:       z.string().max(100).optional(),
  // gridLat/gridLng: client snaps GPS to 0.1-degree grid before sending
  gridLat:    z.number().optional(),
  gridLng:    z.number().optional(),
  visibility: z.nativeEnum(LocationVisibility).default(LocationVisibility.CITY_ONLY),
});

// GET /privacy — get own privacy settings
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const settings = await prisma.privacySettings.findUnique({ where: { userId: req.user!.id } });
  res.json(settings || { userId: req.user!.id, defaults: true });
});

// PUT /privacy — update privacy settings
router.put('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = privacySchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }

  const settings = await prisma.privacySettings.upsert({
    where: { userId: req.user!.id },
    create: { userId: req.user!.id, ...parsed.data },
    update: parsed.data,
  });
  res.json(settings);
});

// PUT /privacy/location — update fuzzy location
router.put('/location', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = locationSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }

  // Snap to 0.1-degree grid (≈11km precision) — never store exact
  const snappedLat = parsed.data.gridLat ? Math.round(parsed.data.gridLat * 10) / 10 : undefined;
  const snappedLng = parsed.data.gridLng ? Math.round(parsed.data.gridLng * 10) / 10 : undefined;

  const location = await prisma.userLocation.upsert({
    where: { userId: req.user!.id },
    create: {
      userId: req.user!.id,
      country: parsed.data.country,
      state: parsed.data.state,
      city: parsed.data.city,
      area: parsed.data.area,
      gridLat: snappedLat,
      gridLng: snappedLng,
      visibility: parsed.data.visibility,
    },
    update: {
      country: parsed.data.country,
      state: parsed.data.state,
      city: parsed.data.city,
      area: parsed.data.area,
      gridLat: snappedLat,
      gridLng: snappedLng,
      visibility: parsed.data.visibility,
    },
    select: { city: true, state: true, country: true, visibility: true },
    // NOTE: gridLat/gridLng deliberately excluded from response
  });
  res.json(location);
});

// DELETE /privacy/location — remove location entirely
router.delete('/location', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  await prisma.userLocation.deleteMany({ where: { userId: req.user!.id } });
  res.json({ message: 'Location removed' });
});

// PUT /privacy/tags — update professional/interest tags
router.put('/tags', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { tags } = req.body;
  if (!Array.isArray(tags)) { res.status(400).json({ error: 'tags must be an array' }); return; }
  if (tags.length > 5) { res.status(400).json({ error: 'Maximum 5 tags allowed' }); return; }

  const validTags = tags.filter((t: string) => Object.values(ProfessionalTag).includes(t as ProfessionalTag));
  await prisma.userTag.deleteMany({ where: { userId: req.user!.id } });
  if (validTags.length > 0) {
    await prisma.userTag.createMany({
      data: validTags.map((tag: string) => ({ userId: req.user!.id, tag: tag as ProfessionalTag })),
    });
  }
  res.json({ tags: validTags });
});

export default router;
