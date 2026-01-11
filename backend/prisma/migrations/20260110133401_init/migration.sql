-- CreateEnum
CREATE TYPE "RunStatus" AS ENUM ('queued', 'running', 'succeeded', 'failed');

-- CreateTable
CREATE TABLE "InputSet" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "chargePoints" INTEGER NOT NULL,
    "arrivalMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "consumptionKwhPer100km" DOUBLE PRECISION NOT NULL DEFAULT 18.0,
    "chargerPowerKw" DOUBLE PRECISION NOT NULL DEFAULT 11.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InputSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SimulationRun" (
    "id" TEXT NOT NULL,
    "inputSetId" TEXT NOT NULL,
    "status" "RunStatus" NOT NULL DEFAULT 'queued',
    "seed" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "totalEnergyKwh" DOUBLE PRECISION,
    "theoreticalMaxKw" DOUBLE PRECISION,
    "actualMaxKw" DOUBLE PRECISION,
    "concurrencyFactor" DOUBLE PRECISION,
    "yearlyEventCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SimulationRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExemplaryDayPoint" (
    "id" TEXT NOT NULL,
    "simulationRunId" TEXT NOT NULL,
    "tickIndex" INTEGER NOT NULL,
    "totalPowerKw" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExemplaryDayPoint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExemplaryDayPoint_simulationRunId_tickIndex_key" ON "ExemplaryDayPoint"("simulationRunId", "tickIndex");

-- AddForeignKey
ALTER TABLE "SimulationRun" ADD CONSTRAINT "SimulationRun_inputSetId_fkey" FOREIGN KEY ("inputSetId") REFERENCES "InputSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExemplaryDayPoint" ADD CONSTRAINT "ExemplaryDayPoint_simulationRunId_fkey" FOREIGN KEY ("simulationRunId") REFERENCES "SimulationRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
