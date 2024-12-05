/*
  Warnings:

  - You are about to drop the column `cronRuleToggledOff` on the `CronBonusToggles` table. All the data in the column will be lost.
  - Added the required column `easyRuleIDToggledOff` to the `EasyBonusToggles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cronRuleIDToggledOff` to the `CronBonusToggles` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_EasyBonusToggles" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "easyRuleIDToggledOff" INTEGER NOT NULL,
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
INSERT INTO "new_EasyBonusToggles" ("ampm", "blockAllow", "createdAt", "date", "days", "deviceId", "hour", "id", "jobName", "macAddress", "minute", "month", "oneTime", "toggleSched") SELECT "ampm", "blockAllow", "createdAt", "date", "days", "deviceId", "hour", "id", "jobName", "macAddress", "minute", "month", "oneTime", "toggleSched" FROM "EasyBonusToggles";
DROP TABLE "EasyBonusToggles";
ALTER TABLE "new_EasyBonusToggles" RENAME TO "EasyBonusToggles";
CREATE TABLE "new_CronBonusToggles" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cronRuleIDToggledOff" INTEGER NOT NULL,
    "deviceId" INTEGER,
    "crontype" TEXT NOT NULL,
    "crontime" TEXT NOT NULL,
    "macAddress" TEXT NOT NULL,
    CONSTRAINT "CronBonusToggles_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_CronBonusToggles" ("createdAt", "crontime", "crontype", "deviceId", "id", "macAddress") SELECT "createdAt", "crontime", "crontype", "deviceId", "id", "macAddress" FROM "CronBonusToggles";
DROP TABLE "CronBonusToggles";
ALTER TABLE "new_CronBonusToggles" RENAME TO "CronBonusToggles";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
