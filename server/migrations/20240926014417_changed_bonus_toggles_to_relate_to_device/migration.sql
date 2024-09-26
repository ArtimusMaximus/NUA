/*
  Warnings:

  - You are about to drop the column `cronId` on the `BonusToggles` table. All the data in the column will be lost.
  - You are about to drop the column `devicesOff` on the `BonusToggles` table. All the data in the column will be lost.
  - Added the required column `cronRuleToggledOff` to the `BonusToggles` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BonusToggles" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cronRuleToggledOff" INTEGER NOT NULL,
    "deviceId" INTEGER,
    CONSTRAINT "BonusToggles_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_BonusToggles" ("createdAt", "id") SELECT "createdAt", "id" FROM "BonusToggles";
DROP TABLE "BonusToggles";
ALTER TABLE "new_BonusToggles" RENAME TO "BonusToggles";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
