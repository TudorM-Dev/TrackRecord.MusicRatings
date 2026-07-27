import { Router } from "express";
import { prisma } from "../prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", async (req, res) => {
  const releases = await prisma.release.findMany();
  res.json(releases);
});

router.get("/:id", async (req, res) => {
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

  res.json({
    ...release,
    averageScore: stats._avg.score,
    ratingCount: stats._count,
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

export default router;
