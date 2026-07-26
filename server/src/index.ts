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

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
