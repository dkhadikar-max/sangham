-- Same class of bug already fixed for messages: these FKs were
-- ON DELETE RESTRICT, so deleting a user who has ever organized an
-- event, owned a project, or hosted a live session fails outright.
-- Found while cleaning up test data for the Events feature fix.
ALTER TABLE "events" DROP CONSTRAINT IF EXISTS "events_organiser_id_fkey";
ALTER TABLE "events" ADD CONSTRAINT "events_organiser_id_fkey" FOREIGN KEY ("organiser_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "projects" DROP CONSTRAINT IF EXISTS "projects_owner_id_fkey";
ALTER TABLE "projects" ADD CONSTRAINT "projects_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "live_sessions" DROP CONSTRAINT IF EXISTS "live_sessions_host_id_fkey";
ALTER TABLE "live_sessions" ADD CONSTRAINT "live_sessions_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
