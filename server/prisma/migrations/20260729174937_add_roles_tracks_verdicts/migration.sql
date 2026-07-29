-- CreateTable
CREATE TABLE "Track" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "externalId" TEXT NOT NULL,
    "releaseId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "trackNumber" INTEGER NOT NULL,
    "discNumber" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "Track_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "Release" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TrackVerdict" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "trackId" INTEGER NOT NULL,
    "verdict" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TrackVerdict_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TrackVerdict_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "bio" TEXT NOT NULL DEFAULT '',
    "role" TEXT NOT NULL DEFAULT 'USER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_User" ("bio", "createdAt", "displayName", "email", "id", "passwordHash", "username") SELECT "bio", "createdAt", "displayName", "email", "id", "passwordHash", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Track_externalId_key" ON "Track"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "TrackVerdict_userId_trackId_key" ON "TrackVerdict"("userId", "trackId");
