// ============================================================
// ProductCard — Task: Member C
// See: FRONTEND_GUIDELINES.md (Section 4 — Product Card)
// ============================================================

interface Product {
  id: number;
  name: string;
  today_qty: number;
  today_revenue: number;
  trend_pct: number;
  mandi_price: number;
  risk_level: "HIGH" | "MEDIUM" | "LOW";
}

const RISK_COLORS = {
  HIGH: "bg-red-500",
  MEDIUM: "bg-yellow-500",
  LOW: "bg-green-500",
};

export default function ProductCard({ product }: { product: Product }) {
  const isUp = product.trend_pct > 0;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${RISK_COLORS[product.risk_level]}`} />
          <p className="font-semibold text-gray-800 text-base">{product.name}</p>
        </div>
        <span
          className={`text-sm font-medium px-2 py-0.5 rounded-full ${
            isUp ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}
        >
          {isUp ? "↑" : "↓"} {Math.abs(product.trend_pct)}%
        </span>
      </div>
      <p className="text-2xl font-bold text-gray-900 mt-2">
        ₹{product.today_revenue.toLocaleString()}
      </p>
      <div className="flex justify-between items-center mt-1">
        <p className="text-xs text-gray-400">
          {product.today_qty} units sold today
        </p>
        <p className="text-xs text-gray-400">
          Mandi: ₹{product.mandi_price}/{product.name === "Cooking Oil" ? "L" : "kg"}
        </p>
      </div>
    </div>
  );
}
