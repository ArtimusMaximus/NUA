-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TrafficRuleDevices" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deviceName" TEXT NOT NULL,
    "deviceId" INTEGER,
    "macAddress" TEXT NOT NULL,
    "trafficRulesId" INTEGER NOT NULL,
    CONSTRAINT "TrafficRuleDevices_trafficRulesId_fkey" FOREIGN KEY ("trafficRulesId") REFERENCES "TrafficRules" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_TrafficRuleDevices" ("createdAt", "deviceId", "deviceName", "id", "macAddress", "trafficRulesId") SELECT "createdAt", "deviceId", "deviceName", "id", "macAddress", "trafficRulesId" FROM "TrafficRuleDevices";
DROP TABLE "TrafficRuleDevices";
ALTER TABLE "new_TrafficRuleDevices" RENAME TO "TrafficRuleDevices";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
