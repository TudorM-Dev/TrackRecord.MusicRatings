import { Router } from "express";
import { prisma } from "../prisma.js";

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
  res.json(release);
});

export default router;
