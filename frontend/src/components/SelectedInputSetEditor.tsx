import { useEffect, useMemo, useState } from "react";
import type { InputSet } from "../types";

type Props = {
  inputSet: InputSet;
  onSave: (id: string, patch: Partial<Pick<
    InputSet,
    "name" | "chargePoints" | "arrivalMultiplier" | "consumptionKwhPer100km" | "chargerPowerKw"
  >>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
};

function toPct(multiplier: number): number {
  return Math.round(multiplier * 100);
}

export function SelectedInputSetEditor({ inputSet, onSave, onDelete }: Props) {
  const [name, setName] = useState(inputSet.name ?? "");
  const [chargePoints, setChargePoints] = useState(inputSet.chargePoints);
  const [arrivalMultiplierPct, setArrivalMultiplierPct] = useState(toPct(inputSet.arrivalMultiplier));
  const [consumption, setConsumption] = useState(inputSet.consumptionKwhPer100km);
  const [power, setPower] = useState(inputSet.chargerPowerKw);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    setName(inputSet.name ?? "");
    setChargePoints(inputSet.chargePoints);
    setArrivalMultiplierPct(toPct(inputSet.arrivalMultiplier));
    setConsumption(inputSet.consumptionKwhPer100km);
    setPower(inputSet.chargerPowerKw);
    setError(null);
    setSavedMsg(null);
  }, [inputSet.id]);

  const isDirty = useMemo(() => {
    const arrivalMultiplier = arrivalMultiplierPct / 100;
    return (
      (inputSet.name ?? "") !== name ||
      inputSet.chargePoints !== chargePoints ||
      Math.abs(inputSet.arrivalMultiplier - arrivalMultiplier) > 1e-9 ||
      inputSet.consumptionKwhPer100km !== consumption ||
      inputSet.chargerPowerKw !== power
    );
  }, [inputSet, name, chargePoints, arrivalMultiplierPct, consumption, power]);

  async function save() {
    setError(null);
    setSavedMsg(null);
    setSaving(true);

    try {
      const patch = {
        name: name.trim() ? name.trim() : null,
        chargePoints,
        arrivalMultiplier: arrivalMultiplierPct / 100,
        consumptionKwhPer100km: consumption,
        chargerPowerKw: power
      };

      await onSave(inputSet.id, patch);
      setSavedMsg("Saved.");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    const ok = window.confirm("Delete this input set? This cannot be undone.");
    if (!ok) return;

    setError(null);
    setDeleting(true);

    try {
      await onDelete(inputSet.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setDeleting(false);
    } finally {
    setDeleting(false);
    }
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-semibold text-gray-900">Selected input set</div>
          <div className="mt-1 text-xs text-gray-500">{inputSet.id}</div>
        </div>

        <button
          className="rounded border px-3 py-2 text-sm text-red-700 border-red-200 hover:bg-red-50 disabled:opacity-50"
          onClick={remove}
          disabled={deleting}
        >
          {deleting ? "Deleting..." : "Delete"}
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3">
        <label className="text-sm">
          <div className="text-gray-700">Name</div>
          <input
            className="mt-1 w-full rounded border px-3 py-2"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
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
            <div className="text-gray-700">Charger power (kW)</div>
            <input
              className="mt-1 w-full rounded border px-3 py-2"
              type="number"
              min={0.1}
              value={power}
              onChange={e => setPower(Number(e.target.value))}
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
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
          </label>

          <label className="text-sm">
            <div className="text-gray-700">Consumption (kWh per 100 km)</div>
            <input
              className="mt-1 w-full rounded border px-3 py-2"
              type="number"
              min={1}
              value={consumption}
              onChange={e => setConsumption(Number(e.target.value))}
            />
          </label>
        </div>
      </div>

      {error && <div className="mt-3 text-sm text-red-700">{error}</div>}
      {savedMsg && <div className="mt-3 text-sm text-green-700">{savedMsg}</div>}

      <button
        className="mt-4 w-full rounded bg-gray-900 px-4 py-2 text-white disabled:opacity-50"
        onClick={save}
        disabled={!isDirty || saving}
      >
        {saving ? "Saving..." : isDirty ? "Save changes" : "No changes"}
      </button>
    </div>
  );
}
