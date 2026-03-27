# BizVaani — Developer Reference
> Voice-First AI Business Coach for Kirana Owners  
> Everything a developer needs before writing a single line of code.

---

## Table of Contents
1. [What We Are Building](#1-what-we-are-building)
2. [System Architecture](#2-system-architecture)
3. [Tech Stack](#3-tech-stack)
4. [Database Schema](#4-database-schema)
5. [App Flow](#5-app-flow)
6. [API Reference](#6-api-reference)
7. [ML Engine](#7-ml-engine)
8. [Agent Design (LangGraph)](#8-agent-design-langgraph)
9. [Competitor Intelligence Engine](#9-competitor-intelligence-engine)
10. [Latency Optimization](#10-latency-optimization)
11. [Cold Start Strategy](#11-cold-start-strategy)
12. [Frontend Architecture](#12-frontend-architecture)
13. [Environment Setup](#13-environment-setup)
14. [Folder Structure](#14-folder-structure)
15. [Build Order (36 Hours)](#15-build-order-36-hours)
16. [Demo Script](#16-demo-script)
17. [Non-Negotiable Rules](#17-non-negotiable-rules)

---

## 1. What We Are Building

BizVaani is a voice-first AI business coach for Indian kirana and small retail store owners.
The owner speaks in Hindi, Telugu, or English.
The system understands, fetches live market context, runs ML forecasting, and responds with a short, specific recommendation — also spoken back.

### Core Capabilities
- Voice sales entry ("I sold 30 kg of rice at 43 rupees today")
- Business Q&A ("Why is my rice sales dropping?")
- Market-aware pricing suggestions using Agmarknet + Tavily
- ML-based 7-day and 30-day demand forecasting
- Profit impact simulation ("If I reduce by ₹2, how much will I earn?")
- GST invoice generation by voice
- Real-time risk alerts dashboard
- Works from Day 1 even with zero historical data

### What It Is Not
- Not a full ERP
- Not a GST filing tool
- Not a multi-branch inventory system
- Not a complex accounting platform

---

## 2. System Architecture

### Full Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                        USER (Mobile Browser)                         │
│              Voice (Hindi/Telugu/English)  or  Text                  │
└────────────────────────────┬─────────────────────────────────────────┘
                             │ WebSocket (audio stream)
                             ▼
┌──────────────────────────────────────────────────────────────────────┐
│                       NEXT.JS FRONTEND                               │
│  Pages: Onboarding · Dashboard · Voice UI · Invoice                  │
│  Hooks: useVoiceCapture · useDashboardSocket                         │
│  Charts: Recharts (sales trends, profit simulator)                   │
│  Light API routes: /api/simulate · /api/alerts                       │
└────────────────────────────┬─────────────────────────────────────────┘
                             │ REST + WebSocket
                             ▼
┌──────────────────────────────────────────────────────────────────────┐
│                       FASTAPI BACKEND                                │
│                                                                      │
│  /ws/voice/{shop_id}     ← voice pipeline WebSocket                  │
│  /ws/dashboard/{shop_id} ← live alerts push WebSocket                │
│  REST: /register /upload-sales /forecast /invoice /simulate          │
└──────┬──────────────────────┬──────────────────────┬─────────────────┘
       │                      │                      │
       ▼                      ▼                      ▼
┌─────────────┐   ┌─────────────────────┐   ┌──────────────────────┐
│  SARVAM AI  │   │   LANGGRAPH AGENT   │   │    ML ENGINE         │
│             │   │                     │   │                      │
│  STT:       │   │  Node 1: classify   │   │  Scikit-learn        │
│  Saarika v2 │   │  Node 2a: sales     │   │  XGBoost/Ridge       │
│             │   │  Node 2b: price ◄───┼───┼─ price_cache.py      │
│  TTS:       │   │  (2a + 2b parallel) │   │  Risk rules engine   │
│  Bulbul v2  │   │  Node 3: recommend  │   │  APScheduler         │
└─────────────┘   └──────────┬──────────┘   └──────────────────────┘
                             │
                ┌────────────┼────────────┐
                ▼            ▼            ▼
         ┌──────────┐  ┌──────────┐  ┌──────────────────┐
         │  GROQ    │  │  SQLITE  │  │  TAVILY CACHE    │
         │  LLaMA3  │  │  DB      │  │  (background)    │
         │  70B     │  │          │  │  + Agmarknet API │
         │  276t/s  │  │  users   │  │  fallback        │
         └──────────┘  │  shops   │  └──────────────────┘
                       │  products│
                       │  sales   │
                       │  forecasts│
                       │  invoices │
                       └──────────┘
```

### Request Lifecycle (Voice Query)

```
1.  Owner taps mic → browser streams audio via WebSocket
2.  Sarvam STT transcribes → "Why is my rice sales dropping?"
3.  LangGraph classifies intent → "both" (needs sales + price)
4.  Node 2a fetches sales summary from SQLite (parallel)
4.  Node 2b fetches market price from cache (parallel, ~0ms)
5.  Both results merge into Node 3
6.  Groq LLaMA3 streams response token by token
7.  First sentence complete → Sarvam TTS fires immediately
8.  User hears audio at ~1.4s from mic release
9.  React dashboard updates via second WebSocket
```

---

## 3. Tech Stack

### Frontend
| Tool | Version | Purpose |
|------|---------|---------| 
| Next.js | 14.2.x | App framework, App Router, API routes |
| Tailwind CSS | 3.4.x | Styling |
| shadcn/ui | latest | Radix UI primitives, accessible components |
| Recharts | 2.12.x | Sales trend charts, profit simulator bars |
| Zustand | 4.5.x | Voice state + shop data state management |
| Axios | 1.7.x | REST API calls with JWT interceptors |
| wavesurfer.js | 7.x | Mic amplitude waveform visualization |
| React Hot Toast | 2.x | Alert notifications |
| WebSocket (native) | — | Real-time voice + dashboard |
| Web Audio API (native) | — | Mic capture + streamed TTS playback |

### Backend
| Tool | Version | Purpose |
|------|---------|---------| 
| Python | 3.11+ | Core language |
| FastAPI | 0.111.x | REST + WebSocket server |
| Uvicorn | 0.30.x | ASGI server |
| SQLAlchemy | 2.0.x | Async ORM for SQLite |
| Alembic | 1.13.x | DB migrations |
| Pandas | 2.2.x | CSV ingestion, data cleaning |
| APScheduler | 3.10.x | Background jobs (price refresh, ML retrain) |
| cachetools | 5.3.x | In-memory TTLCache for prices + TTS |
| ReportLab | 4.1.x | GST invoice PDF generation |
| python-dotenv | 1.0.x | Environment config |
| httpx | 0.27.x | Async HTTP (Sarvam API calls) |

### AI / Agent Layer
| Tool | Purpose |
|------|---------|
| LangGraph 0.2+ | Stateful agent with parallel fan-out nodes |
| langchain-groq | Groq LLM integration |
| langchain-tavily | Web search tool for market intelligence |
| Groq (LLaMA 3.3 70B) | LLM reasoning, 276 tokens/sec |
| Sarvam AI Saarika v2.5 | Hindi/Telugu STT, WebSocket streaming |
| Sarvam AI Bulbul v2 | Hindi/Telugu TTS, sentence-level streaming |

### ML Layer
| Tool | Purpose |
|------|---------|
| Scikit-learn | Pipeline, StandardScaler baseline |
| XGBoost | Main forecasting model |
| joblib | Model serialization |
| NumPy | Feature engineering |

### External Data Sources
| Source | Data | Cost |
|--------|------|------|
| Agmarknet (data.gov.in) | Wholesale mandi prices by district | Free |
| Tavily Search API | Live retail price web search (cached) | Free (1k/month) |
| Internal benchmark data | Category-level starter profiles | Internal |

---

## 4. Database Schema

> **ORM**: SQLAlchemy 2.0 async  
> **Database**: SQLite (`bizvaani.db`) — swap `DATABASE_URL` to switch to PostgreSQL  
> **Naming Convention**: snake_case; all tables have `id`, `created_at`, `updated_at`

```sql
-- Shop owner accounts
CREATE TABLE users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    phone         VARCHAR(15) UNIQUE NOT NULL,         -- Indian mobile format (6-9xxxxxxxx)
    name          VARCHAR(255) NOT NULL,               -- Owner name
    password_hash VARCHAR(255) NOT NULL,               -- bcrypt 12 rounds
    city          VARCHAR(100) NOT NULL,               -- For Agmarknet district lookup
    state         VARCHAR(100) NOT NULL,
    language      VARCHAR(10) DEFAULT 'hi',            -- 'hi' | 'te' | 'en'
    is_onboarded  BOOLEAN DEFAULT FALSE,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_phone ON users (phone);

-- Shop profile and category
CREATE TABLE shops (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id             INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shop_name           VARCHAR(255) NOT NULL,
    gstin               VARCHAR(20),                  -- GST Identification Number (optional)
    categories          JSON NOT NULL,                -- e.g. ["grains", "fmcg"]
    district            VARCHAR(100) NOT NULL,        -- Agmarknet district code
    cold_start_path     VARCHAR(20) DEFAULT 'benchmark',  -- 'csv'|'ocr'|'voice'|'benchmark'
    data_maturity_days  INTEGER DEFAULT 0,            -- Days of real (non-benchmark) sales data
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_shops_user_id ON shops (user_id);

-- Products tracked by the shop
CREATE TABLE products (
    id                   INTEGER PRIMARY KEY AUTOINCREMENT,
    shop_id              INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    name                 VARCHAR(255) NOT NULL,        -- Product name (English or vernacular)
    name_hindi           VARCHAR(255),                 -- Hindi name used for TTS
    category             VARCHAR(50) NOT NULL,         -- grains/dairy/fmcg/vegetables
    unit                 VARCHAR(20) DEFAULT 'kg',     -- kg/litre/piece/dozen
    selling_price        DECIMAL(10,2) NOT NULL,
    cost_price           DECIMAL(10,2),
    stock_qty            DECIMAL(10,2) DEFAULT 0,
    agmarknet_commodity  VARCHAR(100),                 -- Mapped Agmarknet commodity name
    created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_shop_id ON products (shop_id);
CREATE INDEX idx_products_category ON products (category);

-- Daily sales log (source of truth for ML)
CREATE TABLE sales_entries (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    shop_id        INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    product_id     INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    entry_date     DATE NOT NULL,
    quantity_sold  DECIMAL(10,2) NOT NULL,
    revenue        DECIMAL(10,2) NOT NULL,             -- qty × price
    entry_source   VARCHAR(20) DEFAULT 'voice',        -- 'voice'|'csv'|'ocr'|'manual'|'benchmark'
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (shop_id, product_id, entry_date)           -- one entry per product per day
);

CREATE INDEX idx_sales_shop_product_date ON sales_entries (shop_id, product_id, entry_date);
CREATE INDEX idx_sales_entry_date ON sales_entries (entry_date DESC);

-- Agmarknet + crowdsourced competitor prices (cache table)
CREATE TABLE market_prices (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    commodity    VARCHAR(100) NOT NULL,               -- Agmarknet commodity name
    district     VARCHAR(100) NOT NULL,
    state        VARCHAR(100) NOT NULL,
    modal_price  DECIMAL(10,2) NOT NULL,              -- Most common traded price
    min_price    DECIMAL(10,2),
    max_price    DECIMAL(10,2),
    price_date   DATE NOT NULL,
    source       VARCHAR(20) DEFAULT 'agmarknet',     -- 'agmarknet'|'user_report'|'tavily'
    confidence   DECIMAL(3,2) DEFAULT 1.0,           -- 0.0–1.0 confidence weight
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_market_commodity_district_date ON market_prices (commodity, district, price_date);

-- Stored XGBoost predictions (pre-computed, served instantly)
CREATE TABLE ml_forecasts (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    shop_id        INTEGER REFERENCES shops(id) ON DELETE CASCADE,
    product_id     INTEGER REFERENCES products(id) ON DELETE CASCADE,
    forecast_date  DATE NOT NULL,
    predicted_qty  DECIMAL(10,2) NOT NULL,
    lower_bound    DECIMAL(10,2),                    -- 10th percentile
    upper_bound    DECIMAL(10,2),                    -- 90th percentile
    is_anomaly     BOOLEAN DEFAULT FALSE,            -- True when sales deviate > 20% from forecast
    anomaly_pct    DECIMAL(5,2),                     -- % deviation from forecast
    model_version  VARCHAR(20),
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_forecasts_shop_product_date ON ml_forecasts (shop_id, product_id, forecast_date);

-- GST invoices generated by voice
CREATE TABLE invoices (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    shop_id          INTEGER REFERENCES shops(id) ON DELETE CASCADE,
    invoice_number   VARCHAR(50) UNIQUE NOT NULL,    -- Auto-generated: BV-2026-001
    customer_name    VARCHAR(255) NOT NULL,
    customer_gstin   VARCHAR(20),
    items            JSON NOT NULL,                  -- [{product, qty, unit_price, hsn, gst_rate}]
    subtotal         DECIMAL(10,2) NOT NULL,
    cgst             DECIMAL(10,2) NOT NULL,
    sgst             DECIMAL(10,2) NOT NULL,
    total            DECIMAL(10,2) NOT NULL,
    pdf_path         TEXT,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_invoices_shop_id ON invoices (shop_id);
```

---

## 5. App Flow

### Flow 1 — First Time Setup (New Owner, No Data)

```
1.  Owner opens PWA on mobile
2.  Fills: Name, Phone, Password, Shop Name, City, Category, Language
3.  POST /api/auth/register → JWT created, shop_id returned, stored in localStorage
4.  Backend seeds benchmark sales profile (30 days synthetic data)
5.  APScheduler preloads market prices for top 5 products in that city
6.  Redirect to Dashboard
7.  Owner immediately sees market price context — no CSV needed
```

### Flow 2 — CSV Upload (Post-Onboarding)

```
1.  Owner navigates to Settings/Profile on Dashboard
2.  Uploads CSV via drag-drop
3.  Pandas reads + normalizes columns
4.  Column mapping auto-detected; user confirms or fixes
5.  Benchmark data marked as replaced
6.  ML model retrained on real data
7.  WebSocket pushes "Forecast Ready" to dashboard
```

### Flow 3 — Bill Photo Upload (OCR)

```
1.  Owner takes photo of old paper bill/invoice
2.  Image sent to POST /api/onboard/ocr
3.  Groq Vision (llama-3.2-11b-vision) extracts line items
4.  Structured records saved to sales_entries table
5.  Confirmation shown: "8 transactions recovered"
```

### Flow 4 — Voice Sales Entry

```
1.  Owner taps mic
2.  Browser streams audio via WebSocket
3.  Sarvam Saarika v2.5 transcribes in real-time
4.  Transcript sent to Groq NER extraction
5.  Entities extracted: product, qty, unit, price, date
6.  Record saved to sales_entries table
7.  TTS confirms: "Entry saved"
```

### Flow 5 — Business Coach Query

```
1.  Owner asks question by voice
2.  Sarvam STT → transcript
3.  LangGraph classifies intent
4.  Parallel fetch:
    - Node 2a: SQLite sales summary
    - Node 2b: Cached market price (0ms if warm)
5.  Groq generates recommendation (streams)
6.  TTS fires on first sentence (~400ms after generation starts)
7.  Owner hears answer at ~1.4s
8.  Dashboard shows recommendation card
```

### Flow 6 — Profit Simulation

```
1.  Owner taps "Simulate Impact" after receiving recommendation
2.  POST /api/simulate with: product, current_price, suggested_price
3.  Python computes:
    - new_demand (using price elasticity = 1.3 for grocery)
    - projected revenue and profit
    - delta vs current
4.  Recharts renders before/after bar chart live
5.  Shows: "Expected ₹1,400 extra profit this week"
```

### Flow 7 — Invoice Generation

```
1.  Owner speaks: "Generate invoice for Sharma — 50 kg rice at 5% discount"
2.  LLM extracts: customer, product, qty, discount
3.  GST calculation: 5% food rate (CGST + SGST split)
4.  ReportLab generates PDF with:
    - shop name, GSTIN placeholder
    - line items, discount row, GST breakup
    - total in words
5.  PDF available at /api/invoice/{id}/pdf
6.  React shows download button
```

### Flow 8 — Live Alert Dashboard

```
1.  APScheduler checks all shops at 6 AM and 6 PM daily
2.  Per product:
    - actual_sales / forecast < 0.80 for 2+ days → ANOMALY ALERT
    - forecast < 90% avg → MEDIUM RISK
    - stock < forecast_7d * 1.2 → RESTOCK ALERT
3.  Alerts written to ml_forecasts table (is_anomaly flag)
4.  WebSocket broadcasts to React
5.  Dashboard shows colour-coded cards:
    🔴 HIGH RISK — Rice: sales dropping 22%
    🟡 MEDIUM — Dal: restock needed in 4 days
    🟢 LOW — Sugar: normal
```

---

## 6. API Reference

### REST Endpoints

```
POST   /api/auth/register              Register new owner + shop
POST   /api/auth/login                 Authenticate, return JWT

POST   /api/settings/csv               Upload CSV (returns preview + column mapping)
POST   /api/settings/csv/confirm       Confirm import after user reviews mapping
POST   /api/onboard/ocr               Upload bill photo (OCR via Groq Vision)

POST   /api/voice/query               Core voice Q&A (streaming SSE response)
POST   /api/voice/stt                 Proxy to Sarvam STT (keeps API key server-side)
POST   /api/voice/tts                 Proxy to Sarvam TTS

POST   /api/sales/entry               Log daily sales (voice/manual/CSV row)
GET    /api/dashboard                 Aggregated dashboard data
GET    /api/forecast/{product_id}     7-day + 30-day forecast
GET    /api/market/prices             Current mandi prices for shop's city

POST   /api/invoice/generate          Generate GST invoice PDF
GET    /api/invoice/{id}/pdf          Download invoice (public — no auth)

POST   /api/simulate                  Profit impact simulation
```

### WebSocket Endpoints

```
WS  /ws/voice/{shop_id}       Full voice pipeline (STT → agent → TTS)
WS  /ws/dashboard/{shop_id}   Push live alerts and updates to React
```

### Sample: POST /api/simulate

```json
Request:
{
  "shop_id": 1,
  "product_id": 3,
  "action": "price_cut",
  "current_price": 45,
  "suggested_price": 42,
  "avg_daily_qty": 35
}

Response:
{
  "current_profit": 3200,
  "projected_profit": 4580,
  "delta": 1380,
  "pct_change": 43.1,
  "payback_days": 3,
  "summary": "Reduce price by ₹3. Expected ₹1,380 extra profit in 7 days."
}
```

### Sample: POST /api/auth/register

```json
Request:
{
  "phone": "9876543210",
  "name": "Ramesh Kumar",
  "password": "pass123",
  "city": "Nagpur",
  "state": "Maharashtra",
  "language": "hi",
  "shop_name": "Ramesh Kirana Store",
  "categories": ["grains", "fmcg"]
}

Response (201):
{
  "access_token": "eyJ...",
  "user": { "id": 1, "name": "Ramesh Kumar", "city": "Nagpur" },
  "shop": { "id": 1, "shop_name": "Ramesh Kirana Store" }
}
```

### Authentication

**JWT Token Structure**:
```json
{
  "sub": "1",
  "phone": "9876543210",
  "shop_id": 1,
  "language": "hi",
  "iat": 1743072000,
  "exp": 1743676800
}
```

**Public Routes** (no auth required):
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/invoice/:id/pdf`

All other routes require `Authorization: Bearer <token>`.

---

## 7. ML Engine

### Model Design

```python
# One model per product per shop
# Features
features = [
    "day_of_week",          # 0–6
    "month",                # 1–12
    "week_of_year",         # 1–52
    "lag_1",                # sales yesterday
    "lag_7",                # same day last week
    "lag_30",               # same day last month
    "rolling_mean_7",       # 7-day average
    "rolling_mean_30",      # 30-day average
    "price_delta",          # % change in own price vs last week
    "competitor_price_delta",  # % below/above market price
    "is_festival",          # 0/1 (Diwali, Holi, Eid, harvest season)
    "category_benchmark",   # Category average for cold start
]

XGBOOST_PARAMS = {
    "n_estimators": 100,
    "max_depth": 4,
    "learning_rate": 0.1,
    "objective": "reg:squarederror",
    "tree_method": "hist",   # Fast for small datasets
}

# Pipeline
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from xgboost import XGBRegressor

model = Pipeline([
    ("scaler", StandardScaler()),
    ("model", XGBRegressor(**XGBOOST_PARAMS))
])
```

### Risk Detection Rules

```python
def check_anomaly(actual: float, forecast: float) -> tuple[bool, float]:
    deviation = (actual - forecast) / forecast
    is_anomaly = deviation < -0.20   # 20% below forecast
    return is_anomaly, deviation * 100

def detect_risk(product_id, shop_id):
    forecast = get_latest_forecast(product_id, shop_id)
    avg_30d  = get_avg_sales(product_id, shop_id, days=30)
    drop_pct = ((avg_30d - forecast["predicted_qty"]) / avg_30d) * 100

    if forecast["predicted_qty"] < avg_30d * 0.75:
        return {"level": "HIGH",   "reason": f"Predicted {drop_pct:.0f}% drop"}
    if forecast["predicted_qty"] < avg_30d * 0.90:
        return {"level": "MEDIUM", "reason": "Slight decline detected"}
    return {"level": "LOW", "reason": "Sales trending normal"}
```

### Retraining Schedule

```python
@scheduler.scheduled_job("interval", hours=4)
def retrain_all_shops():
    # Also triggered after every 5 new sales_entries per shop (async)
    shops = db.execute("SELECT DISTINCT shop_id FROM sales_entries WHERE entry_source != 'benchmark'")
    for shop in shops:
        run_ml_forecast(shop["shop_id"])
```

### Profit Simulation Formula

```python
PRICE_ELASTICITY = 1.3   # Conservative grocery elasticity

def simulate_profit(
    current_price: float,
    new_price: float,
    current_qty: float,
    cost_price: float
) -> float:
    price_change_pct = (new_price - current_price) / current_price
    new_qty = current_qty * (1 - PRICE_ELASTICITY * price_change_pct)
    new_profit = (new_price - cost_price) * new_qty
    current_profit = (current_price - cost_price) * current_qty
    return new_profit - current_profit   # ₹ delta per day
```

### Cold Start Benchmarks

```python
CATEGORY_BENCHMARKS = {
    "grains":     {"daily_qty_kg": 50, "daily_revenue": 1800},
    "dairy":      {"daily_qty_litre": 30, "daily_revenue": 1200},
    "fmcg":       {"daily_revenue": 2500},
    "vegetables": {"daily_qty_kg": 40, "daily_revenue": 800},
}
```

---

## 8. Agent Design (LangGraph)

### State

```python
from typing import TypedDict, Optional

class ShopState(TypedDict):
    # Input
    user_id:        int
    shop_id:        int
    query:          str
    language:       str         # 'hi' | 'te' | 'en'

    # Fetched context (populated by parallel nodes)
    sales_data:     Optional[dict]    # Last 30 days from SQLite
    market_data:    Optional[dict]    # Agmarknet cached prices
    forecast_data:  Optional[dict]    # XGBoost predictions

    # Output
    why_text:           Optional[str]    # Root cause explanation
    what_text:          Optional[str]    # Recommended action
    rupees_impact:      Optional[float]  # Profit simulation result
    response_text:      Optional[str]    # Full response for TTS
    alert_triggered:    Optional[bool]   # Should save as alert?
```

### Graph Structure

```
Entry
  └─ intent_classifier (Node 1)
        ├─ intent == "sales_query"  → sales_fetcher (Node 2a)
        ├─ intent == "price_query"  → market_fetcher (Node 2b)
        ├─ intent == "both"         → [sales_fetcher, market_fetcher] ← PARALLEL
        └─ intent == "invoice"      → END (handled by invoice router)

  sales_fetcher (Node 2a) ──┐
                             ├─ response_generator (Node 3) → END
  market_fetcher (Node 2b) ──┘
```

**Nodes**:
1. `intent_classifier` — classifies query type: why / what / invoice / alert / forecast
2. `sales_fetcher` — pulls SQLite sales data (parallel)
3. `market_fetcher` — reads Agmarknet in-memory cache (parallel, ~0ms)
4. `response_generator` — calls Groq with structured prompt + context; streams output

**Edges**:
```python
graph.add_edge(START, "intent_classifier")
graph.add_conditional_edges("intent_classifier", route_after_classify, {
    "sales_fetcher":  "sales_fetcher",
    "market_fetcher": "market_fetcher",
})
graph.add_edge("sales_fetcher",  "response_generator")
graph.add_edge("market_fetcher", "response_generator")
graph.add_edge("response_generator", END)
```

### System Prompt Template

```
You are BizVaani, a business advisor for {shop_name} in {city}.
Category: {category}
Language: {language}

Context:
{sales_summary}
{market_price_context}

Rules:
- Respond ONLY in {language}
- Maximum 3 sentences
- End with ONE specific action and ₹ impact estimate
- Never give generic advice
```

### Tools Registered

```python
tools = [
    Tool(name="get_sales_trend",  func=get_sales_trend,  description="30-day sales trend for a product"),
    Tool(name="get_forecast",     func=get_forecast,     description="7-day forecast and risk level"),
    Tool(name="simulate_profit",  func=simulate_profit,  description="Profit impact of a pricing action"),
    TavilySearch(max_results=2),  # background only — see Section 10
]
```

---

## 9. Competitor Intelligence Engine

### Why BizVaani Knows Market Prices

There is no direct access to nearby shop pricing.
The system estimates local price pressure through four layered sources.

| Source | Type | Latency | Confidence |
|--------|------|---------|------------|
| Owner voice report | "The shop across the street cut price by ₹5" | Instant | Ground truth |
| BizVaani user network | Anonymized local average | Instant (DB) | Very High |
| Tavily cached search | Web retail prices by pincode | ~0ms (cached) | Medium |
| Agmarknet API | Wholesale mandi by district | ~200ms | High (wholesale) |

### Agmarknet Integration

```python
def get_agmarknet_price(product: str, city: str) -> float | None:
    commodity_map = {
        "rice":  "Rice",
        "dal":   "Arhar(Tur/Red Gram)(Whole)",
        "sugar": "Sugar",
        "oil":   "Groundnut Oil",
        "wheat": "Wheat",
    }
    url = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070"
    params = {
        "api-key": AGMARKNET_API_KEY,
        "format":  "json",
        "filters[commodity]": commodity_map.get(product.lower(), product),
        "filters[district]":  city,
        "limit": 1,
    }
    res = requests.get(url, params=params, timeout=3).json()
    if res.get("records"):
        wholesale = float(res["records"][0]["modal_price"])
        return wholesale * 1.15   # add standard 15% retail margin
    return None
```

### Confidence-Weighted Final Price

```python
def get_market_price(product, city):
    weights = {
        "voice":     1.00,
        "network":   0.85,
        "agmarknet": 0.70,
        "tavily":    0.60,
    }
    sources  = fetch_all_available_sources(product, city)
    weighted = sum(s["price"] * weights[s["source"]] for s in sources)
    total_w  = sum(weights[s["source"]] for s in sources)
    return round(weighted / total_w, 2)
```

---

## 10. Latency Optimization

### Problem

Without optimization, the full pipeline is too slow for voice UX:

| Step | Unoptimized |
|------|-------------|
| STT | 300ms |
| Classify | 250ms |
| Tool fetches (serial) | 100ms |
| Tavily search (blocking) | 4500ms |
| Groq full response | 1500ms |
| TTS (after full response) | 300ms |
| **Total** | **~7s** |

### Fix 1 — Never Block on Tavily

```python
# Runs on schedule (every 4 hours), NOT during user request
async def refresh_market_prices_background(product: str, city: str):
    result = await tavily_tool.ainvoke(f"{product} retail price {city} India today")
    price_cache[f"{product}_{city}"] = {
        "price":      extract_price(result),
        "fetched_at": datetime.now()
    }

# Serve instantly from cache during user request
def get_cached_market_price(product, city):
    cached = price_cache.get(f"{product}_{city}")
    if cached and (datetime.now() - cached["fetched_at"]) < timedelta(hours=4):
        return cached["price"]   # ~0ms
    return get_agmarknet_price(product, city)   # fallback, ~200ms
```

### Fix 2 — LangGraph Parallel Fan-Out

```python
# Returns a LIST → LangGraph runs both nodes simultaneously
def route_after_classify(state: ShopState) -> list:
    if state["intent"] == "both":
        return ["sales_fetcher", "market_fetcher"]   # PARALLEL
    elif state["intent"] == "sales_query":
        return ["sales_fetcher"]
    elif state["intent"] == "price_query":
        return ["market_fetcher"]

graph.add_conditional_edges("intent_classifier", route_after_classify, {
    "sales_fetcher":  "sales_fetcher",
    "market_fetcher": "market_fetcher",
})
# sales_fetcher and market_fetcher merge into response_generator node
```

### Fix 3 — Groq Streaming + Early TTS

```python
# Do not wait for full response. Fire TTS on each completed sentence.
async def stream_response_to_voice(prompt, websocket, language):
    buffer = ""
    async for chunk in groq_client.chat.completions.stream(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=150
    ):
        token = chunk.choices[0].delta.content or ""
        buffer += token

        # Sentence endings: Hindi, Telugu, English
        if any(buffer.endswith(e) for e in ["।", ". ", "! ", "? ", "\n"]):
            asyncio.create_task(sarvam_tts_and_send(buffer.strip(), websocket, language))
            buffer = ""

    if buffer.strip():   # flush remaining
        asyncio.create_task(sarvam_tts_and_send(buffer.strip(), websocket, language))
```

### Result After All Fixes

| Step | Optimized |
|------|----------|
| STT | 300ms |
| Classify | 250ms |
| Parallel fetches | 50ms |
| Tavily (cache) | 0ms |
| Groq first sentence | ~400ms |
| TTS first audio | 300ms |
| **User hears audio** | **~1.4s** |

---

## 11. Cold Start Strategy

CSV upload is optional. Most shop owners have no digital data.
BizVaani supports four onboarding paths.

### Path A — CSV Upload (Optional)
Only used if owner already has structured data (`.csv`, `.xlsx`, `.xls`).

### Path B — Bill Photo OCR
Owner photographs old supplier bills or handwritten ledgers.

```python
async def extract_from_bill_photo(image_bytes: bytes) -> list[dict]:
    client = AsyncGroq()
    image_b64 = base64.b64encode(image_bytes).decode()
    response = await client.chat.completions.create(
        model="llama-3.2-11b-vision-preview",
        messages=[{
            "role": "user",
            "content": [
                {"type": "image_url",
                 "image_url": {"url": f"data:image/jpeg;base64,{image_b64}"}},
                {"type": "text",
                 "text": "Extract all items from this bill. Return JSON: "
                         "[{product, qty, unit, price, date}]. "
                         "Handle Hindi and Telugu product names."}
            ]
        }]
    )
    return json.loads(response.choices[0].message.content)
```

### Path C — Benchmark Seeding
If owner has nothing, seed 30 days of synthetic data from industry benchmarks.

```python
BENCHMARKS = {
    "grocery": {
        "rice":  {"daily_avg_kg": 35, "price_range": (38, 46)},
        "dal":   {"daily_avg_kg": 12, "price_range": (90, 110)},
        "sugar": {"daily_avg_kg": 20, "price_range": (40, 48)},
        "oil":   {"daily_avg_litre": 8, "price_range": (130, 160)},
    }
}

def seed_new_shop(shop_id, category, city):
    records = []
    for days_ago in range(30, 0, -1):
        date = datetime.now() - timedelta(days=days_ago)
        for product, stats in BENCHMARKS[category].items():
            variance = random.uniform(0.85, 1.15)
            records.append({
                "shop_id":      shop_id,
                "product":      product,
                "quantity_sold": round(stats["daily_avg_kg"] * variance, 1),
                "revenue":      round(random.uniform(*stats["price_range"]), 2),
                "entry_date":   date.strftime("%Y-%m-%d"),
                "entry_source": "benchmark"
            })
    db.bulk_insert("sales_entries", records)
```

### Path D — Voice-First Daily Entry
Every spoken transaction builds real data organically.

### Data Maturity Curve

```
Day 1–7:   100% benchmark data
Day 8–14:  Blend — 30% real + 70% benchmark
Day 15+:   Full ML trained on real shop history
```

### Market Intelligence Works From Day One
Agmarknet + Tavily cache gives market pricing context immediately,
regardless of personal sales data. New users still get value on Day 1.

---

## 12. Frontend Architecture

### Page Structure (Next.js App Router)

```
/app
  /page.tsx                  → Landing
  /onboard/page.tsx          → Shop setup form (Step 1: Info, Step 2: Data path)
  /onboard/csv/page.tsx      → CSV upload flow
  /onboard/ocr/page.tsx      → Bill photo OCR flow
  /onboard/voice/page.tsx    → Voice-first daily entry flow
  /dashboard/page.tsx        → Main dashboard
  /alerts/page.tsx           → Risk alert list
  /forecast/page.tsx         → 7/30-day demand charts
  /inventory/page.tsx        → Stock list + add stock
  /invoice/page.tsx          → Invoice generator
  /invoice/[id]/page.tsx     → Public shareable PDF link
  /settings/page.tsx         → Profile + GSTIN + language
  /api/simulate/route.ts     → Next.js API route (profit simulator)
  /api/alerts/route.ts       → Next.js API route (alert fetch)
```

### Component Tree

```
DashboardLayout
├── Header (shop name, language toggle)
├── AlertsPanel
│   └── AlertCard (🔴🟡🟢 colour-coded)
├── SalesTrendChart (Recharts LineChart, 30-day)
├── VoiceInterface
│   ├── MicButton (tap to speak)
│   ├── TranscriptDisplay (live text during speech)
│   └── AudioPlayer (plays TTS chunks)
├── RecommendationFeed
│   ├── RecommendationCard (action + expected impact)
│   └── ProfitSimulatorChart (Recharts BarChart)
├── ProductTable (inventory + risk status)
└── InvoicePanel
    └── InvoiceDownloadButton
```

### Key Hooks

```javascript
// useVoiceCapture.ts
// Captures mic → streams to WebSocket → plays streamed TTS audio chunks
const useVoiceCapture = (shopId) => {
  const startVoice = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const ws = new WebSocket(`ws://localhost:8000/ws/voice/${shopId}`);

    ws.onmessage = async (event) => {
      if (typeof event.data === "string") {
        const msg = JSON.parse(event.data);
        if (msg.type === "transcript") setTranscript(msg.text);
      }
      if (event.data instanceof Blob) {
        // TTS audio chunk — play immediately (Fix 3)
        const buf = await event.data.arrayBuffer();
        const audio = await audioCtx.decodeAudioData(buf);
        const src = audioCtx.createBufferSource();
        src.buffer = audio;
        src.connect(audioCtx.destination);
        src.start();
      }
    };

    const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
    recorder.ondataavailable = (e) => ws.send(e.data);
    recorder.start(250);   // stream in 250ms chunks
  };
};

// useDashboardSocket.ts
// Listens for live alert pushes from backend
const useDashboardSocket = (shopId) => {
  const [alerts, setAlerts] = useState([]);
  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:8000/ws/dashboard/${shopId}`);
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === "alert") setAlerts(prev => [data.payload, ...prev]);
    };
    return () => ws.close();
  }, [shopId]);
  return alerts;
};
```

### Zustand Stores

```typescript
// useVoiceStore — mic state, transcript, AI response
// useShopStore — shop profile, product list, active alerts
```

---

## 13. Environment Setup

### Prerequisites
```
Python 3.11+
Node.js 20+
Git
```

### Backend
```bash
cd backend
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
python db/seed.py       # init DB + seed benchmark data
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev     # http://localhost:3000
```

### .env
```bash
# ── AI / Voice ──────────────────────────────────
SARVAM_API_KEY="sk-sarvam-..."
GROQ_API_KEY="gsk_..."
TAVILY_API_KEY="tvly-..."

# ── Market Data ─────────────────────────────────
AGMARKNET_API_KEY="..."        # data.gov.in (free)

# ── App ─────────────────────────────────────────
DATABASE_URL="sqlite:///./bizvaani.db"
JWT_SECRET="change-this-to-32-char-random-string"
JWT_EXPIRY_MINUTES=10080       # 7 days (hackathon — no refresh flow)
NEXT_PUBLIC_API_URL="http://localhost:8000"

# ── Scheduler ───────────────────────────────────
AGMARKNET_REFRESH_HOURS=4
TAVILY_CACHE_HOURS=4

# ── Demo Settings ───────────────────────────────
DEMO_CITY="Nagpur"
DEMO_DISTRICT="Nagpur"
DEMO_STATE="Maharashtra"

# ── Storage ─────────────────────────────────────
INVOICE_OUTPUT_DIR=./invoices
ML_MODEL_DIR=./models
CORS_ORIGINS=http://localhost:3000
```

### API Keys (All Free Tier)
| Service | Registration URL | Free Limit |
|---------|-----------------|------------|
| Groq | console.groq.com | 14,400 req/day |
| Sarvam AI | dashboard.sarvam.ai | Free credits on signup |
| Tavily | tavily.com | 1,000 searches/month |
| data.gov.in | data.gov.in/user/register | Unlimited |

---

## 14. Folder Structure

```
bizvaani/
├── backend/
│   ├── main.py                    # FastAPI app entry
│   ├── requirements.txt
│   ├── .env.example
│   │
│   ├── api/                       # Route handlers
│   │   ├── auth.py                # /api/auth/*
│   │   ├── voice.py               # /api/voice/*
│   │   ├── dashboard.py           # /api/dashboard
│   │   ├── sales.py               # /api/sales/*
│   │   ├── onboard.py             # /api/onboard/*
│   │   ├── invoice.py             # /api/invoice/*
│   │   ├── forecast.py            # /api/forecast/*
│   │   └── market.py              # /api/market/*
│   │
│   ├── agent/                     # LangGraph AI agent
│   │   ├── graph.py               # StateGraph definition
│   │   ├── nodes.py               # intent_classifier, sales_fetcher, market_fetcher, response_generator
│   │   ├── state.py               # ShopState TypedDict
│   │   └── prompts.py             # System prompt template
│   │
│   ├── ml/                        # Machine learning
│   │   ├── forecaster.py          # XGBoost train + predict
│   │   ├── anomaly.py             # Risk alert detection
│   │   ├── simulation.py          # Profit simulation engine
│   │   └── models/                # Saved .joblib model files
│   │
│   ├── services/                  # External integrations
│   │   ├── agmarknet.py           # Agmarknet API client + cache
│   │   ├── tavily_service.py      # Tavily background search
│   │   ├── sarvam_stt.py          # STT proxy
│   │   ├── sarvam_tts.py          # TTS proxy (streamed)
│   │   ├── groq_client.py         # Groq LLM client (streaming)
│   │   ├── invoice_generator.py   # ReportLab PDF
│   │   └── streaming_pipeline.py  # Groq stream + sentence-level TTS
│   │
│   ├── models/                    # SQLAlchemy ORM models
│   │   ├── user.py
│   │   ├── shop.py
│   │   ├── product.py
│   │   ├── sales_entry.py
│   │   ├── market_price.py
│   │   ├── ml_forecast.py
│   │   └── invoice.py
│   │
│   ├── db/
│   │   ├── database.py            # Async engine + session factory
│   │   └── seed.py                # Benchmark data seeder + DB init
│   │
│   └── scheduler/
│       └── jobs.py                # APScheduler job definitions
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx               # Landing
│   │   ├── onboard/page.tsx
│   │   ├── dashboard/page.tsx
│   │   └── api/
│   │       ├── simulate/route.ts
│   │       └── alerts/route.ts
│   ├── components/
│   │   ├── AlertsPanel.tsx
│   │   ├── SalesTrendChart.tsx
│   │   ├── VoiceInterface.tsx
│   │   ├── RecommendationFeed.tsx
│   │   ├── ProfitSimulatorChart.tsx
│   │   └── InvoicePanel.tsx
│   ├── hooks/
│   │   ├── useVoiceCapture.ts
│   │   └── useDashboardSocket.ts
│   ├── store/
│   │   ├── useVoiceStore.ts       # Zustand: mic state, transcript, AI response
│   │   └── useShopStore.ts        # Zustand: shop data, products, alerts
│   └── lib/
│       └── api.ts                 # Axios instance with JWT interceptor
│
├── data/
│   ├── sample_sales.csv
│   └── demo_preload.py            # Pre-fills price_cache before demo
│
└── README.md
```

---

## 15. Build Order (36 Hours)

```
HOUR 00–02   Repo setup, FastAPI skeleton, SQLite schema (db/seed.py)
HOUR 02–05   /api/auth/register + cold start benchmark seed
HOUR 05–09   CSV upload + Pandas ingestion + OCR bill upload (Groq Vision)
HOUR 09–13   ML engine (XGBoost train + forecast + risk rules)
HOUR 13–17   Agmarknet integration + Tavily background cache + APScheduler
HOUR 17–21   LangGraph agent (4 nodes + parallel fan-out)
HOUR 21–24   Sarvam STT/TTS integration + /ws/voice WebSocket
HOUR 24–27   streaming_pipeline.py (Groq stream + Fix 3)
HOUR 27–30   Next.js dashboard (alerts + charts + voice UI)
HOUR 30–32   Profit simulator + Recharts visualisation
HOUR 32–34   Invoice PDF generator + download endpoint
HOUR 34–35   demo_preload.py + smoke test full voice flow
HOUR 35–36   UI polish + demo rehearsal x5
```

---

## 16. Demo Script (3 Minutes)

```
[00:00]  Open PWA on mobile — clean landing screen

[00:15]  "Meet Ramesh — kirana store owner in Nagpur. Zero digital records."
         Register: Name=Ramesh, City=Nagpur, Category=Grocery, Language=Hindi

[00:30]  Dashboard loads automatically:
         - Benchmark sales data pre-seeded
         - Market price context loaded (Agmarknet rice ₹38/kg wholesale)
         - No CSV required

[00:45]  Risk alert fires:
         🔴 "Rice sales down 22% — HIGH RISK"

[01:00]  Tap mic. Owner asks: "Why are my rice sales dropping?"
         Live transcript appears on screen in real-time

[01:15]  AI responds (voice + text):
         "Nagpur market price is ₹40/kg; you are selling at ₹42.
          Offer a 5 kg + 1 kg bundle deal — expected ₹1,400 extra this week."

[01:30]  Tap "Simulate Impact"
         Before/after bar chart animates on screen

[01:45]  Owner says: "Generate invoice for Sharma — 50 kg rice at 5% discount"
         PDF invoice downloads in under 3 seconds

[02:00]  Show recommendation history:
         "3 of 5 suggestions followed → ₹4,200 total ROI this month"

[02:20]  Show market prices section:
         "Source: Agmarknet (wholesale) + cached web search by pincode"

[02:40]  Close:
         "63 million undigitized small retailers in India.
          No spreadsheet needed. Just speak — BizVaani handles the rest."
```

---

## 17. Non-Negotiable Rules

### Architecture Rules
1. Tavily must never block a user response. Cache only — runs via APScheduler every 4 hours.
2. LangGraph fetch nodes must run in parallel for "both" intent.
3. Groq must stream. TTS must fire on the first completed sentence, not after the full response.
4. ML models must be pre-trained and loaded into memory at startup.
5. LangGraph graph must be compiled once at startup, not per request.

### Product Rules
6. CSV upload is optional. The product must deliver value with zero data.
7. Every AI answer must include a specific ₹ impact estimate.
8. Every AI answer must be under 3 sentences.
9. All voice responses must be in the owner's registered language.

### Demo Rules
10. Run `demo_preload.py` before going on stage.
11. Test the full voice pipeline at least 10 times the night before.
12. Have a mock WebSocket fallback ready if internet drops.
13. Dashboard must be mobile-first — judges will test on phones.
14. Benchmark seed data must load for a brand new registration during the demo.
