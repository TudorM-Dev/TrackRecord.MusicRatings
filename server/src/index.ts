import express from "express";

const app = express();
const PORT = Number(process.env.PORT ?? 3000);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok sir yes" });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
