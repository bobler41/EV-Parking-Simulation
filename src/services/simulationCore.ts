export type SimulationInput = {
  chargePoints: number;
  arrivalMultiplier: number;
  consumptionKwhPer100km: number;
  chargerPowerKw: number;
  seed: number;
};

export type ExemplaryDayPoint = {
  tickIndex: number;
  totalPowerKw: number;
};

export type SimulationOutput = {
  totalEnergyKwh: number;
  theoreticalMaxKw: number;
  actualMaxKw: number;
  concurrencyFactor: number;
  yearlyEventCount: number;
  exemplaryDay: ExemplaryDayPoint[];
  eventAggs: EventAgg[];
};

export type EventAgg = {
  period: "day" | "week" | "month" | "year";
  periodStartIso: string;
  eventCount: number;
};

type ChargerState = { remainingKwh: number };

type DistanceBucket = { km: number; probability: number };

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(msg);
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function normalizeBuckets(buckets: DistanceBucket[]): DistanceBucket[] {
  const total = buckets.reduce((acc, b) => acc + b.probability, 0);
  assert(total > 0, "T2 probabilities must sum to a positive number.");
  return buckets.map(b => ({ km: b.km, probability: b.probability / total }));
}

function sampleBucketKm(rng: () => number, buckets: DistanceBucket[]): number {
  const r = rng();
  let cum = 0;
  for (const b of buckets) {
    cum += b.probability;
    if (r <= cum) return b.km;
  }
  return buckets[buckets.length - 1]!.km;
}

function hourlyToTickProbability(pHour: number): number {
  return 1 - Math.pow(1 - pHour, 1 / 4);
}

function buildT1TickProbabilities(t1Hourly: number[], arrivalMultiplier: number): number[] {
  assert(t1Hourly.length === 24, "T1 hourly array must have length 24.");
  const result: number[] = [];
  for (const pHourRaw of t1Hourly) {
    const pHourScaled = Math.min(1, Math.max(0, pHourRaw * arrivalMultiplier));
    const pTick = hourlyToTickProbability(pHourScaled);
    result.push(pTick, pTick, pTick, pTick);
  }
  assert(result.length === 96, "Internal error: T1 tick array must have length 96.");
  return result;
}

function startOfDay(base: Date, dayIndex: number): Date {
  const d = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate()));
  d.setUTCDate(d.getUTCDate() + dayIndex);
  return d;
}

