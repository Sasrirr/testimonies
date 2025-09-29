/*
  Warnings:

  - Added the required column `organization_id` to the `admins` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."admins" ADD COLUMN     "organization_id" UUID NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."admins" ADD CONSTRAINT "admins_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
