-- CreateTable
CREATE TABLE "TrafficRuleDevices" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deviceName" TEXT NOT NULL,
    "deviceId" INTEGER NOT NULL,
    "macAddress" TEXT NOT NULL,
    "trafficRulesId" INTEGER NOT NULL,
    CONSTRAINT "TrafficRuleDevices_trafficRulesId_fkey" FOREIGN KEY ("trafficRulesId") REFERENCES "TrafficRules" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
