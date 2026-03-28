"use client";

// ============================================================
// Invoice Page — Task: Member D
// See: APP_FLOW.md (Flow 7), BizVaani_Developer_Reference.md (Section 5)
// ============================================================

import { useState, useEffect } from "react";
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
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const initialTheme = savedTheme || 'dark';
    setTheme(initialTheme);
    document.documentElement.setAttribute('data-theme', initialTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

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
    <div className="min-h-screen selection:bg-[#c084fc] selection:text-white font-sans pb-24 md:pb-0 pt-20 md:pt-6">
      <header className="px-4 md:px-12 py-6 mb-4 flex flex-col md:flex-row md:items-center justify-between md:ml-20">
        <div>
          <h1 className="text-3xl font-black tracking-wide text-white uppercase flex items-center gap-2">
            <Receipt className="text-[#c084fc]" size={28} /> GST <span className="text-[#c084fc]">Invoice</span>
          </h1>
        </div>
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          className="w-12 h-7 rounded-full bg-white/5 border border-white/10 relative flex items-center p-1 cursor-pointer transition-colors hover:bg-[#c084fc]/20 mt-4 md:mt-0"
        >
          <span
            className="w-5 h-5 rounded-full bg-gradient-to-br from-[#9333ea] to-[#c084fc] shadow-[0_0_8px_rgba(192,132,252,0.6)] block transition-transform"
            style={{ transform: theme === 'dark' ? 'translateX(0)' : 'translateX(20px)' }}
          />
        </button>
      </header>

      <main className="px-4 md:px-12 max-w-4xl mx-auto md:ml-20 py-2">
        {!result ? (
          <div className="space-y-6">
            {/* Customer Name */}
            <div className="advanced-card p-6">
              <label className="text-xs font-bold text-[#c084fc]/70 uppercase tracking-wider mb-2 block">Customer Name</label>
              <input
                placeholder="Enter customer name..."
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-base font-bold text-white focus:outline-none focus:ring-2 focus:ring-[#c084fc]/40 transition-all"
              />
            </div>

            {/* Line Items */}
            <div className="space-y-4">
              <div className="flex justify-between items-end border-b border-white/10 pb-2">
                <h2 className="text-sm font-black uppercase tracking-widest text-[#c084fc]/70">Line Items</h2>
              </div>
              
              {items.map((item, i) => (
                <div key={i} className="advanced-card p-5 relative">
                  <div className="mb-4">
                    <label className="text-[10px] font-bold text-[#c084fc]/70 uppercase tracking-wider mb-1 block">Product Name</label>
                    <input placeholder="e.g. 10kg Aashirvaad Atta" value={item.product} onChange={(e) => updateItem(i, "product", e.target.value)} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-[#c084fc]/40" />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-[#c084fc]/70 uppercase tracking-wider mb-1 block">Qty</label>
                      <input placeholder="0" type="number" value={item.qty || ""} onChange={(e) => updateItem(i, "qty", Number(e.target.value))} className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-[#c084fc]/40" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#c084fc]/70 uppercase tracking-wider mb-1 block">Price (₹)</label>
                      <input placeholder="0" type="number" value={item.unit_price || ""} onChange={(e) => updateItem(i, "unit_price", Number(e.target.value))} className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-[#c084fc]/40" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#c084fc]/70 uppercase tracking-wider mb-1 block">GST</label>
                      <select value={item.gst_rate} onChange={(e) => updateItem(i, "gst_rate", Number(e.target.value))} className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-white focus:outline-none appearance-none focus:ring-2 focus:ring-[#c084fc]/40">
                        <option value={5} className="bg-[#0D0914]">5%</option>
                        <option value={12} className="bg-[#0D0914]">12%</option>
                        <option value={18} className="bg-[#0D0914]">18%</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={addItem} className="w-full py-4 border-2 border-dashed border-white/10 rounded-2xl text-[#c084fc]/60 font-bold uppercase tracking-wider hover:border-[#c084fc]/50 hover:text-[#c084fc] transition-colors flex items-center justify-center gap-2 hover:bg-white/5">
              <Plus size={18} /> Add Another Item
            </button>

            <div className="pt-4">
              <button onClick={handleGenerate} disabled={loading} className="advanced-btn w-full py-4 text-base tracking-widest disabled:opacity-50 disabled:scale-100">
                {loading ? "Generating PDF..." : "Generate GST Invoice"}
              </button>
            </div>
          </div>
        ) : (
          <div className="advanced-card p-6">
            <InvoicePreview
              invoice={result}
              customerName={customerName}
              items={items}
            />
            <button 
              onClick={() => {setResult(null); setItems([{ product: "", qty: 0, unit_price: 0, gst_rate: 5 }]); setCustomerName("")}}
              className="mt-6 w-full py-3 border border-white/10 rounded-xl text-white/60 font-bold uppercase tracking-widest hover:border-white/40 hover:text-white transition-colors"
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
