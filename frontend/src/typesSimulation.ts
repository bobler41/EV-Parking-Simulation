export type SimulationRun = {
  id: string;
  inputSetId: string;
  status: "queued" | "running" | "succeeded" | "failed";
  seed: number;
  startedAt: string;
  finishedAt: string;
  totalEnergyKwh: number;
  theoreticalMaxKw: number;
  actualMaxKw: number;
  concurrencyFactor: number;
  yearlyEventCount: number;
};
