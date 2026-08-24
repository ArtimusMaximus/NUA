-- AlterTable
ALTER TABLE "TrafficRules" ADD COLUMN "scheduleType" TEXT;
ALTER TABLE "TrafficRules" ADD COLUMN "scheduleDate" TEXT;
ALTER TABLE "TrafficRules" ADD COLUMN "scheduleHour" INTEGER;
ALTER TABLE "TrafficRules" ADD COLUMN "scheduleMinute" INTEGER;
ALTER TABLE "TrafficRules" ADD COLUMN "scheduleDays" TEXT;
ALTER TABLE "TrafficRules" ADD COLUMN "scheduleAction" TEXT;
ALTER TABLE "TrafficRules" ADD COLUMN "scheduleEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "TrafficRules" ADD COLUMN "scheduleJobName" TEXT;
