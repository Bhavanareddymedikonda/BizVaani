"use client";

import { useState } from "react";
import { AppShell, PageHeader, SectionHeader } from "@/components/AppShell";
import { confirmCSVImport, uploadCSV } from "@/lib/api";

export default function SettingsPage() {
  const [gstin, setGstin] = useState("");
  const [csvPreview, setCsvPreview] = useState<Record<string, unknown> | null>(null);
  const [csvUploading, setCsvUploading] = useState(false);
  const [importDone, setImportDone] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvUploading(true);
    try {
      const preview = await uploadCSV(file);
      setCsvPreview(preview as Record<string, unknown>);
    } catch (err) {
      console.error("CSV upload failed:", err);
    } finally {
      setCsvUploading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!csvPreview) return;
    try {
      await confirmCSVImport("mock-file-id", (csvPreview.detected_columns as Record<string, string>) || {});
      setImportDone(true);
      setCsvPreview(null);
    } catch (err) {
      console.error("CSV confirm failed:", err);
    }
  };

  const previewRows = (csvPreview?.preview_rows as Array<Record<string, string>>) || [];
  const detectedColumns = (csvPreview?.detected_columns as Record<string, string>) || {};

  return (
    <AppShell topbar={<span className="status-badge status-info">Profile and data import</span>}>
      <PageHeader
        eyebrow="Settings"
        title="Shop settings"
        description="Maintain shop details, language, GST fields, and historical data import from one place."
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-6">
          <section className="surface p-6">
            <SectionHeader title="Shop profile" description="Current profile information shown across the workspace." />
            <div className="grid gap-3 md:grid-cols-3">
              <div className="surface-muted px-4 py-4">
                <p className="eyebrow">Store name</p>
                <p className="mt-2 text-base font-medium text-[var(--color-text)]">Ramesh Kirana Store</p>
              </div>
              <div className="surface-muted px-4 py-4">
                <p className="eyebrow">City</p>
                <p className="mt-2 text-base font-medium text-[var(--color-text)]">Nagpur</p>
              </div>
              <div className="surface-muted px-4 py-4">
                <p className="eyebrow">Categories</p>
                <p className="mt-2 text-base font-medium text-[var(--color-text)]">Grains, FMCG</p>
              </div>
            </div>
          </section>

          <section className="surface p-6">
            <SectionHeader title="Historical imports" description="Bring in old sales records for better forecast confidence." />

            {importDone ? (
              <div className="surface-muted border-[rgba(47,125,87,0.18)] px-4 py-4 text-sm text-[var(--color-success)]">
                Records imported successfully. ML retraining has been triggered according to current backend behavior.
              </div>
            ) : csvPreview ? (
              <div className="space-y-4">
                <div className="status-badge status-info">{csvPreview.row_count as number} rows detected</div>
                <div className="table-shell overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="table-head">
                        {Object.values(detectedColumns).map((col) => (
                          <th key={col} className="table-cell">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.slice(0, 3).map((row, i) => (
                        <tr key={i} className="table-row">
                          <td className="table-cell text-[var(--color-text-soft)]">{row.date}</td>
                          <td className="table-cell text-[var(--color-text-soft)]">{row.product}</td>
                          <td className="table-cell text-[var(--color-text-soft)]">{row.qty}</td>
                          <td className="table-cell text-[var(--color-text-soft)]">{row.price}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button onClick={handleConfirmImport} className="btn-primary">
                  Confirm data import
                </button>
              </div>
            ) : (
              <label className="surface-muted block cursor-pointer px-6 py-10 text-center">
                <span className="block text-base font-medium text-[var(--color-text)]">{csvUploading ? "Uploading..." : "Select CSV or Excel file"}</span>
                <span className="mt-2 block text-sm text-[var(--color-text-soft)]">Use your current import flow and preview the detected columns before confirming.</span>
                <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileUpload} className="hidden" />
              </label>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="surface p-6">
            <SectionHeader title="GST configuration" description="Current frontend keeps this as a UI-only field." />
            <input placeholder="Enter your GSTIN" value={gstin} onChange={(e) => setGstin(e.target.value)} className="field uppercase" />
          </section>

          <section className="surface p-6">
            <SectionHeader title="Language" description="Set the operator language preference for the app." />
            <select className="field">
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="te">Telugu</option>
            </select>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}
