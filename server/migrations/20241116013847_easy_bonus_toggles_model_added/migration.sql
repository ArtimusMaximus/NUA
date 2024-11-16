/*
  Warnings:

  - You are about to drop the `BonusToggles` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "BonusToggles";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "CronBonusToggles" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cronRuleToggledOff" INTEGER NOT NULL,
    "deviceId" INTEGER,
    "crontype" TEXT NOT NULL,
    "crontime" TEXT NOT NULL,
    "macAddress" TEXT NOT NULL,
    CONSTRAINT "CronBonusToggles_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EasyBonusToggles" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "toggleSched" BOOLEAN,
    "deviceId" INTEGER,
    "blockAllow" TEXT NOT NULL,
    "month" INTEGER,
    "days" TEXT,
    "minute" INTEGER NOT NULL,
    "hour" INTEGER NOT NULL,
    "ampm" TEXT NOT NULL,
    "date" TEXT,
    "macAddress" TEXT NOT NULL,
    "oneTime" BOOLEAN NOT NULL,
    "jobName" TEXT,
    CONSTRAINT "EasyBonusToggles_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
