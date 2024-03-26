/*
  Warnings:

  - Added the required column `blockAllow` to the `TrafficRules` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TrafficRules" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unifiId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL,
    "blockAllow" TEXT NOT NULL
);
INSERT INTO "new_TrafficRules" ("createdAt", "description", "enabled", "id", "unifiId") SELECT "createdAt", "description", "enabled", "id", "unifiId" FROM "TrafficRules";
DROP TABLE "TrafficRules";
ALTER TABLE "new_TrafficRules" RENAME TO "TrafficRules";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
