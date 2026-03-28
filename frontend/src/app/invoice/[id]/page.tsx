"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Download } from "lucide-react";
import { getInvoiceDetail, type InvoiceDetail } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function InvoiceViewPage() {
  const params = useParams<{ id: string }>();
  const invoiceId = useMemo(() => Number(params?.id), [params]);
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!invoiceId) return;
    void getInvoiceDetail(invoiceId)
      .then((data) => {
        setInvoice(data);
        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load invoice"));
  }, [invoiceId]);

  return (
    <main className="min-h-screen bg-[#090616] px-4 py-8 text-white">
      <div className="mx-auto max-w-md rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(39,25,79,0.92),rgba(18,16,44,0.96))] p-6 shadow-[0_24px_60px_rgba(6,4,22,0.65)]">
        {error && <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>}
        {!error && !invoice && <p className="text-sm text-[#c8b9ff]">Loading invoice...</p>}

        {invoice && (
          <>
            <div className="mb-6 text-center">
              <h1 className="text-xl font-black tracking-wide text-white">{invoice.shop_name}</h1>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#a78bfa]">GST Invoice</p>
            </div>

            <div className="mb-4 flex justify-between text-sm text-[#c8b9ff]">
              <span>Invoice: {invoice.invoice_number}</span>
              <span>Date: {invoice.date}</span>
            </div>

            <div className="mb-4 rounded-2xl border border-white/8 bg-white/5 p-4">
              <p className="text-sm uppercase tracking-[0.18em] text-[#a78bfa]">Bill To</p>
              <p className="font-semibold text-white">{invoice.customer_name}</p>
              {invoice.customer_gstin && <p className="text-sm text-[#c8b9ff]">GSTIN: {invoice.customer_gstin}</p>}
            </div>

            <table className="mb-4 w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="py-2 text-left font-medium uppercase tracking-[0.16em] text-[#a78bfa]">Item</th>
                  <th className="py-2 text-right font-medium uppercase tracking-[0.16em] text-[#a78bfa]">Qty</th>
                  <th className="py-2 text-right font-medium uppercase tracking-[0.16em] text-[#a78bfa]">Rate</th>
                  <th className="py-2 text-right font-medium uppercase tracking-[0.16em] text-[#a78bfa]">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => (
                  <tr key={`${item.product}-${index}`} className="border-b border-white/6">
                    <td className="py-3 text-white">{item.product}</td>
                    <td className="py-3 text-right text-[#c8b9ff]">{item.qty}</td>
                    <td className="py-3 text-right text-[#c8b9ff]">Rs.{item.unit_price}</td>
                    <td className="py-3 text-right font-semibold text-white">
                      Rs.{item.amount ?? Number(item.qty) * Number(item.unit_price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="space-y-1 border-t border-white/10 pt-3">
              <div className="flex justify-between text-sm text-[#c8b9ff]">
                <span>Subtotal</span>
                <span>Rs.{invoice.subtotal}</span>
              </div>
              <div className="flex justify-between text-sm text-[#c8b9ff]">
                <span>CGST</span>
                <span>Rs.{invoice.cgst}</span>
              </div>
              <div className="flex justify-between text-sm text-[#c8b9ff]">
                <span>SGST</span>
                <span>Rs.{invoice.sgst}</span>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-2 text-lg font-black text-white">
                <span>Total</span>
                <span>Rs.{invoice.total}</span>
              </div>
            </div>

            <a
              href={`${API_URL}${invoice.pdf_url}`}
              target="_blank"
              rel="noreferrer"
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#f97316] py-3 font-semibold text-white transition-colors hover:bg-[#ea580c]"
            >
              <Download size={16} /> Download PDF
            </a>
          </>
        )}
      </div>
    </main>
  );
}
