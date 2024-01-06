-- DropIndex
DROP INDEX "Device_macAddress_key";

-- CreateTable
CREATE TABLE "Cron" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cron" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "deviceId" INTEGER,
    CONSTRAINT "Cron_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Cron_deviceId_key" ON "Cron"("deviceId");
