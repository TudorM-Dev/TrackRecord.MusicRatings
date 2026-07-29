import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { searchMusic } from "../music.js";

const router = Router();

router.get("/search", requireAuth, async (req, res) => {
  const { q } = req.query;

  if (typeof q !== "string" || q.trim().length === 0) {
    res.status(400).json({ error: "Query is required" });
    return;
  }

  const results = await searchMusic(q.trim());
  res.json(results);
});

export default router;
