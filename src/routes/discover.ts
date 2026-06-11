/**
 * People Discovery — Priority 1 + 5 + 6
 * Privacy-first: never exposes exact location.
 * All distance shown as approximate range only.
 *
 * Ranking weights (spec-mandated, immutable):
 *   Intent Match       30%
 *   Location Match     20%
 *   Language Match     20%
 *   Interest Match     15%  (professional tags)
 *   Tradition Match    10%
 *   Mutual Connections  5%
 *
 * NEVER use as ranking signal:
 *   Popularity · Connection Count · Activity Volume · Contribution Amount · Post Count
 */
import { Router, Response } from 'express';
import { prisma } from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { parsePagination, paginatedResponse } from '../utils/pagination';
import { Tradition, ProfessionalTag, IntentCategory, IntentStatus } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// ── Score pool size ──────────────────────────────────────────────────────────
// We fetch this many candidates, score in-memory, then paginate the sorted result.
const SCORE_POOL = 200;

// ── Safe public profile projection (never exposes exact location) ──────────
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
  tags:    { select: { tag: true } },
  intents: { where: { status: IntentStatus.OPEN }, select: { category: true } },
  _count:  { select: { followers: true, posts: true } },
  location: { select: { city: true, state: true, country: true, visibility: true } },
};

// ── Scoring context ─────────────────────────────────────────────────────────
interface ScoringCtx {
  myIntentCats:  Set<string>;
  myLangs:       Set<string>;
  myCity:        string;
  myCountry:     string;
  myTags:        Set<string>;
  myTraditions:  Set<string>;
  /** candidateId → count of my connections who also follow that candidate */
  mutualCounts:  Record<string, number>;
}

/**
 * Fetches the current user's profile signals and computes mutual-connection
 * counts across the given candidate pool.
 */
async function buildScoringCtx(userId: string, candidateIds: string[]): Promise<ScoringCtx> {
  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      traditions: true,
      languages:  true,
      city:       true,
      country:    true,
      tags:       { select: { tag: true } },
      location:   { select: { city: true, country: true } },
      intents:    { where: { status: IntentStatus.OPEN }, select: { category: true } },
      following:  { select: { followedId: true }, take: 500 },
    },
  });

  const myFollowingIds = (me?.following ?? []).map(f => f.followedId);

  // One batched query: which candidates are followed by any of my connections?
  const mutualRows = myFollowingIds.length > 0 && candidateIds.length > 0
    ? await prisma.follow.findMany({
        where: {
          followerId: { in: myFollowingIds },
          followedId: { in: candidateIds },
        },
        select: { followedId: true },
      })
    : [];

  const mutualCounts: Record<string, number> = {};
  for (const row of mutualRows) {
    mutualCounts[row.followedId] = (mutualCounts[row.followedId] ?? 0) + 1;
  }

  return {
    myIntentCats: new Set((me?.intents    ?? []).map(i => i.category as string)),
    myLangs:      new Set(me?.languages   ?? []),
    myTags:       new Set((me?.tags       ?? []).map(t => t.tag    as string)),
    myTraditions: new Set((me?.traditions ?? []).map(tr => tr      as string)),
    myCity:        me?.location?.city    ?? me?.city    ?? '',
    myCountry:     me?.location?.country ?? me?.country ?? '',
    mutualCounts,
  };
}

/**
 * Computes a 0–100 relevance score for a candidate against the viewer's signals.
 *
 * Weights:
 *   Intent Match       30%
 *   Location Match     20%
 *   Language Match     20%
 *   Interest Match     15%
 *   Tradition Match    10%
 *   Mutual Connections  5%
 */
function computeScore(candidate: Record<string, any>, ctx: ScoringCtx): number {
  let score = 0;

  // ── 30% — Intent Match ───────────────────────────────────────────────────
  // Candidate has open intents in categories I'm also seeking.
  if (ctx.myIntentCats.size > 0) {
    const hits = (candidate.intents ?? []).filter(
      (i: { category: string }) => ctx.myIntentCats.has(i.category)
    ).length;
    score += 30 * Math.min(hits / ctx.myIntentCats.size, 1);
  }

  // ── 20% — Language Match ─────────────────────────────────────────────────
  if (ctx.myLangs.size > 0) {
    const hits = (candidate.languages ?? []).filter(
      (l: string) => ctx.myLangs.has(l)
    ).length;
    score += 20 * Math.min(hits / ctx.myLangs.size, 1);
  }

  // ── 20% — Location Match ─────────────────────────────────────────────────
  const cCity    = (candidate.location?.city    ?? candidate.city    ?? '') as string;
  const cCountry = (candidate.location?.country ?? candidate.country ?? '') as string;
  if (ctx.myCity && cCity.toLowerCase() === ctx.myCity.toLowerCase()) {
    score += 20;                                   // same city — full points
  } else if (ctx.myCountry && cCountry === ctx.myCountry) {
    score += 8;                                    // same country — partial
  }

  // ── 15% — Interest / Tag Match ───────────────────────────────────────────
  if (ctx.myTags.size > 0) {
    const hits = (candidate.tags ?? []).filter(
      (t: { tag: string }) => ctx.myTags.has(t.tag)
    ).length;
    score += 15 * Math.min(hits / ctx.myTags.size, 1);
  }

  // ── 10% — Tradition Match ────────────────────────────────────────────────
  if (ctx.myTraditions.size > 0) {
    const hits = (candidate.traditions ?? []).filter(
      (tr: string) => ctx.myTraditions.has(tr)
    ).length;
    score += 10 * Math.min(hits / ctx.myTraditions.size, 1);
  }

  // ── 5% — Mutual Connections ──────────────────────────────────────────────
  // People I follow who also follow this candidate. Capped at 3 for full points.
  const mutualCount = ctx.mutualCounts[candidate.id as string] ?? 0;
  if (mutualCount > 0) {
    score += 5 * Math.min(mutualCount / 3, 1);
  }

  return score;
}

