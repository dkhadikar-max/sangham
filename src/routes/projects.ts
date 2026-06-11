import { Router, Response } from 'express';
import { prisma } from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { ProjectStatus, ProjectCategory } from '@prisma/client';

const router = Router();

const PROJECT_INCLUDE = {
  owner: { select: { id: true, displayName: true, profilePhoto: true, role: true } },
  association: { select: { id: true, name: true } },
  _count: { select: { members: { where: { isActive: true } } } },
} as const;

const CAT_ICON: Record<string, string> = {
  TRANSLATION:        '\u{1F4DC}',
  EDUCATION:          '\u{1F4DA}',
  VOLUNTEER:          '\u{1F91D}',
  RESEARCH:           '\u{1F52C}',
  TECHNOLOGY:         '\u{1F4BB}',
  ENVIRONMENT:        '\u{1F331}',
  SOCIAL_IMPACT:      '✊',
  COMMUNITY_BUILDING: '\u{1F3D8}',
  ARTS_CULTURE:       '\u{1F3A8}',
  HEALTHCARE:         '\u{1F3E5}',
};

// GET /projects — browse open/active projects
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { category, status = 'OPEN', q, associationId, memberId, limit = '20', page = '1' } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const where: Record<string, unknown> = { isPublished: true };
  if (status !== 'ALL') {
    where.status = (status as string).toUpperCase() as ProjectStatus;
  }
  if (category && Object.values(ProjectCategory).includes(category as ProjectCategory)) {
    where.category = category as ProjectCategory;
  }
  if (associationId) where.associationId = associationId as string;
  if (memberId) where.members = { some: { userId: memberId as string, isActive: true } };
  if (q) where.title = { contains: q as string, mode: 'insensitive' };

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where, skip, take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: PROJECT_INCLUDE,
    }),
    prisma.project.count({ where }),
  ]);

  res.json({ data: projects.map(p => ({ ...p, icon: CAT_ICON[p.category] ?? '🤝' })), total });
});

// GET /projects/mine — projects I own or joined
router.get('/mine', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const projects = await prisma.project.findMany({
    where: {
      isPublished: true,
      OR: [
        { ownerId: userId },
        { members: { some: { userId, isActive: true } } },
      ],
    },
    orderBy: { createdAt: 'desc' },
    include: PROJECT_INCLUDE,
  });
  res.json(projects.map(p => ({ ...p, icon: CAT_ICON[p.category] ?? '🤝' })));
});

// GET /projects/:id — project detail with members and discussion
router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const project = await prisma.project.findUnique({
    where: { id: req.params.id },
    include: {
      ...PROJECT_INCLUDE,
      members: {
        where: { isActive: true },
        take: 30,
        include: {
          user: { select: { id: true, displayName: true, profilePhoto: true, role: true } },
        },
        orderBy: { joinedAt: 'asc' },
      },
      thread: {
        include: {
          posts: {
            where: { isDeleted: false },
            orderBy: { createdAt: 'asc' },
            take: 50,
            include: { author: { select: { id: true, displayName: true, profilePhoto: true } } },
          },
        },
      },
    },
  });

  if (!project || !project.isPublished) {
    res.status(404).json({ error: 'Project not found' }); return;
  }

  const myMembership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId: req.params.id, userId: req.user!.id } },
  });

  res.json({
    ...project,
    icon: CAT_ICON[project.category] ?? '🤝',
    isMember: !!myMembership?.isActive,
    isOwner: project.ownerId === req.user!.id,
  });
});

// POST /projects — create project
router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { title, purpose, description, category, skillsNeeded = [], participantsNeeded = 0, deadline, associationId } = req.body;

  if (!title?.trim()) { res.status(400).json({ error: 'title required' }); return; }
  if (!purpose?.trim()) { res.status(400).json({ error: 'purpose required' }); return; }
  if (!category || !Object.values(ProjectCategory).includes(category)) {
    res.status(400).json({ error: 'valid category required' }); return;
  }

  const project = await prisma.project.create({
    data: {
      ownerId: req.user!.id,
      associationId: associationId || null,
      title: title.trim(),
      purpose: purpose.trim(),
      description: description?.trim() || null,
      category,
      skillsNeeded: Array.isArray(skillsNeeded) ? skillsNeeded : [],
      participantsNeeded: Number(participantsNeeded) || 0,
      deadline: deadline ? new Date(deadline) : null,
    },
    include: PROJECT_INCLUDE,
  });

  // Owner auto-joined as OWNER role
  await prisma.projectMember.create({
    data: { projectId: project.id, userId: req.user!.id, role: 'OWNER' },
  });

  res.status(201).json({ ...project, icon: CAT_ICON[project.category] ?? '🤝' });
});

// PUT /projects/:id — update (owner only)
router.put('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const project = await prisma.project.findUnique({ where: { id: req.params.id } });
  if (!project) { res.status(404).json({ error: 'Not found' }); return; }
  if (project.ownerId !== req.user!.id) {
    res.status(403).json({ error: 'Only the owner can edit this project' }); return;
  }

  const { title, purpose, description, skillsNeeded, participantsNeeded, deadline, status } = req.body;
  const updated = await prisma.project.update({
    where: { id: req.params.id },
    data: {
      ...(title && { title: title.trim() }),
      ...(purpose && { purpose: purpose.trim() }),
      ...(description !== undefined && { description: description?.trim() || null }),
      ...(skillsNeeded && { skillsNeeded }),
      ...(participantsNeeded !== undefined && { participantsNeeded: Number(participantsNeeded) }),
      ...(deadline !== undefined && { deadline: deadline ? new Date(deadline) : null }),
      ...(status && Object.values(ProjectStatus).includes(status) && { status }),
    },
    include: PROJECT_INCLUDE,
  });

  res.json({ ...updated, icon: CAT_ICON[updated.category] ?? '🤝' });
});

// POST /projects/:id/join
router.post('/:id/join', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const project = await prisma.project.findUnique({ where: { id: req.params.id } });
  if (!project || !project.isPublished) { res.status(404).json({ error: 'Project not found' }); return; }
  if (project.status === ProjectStatus.CANCELLED || project.status === ProjectStatus.COMPLETED) {
    res.status(400).json({ error: 'Project is not accepting collaborators' }); return;
  }

  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: req.params.id, userId: req.user!.id } },
    create: { projectId: req.params.id, userId: req.user!.id, role: 'CONTRIBUTOR' },
    update: { isActive: true },
  });

  res.json({ message: 'Joined project' });
});

// DELETE /projects/:id/leave
router.delete('/:id/leave', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const project = await prisma.project.findUnique({ where: { id: req.params.id } });
  if (!project) { res.status(404).json({ error: 'Not found' }); return; }
  if (project.ownerId === req.user!.id) {
    res.status(400).json({ error: 'Owner cannot leave. Cancel the project instead.' }); return;
  }

  await prisma.projectMember.updateMany({
    where: { projectId: req.params.id, userId: req.user!.id },
    data: { isActive: false },
  });

  res.json({ message: 'Left project' });
});

export default router;
