import type { Request, Response, NextFunction } from "express";
import { prisma } from "../prisma.js";

async function resolveSessionUser(req: Request, res: Response) {
  const token = req.cookies.session;

  if (typeof token !== "string") return null;

  const session = await prisma.session.findUnique({
    where: { id: token },
    include: { user: true },
  });

  if (!session) return null;

  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: token } });
    res.clearCookie("session");
    return null;
  }

  return session.user;
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const user = await resolveSessionUser(req, res);

  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  req.user = user;
  next();
}

export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const user = await resolveSessionUser(req, res);

  if (user) {
    req.user = user;
  }

  next();
}
