"use client";

// ============================================================
// Invoice Page — Task: Member D
// See: APP_FLOW.md (Flow 7), BizVaani_Developer_Reference.md (Section 5)
// ============================================================

import { useState } from "react";
import { generateInvoice } from "@/lib/api";
import InvoicePreview from "@/components/InvoicePreview";
import BottomNav from "@/components/BottomNav";
import MicFAB from "@/components/MicFAB";

interface LineItem {
  product: string;
  qty: number;
  unit_price: number;
  gst_rate: number;
}

export default function InvoicePage() {
  const [customerName, setCustomerName] = useState("");
  const [items, setItems] = useState<LineItem[]>([
    { product: "", qty: 0, unit_price: 0, gst_rate: 5 },
  ]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const addItem = () => {
    setItems([...items, { product: "", qty: 0, unit_price: 0, gst_rate: 5 }]);
  };

  const updateItem = (index: number, field: keyof LineItem, value: string | number) => {
    const updated = [...items];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (updated[index] as any)[field] = value;
    setItems(updated);
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await generateInvoice({
        shop_id: 1,
        customer_name: customerName,
        items,
      });
      setResult(res);
    } catch (err) {
      console.error("Invoice generation failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white px-4 py-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">GST Invoice</h1>
      </header>

      <div className="px-4 py-4 max-w-lg mx-auto space-y-4">
        {!result ? (
          <>
            {/* Customer Name */}
            <input
              placeholder="Customer Name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
            />

            {/* Line Items */}
            {items.map((item, i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 p-3 space-y-2">
                <input placeholder="Product" value={item.product} onChange={(e) => updateItem(i, "product", e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded text-sm" />
                <div className="grid grid-cols-3 gap-2">
                  <input placeholder="Qty" type="number" value={item.qty || ""} onChange={(e) => updateItem(i, "qty", Number(e.target.value))} className="px-3 py-2 border border-gray-200 rounded text-sm" />
                  <input placeholder="Price" type="number" value={item.unit_price || ""} onChange={(e) => updateItem(i, "unit_price", Number(e.target.value))} className="px-3 py-2 border border-gray-200 rounded text-sm" />
                  <select value={item.gst_rate} onChange={(e) => updateItem(i, "gst_rate", Number(e.target.value))} className="px-3 py-2 border border-gray-200 rounded text-sm">
                    <option value={5}>5% GST</option>
                    <option value={12}>12% GST</option>
                    <option value={18}>18% GST</option>
                  </select>
                </div>
              </div>
            ))}

            <button onClick={addItem} className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-orange-400 hover:text-orange-500 transition-colors">
              + Add Item
            </button>

            <button onClick={handleGenerate} disabled={loading} className="w-full py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50">
              {loading ? "Generating..." : "Generate Invoice"}
            </button>
          </>
        ) : (
          <InvoicePreview
            invoice={result}
            customerName={customerName}
            items={items}
          />
        )}
      </div>

      <MicFAB />
      <BottomNav active="invoice" />
    </main>
  );
}
