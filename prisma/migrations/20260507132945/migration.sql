-- CreateTable
CREATE TABLE "CleaningRating" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "wgId" TEXT NOT NULL,
    "raterId" TEXT NOT NULL,
    "ratedUserId" TEXT NOT NULL,
    "weekStart" DATETIME NOT NULL,
    "score" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "CleaningRating_wgId_raterId_ratedUserId_weekStart_key" ON "CleaningRating"("wgId", "raterId", "ratedUserId", "weekStart");
