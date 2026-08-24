-- AlterTable
ALTER TABLE "Device" ADD COLUMN "bonusTimeExpiresAt" DATETIME;

-- AlterTable
ALTER TABLE "TrafficRules" ADD COLUMN "bonusTimeExpiresAt" DATETIME;
