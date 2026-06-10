-- Add ProfessionType enum
CREATE TYPE "ProfessionType" AS ENUM (
  'STUDENT','TEACHER','RESEARCHER','DOCTOR','ENGINEER','LAWYER',
  'BUSINESS_OWNER','ENTREPRENEUR','ARTIST','WRITER','ACTIVIST',
  'CIVIL_SERVANT','EMPLOYEE','MONK_NUN','VOLUNTEER','OTHER'
);

-- Add profession + interest fields to users
ALTER TABLE "users" ADD COLUMN "profession_type"   "ProfessionType";
ALTER TABLE "users" ADD COLUMN "custom_profession"  VARCHAR(100);
ALTER TABLE "users" ADD COLUMN "interest_tags"      TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE "users" ADD COLUMN "intent_tags"        TEXT[] NOT NULL DEFAULT '{}';
