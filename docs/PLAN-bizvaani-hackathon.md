# BizVaani — Hackathon Implementation Plan

> **Project Type:** WEB (Next.js 14 + FastAPI)
> **Team:** 5 members (1 advanced + 4 beginner/intermediate)
> **Duration:** 36 hours
> **Goal:** Working, demo-ready Voice-First AI Business Coach

---

## 1. System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     FRONTEND (Next.js 14)                │
│                                                          │
│  Landing → Onboard → Dashboard → Alerts → Invoice        │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐          │
│  │VoiceModal│  │Dashboard │  │ Settings/CSV  │          │
│  │wavesurfer│  │ Recharts │  │ Upload Panel  │          │
│  └────┬─────┘  └────┬─────┘  └───────┬───────┘          │
│       │              │                │                   │
│  Zustand Stores: useVoiceStore + useShopStore             │
└───────┼──────────────┼────────────────┼──────────────────┘
        │ WebSocket    │ REST           │ REST
        ▼              ▼                ▼
┌─────────────────────────────────────────────────────────┐
│                    BACKEND (FastAPI 0.111.x)              │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  │ api/     │  │ agent/   │  │ ml/      │               │
│  │ routes   │  │ LangGraph│  │ XGBoost  │               │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘               │
│       │              │              │                     │
│  ┌────┴──────────────┴──────────────┴────┐               │
│  │           db/ (SQLAlchemy + SQLite)     │               │
│  │  users│shops│products│sales_entries│    │               │
│  │  ml_forecasts│market_prices│invoices│  │               │
│  └───────────────────────────────────────┘               │
│                                                          │
│  scheduler/ (APScheduler — 4h Agmarknet + Tavily)        │
└──────────────────────────┬───────────────────────────────┘
                           │
            ┌──────────────┼──────────────┐
            ▼              ▼              ▼
     ┌──────────┐   ┌──────────┐   ┌──────────┐
     │ Sarvam   │   │ Groq     │   │ Agmarknet│
     │ STT/TTS  │   │ LLaMA 3  │   │ + Tavily │
     └──────────┘   └──────────┘   └──────────┘
```

### Request Flow (Voice Query)

```
User speaks → Browser mic → WebSocket /ws/voice/{shop_id}
  → Sarvam STT (streaming transcript)
  → LangGraph Agent:
      ├─ Node 1: SQLite sales fetch (parallel)
      └─ Node 2: Cached market price (parallel)
  → Groq LLaMA 3.3 70B (streaming tokens)
  → Sentence buffer → Sarvam TTS (sentence-level)
  → WebSocket → Browser plays audio (~1.4s perceived latency)
