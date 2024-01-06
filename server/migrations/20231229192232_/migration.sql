/*
  Warnings:

  - Added the required column `cronInput` to the `Cron` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Cron" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "crontime" TEXT NOT NULL,
    "crontype" TEXT NOT NULL,
    "cronInput" TEXT NOT NULL,
    "jobName" TEXT,
    "deviceId" INTEGER,
    "toggleCron" BOOLEAN,
    CONSTRAINT "Cron_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Cron" ("createdAt", "crontime", "crontype", "deviceId", "id", "jobName", "toggleCron") SELECT "createdAt", "crontime", "crontype", "deviceId", "id", "jobName", "toggleCron" FROM "Cron";
DROP TABLE "Cron";
ALTER TABLE "new_Cron" RENAME TO "Cron";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
