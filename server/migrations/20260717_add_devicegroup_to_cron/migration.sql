-- Add deviceGroupId column to Cron table for group scheduling support
-- NOTE: SQLite does not support ALTER TABLE ... ADD CONSTRAINT. Foreign key
-- constraints are expressed in the Prisma schema instead and enforced by
-- Prisma at the application layer.
ALTER TABLE "Cron" ADD COLUMN "deviceGroupId" INTEGER;
