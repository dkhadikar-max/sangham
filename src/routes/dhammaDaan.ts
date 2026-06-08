/**
 * Dhamma Daan — financial contribution system (P5)
 *
 * 50% → Platform Operations (keeps Digital Sangha running)
 * 50% → Dhamma Daan Fund (translation, education, community service)
 *
 * Contribution amount NEVER affects ranking, visibility, or verification.
 */
import { Router, Response } from 'express';
import { prisma } from '../config/database';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { createOrder, verifyPaymentSignature } from '../services/razorpay';
import { env } from '../config/env';
import { AllocationCategory, UserRole } from '@prisma/client';
import { z } from 'zod';

const router = Router();

// Valid Dhamma Daan tiers in paise (₹49, ₹108, ₹501, ₹5000, ₹50000, custom ≥ ₹49)
const MIN_PAISE = 4900;

// ── POST /dhamma-daan/orders ─────────────────────────────────────────────────
// Create a Razorpay order. Returns the order_id for the frontend checkout.
router.post('/orders', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { amountPaise } = req.body;
  if (!amountPaise || typeof amountPaise !== 'number' || amountPaise < MIN_PAISE) {
    throw new AppError(`Minimum contribution is ₹${MIN_PAISE / 100}`, 400);
  }
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    throw new AppError('Payment system not configured', 503);
  }

  const receipt = `dd_${req.user!.id.slice(0, 8)}_${Date.now()}`;
  const order = await createOrder(amountPaise, receipt);

  // Create a PENDING record so we can reconcile even if the callback never comes
  const half = Math.floor(amountPaise / 2);
  await prisma.dhammaDaanContribution.create({
    data: {
      userId: req.user!.id,
      amountPaise,
      razorpayOrderId: order.id,
      status: 'PENDING',
      splitPlatformPaise: half,
      splitFundPaise: amountPaise - half,  // odd paise goes to fund
    },
  });

  res.json({
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: env.RAZORPAY_KEY_ID,
  });
});

// ── POST /dhamma-daan/verify ─────────────────────────────────────────────────
// Verify signature and mark contribution as CAPTURED.
const verifySchema = z.object({
  razorpay_order_id:   z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature:  z.string(),
});

router.post('/verify', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = verifySchema.safeParse(req.body);
  if (!parsed.success) throw new AppError('Invalid payload', 400);

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data;

  if (!verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
    throw new AppError('Payment verification failed', 400);
  }

  // Find the pending contribution
  const contribution = await prisma.dhammaDaanContribution.findUnique({
    where: { razorpayOrderId: razorpay_order_id },
  });
  if (!contribution) throw new AppError('Order not found', 404);
  if (contribution.userId !== req.user!.id) throw new AppError('Forbidden', 403);
  if (contribution.status === 'CAPTURED') {
    res.json({ alreadyCaptured: true }); return;
  }

  // Mark captured + grant contributor status in one transaction
  const [updated] = await prisma.$transaction([
    prisma.dhammaDaanContribution.update({
      where: { razorpayOrderId: razorpay_order_id },
      data: {
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        status: 'CAPTURED',
        capturedAt: new Date(),
      },
    }),
    prisma.user.update({
      where: { id: req.user!.id },
      data: {
        isContributor: true,
        contributorSince: req.user!.contributorSince ?? new Date(),
      },
    }),
  ]);

  res.json({
    captured: true,
    amountPaise: contribution.amountPaise,
    splitPlatformPaise: contribution.splitPlatformPaise,
    splitFundPaise: contribution.splitFundPaise,
  });
});

// ── GET /dhamma-daan/me ──────────────────────────────────────────────────────
router.get('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const contributions = await prisma.dhammaDaanContribution.findMany({
    where: { userId: req.user!.id, status: 'CAPTURED' },
    orderBy: { capturedAt: 'desc' },
    select: { amountPaise: true, splitPlatformPaise: true, splitFundPaise: true, capturedAt: true },
  });
  const totalPaise = contributions.reduce((s, c) => s + c.amountPaise, 0);
  res.json({ contributions, totalPaise, isContributor: req.user!.isContributor });
});

// ── GET /dhamma-daan/dashboard ───────────────────────────────────────────────
// Public: aggregate stats for transparency dashboard
router.get('/dashboard', async (_req: AuthRequest, res: Response): Promise<void> => {
  const [agg, contributorCount, allocations] = await Promise.all([
    prisma.dhammaDaanContribution.aggregate({
      where: { status: 'CAPTURED' },
      _sum: { amountPaise: true, splitFundPaise: true, splitPlatformPaise: true },
      _count: { id: true },
    }),
    prisma.user.count({ where: { isContributor: true } }),
    prisma.dhammaDaanAllocation.findMany({
      orderBy: { allocatedAt: 'desc' },
      take: 10,
    }),
  ]);

  const totalCollectedPaise    = agg._sum.amountPaise         ?? 0;
  const totalFundPaise         = agg._sum.splitFundPaise      ?? 0;
  const totalAllocatedPaise    = allocations.reduce((s, a) => s + a.amountPaise, 0);
  const fundBalancePaise       = totalFundPaise - totalAllocatedPaise;

  res.json({
    totalCollectedPaise,
    totalFundPaise,
    totalPlatformPaise: agg._sum.splitPlatformPaise ?? 0,
    fundBalancePaise,
    totalAllocatedPaise,
    contributionCount: agg._count.id,
    contributorCount,
    recentAllocations: allocations,
  });
});

// ── GET /dhamma-daan/allocations ─────────────────────────────────────────────
router.get('/allocations', async (_req: AuthRequest, res: Response): Promise<void> => {
  const allocations = await prisma.dhammaDaanAllocation.findMany({
    orderBy: { allocatedAt: 'desc' },
  });
  res.json(allocations);
});

// ── POST /dhamma-daan/allocations (admin only) ───────────────────────────────
const allocationSchema = z.object({
  title:        z.string().min(3).max(200),
  description:  z.string().min(10),
  category:     z.nativeEnum(AllocationCategory),
  amountPaise:  z.number().int().positive(),
  beneficiary:  z.string().optional(),
  impactReport: z.string().optional(),
});

router.post('/allocations', authenticate, requireRole(UserRole.SUPER_ADMIN, UserRole.MODERATOR),
  async (req: AuthRequest, res: Response): Promise<void> => {
    const parsed = allocationSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError('Invalid allocation data', 400);

    const allocation = await prisma.dhammaDaanAllocation.create({
      data: { ...parsed.data, createdBy: req.user!.id },
    });
    res.status(201).json(allocation);
  }
);

export default router;