/** Sort a pool by score desc. Equal scores preserve the pool's original order
 *  (which is updatedAt desc from the DB query — most recently active first). */
function rankPool(pool: Record<string, any>[], ctx: ScoringCtx) {
  return pool
    .map(u => ({ ...u, _score: computeScore(u, ctx) }))
    .sort((a, b) => b._score - a._score);
}

// ── Distance label (approximate only — never exact km) ─────────────────────
function approxDistanceLabel(
  userGridLat: number, userGridLng: number,
  targetGridLat: number, targetGridLng: number,
): string {
  const latDiff  = Math.abs(userGridLat - targetGridLat);
  const lngDiff  = Math.abs(userGridLng - targetGridLng);
  const approxKm = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111;
  if (approxKm <= 2)  return 'Within 2 km';
  if (approxKm <= 5)  return 'Within 5 km';
  if (approxKm <= 10) return 'Within 10 km';
  if (approxKm <= 30) return 'Same city area';
  return 'Same city';
}

/**
 * GET /discover/people
 * Multi-filter people discovery with spec-weight ranking.
 * Query params: tradition, tag, language, role, city, state, country, q, isVerifiedTeacher, seekingIntent
 */
router.get('/people', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { tradition, tag, language, role, city, state, country, q, isVerifiedTeacher, seekingIntent } = req.query;
  const params = parsePagination(req.query as Record<string, unknown>);
  const { limit, skip } = params;

  const where: Record<string, unknown> = {
    isActive: true,
    id: { not: req.user!.id },
    OR: [
      { privacySettings: { is: null } },
      { privacySettings: { is: { showInDiscovery: true, profileVisibility: { in: ['PUBLIC', 'COMMUNITY'] } } } },
    ],
  };

  if (tradition)         where.traditions       = { has: tradition as Tradition };
  if (language)          where.languages        = { has: language as string };
  if (role)              where.role             = role;
  if (q)                 where.displayName      = { contains: q as string, mode: 'insensitive' };
  if (isVerifiedTeacher) where.isVerifiedTeacher = true;
  if (seekingIntent)     where.intents          = { some: { category: seekingIntent as IntentCategory, status: IntentStatus.OPEN } };
  if (city)   where.location = { ...(where.location as object ?? {}), city:  { contains: city  as string, mode: 'insensitive' } };
  if (state)  where.location = { ...(where.location as object ?? {}), state: { contains: state as string, mode: 'insensitive' } };
  if (country)where.location = { ...(where.location as object ?? {}), country };
  if (tag)    where.tags     = { some: { tag: tag as ProfessionalTag } };

  // Fetch pool (most recent first as stable base order for ties)
  const pool = await prisma.user.findMany({
    where, take: SCORE_POOL, select: safeUserSelect,
    orderBy: [{ updatedAt: 'desc' }],
  });

  // Score + sort in-memory
  const ctx    = await buildScoringCtx(req.user!.id, pool.map(u => u.id));
  const ranked = rankPool(pool as Record<string, any>[], ctx);
  const sliced = ranked.slice(skip, skip + limit);

  res.json(paginatedResponse(sliced, ranked.length, params));
});

/**
 * GET /discover/nearby
 * Find practitioners near a grid cell.
 * Client sends snapped grid coords (1km precision) — never exact GPS.
 * Response returns ONLY approximate distance labels.
 * Nearby results are ranked by proximity (primary) then spec weights (secondary).
 */
