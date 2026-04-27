-- CreateTable
CREATE TABLE "ShoppingListItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'TO_BUY',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "wgId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    CONSTRAINT "ShoppingListItem_wgId_fkey" FOREIGN KEY ("wgId") REFERENCES "WG" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ShoppingListItem_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ShoppingListItem_wgId_status_createdAt_idx" ON "ShoppingListItem"("wgId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ShoppingListItem_createdById_idx" ON "ShoppingListItem"("createdById");
