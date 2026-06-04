import { Router, Response } from 'express';
import { prisma } from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// POST /messages  — send DM
router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { recipientId, ciphertext } = req.body;
  if (!recipientId || !ciphertext) throw new AppError('recipientId and ciphertext required', 400);
  if (recipientId === req.user!.id) throw new AppError('Cannot message yourself', 400);

  const recipient = await prisma.user.findUnique({ where: { id: recipientId } });
  if (!recipient) throw new AppError('Recipient not found', 404);

  const message = await prisma.message.create({
    data: { senderId: req.user!.id, recipientId, ciphertext },
    select: { id: true, senderId: true, recipientId: true, createdAt: true },
  });
  res.status(201).json(message);
});

// GET /messages/threads  — list DM threads
router.get('/threads', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  // Get the latest message per thread partner
  const threads = await prisma.$queryRaw<Array<{
    partnerId: string; lastMessage: string; lastAt: Date; unreadCount: bigint;
  }>>`
    SELECT
      CASE WHEN sender_id = ${req.user!.id} THEN recipient_id ELSE sender_id END AS "partnerId",
      MAX(created_at) AS "lastAt",
      COUNT(*) FILTER (WHERE recipient_id = ${req.user!.id} AND is_read = false) AS "unreadCount"
    FROM messages
    WHERE sender_id = ${req.user!.id} OR recipient_id = ${req.user!.id}
    GROUP BY "partnerId"
    ORDER BY "lastAt" DESC
    LIMIT 50
  `;

  // Fetch partner user details
  const partnerIds = threads.map(t => t.partnerId);
  const partners = await prisma.user.findMany({
    where: { id: { in: partnerIds } },
    select: { id: true, displayName: true, profilePhoto: true },
  });
  const partnerMap = Object.fromEntries(partners.map(p => [p.id, p]));

  res.json(threads.map(t => ({ ...t, partner: partnerMap[t.partnerId] })));
});

// GET /messages/threads/:partnerId
router.get('/threads/:partnerId', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: req.user!.id, recipientId: req.params.partnerId },
        { senderId: req.params.partnerId, recipientId: req.user!.id },
      ],
    },
    orderBy: { createdAt: 'asc' },
    take: 100,
    select: { id: true, senderId: true, recipientId: true, ciphertext: true, isRead: true, createdAt: true },
  });
  // Mark as read
  await prisma.message.updateMany({
    where: { senderId: req.params.partnerId, recipientId: req.user!.id, isRead: false },
    data: { isRead: true },
  });
  res.json(messages);
});

export default router;
