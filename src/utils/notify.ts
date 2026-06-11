import { prisma } from '../config/database';
import { Prisma } from '@prisma/client';

export async function createNotification(
  userId: string,
  type: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId, type, title, body,
        data: data ? (data as Prisma.InputJsonValue) : undefined,
      },
    });
  } catch (_) {
    // fire-and-forget — never fail the parent request
  }
}
