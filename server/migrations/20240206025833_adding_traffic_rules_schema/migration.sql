-- CreateTable
CREATE TABLE "TrafficRules" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deviceId" INTEGER,
    "ruleActive" BOOLEAN,
    CONSTRAINT "TrafficRules_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
