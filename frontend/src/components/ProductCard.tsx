import { Minus, TrendingDown, TrendingUp } from "lucide-react";

interface ProductCardProps {
  name: string;
  todayQty: number;
  todayRevenue: number;
  stockQty: number;
  stockStatus: "CRITICAL" | "LOW_STOCK" | "IN_STOCK";
  unit: string;
  trendPct: number;
  mandiPrice: number;
  riskLevel: "HIGH" | "MEDIUM" | "LOW";
}

export default function ProductCard({
  name,
  todayQty,
  todayRevenue,
  stockQty,
  stockStatus,
  unit,
  trendPct,
  mandiPrice,
  riskLevel,
}: ProductCardProps) {
  const isPositive = trendPct > 0;
  const isNeutral = trendPct === 0;

  const riskColors = {
    HIGH: "bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)]",
    MEDIUM: "bg-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.8)]",
    LOW: "bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.8)]",
  };

  const stockColors = {
    CRITICAL: "text-red-300",
    LOW_STOCK: "text-yellow-300",
    IN_STOCK: "text-green-300",
  };

  return (
    <div className="advanced-card advanced-card-hover group flex min-w-0 cursor-pointer flex-col justify-between overflow-hidden p-5">
      <div className="mb-2 flex min-w-0 items-start justify-between gap-3">
        <h3 className="min-w-0 break-words text-lg font-extrabold uppercase tracking-wider text-white">{name}</h3>
        <div className="flex items-center gap-2">
          <div className={`h-3.5 w-3.5 rounded-full border border-white/40 ${riskColors[riskLevel]}`} title={`Risk: ${riskLevel}`} />
        </div>
      </div>

      <div className="my-3 min-w-0">
        <p className="overflow-hidden text-[clamp(2.2rem,3vw,3.8rem)] font-black leading-none tracking-[-0.05em] text-[#c084fc] drop-shadow-[0_0_12px_rgba(192,132,252,0.3)]">
          Rs.{todayRevenue.toLocaleString()}
        </p>
        <p className="mt-3 border-t border-white/10 pt-3 text-sm font-medium leading-6 text-[#c084fc]/60">
          Qty: <span className="font-bold text-white/90">{todayQty}</span> | Mandi: <span className="font-bold text-white/90">Rs.{mandiPrice}</span>
        </p>
        <p className="mt-2 break-words text-xs font-bold uppercase tracking-[0.2em] text-white/60">
          Stock: <span className={stockColors[stockStatus]}>{stockQty} {unit}</span>
        </p>
      </div>

      <div className="mt-2">
        <div className={`inline-flex items-center rounded-xl border px-3 py-1.5 text-[10px] font-bold uppercase sm:text-xs ${isPositive ? "border-green-500/20 bg-green-500/10 text-green-400" : isNeutral ? "border-white/10 bg-white/5 text-white/50" : "border-red-500/20 bg-red-500/10 text-red-400"}`}>
          {isPositive ? <TrendingUp size={16} className="mr-1.5" /> : isNeutral ? <Minus size={16} className="mr-1.5" /> : <TrendingDown size={16} className="mr-1.5" />}
          {Math.abs(trendPct)}% vs 7D Avg
        </div>
      </div>
    </div>
  );
}
