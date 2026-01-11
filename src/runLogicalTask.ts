import { runSimulationOneYear } from "./services/simulationCore";

const result = runSimulationOneYear({
  chargePoints: 20,
  arrivalMultiplier: 1.0,
  consumptionKwhPer100km: 18,
  chargerPowerKw: 11,
  seed: 12345
});

console.log("=== Simulation result ===");
console.log("Total energy (kWh):", result.totalEnergyKwh.toFixed(2));
console.log("Theoretical max power (kW):", result.theoreticalMaxKw);
console.log("Actual max power (kW):", result.actualMaxKw);
console.log("Concurrency factor:", (result.concurrencyFactor * 100).toFixed(1) + "%");
console.log("Yearly charging events:", result.yearlyEventCount);

console.log("\n=== Exemplary day (first 10 ticks) ===");
console.log(result.exemplaryDay.slice(0, 10));
