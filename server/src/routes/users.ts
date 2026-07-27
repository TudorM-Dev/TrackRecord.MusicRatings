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

// GET /api/users/:username
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

  if (user.id === me.id) {
    res.json({
      ...publicProfile,
      bio: user.bio,
      createdAt: user.createdAt,
      relationship: "self",
    });
    return;
  }

  const friendship = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: me.id, receiverId: user.id },
        { requesterId: user.id, receiverId: me.id },
      ],
    },
  });

  const relationship = getRelationship(friendship, me.id);

  if (relationship !== "friends") {
    res.json({ ...publicProfile, relationship });
    return;
  }

  res.json({
    ...publicProfile,
    bio: user.bio,
    createdAt: user.createdAt,
    relationship,
  });
});

export default router;