```

### Request Flow (REST — Dashboard)

```
Browser → GET /api/dashboard → FastAPI → SQLite query → JSON → React renders
```

---

## 2. Base Code Setup

### Folder Structure

```
bizvaani/
├── frontend/                      # Next.js 14.2.x
│   ├── public/
│   │   └── icons/                 # PWA icons
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx         # Root layout, fonts, metadata
│   │   │   ├── page.tsx           # Landing page
│   │   │   ├── onboard/
│   │   │   │   └── page.tsx       # Registration flow
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx       # Main dashboard
│   │   │   ├── alerts/
│   │   │   │   └── page.tsx       # Risk alerts list
│   │   │   ├── forecast/
│   │   │   │   └── page.tsx       # 7/30-day charts
│   │   │   ├── inventory/
│   │   │   │   └── page.tsx       # Stock management
│   │   │   ├── invoice/
│   │   │   │   ├── page.tsx       # Invoice generator
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx   # Public invoice view
│   │   │   └── settings/
│   │   │       └── page.tsx       # Profile + CSV upload
│   │   ├── components/
│   │   │   ├── ui/                # shadcn/ui primitives
│   │   │   ├── MicFAB.tsx         # Floating mic button
│   │   │   ├── VoiceModal.tsx     # Voice interaction overlay
│   │   │   ├── BottomNav.tsx      # Mobile bottom navigation
│   │   │   ├── AlertCard.tsx      # Risk alert card
│   │   │   ├── ProductCard.tsx    # Dashboard product card
│   │   │   ├── ImpactCard.tsx     # ₹ impact simulation card
│   │   │   ├── ForecastChart.tsx  # Recharts line chart
│   │   │   └── InvoicePreview.tsx # Invoice PDF preview
│   │   ├── store/
│   │   │   ├── useVoiceStore.ts   # Zustand: voice state
│   │   │   └── useShopStore.ts    # Zustand: shop + dashboard data
│   │   ├── lib/
│   │   │   ├── api.ts             # Axios/fetch wrappers
│   │   │   ├── ws.ts              # WebSocket manager
│   │   │   └── mockData.ts        # <-- ALL MOCK DATA HERE
│   │   └── styles/
│   │       └── globals.css
│   ├── tailwind.config.ts
│   ├── next.config.js
│   └── package.json
│
├── backend/                       # FastAPI 0.111.x
│   ├── main.py                    # App entry, CORS, lifespan
│   ├── api/
│   │   ├── auth.py                # /api/auth/register, /api/auth/login
│   │   ├── voice.py               # /api/voice/query, /api/voice/stt, /api/voice/tts
│   │   ├── sales.py               # /api/sales/entry
│   │   ├── dashboard.py           # /api/dashboard
│   │   ├── forecast.py            # /api/forecast/{product_id}
│   │   ├── market.py              # /api/market/prices
│   │   ├── invoice.py             # /api/invoice/generate, /api/invoice/{id}/pdf
│   │   ├── simulate.py            # /api/simulate
│   │   └── settings.py            # /api/settings/csv, /api/settings/csv/confirm
│   ├── agent/
│   │   ├── graph.py               # LangGraph state machine
│   │   ├── nodes.py               # Individual agent nodes
│   │   └── state.py               # ShopState TypedDict
│   ├── ml/
│   │   ├── forecaster.py          # XGBoost training + prediction
│   │   ├── risk_detector.py       # Anomaly detection
│   │   └── profit_simulator.py    # Price elasticity simulation
│   ├── db/
│   │   ├── database.py            # SQLAlchemy engine + session
│   │   ├── models.py              # ORM models (7 tables)
│   │   ├── seed.py                # Benchmark data seeder
│   │   └── demo_preload.py        # Pre-load demo shop data
│   ├── scheduler/
│   │   └── jobs.py                # APScheduler: agmarknet, tavily, alerts
│   ├── ws/
│   │   ├── voice_handler.py       # WS /ws/voice/{shop_id}
│   │   └── dashboard_handler.py   # WS /ws/dashboard/{shop_id}
│   ├── requirements.txt
│   └── .env.example
│
├── docs/                          # All documentation
│   └── PLAN-bizvaani-hackathon.md # THIS FILE
└── README.md
```

### API Contract (Mock-Ready)

Every endpoint below has a **mock response** in `frontend/src/lib/mockData.ts`. Teammates build UI against mocks; the advanced member builds real APIs that return the same shape.

#### Auth

```
POST /api/auth/register
  Request:  { phone, name, password, city, state, language, shop_name, categories[] }
  Response: { access_token, user: { id, name, city }, shop: { id, shop_name } }

POST /api/auth/login
  Request:  { phone, password }
  Response: { access_token, user: { id, name, city }, shop: { id, shop_name } }
```

#### Dashboard

```
GET /api/dashboard
  Headers:  Authorization: Bearer <token>
  Response: {
    shop: { id, shop_name, city, categories },
    top_products: [
      { id, name, today_qty, today_revenue, trend_pct, mandi_price, risk_level }
    ],
    alerts: [
      { id, product_name, severity, message, created_at }
    ],
    total_today: { revenue, items_sold, profit_estimate }
  }
```

#### Forecast

```
GET /api/forecast/{product_id}
  Response: {
    product_name: "Rice",
    forecast_7d: [ { date, predicted_qty, lower_bound, upper_bound } ],
    forecast_30d: [ { date, predicted_qty } ],
    is_anomaly: false,
    anomaly_pct: -5.2
  }
```

#### Market Prices

```
GET /api/market/prices
  Response: {
    city: "Nagpur",
    prices: [
      { commodity: "Rice", price: 39.5, unit: "kg", source: "agmarknet", updated_at }
    ]
  }
```

#### Profit Simulation

```
POST /api/simulate
  Request:  { shop_id, product_id, action, current_price, suggested_price, avg_daily_qty }
  Response: { current_profit, projected_profit, delta, pct_change, payback_days, summary }
```

#### Invoice

```
POST /api/invoice/generate
  Request:  { shop_id, customer_name, items: [{ product, qty, unit_price, gst_rate }] }
  Response: { invoice_id, pdf_url, total, gst_breakup }

GET /api/invoice/{id}/pdf
  Response: PDF file (binary)
```

#### Voice

```
POST /api/voice/query
  Request:  { shop_id, transcript }
  Response: SSE stream of { type: "why"|"what"|"impact", content }

WS /ws/voice/{shop_id}
  Client→Server: { type: "audio_chunk", data: <binary> }
  Server→Client: { type: "transcript", text }
                  { type: "tts_chunk", data: <binary> }
                  { type: "filler", data: <binary> }
                  { type: "response_card", why_text, what_text, rupees_impact }
