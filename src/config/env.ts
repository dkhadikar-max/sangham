import dotenv from 'dotenv';
dotenv.config();

const required = (key: string): string => {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
};

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '4000', 10),
  API_VERSION: process.env.API_VERSION || 'v1',

  DATABASE_URL: required('DATABASE_URL'),
  DIRECT_URL:   process.env.DIRECT_URL || '',
  REDIS_URL:    process.env.REDIS_URL || '',   // blank = Redis disabled (app still starts)

  JWT_SECRET: required('JWT_SECRET'),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '30d',

  // Storage — local disk in dev, r2 (preferred) or s3 in production
  STORAGE_MODE: (process.env.STORAGE_MODE || 'local') as 'local' | 'r2' | 's3',
  UPLOADS_DIR: process.env.UPLOADS_DIR || 'uploads',

  // Cloudflare R2 (preferred — used when STORAGE_MODE=r2)
  R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID || '',
  R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID || '',
  R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY || '',
  R2_BUCKET: process.env.R2_BUCKET || '',
  R2_PUBLIC_URL: process.env.R2_PUBLIC_URL || '',  // e.g. https://assets.sangham.online

  // AWS S3 (legacy — used when STORAGE_MODE=s3)
  AWS_REGION: process.env.AWS_REGION || 'ap-south-1',
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || '',
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || '',
  AWS_S3_BUCKET: process.env.AWS_S3_BUCKET || '',
  AWS_CLOUDFRONT_DOMAIN: process.env.AWS_CLOUDFRONT_DOMAIN || '',

  // Razorpay (Dhamma Daan payments)
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || '',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || '',

  AGORA_APP_ID: process.env.AGORA_APP_ID || '',
  AGORA_APP_CERTIFICATE: process.env.AGORA_APP_CERTIFICATE || '',

  ELASTICSEARCH_URL: process.env.ELASTICSEARCH_URL || '',

  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
  GEMINI_API_KEY:    process.env.GEMINI_API_KEY    || '',

  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
};
