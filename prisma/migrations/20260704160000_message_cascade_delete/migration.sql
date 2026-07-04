-- Messages: sender/recipient FKs were ON DELETE RESTRICT, which blocks
-- deleting any user who has ever sent or received a message. Now that
-- the /conversations API actually creates messages, this is reachable
-- in practice (e.g. admin user deletion). Switch to CASCADE so deleting
-- a user also removes their messages, matching the rest of the schema.
ALTER TABLE "messages" DROP CONSTRAINT IF EXISTS "messages_sender_id_fkey";
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "messages" DROP CONSTRAINT IF EXISTS "messages_recipient_id_fkey";
ALTER TABLE "messages" ADD CONSTRAINT "messages_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
