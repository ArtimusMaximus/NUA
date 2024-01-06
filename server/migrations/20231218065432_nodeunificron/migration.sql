-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Cron" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cron" TEXT NOT NULL,
    "type" TEXT,
    "deviceId" INTEGER,
    CONSTRAINT "Cron_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Cron" ("createdAt", "cron", "deviceId", "id", "type") SELECT "createdAt", "cron", "deviceId", "id", "type" FROM "Cron";
DROP TABLE "Cron";
ALTER TABLE "new_Cron" RENAME TO "Cron";
CREATE UNIQUE INDEX "Cron_deviceId_key" ON "Cron"("deviceId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
