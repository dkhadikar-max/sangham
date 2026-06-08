/**
 * Storage Service
 *
 * STORAGE_MODE=local  → saves files to /uploads on disk (dev only)
 * STORAGE_MODE=r2     → Cloudflare R2 (preferred for production)
 * STORAGE_MODE=s3     → AWS S3 (legacy / alternative)
 *
 * R2 is S3-compatible; both modes use @aws-sdk/client-s3 with different endpoints.
 */
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
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
  if (ALLOWED_IMAGE.includes(mime)) return 'images';
  if (ALLOWED_AUDIO.includes(mime)) return 'audio';
  if (ALLOWED_VIDEO.includes(mime)) return 'video';
  if (ALLOWED_DOC.includes(mime))   return 'documents';
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

// ── S3 / R2 client factory ────────────────────────────────────────────────────
function getCloudClient(): S3Client {
  if (env.STORAGE_MODE === 'r2') {
    return new S3Client({
      region: 'auto',
      endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      },
    });
  }
  // AWS S3
  return new S3Client({
    region: env.AWS_REGION,
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    },
  });
}

function cloudBucket(): string {
  return env.STORAGE_MODE === 'r2' ? env.R2_BUCKET : env.AWS_S3_BUCKET;
}

// ── Multer: local disk storage ────────────────────────────────────────────────
const localDiskStorage = multer.diskStorage({
  destination: (_req: Request, file, cb) => {
    ensureUploadDirs();
    cb(null, path.join(UPLOADS_ROOT, subDirForMime(file.mimetype)));
  },
  filename: (_req: Request, file, cb) => {
    const ext = extForMime(file.mimetype) || path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

// ── Multer: memory storage (for cloud upload passthrough) ─────────────────────
const memStorage = multer.memoryStorage();

const fileFilter = (allowedTypes: string[]) =>
  (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (allowedTypes.includes(file.mimetype)) cb(null, true);
    else cb(new Error(`File type ${file.mimetype} not allowed`));
  };

// ── Multer middleware ─────────────────────────────────────────────────────────
const storage = env.STORAGE_MODE === 'local' ? localDiskStorage : memStorage;

export const uploadImage    = multer({ storage, limits: { fileSize: LIMITS.image },    fileFilter: fileFilter(ALLOWED_IMAGE) });
export const uploadAudio    = multer({ storage, limits: { fileSize: LIMITS.audio },    fileFilter: fileFilter(ALLOWED_AUDIO) });
export const uploadVideo    = multer({ storage, limits: { fileSize: LIMITS.video },    fileFilter: fileFilter(ALLOWED_VIDEO) });
export const uploadDocument = multer({ storage, limits: { fileSize: LIMITS.document }, fileFilter: fileFilter(ALLOWED_DOC) });
export const uploadAny      = multer({ storage, limits: { fileSize: LIMITS.video },    fileFilter: fileFilter(ALLOWED_ALL) });

// ── URL builders ──────────────────────────────────────────────────────────────
export function localFileUrl(req: Request, relativePath: string): string {
  return `${req.protocol}://${req.get('host')}/uploads/${relativePath}`;
}

export function cloudFileUrl(key: string): string {
  if (env.STORAGE_MODE === 'r2') {
    return `${env.R2_PUBLIC_URL.replace(/\/$/, '')}/${key}`;
  }
  // AWS S3 / CloudFront
  if (env.AWS_CLOUDFRONT_DOMAIN) {
    return `https://${env.AWS_CLOUDFRONT_DOMAIN}/${key}`;
  }
  return `https://${env.AWS_S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;
}

/** Returns the public URL for a just-saved local file (subdir/filename form). */
export function fileUrl(filename: string, subdir: string): string {
  if (env.STORAGE_MODE !== 'local') {
    return cloudFileUrl(`${subdir}/${filename}`);
  }
  return `/uploads/${subdir}/${filename}`;
}

// ── Cloud upload ──────────────────────────────────────────────────────────────
export async function uploadToCloud(
  file: Express.Multer.File,
  subdir: string
): Promise<string> {
  const key = `${subdir}/${uuidv4()}${extForMime(file.mimetype)}`;
  const client = getCloudClient();
  await client.send(new PutObjectCommand({
    Bucket: cloudBucket(),
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    // Public read via bucket policy / R2 custom domain — not ACL
  }));
  return cloudFileUrl(key);
}

/** @deprecated — kept for callers that haven't migrated yet */
export const uploadToS3 = uploadToCloud;

// ── Delete file ───────────────────────────────────────────────────────────────
export async function deleteFile(urlOrPath: string): Promise<void> {
  if (env.STORAGE_MODE === 'local') {
    const rel = urlOrPath.replace(/^.*\/uploads\//, '');
    const abs = path.join(UPLOADS_ROOT, rel);
    if (fs.existsSync(abs)) fs.unlinkSync(abs);
    return;
  }
  // Extract object key from URL
  const publicBase = env.STORAGE_MODE === 'r2'
    ? env.R2_PUBLIC_URL.replace(/\/$/, '')
    : (env.AWS_CLOUDFRONT_DOMAIN ? `https://${env.AWS_CLOUDFRONT_DOMAIN}` : '');
  const key = publicBase
    ? urlOrPath.replace(publicBase + '/', '')
    : new URL(urlOrPath).pathname.slice(1);

  const client = getCloudClient();
  await client.send(new DeleteObjectCommand({ Bucket: cloudBucket(), Key: key }));
}
