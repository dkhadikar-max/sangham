-- Add preferred_language to users table for i18n support
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "preferred_language" VARCHAR(10) NOT NULL DEFAULT 'en';
