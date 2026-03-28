"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, History, PackagePlus } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import InventoryCard from "@/components/InventoryCard";
import MicFAB from "@/components/MicFAB";
import {
  adjustInventory,
  getInventory,
  getInventoryTransactions,
  type InventoryItem,
  type StockTransaction,
} from "@/lib/api";

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [selected, setSelected] = useState<InventoryItem | null>(null);
  const [quantityDelta, setQuantityDelta] = useState("");
  const [adjustmentType, setAdjustmentType] = useState<"restock" | "manual_adjustment">("restock");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const [inventoryData, transactionData] = await Promise.all([
        getInventory(),
        getInventoryTransactions({ limit: 12 }),
      ]);
      setInventory(inventoryData);
      setTransactions(transactionData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const criticalItems = inventory.filter((item) => item.status === "CRITICAL");
  const lowItems = inventory.filter((item) => item.status === "LOW_STOCK");
  const inStockItems = inventory.filter((item) => item.status === "IN_STOCK");

  async function handleSubmitAdjustment() {
    if (!selected) return;
    const parsedDelta = Number(quantityDelta);
    if (!parsedDelta) {
      setError("Enter a non-zero stock change.");
      return;
    }

    setSubmitting(true);
    try {
      await adjustInventory({
        product_id: selected.id,
        quantity_delta: adjustmentType === "restock" ? Math.abs(parsedDelta) : -Math.abs(parsedDelta),
        transaction_type: adjustmentType,
        notes,
      });
      setQuantityDelta("");
      setNotes("");
      setSelected(null);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Stock update failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0d1024] pb-24 font-sans text-white selection:bg-[#00d4ff] selection:text-black md:pb-0 md:pl-64">
      <header className="sticky top-0 z-30 border-b border-white/8 bg-[#0d1024]/80 px-4 py-6 backdrop-blur-md md:px-8">
        <h1 className="text-2xl font-black uppercase tracking-wide text-white">
          Inventory <span className="text-[#00d4ff]">Ledger</span>
        </h1>
        <p className="mt-1 text-xs font-bold uppercase tracking-[0.22em] text-[#8ea3d8]">
          Live stock balances, transaction history, and fast updates
        </p>
      </header>

      <main className="mx-auto grid max-w-7xl gap-8 px-4 py-6 md:px-8 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section>
          {error && (
            <div className="mb-5 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {error}
            </div>
          )}

          {loading ? (
            <div className="rounded-[28px] border border-white/8 bg-white/5 px-6 py-10 text-sm text-white/70">
              Loading inventory...
            </div>
          ) : (
            <>
              {(criticalItems.length > 0 || lowItems.length > 0) && (
                <section className="mb-10">
                  <h2 className="mb-4 flex w-max items-center gap-2 rounded-full border border-red-400/15 bg-red-500/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.24em] text-red-200">
                    <AlertTriangle size={16} /> Needs Attention
                  </h2>
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {[...criticalItems, ...lowItems].map((item) => (
                      <InventoryCard key={item.id} item={item} onUpdate={setSelected} />
                    ))}
                  </div>
                </section>
              )}

              <section>
                <h2 className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-[0.24em] text-[#8ea3d8]">
                  <CheckCircle2 size={16} className="text-green-400" /> Stable Stock
                </h2>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {inStockItems.map((item) => (
                    <InventoryCard key={item.id} item={item} onUpdate={setSelected} />
                  ))}
                </div>
              </section>
            </>
          )}
        </section>

        <aside className="grid gap-6">
          <section className="rounded-[28px] border border-white/8 bg-white/5 p-5 backdrop-blur-md">
            <div className="mb-4 flex items-center gap-2">
              <PackagePlus size={18} className="text-[#00d4ff]" />
              <h2 className="text-sm font-black uppercase tracking-[0.24em] text-[#cdd8ff]">Update Stock</h2>
            </div>

            {selected ? (
              <div className="grid gap-3">
                <div className="rounded-2xl border border-white/8 bg-[#111632] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#8ea3d8]">Selected Product</p>
                  <p className="mt-1 text-lg font-bold text-white">{selected.name}</p>
                  <p className="text-sm text-white/65">
                    Current: {selected.in_stock} {selected.unit}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setAdjustmentType("restock")}
                    className="flex-1 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.2em]"
                    style={{
                      background: adjustmentType === "restock" ? "rgba(0,212,255,0.16)" : "rgba(255,255,255,0.04)",
                      border: adjustmentType === "restock" ? "1px solid rgba(0,212,255,0.28)" : "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    Restock
                  </button>
                  <button
                    onClick={() => setAdjustmentType("manual_adjustment")}
                    className="flex-1 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.2em]"
                    style={{
                      background: adjustmentType === "manual_adjustment" ? "rgba(255,165,0,0.16)" : "rgba(255,255,255,0.04)",
                      border: adjustmentType === "manual_adjustment" ? "1px solid rgba(255,165,0,0.28)" : "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    Reduce
                  </button>
                </div>

                <input
                  value={quantityDelta}
                  onChange={(event) => setQuantityDelta(event.target.value)}
                  placeholder={`Quantity in ${selected.unit}`}
                  className="rounded-2xl border border-white/8 bg-[#111632] px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
                />
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Notes for transaction history"
                  rows={3}
                  className="rounded-2xl border border-white/8 bg-[#111632] px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
                />

                <button
                  onClick={() => void handleSubmitAdjustment()}
                  disabled={submitting}
                  className="rounded-2xl px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, rgba(0,212,255,0.95), rgba(109,40,217,0.95))" }}
                >
                  {submitting ? "Saving..." : "Save Inventory Update"}
                </button>
              </div>
            ) : (
              <p className="text-sm leading-6 text-white/68">
                Select any product card to post a restock or reduction. Every change writes a stock transaction and updates the current balance.
              </p>
            )}
          </section>

          <section className="rounded-[28px] border border-white/8 bg-white/5 p-5 backdrop-blur-md">
            <div className="mb-4 flex items-center gap-2">
              <History size={18} className="text-[#00d4ff]" />
              <h2 className="text-sm font-black uppercase tracking-[0.24em] text-[#cdd8ff]">Recent Transactions</h2>
            </div>
            <div className="grid gap-3">
              {transactions.map((tx) => (
                <div key={tx.id} className="rounded-2xl border border-white/8 bg-[#111632] px-4 py-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{tx.product_name}</p>
                      <p className="text-xs uppercase tracking-[0.2em] text-[#8ea3d8]">{tx.transaction_type}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${tx.quantity_delta >= 0 ? "text-green-300" : "text-red-300"}`}>
                        {tx.quantity_delta >= 0 ? "+" : ""}
                        {tx.quantity_delta} {tx.unit}
                      </p>
                      <p className="text-xs text-white/55">Balance {tx.balance_after}</p>
                    </div>
                  </div>
                  {tx.notes && <p className="mt-2 text-xs text-white/60">{tx.notes}</p>}
                </div>
              ))}
            </div>
          </section>
        </aside>
      </main>

      <MicFAB />
      <BottomNav />
    </div>
  );
}
