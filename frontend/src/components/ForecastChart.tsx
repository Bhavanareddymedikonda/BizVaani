"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { ForecastPoint } from "@/lib/forecastSeedData";

/* ─── Props ──────────────────────────────────────────────── */
interface Props {
  data: ForecastPoint[];
  productName?: string;
}

/* ─── Custom Tooltip ─────────────────────────────────────── */
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div
      className="rounded-2xl border border-white/10 bg-[#1a1336]/95 px-4 py-3 text-xs shadow-[0_8px_32px_rgba(0,0,0,0.6)] backdrop-blur-xl"
    >
      <p className="mb-2 font-bold text-white/90">
        {label
          ? new Date(label).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })
          : ""}
      </p>
      {payload.map((p, i) => {
        if (p.dataKey === "lower_bound" || p.dataKey === "upper_bound") return null;
        return (
          <p key={i} className="flex items-center gap-2">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: p.color }}
            />
            <span className="text-white/60">{p.name}:</span>
            <span className="font-bold text-white">{p.value} kg</span>
          </p>
        );
      })}
    </div>
  );
}

/* ─── Main Chart ─────────────────────────────────────────── */
export default function ForecastChart({
  data,
  productName = "Product",
}: Props) {
  if (!data.length) {
    return (
      <div className="flex h-[300px] items-center justify-center text-sm text-white/40">
        No forecast data available
      </div>
    );
  }

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div className="advanced-card p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-extrabold tracking-wide text-white">
          Demand Trajectory
        </h3>
        <div className="flex items-center gap-5 text-xs text-white/50">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-[#f97316]" />
            AI Forecast
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-[#f97316]/30" />
            Confidence Band
          </span>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={320}>
        <AreaChart
          data={data}
          margin={{ top: 8, right: 8, bottom: 0, left: -12 }}
        >
          <defs>
            <linearGradient id="actualGradFc" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#c084fc" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#c084fc" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="forecastGradFc" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f97316" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="bandGradFc" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f97316" stopOpacity={0.12} />
              <stop offset="95%" stopColor="#f97316" stopOpacity={0.02} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.06)"
            vertical={false}
          />

          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "rgba(255,255,255,0.35)" }}
            tickFormatter={(v) =>
              new Date(v).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
              })
            }
            interval={2}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "rgba(255,255,255,0.35)" }}
            axisLine={false}
            tickLine={false}
            width={40}
          />

          <Tooltip content={<CustomTooltip />} />

          {/* Today reference line */}
          <ReferenceLine
            x={todayStr}
            stroke="rgba(192,132,252,0.5)"
            strokeDasharray="4 4"
            label={{
              value: "Today",
              fill: "rgba(192,132,252,0.7)",
              fontSize: 10,
              fontWeight: 700,
            }}
          />

          {/* Confidence band — upper bound */}
          <Area
            type="monotone"
            dataKey="upper_bound"
            name="Upper Bound"
            stroke="none"
            fill="url(#bandGradFc)"
            fillOpacity={1}
            dot={false}
            activeDot={false}
            connectNulls={false}
          />

          {/* Confidence band — lower bound (erases area below) */}
          <Area
            type="monotone"
            dataKey="lower_bound"
            name="Lower Bound"
            stroke="none"
            fill="#090614"
            fillOpacity={0.6}
            dot={false}
            activeDot={false}
            connectNulls={false}
          />

          {/* Actual historical line */}
          <Area
            type="monotone"
            dataKey="actual"
            name="Actual Sales"
            stroke="#c084fc"
            strokeWidth={2.5}
            fill="url(#actualGradFc)"
            dot={{ r: 3, fill: "#c084fc", stroke: "#090614", strokeWidth: 2 }}
            activeDot={{
              r: 5,
              fill: "#c084fc",
              stroke: "#fff",
              strokeWidth: 2,
            }}
            connectNulls={false}
          />

          {/* Forecast line */}
          <Area
            type="monotone"
            dataKey="forecast"
            name="AI Forecast"
            stroke="#f97316"
            strokeWidth={2.5}
            strokeDasharray="6 4"
            fill="url(#forecastGradFc)"
            dot={{
              r: 3,
              fill: "#f97316",
              stroke: "#090614",
              strokeWidth: 2,
            }}
            activeDot={{
              r: 5,
              fill: "#f97316",
              stroke: "#fff",
              strokeWidth: 2,
            }}
            connectNulls={false}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Subtitle */}
      <p className="mt-3 text-center text-xs text-white/30">
        {productName} — 14-day history + 7-day AI prediction
      </p>
    </div>
  );
}
