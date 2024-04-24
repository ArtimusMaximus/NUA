/*
  Warnings:

  - Added the required column `day` to the `EasySchedule` table without a default value. This is not possible if the table is not empty.
  - Added the required column `month` to the `EasySchedule` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_EasySchedule" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "month" INTEGER NOT NULL,
    "day" INTEGER NOT NULL,
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
