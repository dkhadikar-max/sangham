import { Router, Response } from 'express';
import { prisma } from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { MessagingPermission } from '@prisma/client';
import { getIo } from '../config/socketio';
import { createNotification } from '../utils/notify';

const router = Router();

// Deterministic conversation ID for a DM between two users
function convId(a: string, b: string): string { return [a, b].sort().join('+'); }
function extractPartnerId(cid: string, myId: string): string | null {
  const parts = cid.split('+');
  return parts.find(id => id !== myId) ?? null;
}

type MsgRow = {
  id: string; senderId: string; recipientId: string;
  ciphertext: string; iv: string | null;
  type: string; mediaUrl: string | null;
  isRead: boolean; createdAt: Date;
};

function formatMessage(msg: MsgRow, cid: string, senderName = '', senderPhoto: string | null = null, isReadOverride?: boolean) {
  return {
    id: msg.id,
    content: msg.ciphertext,
    type: msg.type,
    mediaUrl: msg.mediaUrl,
    linkPreview: null,
    senderId: msg.senderId,
    senderName,
    senderPhoto,
    conversationId: cid,
    createdAt: msg.createdAt.toISOString(),
    isRead: isReadOverride ?? msg.isRead,
    encrypted: msg.iv !== null,
  };
}

// POST /conversations — open or return an existing DM thread
router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { participantId } = req.body;
  if (!participantId || typeof participantId !== 'string') throw new AppError('participantId required', 400);
  if (participantId === req.user!.id) throw new AppError('Cannot message yourself', 400);

  const [partner, me, partnerSettings, existingConnection] = await Promise.all([
    prisma.user.findUnique({ where: { id: participantId }, select: { id: true, displayName: true, profilePhoto: true } }),
    prisma.user.findUnique({ where: { id: req.user!.id }, select: { id: true, displayName: true, profilePhoto: true } }),
    prisma.privacySettings.findUnique({ where: { userId: participantId } }),
    prisma.follow.findFirst({ where: { followerId: req.user!.id, followedId: participantId } }),
  ]);
  if (!partner) throw new AppError('User not found', 404);

  // Block check
  const block = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: req.user!.id, blockedId: participantId },
        { blockerId: participantId, blockedId: req.user!.id },
      ],
    },
    select: { blockerId: true },
  });
  if (block) throw new AppError('User not found', 404);

  // Check messaging permission before opening thread
  const perm: MessagingPermission = partnerSettings?.messagingPermission ?? MessagingPermission.CONNECTIONS_ONLY;
  if (perm === MessagingPermission.NOBODY)
    throw new AppError('This user is not accepting messages', 403);
  if (perm === MessagingPermission.CONNECTIONS_ONLY && !existingConnection)
    throw new AppError('This user only accepts messages from connections', 403);

  const cid = convId(req.user!.id, participantId);

  const [lastMsg, unreadCount] = await Promise.all([
    prisma.message.findFirst({
      where: { OR: [{ senderId: req.user!.id, recipientId: participantId }, { senderId: participantId, recipientId: req.user!.id }] },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.message.count({ where: { senderId: participantId, recipientId: req.user!.id, isRead: false } }),
  ]);

  res.json({
    id: cid,
    type: 'direct',
    name: null,
    photoUrl: null,
    participants: [
      { id: me!.id, displayName: me!.displayName, profilePhoto: me!.profilePhoto },
      { id: partner.id, displayName: partner.displayName, profilePhoto: partner.profilePhoto },
    ],
    lastMessage: lastMsg ? formatMessage(lastMsg, cid) : null,
    unreadCount,
    updatedAt: lastMsg?.createdAt?.toISOString() ?? new Date().toISOString(),
  });
});

// GET /conversations — list all DM threads for current user
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const myId = req.user!.id;

  const threads = await prisma.$queryRaw<Array<{
    partnerId: string; lastAt: Date; lastMessage: string;
    lastIv: string | null; lastType: string; lastMediaUrl: string | null; unreadCount: bigint;
  }>>`
    SELECT
      partner_id AS "partnerId",
      last_at AS "lastAt",
      last_message AS "lastMessage",
      last_iv AS "lastIv",
      last_type AS "lastType",
      last_media_url AS "lastMediaUrl",
      unread_count AS "unreadCount"
    FROM (
      SELECT
        CASE WHEN sender_id = ${myId} THEN recipient_id ELSE sender_id END AS partner_id,
        created_at AS last_at,
        ciphertext AS last_message,
        iv AS last_iv,
        type AS last_type,
        media_url AS last_media_url,
        COUNT(*) FILTER (WHERE recipient_id = ${myId} AND is_read = false)
          OVER (PARTITION BY CASE WHEN sender_id = ${myId} THEN recipient_id ELSE sender_id END)
          AS unread_count,
        ROW_NUMBER() OVER (
          PARTITION BY CASE WHEN sender_id = ${myId} THEN recipient_id ELSE sender_id END
          ORDER BY created_at DESC
        ) AS rn
      FROM messages
      WHERE sender_id = ${myId} OR recipient_id = ${myId}
    ) t
    WHERE rn = 1
    ORDER BY last_at DESC
    LIMIT 50
  `;

  const partnerIds = threads.map(t => t.partnerId);
  const partners = await prisma.user.findMany({
    where: { id: { in: partnerIds } },
    select: { id: true, displayName: true, profilePhoto: true },
  });
  const partnerMap = Object.fromEntries(partners.map(p => [p.id, p]));

  const me = await prisma.user.findUnique({
    where: { id: myId },
    select: { id: true, displayName: true, profilePhoto: true },
  });

  res.json(threads.map(t => {
    const partner = partnerMap[t.partnerId];
    const cid = convId(myId, t.partnerId);
    return {
      id: cid,
      type: 'direct',
      name: null,
      photoUrl: null,
      participants: [
        { id: me!.id, displayName: me!.displayName, profilePhoto: me!.profilePhoto },
        ...(partner ? [{ id: partner.id, displayName: partner.displayName, profilePhoto: partner.profilePhoto }] : []),
      ],
      lastMessage: {
        id: 'last',
        content: t.lastMessage,
        type: t.lastType,
        mediaUrl: t.lastMediaUrl,
        linkPreview: null,
        senderId: '',
        senderName: '',
        senderPhoto: null,
        conversationId: cid,
        createdAt: t.lastAt.toISOString(),
        isRead: Number(t.unreadCount) === 0,
        encrypted: t.lastIv !== null,
      },
      unreadCount: Number(t.unreadCount),
      updatedAt: t.lastAt.toISOString(),
    };
  }));
});

