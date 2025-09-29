-- AlterTable
ALTER TABLE "public"."organizations" ADD COLUMN     "admin_request_code" VARCHAR(20) NOT NULL DEFAULT 'LEGACY';
