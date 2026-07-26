import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../prisma.js";

const router = Router();

router.post("/register", async (req, res) => {
  const { email, username, password } = req.body;

  const normalizedEmail = email.toLowerCase();

  if (
    typeof normalizedEmail !== "string" ||
    typeof username !== "string" ||
    typeof password !== "string" ||
    password.length < 8
  ) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: normalizedEmail }, { username }] },
  });

  if (existing) {
    res.status(409).json({ error: "Email or username already in use" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      username,
      displayName: username,
      passwordHash,
    },
  });
  res.status(201).json({
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
  });
});

export default router;
