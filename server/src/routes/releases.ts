import { Router } from "express";
import { prisma } from "../prisma.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import { getAlbumTracks, getMusicRelease } from "../music.js";
import { BAD, GOOD } from "../types.js";

const router = Router();

router.get("/", async (req, res) => {
  const releases = await prisma.release.findMany({ orderBy: { title: "asc" } });
  res.json(releases);
});

router.post("/", requireAuth, async (req, res) => {
  const { externalId } = req.body;

  if (typeof externalId !== "string" || externalId.length === 0) {
    res.status(400).json({ error: "externalId is required" });
    return;
  }

  const existing = await prisma.release.findUnique({ where: { externalId } });
  if (existing) {
    res.json(existing);
    return;
  }

  const details = await getMusicRelease(externalId);

  if (!details) {
    res.status(404).json({ error: "Release not found" });
    return;
  }

  const { trackCount, ...columns } = details;

  const release = await prisma.release.upsert({
    where: { externalId: columns.externalId },
    create: columns,
    update: {},
  });

  res.status(201).json(release);
});

router.get("/:id", optionalAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const release = await prisma.release.findUnique({ where: { id } });

  if (!release) {
    res.status(404).json({ error: "Release not found" });
    return;
  }

  const stats = await prisma.rating.aggregate({
    where: { releaseId: id },
    _avg: { score: true },
    _count: true,
  });

  const myRating = req.user
    ? await prisma.rating.findUnique({
        where: { releaseId_userId: { releaseId: id, userId: req.user.id } },
      })
    : null;

  res.json({
    ...release,
    averageScore: stats._avg.score,
    ratingCount: stats._count,
    myScore: myRating?.score ?? null,
  });
});

router.put("/:id/rating", requireAuth, async (req, res) => {
  const me = req.user;
  if (!me) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const raw = Number(req.body.score);
  if (!Number.isFinite(raw) || raw < 1 || raw > 10) {
    res.status(400).json({ error: "Score must be between 1 and 10" });
    return;
  }

  const score = Math.round(raw * 100) / 100;

  const release = await prisma.release.findUnique({ where: { id } });
  if (!release) {
    res.status(404).json({ error: "Release not found" });
    return;
  }

  const rating = await prisma.rating.upsert({
    where: { releaseId_userId: { releaseId: release.id, userId: me.id } },
    create: { releaseId: release.id, userId: me.id, score },
    update: { score },
  });

  res.json(rating);
});

router.delete("/:id/rating", requireAuth, async (req, res) => {
  const me = req.user;
  if (!me) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  await prisma.rating.deleteMany({ where: { releaseId: id, userId: me.id } });

  res.status(204).end();
});

router.get("/:id/tracks", optionalAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const release = await prisma.release.findUnique({ where: { id } });
  if (!release) {
    res.status(404).json({ error: "Release not found" });
    return;
  }

  let tracks = await prisma.track.findMany({
    where: { releaseId: id },
    orderBy: [{ discNumber: "asc" }, { trackNumber: "asc" }],
  });

  if (tracks.length === 0 && release.kind === "ALBUM") {
    const fetched = await getAlbumTracks(release.externalId);

    if (fetched.length > 0) {
      await prisma.track.createMany({
        data: fetched.map((track) => ({ ...track, releaseId: id })),
      });

      tracks = await prisma.track.findMany({
        where: { releaseId: id },
        orderBy: [{ discNumber: "asc" }, { trackNumber: "asc" }],
      });
    }
  }

  const myVerdicts = req.user
    ? await prisma.trackVerdict.findMany({
        where: { userId: req.user.id, trackId: { in: tracks.map((t) => t.id) } },
      })
    : [];

  const verdictByTrack = new Map(myVerdicts.map((v) => [v.trackId, v.verdict]));

  res.json(
    tracks.map((track) => ({
      id: track.id,
      title: track.title,
      trackNumber: track.trackNumber,
      discNumber: track.discNumber,
      myVerdict: verdictByTrack.get(track.id) ?? null,
    })),
  );
});

router.put("/:id/tracks/:trackId/verdict", requireAuth, async (req, res) => {
  const me = req.user;
  if (!me) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const trackId = Number(req.params.trackId);
  if (Number.isNaN(trackId)) {
    res.status(400).json({ error: "Invalid track id" });
    return;
  }

  const { verdict } = req.body;
  if (verdict !== GOOD && verdict !== BAD) {
    res.status(400).json({ error: "Verdict must be GOOD or BAD" });
    return;
  }

  const track = await prisma.track.findUnique({ where: { id: trackId } });
  if (!track) {
    res.status(404).json({ error: "Track not found" });
    return;
  }

  const saved = await prisma.trackVerdict.upsert({
    where: { userId_trackId: { userId: me.id, trackId } },
    create: { userId: me.id, trackId, verdict },
    update: { verdict },
  });

  res.json({ trackId, verdict: saved.verdict });
});

router.delete("/:id/tracks/:trackId/verdict", requireAuth, async (req, res) => {
  const me = req.user;
  if (!me) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const trackId = Number(req.params.trackId);
  if (Number.isNaN(trackId)) {
    res.status(400).json({ error: "Invalid track id" });
    return;
  }

  await prisma.trackVerdict.deleteMany({ where: { userId: me.id, trackId } });

  res.status(204).end();
});

export default router;
