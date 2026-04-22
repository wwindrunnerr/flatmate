-- CreateTable
CREATE TABLE "CleaningRoom" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "wgId" TEXT NOT NULL,
    CONSTRAINT "CleaningRoom_wgId_fkey" FOREIGN KEY ("wgId") REFERENCES "WG" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CleaningWeekOverride" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "weekStart" DATETIME NOT NULL,
    "assignmentsJson" TEXT NOT NULL,
    "unassignedRoomsJson" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "wgId" TEXT NOT NULL,
    CONSTRAINT "CleaningWeekOverride_wgId_fkey" FOREIGN KEY ("wgId") REFERENCES "WG" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "CleaningRoom_wgId_sortOrder_idx" ON "CleaningRoom"("wgId", "sortOrder");

-- CreateIndex
CREATE INDEX "CleaningWeekOverride_expiresAt_idx" ON "CleaningWeekOverride"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "CleaningWeekOverride_wgId_weekStart_key" ON "CleaningWeekOverride"("wgId", "weekStart");
