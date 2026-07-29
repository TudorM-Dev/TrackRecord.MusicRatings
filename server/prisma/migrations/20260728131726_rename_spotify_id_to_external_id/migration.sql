
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Release" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "externalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "releaseYear" INTEGER NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'ALBUM',
    "coverUrl" TEXT NOT NULL DEFAULT ''
);
INSERT INTO "new_Release" ("artist", "coverUrl", "id", "kind", "releaseYear", "title") SELECT "artist", "coverUrl", "id", "kind", "releaseYear", "title" FROM "Release";
DROP TABLE "Release";
ALTER TABLE "new_Release" RENAME TO "Release";
CREATE UNIQUE INDEX "Release_externalId_key" ON "Release"("externalId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
