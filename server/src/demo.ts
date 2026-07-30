import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { prisma } from "./prisma.js";
import { getMusicRelease, searchMusic } from "./music.js";
import { ACCEPTED } from "./types.js";

export const DEMO_EMAIL = "demo@trackrecord.local";
const FRIEND_EMAIL = "ana@trackrecord.local";

type Seed = { query: string; mine: number; theirs: number };

const SEEDS: Seed[] = [
  { query: "My Beautiful Dark Twisted Fantasy Kanye West", mine: 9.5, theirs: 8 },
  { query: "Blonde Frank Ocean", mine: 10, theirs: 9.25 },
  { query: "In Rainbows Radiohead", mine: 9, theirs: 9.5 },
  { query: "To Pimp A Butterfly Kendrick Lamar", mine: 9.75, theirs: 10 },
  { query: "Loveless My Bloody Valentine", mine: 8.5, theirs: 6 },
  { query: "Random Access Memories Daft Punk", mine: 7, theirs: 8.75 },
  { query: "Currents Tame Impala", mine: 6.5, theirs: 7.5 },
  { query: "BRAT Charli xcx", mine: 8, theirs: 9 },
];

async function ensureUser(
  email: string,
  username: string,
  displayName: string,
  bio: string,
) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return existing;

  return prisma.user.create({
    data: {
      email,
      username,
      displayName,
      bio,
      passwordHash: await bcrypt.hash(randomBytes(24).toString("hex"), 10),
    },
  });
}

async function ensureRelease(query: string) {
  const results = await searchMusic(query);
  const best = results.find((r) => r.kind === "ALBUM") ?? results[0];
  if (!best) return null;

  const existing = await prisma.release.findUnique({
    where: { externalId: best.externalId },
  });
  if (existing) return existing;

  const details = await getMusicRelease(best.externalId);
  if (!details) return null;

  const { trackCount, ...columns } = details;

  return prisma.release.upsert({
    where: { externalId: columns.externalId },
    create: columns,
    update: {},
  });
}

export async function resetDemoData() {
  const demo = await ensureUser(
    DEMO_EMAIL,
    "demo",
    "Demo Listener",
    "Read-only tour of TrackRecord. Everything here resets when the next visitor arrives.",
  );
  const friend = await ensureUser(
    FRIEND_EMAIL,
    "ana",
    "Ana Popescu",
    "Shoegaze, rap, and anything with a bad drum machine.",
  );

  const ids = [demo.id, friend.id];

  await prisma.trackVerdict.deleteMany({ where: { userId: { in: ids } } });
  await prisma.rating.deleteMany({ where: { userId: { in: ids } } });

  const releases = await Promise.all(SEEDS.map((seed) => ensureRelease(seed.query)));

  for (const [index, release] of releases.entries()) {
    if (!release) continue;
    const seed = SEEDS[index];
    if (!seed) continue;

    await prisma.rating.upsert({
      where: { releaseId_userId: { releaseId: release.id, userId: demo.id } },
      create: { userId: demo.id, releaseId: release.id, score: seed.mine },
      update: { score: seed.mine },
    });
    await prisma.rating.upsert({
      where: { releaseId_userId: { releaseId: release.id, userId: friend.id } },
      create: { userId: friend.id, releaseId: release.id, score: seed.theirs },
      update: { score: seed.theirs },
    });
  }

  const friendship = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: demo.id, receiverId: friend.id },
        { requesterId: friend.id, receiverId: demo.id },
      ],
    },
  });

  if (friendship) {
    await prisma.friendship.update({
      where: { id: friendship.id },
      data: { status: ACCEPTED },
    });
  } else {
    await prisma.friendship.create({
      data: {
        requesterId: friend.id,
        receiverId: demo.id,
        status: ACCEPTED,
      },
    });
  }

  return demo;
}
