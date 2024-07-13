/*
  Warnings:

  - You are about to drop the column `seconds` on the `EasySchedule` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_EasySchedule" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "minute" INTEGER NOT NULL,
    "hour" INTEGER NOT NULL,
    "ampm" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "blockAllow" TEXT NOT NULL,
    "jobName" TEXT,
    "deviceId" INTEGER,
    "toggleSched" BOOLEAN,
    CONSTRAINT "EasySchedule_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_EasySchedule" ("ampm", "blockAllow", "createdAt", "date", "deviceId", "hour", "id", "jobName", "minute", "toggleSched") SELECT "ampm", "blockAllow", "createdAt", "date", "deviceId", "hour", "id", "jobName", "minute", "toggleSched" FROM "EasySchedule";
DROP TABLE "EasySchedule";
ALTER TABLE "new_EasySchedule" RENAME TO "EasySchedule";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
