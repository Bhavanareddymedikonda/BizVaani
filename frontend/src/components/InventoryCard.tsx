"use client";

import { Package, AlertOctagon, TrendingDown, RefreshCw } from "lucide-react";

export default function InventoryCard({ item }: { item: any }) {
  const isCritical = item.status === "CRITICAL";
  const isLow = item.status === "LOW_STOCK";
  const isOk = item.status === "IN_STOCK";

  return (
    <div className={`advanced-card p-5 relative flex flex-col justify-between group overflow-hidden ${isCritical ? 'bg-red-500/10 border-red-500/30' : ''}`}>
      {/* Decorative side accent */}
      {isCritical && <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)]" />}
      {isLow && <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.8)]" />}

      <div>
        <div className="flex justify-between items-start mb-4 pl-2">
          <div>
            <span className="text-[10px] font-black uppercase text-white/50 tracking-wider bg-white/5 border border-white/10 px-2 py-0.5 rounded-md">{item.category}</span>
            <h3 className="font-extrabold text-white text-xl mt-1 tracking-wide">{item.name}</h3>
          </div>
          <div className={`p-2 rounded-xl bg-white/5 border border-white/10`}>
            {isCritical ? <AlertOctagon className="text-red-400" size={24} /> : isLow ? <TrendingDown className="text-yellow-400" size={24} /> : <Package className="text-green-400" size={24} />}
          </div>
        </div>
        
        <div className="flex gap-4 mb-4 pl-2">
          <div>
            <p className="text-[10px] uppercase font-bold text-[#c084fc]/60 mb-0.5 tracking-wider">In Stock</p>
            <p className={`text-3xl font-black drop-shadow-md tracking-tighter ${isCritical ? 'text-red-400 drop-shadow-[0_0_12px_rgba(239,68,68,0.4)]' : isLow ? 'text-yellow-400' : 'text-[#c084fc]'}`}>
              {item.in_stock} <span className="text-sm font-bold opacity-60">{item.unit}</span>
            </p>
          </div>
          <div className="border-l border-white/10 pl-4">
            <p className="text-[10px] uppercase font-bold text-[#c084fc]/60 mb-0.5 tracking-wider">Required</p>
            <p className="text-xl font-black text-white opacity-80 mt-1">
              {item.minimum_required} <span className="text-xs font-bold">{item.unit}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="mt-2 pl-2 flex justify-between items-center border-t border-white/10 pt-4">
        {isCritical || isLow ? (
          <p className="text-xs font-bold text-red-400 uppercase tracking-widest flex items-center gap-1">
            Restock ASAP
          </p>
        ) : (
          <p className="text-[10px] uppercase font-bold text-green-400 tracking-wider">Healthy Stock</p>
        )}
        
        <button 
          onClick={() => console.log(`Update stock clicked for ${item.name}`)}
          className="advanced-btn-sm px-4 py-2 text-[10px] sm:text-xs flex items-center gap-1.5"
        >
          <RefreshCw size={14} /> Update
        </button>
      </div>
    </div>
  );
}
