/*
  Warnings:

  - You are about to drop the column `cron` on the `Cron` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Cron` table. All the data in the column will be lost.
  - Added the required column `crontime` to the `Cron` table without a default value. This is not possible if the table is not empty.
  - Added the required column `crontype` to the `Cron` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Cron" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "crontime" TEXT NOT NULL,
    "crontype" TEXT NOT NULL,
    "deviceId" INTEGER,
    CONSTRAINT "Cron_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Cron" ("createdAt", "deviceId", "id") SELECT "createdAt", "deviceId", "id" FROM "Cron";
DROP TABLE "Cron";
ALTER TABLE "new_Cron" RENAME TO "Cron";
CREATE UNIQUE INDEX "Cron_deviceId_key" ON "Cron"("deviceId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
