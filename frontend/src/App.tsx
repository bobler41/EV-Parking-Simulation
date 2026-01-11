import { useEffect, useState } from "react";
import { apiGet, apiPost } from "./api";
import type { InputSet } from "./types";
import { InputSetList } from "./components/InputSetList";
import { InputSetForm } from "./components/InputSetForm";
import type { SimulationRun } from "./typesSimulation";
import { ExemplaryDayChart } from "./components/ExemplaryDayChart";
import { EventCounts } from "./components/EventCounts";
import type { ChargingEventAgg, ExemplaryDayPoint } from "./typesOutput";
import { apiDelete, apiPatch } from "./api";
import { SelectedInputSetEditor } from "./components/SelectedInputSetEditor";



type HealthResponse = { ok: boolean; db: boolean };

function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);

  const [inputSets, setInputSets] = useState<InputSet[]>([]);
  const [selectedInputSetId, setSelectedInputSetId] = useState<string | null>(null);
  const [loadingInputSets, setLoadingInputSets] = useState(false);
  const [inputSetsError, setInputSetsError] = useState<string | null>(null);

  const [simulationRun, setSimulationRun] = useState<SimulationRun | null>(null);
  const [runningSimulation, setRunningSimulation] = useState(false);
  const [simulationError, setSimulationError] = useState<string | null>(null);

  const [exemplaryDay, setExemplaryDay] = useState<ExemplaryDayPoint[] | null>(null);
  const [eventAggs, setEventAggs] = useState<ChargingEventAgg[] | null>(null);
  const [outputError, setOutputError] = useState<string | null>(null);
  const [loadingOutputs, setLoadingOutputs] = useState(false);

  const selectedInputSet = inputSets.find(x => x.id === selectedInputSetId) ?? null;

  async function loadInputSets() {
    setLoadingInputSets(true);
    setInputSetsError(null);
    try {
      const items = await apiGet<InputSet[]>("/input-sets");
      setInputSets(items);
      if (!selectedInputSetId && items.length > 0) {
        setSelectedInputSetId(items[0]!.id);
      }
    } catch (e) {
      setInputSetsError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoadingInputSets(false);
    }
  }

  useEffect(() => {
    apiGet<HealthResponse>("/health")
      .then(setHealth)
      .catch(e => setHealthError(e instanceof Error ? e.message : String(e)));
  }, []);

  useEffect(() => {
    loadInputSets();
  }, []);

  async function createInputSet(data: {
    name?: string;
    chargePoints: number;
    arrivalMultiplier: number;
    consumptionKwhPer100km: number;
    chargerPowerKw: number;
  }) {
    await apiPost<InputSet>("/input-sets", data);
    await loadInputSets();
  }

  async function saveInputSet(
    id: string,
    patch: Partial<Pick<InputSet, "name" | "chargePoints" | "arrivalMultiplier" | "consumptionKwhPer100km" | "chargerPowerKw">>
  ) {
    await apiPatch<InputSet>(`/input-sets/${id}`, patch);
    await loadInputSets();
  }

  async function deleteInputSet(id: string) {
    await apiDelete(`/input-sets/${id}`);
    await loadInputSets();

    setSelectedInputSetId(prev => {
      if (prev !== id) return prev;
      const remaining = inputSets.filter(x => x.id !== id);
      return remaining.length > 0 ? remaining[0]!.id : null;
    });
  }


  async function runSimulation() {
    if (!selectedInputSetId) return;

    setRunningSimulation(true);
    setSimulationError(null);
    setExemplaryDay(null);
    setEventAggs(null);

  try {
    const run = await apiPost<SimulationRun>("/simulation-runs", {
      inputSetId: selectedInputSetId
    });

    setSimulationRun(run);
    setLoadingOutputs(true);
    setOutputError(null);

    try {
      const [day, aggs] = await Promise.all([
        apiGet<ExemplaryDayPoint[]>(`/simulation-runs/${run.id}/exemplary-day`),
        apiGet<ChargingEventAgg[]>(`/simulation-runs/${run.id}/event-counts`)
      ]);
      setExemplaryDay(day);
      setEventAggs(aggs);
    } catch (e) {
      setOutputError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoadingOutputs(false);
    }
  } catch (e) {
      setSimulationError(e instanceof Error ? e.message : String(e));
  } finally {
      setRunningSimulation(false);
  }
}

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-2xl font-bold text-gray-900">EV Parking Simulation</div>

        <div className="mt-2 text-sm">
          {healthError && <span className="text-red-700">{healthError}</span>}
          {!healthError && !health && <span className="text-gray-600">Checking backend...</span>}
          {health && (
            <span className="text-gray-700">
              Backend ok: {String(health.ok)} | DB ok: {String(health.db)}
            </span>
          )}
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div>
              {loadingInputSets && <div className="text-sm text-gray-600">Loading input sets...</div>}
              {inputSetsError && <div className="text-sm text-red-700">{inputSetsError}</div>}
              {!loadingInputSets && !inputSetsError && (
                <InputSetList
                  items={inputSets}
                  selectedId={selectedInputSetId}
                  onSelect={setSelectedInputSetId}
                />
              )}
            </div>

            <InputSetForm onCreate={createInputSet} />
            {selectedInputSet ? (
              <SelectedInputSetEditor
                inputSet={selectedInputSet}
                onSave={saveInputSet}
                onDelete={deleteInputSet}
              />
            ) : (
              <div className="p-4 bg-white rounded-lg shadow">
                <div className="text-lg font-semibold text-gray-900">Selected input set</div>
                <div className="mt-2 text-sm text-gray-600">None selected.</div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="p-4 bg-white rounded-lg shadow">
              <div className="text-lg font-semibold text-gray-900">Simulation</div>

              <button
                className="mt-3 rounded bg-gray-900 px-4 py-2 text-white disabled:opacity-50"
                onClick={runSimulation}
                disabled={!selectedInputSetId || runningSimulation}
              >
                {runningSimulation ? "Running..." : "Run simulation"}
              </button>

              {simulationError && <div className="mt-3 text-sm text-red-700">{simulationError}</div>}

              {simulationRun && (
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 rounded border">
                    <div className="text-xs text-gray-500">Total energy</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {simulationRun.totalEnergyKwh.toFixed(0)} kWh
                    </div>
                  </div>

                  <div className="p-3 rounded border">
                    <div className="text-xs text-gray-500">Concurrency factor</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {(simulationRun.concurrencyFactor * 100).toFixed(1)}%
                    </div>
                  </div>

                  <div className="p-3 rounded border">
                    <div className="text-xs text-gray-500">Theoretical max</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {simulationRun.theoreticalMaxKw} kW
                    </div>
                  </div>

                  <div className="p-3 rounded border">
                    <div className="text-xs text-gray-500">Actual max</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {simulationRun.actualMaxKw} kW
                    </div>
                  </div>

                  <div className="p-3 rounded border col-span-2">
                    <div className="text-xs text-gray-500">Yearly charging events</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {simulationRun.yearlyEventCount}
                    </div>
                  </div>
                </div>
              )}

              {loadingOutputs && (
                <div className="mt-3 text-sm text-gray-600">Loading charts...</div>
              )}

              {outputError && <div className="mt-3 text-sm text-red-700">{outputError}</div>}
            </div>

            {exemplaryDay && exemplaryDay.length > 0 && <ExemplaryDayChart points={exemplaryDay} />}

            {eventAggs && eventAggs.length > 0 && <EventCounts aggs={eventAggs} />}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
