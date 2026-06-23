-- Migration: Sangham Educate — Learning Path System
-- Created: 2026-06-23
-- All statements are idempotent (safe to re-run)

-- Enums
DO $$ BEGIN
  CREATE TYPE "EducateDomain" AS ENUM (
    'AI_AUTOMATION',
    'ENTREPRENEURSHIP',
    'SALES',
    'LEADERSHIP',
    'NETWORKING',
    'WEALTH_FUNDAMENTALS',
    'BUDDHISM_MEDITATION'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "EducateLevel" AS ENUM (
    'EXPLORER',
    'LEARNER',
    'PRACTITIONER',
    'CONTRIBUTOR',
    'MENTOR'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Predefined learning paths (seeded, not user-created)
CREATE TABLE IF NOT EXISTS "educate_paths" (
  "id"          TEXT              NOT NULL DEFAULT gen_random_uuid()::text,
  "slug"        TEXT              NOT NULL,
  "domain"      "EducateDomain"   NOT NULL,
  "title"       TEXT              NOT NULL,
  "tagline"     TEXT              NOT NULL,
  "description" TEXT              NOT NULL,
  "phases"      JSONB             NOT NULL DEFAULT '[]',
  "circle_tag"  TEXT,
  "is_active"   BOOLEAN           NOT NULL DEFAULT true,
  "sort_order"  INTEGER           NOT NULL DEFAULT 0,
  "created_at"  TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  CONSTRAINT "educate_paths_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "educate_paths_slug_key" UNIQUE ("slug")
);

-- User enrollments in a learning path
CREATE TABLE IF NOT EXISTS "educate_enrollments" (
  "id"               TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
  "user_id"          TEXT        NOT NULL,
  "path_id"          TEXT        NOT NULL,
  "enrolled_at"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "last_activity_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "current_phase"    INTEGER     NOT NULL DEFAULT 0,
  "current_lesson"   INTEGER     NOT NULL DEFAULT 0,
  "percent_complete" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "streak"           INTEGER     NOT NULL DEFAULT 0,
  CONSTRAINT "educate_enrollments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "educate_enrollments_user_id_path_id_key" UNIQUE ("user_id", "path_id"),
  CONSTRAINT "educate_enrollments_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "educate_enrollments_path_id_fkey"
    FOREIGN KEY ("path_id") REFERENCES "educate_paths"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "educate_enrollments_user_id_idx" ON "educate_enrollments"("user_id");

-- Per-lesson completion tracking
CREATE TABLE IF NOT EXISTS "educate_lesson_progress" (
  "id"            TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
  "enrollment_id" TEXT        NOT NULL,
  "lesson_key"    TEXT        NOT NULL,
  "completed_at"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "exercise_done" BOOLEAN     NOT NULL DEFAULT false,
  CONSTRAINT "educate_lesson_progress_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "educate_lesson_progress_enrollment_id_lesson_key_key" UNIQUE ("enrollment_id", "lesson_key"),
  CONSTRAINT "educate_lesson_progress_enrollment_id_fkey"
    FOREIGN KEY ("enrollment_id") REFERENCES "educate_enrollments"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "educate_lesson_progress_enrollment_id_idx" ON "educate_lesson_progress"("enrollment_id");

-- User reputation in Educate
CREATE TABLE IF NOT EXISTS "educate_user_reputation" (
  "id"              TEXT           NOT NULL DEFAULT gen_random_uuid()::text,
  "user_id"         TEXT           NOT NULL,
  "level"           "EducateLevel" NOT NULL DEFAULT 'EXPLORER',
  "total_lessons"   INTEGER        NOT NULL DEFAULT 0,
  "total_paths"     INTEGER        NOT NULL DEFAULT 0,
  "total_exercises" INTEGER        NOT NULL DEFAULT 0,
  "longest_streak"  INTEGER        NOT NULL DEFAULT 0,
  "updated_at"      TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  CONSTRAINT "educate_user_reputation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "educate_user_reputation_user_id_key" UNIQUE ("user_id"),
  CONSTRAINT "educate_user_reputation_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);
