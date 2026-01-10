type DistanceBucket = {
  km: number;          // charging demand in km of range
  probability: number; // as a decimal, will be normalized
};

type ChargerState = {
  remainingKwh: number; // > 0 means actively charging
};

type Metrics = {
  totalEnergyKwh: number;
  theoreticalMaxKw: number;
  actualMaxKw: number;
  concurrencyFactor: number;
};

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(msg);
}

/*
  Seeded RNG so results are deterministic.
  Same seed produces same results.
*/
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
  const ticksPerHour = 4;
  return 1 - Math.pow(1 - pHour, 1 / ticksPerHour);
}

/*
  Build 96 tick probabilities for a day, from 24 hourly probabilities.
  Each hour expands to 4 identical 15 minute tick probabilities.
*/
function buildT1TickProbabilities(t1Hourly: number[]): number[] {
  assert(t1Hourly.length === 24, "T1 hourly array must have length 24.");
  const result: number[] = [];
  for (const pHour of t1Hourly) {
    assert(pHour >= 0 && pHour <= 1, "T1 hourly probabilities must be between 0 and 1.");
    const pTick = hourlyToTickProbability(pHour);
    for (let i = 0; i < 4; i++) result.push(pTick);
  }
  assert(result.length === 96, "Internal error: T1 tick array must have length 96.");
  return result;
}

function simulateOneYear(params: {
  chargePoints: number;
  chargerPowerKw: number;
  seed: number;
}): Metrics {
  const { chargePoints, chargerPowerKw, seed } = params;

  const tickMinutes = 15;
  const days = 365;
  const ticksPerDay = 96;
  const totalTicks = days * ticksPerDay;

  const kwhPer100km = 18;
  const kwhPerKm = kwhPer100km / 100; // 0.18

  const tickHours = tickMinutes / 60; // 0.25
  const energyPerTickKwh = chargerPowerKw * tickHours; // 2.75 for 11 kW

  /*
    Your T1, converted to decimals.
  */
  const T1_HOURLY: number[] = [
    0.0094, 0.0094, 0.0094, 0.0094, 0.0094, 0.0094, 0.0094, 0.0094,
    0.0283, 0.0283,
    0.0566, 0.0566, 0.0566,
    0.0755, 0.0755, 0.0755,
    0.1038, 0.1038, 0.1038,
    0.0472, 0.0472, 0.0472,
    0.0094, 0.0094
  ];

  const t1Tick = buildT1TickProbabilities(T1_HOURLY);

  /*
    Your T2, in km of range.
    Note: these probabilities sum to 0.9997 due to rounding, so we normalize.
  */
  const T2_BUCKETS_RAW: DistanceBucket[] = [
    { km: 0, probability: 0.3431 },  // None
    { km: 5, probability: 0.0490 },
    { km: 10, probability: 0.0980 },
    { km: 20, probability: 0.1176 },
    { km: 30, probability: 0.0882 },
    { km: 50, probability: 0.1176 },
    { km: 100, probability: 0.1078 },
    { km: 200, probability: 0.0490 },
    { km: 300, probability: 0.0294 }
  ];

  const t2Buckets = normalizeBuckets(T2_BUCKETS_RAW);

  const rng = mulberry32(seed);

  const chargers: ChargerState[] = Array.from({ length: chargePoints }, () => ({
    remainingKwh: 0
  }));

  let totalEnergyKwh = 0;
  let actualMaxKw = 0;

  for (let tick = 0; tick < totalTicks; tick++) {
    const slot = tick % ticksPerDay; // 0..95
    const arrivalProb = t1Tick[slot]!;

    let activeChargers = 0;

    for (let i = 0; i < chargers.length; i++) {
      const c: ChargerState = chargers[i]!;

      if (c.remainingKwh > 0) {
        activeChargers += 1;

        const delivered = Math.min(energyPerTickKwh, c.remainingKwh);
        c.remainingKwh -= delivered;
        totalEnergyKwh += delivered;

        if (c.remainingKwh <= 1e-9) c.remainingKwh = 0;
      } else {
        const r = rng();
        if (r < arrivalProb) {
          const km = sampleBucketKm(rng, t2Buckets);
          const neededKwh = km * kwhPerKm;

          if (neededKwh > 0) c.remainingKwh = neededKwh;
        }
      }
    }

    const totalPowerKw = activeChargers * chargerPowerKw;
    if (totalPowerKw > actualMaxKw) actualMaxKw = totalPowerKw;
  }

  const theoreticalMaxKw = chargePoints * chargerPowerKw;
  const concurrencyFactor = theoreticalMaxKw > 0 ? actualMaxKw / theoreticalMaxKw : 0;

  return {
    totalEnergyKwh,
    theoreticalMaxKw,
    actualMaxKw,
    concurrencyFactor
  };
}

function printMetrics(label: string, m: Metrics): void {
  console.log(label);
  console.log(`Total energy (kWh): ${m.totalEnergyKwh.toFixed(2)}`);
  console.log(`Theoretical max demand (kW): ${m.theoreticalMaxKw.toFixed(2)}`);
  console.log(`Actual max demand (kW): ${m.actualMaxKw.toFixed(2)}`);
  console.log(`Concurrency factor: ${(m.concurrencyFactor * 100).toFixed(2)}%`);
}

function main(): void {
  const chargerPowerKw = 11;
  const seed = 12345;

  const m20 = simulateOneYear({ chargePoints: 20, chargerPowerKw, seed });
  printMetrics("Results for 20 charge points", m20);

  console.log("");
  console.log("Bonus sweep: 1 to 30 charge points");
  for (let cp = 1; cp <= 30; cp++) {
    const m = simulateOneYear({ chargePoints: cp, chargerPowerKw, seed });
    console.log(
      `${cp} charge points | peak ${m.actualMaxKw.toFixed(0)} kW | concurrency ${(m.concurrencyFactor * 100).toFixed(2)}%`
    );
  }
}

main();
