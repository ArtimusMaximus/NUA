-- CreateTable
CREATE TABLE "EasySchedule" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "minute" INTEGER NOT NULL,
    "hour" INTEGER NOT NULL,
    "seconds" INTEGER NOT NULL,
    "ampm" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "blockAllow" TEXT NOT NULL,
    "jobName" TEXT,
    "deviceId" INTEGER,
    "toggleSched" BOOLEAN,
    CONSTRAINT "EasySchedule_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
