/*
  Warnings:

  - You are about to drop the column `resolution` on the `disputes` table. All the data in the column will be lost.
  - You are about to drop the column `resolved` on the `disputes` table. All the data in the column will be lost.
  - You are about to drop the column `resolvedBy` on the `disputes` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "disputes" DROP COLUMN "resolution",
DROP COLUMN "resolved",
DROP COLUMN "resolvedBy";
