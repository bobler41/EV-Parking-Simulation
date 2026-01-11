import "dotenv/config";
import express from "express";
import { prisma } from "./db";
import inputSetsRouter from "./routes/inputSets";
import simulationRunsRouter from "./routes/simulationRuns";

const app = express();
app.use(express.json());

app.get("/health", async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ ok: true, db: true });
});

app.use("/input-sets", inputSetsRouter);
app.use("/simulation-runs", simulationRunsRouter);

const port = process.env.PORT ? Number(process.env.PORT) : 3000;

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
