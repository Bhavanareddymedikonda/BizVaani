"use client";

import { AlertCircle, AlertTriangle, ChevronRight, Info } from "lucide-react";
import { cn } from "@/lib/cn";

interface AlertCardProps {
  productName: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  message: string;
  reason?: string;
  onAskBizVaani?: () => void;
}

export default function AlertCard({
  productName,
  severity,
  message,
  reason,
  onAskBizVaani,
}: AlertCardProps) {
  const isHigh = severity === "HIGH";
  const isMedium = severity === "MEDIUM";

  const Icon = isHigh ? AlertCircle : isMedium ? AlertTriangle : Info;
  const badgeClass = severity === "HIGH" ? "status-danger" : severity === "MEDIUM" ? "status-warning" : "status-info";
  const iconTone = severity === "HIGH" ? "text-[var(--color-danger)]" : severity === "MEDIUM" ? "text-[var(--color-warning)]" : "text-[var(--color-info)]";

  const handleAsk = () => {
    if (onAskBizVaani) {
      onAskBizVaani();
      return;
    }

    window.dispatchEvent(
      new CustomEvent("bv-open-voice", {
        detail: {
          prompt: `Explain this business risk and what I should do now. Product: ${productName}. Severity: ${severity}. Alert: ${message}. Reason: ${reason ?? "No extra reason available."}`,
        },
      }),
    );
  };

  return (
    <article className="surface flex flex-col gap-4 p-5 transition-transform duration-200 hover:-translate-y-1">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-2xl bg-[var(--color-panel-muted)] p-2.5">
            <Icon className={iconTone} size={20} strokeWidth={2.4} />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-text-muted)]">Risk alert</p>
            <h4 className="mt-1 text-lg font-semibold tracking-[-0.03em] text-[var(--color-text)]">{productName}</h4>
          </div>
        </div>
        <span className={cn("status-badge", badgeClass)}>
          {severity}
        </span>
      </div>

      <p className="text-sm leading-6 text-[var(--color-text)]">{message}</p>

      {reason && (
        <p className="rounded-2xl bg-[rgba(15,23,42,0.05)] px-3 py-3 text-sm leading-6 text-[var(--color-text-soft)]">
          {reason}
        </p>
      )}

      <div className="mt-1">
        <button
          type="button"
          onClick={handleAsk}
          className="btn-secondary"
        >
          Ask BizVaani
          <ChevronRight size={14} />
        </button>
      </div>
    </article>
  );
}

