// ============================================================
// BizVaani — API Client Layer
// Enforces purely real API requests to the database backend.
// ============================================================

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// --- Helpers ---

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("bv_token");
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { ...authHeaders(), ...options?.headers },
  });
  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
  return res.json();
}

// --- Auth ---

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

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  return request<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export interface LoginRequest {
  phone: string;
  password: string;
}

export async function login(data: LoginRequest): Promise<AuthResponse> {
  return request<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// --- Dashboard ---

export async function getDashboard() {
  return request("/api/dashboard");
}

// --- Forecast ---

export async function getForecast(productId: number | string) {
  return request(`/api/forecast/${productId}`);
}

// --- Alerts ---
export async function getAlerts() {
  return request("/api/alerts");
}

// --- Market Prices ---

export async function getMarketPrices() {
  return request("/api/market/prices");
}

// --- Simulate ---

export interface SimulateRequest {
  shop_id: number;
  product_id: number;
  action: string;
  current_price: number;
  suggested_price: number;
  avg_daily_qty: number;
}

export async function simulate(data: SimulateRequest) {
  return request("/api/simulate", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// --- Invoice ---

export interface InvoiceItem {
  product: string;
  qty: number;
  unit_price: number;
  gst_rate: number;
}

export interface GenerateInvoiceRequest {
  shop_id: number;
  customer_name: string;
  items: InvoiceItem[];
}

export async function generateInvoice(data: GenerateInvoiceRequest) {
  return request("/api/invoice/generate", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// --- Voice (REST fallback — primary path is WebSocket) ---

export async function voiceQuery(shopId: number, transcript: string, language = "en") {
  return request("/api/voice/query", {
    method: "POST",
    body: JSON.stringify({ shop_id: shopId, transcript, language }),
  });
}

// --- Invoice PDF Download ---
export async function downloadInvoicePdf(invoiceId: number): Promise<Blob> {
  const res = await fetch(`${API_URL}/api/invoice/pdf/${invoiceId}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error(`PDF error: ${res.status}`);
  return res.blob();
}

// --- CSV Upload ---

export async function uploadCSV(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_URL}/api/settings/csv`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` },
    body: formData,
  });
  return res.json();
}

export async function confirmCSVImport(fileId: string, columnMapping: Record<string, string>) {
  return request("/api/settings/csv/confirm", {
    method: "POST",
    body: JSON.stringify({ file_id: fileId, column_mapping: columnMapping }),
  });
}
