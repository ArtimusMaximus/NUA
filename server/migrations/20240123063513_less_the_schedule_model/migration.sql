/*
  Warnings:

  - You are about to drop the `Schedule` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Schedule";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Credentials" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT,
    "password" TEXT,
    "hostname" TEXT,
    "port" INTEGER,
    "sslverify" BOOLEAN,
    "theme" TEXT,
    "refreshRate" INTEGER
);
INSERT INTO "new_Credentials" ("hostname", "id", "password", "port", "refreshRate", "sslverify", "theme", "username") SELECT "hostname", "id", "password", "port", "refreshRate", "sslverify", "theme", "username" FROM "Credentials";
DROP TABLE "Credentials";
ALTER TABLE "new_Credentials" RENAME TO "Credentials";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
