/**
 * Host vs Teacher Distinction — Priority 7
 * Anyone can host events/sessions.
 * Only admin-verified users receive a teaching badge.
 */
import { Router, Response } from 'express';
import { prisma } from '../config/database';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { UserRole, TeacherVerificationStatus } from '@prisma/client';

const router = Router();

// POST /teachers/apply — apply for verified teacher badge
router.post('/apply', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const existing = await prisma.teacherVerification.findUnique({ where: { userId: req.user!.id } });
  if (existing && existing.status === TeacherVerificationStatus.PENDING) {
    throw new AppError('Application already pending', 409);
  }
  if (existing && existing.status === TeacherVerificationStatus.VERIFIED) {
    throw new AppError('Already verified as a teacher', 409);
  }

  const { credentials, lineage, supportingDocUrl } = req.body;
  if (!credentials) throw new AppError('credentials description required', 400);

  const app = await prisma.teacherVerification.upsert({
    where: { userId: req.user!.id },
    create: { userId: req.user!.id, credentials, lineage, supportingDocUrl, status: TeacherVerificationStatus.PENDING },
    update: { credentials, lineage, supportingDocUrl, status: TeacherVerificationStatus.PENDING, reviewedBy: null, reviewedAt: null },
  });
  res.status(201).json(app);
});

// GET /teachers/applications — admin: view pending applications
router.get('/applications', authenticate,
  requireRole(UserRole.MODERATOR, UserRole.SUPER_ADMIN),
  async (_req: AuthRequest, res: Response): Promise<void> => {
    const apps = await prisma.teacherVerification.findMany({
      where: { status: TeacherVerificationStatus.PENDING },
      include: { user: { select: { id: true, displayName: true, profilePhoto: true, traditions: true } } },
    });
    res.json(apps);
  }
);

// PUT /teachers/applications/:id/review — admin: approve or reject
router.put('/applications/:id/review', authenticate,
  requireRole(UserRole.MODERATOR, UserRole.SUPER_ADMIN),
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { status, rejectionReason } = req.body;
    if (!Object.values(TeacherVerificationStatus).includes(status)) {
      throw new AppError('Invalid status', 400);
    }
    const app = await prisma.teacherVerification.update({
      where: { id: req.params.id },
      data: { status, rejectionReason, reviewedBy: req.user!.id, reviewedAt: new Date() },
    });
    if (status === TeacherVerificationStatus.VERIFIED) {
      await prisma.user.update({ where: { id: app.userId }, data: { isVerifiedTeacher: true } });
    }
    res.json(app);
  }
);

// GET /teachers — browse verified teachers directory
router.get('/', async (_req: AuthRequest, res: Response): Promise<void> => {
  const teachers = await prisma.user.findMany({
    where: { isVerifiedTeacher: true, isActive: true },
    select: {
      id: true, displayName: true, profilePhoto: true, bio: true,
      traditions: true, languages: true, isVerifiedClergy: true,
      location: { select: { city: true, state: true, country: true } },
      _count: { select: { sessions: true } },
    },
    orderBy: { contributionScore: { sessionsHosted: 'desc' } },
  });
  res.json(teachers);
});

export default router;
