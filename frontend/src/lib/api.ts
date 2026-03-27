// ============================================================
// BizVaani — API Client Layer
// Reads NEXT_PUBLIC_USE_MOCKS to toggle between mock and real.
// Components import from here, NEVER from mockData directly.
// ============================================================

import {
  MOCK_REGISTER_RESPONSE,
  MOCK_LOGIN_RESPONSE,
  MOCK_DASHBOARD,
  MOCK_FORECAST,
  MOCK_FORECASTS_BY_PRODUCT,
  MOCK_MARKET_PRICES,
  MOCK_SIMULATE,
  MOCK_INVOICE,
  MOCK_VOICE_RESPONSE,
  MOCK_CSV_PREVIEW,
  MOCK_CSV_CONFIRM,
} from "./mockData";

const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "true";
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

export async function register(data: RegisterRequest) {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 500));
    return MOCK_REGISTER_RESPONSE;
  }
  return request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export interface LoginRequest {
  phone: string;
  password: string;
}

export async function login(data: LoginRequest) {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 300));
    return MOCK_LOGIN_RESPONSE;
  }
  return request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// --- Dashboard ---

export async function getDashboard() {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 400));
    return MOCK_DASHBOARD;
  }
  return request("/api/dashboard");
}

// --- Forecast ---

export async function getForecast(productName: string) {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 300));
    return MOCK_FORECASTS_BY_PRODUCT[productName] || MOCK_FORECAST;
  }
  return request(`/api/forecast/${encodeURIComponent(productName)}`);
}

// --- Market Prices ---

export async function getMarketPrices() {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 200));
    return MOCK_MARKET_PRICES;
  }
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
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 600));
    return MOCK_SIMULATE;
  }
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
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 800));
    return MOCK_INVOICE;
  }
  return request("/api/invoice/generate", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// --- Voice (REST fallback — primary path is WebSocket) ---

export async function voiceQuery(shopId: number, transcript: string) {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 1200));
    return MOCK_VOICE_RESPONSE;
  }
  return request("/api/voice/query", {
    method: "POST",
    body: JSON.stringify({ shop_id: shopId, transcript }),
  });
}

// --- CSV Upload ---

export async function uploadCSV(file: File) {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 1000));
    return MOCK_CSV_PREVIEW;
  }
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
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 800));
    return MOCK_CSV_CONFIRM;
  }
  return request("/api/settings/csv/confirm", {
    method: "POST",
    body: JSON.stringify({ file_id: fileId, column_mapping: columnMapping }),
  });
}
