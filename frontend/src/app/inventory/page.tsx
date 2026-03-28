import { getInventory } from "@/lib/api";
import BottomNav from "@/components/BottomNav";
import MicFAB from "@/components/MicFAB";
import InventoryCard from "@/components/InventoryCard";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

export default async function InventoryPage() {
  const inventory: any = await getInventory();

  // Sort logic for stock priorities
  const criticalItems = inventory.filter((item: any) => item.status === "CRITICAL");
  const lowItems = inventory.filter((item: any) => item.status === "LOW_STOCK");
  const inStockItems = inventory.filter((item: any) => item.status === "IN_STOCK");

  return (
    <div className="min-h-screen selection:bg-[#f97316] selection:text-white font-sans md:pl-64 pb-24 md:pb-0">
      {/* Header */}
      <header className="px-4 md:px-8 py-6 sticky top-0 z-30 bg-[#fff8eb]/80 backdrop-blur-md border-b-2 border-dashed border-[#e5dacc]">
        <h1 className="text-2xl font-black tracking-wide text-[#4a2d12] uppercase">
          Inventory <span className="text-[#f97316]">Stock</span>
        </h1>
        <p className="font-bold text-xs uppercase tracking-widest text-[#8c6b4d] mt-1">
          Manage your products and reorder
        </p>
      </header>

      <main className="px-4 md:px-8 max-w-7xl mx-auto py-6">
        
        {/* Warnings Section */}
        {(criticalItems.length > 0 || lowItems.length > 0) && (
          <section className="mb-12">
            <h2 className="text-xs font-black uppercase tracking-widest text-red-600 flex items-center gap-2 mb-4 bg-red-100/50 w-max px-3 py-1.5 rounded-full shadow-[inset_1px_1px_3px_rgba(255,255,255,1),inset_-1px_-1px_3px_rgba(0,0,0,0.05)] border border-red-100">
              <AlertTriangle size={16} /> Needs Attention
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
              {criticalItems.map((item: any) => (
                <InventoryCard key={item.id} item={item} />
              ))}
              {lowItems.map((item: any) => (
                <InventoryCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        )}

        {/* Regular Stock */}
        <section className="mb-10">
          <h2 className="text-xs font-black uppercase tracking-widest text-[#6b4a31] flex items-center gap-2 mb-4">
            <CheckCircle2 size={16} className="text-green-500" /> In Stock
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {inStockItems.map((item: any) => (
              <InventoryCard key={item.id} item={item} />
            ))}
          </div>
        </section>

      </main>

      <MicFAB />
      <BottomNav />
    </div>
  );
}
