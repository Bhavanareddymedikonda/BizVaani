"use client";

import AlertCard from "./AlertCard";

interface Alert {
  id: number;
  product_name: string;
  level?: "HIGH" | "MEDIUM" | "LOW";
  severity?: "HIGH" | "MEDIUM" | "LOW";
  message?: string;
  reason?: string;
  created_at?: string;
}

interface Props {
  alerts: Alert[];
}

export default function AlertsPanel({ alerts }: Props) {
  if (alerts.length === 0) {
    return (
      <div
        className="clay-card p-8 text-center"
        style={{ color: "var(--color-text-soft)" }}
      >
        <p className="text-3xl mb-2">✅</p>
        <p className="font-semibold text-sm">Sab kuch theek hai</p>
        <p className="text-xs mt-1">Koi anomaly nahi mili aaj</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <AlertCard key={alert.id} alert={alert} />
      ))}
    </div>
  );
}