// GET /conversations/:id/messages
router.get('/:id/messages', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const myId = req.user!.id;
  const partnerId = extractPartnerId(req.params.id, myId);
  if (!partnerId) throw new AppError('Invalid conversation ID', 400);

  const { before, limit = '30' } = req.query;
  const take = Math.min(Number(limit) || 30, 100);

  const where: Record<string, unknown> = {
    OR: [
      { senderId: myId, recipientId: partnerId },
      { senderId: partnerId, recipientId: myId },
    ],
  };
  if (before && typeof before === 'string') {
    const cursor = await prisma.message.findUnique({ where: { id: before }, select: { createdAt: true } });
    if (cursor) where.createdAt = { lt: cursor.createdAt };
  }

  const msgs = await prisma.message.findMany({
    where,
    orderBy: { createdAt: 'asc' },
    take,
    include: { sender: { select: { displayName: true, profilePhoto: true } } },
  });

  // Mark received messages as read
  const { count: markedReadCount } = await prisma.message.updateMany({
    where: { senderId: partnerId, recipientId: myId, isRead: false },
    data: { isRead: true },
  });

  const cid = convId(myId, partnerId);

  // Let the sender know their messages were just read, so an open ChatView updates live
  if (markedReadCount > 0) {
    getIo()?.to(cid).emit(`read:${cid}`, { readerId: myId });
  }

  res.json(msgs.map(m => formatMessage(
    m, cid, m.sender.displayName, m.sender.profilePhoto,
    m.senderId === partnerId ? true : m.isRead, // reflect the read-marking that just happened above
  )));
});

// POST /conversations/:id/messages — send a message
router.post('/:id/messages', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const myId = req.user!.id;
  const partnerId = extractPartnerId(req.params.id, myId);
  if (!partnerId) throw new AppError('Invalid conversation ID', 400);

  const { content, type = 'text', mediaUrl, encrypted = false } = req.body;
  if (!content && !mediaUrl) throw new AppError('content or mediaUrl required', 400);

  // Check messaging permissions + block
  const [recipient, settings, connection, msgBlock] = await Promise.all([
    prisma.user.findUnique({ where: { id: partnerId }, select: { id: true, displayName: true } }),
    prisma.privacySettings.findUnique({ where: { userId: partnerId } }),
    prisma.follow.findFirst({ where: { followerId: myId, followedId: partnerId } }),
    prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: myId, blockedId: partnerId },
          { blockerId: partnerId, blockedId: myId },
        ],
      },
      select: { blockerId: true },
    }),
  ]);
  if (!recipient) throw new AppError('Recipient not found', 404);
  if (msgBlock) throw new AppError('User not found', 404);

  const perm: MessagingPermission = settings?.messagingPermission ?? MessagingPermission.CONNECTIONS_ONLY;
  if (perm === MessagingPermission.NOBODY)
    throw new AppError('This user is not accepting messages', 403);
  if (perm === MessagingPermission.CONNECTIONS_ONLY && !connection)
    throw new AppError('This user only accepts messages from connections', 403);

  const iv = encrypted ? (req.body.iv ?? null) : null;
  const msg = await prisma.message.create({
    data: {
      senderId: myId,
      recipientId: partnerId,
      ciphertext: content ?? '',
      iv,
      type: (type as string).slice(0, 20),
      mediaUrl: mediaUrl ?? null,
    },
    include: { sender: { select: { displayName: true, profilePhoto: true } } },
  });

  const cid = convId(myId, partnerId);
  const formatted = formatMessage(msg, cid, msg.sender.displayName, msg.sender.profilePhoto);

  // Broadcast to both users via Socket.io
  getIo()?.to(cid).emit(`message:${cid}`, formatted);

  res.status(201).json(formatted);

  // Notify recipient (fire-and-forget)
  createNotification(
    partnerId, 'new_message', 'New Message',
    `${msg.sender.displayName} sent you a message`,
    { userId: myId }
  ).catch(() => {});
});

export default router;
