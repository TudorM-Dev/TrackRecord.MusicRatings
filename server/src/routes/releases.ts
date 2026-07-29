import { Router } from "express";
import { prisma } from "../prisma.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import { getMusicRelease } from "../music.js";

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

  const release = await prisma.release.upsert({
    where: { externalId: details.externalId },
    create: details,
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

  const score = Number(req.body.score);
  if (!Number.isInteger(score) || score < 1 || score > 10) {
    res.status(400).json({ error: "Invalid score" });
    return;
  }

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

  // deleteMany instead of delete: no error when there is nothing to remove
  await prisma.rating.deleteMany({ where: { releaseId: id, userId: me.id } });

  res.status(204).end();
});

export default router;
