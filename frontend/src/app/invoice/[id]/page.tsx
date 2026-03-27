"use client";

// ============================================================
// Public Invoice View — Task: Member D
// No auth required. Shareable link.
// ============================================================

import { MOCK_INVOICE_VIEW } from "@/lib/mockData";

export default function InvoiceViewPage() {
  // In real app, fetch from /api/invoice/{id}
  const inv = MOCK_INVOICE_VIEW;

  return (
    <main className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-6">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-gray-900">{inv.shop_name}</h1>
          <p className="text-sm text-gray-500">GST Invoice</p>
        </div>

        <div className="flex justify-between text-sm text-gray-600 mb-4">
          <span>Invoice: {inv.id}</span>
          <span>Date: {inv.date}</span>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-500">Bill To:</p>
          <p className="font-medium text-gray-900">{inv.customer_name}</p>
        </div>

        {/* Items Table */}
        <table className="w-full text-sm mb-4">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 text-gray-500 font-medium">Item</th>
              <th className="text-right py-2 text-gray-500 font-medium">Qty</th>
              <th className="text-right py-2 text-gray-500 font-medium">Rate</th>
              <th className="text-right py-2 text-gray-500 font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {inv.items.map((item, i) => (
              <tr key={i} className="border-b border-gray-100">
                <td className="py-2 text-gray-900">{item.product}</td>
                <td className="text-right py-2 text-gray-600">{item.qty} {item.unit}</td>
                <td className="text-right py-2 text-gray-600">₹{item.unit_price}</td>
                <td className="text-right py-2 text-gray-900">₹{item.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="border-t border-gray-200 pt-3 space-y-1">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal</span>
            <span>₹{inv.subtotal}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>CGST</span>
            <span>₹{inv.cgst}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>SGST</span>
            <span>₹{inv.sgst}</span>
          </div>
          <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200">
            <span>Total</span>
            <span>₹{inv.total}</span>
          </div>
        </div>

        <button className="mt-6 w-full py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors">
          Download PDF
        </button>
      </div>
    </main>
  );
}
