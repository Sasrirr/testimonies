-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CONSUMER', 'ORGANIZATION', 'EMPLOYEE', 'ADMIN');

-- CreateEnum
CREATE TYPE "EntityStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION', 'FLAGGED', 'DELETED');

-- CreateEnum
CREATE TYPE "TestimonyStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'DISPUTED', 'TAKEDOWN');

-- CreateEnum
CREATE TYPE "InteractionType" AS ENUM ('VIEW', 'LIKE', 'SHARE', 'COMMENT', 'FLAG_REPORT');

-- CreateEnum
CREATE TYPE "TargetEntityType" AS ENUM ('TESTIMONY', 'USER', 'ORGANIZATION');

-- CreateEnum
CREATE TYPE "VerificationSource" AS ENUM ('MANUAL', 'AUTOMATED', 'THIRD_PARTY');

-- CreateEnum
CREATE TYPE "IntegrationType" AS ENUM ('IDENTITY', 'DOCUMENT', 'PLATFORM', 'BUSINESS_TOOL');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "full_name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(50),
    "profile_photo_url" TEXT,
    "role" "UserRole" NOT NULL,
    "status" "EntityStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "org_name" VARCHAR(255) NOT NULL,
    "sector" VARCHAR(100),
    "license_id" VARCHAR(100),
    "contact_info" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "position" VARCHAR(100),
    "joined_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admins" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "permissions" JSONB NOT NULL,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "testimonies" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "author_id" UUID NOT NULL,
    "subject_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "category" VARCHAR(100),
    "media_url" TEXT,
    "sentiment" VARCHAR(50),
    "status" "TestimonyStatus" NOT NULL DEFAULT 'PENDING',
    "qr_code_url" TEXT,
    "embed_id" VARCHAR(30) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "testimonies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "testimony_id" UUID NOT NULL,
    "proof_type" VARCHAR(100) NOT NULL,
    "proof_data" JSONB NOT NULL,
    "source" "VerificationSource" NOT NULL,
    "verified_by_id" UUID,
    "outcome" "TestimonyStatus" NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interactions" (
    "id" BIGSERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "target_type" "TargetEntityType" NOT NULL,
    "target_id" UUID NOT NULL,
    "interaction" "InteractionType" NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reputations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "score" DECIMAL(5,2) NOT NULL DEFAULT 75.00,
    "last_calculated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reputations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "behavior_profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "traits" JSONB NOT NULL,
    "reliability_score" DECIMAL(5,2) NOT NULL DEFAULT 75.00,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "behavior_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disputes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "testimony_id" UUID NOT NULL,
    "raised_by_id" UUID NOT NULL,
    "reviewed_by_id" UUID,
    "reason" TEXT NOT NULL,
    "outcome" VARCHAR(100),
    "status" VARCHAR(50) NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "disputes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" BIGSERIAL NOT NULL,
    "actor_id" UUID,
    "action" TEXT NOT NULL,
    "target_entity" "TargetEntityType",
    "target_id" UUID,
    "details" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integrations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "type" "IntegrationType" NOT NULL,
    "provider" VARCHAR(100) NOT NULL,
    "metadata" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "integrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_user_id_key" ON "organizations"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "employees_user_id_key" ON "employees"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "admins_user_id_key" ON "admins"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "testimonies_embed_id_key" ON "testimonies"("embed_id");

-- CreateIndex
CREATE UNIQUE INDEX "verifications_testimony_id_key" ON "verifications"("testimony_id");

-- CreateIndex
CREATE UNIQUE INDEX "reputations_user_id_key" ON "reputations"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "behavior_profiles_user_id_key" ON "behavior_profiles"("user_id");

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admins" ADD CONSTRAINT "admins_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "testimonies" ADD CONSTRAINT "testimonies_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "testimonies" ADD CONSTRAINT "testimonies_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verifications" ADD CONSTRAINT "verifications_testimony_id_fkey" FOREIGN KEY ("testimony_id") REFERENCES "testimonies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verifications" ADD CONSTRAINT "verifications_verified_by_id_fkey" FOREIGN KEY ("verified_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "testimonies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reputations" ADD CONSTRAINT "reputations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "behavior_profiles" ADD CONSTRAINT "behavior_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_testimony_id_fkey" FOREIGN KEY ("testimony_id") REFERENCES "testimonies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_raised_by_id_fkey" FOREIGN KEY ("raised_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
