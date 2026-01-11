import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";
import type { ExemplaryDayPoint } from "../typesOutput";
import { tickIndexToTimeLabel } from "../time";

type Props = {
  points: ExemplaryDayPoint[];
};

export function ExemplaryDayChart({ points }: Props) {
  const data = points.map(p => ({
    tickIndex: p.tickIndex,
    time: tickIndexToTimeLabel(p.tickIndex),
    totalPowerKw: p.totalPowerKw
  }));

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <div className="text-lg font-semibold text-gray-900">Exemplary day</div>
      <div className="mt-1 text-xs text-gray-500">Total site power (kW) in 15 minute ticks</div>

      <div className="mt-4 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="tickIndex"
              tickFormatter={(v: number) => tickIndexToTimeLabel(v)}
              interval={7}
              tick={{ fontSize: 12 }}
            />
            <YAxis />
            <Tooltip
              formatter={(value: unknown) => [`${Number(value).toFixed(1)} kW`, "Total power"]}
              labelFormatter={(label: unknown) => `Time ${tickIndexToTimeLabel(Number(label))}`}
            />
            <Line type="monotone" dataKey="totalPowerKw" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
