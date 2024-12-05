/*
  Warnings:

  - You are about to drop the column `oneTime` on the `BonusToggles` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BonusToggles" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cronRuleToggledOff" INTEGER NOT NULL,
    "deviceId" INTEGER,
    "crontype" TEXT NOT NULL,
    "crontime" TEXT NOT NULL,
    "macAddress" TEXT NOT NULL,
    CONSTRAINT "BonusToggles_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_BonusToggles" ("createdAt", "cronRuleToggledOff", "crontime", "crontype", "deviceId", "id", "macAddress") SELECT "createdAt", "cronRuleToggledOff", "crontime", "crontype", "deviceId", "id", "macAddress" FROM "BonusToggles";
DROP TABLE "BonusToggles";
ALTER TABLE "new_BonusToggles" RENAME TO "BonusToggles";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