function startOfMonth(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

function startOfWeekMonday(d: Date): Date {
  // Monday as week start. JS: Sunday=0, Monday=1, ...
  const day = d.getUTCDay();
  const diffToMonday = (day + 6) % 7; // Monday ->0, Tuesday->1, Sunday->6
  const res = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  res.setUTCDate(res.getUTCDate() - diffToMonday);
  return res;
}

function iso(dt: Date): string {
  return dt.toISOString();
}

const T1_HOURLY: number[] = [
  0.0094, 0.0094, 0.0094, 0.0094, 0.0094, 0.0094, 0.0094, 0.0094,
  0.0283, 0.0283,
  0.0566, 0.0566, 0.0566,
  0.0755, 0.0755, 0.0755,
  0.1038, 0.1038, 0.1038,
  0.0472, 0.0472, 0.0472,
  0.0094, 0.0094
];

const T2_BUCKETS_RAW: DistanceBucket[] = [
  { km: 0, probability: 0.3431 },
  { km: 5, probability: 0.0490 },
  { km: 10, probability: 0.0980 },
  { km: 20, probability: 0.1176 },
  { km: 30, probability: 0.0882 },
  { km: 50, probability: 0.1176 },
  { km: 100, probability: 0.1078 },
  { km: 200, probability: 0.0490 },
  { km: 300, probability: 0.0294 }
];

export function runSimulationOneYear(input: SimulationInput): SimulationOutput {
  const days = 365;
  const ticksPerDay = 96;
  const totalTicks = days * ticksPerDay;

  const tickHours = 0.25;

  const energyPerTickKwh = input.chargerPowerKw * tickHours;
  const kwhPerKm = input.consumptionKwhPer100km / 100;

  const rng = mulberry32(input.seed);

  const t1Tick = buildT1TickProbabilities(T1_HOURLY, input.arrivalMultiplier);
  const t2Buckets = normalizeBuckets(T2_BUCKETS_RAW);

  const baseDate = new Date(Date.UTC(2026, 0, 1));

  const dailyCounts = new Map<string, number>();
  const weeklyCounts = new Map<string, number>();
  const monthlyCounts = new Map<string, number>();


  const chargers: ChargerState[] = Array.from({ length: input.chargePoints }, () => ({ remainingKwh: 0 }));

  let totalEnergyKwh = 0;
  let actualMaxKw = 0;
  let yearlyEventCount = 0;

  const exemplaryDayIndex = 180;
  const exemplaryStart = exemplaryDayIndex * ticksPerDay;
  const exemplaryEnd = exemplaryStart + ticksPerDay;
  const exemplaryDay: ExemplaryDayPoint[] = [];

  for (let tick = 0; tick < totalTicks; tick++) {
    const slot = tick % ticksPerDay;
    const arrivalProb = t1Tick[slot]!;

    let activeChargers = 0;

    for (let i = 0; i < chargers.length; i++) {
      const c = chargers[i]!;

      if (c.remainingKwh > 0) {
        activeChargers += 1;

        const delivered = Math.min(energyPerTickKwh, c.remainingKwh);
        c.remainingKwh -= delivered;
        totalEnergyKwh += delivered;

        if (c.remainingKwh <= 1e-9) c.remainingKwh = 0;
      } else {
        if (rng() < arrivalProb) {
          const km = sampleBucketKm(rng, t2Buckets);
          const neededKwh = km * kwhPerKm;

          if (neededKwh > 0) {
            c.remainingKwh = neededKwh;
            yearlyEventCount += 1;

            const dayIndex = Math.floor(tick / ticksPerDay);
            const dayStart = startOfDay(baseDate, dayIndex);
            const weekStart = startOfWeekMonday(dayStart);
            const monthStart = startOfMonth(dayStart);

            const dayKey = iso(dayStart);
            const weekKey = iso(weekStart);
            const monthKey = iso(monthStart);

            dailyCounts.set(dayKey, (dailyCounts.get(dayKey) ?? 0) + 1);
            weeklyCounts.set(weekKey, (weeklyCounts.get(weekKey) ?? 0) + 1);
            monthlyCounts.set(monthKey, (monthlyCounts.get(monthKey) ?? 0) + 1);
            }
        }
      }
    }

    const totalPowerKw = activeChargers * input.chargerPowerKw;
    if (totalPowerKw > actualMaxKw) actualMaxKw = totalPowerKw;

    if (tick >= exemplaryStart && tick < exemplaryEnd) {
      exemplaryDay.push({ tickIndex: tick - exemplaryStart, totalPowerKw });
    }
  }

  const theoreticalMaxKw = input.chargePoints * input.chargerPowerKw;
  const concurrencyFactor = theoreticalMaxKw > 0 ? actualMaxKw / theoreticalMaxKw : 0;

  const eventAggs: EventAgg[] = [];

  eventAggs.push({
    period: "year",
    periodStartIso: iso(baseDate),
    eventCount: yearlyEventCount
  });

  for (const [k, v] of monthlyCounts.entries()) {
    eventAggs.push({ period: "month", periodStartIso: k, eventCount: v });
  }

  for (const [k, v] of weeklyCounts.entries()) {
    eventAggs.push({ period: "week", periodStartIso: k, eventCount: v });
  }

  for (const [k, v] of dailyCounts.entries()) {
    eventAggs.push({ period: "day", periodStartIso: k, eventCount: v });
  }

  return {
    totalEnergyKwh,
    theoreticalMaxKw,
    actualMaxKw,
    concurrencyFactor,
    yearlyEventCount,
    exemplaryDay,
    eventAggs
  };
}
