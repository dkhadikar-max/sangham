-- Performance: cover the conversation list query (WHERE recipient_id = ? ORDER BY created_at DESC)
CREATE INDEX IF NOT EXISTS "messages_recipient_id_created_at_idx" ON "messages"("recipient_id", "created_at" DESC);
