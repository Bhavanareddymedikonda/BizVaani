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
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "dark";
    return (localStorage.getItem("theme") as "light" | "dark" | null) || "dark";
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!invoiceId) return;
    void getInvoiceDetail(invoiceId)
      .then((data) => {
        setInvoice(data);
        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load invoice"));
  }, [invoiceId]);

  function toggleTheme() {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
  }

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-8">
      <div className="mb-4 flex justify-end px-4">
        <button onClick={toggleTheme} className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm">
          {theme === "light" ? "Dark" : "Light"}
        </button>
      </div>

      <div className="mx-auto max-w-md rounded-xl bg-white p-6 shadow-lg">
        {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        {!error && !invoice && <p className="text-sm text-gray-500">Loading invoice...</p>}

        {invoice && (
          <>
            <div className="mb-6 text-center">
              <h1 className="text-xl font-bold text-gray-900">{invoice.shop_name}</h1>
              <p className="text-sm text-gray-500">GST Invoice</p>
            </div>

            <div className="mb-4 flex justify-between text-sm text-gray-600">
              <span>Invoice: {invoice.invoice_number}</span>
              <span>Date: {invoice.date}</span>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-500">Bill To:</p>
              <p className="font-medium text-gray-900">{invoice.customer_name}</p>
              {invoice.customer_gstin && <p className="text-sm text-gray-500">GSTIN: {invoice.customer_gstin}</p>}
            </div>

            <table className="mb-4 w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-2 text-left font-medium text-gray-500">Item</th>
                  <th className="py-2 text-right font-medium text-gray-500">Qty</th>
                  <th className="py-2 text-right font-medium text-gray-500">Rate</th>
                  <th className="py-2 text-right font-medium text-gray-500">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => (
                  <tr key={`${item.product}-${index}`} className="border-b border-gray-100">
                    <td className="py-2 text-gray-900">{item.product}</td>
                    <td className="py-2 text-right text-gray-600">{item.qty}</td>
                    <td className="py-2 text-right text-gray-600">Rs.{item.unit_price}</td>
                    <td className="py-2 text-right text-gray-900">
                      Rs.{item.amount ?? Number(item.qty) * Number(item.unit_price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="space-y-1 border-t border-gray-200 pt-3">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>Rs.{invoice.subtotal}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>CGST</span>
                <span>Rs.{invoice.cgst}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>SGST</span>
                <span>Rs.{invoice.sgst}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2 text-lg font-bold text-gray-900">
                <span>Total</span>
                <span>Rs.{invoice.total}</span>
              </div>
            </div>

            <a
              href={`${API_URL}${invoice.pdf_url}`}
              target="_blank"
              rel="noreferrer"
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-orange-500 py-3 font-semibold text-white transition-colors hover:bg-orange-600"
            >
              <Download size={16} /> Download PDF
            </a>
          </>
        )}
      </div>
    </main>
  );
}
