"use client";

import { useState } from "react";
import { generateInvoice, downloadInvoicePdf } from "@/lib/api";
import BottomNav from "@/components/BottomNav";

interface InvoiceItem {
  product: string;
  qty: string;
  unit_price: string;
  gst_rate: string;
}

const BLANK_ITEM: InvoiceItem = { product: "", qty: "", unit_price: "", gst_rate: "5" };

const GST_RATES = ["0", "5", "12", "18", "28"];

interface InvoiceResult {
  invoice_id: number;
  invoice_number: string;
  total_amount: number;
  gst_amount: number;
  grand_total: number;
}

export default function InvoicePage() {
  const [customer, setCustomer] = useState("");
  const [items, setItems] = useState<InvoiceItem[]>([{ ...BLANK_ITEM }]);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<InvoiceResult | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  const setItem = (i: number, field: keyof InvoiceItem, val: string) => {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, [field]: val } : it)));
  };

  const addItem = () => setItems((prev) => [...prev, { ...BLANK_ITEM }]);
  const removeItem = (i: number) => setItems((prev) => prev.filter((_, idx) => idx !== i));

  const subtotal = items.reduce((sum, it) => {
    const qty = parseFloat(it.qty) || 0;
    const price = parseFloat(it.unit_price) || 0;
    return sum + qty * price;
  }, 0);

  const gstTotal = items.reduce((sum, it) => {
    const qty = parseFloat(it.qty) || 0;
    const price = parseFloat(it.unit_price) || 0;
    const rate = parseFloat(it.gst_rate) || 0;
    return sum + (qty * price * rate) / 100;
  }, 0);

  const grandTotal = subtotal + gstTotal;

  const handleGenerate = async () => {
    if (!customer.trim()) { setError("Enter customer name"); return; }
    const validItems = items.filter((it) => it.product && it.qty && it.unit_price);
    if (validItems.length === 0) { setError("Add at least one item"); return; }
    setError("");
    setGenerating(true);
    try {
      const userData = localStorage.getItem("bv_user");
      const shopId = userData ? (JSON.parse(userData) as { shop_id?: number }).shop_id ?? 1 : 1;
      const res = await generateInvoice({
        shop_id: shopId,
        customer_name: customer,
        items: validItems.map((it) => ({
          product: it.product,
          qty: parseFloat(it.qty),
          unit_price: parseFloat(it.unit_price),
          gst_rate: parseFloat(it.gst_rate),
        })),
      });
      setResult(res as InvoiceResult);
    } catch (err) {
      console.error(err);
      setError("Failed to generate invoice.");
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!result) return;
    setDownloading(true);
    try {
      const blob = await downloadInvoicePdf(result.invoice_id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${result.invoice_number}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setError("PDF download failed.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <main
      className="min-h-screen bg-[#F7F5F0] pb-24"
      style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif" }}
    >
      <header className="bg-white px-5 py-5 border-b border-black/5">
        <p className="text-[10px] font-bold tracking-[0.3em] text-black/30 uppercase">Generate</p>
        <h1 className="text-xl font-black text-[#0A0A0A] mt-1 uppercase tracking-tight">
          GST Invoice
        </h1>
      </header>

      <div className="px-5 py-5 max-w-lg mx-auto space-y-5">
        {/* Invoice result */}
        {result ? (
          <div className="space-y-4">
            <div className="bg-white border-2 border-[#FF5500] p-5">
              <p className="text-[10px] font-bold tracking-[0.3em] text-[#FF5500] uppercase mb-3">Invoice Generated</p>
              <p className="text-2xl font-black text-[#0A0A0A] mb-4">{result.invoice_number}</p>
              <div className="space-y-2 border-t border-black/8 pt-3">
                {[
                  { label: "Subtotal", val: `₹${subtotal.toFixed(2)}` },
                  { label: "GST", val: `₹${result.gst_amount?.toFixed(2) ?? gstTotal.toFixed(2)}` },
                  { label: "Grand Total", val: `₹${result.grand_total?.toFixed(2) ?? grandTotal.toFixed(2)}`, bold: true },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between items-baseline">
                    <span className={`text-sm ${row.bold ? "font-black text-[#0A0A0A]" : "text-black/40"}`}>{row.label}</span>
                    <span className={`text-sm ${row.bold ? "font-black text-[#FF5500]" : "text-black/60"}`}>{row.val}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="w-full py-4 bg-[#0A0A0A] text-white font-black text-sm tracking-[0.15em] uppercase transition-all hover:bg-black/80 active:scale-[0.97] disabled:opacity-50"
            >
              {downloading ? "Downloading..." : "Download PDF →"}
            </button>

            <button
              onClick={() => { setResult(null); setCustomer(""); setItems([{ ...BLANK_ITEM }]); }}
              className="w-full py-3 border-2 border-black/10 text-black/40 font-bold text-xs tracking-widest uppercase hover:border-black/20 transition-colors"
            >
              New Invoice
            </button>
          </div>
        ) : (
          <>
            {/* Customer name */}
            <div className="bg-white border-2 border-black/8 p-4">
              <p className="text-[10px] font-bold tracking-[0.3em] text-black/30 uppercase mb-3">Customer</p>
              <input
                placeholder="Customer name"
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                className="w-full border-b-2 border-black/15 focus:border-[#FF5500] bg-transparent py-2 text-sm outline-none placeholder-black/20 transition-colors"
              />
            </div>

            {/* Items */}
            <div className="bg-white border-2 border-black/8 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold tracking-[0.3em] text-black/30 uppercase">Items</p>
                <button
                  onClick={addItem}
                  className="text-xs font-black text-[#FF5500] uppercase tracking-widest hover:underline"
                >
                  + Add
                </button>
              </div>

              {items.map((item, i) => (
                <div key={i} className="border-t border-black/5 pt-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      placeholder="Product name"
                      value={item.product}
                      onChange={(e) => setItem(i, "product", e.target.value)}
                      className="flex-1 border-b border-black/10 bg-transparent py-1.5 text-sm outline-none placeholder-black/20 focus:border-[#FF5500] transition-colors"
                    />
                    {items.length > 1 && (
                      <button onClick={() => removeItem(i)} className="text-black/20 text-lg hover:text-red-400 transition-colors">×</button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[9px] text-black/30 uppercase tracking-wider font-bold">Qty</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={item.qty}
                        onChange={(e) => setItem(i, "qty", e.target.value)}
                        className="w-full border-b border-black/10 bg-transparent py-1 text-sm outline-none focus:border-[#FF5500] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-black/30 uppercase tracking-wider font-bold">Price ₹</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={item.unit_price}
                        onChange={(e) => setItem(i, "unit_price", e.target.value)}
                        className="w-full border-b border-black/10 bg-transparent py-1 text-sm outline-none focus:border-[#FF5500] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-black/30 uppercase tracking-wider font-bold">GST %</label>
                      <select
                        value={item.gst_rate}
                        onChange={(e) => setItem(i, "gst_rate", e.target.value)}
                        className="w-full border-b border-black/10 bg-transparent py-1.5 text-sm outline-none focus:border-[#FF5500] appearance-none"
                      >
                        {GST_RATES.map((r) => <option key={r} value={r}>{r}%</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              ))}

              {/* Totals */}
              <div className="border-t-2 border-black/8 pt-4 space-y-1.5">
                <div className="flex justify-between text-xs text-black/40">
                  <span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-black/40">
                  <span>GST</span><span>₹{gstTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-[#0A0A0A]">
                  <span>Total</span><span>₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-600 font-bold border border-red-200 bg-red-50 px-4 py-2">{error}</p>
            )}

            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full py-4 bg-[#FF5500] text-white font-black text-sm tracking-[0.15em] uppercase transition-all hover:bg-[#e04a00] active:scale-[0.97] disabled:opacity-50"
            >
              {generating ? "Generating..." : "Generate Invoice →"}
            </button>
          </>
        )}
      </div>

      <BottomNav active="invoice" />
    </main>
  );
}
