import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface ProductCardProps {
  name: string;
  todayQty: number;
  todayRevenue: number;
  trendPct: number;
  mandiPrice: number;
  riskLevel: "HIGH" | "MEDIUM" | "LOW";
}

export default function ProductCard({
  name,
  todayQty,
  todayRevenue,
  trendPct,
  mandiPrice,
  riskLevel,
}: ProductCardProps) {
  const isPositive = trendPct > 0;
  const isNeutral = trendPct === 0;
  
  const riskColors = {
    HIGH: "bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)]",
    MEDIUM: "bg-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.8)]",
    LOW: "bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.8)]"
  };

  return (
    <div className="advanced-card p-5 advanced-card-hover cursor-pointer group flex flex-col justify-between">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-extrabold text-white text-lg uppercase tracking-wider">{name}</h3>
        <div className="flex items-center gap-2">
          {/* Risk dot */}
          <div className={`w-3.5 h-3.5 rounded-full ${riskColors[riskLevel]} border border-white/40`} title={`Risk: ${riskLevel}`} />
        </div>
      </div>
      
      <div className="my-3">
        <p className="text-4xl font-black text-[#c084fc] drop-shadow-[0_0_12px_rgba(192,132,252,0.3)] tracking-tighter">₹{todayRevenue.toLocaleString()}</p>
        <p className="text-sm font-medium border-t border-white/10 mt-3 pt-3 text-[#c084fc]/60">
          Qty: <span className="font-bold text-white/90">{todayQty}</span> • Mandi: <span className="font-bold text-white/90">₹{mandiPrice}</span>
        </p>
      </div>

      <div className="mt-2">
        <div className={`inline-flex items-center px-3 py-1.5 rounded-xl uppercase text-[10px] sm:text-xs font-bold border ${isPositive ? "bg-green-500/10 text-green-400 border-green-500/20" : isNeutral ? "bg-white/5 text-white/50 border-white/10" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
          {isPositive ? <TrendingUp size={16} className="mr-1.5" /> : isNeutral ? <Minus size={16} className="mr-1.5" /> : <TrendingDown size={16} className="mr-1.5" />}
          {Math.abs(trendPct)}% vs 7D Avg
        </div>
      </div>
    </div>
  );
}
