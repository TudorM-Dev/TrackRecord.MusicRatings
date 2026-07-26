import express from "express";
import { prisma } from "./prisma.js";

const app = express();
const PORT = Number(process.env.PORT ?? 3000);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok sir yes" });
});

app.get("/api/releases", async (req, res) => {
  const releases = await prisma.release.findMany();
  res.json(releases);
});

app.get("/api/releases/:id", async (req, res) => {
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

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
