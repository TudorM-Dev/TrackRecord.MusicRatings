import type { Request, Response, NextFunction } from "express";
import { prisma } from "../prisma.js";

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const token = req.cookies.session;

  if (typeof token !== "string") {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const session = await prisma.session.findUnique({
    where: { id: token },
    include: { user: true },
  });

  if (!session) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const expired = session.expiresAt < new Date();
  if (expired) {
    await prisma.session.delete({ where: { id: token } });
    res.clearCookie("session");
    res.status(401).json({ error: "Session expired" });
    return;
  }

  req.user = session.user;
  next();
}
