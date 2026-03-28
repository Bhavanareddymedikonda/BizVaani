"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquareMore, RefreshCw } from "lucide-react";
import { AppShell, PageHeader, SectionHeader, StatCard } from "@/components/AppShell";
import ProductCard from "@/components/ProductCard";
import AlertCard from "@/components/AlertCard";
import { getDashboard } from "../../lib/api";

type DashboardData = {
  user?: { name?: string };
  shop?: { shop_name?: string; city?: string };
  alerts?: Array<{
    id: number;
    product_name: string;
    severity: "HIGH" | "MEDIUM" | "LOW";
    message: string;
  }>;
  top_products?: Array<{
    id: number;
    name: string;
    today_qty: number;
    today_revenue: number;
    stock_qty: number;
    stock_status: "CRITICAL" | "LOW_STOCK" | "IN_STOCK";
    unit: string;
    trend_pct: number;
    mandi_price: number;
    risk_level: "HIGH" | "MEDIUM" | "LOW";
  }>;
  total_today?: { revenue?: number; items_sold?: number; profit_estimate?: number };
  stock_summary?: { low_stock_count?: number; inventory_value?: number };
};

export default function DashboardPage() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  function handleLogout() {
    localStorage.removeItem("bv_token");
    localStorage.removeItem("bv_user");
    localStorage.removeItem("bv_shop");
    localStorage.removeItem("bv_dashboard_refresh");
    sessionStorage.removeItem("bv_voice_session");
    router.replace("/login");
  }

  useEffect(() => {
    async function loadDashboard() {
      try {
        const data = await getDashboard();
        setDashboard(data);
      } catch (err) {
        console.error("Failed to fetch dashboard:", err);
      } finally {
        setLoading(false);
      }
    }

    void loadDashboard();

    const refresh = () => void loadDashboard();
    const onStorage = (event: StorageEvent) => {
      if (event.key === "bv_dashboard_refresh") void loadDashboard();
    };

    window.addEventListener("focus", refresh);
    window.addEventListener("storage", onStorage);
    const interval = window.setInterval(refresh, 15000);

    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", onStorage);
      window.clearInterval(interval);
    };
  }, []);

  const actions = (
    <>
      <button type="button" className="btn-secondary" onClick={() => window.dispatchEvent(new CustomEvent("bv-open-voice"))}>
        <MessageSquareMore size={16} />
        Ask BizVaani
      </button>
      <button type="button" className="btn-ghost" onClick={handleLogout}>
        Logout
      </button>
    </>
  );

  if (loading) {
    return (
      <AppShell>
        <div className="app-grid md:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="metric-card h-40 animate-pulse" />
          ))}
        </div>
      </AppShell>
    );
  }

  if (!dashboard) {
    return (
      <AppShell>
        <div className="empty-state">
          <p className="text-lg font-semibold text-[var(--color-text)]">Unable to load dashboard</p>
          <p className="mt-2 text-sm text-[var(--color-text-soft)]">The data request failed. Refresh and try again.</p>
          <button type="button" className="btn-primary mt-5" onClick={() => window.location.reload()}>
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      </AppShell>
    );
  }

  const highOrMediumAlerts = dashboard.alerts?.filter((alert) => alert.severity !== "LOW") || [];
  const revenueValue = `Rs.${(dashboard.total_today?.revenue || 0).toLocaleString("en-IN")}`;
  const profitValue = `Rs.${(dashboard.total_today?.profit_estimate || 0).toLocaleString("en-IN")}`;
  const inventoryValue = `Rs.${(dashboard.stock_summary?.inventory_value || 0).toLocaleString("en-IN")}`;

  return (
    <AppShell topbar={<span className="status-badge status-info">{dashboard.shop?.shop_name || "Retail workspace"}</span>}>
      <PageHeader
        eyebrow="Daily overview"
        title={`Good morning, ${dashboard.user?.name || "Ramesh"}`}
        description={`${dashboard.shop?.shop_name || "Your store"} in ${dashboard.shop?.city || "Nagpur"} with live revenue, stock, and risk context.`}
        actions={actions}
      />

      <section className="app-grid md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Revenue today" value={revenueValue} hint="Gross revenue recorded across current activity." />
        <StatCard label="Items sold" value={`${dashboard.total_today?.items_sold || 0}`} hint="Units sold today from sales and invoice entries." tone="accent" />
        <StatCard label="Estimated profit" value={profitValue} hint="Derived from current selling and cost prices." tone="success" />
        <StatCard label="Inventory value" value={inventoryValue} hint={`${dashboard.stock_summary?.low_stock_count || 0} low stock SKU flagged.`} tone="warning" />
      </section>

      <section className="mt-10">
        <SectionHeader
          title="Risk summary"
          description="Priority alerts from inventory pressure and sales trend shifts."
          action={<span className="status-badge status-warning">{highOrMediumAlerts.length} open</span>}
        />

        {highOrMediumAlerts.length ? (
          <div className="app-grid md:grid-cols-2">
            {highOrMediumAlerts.map((alert) => (
              <AlertCard key={alert.id} productName={alert.product_name} severity={alert.severity} message={alert.message} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p className="text-lg font-semibold text-[var(--color-text)]">No urgent alerts</p>
            <p className="mt-2 text-sm text-[var(--color-text-soft)]">Current inventory and sales patterns look stable.</p>
          </div>
        )}
      </section>

      <section className="mt-10">
        <SectionHeader
          title="Product performance"
          description="Top products ordered by today’s revenue with mandi and stock context."
        />
        <div className="app-grid md:grid-cols-2 2xl:grid-cols-3">
          {dashboard.top_products?.map((product) => (
            <ProductCard
              key={product.id}
              name={product.name}
              todayQty={product.today_qty}
              todayRevenue={product.today_revenue}
              stockQty={product.stock_qty}
              stockStatus={product.stock_status}
              unit={product.unit}
              trendPct={product.trend_pct}
              mandiPrice={product.mandi_price}
              riskLevel={product.risk_level}
            />
          ))}
        </div>
      </section>
    </AppShell>
  );
}
