// ============================================================
// AlertCard — Task: Member C
// See: FRONTEND_GUIDELINES.md (Section 4 — Risk Alert Card)
// ============================================================

interface Alert {
  id: number;
  product_name: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  message: string;
  created_at: string;
}

const SEVERITY_STYLES = {
  HIGH: { bg: "bg-red-50", border: "border-red-500", text: "text-red-700", icon: "🔴" },
  MEDIUM: { bg: "bg-amber-50", border: "border-amber-500", text: "text-amber-700", icon: "🟡" },
  LOW: { bg: "bg-green-50", border: "border-green-500", text: "text-green-700", icon: "🟢" },
};

export default function AlertCard({ alert }: { alert: Alert }) {
  const style = SEVERITY_STYLES[alert.severity];

  return (
    <div className={`${style.bg} border-l-4 ${style.border} rounded-lg p-4 shadow-sm`}>
      <div className="flex items-start gap-3">
        <span className="text-sm flex-shrink-0 mt-0.5">{style.icon}</span>
        <div className="flex-1">
          <p className={`font-semibold text-base ${style.text}`}>{alert.product_name}</p>
          <p className="text-gray-600 text-sm mt-1">{alert.message}</p>
          <button className="mt-2 text-orange-500 font-medium text-sm hover:text-orange-600 transition-colors">
            Ask BizVaani →
          </button>
        </div>
      </div>
    </div>
  );
}
