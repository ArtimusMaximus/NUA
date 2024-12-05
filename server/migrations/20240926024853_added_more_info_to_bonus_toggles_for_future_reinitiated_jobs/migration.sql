/*
  Warnings:

  - Added the required column `crontime` to the `BonusToggles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `crontype` to the `BonusToggles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `macAddress` to the `BonusToggles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `oneTime` to the `BonusToggles` table without a default value. This is not possible if the table is not empty.

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
    "oneTime" BOOLEAN NOT NULL,
    CONSTRAINT "BonusToggles_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_BonusToggles" ("createdAt", "cronRuleToggledOff", "deviceId", "id") SELECT "createdAt", "cronRuleToggledOff", "deviceId", "id" FROM "BonusToggles";
DROP TABLE "BonusToggles";
ALTER TABLE "new_BonusToggles" RENAME TO "BonusToggles";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
