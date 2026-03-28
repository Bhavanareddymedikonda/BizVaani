"use client";

import { AlertCircle, AlertTriangle, Info } from "lucide-react";

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
  
  const bgColors = {
    HIGH: "bg-[#231A3F]/50 border-red-500/20 hover:border-red-500/40",
    MEDIUM: "bg-[#231A3F]/50 border-yellow-500/20 hover:border-yellow-500/40",
    LOW: "bg-[#231A3F]/50 border-blue-500/20 hover:border-blue-500/40"
  };

  const badgeColors = {
    HIGH: "bg-red-500/20 text-red-400 border-red-500/30",
    MEDIUM: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    LOW: "bg-blue-500/20 text-blue-400 border-blue-500/30"
  };

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
    <div className={`advanced-card p-5 relative flex flex-col gap-3 transition-transform hover:-translate-y-1 overflow-hidden pointer-events-auto ${bgColors[severity]} border backdrop-blur-xl`}>
      
      {/* Visual Accent Bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${isHigh ? 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)]' : isMedium ? 'bg-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.8)]' : 'bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.8)]'}`} />

      <div className="flex justify-between items-start gap-2 pl-2">
        <div className="flex items-center gap-2.5">
          <div className={`p-1.5 rounded-xl bg-white/5 border border-white/10`}>
            <Icon className={isHigh ? "text-red-400" : isMedium ? "text-yellow-400" : "text-blue-400"} size={22} strokeWidth={2.5} />
          </div>
          <h4 className="font-extrabold text-lg uppercase text-white tracking-wide">{productName} Alert</h4>
        </div>
        <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-lg border ${badgeColors[severity]}`}>
          {severity}
        </span>
      </div>
      
      <p className="text-sm font-medium text-white/70 leading-snug pl-2 mt-1 drop-shadow-sm">
        {message}
      </p>

      {reason && (
        <p className="pl-2 text-xs leading-6 text-white/45">
          {reason}
        </p>
      )}

      <div className="mt-2 pl-2">
        <button 
          type="button"
          onClick={handleAsk}
          className="advanced-btn-sm px-4 py-2 text-[10px] sm:text-xs"
        >
          Ask BizVaani
        </button>
      </div>
    </div>
  );
}
