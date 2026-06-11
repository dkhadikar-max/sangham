-- Migration: Reader progress tracking + highlights
-- Created: 2026-06-12

-- Reading progress (per user per text)
CREATE TABLE "reading_progress" (
  "id"                TEXT          NOT NULL DEFAULT gen_random_uuid()::text,
  "user_id"           TEXT          NOT NULL,
  "text_id"           TEXT          NOT NULL,
  "current_segment"   INTEGER       NOT NULL DEFAULT 0,
  "percent_complete"  DECIMAL(5,2)  NOT NULL DEFAULT 0,
  "is_completed"      BOOLEAN       NOT NULL DEFAULT false,
  "last_read_at"      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  "time_spent_seconds" INTEGER      NOT NULL DEFAULT 0,
  CONSTRAINT "reading_progress_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "reading_progress_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "reading_progress_text_id_fkey"
    FOREIGN KEY ("text_id") REFERENCES "library_texts"("id") ON DELETE CASCADE,
  CONSTRAINT "reading_progress_user_id_text_id_key" UNIQUE ("user_id", "text_id")
);
CREATE INDEX "reading_progress_user_id_idx" ON "reading_progress"("user_id");

-- Highlights (character-level, per segment)
CREATE TABLE "highlights" (
  "id"            TEXT          NOT NULL DEFAULT gen_random_uuid()::text,
  "user_id"       TEXT          NOT NULL,
  "text_id"       TEXT          NOT NULL,
  "segment_id"    TEXT          NOT NULL,
  "selected_text" TEXT          NOT NULL,
  "color"         TEXT          NOT NULL DEFAULT '#FEF08A',
  "note"          VARCHAR(1000),
  "is_public"     BOOLEAN       NOT NULL DEFAULT false,
  "created_at"    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  "updated_at"    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT "highlights_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "highlights_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "highlights_text_id_fkey"
    FOREIGN KEY ("text_id") REFERENCES "library_texts"("id") ON DELETE CASCADE,
  CONSTRAINT "highlights_segment_id_fkey"
    FOREIGN KEY ("segment_id") REFERENCES "library_segments"("id") ON DELETE CASCADE
);
CREATE INDEX "highlights_user_id_text_id_idx" ON "highlights"("user_id", "text_id");
