/**
 * People Discovery — Priority 1 + 5 + 6
 * Privacy-first: never exposes exact location.
 * All distance shown as approximate range only.
 */
import { Router, Response } from 'express';
import { prisma } from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { parsePagination, paginatedResponse } from '../utils/pagination';
import { Tradition, ProfessionalTag, IntentCategory } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// ── Safe public profile projection (never exposes exact location) ──────
const safeUserSelect = {
  id: true,
  displayName: true,
  profilePhoto: true,
  bio: true,
  country: true,
  city: true,
  traditions: true,
  role: true,
  isVerifiedClergy: true,
  isVerifiedTeacher: true,
  isContributor: true,
  languages: true,
  tags: { select: { tag: true } },
  contributionScore: { select: { totalScore: true, eventsHosted: true, sessionsHosted: true } },
  _count: { select: { followers: true, posts: true } },
  // NOTE: location.gridLat/gridLng is NEVER returned to client
  location: { select: { city: true, state: true, country: true, visibility: true } },
};

// ── Distance label (approximate only — never exact km) ─────────────────
function approxDistanceLabel(userGridLat: number, userGridLng: number,
  targetGridLat: number, targetGridLng: number): string {
  const latDiff = Math.abs(userGridLat - targetGridLat);
  const lngDiff = Math.abs(userGridLng - targetGridLng);
  const approxKm = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111;
  if (approxKm <= 2)  return 'Within 2 km';
  if (approxKm <= 5)  return 'Within 5 km';
  if (approxKm <= 10) return 'Within 10 km';
  if (approxKm <= 30) return 'Same city area';
  return 'Same city';
}

/**
 * GET /discover/people
 * Multi-filter people discovery.
 * Query params: tradition, tag, language, role, city, state, country, q (name search)
 */
router.get('/people', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { tradition, tag, language, role, city, state, country, q, isVerifiedTeacher, seekingIntent } = req.query;
  const { limit, skip } = parsePagination(req.query as Record<string, unknown>);

  // Only surface users who opted into discovery.
  // Users with no privacySettings row (registered before the fix) default to discoverable.
  const where: Record<string, unknown> = {
    isActive: true,
    id: { not: req.user!.id },
    OR: [
      { privacySettings: { is: null } },
      { privacySettings: { is: { showInDiscovery: true, profileVisibility: { in: ['PUBLIC', 'COMMUNITY'] } } } },
    ],
  };

  if (tradition)         where.traditions        = { has: tradition as Tradition };
  if (language)          where.languages         = { has: language as string };
  if (role)              where.role              = role;
  if (q)                 where.displayName       = { contains: q as string, mode: 'insensitive' };
  if (isVerifiedTeacher) where.isVerifiedTeacher  = true;
  if (seekingIntent)     where.intents           = { some: { category: seekingIntent as IntentCategory, status: 'OPEN' } };
  if (city)       where.location   = { ...(where.location as object || {}), city: { contains: city as string, mode: 'insensitive' } };
  if (state)      where.location   = { ...(where.location as object || {}), state: { contains: state as string, mode: 'insensitive' } };
  if (country)    where.location   = { ...(where.location as object || {}), country };
  if (tag)        where.tags       = { some: { tag: tag as ProfessionalTag } };

  const [users, total] = await Promise.all([
    prisma.user.findMany({ where, take: limit, skip, select: safeUserSelect,
      orderBy: [{ updatedAt: 'desc' }] }),
    prisma.user.count({ where }),
  ]);

  const params = parsePagination(req.query as Record<string, unknown>);
  res.json(paginatedResponse(users, total, params));
});

/**
 * GET /discover/nearby
 * Find practitioners near a grid cell.
 * Client sends snapped grid coords (1km precision) — never exact GPS.
 * Response returns ONLY approximate distance labels.
 */
