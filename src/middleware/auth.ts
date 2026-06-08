import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { env } from '../config/env';
import { UserRole } from '@prisma/client';

export interface AuthRequest extends Request {
  user?: { id: string; role: UserRole; isVerifiedClergy: boolean; isContributor: boolean; contributorSince: Date | null };
}

export const authenticate = async (
  req: AuthRequest, res: Response, next: NextFunction
): Promise<void> => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) { res.status(401).json({ error: 'No token provided' }); return; }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as { userId: string };
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true, isVerifiedClergy: true, isActive: true, isContributor: true, contributorSince: true },
    });
    if (!user || !user.isActive) { res.status(401).json({ error: 'User not found or inactive' }); return; }
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

export const requireRole = (...roles: UserRole[]) =>
  (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) { res.status(401).json({ error: 'Unauthenticated' }); return; }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' }); return;
    }
    next();
  };

export const requireClergy = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user?.isVerifiedClergy) {
    res.status(403).json({ error: 'Verified clergy role required' }); return;
  }
  next();
};

export const requireTrustedOrAbove: UserRole[] = [
  UserRole.TRUSTED, UserRole.BHIKKHU, UserRole.BHIKKHUNI,
  UserRole.SCHOLAR, UserRole.ASSOCIATION_ADMIN, UserRole.MODERATOR, UserRole.SUPER_ADMIN
];
