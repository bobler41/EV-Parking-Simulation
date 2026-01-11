import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { runSimulationOneYear } from "../services/simulationCore";

const router = Router();

const createRunSchema = z.object({
  inputSetId: z.string().uuid(),
  seed: z.number().int().optional()
});

router.post("/", async (req, res) => {
  const parsed = createRunSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);

  const seed = parsed.data.seed ?? Math.floor(Math.random() * 2_000_000_000);

  const inputSet = await prisma.inputSet.findUnique({ where: { id: parsed.data.inputSetId } });
  if (!inputSet) return res.status(404).json({ error: "InputSet not found" });

  const run = await prisma.simulationRun.create({
    data: {
      inputSetId: inputSet.id,
      seed,
      status: "running",
      startedAt: new Date()
    }
  });

  try {
    const output = runSimulationOneYear({
      chargePoints: inputSet.chargePoints,
      arrivalMultiplier: inputSet.arrivalMultiplier,
      consumptionKwhPer100km: inputSet.consumptionKwhPer100km,
      chargerPowerKw: inputSet.chargerPowerKw,
      seed
    });

    await prisma.$transaction(async (tx: any) => {
      await tx.simulationRun.update({
        where: { id: run.id },
        data: {
          status: "succeeded",
          finishedAt: new Date(),
          totalEnergyKwh: output.totalEnergyKwh,
          theoreticalMaxKw: output.theoreticalMaxKw,
          actualMaxKw: output.actualMaxKw,
          concurrencyFactor: output.concurrencyFactor,
          yearlyEventCount: output.yearlyEventCount,
          exemplaryDayIndex: output.exemplaryDayIndex
        }
      });

      await tx.exemplaryDayPoint.createMany({
        data: output.exemplaryDay.map(p => ({
          simulationRunId: run.id,
          tickIndex: p.tickIndex,
          totalPowerKw: p.totalPowerKw
        }))
      });

      await tx.chargingEventAgg.createMany({
        data: output.eventAggs.map(a => ({
            simulationRunId: run.id,
            period: a.period,
            periodStart: new Date(a.periodStartIso),
            eventCount: a.eventCount
        }))
      });
    });

    const saved = await prisma.simulationRun.findUnique({
      where: { id: run.id },
      include: { inputSet: true }
    });

    return res.status(201).json(saved);
  } catch (e) {
    await prisma.simulationRun.update({
      where: { id: run.id },
      data: { status: "failed", finishedAt: new Date() }
    });

    const msg = e instanceof Error ? e.message : "Unknown error";
    return res.status(500).json({ error: msg });
  }
});

router.get("/", async (_req, res) => {
  const runs = await prisma.simulationRun.findMany({
    orderBy: { createdAt: "desc" },
    include: { inputSet: true }
  });
  return res.json(runs);
});

router.get("/:id", async (req, res) => {
  const run = await prisma.simulationRun.findUnique({
    where: { id: req.params.id },
    include: { inputSet: true }
  });
  if (!run) return res.status(404).json({ error: "SimulationRun not found" });
  return res.json(run);
});

router.get("/:id/exemplary-day", async (req, res) => {
  const points = await prisma.exemplaryDayPoint.findMany({
    where: { simulationRunId: req.params.id },
    orderBy: { tickIndex: "asc" }
  });
  return res.json(points);
});

router.get("/:id/event-counts", async (req, res) => {
  const aggs = await prisma.chargingEventAgg.findMany({
    where: { simulationRunId: req.params.id },
    orderBy: [{ period: "asc" }, { periodStart: "asc" }]
  });
  return res.json(aggs);
});

export default router;
