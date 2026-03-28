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

/* ─── Types ──────────────────────────────────────────────── */
interface SalesPoint {
  date:         string;
  actual?:      number;
  forecast?:    number;
  lower_bound?: number;
  upper_bound?: number;
}

interface Props {
  data?:        SalesPoint[];
  productName?: string;
  /** If true, renders a mocked 30-day trend for demo purposes */
  useMock?:     boolean;
}

/* ─── Mock data (used while real data loads) ─────────────── */
function generateMockData(): SalesPoint[] {
  const today = new Date();
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (29 - i));
    const base = 35 + Math.sin(i * 0.4) * 8;
    const noise = (Math.random() - 0.5) * 6;
    const actual = Math.max(0, Math.round(base + noise));
    // Last 7 days: show forecast
    const isForecast = i >= 23;
    return {
      date:        d.toISOString().split("T")[0],
      actual:      isForecast ? undefined : actual,
      forecast:    isForecast ? Math.round(base + 2) : undefined,
      lower_bound: isForecast ? Math.round(base - 4) : undefined,
      upper_bound: isForecast ? Math.round(base + 8) : undefined,
    };
  });
}

/* ─── Custom Tooltip ─────────────────────────────────────── */
const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="px-3 py-2 text-xs space-y-1"
      style={{
        borderRadius: "var(--radius-sm)",
        background: "var(--color-surface-0)",
        boxShadow: "var(--shadow-clay)",
        border: "1px solid rgba(255,255,255,0.5)",
        color: "var(--color-text-strong)",
      }}
    >
      <p className="font-bold mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: {p.value} kg
        </p>
      ))}
    </div>
  );
};

/* ─── Main Chart ─────────────────────────────────────────── */
export default function ForecastChart({ data, productName = "Sales", useMock = true }: Props) {
  const chartData = data ?? (useMock ? generateMockData() : []);

  if (!chartData.length) {
    return (
      <div
        className="flex items-center justify-center text-sm"
        style={{ height: 200, color: "var(--color-text-soft)" }}
      >
        Abhi koi data nahi hai
      </div>
    );
  }

  // Today marker
  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>
          {productName} — 30 Din
        </p>
        <div className="flex items-center gap-3 text-xs" style={{ color: "var(--color-text-soft)" }}>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-0.5" style={{ background: "var(--color-primary-500)" }} />
            Actual
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-0.5 border-t border-dashed" style={{ borderColor: "var(--color-info)" }} />
            Forecast
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="var(--color-primary-500)" stopOpacity={0.25} />
              <stop offset="95%" stopColor="var(--color-primary-500)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="var(--color-info)" stopOpacity={0.20} />
              <stop offset="95%" stopColor="var(--color-info)" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="rgba(146,121,96,0.10)" />

          <XAxis
            dataKey="date"
            tick={{ fontSize: 9, fill: "var(--color-text-soft)" }}
            tickFormatter={(v) =>
              new Date(v).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
            }
            interval={6}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 9, fill: "var(--color-text-soft)" }}
            axisLine={false}
            tickLine={false}
          />

          <Tooltip content={<CustomTooltip />} />

          {/* Today reference line */}
          <ReferenceLine
            x={todayStr}
            stroke="var(--color-primary-400)"
            strokeDasharray="4 4"
            label={{ value: "Today", fill: "var(--color-primary-400)", fontSize: 9 }}
          />

          {/* Actual sales */}
          <Area
            type="monotone"
            dataKey="actual"
            name="Actual"
            stroke="var(--color-primary-500)"
            strokeWidth={2}
            fill="url(#actualGrad)"
            dot={false}
            activeDot={{ r: 4, fill: "var(--color-primary-500)" }}
            connectNulls={false}
          />

          {/* Forecast */}
          <Area
            type="monotone"
            dataKey="forecast"
            name="Forecast"
            stroke="var(--color-info)"
            strokeWidth={2}
            strokeDasharray="5 4"
            fill="url(#forecastGrad)"
            dot={false}
            activeDot={{ r: 4, fill: "var(--color-info)" }}
            connectNulls={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
