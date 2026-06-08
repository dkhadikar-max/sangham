-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('GUEST', 'PRACTITIONER', 'TRUSTED', 'BHIKKHU', 'BHIKKHUNI', 'SCHOLAR', 'ASSOCIATION_ADMIN', 'MODERATOR', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "Tradition" AS ENUM ('THERAVADA', 'MAHAYANA', 'VAJRAYANA', 'NAVAYANA', 'OTHER', 'MULTIPLE');

-- CreateEnum
CREATE TYPE "PostType" AS ENUM ('TEXT', 'IMAGE', 'AUDIO', 'LINK', 'QUOTE');

-- CreateEnum
CREATE TYPE "SessionType" AS ENUM ('DHARMA_TALK', 'GUIDED_MEDITATION', 'SUTTA_STUDY', 'QA', 'CEREMONY', 'TELECAST');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('SCHEDULED', 'LIVE', 'ENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('RETREAT', 'CEREMONY', 'TALK', 'SEMINAR', 'PROTEST_MARCH', 'COMMUNITY_GATHERING', 'DHAMMA_DIKSHA', 'CONVERSION_CEREMONY', 'AMBEDKAR_JAYANTI');

-- CreateEnum
CREATE TYPE "RsvpStatus" AS ENUM ('GOING', 'MAYBE', 'NOT_GOING');

-- CreateEnum
CREATE TYPE "AssociationCategory" AS ENUM ('TEMPLE', 'NGO', 'STUDY_GROUP', 'AMBEDKARITE_SANGHA', 'UNIVERSITY_CLUB', 'NATIONAL_FEDERATION', 'INTERNATIONAL_BODY');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ContentLicence" AS ENUM ('CC0', 'CC_BY', 'CC_BY_SA', 'CC_BY_NC', 'CC_BY_NC_ND', 'PUBLIC_DOMAIN', 'MIXED');

-- CreateEnum
CREATE TYPE "ApproximateDistance" AS ENUM ('WITHIN_2KM', 'WITHIN_5KM', 'WITHIN_10KM', 'SAME_CITY', 'SAME_STATE', 'SAME_COUNTRY');

-- CreateEnum
CREATE TYPE "LocationVisibility" AS ENUM ('HIDDEN', 'APPROXIMATE', 'CITY_ONLY', 'STATE_ONLY', 'COUNTRY_ONLY');

-- CreateEnum
CREATE TYPE "ProfessionalTag" AS ENUM ('ENTREPRENEUR', 'FOUNDER', 'STUDENT', 'DEVELOPER', 'RESEARCHER', 'TRANSLATOR', 'VOLUNTEER', 'TEACHER', 'ARTIST', 'WRITER', 'CIVIL_SERVANT', 'PROFESSIONAL', 'ACTIVIST', 'MEDITATOR', 'CAREGIVER', 'RETIRED');

-- CreateEnum
CREATE TYPE "IntentCategory" AS ENUM ('MEDITATION_PARTNER', 'STUDY_GROUP', 'LOCAL_SANGHA', 'SEEKING_VOLUNTEERS', 'SEEKING_TRANSLATORS', 'BUDDHIST_FOUNDERS', 'BHIKKHU_GUIDANCE', 'EVENT_COLLABORATORS', 'DHARMA_DISCUSSION', 'LANGUAGE_EXCHANGE', 'MENTORSHIP', 'SKILL_SHARE');

-- CreateEnum
CREATE TYPE "IntentStatus" AS ENUM ('OPEN', 'CLOSED', 'FULFILLED');

-- CreateEnum
CREATE TYPE "IntentScope" AS ENUM ('NEARBY', 'CITY', 'STATE', 'COUNTRY', 'GLOBAL');

-- CreateEnum
CREATE TYPE "VisibilityLevel" AS ENUM ('PUBLIC', 'COMMUNITY', 'CONNECTIONS', 'ANONYMOUS');

-- CreateEnum
CREATE TYPE "MessagingPermission" AS ENUM ('EVERYONE', 'CONNECTIONS_ONLY', 'NOBODY');

-- CreateEnum
CREATE TYPE "TeacherVerificationStatus" AS ENUM ('NOT_APPLIED', 'PENDING', 'VERIFIED', 'REJECTED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "firebase_uid" TEXT,
    "display_name" TEXT NOT NULL,
    "bio" VARCHAR(500),
    "profile_photo" TEXT,
    "cover_image" TEXT,
    "country" TEXT,
    "city" TEXT,
    "traditions" "Tradition"[],
    "role" "UserRole" NOT NULL DEFAULT 'PRACTITIONER',
    "is_verified_clergy" BOOLEAN NOT NULL DEFAULT false,
    "languages" TEXT[],
    "temple_affiliation" TEXT,
    "password_hash" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_active_at" TIMESTAMP(3),
    "is_verified_teacher" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "follows" (
    "id" TEXT NOT NULL,
    "follower_id" TEXT NOT NULL,
    "followed_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "follows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clergy_applications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "ordination_doc" TEXT,
    "abbot_letter" TEXT,
    "temple_affiliation" TEXT NOT NULL,
    "vinaya_tradition" TEXT NOT NULL,
    "notes" TEXT,
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clergy_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posts" (
    "id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "content" VARCHAR(1000),
    "post_type" "PostType" NOT NULL DEFAULT 'TEXT',
    "media_urls" TEXT[],
    "link_url" TEXT,
    "link_preview" JSONB,
    "tradition_tags" "Tradition"[],
    "library_ref_id" TEXT,
    "is_bhikkhu_post" BOOLEAN NOT NULL DEFAULT false,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "content" VARCHAR(500) NOT NULL,
    "parent_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "likes" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "library_collections" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tradition" "Tradition" NOT NULL,
    "description" TEXT,
    "source_url" TEXT,
    "licence" "ContentLicence" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "library_collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "library_texts" (
    "id" TEXT NOT NULL,
    "collection_id" TEXT NOT NULL,
    "external_id" TEXT,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "translator" TEXT,
    "language" TEXT NOT NULL,
    "licence" "ContentLicence" NOT NULL,
    "source_url" TEXT NOT NULL,
    "attribution" TEXT NOT NULL,
    "is_searchable" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "library_texts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "library_segments" (
    "id" TEXT NOT NULL,
    "text_id" TEXT NOT NULL,
    "segment_key" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "verse_number" INTEGER,
    "chapter_ref" TEXT,
    "sequence" INTEGER NOT NULL,

    CONSTRAINT "library_segments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookmarks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "text_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bookmarks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "annotations" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "segment_id" TEXT NOT NULL,
    "content" VARCHAR(1000) NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "annotations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "live_sessions" (
    "id" TEXT NOT NULL,
    "host_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "session_type" "SessionType" NOT NULL,
    "tradition_tag" "Tradition",
    "language" TEXT NOT NULL DEFAULT 'en',
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "started_at" TIMESTAMP(3),
    "ended_at" TIMESTAMP(3),
    "agora_channel" TEXT NOT NULL,
    "recording_url" TEXT,
    "max_viewers" INTEGER NOT NULL DEFAULT 0,
    "rsvp_required" BOOLEAN NOT NULL DEFAULT false,
    "status" "SessionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "live_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_attendees" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "left_at" TIMESTAMP(3),

    CONSTRAINT "session_attendees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "organiser_id" TEXT NOT NULL,
    "association_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "event_type" "EventType" NOT NULL,
    "tradition_tag" "Tradition",
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3),
    "timezone" TEXT NOT NULL,
    "location_name" TEXT,
    "lat" DECIMAL(10,7),
    "lng" DECIMAL(10,7),
    "online_url" TEXT,
    "capacity" INTEGER NOT NULL DEFAULT 0,
    "is_recurring" BOOLEAN NOT NULL DEFAULT false,
    "recurrence_rule" TEXT,
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_rsvps" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" "RsvpStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_rsvps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "associations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "city" TEXT,
    "tradition" "Tradition" NOT NULL,
    "category" "AssociationCategory" NOT NULL,
    "parent_id" TEXT,
    "legal_reg_number" TEXT,
    "description" TEXT,
    "website" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "associations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "association_members" (
    "id" TEXT NOT NULL,
    "association_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "member_role" TEXT NOT NULL DEFAULT 'MEMBER',
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "association_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "recipient_id" TEXT NOT NULL,
    "ciphertext" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_reports" (
    "id" TEXT NOT NULL,
    "reporter_id" TEXT NOT NULL,
    "post_id" TEXT,
    "reason" TEXT NOT NULL,
    "details" VARCHAR(500),
    "is_resolved" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moderation_actions" (
    "id" TEXT NOT NULL,
    "moderator_id" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "moderation_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_locations" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "country" TEXT,
    "state" TEXT,
    "city" TEXT,
    "area" TEXT,
    "grid_lat" DECIMAL(4,1),
    "grid_lng" DECIMAL(4,1),
    "visibility" "LocationVisibility" NOT NULL DEFAULT 'CITY_ONLY',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_tags" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "tag" "ProfessionalTag" NOT NULL,

    CONSTRAINT "user_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intents" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "category" "IntentCategory" NOT NULL,
    "description" VARCHAR(500),
    "scope" "IntentScope" NOT NULL DEFAULT 'CITY',
    "visibility" "VisibilityLevel" NOT NULL DEFAULT 'COMMUNITY',
    "status" "IntentStatus" NOT NULL DEFAULT 'OPEN',
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "intents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intent_responses" (
    "id" TEXT NOT NULL,
    "intent_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "message" VARCHAR(300),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "intent_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "privacy_settings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "profile_visibility" "VisibilityLevel" NOT NULL DEFAULT 'COMMUNITY',
    "messaging_permission" "MessagingPermission" NOT NULL DEFAULT 'CONNECTIONS_ONLY',
    "location_visibility" "LocationVisibility" NOT NULL DEFAULT 'CITY_ONLY',
    "activity_visibility" "VisibilityLevel" NOT NULL DEFAULT 'COMMUNITY',
    "show_in_discovery" BOOLEAN NOT NULL DEFAULT true,
    "anonymous_browsing" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "privacy_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contribution_scores" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "events_hosted" INTEGER NOT NULL DEFAULT 0,
    "volunteer_contributions" INTEGER NOT NULL DEFAULT 0,
    "communities_created" INTEGER NOT NULL DEFAULT 0,
    "helpful_answers" INTEGER NOT NULL DEFAULT 0,
    "translation_contributions" INTEGER NOT NULL DEFAULT 0,
    "library_annotations" INTEGER NOT NULL DEFAULT 0,
    "sessions_hosted" INTEGER NOT NULL DEFAULT 0,
    "total_score" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contribution_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_verifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "credentials" TEXT NOT NULL,
    "supporting_doc_url" TEXT,
    "lineage" TEXT,
    "status" "TeacherVerificationStatus" NOT NULL DEFAULT 'NOT_APPLIED',
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teacher_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_firebase_uid_key" ON "users"("firebase_uid");

-- CreateIndex
CREATE UNIQUE INDEX "follows_follower_id_followed_id_key" ON "follows"("follower_id", "followed_id");

-- CreateIndex
CREATE UNIQUE INDEX "clergy_applications_user_id_key" ON "clergy_applications"("user_id");

-- CreateIndex
CREATE INDEX "posts_author_id_idx" ON "posts"("author_id");

-- CreateIndex
CREATE INDEX "posts_created_at_idx" ON "posts"("created_at");

-- CreateIndex
CREATE INDEX "comments_post_id_idx" ON "comments"("post_id");

-- CreateIndex
CREATE UNIQUE INDEX "likes_post_id_user_id_key" ON "likes"("post_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "library_collections_slug_key" ON "library_collections"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "library_texts_external_id_key" ON "library_texts"("external_id");

-- CreateIndex
CREATE INDEX "library_texts_collection_id_idx" ON "library_texts"("collection_id");

-- CreateIndex
CREATE INDEX "library_texts_language_idx" ON "library_texts"("language");

-- CreateIndex
CREATE INDEX "library_segments_text_id_idx" ON "library_segments"("text_id");

-- CreateIndex
CREATE UNIQUE INDEX "library_segments_text_id_segment_key_key" ON "library_segments"("text_id", "segment_key");

-- CreateIndex
CREATE UNIQUE INDEX "bookmarks_user_id_text_id_key" ON "bookmarks"("user_id", "text_id");

-- CreateIndex
CREATE UNIQUE INDEX "live_sessions_agora_channel_key" ON "live_sessions"("agora_channel");

-- CreateIndex
CREATE INDEX "live_sessions_scheduled_at_idx" ON "live_sessions"("scheduled_at");

-- CreateIndex
CREATE INDEX "live_sessions_status_idx" ON "live_sessions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "session_attendees_session_id_user_id_key" ON "session_attendees"("session_id", "user_id");

-- CreateIndex
CREATE INDEX "events_starts_at_idx" ON "events"("starts_at");

-- CreateIndex
CREATE INDEX "events_lat_lng_idx" ON "events"("lat", "lng");

-- CreateIndex
CREATE UNIQUE INDEX "event_rsvps_event_id_user_id_key" ON "event_rsvps"("event_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "association_members_association_id_user_id_key" ON "association_members"("association_id", "user_id");

-- CreateIndex
CREATE INDEX "messages_sender_id_recipient_id_idx" ON "messages"("sender_id", "recipient_id");

-- CreateIndex
CREATE INDEX "messages_created_at_idx" ON "messages"("created_at");

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_idx" ON "notifications"("user_id", "is_read");

-- CreateIndex
CREATE UNIQUE INDEX "user_locations_user_id_key" ON "user_locations"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_tags_user_id_tag_key" ON "user_tags"("user_id", "tag");

-- CreateIndex
CREATE INDEX "intents_category_status_idx" ON "intents"("category", "status");

-- CreateIndex
CREATE INDEX "intents_user_id_idx" ON "intents"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "intent_responses_intent_id_user_id_key" ON "intent_responses"("intent_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "privacy_settings_user_id_key" ON "privacy_settings"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "contribution_scores_user_id_key" ON "contribution_scores"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "teacher_verifications_user_id_key" ON "teacher_verifications"("user_id");

-- AddForeignKey
ALTER TABLE "follows" ADD CONSTRAINT "follows_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follows" ADD CONSTRAINT "follows_followed_id_fkey" FOREIGN KEY ("followed_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clergy_applications" ADD CONSTRAINT "clergy_applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_texts" ADD CONSTRAINT "library_texts_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "library_collections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_segments" ADD CONSTRAINT "library_segments_text_id_fkey" FOREIGN KEY ("text_id") REFERENCES "library_texts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_text_id_fkey" FOREIGN KEY ("text_id") REFERENCES "library_texts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "annotations" ADD CONSTRAINT "annotations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "annotations" ADD CONSTRAINT "annotations_segment_id_fkey" FOREIGN KEY ("segment_id") REFERENCES "library_segments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_sessions" ADD CONSTRAINT "live_sessions_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_attendees" ADD CONSTRAINT "session_attendees_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "live_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_attendees" ADD CONSTRAINT "session_attendees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_organiser_id_fkey" FOREIGN KEY ("organiser_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_association_id_fkey" FOREIGN KEY ("association_id") REFERENCES "associations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_rsvps" ADD CONSTRAINT "event_rsvps_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_rsvps" ADD CONSTRAINT "event_rsvps_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "associations" ADD CONSTRAINT "associations_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "associations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "association_members" ADD CONSTRAINT "association_members_association_id_fkey" FOREIGN KEY ("association_id") REFERENCES "associations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "association_members" ADD CONSTRAINT "association_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_actions" ADD CONSTRAINT "moderation_actions_moderator_id_fkey" FOREIGN KEY ("moderator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_locations" ADD CONSTRAINT "user_locations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_tags" ADD CONSTRAINT "user_tags_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intents" ADD CONSTRAINT "intents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intent_responses" ADD CONSTRAINT "intent_responses_intent_id_fkey" FOREIGN KEY ("intent_id") REFERENCES "intents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intent_responses" ADD CONSTRAINT "intent_responses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "privacy_settings" ADD CONSTRAINT "privacy_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contribution_scores" ADD CONSTRAINT "contribution_scores_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_verifications" ADD CONSTRAINT "teacher_verifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

