-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Device" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "macAddress" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL,
    "bonusTimeActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "order" INTEGER
);
INSERT INTO "new_Device" ("active", "createdAt", "id", "macAddress", "name", "order") SELECT "active", "createdAt", "id", "macAddress", "name", "order" FROM "Device";
DROP TABLE "Device";
ALTER TABLE "new_Device" RENAME TO "Device";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
