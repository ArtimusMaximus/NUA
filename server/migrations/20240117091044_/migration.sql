-- CreateTable
CREATE TABLE "Schedule" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scheduletime" TEXT NOT NULL,
    "scheduletype" TEXT NOT NULL,
    "jobName" TEXT,
    "deviceId" INTEGER,
    "toggleschedule" BOOLEAN,
    CONSTRAINT "Schedule_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
