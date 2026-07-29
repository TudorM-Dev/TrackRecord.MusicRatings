import { Router } from "express";
import { prisma } from "../prisma.js";
import { requireAdmin } from "../middleware/auth.js";
import { ACCEPTED, ADMIN, PENDING, USER } from "../types.js";

const router = Router();

router.use(requireAdmin);

router.get("/stats", async (req, res) => {
  const [users, releases, tracks, ratings, verdicts, friendships, pending] =
    await Promise.all([
      prisma.user.count(),
      prisma.release.count(),
      prisma.track.count(),
      prisma.rating.count(),
      prisma.trackVerdict.count(),
      prisma.friendship.count({ where: { status: ACCEPTED } }),
      prisma.friendship.count({ where: { status: PENDING } }),
    ]);

  const average = await prisma.rating.aggregate({ _avg: { score: true } });

  res.json({
    users,
    releases,
    tracks,
    ratings,
    verdicts,
    friendships,
    pendingRequests: pending,
    averageScore: average._avg.score,
  });
});

router.get("/users", async (req, res) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      username: true,
      displayName: true,
      role: true,
      createdAt: true,
      _count: { select: { ratings: true, verdicts: true, sessions: true } },
    },
  });

  res.json(users);
});

router.patch("/users/:id/role", async (req, res) => {
  const me = req.user;
  const id = Number(req.params.id);

  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const { role } = req.body;
  if (role !== ADMIN && role !== USER) {
    res.status(400).json({ error: "Role must be ADMIN or USER" });
    return;
  }

  if (me && me.id === id && role === USER) {
    res.status(400).json({ error: "You cannot remove your own admin role" });
    return;
  }

  const user = await prisma.user.update({
    where: { id },
    data: { role },
    select: { id: true, username: true, role: true },
  });

  res.json(user);
});

router.delete("/users/:id", async (req, res) => {
  const me = req.user;
  const id = Number(req.params.id);

  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  if (me && me.id === id) {
    res.status(400).json({ error: "You cannot delete your own account" });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  await prisma.$transaction([
    prisma.session.deleteMany({ where: { userId: id } }),
    prisma.rating.deleteMany({ where: { userId: id } }),
    prisma.trackVerdict.deleteMany({ where: { userId: id } }),
    prisma.friendship.deleteMany({
      where: { OR: [{ requesterId: id }, { receiverId: id }] },
    }),
    prisma.user.delete({ where: { id } }),
  ]);

  res.status(204).end();
});

router.get("/releases", async (req, res) => {
  const releases = await prisma.release.findMany({
    orderBy: { id: "desc" },
    include: { _count: { select: { ratings: true, tracks: true } } },
  });

  res.json(releases);
});

router.delete("/releases/:id", async (req, res) => {
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

  const tracks = await prisma.track.findMany({
    where: { releaseId: id },
    select: { id: true },
  });

  await prisma.$transaction([
    prisma.trackVerdict.deleteMany({
      where: { trackId: { in: tracks.map((t) => t.id) } },
    }),
    prisma.track.deleteMany({ where: { releaseId: id } }),
    prisma.rating.deleteMany({ where: { releaseId: id } }),
    prisma.release.delete({ where: { id } }),
  ]);

  res.status(204).end();
});

export default router;
