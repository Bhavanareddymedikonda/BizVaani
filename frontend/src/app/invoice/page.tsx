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
import { Plus, Receipt } from "lucide-react";

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
    <div className="min-h-screen selection:bg-[#f97316] selection:text-white font-sans md:pl-64 pb-24 md:pb-0">
      <header className="px-4 md:px-8 py-6 sticky top-0 z-30 bg-[#fff8eb]/80 backdrop-blur-md border-b-2 border-dashed border-[#e5dacc] flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black tracking-wide text-[#4a2d12] uppercase flex items-center gap-2">
            <Receipt className="text-[#f97316]" size={28} /> GST <span className="text-[#f97316]">Invoice</span>
          </h1>
        </div>
      </header>

      <main className="px-4 md:px-8 max-w-4xl mx-auto py-6">
        {!result ? (
          <div className="space-y-6">
            {/* Customer Name */}
            <div className="clay-card p-6">
              <label className="text-xs font-bold text-[#8c6b4d] uppercase tracking-wider mb-2 block">Customer Name</label>
              <input
                placeholder="Enter customer name..."
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-4 py-3 bg-white/70 border-none shadow-[inset_2px_2px_5px_rgba(0,0,0,0.05),inset_-2px_-2px_5px_rgba(255,255,255,0.8)] rounded-2xl text-base font-bold text-[#4a2d12] focus:outline-none focus:ring-2 focus:ring-[#f97316]/40 transition-all font-sans"
              />
            </div>

            {/* Line Items */}
            <div className="space-y-4">
              <div className="flex justify-between items-end border-b-2 border-[#e5dacc] pb-2">
                <h2 className="text-sm font-black uppercase tracking-widest text-[#8c6b4d]">Line Items</h2>
              </div>
              
              {items.map((item, i) => (
                <div key={i} className="clay-card p-5 relative">
                  <div className="mb-4">
                    <label className="text-[10px] font-bold text-[#8c6b4d] uppercase tracking-wider mb-1 block">Product Name</label>
                    <input placeholder="e.g. 10kg Aashirvaad Atta" value={item.product} onChange={(e) => updateItem(i, "product", e.target.value)} className="w-full px-4 py-3 bg-white/70 border-none shadow-[inset_2px_2px_5px_rgba(0,0,0,0.05),inset_-2px_-2px_5px_rgba(255,255,255,0.8)] rounded-xl text-sm font-bold text-[#4a2d12] focus:outline-none focus:ring-2 focus:ring-[#f97316]/40" />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-[#8c6b4d] uppercase tracking-wider mb-1 block">Qty</label>
                      <input placeholder="0" type="number" value={item.qty || ""} onChange={(e) => updateItem(i, "qty", Number(e.target.value))} className="w-full px-3 py-2.5 bg-white/70 border-none shadow-[inset_2px_2px_5px_rgba(0,0,0,0.05),inset_-2px_-2px_5px_rgba(255,255,255,0.8)] rounded-xl text-sm font-bold text-[#4a2d12] focus:outline-none focus:ring-2 focus:ring-[#f97316]/40" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#8c6b4d] uppercase tracking-wider mb-1 block">Price (₹)</label>
                      <input placeholder="0" type="number" value={item.unit_price || ""} onChange={(e) => updateItem(i, "unit_price", Number(e.target.value))} className="w-full px-3 py-2.5 bg-white/70 border-none shadow-[inset_2px_2px_5px_rgba(0,0,0,0.05),inset_-2px_-2px_5px_rgba(255,255,255,0.8)] rounded-xl text-sm font-bold text-[#4a2d12] focus:outline-none focus:ring-2 focus:ring-[#f97316]/40" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#8c6b4d] uppercase tracking-wider mb-1 block">GST</label>
                      <select value={item.gst_rate} onChange={(e) => updateItem(i, "gst_rate", Number(e.target.value))} className="w-full px-3 py-2.5 bg-white/70 border-none shadow-[inset_2px_2px_5px_rgba(0,0,0,0.05),inset_-2px_-2px_5px_rgba(255,255,255,0.8)] rounded-xl text-sm font-bold text-[#4a2d12] focus:outline-none appearance-none focus:ring-2 focus:ring-[#f97316]/40">
                        <option value={5}>5%</option>
                        <option value={12}>12%</option>
                        <option value={18}>18%</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={addItem} className="w-full py-4 border-2 border-dashed border-[#e5dacc] rounded-2xl text-[#8c6b4d] font-bold uppercase tracking-wider hover:border-[#f97316] hover:text-[#f97316] transition-colors flex items-center justify-center gap-2 hover:bg-white/40">
              <Plus size={18} /> Add Another Item
            </button>

            <div className="pt-4">
              <button onClick={handleGenerate} disabled={loading} className="clay-btn w-full py-4 text-base tracking-widest disabled:opacity-50 disabled:active:shadow-[6px_6px_12px_#e5dacc,-6px_-6px_12px_#ffffff,inset_2px_2px_8px_rgba(255,255,255,0.4),inset_-2px_-2px_8px_rgba(0,0,0,0.2)] disabled:active:translate-y-0">
                {loading ? "Generating PDF..." : "Generate GST Invoice"}
              </button>
            </div>
          </div>
        ) : (
          <div className="clay-card p-6 border border-white">
            {/* The preview is wrapped here, likely needing its own claymorphism update, but this container makes it look better */}
            <InvoicePreview
              invoice={result}
              customerName={customerName}
              items={items}
            />
            <button 
              onClick={() => {setResult(null); setItems([{ product: "", qty: 0, unit_price: 0, gst_rate: 5 }]); setCustomerName("")}}
              className="mt-6 w-full py-3 border-2 border-[#e5dacc] rounded-xl text-[#8c6b4d] font-bold uppercase tracking-widest hover:border-black hover:text-black transition-colors"
            >
              Start New Invoice
            </button>
          </div>
        )}
      </main>

      <MicFAB />
      <BottomNav />
    </div>
  );
}
