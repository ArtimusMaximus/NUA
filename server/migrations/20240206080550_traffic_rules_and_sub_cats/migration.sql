/*
  Warnings:

  - You are about to drop the column `deviceId` on the `TrafficRules` table. All the data in the column will be lost.
  - You are about to drop the column `ruleActive` on the `TrafficRules` table. All the data in the column will be lost.
  - Added the required column `description` to the `TrafficRules` table without a default value. This is not possible if the table is not empty.
  - Added the required column `enabled` to the `TrafficRules` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unifiId` to the `TrafficRules` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "AppCatIds" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "app_cat_id" INTEGER NOT NULL,
    "trafficRulesId" INTEGER NOT NULL,
    CONSTRAINT "AppCatIds_trafficRulesId_fkey" FOREIGN KEY ("trafficRulesId") REFERENCES "TrafficRules" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AppIds" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "app_id" INTEGER NOT NULL,
    "trafficRulesId" INTEGER NOT NULL,
    CONSTRAINT "AppIds_trafficRulesId_fkey" FOREIGN KEY ("trafficRulesId") REFERENCES "TrafficRules" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TargetDevice" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "client_mac" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "trafficRulesId" INTEGER NOT NULL,
    CONSTRAINT "TargetDevice_trafficRulesId_fkey" FOREIGN KEY ("trafficRulesId") REFERENCES "TrafficRules" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TrafficRules" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unifiId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL
);
INSERT INTO "new_TrafficRules" ("createdAt", "id") SELECT "createdAt", "id" FROM "TrafficRules";
DROP TABLE "TrafficRules";
ALTER TABLE "new_TrafficRules" RENAME TO "TrafficRules";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
