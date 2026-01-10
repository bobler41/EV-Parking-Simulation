-- CreateEnum
CREATE TYPE "AggPeriod" AS ENUM ('day', 'week', 'month', 'year');

-- CreateTable
CREATE TABLE "ChargingEventAgg" (
    "id" TEXT NOT NULL,
    "simulationRunId" TEXT NOT NULL,
    "period" "AggPeriod" NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "eventCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChargingEventAgg_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChargingEventAgg_simulationRunId_idx" ON "ChargingEventAgg"("simulationRunId");

-- CreateIndex
CREATE UNIQUE INDEX "ChargingEventAgg_simulationRunId_period_periodStart_key" ON "ChargingEventAgg"("simulationRunId", "period", "periodStart");

-- AddForeignKey
ALTER TABLE "ChargingEventAgg" ADD CONSTRAINT "ChargingEventAgg_simulationRunId_fkey" FOREIGN KEY ("simulationRunId") REFERENCES "SimulationRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
