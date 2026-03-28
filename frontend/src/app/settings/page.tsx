"use client";

// ============================================================
// Settings Page — Task: Member E
// See: APP_FLOW.md (Flow 4 - CSV Post-Onboarding)
// ============================================================

import { useState, useEffect } from "react";
import { uploadCSV, confirmCSVImport } from "@/lib/api";
import BottomNav from "@/components/BottomNav";
import { Settings, UploadCloud, CheckCircle2 } from "lucide-react";

export default function SettingsPage() {
  const [gstin, setGstin] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [csvPreview, setCsvPreview] = useState<any>(null);
  const [csvUploading, setCsvUploading] = useState(false);
  const [importDone, setImportDone] = useState(false);
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
    <div className="min-h-screen selection:bg-[#c084fc] selection:text-white font-sans pb-24 md:pb-0 pt-20 md:pt-6">
      <header className="px-4 md:px-12 py-6 mb-4 flex flex-col md:flex-row md:items-center justify-between md:ml-20">
        <div>
          <h1 className="text-3xl font-black tracking-wide text-white uppercase flex items-center gap-2">
            <Settings className="text-[#c084fc]" size={28} /> Shop <span className="text-[#c084fc]">Settings</span>
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

      <main className="px-4 md:px-12 max-w-4xl mx-auto md:ml-20 py-2 space-y-6">
        {/* Shop Profile */}
        <section className="advanced-card p-6">
          <h2 className="text-sm font-black uppercase tracking-widest text-[#c084fc]/70 mb-4">Shop Profile</h2>
          <div className="space-y-4 text-sm text-white/70 font-medium">
            <div className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/5">
              <span className="font-bold uppercase tracking-wider text-[10px] text-[#c084fc]/60">Name</span>
              <span className="text-white">Ramesh Kirana Store</span>
            </div>
            <div className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/5">
              <span className="font-bold uppercase tracking-wider text-[10px] text-[#c084fc]/60">City</span>
              <span className="text-white">Nagpur</span>
            </div>
            <div className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/5">
              <span className="font-bold uppercase tracking-wider text-[10px] text-[#c084fc]/60">Categories</span>
              <span className="text-white">Grains, FMCG</span>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* GSTIN */}
          <section className="advanced-card p-6">
            <h2 className="text-sm font-black uppercase tracking-widest text-[#c084fc]/70 mb-4">GSTIN Configuration</h2>
            <input
              placeholder="Enter your GSTIN"
              value={gstin}
              onChange={(e) => setGstin(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-base font-bold text-white focus:outline-none focus:ring-2 focus:ring-[#c084fc]/40 uppercase"
            />
          </section>

          {/* Language */}
          <section className="advanced-card p-6">
            <h2 className="text-sm font-black uppercase tracking-widest text-[#c084fc]/70 mb-4">Language</h2>
            <select className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-base font-bold text-white focus:outline-none focus:ring-2 focus:ring-[#c084fc]/40 appearance-none">
              <option value="en" className="bg-[#0D0914]">English</option>
              <option value="hi" className="bg-[#0D0914]">Hindi</option>
              <option value="te" className="bg-[#0D0914]">Telugu</option>
            </select>
          </section>
        </div>

        {/* CSV Upload */}
        <section className="advanced-card p-6">
          <h2 className="text-sm font-black uppercase tracking-widest text-[#c084fc]/70 mb-2 flex items-center gap-2">
            <UploadCloud size={20} /> Upload Old Records (CSV/Excel)
          </h2>
          <p className="text-xs font-bold text-white/50 mb-5 tracking-wide">
            Import your historical sales data to get more accurate AI predictions.
          </p>

          {importDone ? (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-sm font-bold text-green-400 flex items-center gap-2">
              <CheckCircle2 size={18} /> Records imported successfully! ML model is retraining.
            </div>
          ) : csvPreview ? (
            <div className="space-y-4">
              <p className="text-xs font-bold uppercase tracking-widest text-[#c084fc] bg-[#c084fc]/10 w-max px-3 py-1 rounded-md border border-[#c084fc]/20">{csvPreview.row_count} rows detected</p>
              <div className="overflow-x-auto rounded-xl bg-white/5 border border-white/10 p-2">
                <table className="w-full text-xs text-left text-white">
                  <thead className="text-[10px] uppercase font-black text-[#c084fc]/70">
                    <tr>
                      {Object.values(csvPreview.detected_columns as Record<string, string>).map((col: string) => (
                        <th key={col} className="px-3 py-2 border-b border-white/10">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {csvPreview.preview_rows.slice(0, 3).map((row: any, i: number) => (
                      <tr key={i} className="border-b border-white/5 last:border-0 font-medium text-white/80">
                        <td className="px-3 py-2">{row.date}</td>
                        <td className="px-3 py-2">{row.product}</td>
                        <td className="px-3 py-2">{row.qty}</td>
                        <td className="px-3 py-2">{row.price}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button onClick={handleConfirmImport} className="advanced-btn w-full py-3.5 mt-2">
                Confirm Data Import
              </button>
            </div>
          ) : (
            <label className="block w-full py-10 border-2 border-dashed border-white/10 rounded-2xl text-center cursor-pointer hover:border-[#c084fc]/50 hover:bg-white/5 transition-all group">
              <span className="text-white/50 font-bold uppercase tracking-widest group-hover:text-[#c084fc] block">{csvUploading ? "Uploading..." : "Click to select CSV/Excel file"}</span>
              <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileUpload} className="hidden" />
            </label>
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
