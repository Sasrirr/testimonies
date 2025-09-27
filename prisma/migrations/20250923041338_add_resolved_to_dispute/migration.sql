-- AlterTable
ALTER TABLE "disputes" ADD COLUMN     "resolution" TEXT,
ADD COLUMN     "resolved" BOOLEAN DEFAULT false,
ADD COLUMN     "resolvedBy" TEXT;