```

#### Settings / CSV

```
POST /api/settings/csv
  Request:  multipart/form-data (file)
  Response: { preview_rows: [...], detected_columns: { date, product, qty, price }, row_count }

POST /api/settings/csv/confirm
  Request:  { column_mapping: { date, product, qty, price }, file_id }
  Response: { imported_count, ml_retrain_triggered: true }
```

---

## 3. Task Division (5 Parallel Tasks)

> **Documentation Reference Notice:**
> If any team member needs deeper context on *how* a feature should look or behave beyond these high-level steps, refer to the root project documentation files:
> - User journeys & logic: `APP_FLOW.md`
> - UI/UX standards & tokens: `FRONTEND_GUIDELINES.md`
> - High-level goals: `PRD (1).md`
> - Complete technical specs: `BizVaani_Developer_Reference.md`
> - Database schema & APIs: `BACKEND_STRUCTURE.md`
> - Libraries & versions: `TECH_STACK (1).md`

---

### TASK 1 — Advanced Member (Pankaj)
**Role:** Architect, Backend, AI, Integration Lead

#### Objective
Build the entire backend: FastAPI server, database, LangGraph agent, ML engine, WebSocket handlers, and all API endpoints. Own the integration of all 4 other members' work.

#### Files Owned
```
backend/**  (entire backend directory)
```

#### Step-by-Step

| Hour | Action | Deliverable |
|------|--------|-------------|
| 0–1 | Set up FastAPI skeleton, SQLAlchemy models, Alembic, `.env` | Server boots, DB created |
| 1–2 | Implement `db/seed.py` + `demo_preload.py` | Demo shop with 30 days synthetic data |
| 2–4 | Build `api/auth.py`, `api/dashboard.py`, `api/sales.py` | Core REST endpoints live |
| 4–6 | Build LangGraph agent (`agent/graph.py`, `nodes.py`, `state.py`) | Agent answers queries |
| 6–8 | Wire Sarvam STT/TTS + Groq via `ws/voice_handler.py` | Voice pipeline works end-to-end |
| 8–10 | Build `ml/forecaster.py` + `ml/risk_detector.py` | XGBoost predictions working |
| 10–12 | Build `api/forecast.py`, `api/market.py`, `api/simulate.py`, `api/invoice.py` | All REST endpoints complete |
| 12–14 | Build `scheduler/jobs.py` (Agmarknet + Tavily refresh) | Background jobs running |
| 14–16 | Wire `ws/dashboard_handler.py` for live alerts | Dashboard push working |
| 16–18 | Build `api/settings.py` (CSV upload post-onboarding) | CSV flow works |
| 18–24 | Integration: connect frontend to real APIs, fix bugs, polish | Everything connected |
| 24–36 | Demo prep: hardcode fallbacks, optimize latency, rehearse | Demo-ready |

#### Definition of Done
- [ ] `uvicorn main:app` starts without errors
- [ ] All 12 REST endpoints return correct JSON
- [ ] WebSocket voice pipeline: speak → hear response in <2s
- [ ] Demo shop has pre-loaded data with visible charts
- [ ] CSV upload from Settings page works

---

### TASK 2 — Member B (Beginner)
**Feature:** Landing Page + Onboarding Flow

#### Objective
Build the first screens a user sees: the landing page with hero CTA, and the 2-step onboarding form (shop info → data path selection).

#### Files Owned
```
frontend/src/app/page.tsx              # Landing page
frontend/src/app/onboard/page.tsx      # Onboarding steps
frontend/src/components/ui/Button.tsx   # Reusable button (if not using shadcn)
```

#### Mock Data Available
```ts
// frontend/src/lib/mockData.ts
export const MOCK_REGISTER_RESPONSE = {
  access_token: "eyJ...",
  user: { id: 1, name: "Ramesh Kumar", city: "Nagpur" },
  shop: { id: 1, shop_name: "Ramesh Kirana Store" }
};
```

#### Step-by-Step Instructions

1. **Landing Page (`page.tsx`)**
   - Full-screen gradient background (saffron `#f97316` → white)
   - BizVaani logo (text or SVG) centered
   - Tagline: "Your AI Business Coach" — large text
   - One big CTA button: "Get Started" → navigates to `/onboard`
   - Optional: Animate the CTA with a subtle pulse

2. **Onboard Step 1 (`/onboard`)**
   - Form fields: Name, Phone, Password, Shop Name, City (dropdown), Category (multi-select from: Grains, Dairy, FMCG, Vegetables, General)
   - Language selector (Hindi / English / Telugu)
   - "Next" button → shows Step 2

3. **Onboard Step 2 (same page, conditional render)**
   - Show 3 cards:
     - 📷 "Upload Bill Photo (OCR)"
     - 📊 "Start with Industry Averages" (recommended — highlight this)
     - 🎙️ "I'll Tell Daily by Voice"
   - User picks one → call `POST /api/auth/register` (use mock initially) → redirect to `/dashboard`

4. **Styling Rules**
   - Mobile-first (max-width 480px container)
   - Use design tokens from `FRONTEND_GUIDELINES.md` (saffron primary, 16px min font)
   - All text in English

#### Definition of Done
- [ ] Landing page loads with logo + CTA
- [ ] CTA navigates to `/onboard`
- [ ] Onboard form collects all fields
- [ ] Step 2 shows 3 data path cards
- [ ] Selecting a card + submitting redirects to `/dashboard`
- [ ] Works on mobile viewport (360px wide)

---

### TASK 3 — Member C (Beginner)
**Feature:** Dashboard + Product Cards + Alert Cards

#### Objective
Build the main dashboard screen that shows top products, risk alerts, and daily summary stats.

#### Files Owned
```
frontend/src/app/dashboard/page.tsx
frontend/src/components/ProductCard.tsx
frontend/src/components/AlertCard.tsx
frontend/src/components/BottomNav.tsx
```

#### Mock Data Available
```ts
// frontend/src/lib/mockData.ts
export const MOCK_DASHBOARD = {
  shop: { id: 1, shop_name: "Ramesh Kirana Store", city: "Nagpur", categories: ["grains", "fmcg"] },
  top_products: [
    { id: 1, name: "Rice", today_qty: 30, today_revenue: 1350, trend_pct: -12, mandi_price: 39.5, risk_level: "HIGH" },
    { id: 2, name: "Dal", today_qty: 15, today_revenue: 1200, trend_pct: 5, mandi_price: 72, risk_level: "LOW" },
    { id: 3, name: "Sugar", today_qty: 20, today_revenue: 860, trend_pct: -3, mandi_price: 42, risk_level: "MEDIUM" },
    { id: 4, name: "Cooking Oil", today_qty: 10, today_revenue: 1500, trend_pct: 8, mandi_price: 145, risk_level: "LOW" },
    { id: 5, name: "Atta", today_qty: 25, today_revenue: 925, trend_pct: -18, mandi_price: 35, risk_level: "HIGH" }
  ],
  alerts: [
    { id: 1, product_name: "Rice", severity: "HIGH", message: "Sales dropped 22% — competitor undercut by ₹2", created_at: "2026-03-27T06:00:00" },
    { id: 2, product_name: "Atta", severity: "MEDIUM", message: "Restock needed in 4 days based on forecast", created_at: "2026-03-27T06:00:00" }
  ],
  total_today: { revenue: 5835, items_sold: 100, profit_estimate: 1420 }
};
```

#### Step-by-Step Instructions

1. **Dashboard Layout**
   - Header: "Good morning, Ramesh" + shop name
   - 3-stat row at top: Total Revenue (₹5,835), Items Sold (100), Est. Profit (₹1,420) — use animated number counters
   - Product Cards section: 5 cards in a vertical list/grid
   - Alert Cards section: show any HIGH/MEDIUM alerts above product cards

2. **ProductCard Component**
   - Product name (bold)
   - Today's revenue (large ₹ number)
   - Trend badge: green ↑ or red ↓ with percentage
   - Mandi price in small text: "Mandi: ₹39.5/kg"
   - Risk level dot (🔴 HIGH, 🟡 MEDIUM, 🟢 LOW)

3. **AlertCard Component**
   - Red/orange left border based on severity
   - Alert icon + product name + message
   - "Ask BizVaani" button (just logs to console for now)

4. **BottomNav Component**
   - Fixed bottom bar with 4 icons: Home, Alerts, Stock, Invoice
   - Highlight active page
   - Leave space for the MicFAB (centered, above the nav)

#### Definition of Done
- [ ] Dashboard renders with all 5 product cards from mock data
- [ ] Alert cards show with correct severity colors
- [ ] Stats row shows 3 numbers
- [ ] BottomNav is fixed at bottom, 4 tabs work
- [ ] Responsive on mobile (360px)

---

### TASK 4 — Member D (Beginner/Intermediate)
**Feature:** Forecast Charts + Profit Simulator + Invoice Page

#### Objective
Build the data visualization screens: 7-day forecast line chart, profit impact simulator, and GST invoice generator with PDF download.

#### Files Owned
```
frontend/src/app/forecast/page.tsx
frontend/src/app/invoice/page.tsx
frontend/src/app/invoice/[id]/page.tsx
frontend/src/components/ForecastChart.tsx
frontend/src/components/ImpactCard.tsx
frontend/src/components/InvoicePreview.tsx
```

#### Mock Data Available
```ts
// frontend/src/lib/mockData.ts
export const MOCK_FORECAST = {
  product_name: "Rice",
  forecast_7d: [
    { date: "2026-03-28", predicted_qty: 28, lower_bound: 22, upper_bound: 34 },
    { date: "2026-03-29", predicted_qty: 31, lower_bound: 25, upper_bound: 37 },
    { date: "2026-03-30", predicted_qty: 26, lower_bound: 20, upper_bound: 32 },
    { date: "2026-03-31", predicted_qty: 33, lower_bound: 27, upper_bound: 39 },
    { date: "2026-04-01", predicted_qty: 29, lower_bound: 23, upper_bound: 35 },
    { date: "2026-04-02", predicted_qty: 35, lower_bound: 29, upper_bound: 41 },
    { date: "2026-04-03", predicted_qty: 30, lower_bound: 24, upper_bound: 36 }
  ],
  is_anomaly: false,
  anomaly_pct: -5.2
};

export const MOCK_SIMULATE = {
  current_profit: 3200,
  projected_profit: 4580,
  delta: 1380,
  pct_change: 43.1,
  payback_days: 3,
  summary: "Reduce price by ₹3. Expected ₹1,380 extra profit in 7 days."
};

export const MOCK_INVOICE = {
  invoice_id: "INV-001",
  pdf_url: "/api/invoice/1/pdf",
  total: 2047.5,
  gst_breakup: { cgst: 48.75, sgst: 48.75 }
};
```

#### Step-by-Step Instructions

1. **Forecast Page**
   - Product selector dropdown at top (Rice, Dal, Sugar, etc.)
   - Line chart using **Recharts**: X = date, Y = predicted_qty
   - Show confidence band (lower_bound → upper_bound) as a shaded area
   - Color: saffron line, light saffron fill for confidence
   - Below chart: anomaly indicator if `is_anomaly` is true

2. **Profit Simulator (on Forecast page or Dashboard)**
   - Input fields: Current Price, Suggested Price
   - "Simulate" button → calls `POST /api/simulate` (use mock)
   - ImpactCard: big green ₹ number with count-up animation
   - Before/after bar chart (2 bars: current vs projected profit)
   - Summary text below

3. **Invoice Page**
   - Form: Customer Name, Product, Qty, Unit Price, GST Rate (5%/12%/18%)
   - "Add Item" button for multiple line items
   - "Generate Invoice" button → calls API (use mock)
   - InvoicePreview: renders a styled invoice card with:
     - Shop name, date, invoice number
     - Line items table
     - GST breakup (CGST + SGST)
     - Total in large font
   - "Download PDF" button (link to `pdf_url`)

4. **Public Invoice View (`/invoice/[id]`)**
   - Read-only version of InvoicePreview
   - No auth required
   - Download button

#### Definition of Done
- [ ] Forecast chart renders 7-day line with confidence band
- [ ] Product dropdown switches data (use mock array)
- [ ] Profit Simulator shows ₹ impact with animation
- [ ] Invoice form accepts items, generates preview
- [ ] "Download PDF" link works (can point to mock URL)
- [ ] `/invoice/1` renders public view

---

### TASK 5 — Member E (Beginner)
**Feature:** Voice UI (Mic Button + Voice Modal) + Settings Page

#### Objective
Build the floating mic button, the voice interaction overlay with waveform animation, and the Settings page (including CSV upload UI).

#### Files Owned
```
frontend/src/components/MicFAB.tsx
frontend/src/components/VoiceModal.tsx
frontend/src/app/settings/page.tsx
frontend/src/app/alerts/page.tsx
frontend/src/store/useVoiceStore.ts
```

#### Mock Data Available
```ts
// frontend/src/lib/mockData.ts
export const MOCK_VOICE_RESPONSE = {
  transcript: "Why is my rice sales dropping?",
  why_text: "Your competitor reduced rice price by ₹2/kg three days ago. Customers are price-sensitive for staples.",
  what_text: "Offer a combo deal: 5kg Rice + 1kg Dal at ₹275. This undercuts competitor while protecting margin.",
  rupees_impact: 1400
};

export const MOCK_CSV_PREVIEW = {
  preview_rows: [
    { date: "2026-03-01", product: "Rice", qty: 30, price: 45 },
    { date: "2026-03-01", product: "Dal", qty: 15, price: 80 },
    { date: "2026-03-02", product: "Rice", qty: 28, price: 45 }
  ],
  detected_columns: { date: "Date", product: "Product", qty: "Quantity", price: "Price" },
  row_count: 90
};
```

#### Step-by-Step Instructions

1. **MicFAB Component**
   - Floating saffron circle, fixed bottom-center, above BottomNav
   - Idle: mic icon, subtle shadow
   - Active (listening): pulse animation (orange glow ring expanding)
   - On tap: opens VoiceModal

2. **VoiceModal Component**
   - Full-screen overlay with dark backdrop
   - Top: waveform visualization (use simple CSS bars that animate randomly — or `wavesurfer.js` if comfortable)
   - Middle: transcript text appearing in real-time (simulate with setTimeout for mock)
   - Bottom: Response card with 3 sections:
     - **WHY** (red label) — root cause text
     - **WHAT** (blue label) — recommended action
     - **₹ IMPACT** — big green counter (use `react-countup` or simple animation)
   - Close button (X) at top-right

3. **useVoiceStore (Zustand)**
   ```ts
   interface VoiceState {
     isListening: boolean;
     isProcessing: boolean;
     transcript: string;
     response: { why_text: string; what_text: string; rupees_impact: number } | null;
     startListening: () => void;
     stopListening: () => void;
     setResponse: (r: VoiceState['response']) => void;
     reset: () => void;
   }
   ```

4. **Settings Page**
   - Shop profile section (Name, City — read-only display)
   - Language preference toggle
   - "Upload Old Records (CSV/Excel)" section:
     - Drag-and-drop zone or file picker
     - On file select → show preview table (use mock)
     - "Confirm Import" button
   - GSTIN input field

5. **Alerts Page (`/alerts`)**
   - Full list of alerts (reuse AlertCard from Task 3)
   - Filter by severity (All / High / Medium)
   - Each alert has "Ask BizVaani" button → opens VoiceModal

#### Definition of Done
- [ ] MicFAB renders and pulses on tap
- [ ] VoiceModal opens with simulated transcript + response card
- [ ] ₹ Impact shows animated counter
- [ ] Settings page shows profile + CSV upload zone
- [ ] CSV upload shows preview table with mock data
- [ ] Alerts page lists alerts with severity filter

---

## 4. Parallel Development Strategy

### How All 5 Start Simultaneously

```
HOUR 0 (Advanced member sets up):
  1. Creates Git repo with folder structure
  2. Runs `npx create-next-app` for frontend
  3. Creates `mockData.ts` with ALL mock responses above
  4. Pushes to main branch
  5. Other 4 members clone + create feature branches

HOUR 0.5 (All 5 working in parallel):
  Member B → feature/landing-onboard     (Landing + Onboard)
  Member C → feature/dashboard-cards      (Dashboard + Cards)
  Member D → feature/forecast-invoice     (Charts + Invoice)
  Member E → feature/voice-settings       (Voice UI + Settings)
  Advanced → feature/backend-core         (Entire backend)
```

### Mock Data Strategy

**Rule: Frontend NEVER imports from backend.** Instead:

```ts
// frontend/src/lib/api.ts
const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === 'true';

export async function getDashboard() {
  if (USE_MOCKS) return MOCK_DASHBOARD;
  const res = await fetch('/api/dashboard', { headers: authHeaders() });
  return res.json();
}
```

- Set `NEXT_PUBLIC_USE_MOCKS=true` in `.env.local` during development
- Flip to `false` when backend is ready (Hour 18+)
- Mock data shapes EXACTLY match real API responses (defined above)

### Avoiding Dependencies

| Member | Depends On | Solution |
|--------|-----------|----------|
| B (Landing) | Nothing | Fully independent |
| C (Dashboard) | Mock data | `mockData.ts` provided by Advanced on Hour 0 |
| D (Charts) | Mock data | Same `mockData.ts` |
| E (Voice) | Mock data | Same `mockData.ts` |
| Advanced | Nothing | Builds backend independently |

**Zero blocking dependencies.** Everyone starts immediately.

---

## 5. Merge & Integration Strategy

### Branch Strategy

```
main                      ← Always demo-ready (protected)
  └── dev                 ← Integration branch
       ├── feature/landing-onboard      (Member B)
       ├── feature/dashboard-cards      (Member C)
       ├── feature/forecast-invoice     (Member D)
       ├── feature/voice-settings       (Member E)
       └── feature/backend-core         (Advanced)
```

### Merge Checkpoints (4 Total)

#### Checkpoint 1 — Hour 6: "Screens Exist"
```
All 4 frontend branches → merge into dev
Criteria: Every page renders (can use mock data), no crashes
Advanced: Verify dev branch runs with `npm run dev`
```

#### Checkpoint 2 — Hour 12: "UI Complete with Mocks"
```
All 4 frontend branches → merge into dev
Criteria: All components styled, mock data displaying correctly
Advanced: Backend APIs partially ready, merge backend into dev
```

#### Checkpoint 3 — Hour 18: "Backend Connected"
```
Advanced flips NEXT_PUBLIC_USE_MOCKS=false
Test: Every page works with real API data
Fix: Any JSON shape mismatches between mock ↔ real
```

#### Checkpoint 4 — Hour 24: "Demo Lock"
```
dev → merge into main (demo branch)
Criteria: Full flow works end-to-end
After this: ONLY bug fixes, no new features
```

### Mock → Real API Switchover (Hour 18)

```ts
// The ONLY change needed:
// .env.local
NEXT_PUBLIC_USE_MOCKS=false    // was 'true'
NEXT_PUBLIC_API_URL=http://localhost:8000

// api.ts already handles both paths — zero code changes in components
```

### Merge Conflict Prevention Rules

1. **Each member owns separate files** — no two people edit the same file
2. **Shared files are read-only:** `mockData.ts`, `globals.css`, `layout.tsx` — only Advanced edits these
3. **Components import from `mockData.ts`** via `api.ts` — never directly
4. **Pull from `dev` before pushing** — `git pull origin dev --rebase`

### Post-Merge Testing Checklist

After every merge:
- [ ] `npm run dev` starts without errors
- [ ] Landing → Onboard → Dashboard flow works
- [ ] Dashboard shows products and alerts
- [ ] Forecast chart renders
- [ ] Voice modal opens and closes
- [ ] No console errors in browser

---

## 6. Role Assignment

| Member | Role | Primary Tasks | Skills Needed |
|--------|------|---------------|---------------|
| **Advanced (Pankaj)** | Architect + Backend + AI + Integration | FastAPI, SQLite, LangGraph, Sarvam/Groq integration, all API endpoints, Git management | Python, FastAPI, LangGraph, XGBoost |
| **Member B** | Landing + Onboarding UI | Landing page, registration form, onboarding flow | HTML/CSS, basic React/Next.js |
| **Member C** | Dashboard + Cards UI | Dashboard layout, ProductCard, AlertCard, BottomNav | React components, CSS flexbox/grid |
| **Member D** | Charts + Invoice UI | Recharts line chart, profit simulator, invoice form/preview | React, Recharts library, forms |
| **Member E** | Voice UI + Settings | MicFAB, VoiceModal, waveform animation, Settings page, Alerts page | React, CSS animations, Zustand basics |

### Advanced Member's Extra Responsibilities
- Create initial repo + folder structure + `mockData.ts` (Hour 0)
- Review and merge all PRs
- Fix integration bugs during Checkpoints 3 & 4
- Own the demo script and fallback strategies
- Be available on Slack/Discord for any blocker questions

---

## 7. Timeline (36-Hour Plan)

### Phase 1: Setup (Hours 0–1)

| Duration | Task | Owner | Deliverable |
|----------|------|-------|-------------|
| 30 min | Create repo, Next.js app, folder structure, `mockData.ts` | Advanced | Cloneable repo |
| 30 min | Everyone clones, creates feature branch, runs `npm run dev` | All | Dev environment working |

**Merge Checkpoint: None (just verify everyone can run the app)**

---

### Phase 2: Parallel Development (Hours 1–12)

| Duration | Task | Owner |
|----------|------|-------|
| Hours 1–6 | Landing page + Onboarding form | Member B |
| Hours 1–6 | Dashboard layout + ProductCard + AlertCard + BottomNav | Member C |
| Hours 1–8 | Forecast chart + Profit simulator + Invoice form | Member D |
| Hours 1–8 | MicFAB + VoiceModal + Settings page + Alerts page | Member E |
| Hours 1–12 | Backend: DB, Auth, Dashboard API, LangGraph, Voice WS | Advanced |

**Merge Checkpoint 1 (Hour 6):** All screens exist, render without crash
**Merge Checkpoint 2 (Hour 12):** UI complete with mock data, styled

---

### Phase 3: Integration (Hours 12–24)

| Duration | Task | Owner |
|----------|------|-------|
| Hours 12–14 | Fix merge conflicts, stabilize `dev` branch | Advanced |
| Hours 14–16 | Members polish their own UI based on Advanced's review | B, C, D, E |
| Hours 16–18 | Backend APIs complete, switch `USE_MOCKS=false` | Advanced |
| Hours 18–20 | Test all pages with real API data, fix mismatches | All |
| Hours 20–22 | WebSocket voice pipeline integration test | Advanced + E |
| Hours 22–24 | End-to-end flow test: Onboard → Dashboard → Voice → Invoice | All |

**Merge Checkpoint 3 (Hour 18):** Backend connected
**Merge Checkpoint 4 (Hour 24):** Demo lock — `dev` → `main`

---

### Phase 4: Demo Preparation (Hours 24–36)

| Duration | Task | Owner |
|----------|------|-------|
| Hours 24–26 | Run `demo_preload.py` — pre-load demo shop with rich data | Advanced |
| Hours 26–28 | Polish: loading states, error messages, animations | B, C, D, E |
| Hours 28–30 | Demo script rehearsal #1 (timed, 3 minutes) | All watch, Advanced drives |
| Hours 30–32 | Fix any issues found during rehearsal | Assigned per issue |
| Hours 32–34 | Demo rehearsal #2 + fallback testing (kill backend, test mocks) | All |
| Hours 34–36 | Final deploy to Railway, last rehearsal, buffer time | Advanced |

---

## 8. Demo-First Optimization

### The 3-Minute Demo Script

| Time | Action | What Audience Sees |
|------|--------|--------------------|
| 0:00–0:45 | "63M kiranas run on paper. BizVaani fixes that." Register new shop live. Dashboard loads instantly with benchmark data + Agmarknet prices. | Full dashboard with charts, products, market prices — from zero input |
| 0:45–1:45 | Risk alert glows red. Tap mic: "Why is my rice showing high risk?" AI responds with market context + ₹ impact. | Voice interaction, WHY/WHAT/₹ response card, animated counter |
| 1:45–2:30 | Tap "Simulate Profit" → before/after chart. Say: "Generate invoice for Sharma, 50kg rice." PDF generates. | Profit simulator, auto-generated GST invoice |
| 2:30–3:00 | Flash architecture diagram. Explain LangGraph + parallel nodes + B2B data monetization model. | Tech credibility + business model |

### Fallback Strategies

| Failure | Fallback | Implementation |
|---------|----------|----------------|
| **Sarvam STT fails** | Pre-recorded audio → hardcoded transcript | Store 3 demo transcripts in `mockData.ts`; VoiceModal detects failure and uses mock |
| **Groq LLM fails** | Pre-computed responses for 3 demo queries | Store in `mockData.ts`; `api.ts` falls back if `fetch` throws |
| **Agmarknet API down** | Cached prices from last successful fetch | SQLite cache; show "Last updated: 2h ago" label |
| **Backend crashes entirely** | Flip `USE_MOCKS=true` | One env var change; entire frontend works on mocks |
| **Wi-Fi dies** | Run everything locally (SQLite + localhost) | Backend on `localhost:8000`, frontend on `localhost:3000` |

### Pre-Demo Checklist

```
[ ] Demo shop "Ramesh Kirana Store" exists in DB with 30 days data
[ ] 5 products have forecast data and at least 1 HIGH risk alert
[ ] Agmarknet prices cached for Nagpur
[ ] 3 filler audio blobs pre-recorded and loaded
[ ] Invoice PDF generation tested
[ ] Mobile viewport tested (360px Chrome DevTools)
[ ] USE_MOCKS=false verified with real backend
[ ] USE_MOCKS=true verified as fallback (backend off)
[ ] 3-minute timer rehearsal completed at least twice
```

### Performance Targets

| Metric | Target | How |
|--------|--------|-----|
| Dashboard load | <1s | Pre-computed aggregates in SQLite |
| Voice response (first word) | <1.5s | Streaming assembly line + filler word |
| Chart render | <500ms | Recharts with pre-fetched data |
| Invoice PDF | <2s | ReportLab, single-page template |

---

## Phase X: Verification Checklist

- [ ] All 12 REST endpoints return correct JSON shapes
- [ ] WebSocket voice pipeline: speak → hear response
- [ ] Dashboard loads with real data from SQLite
- [ ] Forecast chart renders 7-day prediction with confidence band
- [ ] Risk alert triggers when `actual/forecast < 0.80`
- [ ] Invoice PDF generates and downloads
- [ ] CSV upload (Settings page) imports data and triggers ML retrain
- [ ] Landing → Onboard → Dashboard flow works end-to-end
- [ ] Mock fallback works when backend is off
- [ ] Mobile responsive (360px) — no horizontal scroll
- [ ] No console errors in browser
- [ ] Demo script rehearsed ≥ 2 times under 3 minutes
