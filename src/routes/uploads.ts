/**
 * Upload routes — single endpoint for all file uploads.
 * Local dev:  saves to /uploads/{subdir}/, returns relative URL
 * R2 / S3:    streams to cloud storage, returns public URL
 */
import { Router, Response } from 'express';
import path from 'path';
import { authenticate, AuthRequest } from '../middleware/auth';
import {
  uploadImage, uploadAudio, uploadDocument,
  uploadToCloud, fileUrl, ensureUploadDirs,
} from '../services/storage';
import { env } from '../config/env';
import { AppError } from '../middleware/errorHandler';
import { prisma } from '../config/database';

const router = Router();

function resolveUrl(req: AuthRequest, subdir: string): string {
  if (env.STORAGE_MODE === 'local') {
    ensureUploadDirs();
    return fileUrl(path.basename(req.file!.path), subdir);
  }
  // cloud modes return URL after upload — handled in route body
  return '';
}

// POST /uploads/image
router.post('/image', authenticate, uploadImage.single('file'), async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.file) throw new AppError('No file provided', 400);
  const url = env.STORAGE_MODE === 'local'
    ? fileUrl(path.basename(req.file.path), 'images')
    : await uploadToCloud(req.file, 'images');
  res.json({ url, size: req.file.size });
});

// POST /uploads/audio
router.post('/audio', authenticate, uploadAudio.single('file'), async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.file) throw new AppError('No file provided', 400);
  const url = env.STORAGE_MODE === 'local'
    ? fileUrl(path.basename(req.file.path), 'audio')
    : await uploadToCloud(req.file, 'audio');
  res.json({ url, size: req.file.size });
});

// POST /uploads/avatar — uploads photo and updates the user's profilePhoto
router.post('/avatar', authenticate, uploadImage.single('file'), async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.file) throw new AppError('No file provided', 400);
  const url = env.STORAGE_MODE === 'local'
    ? fileUrl(path.basename(req.file.path), 'avatars')
    : await uploadToCloud(req.file, 'avatars');

  // Persist immediately so the next profile fetch returns the new photo
  await prisma.user.update({
    where: { id: req.user!.id },
    data: { profilePhoto: url },
  });

  res.json({ url });
});

// POST /uploads/document
router.post('/document', authenticate, uploadDocument.single('file'), async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.file) throw new AppError('No file provided', 400);
  const url = env.STORAGE_MODE === 'local'
    ? fileUrl(path.basename(req.file.path), 'documents')
    : await uploadToCloud(req.file, 'documents');
  res.json({ url, size: req.file.size });
});

export default router;
