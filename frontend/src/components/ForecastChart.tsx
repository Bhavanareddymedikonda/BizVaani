// ============================================================
// ForecastChart — Task: Member D
// See: BizVaani_Developer_Reference.md (Section 7 — ML Engine)
// TODO: Replace with Recharts (npm install recharts)
// ============================================================

interface ForecastPoint {
  date: string;
  predicted_qty: number;
  lower_bound: number;
  upper_bound: number;
}

export default function ForecastChart({
  data,
  productName,
}: {
  data: ForecastPoint[];
  productName: string;
}) {
  // Placeholder — Member D will replace with Recharts AreaChart
  const maxQty = Math.max(...data.map((d) => d.upper_bound));

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <h3 className="font-semibold text-gray-900 mb-3">
        {productName} — 7-Day Forecast
      </h3>

      {/* Simple bar chart placeholder */}
      <div className="flex items-end gap-2 h-40">
        {data.map((point, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            {/* Confidence band */}
            <div className="w-full relative flex flex-col items-center">
              <div
                className="w-full bg-orange-100 rounded-t"
                style={{ height: `${(point.upper_bound / maxQty) * 120}px` }}
              >
                <div
                  className="w-full bg-orange-400 rounded-t"
                  style={{ height: `${(point.predicted_qty / point.upper_bound) * 100}%` }}
                />
              </div>
            </div>
            <span className="text-[10px] text-gray-400">
              {new Date(point.date).toLocaleDateString("en", { weekday: "short" })}
            </span>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400 mt-2 text-center">
        Replace this placeholder with Recharts AreaChart for the demo
      </p>
    </div>
  );
}
