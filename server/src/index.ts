import "dotenv/config";
import express from "express";
import type { NextFunction, Request, Response } from "express";
import cookieParser from "cookie-parser";
import path from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import releasesRouter from "./routes/releases.js";
import authRouter from "./routes/auth.js";
import friendsRouter from "./routes/friends.js";
import usersRouter from "./routes/users.js";
import musicRouter from "./routes/music.js";

const app = express();
const PORT = Number(process.env.PORT ?? 3000);

// Azure terminates HTTPS in front of us. Without this, Express sees plain HTTP
// and refuses to set the secure session cookie, so nobody can log in.
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.join(__dirname, "../../client/dist");
const clientIndex = path.join(clientDist, "index.html");

app.use(express.json());
app.use(cookieParser());

// Plain HTML page used to poke the API by hand.
app.use("/debug", express.static(path.join(__dirname, "../public")));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/friends", friendsRouter);
app.use("/api/releases", releasesRouter);
app.use("/api/music", musicRouter);

app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  next();
});

app.use(express.static(clientDist));

app.use((req, res, next) => {
  if (!existsSync(clientIndex)) {
    next();
    return;
  }
  res.sendFile(clientIndex);
});

app.use((error: unknown, req: Request, res: Response, next: NextFunction) => {
  console.error(error);

  if (res.headersSent) {
    next(error);
    return;
  }

  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
