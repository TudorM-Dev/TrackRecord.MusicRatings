import express from "express";
import releasesRouter from "./routes/releases.js";
import authRouter from "./routes/auth.js";

const app = express();
const PORT = Number(process.env.PORT ?? 3000);

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok sir yes" });
});

app.use("/api/releases", releasesRouter);
app.use("/api/auth", authRouter);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
