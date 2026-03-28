"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarRange, Filter, History } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import MicFAB from "@/components/MicFAB";
import { getInventory, getInventoryTransactions, type InventoryItem, type StockTransaction } from "@/lib/api";

const TRANSACTION_TYPES = [
  { label: "All types", value: "" },
  { label: "Sales", value: "sale" },
  { label: "Invoice Sales", value: "invoice_sale" },
  { label: "Restocks", value: "restock" },
  { label: "Manual Adjustments", value: "manual_adjustment" },
];

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [products, setProducts] = useState<InventoryItem[]>([]);
  const [productId, setProductId] = useState("");
  const [transactionType, setTransactionType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPageData = useCallback(async () => {
    setLoading(true);
    try {
      const [inventory, txs] = await Promise.all([
        getInventory(),
        getInventoryTransactions({
          product_id: productId ? Number(productId) : undefined,
          transaction_type: transactionType || undefined,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
          limit: 200,
        }),
      ]);
      setProducts(inventory);
      setTransactions(txs);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load transaction history");
    } finally {
      setLoading(false);
    }
  }, [productId, transactionType, startDate, endDate]);

  useEffect(() => {
    void loadPageData();
  }, [loadPageData]);

  const summary = useMemo(() => {
    const totalMovement = transactions.reduce((sum, item) => sum + Math.abs(item.quantity_delta), 0);
    const restocks = transactions.filter((item) => item.transaction_type === "restock").length;
    const sales = transactions.filter((item) => item.transaction_type === "sale" || item.transaction_type === "invoice_sale").length;
    return { totalMovement, restocks, sales };
  }, [transactions]);

  return (
    <div className="min-h-screen bg-[#0d1024] pb-24 font-sans text-white selection:bg-[#00d4ff] selection:text-black md:pb-0">
      <header className="sticky top-0 z-30 border-b border-white/8 bg-[#0d1024]/80 px-4 py-6 backdrop-blur-md md:px-8">
        <h1 className="text-2xl font-black uppercase tracking-wide text-white">
          Transaction <span className="text-[#00d4ff]">History</span>
        </h1>
        <p className="mt-1 text-xs font-bold uppercase tracking-[0.22em] text-[#8ea3d8]">
          Full stock movement ledger with filters by product, type, and date
        </p>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 md:px-8">
        {error && (
          <div className="mb-5 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        )}

        <section className="mb-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="rounded-[28px] border border-white/8 bg-white/5 p-5 backdrop-blur-md">
            <div className="mb-4 flex items-center gap-2">
              <Filter size={18} className="text-[#00d4ff]" />
              <h2 className="text-sm font-black uppercase tracking-[0.24em] text-[#cdd8ff]">Filters</h2>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <select
                value={productId}
                onChange={(event) => setProductId(event.target.value)}
                className="rounded-2xl border border-white/8 bg-[#111632] px-4 py-3 text-sm text-white outline-none"
              >
                <option value="">All products</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>

              <select
                value={transactionType}
                onChange={(event) => setTransactionType(event.target.value)}
                className="rounded-2xl border border-white/8 bg-[#111632] px-4 py-3 text-sm text-white outline-none"
              >
                {TRANSACTION_TYPES.map((item) => (
                  <option key={item.value || "all"} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>

              <input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="rounded-2xl border border-white/8 bg-[#111632] px-4 py-3 text-sm text-white outline-none"
              />

              <input
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                className="rounded-2xl border border-white/8 bg-[#111632] px-4 py-3 text-sm text-white outline-none"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-[24px] border border-white/8 bg-white/5 p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#8ea3d8]">Entries</p>
              <p className="mt-2 text-3xl font-black text-white">{transactions.length}</p>
            </div>
            <div className="rounded-[24px] border border-white/8 bg-white/5 p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#8ea3d8]">Sales Moves</p>
              <p className="mt-2 text-3xl font-black text-[#4ade80]">{summary.sales}</p>
            </div>
            <div className="rounded-[24px] border border-white/8 bg-white/5 p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#8ea3d8]">Units Moved</p>
              <p className="mt-2 text-3xl font-black text-[#00d4ff]">{summary.totalMovement.toLocaleString("en-IN")}</p>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-white/8 bg-white/5 p-5 backdrop-blur-md">
          <div className="mb-4 flex items-center gap-2">
            <History size={18} className="text-[#00d4ff]" />
            <h2 className="text-sm font-black uppercase tracking-[0.24em] text-[#cdd8ff]">All Transactions</h2>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-white/8 bg-[#111632] px-4 py-10 text-sm text-white/70">
              Loading transactions...
            </div>
          ) : transactions.length === 0 ? (
            <div className="rounded-2xl border border-white/8 bg-[#111632] px-4 py-10 text-sm text-white/70">
              No transactions found for the selected filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-y-3">
                <thead>
                  <tr className="text-left text-[11px] font-bold uppercase tracking-[0.2em] text-[#8ea3d8]">
                    <th className="px-4 py-2">Date</th>
                    <th className="px-4 py-2">Product</th>
                    <th className="px-4 py-2">Type</th>
                    <th className="px-4 py-2">Delta</th>
                    <th className="px-4 py-2">Balance</th>
                    <th className="px-4 py-2">Reference</th>
                    <th className="px-4 py-2">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="rounded-2xl bg-[#111632] text-sm text-white">
                      <td className="rounded-l-2xl px-4 py-4 text-white/75">
                        <div className="flex items-center gap-2">
                          <CalendarRange size={14} className="text-[#8ea3d8]" />
                          {tx.created_at ? new Date(tx.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "-"}
                        </div>
                      </td>
                      <td className="px-4 py-4 font-semibold">{tx.product_name}</td>
                      <td className="px-4 py-4">
                        <span className="rounded-full border border-white/8 bg-white/5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#cdd8ff]">
                          {tx.transaction_type.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className={`px-4 py-4 font-bold ${tx.quantity_delta >= 0 ? "text-green-300" : "text-red-300"}`}>
                        {tx.quantity_delta >= 0 ? "+" : ""}
                        {tx.quantity_delta} {tx.unit}
                      </td>
                      <td className="px-4 py-4 text-white/80">{tx.balance_after} {tx.unit}</td>
                      <td className="px-4 py-4 text-white/70">
                        {tx.reference_type ? `${tx.reference_type}${tx.reference_id ? ` #${tx.reference_id}` : ""}` : "-"}
                      </td>
                      <td className="rounded-r-2xl px-4 py-4 text-white/65">{tx.notes || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      <MicFAB />
      <BottomNav />
    </div>
  );
}
