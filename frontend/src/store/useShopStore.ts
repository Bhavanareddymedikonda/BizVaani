import { create } from "zustand";

interface Product {
  id: number;
  name: string;
  product_name?: string;  // backend field alias
  today_qty: number;
  today_revenue: number;
  trend_pct: number;
  mandi_price: number;
  risk_level: "HIGH" | "MEDIUM" | "LOW";
}

interface Alert {
  id: number;
  product_name: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  message: string;
  created_at: string;
}

interface Shop {
  id: number;
  shop_name: string;
  city: string;
  categories: string[];
}

interface TotalToday {
  revenue: number;
  items_sold: number;
  profit_estimate: number;
}

interface ShopState {
  shop: Shop | null;
  products: Product[];
  alerts: Alert[];
  totalToday: TotalToday | null;
  isLoading: boolean;
  userName: string;

  setDashboardData: (data: {
    shop: Shop;
    top_products: Product[];
    alerts: Alert[];
    total_today: TotalToday;
  }) => void;
  setLoading: (loading: boolean) => void;
  setUserName: (name: string) => void;
  addAlert: (alert: Alert) => void;
}

export const useShopStore = create<ShopState>((set) => ({
  shop: null,
  products: [],
  alerts: [],
  totalToday: null,
  isLoading: true,
  userName: "",

  setDashboardData: (data) =>
    set({
      shop: data.shop,
      products: data.top_products,
      alerts: data.alerts,
      totalToday: data.total_today,
      isLoading: false,
    }),
  setLoading: (loading) => set({ isLoading: loading }),
  setUserName: (name) => set({ userName: name }),
  addAlert: (alert) => set((state) => ({ alerts: [alert, ...state.alerts] })),
}));
