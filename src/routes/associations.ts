import { Router, Response } from 'express';
import { prisma } from '../config/database';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { AssociationCategory, Tradition, UserRole } from '@prisma/client';
import { z } from 'zod';

const router = Router();

const createAssocSchema = z.object({
  name: z.string().min(2).max(200),
  country: z.string().length(2),
  city: z.string().optional(),
  tradition: z.nativeEnum(Tradition),
  category: z.nativeEnum(AssociationCategory),
  parentId: z.string().uuid().optional(),
  legalRegNumber: z.string().optional(),
  description: z.string().max(3000).optional(),
  website: z.string().url().optional(),
});

// POST /associations
router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = createAssocSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }

  const assoc = await prisma.association.create({ data: parsed.data });

  // Auto-add creator as president
  await prisma.associationMember.create({
    data: { associationId: assoc.id, userId: req.user!.id, memberRole: 'PRESIDENT' },
  });
  // Promote user role to ASSOCIATION_ADMIN if not already higher
  const higherRoles: UserRole[] = [UserRole.MODERATOR, UserRole.SUPER_ADMIN, UserRole.BHIKKHU, UserRole.BHIKKHUNI, UserRole.SCHOLAR];
  if (!higherRoles.includes(req.user!.role)) {
    await prisma.user.update({ where: { id: req.user!.id }, data: { role: UserRole.ASSOCIATION_ADMIN } });
  }
  res.status(201).json(assoc);
});

// GET /associations/:id
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const assoc = await prisma.association.findUnique({
    where: { id: req.params.id },
    include: {
      members: {
        where: { isActive: true },
        include: { user: { select: { id: true, displayName: true, profilePhoto: true } } },
        take: 50,
      },
      events: { where: { isPublished: true, startsAt: { gte: new Date() } }, take: 10, orderBy: { startsAt: 'asc' } },
      _count: { select: { members: { where: { isActive: true } } } },
    },
  });
  if (!assoc) throw new AppError('Association not found', 404);
  res.json(assoc);
});

// GET /associations — directory
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { country, tradition, category } = req.query;
  const where: Record<string, unknown> = {};
  if (country) where.country = country;
  if (tradition) where.tradition = tradition;
  if (category) where.category = category;
  const assocs = await prisma.association.findMany({
    where, take: 50, orderBy: { name: 'asc' },
    select: { id: true, name: true, country: true, city: true, tradition: true, category: true, isVerified: true, _count: { select: { members: { where: { isActive: true } } } } },
  });
  res.json(assocs);
});

// GET /associations/:id/membership — check own membership status
router.get('/:id/membership', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const member = await prisma.associationMember.findFirst({
    where: { associationId: req.params.id, userId: req.user!.id, isActive: true },
    select: { memberRole: true },
  });
  res.json({ isMember: !!member, memberRole: member?.memberRole || null });
});

// POST /associations/:id/join — self-join as MEMBER
router.post('/:id/join', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const assoc = await prisma.association.findUnique({ where: { id: req.params.id } });
  if (!assoc) throw new AppError('Association not found', 404);
  const member = await prisma.associationMember.upsert({
    where: { associationId_userId: { associationId: req.params.id, userId: req.user!.id } },
    create: { associationId: req.params.id, userId: req.user!.id, memberRole: 'MEMBER' },
    update: { isActive: true },
  });
  res.json(member);
});

// DELETE /associations/:id/leave
router.delete('/:id/leave', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  await prisma.associationMember.updateMany({
    where: { associationId: req.params.id, userId: req.user!.id },
    data: { isActive: false },
  });
  res.json({ message: 'Left association' });
});

// POST /associations/:id/members  (admin only)
router.post('/:id/members', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const membership = await prisma.associationMember.findFirst({
    where: { associationId: req.params.id, userId: req.user!.id, memberRole: { in: ['PRESIDENT', 'SECRETARY'] } },
  });
  if (!membership && req.user!.role !== UserRole.SUPER_ADMIN) throw new AppError('Association admin required', 403);

  const { userId, memberRole } = req.body;
  const member = await prisma.associationMember.upsert({
    where: { associationId_userId: { associationId: req.params.id, userId } },
    create: { associationId: req.params.id, userId, memberRole: memberRole || 'MEMBER' },
    update: { isActive: true, memberRole: memberRole || 'MEMBER' },
  });
  res.status(201).json(member);
});

// DELETE /associations/:id/members/:userId  (admin only)
router.delete('/:id/members/:userId', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const membership = await prisma.associationMember.findFirst({
    where: { associationId: req.params.id, userId: req.user!.id, memberRole: { in: ['PRESIDENT', 'SECRETARY'] } },
  });
  if (!membership && req.user!.role !== UserRole.SUPER_ADMIN) throw new AppError('Association admin required', 403);

  await prisma.associationMember.updateMany({
    where: { associationId: req.params.id, userId: req.params.userId },
    data: { isActive: false },
  });
  res.json({ message: 'Member removed' });
});

export default router;
