import { Router } from "express";
import { prisma } from "../prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { ACCEPTED, PENDING, type Relationship } from "../types.js";
import type { Friendship } from "../generated/prisma/client.js";

const router = Router();

function getRelationship(
  friendship: Friendship | null,
  myId: number,
): Relationship {
  if (!friendship) return "none";

  if (friendship.status === ACCEPTED) return "friends";

  if (friendship.status === PENDING) {
    return friendship.requesterId === myId
      ? "pending_sent"
      : "pending_received";
  }

  return "none";
}

router.patch("/me", requireAuth, async (req, res) => {
  const me = req.user;
  if (!me) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const { displayName, bio } = req.body;

  if (displayName !== undefined && typeof displayName !== "string") {
    res.status(400).json({ error: "Invalid displayName" });
    return;
  }

  if (bio !== undefined && typeof bio !== "string") {
    res.status(400).json({ error: "Invalid bio" });
    return;
  }

  if (displayName !== undefined && displayName.trim().length === 0) {
    res.status(400).json({ error: "Display name cannot be empty" });
    return;
  }

  if (bio !== undefined && bio.length > 500) {
    res.status(400).json({ error: "Bio is too long" });
    return;
  }

  const updated = await prisma.user.update({
    where: { id: me.id },
    data: {
      ...(displayName !== undefined && { displayName: displayName.trim() }),
      ...(bio !== undefined && { bio }),
    },
  });

  res.json({
    id: updated.id,
    email: updated.email,
    username: updated.username,
    displayName: updated.displayName,
    bio: updated.bio,
  });
});

router.get("/:username", requireAuth, async (req, res) => {
  const me = req.user;
  if (!me) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const { username } = req.params;

  if (typeof username !== "string") {
    res.status(400).json({ error: "Invalid username" });
    return;
  }

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const publicProfile = {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
  };

  let relationship: Relationship;

  if (user.id === me.id) {
    relationship = "self";
  } else {
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: me.id, receiverId: user.id },
          { requesterId: user.id, receiverId: me.id },
        ],
      },
    });
    relationship = getRelationship(friendship, me.id);
  }

  const canSeeFullProfile =
    relationship === "self" || relationship === "friends";

  if (!canSeeFullProfile) {
    res.json({ ...publicProfile, relationship });
    return;
  }

  const ratings = await prisma.rating.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    include: { release: true },
  });

  res.json({
    ...publicProfile,
    relationship,
    bio: user.bio,
    createdAt: user.createdAt,
    ratings,
  });
});

export default router;
