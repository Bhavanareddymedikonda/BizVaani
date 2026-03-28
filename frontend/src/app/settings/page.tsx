"use client";

// ============================================================
// Settings Page — Task: Member E
// See: APP_FLOW.md (Flow 4 - CSV Post-Onboarding)
// ============================================================

import { useState } from "react";
import { uploadCSV, confirmCSVImport } from "@/lib/api";
import BottomNav from "@/components/BottomNav";
import { Settings, UploadCloud, CheckCircle2 } from "lucide-react";

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
    <div className="min-h-screen selection:bg-[#f97316] selection:text-white font-sans md:pl-64 pb-24 md:pb-0">
      <header className="px-4 md:px-8 py-6 sticky top-0 z-30 bg-[#fff8eb]/80 backdrop-blur-md border-b-2 border-dashed border-[#e5dacc] flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black tracking-wide text-[#4a2d12] uppercase flex items-center gap-2">
            <Settings className="text-[#f97316]" size={28} /> Shop <span className="text-[#f97316]">Settings</span>
          </h1>
        </div>
      </header>

      <main className="px-4 md:px-8 max-w-4xl mx-auto py-6 space-y-6">
        {/* Shop Profile */}
        <section className="clay-card p-6">
          <h2 className="text-sm font-black uppercase tracking-widest text-[#8c6b4d] mb-4">Shop Profile</h2>
          <div className="space-y-4 text-sm text-[#6b4a31] font-medium">
            <div className="flex justify-between items-center bg-white/50 p-3 rounded-lg shadow-[inset_1px_1px_2px_rgba(255,255,255,1)]">
              <span className="font-bold uppercase tracking-wider text-[10px]">Name</span>
              <span>Ramesh Kirana Store</span>
            </div>
            <div className="flex justify-between items-center bg-white/50 p-3 rounded-lg shadow-[inset_1px_1px_2px_rgba(255,255,255,1)]">
              <span className="font-bold uppercase tracking-wider text-[10px]">City</span>
              <span>Nagpur</span>
            </div>
            <div className="flex justify-between items-center bg-white/50 p-3 rounded-lg shadow-[inset_1px_1px_2px_rgba(255,255,255,1)]">
              <span className="font-bold uppercase tracking-wider text-[10px]">Categories</span>
              <span>Grains, FMCG</span>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* GSTIN */}
          <section className="clay-card p-6">
            <h2 className="text-sm font-black uppercase tracking-widest text-[#8c6b4d] mb-4">GSTIN Configuration</h2>
            <input
              placeholder="Enter your GSTIN"
              value={gstin}
              onChange={(e) => setGstin(e.target.value)}
              className="w-full px-4 py-3 bg-white/70 border-none shadow-[inset_2px_2px_5px_rgba(0,0,0,0.05),inset_-2px_-2px_5px_rgba(255,255,255,0.8)] rounded-xl text-base font-bold text-[#4a2d12] focus:outline-none focus:ring-2 focus:ring-[#f97316]/40 uppercase"
            />
          </section>

          {/* Language */}
          <section className="clay-card p-6">
            <h2 className="text-sm font-black uppercase tracking-widest text-[#8c6b4d] mb-4">Language</h2>
            <select className="w-full px-4 py-3 bg-white/70 border-none shadow-[inset_2px_2px_5px_rgba(0,0,0,0.05),inset_-2px_-2px_5px_rgba(255,255,255,0.8)] rounded-xl text-base font-bold text-[#4a2d12] focus:outline-none focus:ring-2 focus:ring-[#f97316]/40 appearance-none">
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="te">Telugu</option>
            </select>
          </section>
        </div>

        {/* CSV Upload */}
        <section className="clay-card p-6">
          <h2 className="text-sm font-black uppercase tracking-widest text-[#8c6b4d] mb-2 flex items-center gap-2">
            <UploadCloud size={20} /> Upload Old Records (CSV/Excel)
          </h2>
          <p className="text-xs font-bold text-[#6b4a31] mb-5 tracking-wide">
            Import your historical sales data to get more accurate AI predictions.
          </p>

          {importDone ? (
            <div className="bg-green-100/60 border border-green-200 rounded-xl p-4 text-sm font-bold text-green-700 shadow-[inset_1px_1px_3px_rgba(255,255,255,0.8)] flex items-center gap-2">
              <CheckCircle2 /> Records imported successfully! ML model is retraining.
            </div>
          ) : csvPreview ? (
            <div className="space-y-4">
              <p className="text-xs font-bold uppercase tracking-widest text-[#f97316] bg-white w-max px-3 py-1 rounded-md shadow-sm">{csvPreview.row_count} rows detected</p>
              <div className="overflow-x-auto rounded-xl shadow-[inset_1px_1px_3px_rgba(0,0,0,0.05),inset_-1px_-1px_3px_rgba(255,255,255,0.8)] bg-white/50 p-2">
                <table className="w-full text-xs text-left text-[#4a2d12]">
                  <thead className="text-[10px] uppercase font-black text-[#8c6b4d]">
                    <tr>
                      {Object.values(csvPreview.detected_columns as Record<string, string>).map((col: string) => (
                        <th key={col} className="px-3 py-2 border-b-2 border-dashed border-[#e5dacc]">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {csvPreview.preview_rows.slice(0, 3).map((row: any, i: number) => (
                      <tr key={i} className="border-b border-[#e5dacc]/50 last:border-0 font-medium">
                        <td className="px-3 py-2">{row.date}</td>
                        <td className="px-3 py-2">{row.product}</td>
                        <td className="px-3 py-2">{row.qty}</td>
                        <td className="px-3 py-2">{row.price}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button onClick={handleConfirmImport} className="clay-btn w-full py-3.5 mt-2">
                Confirm Data Import
              </button>
            </div>
          ) : (
            <label className="block w-full py-10 border-2 border-dashed border-[#8c6b4d]/40 rounded-2xl text-center cursor-pointer hover:border-[#f97316] hover:bg-white/40 transition-all group">
              <span className="text-[#8c6b4d] font-bold uppercase tracking-widest group-hover:text-[#f97316] block">{csvUploading ? "Uploading..." : "Click to select CSV/Excel file"}</span>
              <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileUpload} className="hidden" />
            </label>
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