router.get('/nearby', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { gridLat, gridLng, tradition, tag } = req.query;
  if (!gridLat || !gridLng) throw new AppError('gridLat and gridLng required (1km snapped)', 400);

  const lat   = parseFloat(gridLat as string);
  const lng   = parseFloat(gridLng as string);
  const delta = 0.1; // ±0.1 degree ≈ ±11 km

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
    where, take: 30, select: safeUserSelect,
    orderBy: [{ updatedAt: 'desc' }],
  });

  const ctx    = await buildScoringCtx(req.user!.id, users.map(u => u.id));
  const ranked = rankPool(users as Record<string, any>[], ctx);

  const withDistance = ranked.map((u: any) => ({
    ...u,
    approximateDistance: u.location?.visibility === 'APPROXIMATE' && u.location?.gridLat
      ? approxDistanceLabel(lat, lng, parseFloat(u.location.gridLat), parseFloat(u.location.gridLng))
      : 'Same city',
    location: { city: u.location?.city, state: u.location?.state, country: u.location?.country },
  }));

  res.json({ data: withDistance, total: withDistance.length });
});

/**
 * GET /discover/recommended
 * Suggested connections ranked by full spec weights.
 * Excludes users already followed.
 */
router.get('/recommended', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const me = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      traditions: true,
      languages:  true,
      city:       true,
      country:    true,
      tags:       { select: { tag: true } },
      location:   { select: { city: true, country: true } },
      intents:    { where: { status: IntentStatus.OPEN }, select: { category: true } },
    },
  });
  if (!me) throw new AppError('User not found', 404);

  const alreadyFollowing = await prisma.follow.findMany({
    where: { followerId: req.user!.id }, select: { followedId: true }
  });
  const excludeIds = [req.user!.id, ...alreadyFollowing.map(f => f.followedId)];

  const myTags       = me.tags.map(t => t.tag);
  const myTraditions = me.traditions;
  const myLanguages  = me.languages;
  const myIntentCats = me.intents.map(i => i.category);
  // Prefer UserLocation relation; fall back to direct User fields (set via onboarding)
  const myCity    = me.location?.city    ?? (me as any).city    ?? '';
  const myCountry = me.location?.country ?? (me as any).country ?? '';

  // Candidate pool: any signal overlap (broad OR for diversity)
  const orClauses: object[] = [];
  if (myTraditions.length) orClauses.push({ traditions: { hasSome: myTraditions } });
  if (myTags.length)       orClauses.push({ tags: { some: { tag: { in: myTags } } } });
  if (myLanguages.length)  orClauses.push({ languages: { hasSome: myLanguages } });
  if (myCity) orClauses.push({ OR: [
    { location: { is: { city: { equals: myCity, mode: 'insensitive' } } } },
    { city: { equals: myCity, mode: 'insensitive' } },
  ]});
  if (myIntentCats.length) orClauses.push({ intents: { some: { category: { in: myIntentCats }, status: IntentStatus.OPEN } } });
  // If profile is empty, fall back to active users in same country
  if (orClauses.length === 0 && myCountry) {
    orClauses.push({ OR: [{ country: myCountry }, { location: { is: { country: myCountry } } }] });
  }
  // Last resort: any active user
  if (orClauses.length === 0) orClauses.push({ isActive: true });

  const candidates = await prisma.user.findMany({
    where: {
      id:       { notIn: excludeIds },
      isActive: true,
      AND: [
        {
          OR: [
            { privacySettings: { is: null } },
            { privacySettings: { is: { showInDiscovery: true } } },
          ],
        },
        { OR: orClauses },
      ],
    },
    take: SCORE_POOL,
    select: safeUserSelect,
    orderBy: [{ updatedAt: 'desc' }],
  });

  const ctx    = await buildScoringCtx(req.user!.id, candidates.map(u => u.id));
  const ranked = rankPool(candidates as Record<string, any>[], ctx);

  res.json({ data: ranked.slice(0, 20) });
});

/**
 * GET /discover/categories
 * Preset discovery categories for the home-screen category strip.
 */
router.get('/categories', authenticate, async (_req: AuthRequest, res: Response): Promise<void> => {
  res.json([
    { key: 'bhikkhus',    label: 'Bhikkhus & Teachers', filter: { role: 'BHIKKHU' } },
    { key: 'meditation',  label: 'Meditation Partners',  filter: { tag: 'MEDITATOR' } },
    { key: 'volunteers',  label: 'Volunteers',           filter: { tag: 'VOLUNTEER' } },
    { key: 'translators', label: 'Translators',          filter: { tag: 'TRANSLATOR' } },
    { key: 'founders',    label: 'Buddhist Founders',    filter: { tag: 'FOUNDER' } },
    { key: 'students',    label: 'Students',             filter: { tag: 'STUDENT' } },
    { key: 'researchers', label: 'Researchers',          filter: { tag: 'RESEARCHER' } },
    { key: 'navayana',    label: 'Navayana Practitioners', filter: { tradition: 'NAVAYANA' } },
    { key: 'nearby',      label: 'Buddhists Near Me',   filter: { type: 'nearby' } },
  ]);
});

export default router;
