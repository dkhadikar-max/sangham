import { Router, Response } from 'express';
import { prisma } from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { CourseStatus, CourseOwnerType } from '@prisma/client';

const router = Router();

const COURSE_SELECT = {
  id: true, title: true, description: true, language: true, status: true,
  ownerType: true, ownerId: true, associationId: true, createdAt: true,
  instructor: { select: { id: true, displayName: true, profilePhoto: true } },
  _count: { select: { lessons: true } },
} as const;

// GET /courses?ownerType=&ownerId=&associationId=&status=&q=
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { ownerType, ownerId, associationId, status, q, limit = '20', page = '1' } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const where: Record<string, unknown> = {};

  // Support both legacy associationId filter and new ownerType+ownerId filter
  if (ownerType && ownerId) {
    where.ownerType = ownerType as CourseOwnerType;
    where.ownerId   = ownerId as string;
  } else if (associationId) {
    where.associationId = associationId as string;
  }

  where.status = status === 'DRAFT' ? 'DRAFT' : status === 'ARCHIVED' ? 'ARCHIVED' : 'PUBLISHED';
  if (q) where.title = { contains: q as string, mode: 'insensitive' };

  const [items, total] = await Promise.all([
    prisma.course.findMany({ where, skip, take: Number(limit), orderBy: { createdAt: 'desc' }, select: COURSE_SELECT }),
    prisma.course.count({ where }),
  ]);
  res.json({ data: items, total });
});

// GET /courses/:id — with lessons and thread
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const course = await prisma.course.findUnique({
    where: { id: req.params.id },
    include: {
      instructor: { select: { id: true, displayName: true, profilePhoto: true } },
      lessons: {
        where: { isPublished: true },
        orderBy: { sequence: 'asc' },
        include: { resource: { select: { id: true, type: true, title: true, url: true, thumbnailUrl: true, durationSecs: true } } },
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
      _count: { select: { lessons: true } },
    },
  });
  if (!course) { res.status(404).json({ error: 'Course not found' }); return; }
  res.json(course);
});

// POST /courses
// Body: { ownerType, ownerId?, associationId?, title, description?, instructorId?, language? }
// ownerType INDIVIDUAL: ownerId defaults to req.user.id; user must be verified teacher or contributor
// ownerType COMMUNITY:  ownerId = associationId; user must be community member
// ownerType SANGHAM:    user must be SUPER_ADMIN
router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const {
    ownerType = CourseOwnerType.COMMUNITY,
    title, description, instructorId, language = 'en',
  } = req.body;

  // Resolve ownerId and associationId based on ownerType
  let ownerId: string;
  let associationId: string | null = null;

  if (!title?.trim()) { res.status(400).json({ error: 'title required' }); return; }

  const isMod = ['MODERATOR', 'SUPER_ADMIN'].includes(req.user!.role);

  if (ownerType === CourseOwnerType.INDIVIDUAL) {
    ownerId = req.body.ownerId || req.user!.id;
    // Must be creating for yourself or a mod
    if (ownerId !== req.user!.id && !isMod) {
      res.status(403).json({ error: 'Cannot create a course on behalf of another user' }); return;
    }
    // Must be a verified teacher or contributor
    const creator = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { isVerifiedTeacher: true, isContributor: true },
    });
    if (!creator?.isVerifiedTeacher && !creator?.isContributor && !isMod) {
      res.status(403).json({ error: 'Individual course creation requires verified teacher or contributor status' }); return;
    }

  } else if (ownerType === CourseOwnerType.COMMUNITY) {
    const rawAssocId = req.body.ownerId || req.body.associationId;
    if (!rawAssocId) { res.status(400).json({ error: 'ownerId (associationId) required for COMMUNITY courses' }); return; }
    ownerId = rawAssocId;
    associationId = rawAssocId;
    const membership = await prisma.associationMember.findUnique({
      where: { associationId_userId: { associationId: rawAssocId as string, userId: req.user!.id } },
    });
    if (!membership && !isMod) {
      res.status(403).json({ error: 'Must be a community member to create a course for this community' }); return;
    }

  } else if (ownerType === CourseOwnerType.SANGHAM) {
    if (!isMod) { res.status(403).json({ error: 'Only platform admins can create Sangham-owned courses' }); return; }
    ownerId = req.body.ownerId || req.user!.id;

  } else if (ownerType === CourseOwnerType.ORGANIZATION) {
    // Future: org membership check
    ownerId = req.body.ownerId;
    if (!ownerId) { res.status(400).json({ error: 'ownerId required for ORGANIZATION courses' }); return; }

  } else {
    res.status(400).json({ error: `Invalid ownerType: ${ownerType}` }); return;
  }

  const course = await prisma.course.create({
    data: {
      ownerType,
      ownerId,
      associationId,
      title: title.trim(),
      description: description?.trim() || null,
      instructorId: instructorId || req.user!.id,
      language,
      status: CourseStatus.DRAFT,
    },
    select: COURSE_SELECT,
  });

  await prisma.contributionScore.upsert({
    where: { userId: req.user!.id },
    create: { userId: req.user!.id, coursesCreated: 1, totalScore: 2 },
    update: { coursesCreated: { increment: 1 }, totalScore: { increment: 2 } },
  });

  res.status(201).json(course);
});

// PUT /courses/:id — update (instructor or mod)
router.put('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const course = await prisma.course.findUnique({ where: { id: req.params.id } });
  if (!course) { res.status(404).json({ error: 'Not found' }); return; }
  const isMod = ['MODERATOR', 'SUPER_ADMIN'].includes(req.user!.role);
  const isOwner = course.ownerType === CourseOwnerType.INDIVIDUAL
    ? course.ownerId === req.user!.id
    : course.instructorId === req.user!.id;
  if (!isOwner && !isMod) {
    res.status(403).json({ error: 'Only the course owner or instructor can edit this course' }); return;
  }
  const { title, description, language, status } = req.body;
  const updated = await prisma.course.update({
    where: { id: req.params.id },
    data: {
      ...(title     && { title: title.trim() }),
      ...(description !== undefined && { description: description?.trim() || null }),
      ...(language  && { language }),
      ...(status && Object.values(CourseStatus).includes(status) && { status }),
    },
    select: COURSE_SELECT,
  });
  res.json(updated);
});

// POST /courses/:id/lessons
router.post('/:id/lessons', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const course = await prisma.course.findUnique({ where: { id: req.params.id } });
  if (!course) { res.status(404).json({ error: 'Course not found' }); return; }
  const isMod = ['MODERATOR', 'SUPER_ADMIN'].includes(req.user!.role);
  const isOwner = course.ownerType === CourseOwnerType.INDIVIDUAL
    ? course.ownerId === req.user!.id
    : course.instructorId === req.user!.id;
  if (!isOwner && !isMod) { res.status(403).json({ error: 'Forbidden' }); return; }

  const { title, content, resourceId, sequence } = req.body;
  if (!title?.trim()) { res.status(400).json({ error: 'title required' }); return; }

  const maxSeq = await prisma.courseLesson.aggregate({ where: { courseId: req.params.id }, _max: { sequence: true } });
  const lesson = await prisma.courseLesson.create({
    data: {
      courseId: req.params.id,
      title: title.trim(),
      content: content?.trim() || null,
      resourceId: resourceId || null,
      sequence: sequence ?? ((maxSeq._max.sequence ?? -1) + 1),
    },
  });
  res.status(201).json(lesson);
});

export default router;
