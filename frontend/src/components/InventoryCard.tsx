"use client";

import { AlertOctagon, Package, RefreshCw, TrendingDown } from "lucide-react";
import type { InventoryItem } from "@/lib/api";

export default function InventoryCard({
  item,
  onUpdate,
}: {
  item: InventoryItem;
  onUpdate: (item: InventoryItem) => void;
}) {
  const isCritical = item.status === "CRITICAL";
  const isLow = item.status === "LOW_STOCK";

  return (
    <div
      className={`advanced-card relative flex flex-col justify-between overflow-hidden p-5 ${
        isCritical ? "border-red-500/30 bg-red-500/10" : ""
      }`}
    >
      {isCritical && <div className="absolute bottom-0 left-0 top-0 w-1 bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)]" />}
      {isLow && !isCritical && <div className="absolute bottom-0 left-0 top-0 w-1 bg-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.8)]" />}

      <div>
        <div className="mb-4 flex items-start justify-between pl-2">
          <div>
            <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white/50">
              {item.category}
            </span>
            <h3 className="mt-1 text-xl font-extrabold tracking-wide text-white">{item.name}</h3>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-2">
            {isCritical ? (
              <AlertOctagon className="text-red-400" size={24} />
            ) : isLow ? (
              <TrendingDown className="text-yellow-400" size={24} />
            ) : (
              <Package className="text-green-400" size={24} />
            )}
          </div>
        </div>

        <div className="mb-4 flex gap-4 pl-2">
          <div>
            <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-[#c084fc]/60">In Stock</p>
            <p className={`text-3xl font-black tracking-tighter ${isCritical ? "text-red-400" : isLow ? "text-yellow-400" : "text-[#c084fc]"}`}>
              {item.in_stock} <span className="text-sm font-bold opacity-60">{item.unit}</span>
            </p>
          </div>
          <div className="border-l border-white/10 pl-4">
            <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-[#c084fc]/60">Required</p>
            <p className="mt-1 text-xl font-black text-white opacity-80">
              {item.minimum_required} <span className="text-xs font-bold">{item.unit}</span>
            </p>
          </div>
        </div>

        <div className="pl-2 text-xs text-white/65">
          Avg daily demand: {item.avg_daily_qty} {item.unit}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-white/10 pl-2 pt-4">
        <p className={`text-[10px] font-bold uppercase tracking-wider ${isCritical || isLow ? "text-red-400" : "text-green-400"}`}>
          {isCritical || isLow ? "Restock needed" : "Healthy stock"}
        </p>

        <button onClick={() => onUpdate(item)} className="advanced-btn-sm flex items-center gap-1.5 px-4 py-2 text-[10px] sm:text-xs">
          <RefreshCw size={14} /> Update
        </button>
      </div>
    </div>
  );
}
