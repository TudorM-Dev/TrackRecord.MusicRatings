-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Rating" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "releaseId" INTEGER NOT NULL,
    "score" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Rating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Rating_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "Release" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Rating" ("createdAt", "id", "releaseId", "score", "updatedAt", "userId") SELECT "createdAt", "id", "releaseId", "score", "updatedAt", "userId" FROM "Rating";
DROP TABLE "Rating";
ALTER TABLE "new_Rating" RENAME TO "Rating";
CREATE UNIQUE INDEX "Rating_releaseId_userId_key" ON "Rating"("releaseId", "userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
