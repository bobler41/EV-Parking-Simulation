export type ExemplaryDayPoint = {
  id: string;
  simulationRunId: string;
  tickIndex: number;
  totalPowerKw: number;
  createdAt: string;
};

export type ChargingEventAgg = {
  id: string;
  simulationRunId: string;
  period: "day" | "week" | "month" | "year";
  periodStart: string;
  eventCount: number;
  createdAt: string;
};
