/**
 * Contribution-Based Reputation — Priority 4
 * Rewards service, not popularity. No follower counts as status.
 */
import { Router, Response } from 'express';
import { prisma } from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// GET /contributions/:userId — view contribution score
router.get('/:userId', async (req: AuthRequest, res: Response): Promise<void> => {
  const score = await prisma.contributionScore.findUnique({
    where: { userId: req.params.userId },
    select: {
      eventsHosted: true,
      volunteerContributions: true,
      communitiesCreated: true,
      helpfulAnswers: true,
      translationContributions: true,
      libraryAnnotations: true,
      sessionsHosted: true,
      totalScore: true,
    },
  });
  if (!score) { res.json({ totalScore: 0, message: 'No contributions yet' }); return; }
  res.json(score);
});

// GET /contributions/leaderboard — top contributors
router.get('/leaderboard', async (_req: AuthRequest, res: Response): Promise<void> => {
  const leaders = await prisma.contributionScore.findMany({
    orderBy: { totalScore: 'desc' },
    take: 20,
    select: {
      totalScore: true,
      eventsHosted: true,
      sessionsHosted: true,
      user: { select: { id: true, displayName: true, profilePhoto: true, traditions: true, isVerifiedClergy: true, isVerifiedTeacher: true } },
    },
  });
  res.json(leaders);
});

// POST /contributions/mark-helpful/:postId  (upvote an answer as helpful)
router.post('/mark-helpful/:postId', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const post = await prisma.post.findUnique({ where: { id: req.params.postId }, select: { authorId: true } });
  if (!post) throw new AppError('Post not found', 404);
  if (post.authorId === req.user!.id) throw new AppError('Cannot mark your own post as helpful', 400);

  await prisma.contributionScore.upsert({
    where: { userId: post.authorId },
    create: { userId: post.authorId, helpfulAnswers: 1, totalScore: 1 },
    update: { helpfulAnswers: { increment: 1 }, totalScore: { increment: 1 } },
  });
  res.json({ message: 'Marked as helpful' });
});

export default router;
