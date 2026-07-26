import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../prisma.js";

const router = Router();

router.post("/register", async (req, res) => {
  const { email, username, displayName, password } = req.body;
});

export default router;
