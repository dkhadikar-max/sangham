/**
 * Storage Service — local dev vs S3 production
 *
 * STORAGE_MODE=local  → saves files to /uploads on disk, served by Express
 * STORAGE_MODE=s3     → uploads to AWS S3, returns CloudFront URL
 *
 * Switching between modes requires only changing STORAGE_MODE in .env.
 * All routes call storage.upload() and storage.delete() — never touch multer directly.
 */
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import { Request } from 'express';
import { env } from '../config/env';

// ── Allowed MIME types ────────────────────────────────────────────────────────
const ALLOWED_IMAGE = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_AUDIO = ['audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/wav'];
const ALLOWED_VIDEO = ['video/mp4', 'video/webm'];
const ALLOWED_DOC   = ['application/pdf'];
export const ALLOWED_ALL = [...ALLOWED_IMAGE, ...ALLOWED_AUDIO, ...ALLOWED_VIDEO, ...ALLOWED_DOC];

// ── File size limits ──────────────────────────────────────────────────────────
export const LIMITS = {
  image:    10 * 1024 * 1024,  // 10 MB
  audio:    50 * 1024 * 1024,  // 50 MB
  video:   200 * 1024 * 1024,  // 200 MB
  document: 20 * 1024 * 1024,  // 20 MB
};

// ── Local storage setup ───────────────────────────────────────────────────────
const UPLOADS_ROOT = path.resolve(env.UPLOADS_DIR);
const SUBDIRS = ['images', 'audio', 'video', 'documents', 'avatars', 'covers'];

export function ensureUploadDirs(): void {
  SUBDIRS.forEach(sub => {
    const dir = path.join(UPLOADS_ROOT, sub);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });
}

function subDirForMime(mime: string): string {
  if (ALLOWED_IMAGE.includes(mime))    return 'images';
  if (ALLOWED_AUDIO.includes(mime))    return 'audio';
  if (ALLOWED_VIDEO.includes(mime))    return 'video';
  if (ALLOWED_DOC.includes(mime))      return 'documents';
  return 'images';
}

function extForMime(mime: string): string {
  const map: Record<string, string> = {
    'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif',
    'audio/mpeg': '.mp3', 'audio/mp4': '.m4a', 'audio/ogg': '.ogg', 'audio/wav': '.wav',
    'video/mp4': '.mp4', 'video/webm': '.webm',
    'application/pdf': '.pdf',
  };
  return map[mime] || '';
}

// ── Multer: local disk storage ────────────────────────────────────────────────
const localDiskStorage = multer.diskStorage({
  destination: (_req: Request, file, cb) => {
    ensureUploadDirs();
    cb(null, path.join(UPLOADS_ROOT, subDirForMime(file.mimetype)));
  },
  filename: (_req: Request, file, cb) => {
    const unique = uuidv4();
    const ext = extForMime(file.mimetype) || path.extname(file.originalname);
    cb(null, `${unique}${ext}`);
  },
});

// ── Multer: memory storage (for S3 passthrough) ───────────────────────────────
const memoryStorage = multer.memoryStorage();

const fileFilter = (allowedTypes: string[]) =>
  (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (allowedTypes.includes(file.mimetype)) cb(null, true);
    else cb(new Error(`File type ${file.mimetype} not allowed`));
  };

// ── Multer middleware factories ───────────────────────────────────────────────
const storage = env.STORAGE_MODE === 's3' ? memoryStorage : localDiskStorage;

export const uploadImage    = multer({ storage, limits: { fileSize: LIMITS.image },    fileFilter: fileFilter(ALLOWED_IMAGE) });
export const uploadAudio    = multer({ storage, limits: { fileSize: LIMITS.audio },    fileFilter: fileFilter(ALLOWED_AUDIO) });
export const uploadVideo    = multer({ storage, limits: { fileSize: LIMITS.video },    fileFilter: fileFilter(ALLOWED_VIDEO) });
export const uploadDocument = multer({ storage, limits: { fileSize: LIMITS.document }, fileFilter: fileFilter(ALLOWED_DOC) });
export const uploadAny      = multer({ storage, limits: { fileSize: LIMITS.video },    fileFilter: fileFilter(ALLOWED_ALL) });

// ── URL builder ───────────────────────────────────────────────────────────────
export function localFileUrl(req: Request, relativePath: string): string {
  const host = `${req.protocol}://${req.get('host')}`;
  return `${host}/uploads/${relativePath}`;
}

export function fileUrl(filename: string, subdir: string): string {
  if (env.STORAGE_MODE === 's3' && env.AWS_CLOUDFRONT_DOMAIN) {
    return `https://${env.AWS_CLOUDFRONT_DOMAIN}/${subdir}/${filename}`;
  }
  return `/uploads/${subdir}/${filename}`;
}

// ── S3 upload (only used in production) ──────────────────────────────────────
export async function uploadToS3(
  file: Express.Multer.File,
  subdir: string
): Promise<string> {
  if (env.STORAGE_MODE !== 's3') {
    throw new Error('uploadToS3 called in local mode');
  }
  // Lazy import — keeps AWS SDK out of the local dev bundle entirely
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore -- @aws-sdk/client-s3 is an optional prod dependency; only reachable when STORAGE_MODE=s3
  const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
  const client = new S3Client({
    region: env.AWS_REGION,
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    },
  });
  const key = `${subdir}/${uuidv4()}${extForMime(file.mimetype)}`;
  await client.send(new PutObjectCommand({
    Bucket: env.AWS_S3_BUCKET,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  }));
  return fileUrl(key.split('/')[1], subdir);
}

// ── Delete file ───────────────────────────────────────────────────────────────
export async function deleteFile(urlOrPath: string): Promise<void> {
  if (env.STORAGE_MODE === 'local') {
    // Extract relative path from URL like /uploads/images/uuid.jpg
    const rel = urlOrPath.replace(/^.*\/uploads\//, '');
    const abs = path.join(UPLOADS_ROOT, rel);
    if (fs.existsSync(abs)) fs.unlinkSync(abs);
    return;
  }
  // S3 delete — lazy import
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore -- optional prod dependency
  const { S3Client, DeleteObjectCommand } = await import('@aws-sdk/client-s3');
  const client = new S3Client({ region: env.AWS_REGION });
  const key = new URL(urlOrPath).pathname.slice(1);
  await client.send(new DeleteObjectCommand({ Bucket: env.AWS_S3_BUCKET, Key: key }));
}
