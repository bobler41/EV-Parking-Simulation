import { useMemo, useState } from "react";
import type { ChargingEventAgg } from "../typesOutput";

type Props = {
  aggs: ChargingEventAgg[];
};

type Period = "day" | "week" | "month" | "year";

function formatPeriodStart(period: Period, iso: string): string {
  const d = new Date(iso);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");

  if (period === "year") return `${y}-01-01`;
  if (period === "month") return `${y}-${m}-01`;
  return `${y}-${m}-${day}`;
}

export function EventCounts({ aggs }: Props) {
  const [period, setPeriod] = useState<Period>("month");

  const rows = useMemo(() => {
    const filtered = aggs
      .filter(a => a.period === period)
      .sort((a, b) => a.periodStart.localeCompare(b.periodStart));

    if (period === "day") {
      return filtered.slice(-30);
    }

    if (period === "week") {
      return filtered.slice(-12);
    }

    if (period === "month") {
      return filtered.slice(-12);
    }

    return filtered;
  }, [aggs, period]);

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-lg font-semibold text-gray-900">Charging events</div>
          <div className="text-xs text-gray-500">
            Showing {period} aggregation.
          </div>
        </div>

        <select
          className="rounded border px-2 py-1 text-sm"
          value={period}
          onChange={e => setPeriod(e.target.value as Period)}
        >
          <option value="day">Day</option>
          <option value="week">Week</option>
          <option value="month">Month</option>
          <option value="year">Year</option>
        </select>
      </div>

      <div className="mt-4 overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600">
              <th className="py-2 pr-3">Period start</th>
              <th className="py-2">Events</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="border-t">
                <td className="py-2 pr-3 text-gray-700">
                  {formatPeriodStart(period, r.periodStart)}
                </td>
                <td className="py-2 text-gray-900 font-medium">{r.eventCount}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="py-2 text-gray-600" colSpan={2}>
                  No data.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {period === "day" && (
        <div className="mt-2 text-xs text-gray-500">
          For day aggregation we show the most recent 30 days with events.
        </div>
      )}
      {period === "week" && (
        <div className="mt-2 text-xs text-gray-500">
          For week aggregation we show the most recent 12 weeks with events.
        </div>
      )}
    </div>
    
  );
}
