import { useState } from "react";
import type { InputSet } from "../types";

type Props = {
  onCreate: (data: {
    name?: string;
    chargePoints: number;
    arrivalMultiplier: number;
    consumptionKwhPer100km: number;
    chargerPowerKw: number;
  }) => Promise<void>;
};

export function InputSetForm(props: Props) {
  const [name, setName] = useState("Base case");
  const [chargePoints, setChargePoints] = useState(20);
  const [arrivalMultiplierPct, setArrivalMultiplierPct] = useState(100);
  const [consumptionKwhPer100km, setConsumptionKwhPer100km] = useState(18);
  const [chargerPowerKw, setChargerPowerKw] = useState(11);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    setSubmitting(true);
    try {
      const arrivalMultiplier = arrivalMultiplierPct / 100;

      await props.onCreate({
        name: name.trim() ? name.trim() : undefined,
        chargePoints,
        arrivalMultiplier,
        consumptionKwhPer100km,
        chargerPowerKw
      });

      setName("New scenario");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <div className="text-lg font-semibold text-gray-900">Create input set</div>

      <div className="mt-4 grid grid-cols-1 gap-3">
        <label className="text-sm">
          <div className="text-gray-700">Name</div>
          <input
            className="mt-1 w-full rounded border px-3 py-2"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Base case"
          />
        </label>

        <label className="text-sm">
          <div className="text-gray-700">Charge points</div>
          <input
            className="mt-1 w-full rounded border px-3 py-2"
            type="number"
            min={1}
            value={chargePoints}
            onChange={e => setChargePoints(Number(e.target.value))}
          />
        </label>

        <label className="text-sm">
          <div className="text-gray-700">Arrival multiplier (percent)</div>
          <input
            className="mt-1 w-full rounded border px-3 py-2"
            type="number"
            min={20}
            max={200}
            value={arrivalMultiplierPct}
            onChange={e => setArrivalMultiplierPct(Number(e.target.value))}
          />
          <div className="mt-1 text-xs text-gray-500">
            20 to 200, default 100
          </div>
        </label>

        <label className="text-sm">
          <div className="text-gray-700">Consumption (kWh per 100 km)</div>
          <input
            className="mt-1 w-full rounded border px-3 py-2"
            type="number"
            min={1}
            value={consumptionKwhPer100km}
            onChange={e => setConsumptionKwhPer100km(Number(e.target.value))}
          />
        </label>

        <label className="text-sm">
          <div className="text-gray-700">Charger power (kW per point)</div>
          <input
            className="mt-1 w-full rounded border px-3 py-2"
            type="number"
            min={0.1}
            value={chargerPowerKw}
            onChange={e => setChargerPowerKw(Number(e.target.value))}
          />
        </label>
      </div>

      {error && <div className="mt-3 text-sm text-red-700">{error}</div>}

      <button
        className="mt-4 w-full rounded bg-gray-900 px-4 py-2 text-white disabled:opacity-50"
        onClick={submit}
        disabled={submitting}
      >
        {submitting ? "Creating..." : "Create"}
      </button>
    </div>
  );
}
