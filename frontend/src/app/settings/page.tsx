"use client";

// ============================================================
// Settings Page — Task: Member E
// See: APP_FLOW.md (Flow 4 - CSV Post-Onboarding)
// ============================================================

import { useState } from "react";
import { uploadCSV, confirmCSVImport } from "@/lib/api";
import BottomNav from "@/components/BottomNav";

export default function SettingsPage() {
  const [gstin, setGstin] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [csvPreview, setCsvPreview] = useState<any>(null);
  const [csvUploading, setCsvUploading] = useState(false);
  const [importDone, setImportDone] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvUploading(true);
    try {
      const preview = await uploadCSV(file);
      setCsvPreview(preview);
    } catch (err) {
      console.error("CSV upload failed:", err);
    } finally {
      setCsvUploading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!csvPreview) return;
    try {
      await confirmCSVImport("mock-file-id", csvPreview.detected_columns);
      setImportDone(true);
      setCsvPreview(null);
    } catch (err) {
      console.error("CSV confirm failed:", err);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white px-4 py-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">Settings</h1>
      </header>

      <div className="px-4 py-4 max-w-lg mx-auto space-y-6">
        {/* Shop Profile */}
        <section className="bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="font-semibold text-gray-900 mb-3">Shop Profile</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <p><span className="font-medium text-gray-800">Name:</span> Ramesh Kirana Store</p>
            <p><span className="font-medium text-gray-800">City:</span> Nagpur</p>
            <p><span className="font-medium text-gray-800">Categories:</span> Grains, FMCG</p>
          </div>
        </section>

        {/* GSTIN */}
        <section className="bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="font-semibold text-gray-900 mb-3">GSTIN</h2>
          <input
            placeholder="Enter your GSTIN"
            value={gstin}
            onChange={(e) => setGstin(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
          />
        </section>

        {/* CSV Upload */}
        <section className="bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="font-semibold text-gray-900 mb-2">Upload Old Records (CSV/Excel)</h2>
          <p className="text-sm text-gray-500 mb-3">
            Import your historical sales data to get more accurate AI predictions.
          </p>

          {importDone ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
              ✅ Records imported successfully! ML model is retraining with your data.
            </div>
          ) : csvPreview ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">{csvPreview.row_count} rows detected</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50">
                      {Object.values(csvPreview.detected_columns as Record<string, string>).map((col: string) => (
                        <th key={col} className="px-2 py-1 text-left font-medium text-gray-600">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {csvPreview.preview_rows.slice(0, 3).map((row: any, i: number) => (
                      <tr key={i} className="border-t border-gray-100">
                        <td className="px-2 py-1">{row.date}</td>
                        <td className="px-2 py-1">{row.product}</td>
                        <td className="px-2 py-1">{row.qty}</td>
                        <td className="px-2 py-1">{row.price}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button onClick={handleConfirmImport} className="w-full py-2 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors">
                Confirm Import
              </button>
            </div>
          ) : (
            <label className="block w-full py-8 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:border-orange-400 transition-colors">
              <span className="text-gray-500">{csvUploading ? "Uploading..." : "Click to select CSV/Excel file"}</span>
              <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileUpload} className="hidden" />
            </label>
          )}
        </section>

        {/* Language */}
        <section className="bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="font-semibold text-gray-900 mb-3">Language</h2>
          <select className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base bg-white">
            <option value="en">English</option>
            <option value="hi">Hindi</option>
            <option value="te">Telugu</option>
          </select>
        </section>
      </div>

      <BottomNav active="settings" />
    </main>
  );
}
