-- CreateTable: CourseEnrollment
CREATE TABLE "course_enrollments" (
    "id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "enrolled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "course_enrollments_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX "course_enrollments_course_id_user_id_key" ON "course_enrollments"("course_id", "user_id");
CREATE INDEX "course_enrollments_user_id_idx" ON "course_enrollments"("user_id");

-- Foreign keys
ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_course_id_fkey"
    FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
