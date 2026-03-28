const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("bv_token");
}

function authHeaders(extra?: HeadersInit): HeadersInit {
  const token = getToken();
  return {
    ...(extra ?? {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers = authHeaders(options?.headers);
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorMessage = `API error: ${res.status} ${res.statusText}`;
    try {
      const data = await res.json();
      errorMessage = data.detail || data.error?.message || errorMessage;
    } catch {}
    throw new Error(errorMessage);
  }

  return res.json();
}

export interface RegisterRequest {
  phone: string;
  name: string;
  password: string;
  city: string;
  state: string;
  language: string;
  shop_name: string;
  categories: string[];
}

export interface AuthResponse {
  access_token: string;
  user: { id: number; name: string; city: string };
  shop: { id: number; shop_name: string };
}

export interface InventoryItem {
  id: number;
  name: string;
  category: string;
  unit: string;
  in_stock: number;
  stock_qty: number;
  minimum_required: number;
  avg_daily_qty: number;
  status: "CRITICAL" | "LOW_STOCK" | "IN_STOCK";
  latest_update_at: string | null;
  latest_update_type: string | null;
  selling_price: number;
  cost_price: number | null;
}

export interface StockTransaction {
  id: number;
  product_id: number;
  product_name: string;
  unit: string;
  transaction_type: string;
  quantity_delta: number;
  balance_after: number;
  unit_price: number | null;
  reference_type: string | null;
  reference_id: number | null;
  notes: string | null;
  created_at: string | null;
}

export interface InvoiceItem {
  product_id?: number | null;
  product: string;
  qty: number;
  unit_price: number;
  gst_rate: number;
}

export interface InvoicePreview {
  shop: { id: number; shop_name: string; gstin?: string | null };
  customer_name: string;
  customer_gstin?: string | null;
  items: Array<InvoiceItem & { amount: number; gst_amount: number; stock_available?: number | null }>;
  subtotal: number;
  cgst: number;
  sgst: number;
  total: number;
}

export interface InvoiceDetail {
  id: number;
  invoice_number: string;
  date: string | null;
  customer_name: string;
  customer_gstin: string | null;
  shop_name: string;
  shop_gstin: string | null;
  items: Array<InvoiceItem & { amount?: number }>;
  subtotal: number;
  cgst: number;
  sgst: number;
  total: number;
  pdf_url: string;
}

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  return request<AuthResponse>("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function login(data: { phone: string; password: string }): Promise<AuthResponse> {
  return request<AuthResponse>("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function getDashboard() {
  return request("/api/dashboard");
}

export async function getInventory() {
  return request<InventoryItem[]>("/api/inventory");
}

export async function adjustInventory(data: {
  product_id: number;
  quantity_delta: number;
  transaction_type: "restock" | "manual_adjustment";
  unit_price?: number;
  notes?: string;
}) {
  return request("/api/inventory/adjust", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function createProduct(data: {
  name: string;
  category: string;
  unit: string;
  selling_price: number;
  cost_price?: number;
  stock_qty: number;
}) {
  return request("/api/inventory/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function getInventoryTransactions(params?: {
  product_id?: number;
  transaction_type?: string;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params?.product_id) query.set("product_id", String(params.product_id));
  if (params?.transaction_type) query.set("transaction_type", params.transaction_type);
  if (params?.limit) query.set("limit", String(params.limit));
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return request<StockTransaction[]>(`/api/inventory/transactions${suffix}`);
}

export async function getForecast(productId: number | string) {
  return request(`/api/forecast/${productId}`);
}

export async function getAlerts() {
  return request("/api/alerts");
}

export async function getMarketPrices() {
  return request("/api/market/prices");
}

export async function simulate(data: {
  shop_id: number;
  product_id: number;
  action: string;
  current_price: number;
  suggested_price: number;
  avg_daily_qty: number;
}) {
  return request("/api/simulate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function previewInvoice(data: {
  shop_id: number;
  customer_name: string;
  customer_gstin?: string | null;
  items: InvoiceItem[];
}) {
  return request<InvoicePreview>("/api/invoice/preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function generateInvoice(data: {
  shop_id: number;
  customer_name: string;
  customer_gstin?: string | null;
  items: InvoiceItem[];
}) {
  return request<{
    invoice_id: number;
    invoice_number: string;
    pdf_url: string;
    detail_url: string;
    total: number;
    gst_breakup: { cgst: number; sgst: number };
  }>("/api/invoice/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function getInvoiceDetail(invoiceId: number | string) {
  return request<InvoiceDetail>(`/api/invoice/${invoiceId}`);
}

export async function voiceQuery(shopId: number, transcript: string, language = "en") {
  return request("/api/voice/query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ shop_id: shopId, transcript, language }),
  });
}

export async function downloadInvoicePdf(invoiceId: number): Promise<Blob> {
  const res = await fetch(`${API_URL}/api/invoice/${invoiceId}/pdf`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`PDF error: ${res.status}`);
  return res.blob();
}

export async function uploadCSV(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_URL}/api/settings/csv`, {
    method: "POST",
    headers: authHeaders(),
    body: formData,
  });
  return res.json();
}

export async function confirmCSVImport(fileId: string, columnMapping: Record<string, string>) {
  return request("/api/settings/csv/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file_id: fileId, column_mapping: columnMapping }),
  });
}
