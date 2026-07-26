import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../prisma.js";
import { randomBytes } from "node:crypto";

const router = Router();

// REGISTER
router.post("/register", async (req, res) => {
  const { email, username, password } = req.body;

  if (
    typeof email !== "string" ||
    typeof username !== "string" ||
    typeof password !== "string" ||
    password.length < 8
  ) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const normalizedEmail = email.toLowerCase();

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

// LOGIN
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (typeof email !== "string" || typeof password !== "string") {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const normalizedEmail = email.toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const token = randomBytes(32).toString("hex");

  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 days

  await prisma.session.create({
    data: { id: token, userId: user.id, expiresAt },
  });

  res.cookie("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });

  res.json({
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
  });
});

export default router;
