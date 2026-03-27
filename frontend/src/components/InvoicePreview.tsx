// ============================================================
// InvoicePreview — Task: Member D
// See: APP_FLOW.md (Flow 7), BizVaani_Developer_Reference.md (Section 5)
// ============================================================

interface LineItem {
  product: string;
  qty: number;
  unit_price: number;
  gst_rate: number;
}

interface InvoiceResult {
  invoice_id: string;
  pdf_url: string;
  total: number;
  gst_breakup: { cgst: number; sgst: number };
}

export default function InvoicePreview({
  invoice,
  customerName,
  items,
}: {
  invoice: InvoiceResult;
  customerName: string;
  items: LineItem[];
}) {
  const subtotal = items.reduce((sum, item) => sum + item.qty * item.unit_price, 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="text-center mb-4">
        <p className="text-xs text-gray-400">Invoice #{invoice.invoice_id}</p>
        <h2 className="text-lg font-bold text-gray-900">Ramesh Kirana Store</h2>
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-500">Bill To:</p>
        <p className="font-medium text-gray-900">{customerName}</p>
      </div>

      {/* Items */}
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
          {items
            .filter((item) => item.product)
            .map((item, i) => (
              <tr key={i} className="border-b border-gray-100">
                <td className="py-2 text-gray-900">{item.product}</td>
                <td className="text-right py-2 text-gray-600">{item.qty}</td>
                <td className="text-right py-2 text-gray-600">₹{item.unit_price}</td>
                <td className="text-right py-2 text-gray-900">₹{(item.qty * item.unit_price).toLocaleString()}</td>
              </tr>
            ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="border-t border-gray-200 pt-3 space-y-1">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Subtotal</span>
          <span>₹{subtotal.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>CGST</span>
          <span>₹{invoice.gst_breakup.cgst}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>SGST</span>
          <span>₹{invoice.gst_breakup.sgst}</span>
        </div>
        <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200">
          <span>Total</span>
          <span>₹{invoice.total.toLocaleString()}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 space-y-2">
        <a
          href={invoice.pdf_url}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full py-3 bg-orange-500 text-white font-semibold rounded-lg text-center hover:bg-orange-600 transition-colors"
        >
          Download PDF
        </a>
      </div>
    </div>
  );
}
