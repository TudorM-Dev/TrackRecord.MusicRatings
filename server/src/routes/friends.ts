import { Router } from "express";
import { prisma } from "../prisma.js";
import { requireAuth } from "../middleware/auth.js";
import type { FriendshipStatus } from "../types.js";
import type { Request, Response } from "express";

const PENDING: FriendshipStatus = "PENDING";
const ACCEPTED: FriendshipStatus = "ACCEPTED";
const DECLINED: FriendshipStatus = "DECLINED";

const router = Router();

// POST /api/friends/requests
router.post("/requests", requireAuth, async (req, res) => {
  const me = req.user;
  const { target } = req.body;

  if (!me) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  if (typeof target !== "string") {
    res.status(400).json({ error: "Target user is required" });
    return;
  }

  const targetUser = await prisma.user.findUnique({
    where: { username: target },
  });
  if (!targetUser) {
    res.status(404).json({ error: "Target user not found" });
    return;
  }

  if (me.id === targetUser.id) {
    res.status(400).json({ error: "Cannot send friend request to yourself" });
    return;
  }

  const existingRequest = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: me.id, receiverId: targetUser.id },
        { requesterId: targetUser.id, receiverId: me.id },
      ],
    },
  });

  if (existingRequest) {
    if (existingRequest.status === PENDING) {
      res.status(409).json({ error: "Friend request already sent" });
      return;
    }
    if (existingRequest.status === ACCEPTED) {
      res.status(409).json({ error: "You are already friends" });
      return;
    }

    const updated = await prisma.friendship.update({
      where: { id: existingRequest.id },
      data: {
        requesterId: me.id,
        receiverId: targetUser.id,
        status: PENDING,
      },
    });

    res.status(200).json(updated);
    return;
  }

  const friendship = await prisma.friendship.create({
    data: {
      requesterId: me.id,
      receiverId: targetUser.id,
      status: PENDING,
    },
  });

  res.status(201).json(friendship);
});

router.post("/requests/:id/accept", requireAuth, respondToRequest(ACCEPTED));
router.post("/requests/:id/decline", requireAuth, respondToRequest(DECLINED));

function respondToRequest(newStatus: FriendshipStatus) {
  return async (req: Request, res: Response) => {
    const me = req.user;
    if (!me) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }

    const friendship = await prisma.friendship.findUnique({ where: { id } });
    if (!friendship) {
      res.status(404).json({ error: "Request not found" });
      return;
    }

    const isReceiver = friendship.receiverId === me.id;
    const isRequester = friendship.requesterId === me.id;

    // not part of this friendship: don't reveal that it exists
    if (!isReceiver && !isRequester) {
      res.status(404).json({ error: "Request not found" });
      return;
    }

    if (isRequester) {
      res
        .status(403)
        .json({ error: "Only the receiver can decline a request" });
      return;
    }

    if (friendship.status !== PENDING) {
      res.status(409).json({ error: "Request is not pending" });
      return;
    }

    const updated = await prisma.friendship.update({
      where: { id },
      data: { status: DECLINED },
    });

    res.json(updated);
  };
}

export default router;
