import { getDashboard } from "../../lib/api";
import ProductCard from "../../components/ProductCard";
import AlertCard from "../../components/AlertCard";
import BottomNav from "../../components/BottomNav";

export default async function DashboardPage() {
  const dashboard: any = await getDashboard();
  
  const highOrMediumAlerts = dashboard.alerts?.filter(
    (a: any) => a.severity === "HIGH" || a.severity === "MEDIUM"
  ) || [];

  return (
    <div className="min-h-screen selection:bg-[#c084fc] selection:text-white font-sans pb-24 md:pb-0 pt-20 md:pt-6">
      {/* Header */}
      <header className="px-4 md:px-12 py-6 mb-4 flex flex-col md:flex-row md:items-center justify-between md:ml-20">
        <div>
          <h1 className="text-3xl font-black tracking-wide text-white">
            Good morning, <span className="text-[#c084fc]">Ramesh</span>
          </h1>
          <p className="font-bold text-xs uppercase tracking-widest text-[#c084fc]/60 mt-1">
            {dashboard.shop.shop_name} • {dashboard.shop.city}
          </p>
        </div>
      </header>

      <main className="px-4 md:px-12 max-w-7xl mx-auto md:ml-20">
        {/* Stats Row */}
        <section className="mb-10 grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          <div className="advanced-card !bg-gradient-to-br !from-[#9333ea] !to-[#4c1d95] text-white p-6 col-span-2 md:col-span-1 shadow-[0_8px_32px_rgba(147,51,234,0.4)] !border-none flex flex-col justify-center">
            <h2 className="text-xs font-bold uppercase tracking-wider mb-1 opacity-90 text-[#e9d5ff]">Total Revenue Today</h2>
            <div className="text-5xl md:text-6xl font-black mt-2 drop-shadow-md tracking-tighter">
              ₹{dashboard.total_today.revenue.toLocaleString()}
            </div>
          </div>
          
          <div className="advanced-card p-6 flex flex-col justify-center">
            <h2 className="text-xs font-bold uppercase tracking-wider mb-2 text-[#c084fc]/70">Items Sold</h2>
            <div className="text-4xl font-black text-[#f3e8ff] drop-shadow-[0_0_12px_rgba(255,255,255,0.3)]">{dashboard.total_today.items_sold}</div>
          </div>
          
          <div className="advanced-card p-6 flex flex-col justify-center">
            <h2 className="text-xs font-bold uppercase tracking-wider mb-2 text-[#c084fc]/70">Est. Profit</h2>
            <div className="text-4xl font-black text-[#4ade80] drop-shadow-[0_0_12px_rgba(74,222,128,0.4)]">₹{dashboard.total_today.profit_estimate.toLocaleString()}</div>
          </div>
        </section>

        {/* Alerts Section */}
        {highOrMediumAlerts.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-6 bg-red-500/10 text-red-500 px-4 py-2.5 rounded-full w-max border border-red-500/20 backdrop-blur-md">
              <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)] animate-pulse" />
              <h2 className="text-xs font-black uppercase tracking-widest">
                Action Required
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
              {highOrMediumAlerts.map((alert: any) => (
                <AlertCard
                  key={alert.id}
                  productName={alert.product_name}
                  severity={alert.severity}
                  message={alert.message}
                />
              ))}
            </div>
          </section>
        )}

        {/* Product Cards Section */}
        <section className="mb-10">
          <div className="mb-6 flex justify-between items-end">
            <h2 className="text-sm font-black uppercase tracking-widest text-[#c084fc]/80 bg-[#c084fc]/10 px-4 py-2 rounded-xl backdrop-blur-sm border border-[#c084fc]/20">
              Top Products
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {dashboard.top_products.map((product: any) => (
              <ProductCard
                key={product.id}
                name={product.name}
                todayQty={product.today_qty}
                todayRevenue={product.today_revenue}
                trendPct={product.trend_pct}
                mandiPrice={product.mandi_price}
                riskLevel={product.risk_level}
              />
            ))}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