router.get('/nearby', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { gridLat, gridLng, tradition, tag } = req.query;
  if (!gridLat || !gridLng) throw new AppError('gridLat and gridLng required (1km snapped)', 400);

  const lat = parseFloat(gridLat as string);
  const lng = parseFloat(gridLng as string);
  // Search within ±0.1 degree (~11km)
  const delta = 0.1;

  const where: Record<string, unknown> = {
    isActive: true,
    id: { not: req.user!.id },
    OR: [
      { privacySettings: { is: null } },
      { privacySettings: { is: { showInDiscovery: true } } },
    ],
    location: {
      is: {
        visibility: { in: ['APPROXIMATE', 'CITY_ONLY'] },
        gridLat: { gte: lat - delta, lte: lat + delta },
        gridLng: { gte: lng - delta, lte: lng + delta },
      }
    }
  };
  if (tradition) where.traditions = { has: tradition as Tradition };
  if (tag)       where.tags       = { some: { tag: tag as ProfessionalTag } };

  const users = await prisma.user.findMany({
    where, take: 30,
    select: { ...safeUserSelect },
    orderBy: [{ updatedAt: 'desc' }],
  });

  // Attach approximate distance — NEVER exact
  const withDistance = users.map(u => ({
    ...u,
    approximateDistance: u.location?.visibility === 'APPROXIMATE' && (u.location as any)?.gridLat
      ? approxDistanceLabel(lat, lng, parseFloat((u.location as any).gridLat), parseFloat((u.location as any).gridLng))
      : 'Same city',
    location: {  // strip grid coords from response
      city: u.location?.city,
      state: u.location?.state,
      country: u.location?.country,
    },
  }));

  res.json({ data: withDistance, total: withDistance.length });
});

/**
 * GET /discover/recommended
 * Suggested connections based on: shared traditions, shared tags,
 * same city, mutual follows, active contributors.
 */
router.get('/recommended', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const me = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { traditions: true, languages: true, tags: { select: { tag: true } }, location: { select: { city: true, country: true } } },
  });
  if (!me) throw new AppError('User not found', 404);

  const myTags = me.tags.map(t => t.tag);
  const myTraditions = me.traditions;

  const alreadyFollowing = await prisma.follow.findMany({
    where: { followerId: req.user!.id }, select: { followedId: true }
  });
  const excludeIds = [req.user!.id, ...alreadyFollowing.map(f => f.followedId)];

  const candidates = await prisma.user.findMany({
    where: {
      id: { notIn: excludeIds },
      isActive: true,
      AND: [
        {
          OR: [
            { privacySettings: { is: null } },
            { privacySettings: { is: { showInDiscovery: true } } },
          ],
        },
        {
          OR: [
            { traditions: { hasSome: myTraditions } },
            { tags: { some: { tag: { in: myTags } } } },
            { location: { is: { city: me.location?.city || '' } } },
            { languages: { hasSome: me.languages } },
          ],
        },
      ],
    },
    take: 20,
    select: safeUserSelect,
    orderBy: [{ updatedAt: 'desc' }],
  });

  res.json({ data: candidates });
});

/**
 * GET /discover/categories
 * Returns preset discovery categories for home screen cards.
 */
router.get('/categories', authenticate, async (_req: AuthRequest, res: Response): Promise<void> => {
  res.json([
    { key: 'bhikkhus',        label: 'Bhikkhus & Teachers', filter: { role: 'BHIKKHU' } },
    { key: 'meditation',      label: 'Meditation Partners',  filter: { tag: 'MEDITATOR' } },
    { key: 'volunteers',      label: 'Volunteers',           filter: { tag: 'VOLUNTEER' } },
    { key: 'translators',     label: 'Translators',          filter: { tag: 'TRANSLATOR' } },
    { key: 'founders',        label: 'Buddhist Founders',    filter: { tag: 'FOUNDER' } },
    { key: 'students',        label: 'Students',             filter: { tag: 'STUDENT' } },
    { key: 'researchers',     label: 'Researchers',          filter: { tag: 'RESEARCHER' } },
    { key: 'navayana',        label: 'Navayana Practitioners', filter: { tradition: 'NAVAYANA' } },
    { key: 'nearby',          label: 'Buddhists Near Me',    filter: { type: 'nearby' } },
  ]);
});

export default router;
