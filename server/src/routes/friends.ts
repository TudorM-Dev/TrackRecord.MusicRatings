import { Router } from "express";
import type { Request, Response } from "express";
import { prisma } from "../prisma.js";
import { requireAuth } from "../middleware/auth.js";
import {
  ACCEPTED,
  DECLINED,
  PENDING,
  type FriendshipStatus,
} from "../types.js";

const router = Router();

const publicUserSelect = { id: true, username: true, displayName: true };

router.get("/", requireAuth, async (req, res) => {
  const me = req.user;
  if (!me) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const friendships = await prisma.friendship.findMany({
    where: {
      status: ACCEPTED,
      OR: [{ requesterId: me.id }, { receiverId: me.id }],
    },
    include: {
      requester: { select: publicUserSelect },
      receiver: { select: publicUserSelect },
    },
    orderBy: { updatedAt: "desc" },
  });

  const friends = friendships.map((friendship) =>
    friendship.requesterId === me.id
      ? friendship.receiver
      : friendship.requester,
  );

  res.json(friends);
});

router.get("/requests", requireAuth, async (req, res) => {
  const me = req.user;
  if (!me) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const requests = await prisma.friendship.findMany({
    where: { status: PENDING, receiverId: me.id },
    include: { requester: { select: publicUserSelect } },
    orderBy: { createdAt: "desc" },
  });

  res.json(requests);
});

router.get("/requests/sent", requireAuth, async (req, res) => {
  const me = req.user;
  if (!me) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const requests = await prisma.friendship.findMany({
    where: { status: PENDING, requesterId: me.id },
    include: { receiver: { select: publicUserSelect } },
    orderBy: { createdAt: "desc" },
  });

  res.json(requests);
});

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

    if (!isReceiver && !isRequester) {
      res.status(404).json({ error: "Request not found" });
      return;
    }

    if (isRequester) {
      res
        .status(403)
        .json({ error: "Only the receiver can respond to this request" });
      return;
    }

    if (friendship.status !== PENDING) {
      res.status(409).json({ error: "Request is not pending" });
      return;
    }

    const updated = await prisma.friendship.update({
      where: { id },
      data: { status: newStatus },
    });

    res.json(updated);
  };
}

router.delete("/:username", requireAuth, async (req, res) => {
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

  const other = await prisma.user.findUnique({ where: { username } });
  if (!other) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const friendship = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: me.id, receiverId: other.id },
        { requesterId: other.id, receiverId: me.id },
      ],
    },
  });

  if (!friendship) {
    res.status(404).json({ error: "Friendship not found" });
    return;
  }

  await prisma.friendship.delete({ where: { id: friendship.id } });

  res.status(204).end();
});

export default router;
