/**
 * Upload route — single endpoint for all file uploads
 * Local dev:  saves to /uploads/{subdir}/, returns relative URL
 * Production: proxies to S3, returns CloudFront URL
 */
import { Router, Response } from 'express';
import path from 'path';
import { authenticate, AuthRequest } from '../middleware/auth';
import { uploadImage, uploadAudio, uploadVideo, uploadAny, uploadToS3, fileUrl, ensureUploadDirs } from '../services/storage';
import { env } from '../config/env';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// POST /uploads/image
router.post('/image', authenticate, uploadImage.single('file'), async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.file) throw new AppError('No file provided', 400);
  let url: string;
  if (env.STORAGE_MODE === 's3') {
    url = await uploadToS3(req.file, 'images');
  } else {
    url = fileUrl(path.basename(req.file.path), 'images');
  }
  res.json({ url, filename: path.basename(req.file.filename || req.file.originalname), size: req.file.size });
});

// POST /uploads/audio
router.post('/audio', authenticate, uploadAudio.single('file'), async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.file) throw new AppError('No file provided', 400);
  let url: string;
  if (env.STORAGE_MODE === 's3') {
    url = await uploadToS3(req.file, 'audio');
  } else {
    url = fileUrl(path.basename(req.file.path), 'audio');
  }
  res.json({ url, filename: path.basename(req.file.filename || req.file.originalname), size: req.file.size });
});

// POST /uploads/avatar  (profile photo)
router.post('/avatar', authenticate, uploadImage.single('file'), async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.file) throw new AppError('No file provided', 400);
  let url: string;
  if (env.STORAGE_MODE === 's3') {
    url = await uploadToS3(req.file, 'avatars');
  } else {
    url = fileUrl(path.basename(req.file.path), 'avatars');
  }
  res.json({ url });
});

// POST /uploads/document  (clergy verification docs etc.)
router.post('/document', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { default: uploadMiddleware } = await import('../services/storage').then(m => ({ default: m.uploadDocument }));
  uploadMiddleware.single('file')(req as any, res as any, async (err) => {
    if (err) { res.status(400).json({ error: err.message }); return; }
    if (!req.file) { res.status(400).json({ error: 'No file provided' }); return; }
    let url: string;
    if (env.STORAGE_MODE === 's3') {
      url = await uploadToS3(req.file, 'documents');
    } else {
      url = fileUrl(path.basename(req.file.path), 'documents');
    }
    res.json({ url });
  });
});

export default router;
