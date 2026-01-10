import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import inputSetsRouter from "./routes/inputSets";
import simulationRunsRouter from "./routes/simulationRuns";

dotenv.config();

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.use("/input-sets", inputSetsRouter);
  app.use("/simulation-runs", simulationRunsRouter);

  return app;
}
