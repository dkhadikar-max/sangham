-- Community Knowledge & Contribution Ecosystem
-- Adds: Resources, Courses, Study Circles, Discussion Threads, Community Modules
-- Extends: ContributionScore with knowledge contribution fields

-- ── Enums ────────────────────────────────────────────────────────────────────

CREATE TYPE "ResourceType" AS ENUM (
  'YOUTUBE_VIDEO', 'YOUTUBE_PLAYLIST', 'PDF', 'ARTICLE',
  'RESEARCH_PAPER', 'WORKSHOP_RECORDING', 'GUIDE', 'BOOK_SUMMARY'
);

CREATE TYPE "CourseStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

CREATE TYPE "StudyCircleStatus" AS ENUM ('OPEN', 'ACTIVE', 'CLOSED');

-- ── community_modules ────────────────────────────────────────────────────────

CREATE TABLE "community_modules" (
    "id"                   TEXT NOT NULL,
    "association_id"       TEXT NOT NULL,
    "learning_enabled"     BOOLEAN NOT NULL DEFAULT true,
    "projects_enabled"     BOOLEAN NOT NULL DEFAULT true,
    "circles_enabled"      BOOLEAN NOT NULL DEFAULT true,
    "contribution_enabled" BOOLEAN NOT NULL DEFAULT true,
    "updated_at"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "community_modules_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "community_modules_association_id_key"
    ON "community_modules"("association_id");

ALTER TABLE "community_modules"
    ADD CONSTRAINT "community_modules_association_id_fkey"
    FOREIGN KEY ("association_id") REFERENCES "associations"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- ── resources ────────────────────────────────────────────────────────────────

CREATE TABLE "resources" (
    "id"              TEXT NOT NULL,
    "type"            "ResourceType" NOT NULL,
    "title"           VARCHAR(200) NOT NULL,
    "description"     TEXT,
    "url"             TEXT NOT NULL,
    "thumbnail_url"   TEXT,
    "creator"         VARCHAR(200),
    "duration_secs"   INTEGER,
    "language"        TEXT NOT NULL DEFAULT 'en',
    "contributor_id"  TEXT NOT NULL,
    "association_id"  TEXT,
    "project_id"      TEXT,
    "is_published"    BOOLEAN NOT NULL DEFAULT true,
    "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "resources_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "resources_association_id_idx" ON "resources"("association_id");
CREATE INDEX "resources_type_idx"           ON "resources"("type");

ALTER TABLE "resources"
    ADD CONSTRAINT "resources_contributor_id_fkey"
    FOREIGN KEY ("contributor_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "resources"
    ADD CONSTRAINT "resources_association_id_fkey"
    FOREIGN KEY ("association_id") REFERENCES "associations"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "resources"
    ADD CONSTRAINT "resources_project_id_fkey"
    FOREIGN KEY ("project_id") REFERENCES "projects"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- ── courses ──────────────────────────────────────────────────────────────────

CREATE TABLE "courses" (
    "id"              TEXT NOT NULL,
    "association_id"  TEXT NOT NULL,
    "title"           VARCHAR(200) NOT NULL,
    "description"     TEXT,
    "instructor_id"   TEXT,
    "language"        TEXT NOT NULL DEFAULT 'en',
    "status"          "CourseStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "courses_association_id_idx" ON "courses"("association_id");

ALTER TABLE "courses"
    ADD CONSTRAINT "courses_association_id_fkey"
    FOREIGN KEY ("association_id") REFERENCES "associations"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "courses"
    ADD CONSTRAINT "courses_instructor_id_fkey"
    FOREIGN KEY ("instructor_id") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- ── course_lessons ────────────────────────────────────────────────────────────

CREATE TABLE "course_lessons" (
    "id"           TEXT NOT NULL,
    "course_id"    TEXT NOT NULL,
    "title"        VARCHAR(200) NOT NULL,
    "content"      TEXT,
    "resource_id"  TEXT,
    "sequence"     INTEGER NOT NULL DEFAULT 0,
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "course_lessons_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "course_lessons_course_id_idx" ON "course_lessons"("course_id");

ALTER TABLE "course_lessons"
    ADD CONSTRAINT "course_lessons_course_id_fkey"
    FOREIGN KEY ("course_id") REFERENCES "courses"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "course_lessons"
    ADD CONSTRAINT "course_lessons_resource_id_fkey"
    FOREIGN KEY ("resource_id") REFERENCES "resources"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- ── study_circles ─────────────────────────────────────────────────────────────

CREATE TABLE "study_circles" (
    "id"                   TEXT NOT NULL,
    "association_id"       TEXT NOT NULL,
    "topic"                VARCHAR(200) NOT NULL,
    "description"          TEXT,
    "facilitator_id"       TEXT NOT NULL,
    "schedule_description" VARCHAR(300),
    "status"               "StudyCircleStatus" NOT NULL DEFAULT 'OPEN',
    "event_id"             TEXT,
    "created_at"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "study_circles_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "study_circles_association_id_idx" ON "study_circles"("association_id");

ALTER TABLE "study_circles"
    ADD CONSTRAINT "study_circles_association_id_fkey"
    FOREIGN KEY ("association_id") REFERENCES "associations"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "study_circles"
    ADD CONSTRAINT "study_circles_facilitator_id_fkey"
    FOREIGN KEY ("facilitator_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "study_circles"
    ADD CONSTRAINT "study_circles_event_id_fkey"
    FOREIGN KEY ("event_id") REFERENCES "events"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- ── study_circle_members ──────────────────────────────────────────────────────

CREATE TABLE "study_circle_members" (
    "id"              TEXT NOT NULL,
    "study_circle_id" TEXT NOT NULL,
    "user_id"         TEXT NOT NULL,
    "joined_at"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "study_circle_members_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "study_circle_members_study_circle_id_user_id_key"
    ON "study_circle_members"("study_circle_id", "user_id");

ALTER TABLE "study_circle_members"
    ADD CONSTRAINT "study_circle_members_study_circle_id_fkey"
    FOREIGN KEY ("study_circle_id") REFERENCES "study_circles"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "study_circle_members"
    ADD CONSTRAINT "study_circle_members_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- ── discussion_threads ────────────────────────────────────────────────────────

CREATE TABLE "discussion_threads" (
    "id"              TEXT NOT NULL,
    "title"           VARCHAR(200) NOT NULL,
    "course_id"       TEXT,
    "resource_id"     TEXT,
    "study_circle_id" TEXT,
    "project_id"      TEXT,
    "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "discussion_threads_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "discussion_threads_course_id_key"       ON "discussion_threads"("course_id")       WHERE "course_id" IS NOT NULL;
CREATE UNIQUE INDEX "discussion_threads_resource_id_key"     ON "discussion_threads"("resource_id")     WHERE "resource_id" IS NOT NULL;
CREATE UNIQUE INDEX "discussion_threads_study_circle_id_key" ON "discussion_threads"("study_circle_id") WHERE "study_circle_id" IS NOT NULL;
CREATE UNIQUE INDEX "discussion_threads_project_id_key"      ON "discussion_threads"("project_id")      WHERE "project_id" IS NOT NULL;

ALTER TABLE "discussion_threads"
    ADD CONSTRAINT "discussion_threads_course_id_fkey"
    FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "discussion_threads"
    ADD CONSTRAINT "discussion_threads_resource_id_fkey"
    FOREIGN KEY ("resource_id") REFERENCES "resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "discussion_threads"
    ADD CONSTRAINT "discussion_threads_study_circle_id_fkey"
    FOREIGN KEY ("study_circle_id") REFERENCES "study_circles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "discussion_threads"
    ADD CONSTRAINT "discussion_threads_project_id_fkey"
    FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── discussion_posts ──────────────────────────────────────────────────────────

CREATE TABLE "discussion_posts" (
    "id"         TEXT NOT NULL,
    "thread_id"  TEXT NOT NULL,
    "author_id"  TEXT NOT NULL,
    "content"    VARCHAR(2000) NOT NULL,
    "parent_id"  TEXT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "discussion_posts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "discussion_posts_thread_id_idx" ON "discussion_posts"("thread_id");

ALTER TABLE "discussion_posts"
    ADD CONSTRAINT "discussion_posts_thread_id_fkey"
    FOREIGN KEY ("thread_id") REFERENCES "discussion_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "discussion_posts"
    ADD CONSTRAINT "discussion_posts_author_id_fkey"
    FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── Extend contribution_scores ────────────────────────────────────────────────

ALTER TABLE "contribution_scores"
    ADD COLUMN "resources_shared"         INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "courses_created"          INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "study_circles_facilitated" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "projects_joined"          INTEGER NOT NULL DEFAULT 0;
