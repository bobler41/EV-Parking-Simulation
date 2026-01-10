type Charger = {
  remainingEnergyKwh: number;
};

const chargerPowerKw: number = 11;
const tickMinutes: number = 15;
const ticksPerDay: number = 96; // 24 hours * 4 ticks per hour

const energyPerTickKwh: number = chargerPowerKw * (tickMinutes / 60); // kWh delivered per tick

// Your T1 hourly arrival probabilities as decimals
const t1Hourly: number[] = [
  0.0094, 0.0094, 0.0094, 0.0094, 0.0094, 0.0094, 0.0094, 0.0094,
  0.0283, 0.0283,
  0.0566, 0.0566, 0.0566,
  0.0755, 0.0755, 0.0755,
  0.1038, 0.1038, 0.1038,
  0.0472, 0.0472, 0.0472,
  0.0094, 0.0094
];

// Convert hourly probability to per tick probability (4 ticks per hour)
function hourlyToTickProb(pHour: number): number {
  const ticksPerHour = 4;
  return 1 - Math.pow(1 - pHour, 1 / ticksPerHour);
}

// A simple deterministic RNG (seeded)
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

const rng: () => number = mulberry32(12345);

// One charger
const charger: Charger = { remainingEnergyKwh: 0 };

// For now, every arriving EV needs a fixed 22 kWh
const fixedArrivalDemandKwh: number = 22;

let arrivalsToday = 0;
let totalEnergyDeliveredKwh = 0;
let peakPowerKw = 0;

for (let tick: number = 0; tick < ticksPerDay; tick++) {
  const hour: number = Math.floor(tick / 4);
  const pHour: number = t1Hourly[hour] ?? -1;
  const pTick: number = hourlyToTickProb(pHour);

  // If charger is free, it can accept an arrival
  if (charger.remainingEnergyKwh === 0) {
    const r = rng();
    if (r < pTick) {
      arrivalsToday += 1;
      charger.remainingEnergyKwh = fixedArrivalDemandKwh;
      console.log(`Tick ${tick}: arrival, assigned ${fixedArrivalDemandKwh} kWh`);
    }
  }

  // Charging happens if busy
  let activeChargers = 0;
  if (charger.remainingEnergyKwh > 0) {
    activeChargers = 1;

    const delivered = Math.min(energyPerTickKwh, charger.remainingEnergyKwh);
    charger.remainingEnergyKwh -= delivered;
    totalEnergyDeliveredKwh += delivered;
  }

  const totalPowerKw = activeChargers * chargerPowerKw;
  if (totalPowerKw > peakPowerKw) peakPowerKw = totalPowerKw;
}

console.log(`Arrivals today: ${arrivalsToday}`);
console.log(`Total energy delivered today: ${totalEnergyDeliveredKwh.toFixed(2)} kWh`);
console.log(`Peak power today: ${peakPowerKw.toFixed(2)} kW`);
