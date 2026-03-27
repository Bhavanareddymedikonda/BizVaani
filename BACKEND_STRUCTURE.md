# Backend Architecture & Database Structure
## BizVaani — Voice-First AI Business Coach

---

## 1. Architecture Overview

- **Pattern**: FastAPI REST + WebSocket; LangGraph stateful AI agent
- **Authentication**: JWT (7-day token, no refresh for hackathon)
- **Data Flow**: Client → FastAPI → LangGraph Agent → [Groq LLM | Agmarknet Cache | SQLite] → Response → Sarvam TTS → Client
- **Background Jobs**: APScheduler runs Agmarknet refresh + Tavily cache every 4 hours
- **ML Pipeline**: XGBoost model retrained after every 5 new sales entries (async)

---

## 2. Database Schema

### Database: SQLite (`bizvaani.db`)
- **ORM**: SQLAlchemy 2.0 async
- **Naming Convention**: snake_case
- **All tables**: have `id`, `created_at`, `updated_at`

---

### Table: `users`
**Purpose**: Shop owner accounts

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique identifier |
| phone | VARCHAR(15) | UNIQUE, NOT NULL | Phone number (login, India format) |
| name | VARCHAR(255) | NOT NULL | Owner name |
| password_hash | VARCHAR(255) | NOT NULL | bcrypt 12 rounds |
| city | VARCHAR(100) | NOT NULL | City for Agmarknet district lookup |
| state | VARCHAR(100) | NOT NULL | State |
| language | VARCHAR(10) | DEFAULT 'hi' | 'hi' (Hindi) or 'te' (Telugu) |
| is_onboarded | BOOLEAN | DEFAULT FALSE | Has completed onboarding |
| created_at | TIMESTAMP | DEFAULT NOW() | Account creation |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update |

**Indexes**: `idx_users_phone` ON (phone)

---

### Table: `shops`
**Purpose**: Shop profile and category data

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique identifier |
| user_id | INTEGER | FK → users(id) ON DELETE CASCADE, NOT NULL | Owner |
| shop_name | VARCHAR(255) | NOT NULL | Shop display name |
| gstin | VARCHAR(20) | NULL | GST Identification Number |
| categories | JSON | NOT NULL | ['grains','dairy','fmcg'] |
| district | VARCHAR(100) | NOT NULL | Agmarknet district code |
| cold_start_path | VARCHAR(20) | DEFAULT 'benchmark' | 'csv','ocr','voice','benchmark' |
| data_maturity_days | INTEGER | DEFAULT 0 | Days of real sales data |
| created_at | TIMESTAMP | DEFAULT NOW() | |
| updated_at | TIMESTAMP | DEFAULT NOW() | |

**Indexes**: `idx_shops_user_id` ON (user_id)

---

### Table: `products`
**Purpose**: Products tracked by the shop

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique identifier |
| shop_id | INTEGER | FK → shops(id) ON DELETE CASCADE, NOT NULL | Parent shop |
| name | VARCHAR(255) | NOT NULL | Product name (Hindi or English) |
| name_hindi | VARCHAR(255) | NULL | Hindi name for TTS |
| category | VARCHAR(50) | NOT NULL | grains/dairy/fmcg/vegetables |
| unit | VARCHAR(20) | DEFAULT 'kg' | kg/litre/piece/dozen |
| selling_price | DECIMAL(10,2) | NOT NULL | Current selling price |
| cost_price | DECIMAL(10,2) | NULL | Purchase cost |
| stock_qty | DECIMAL(10,2) | DEFAULT 0 | Current stock |
| agmarknet_commodity | VARCHAR(100) | NULL | Mapped Agmarknet commodity name |
| created_at | TIMESTAMP | DEFAULT NOW() | |
| updated_at | TIMESTAMP | DEFAULT NOW() | |

**Indexes**:
- `idx_products_shop_id` ON (shop_id)
- `idx_products_category` ON (category)

---

### Table: `sales_entries`
**Purpose**: Daily sales log (source of truth for ML)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique identifier |
| shop_id | INTEGER | FK → shops(id) ON DELETE CASCADE, NOT NULL | Shop |
| product_id | INTEGER | FK → products(id) ON DELETE CASCADE, NOT NULL | Product |
| entry_date | DATE | NOT NULL | Sales date |
| quantity_sold | DECIMAL(10,2) | NOT NULL | Units sold |
| revenue | DECIMAL(10,2) | NOT NULL | Total revenue (qty × price) |
| entry_source | VARCHAR(20) | DEFAULT 'voice' | 'voice','csv','ocr','manual' |
| created_at | TIMESTAMP | DEFAULT NOW() | |
| updated_at | TIMESTAMP | DEFAULT NOW() | |

**Indexes**:
- `idx_sales_shop_product_date` ON (shop_id, product_id, entry_date)
- `idx_sales_entry_date` ON (entry_date DESC)

**Constraints**: UNIQUE (shop_id, product_id, entry_date) — one entry per product per day

---

### Table: `market_prices`
**Purpose**: Agmarknet + crowdsourced competitor prices (cache table)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique identifier |
| commodity | VARCHAR(100) | NOT NULL | Agmarknet commodity name |
| district | VARCHAR(100) | NOT NULL | District |
| state | VARCHAR(100) | NOT NULL | State |
| modal_price | DECIMAL(10,2) | NOT NULL | Agmarknet modal (most common) price |
| min_price | DECIMAL(10,2) | NULL | Minimum traded price |
| max_price | DECIMAL(10,2) | NULL | Maximum traded price |
| price_date | DATE | NOT NULL | Date of price data |
| source | VARCHAR(20) | DEFAULT 'agmarknet' | 'agmarknet','user_report','tavily' |
| confidence | DECIMAL(3,2) | DEFAULT 1.0 | 0.0–1.0 confidence weight |
| created_at | TIMESTAMP | DEFAULT NOW() | |
| updated_at | TIMESTAMP | DEFAULT NOW() | |

**Indexes**:
- `idx_market_commodity_district_date` ON (commodity, district, price_date)

---

### Table: `ml_forecasts`
**Purpose**: Stored XGBoost predictions (pre-computed, served instantly)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique identifier |
| shop_id | INTEGER | FK → shops(id) ON DELETE CASCADE | Shop |
| product_id | INTEGER | FK → products(id) ON DELETE CASCADE | Product |
| forecast_date | DATE | NOT NULL | Date being forecasted |
| predicted_qty | DECIMAL(10,2) | NOT NULL | Predicted quantity |
| lower_bound | DECIMAL(10,2) | NULL | 10th percentile |
| upper_bound | DECIMAL(10,2) | NULL | 90th percentile |
| is_anomaly | BOOLEAN | DEFAULT FALSE | Sales drop detected |
| anomaly_pct | DECIMAL(5,2) | NULL | % deviation from forecast |
| model_version | VARCHAR(20) | NULL | XGBoost model version used |
| created_at | TIMESTAMP | DEFAULT NOW() | |
| updated_at | TIMESTAMP | DEFAULT NOW() | |

**Indexes**:
- `idx_forecasts_shop_product_date` ON (shop_id, product_id, forecast_date)

---

### Table: `invoices`
**Purpose**: GST invoices generated by voice

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique identifier |
| shop_id | INTEGER | FK → shops(id) ON DELETE CASCADE | Issuing shop |
| invoice_number | VARCHAR(50) | UNIQUE, NOT NULL | Auto-generated (BV-2026-001) |
| customer_name | VARCHAR(255) | NOT NULL | Buyer name |
| customer_gstin | VARCHAR(20) | NULL | Buyer GSTIN (optional) |
| items | JSON | NOT NULL | [{product, qty, unit_price, hsn, gst_rate}] |
| subtotal | DECIMAL(10,2) | NOT NULL | Pre-tax total |
| cgst | DECIMAL(10,2) | NOT NULL | Central GST |
| sgst | DECIMAL(10,2) | NOT NULL | State GST |
| total | DECIMAL(10,2) | NOT NULL | Final amount |
| pdf_path | TEXT | NULL | Local file path or URL |
| created_at | TIMESTAMP | DEFAULT NOW() | Invoice date |
| updated_at | TIMESTAMP | DEFAULT NOW() | |

**Indexes**: `idx_invoices_shop_id` ON (shop_id)

---

## 3. LangGraph Agent — ShopState

```python
from typing import TypedDict, Optional, List
from langgraph.graph import StateGraph

class ShopState(TypedDict):
    # Input
    user_id: int
    shop_id: int
    query: str
    language: str  # 'hi' or 'te'

    # Fetched context (parallel nodes)
    sales_data: Optional[dict]       # Last 30 days from SQLite
    market_data: Optional[dict]      # Agmarknet cached prices
    forecast_data: Optional[dict]    # XGBoost predictions

    # Output
    why_text: Optional[str]          # Root cause explanation
    what_text: Optional[str]         # Recommended action
    rupees_impact: Optional[float]   # Profit simulation result
    response_text: Optional[str]     # Full response for TTS
    alert_triggered: Optional[bool]  # Should save as alert?
```

**Graph Nodes**:
1. `intent_classifier` → classifies query type (why/what/invoice/alert/forecast)
2. `sales_fetcher` → pulls SQLite sales data (parallel)
3. `market_fetcher` → reads Agmarknet in-memory cache (parallel)
4. `response_generator` → calls Groq with structured prompt + context → streams output

**Graph Edges**:
```
START → intent_classifier
intent_classifier → [sales_fetcher, market_fetcher]  (parallel fan-out)
[sales_fetcher, market_fetcher] → response_generator  (fan-in)
response_generator → END
```

---

## 4. API Endpoints

---

### POST /api/auth/register
**Purpose**: Create new owner account + shop

**Request Body**:
```json
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
```

**Response (201)**:
```json
{
  "access_token": "eyJ...",
  "user": { "id": 1, "name": "Ramesh Kumar", "city": "Nagpur" },
  "shop": { "id": 1, "shop_name": "Ramesh Kirana Store" }
}
```

**Side Effects**: Seeds benchmark data; triggers Agmarknet fetch for district

**Errors**: 400 (validation), 409 (phone exists)

---

### POST /api/auth/login
**Purpose**: Authenticate and return JWT

**Request Body**: `{ "phone": "9876543210", "password": "pass123" }`

**Response (200)**:
```json
{ "access_token": "eyJ...", "user": {...}, "shop": {...} }
```

**Errors**: 401 (invalid credentials)

---

### POST /api/voice/query
**Purpose**: Core voice Q&A endpoint — takes transcript, returns structured AI response

**Auth Required**: Yes (Bearer token)

**Request Body**:
```json
{
  "transcript": "Chawal ki bikri kyun gir rahi hai?",
  "language": "hi"
}
```

**Response (200)** — Streaming (text/event-stream):
```json
{
  "why_text": "Competitor ₹2 sasta kar raha hai",
  "what_text": "5kg+1kg combo offer dein",
  "rupees_impact": 1400,
  "response_text": "Chawal ki bikri isliye giri kyunki...",
  "alert_id": null
}
```

**Streaming Behavior**: First token arrives ~800ms; frontend fires TTS immediately

---

### POST /api/voice/stt
**Purpose**: Proxy to Sarvam STT (keeps API key server-side)

**Auth Required**: Yes

**Request**: `multipart/form-data` with `audio` file (webm/wav)

**Response (200)**:
```json
{ "transcript": "Chawal ki bikri kyun gir rahi hai", "language_detected": "hi" }
```

---

### POST /api/voice/tts
**Purpose**: Proxy to Sarvam TTS

**Auth Required**: Yes

**Request Body**: `{ "text": "Ramesh ji, aaj mandi mein...", "language": "hi", "voice": "meera" }`

**Response**: `audio/wav` binary stream

---

### GET /api/dashboard
**Purpose**: Dashboard data — top products, active alerts, market summary

**Auth Required**: Yes

**Response (200)**:
```json
{
  "top_products": [
    { "id": 1, "name": "Chawal", "trend_pct": -22, "selling_price": 42, "mandi_price": 39 }
  ],
  "active_alerts": [
    { "id": 1, "product": "Chawal", "type": "sales_drop", "severity": "high", "message": "22% drop" }
  ],
  "market_summary": {
    "last_updated": "2026-03-27T10:00:00",
    "district": "Nagpur",
    "prices": [ { "commodity": "Rice", "modal_price": 39, "unit": "kg" } ]
  },
  "data_maturity_days": 14
}
```

---

### POST /api/sales/entry
**Purpose**: Log daily sales (voice, manual, or CSV row)

**Auth Required**: Yes

**Request Body**:
```json
{
  "entries": [
    { "product_id": 1, "entry_date": "2026-03-27", "quantity_sold": 30, "revenue": 1260 },
    { "product_id": 2, "entry_date": "2026-03-27", "quantity_sold": 15, "revenue": 600 }
  ],
  "source": "voice"
}
```

**Response (201)**: `{ "saved": 2, "retrain_triggered": true }`

**Side Effects**: Increments `data_maturity_days`; triggers async ML retrain if entry count % 5 == 0

---

### POST /api/onboard/csv
**Purpose**: Upload CSV/Excel for bulk historical data import

**Auth Required**: Yes

**Request**: `multipart/form-data` with `file` (.csv / .xlsx)

**Response (200)**:
```json
{
  "rows_detected": 180,
  "columns_mapped": { "date": "Date", "product": "Item", "qty": "Qty", "revenue": "Amount" },
  "preview": [ {...}, {...}, {...} ],
  "import_ready": true
}
```

---

### POST /api/onboard/csv/confirm
**Purpose**: Confirm import after user reviews column mapping

**Request Body**: `{ "column_mapping": {...}, "confirm": true }`

**Response (200)**: `{ "rows_imported": 180, "products_created": 5, "ml_training": "started" }`

---

### POST /api/onboard/ocr
**Purpose**: Process bill photo via Groq Vision OCR

**Request**: `multipart/form-data` with `image` file (jpg/png/webp, max 5MB)

**Response (200)**:
```json
{
  "extracted": [
    { "product": "Rice", "quantity": 50, "unit": "kg", "unit_price": 38, "total": 1900 }
  ],
  "confidence": 0.87,
  "raw_text": "..."
}
```

---

### POST /api/invoice/generate
**Purpose**: Generate GST invoice from parsed voice command

**Auth Required**: Yes

**Request Body**:
```json
{
  "customer_name": "Ramu",
  "items": [
    { "product_id": 1, "quantity": 50, "unit": "kg", "unit_price": 39 }
  ]
}
```

**Response (201)**:
```json
{
  "invoice_number": "BV-2026-001",
  "total": 1950,
  "cgst": 48.75,
  "sgst": 48.75,
  "pdf_url": "/api/invoice/1/pdf"
}
```

---

### GET /api/invoice/:id/pdf
**Purpose**: Download invoice PDF

**Auth Required**: No (public shareable link)

**Response**: `application/pdf` binary

---

### GET /api/forecast/:product_id
**Purpose**: Get 7-day + 30-day forecast for a product

**Auth Required**: Yes

**Response (200)**:
```json
{
  "product": "Chawal",
  "forecast_7d": [
    { "date": "2026-03-28", "predicted_qty": 28.4, "lower": 22.1, "upper": 34.7 }
  ],
  "forecast_30d": [...],
  "is_anomaly": true,
  "anomaly_pct": -22.3
}
```

---

### GET /api/market/prices
**Purpose**: Get current mandi prices for shop's city

**Auth Required**: Yes

**Response (200)**:
```json
{
  "district": "Nagpur",
  "last_updated": "2026-03-27T08:00:00",
  "prices": [
    { "commodity": "Rice", "modal_price": 39, "min": 37, "max": 41, "unit": "Quintal" }
  ]
}
```

---

## 5. Authentication & Authorization

### JWT Token Structure
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

### Public Routes (no auth)
- `GET /` (health check)
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/invoice/:id/pdf`

### Authenticated Routes
- All `/api/voice/*`
- All `/api/sales/*`
- All `/api/onboard/*`
- All `/api/dashboard`
- All `/api/forecast/*`
- All `/api/market/*`
- `POST /api/invoice/generate`

---

## 6. Data Validation Rules

```python
# Phone: Indian mobile format
phone_regex = r'^[6-9]\d{9}$'

# Password: min 6 chars (kirana owner — keep simple)
password_min_length = 6

# Sales quantity: must be positive, max 10,000
# Revenue: must be positive, max 1,000,000
# Category: must be in ['grains','dairy','fmcg','vegetables','spices','beverages']
# Language: must be in ['hi','te','en']
```

---

## 7. Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Phone number is invalid",
    "details": [{ "field": "phone", "message": "Must be 10 digits starting with 6-9" }]
  }
}
```

### Error Codes
- `VALIDATION_ERROR`: 400
- `UNAUTHORIZED`: 401
- `FORBIDDEN`: 403
- `NOT_FOUND`: 404
- `CONFLICT`: 409 (phone already registered)
- `AI_ERROR`: 503 (Groq/Sarvam unavailable)
- `RATE_LIMITED`: 429

---

## 8. Caching Strategy

### In-Memory Cache (cachetools TTLCache)
- `agmarknet:{district}:{commodity}` → TTL: 4 hours
- `tavily:{product}:{city}` → TTL: 4 hours
- `tts:{text_hash}` → TTL: 24 hours (repeated phrases like greetings)
- `forecast:{shop_id}:{product_id}` → TTL: 1 hour

### Cache Invalidation
- Agmarknet: Invalidated by APScheduler every 4h
- Forecast: Invalidated on new sales_entry saved
- Market price: Invalidated on user_report competitor price update

---

## 9. ML Model Details

### XGBoost Sales Forecaster
```python
FEATURES = [
    'day_of_week',        # 0-6
    'month',              # 1-12
    'week_of_year',       # 1-52
    'lag_1',              # Sales t-1
    'lag_7',              # Sales t-7 (same day last week)
    'lag_30',             # Sales t-30 (same day last month)
    'rolling_mean_7',     # 7-day average
    'rolling_mean_30',    # 30-day average
    'price_delta',        # % change in own price vs last week
    'competitor_price_delta',  # % below/above market price
    'is_festival',        # Binary: festival season flag
    'category_benchmark', # Category average (cold start)
]

XGBOOST_PARAMS = {
    'n_estimators': 100,
    'max_depth': 4,
    'learning_rate': 0.1,
    'objective': 'reg:squarederror',
    'tree_method': 'hist',  # Fast for small datasets
}
```

### Risk Alert Logic
```python
def check_anomaly(actual: float, forecast: float) -> tuple[bool, float]:
    deviation = (actual - forecast) / forecast
    is_anomaly = deviation < -0.20  # 20% below forecast
    return is_anomaly, deviation * 100
```

### Cold Start Benchmark (seeded on Day 0)
```python
CATEGORY_BENCHMARKS = {
    'grains':     { 'daily_qty_kg': 50, 'daily_revenue': 1800 },
    'dairy':      { 'daily_qty_litre': 30, 'daily_revenue': 1200 },
    'fmcg':       { 'daily_revenue': 2500 },
    'vegetables': { 'daily_qty_kg': 40, 'daily_revenue': 800 },
}
```

### Profit Simulation Formula
```python
PRICE_ELASTICITY = 1.3  # Conservative grocery elasticity

def simulate_profit(
    current_price: float,
    new_price: float,
    current_qty: float,
    cost_price: float
) -> float:
    price_change_pct = (new_price - current_price) / current_price
    new_qty = current_qty * (1 - PRICE_ELASTICITY * price_change_pct)
    new_revenue = new_qty * new_price
    new_profit = (new_price - cost_price) * new_qty
    current_profit = (current_price - cost_price) * current_qty
    return new_profit - current_profit  # ₹ delta per day
```

---

## 10. Background Jobs (APScheduler)

```python
scheduler.add_job(
    refresh_agmarknet_prices,
    'interval', hours=4,
    id='agmarknet_refresh'
)

scheduler.add_job(
    refresh_tavily_cache,
    'interval', hours=4,
    id='tavily_cache'
)

scheduler.add_job(
    check_and_fire_alerts,
    'cron', hour='6,18',  # 6 AM and 6 PM daily
    id='alert_checker'
)
```

---

## 11. Folder Structure

```
bizvaani-backend/
├── main.py                    # FastAPI app entry
├── requirements.txt
├── .env
├── bizvaani.db                # SQLite (gitignored)
│
├── api/
│   ├── auth.py                # /api/auth/*
│   ├── voice.py               # /api/voice/*
│   ├── dashboard.py           # /api/dashboard
│   ├── sales.py               # /api/sales/*
│   ├── onboard.py             # /api/onboard/*
│   ├── invoice.py             # /api/invoice/*
│   ├── forecast.py            # /api/forecast/*
│   └── market.py              # /api/market/*
│
├── agent/
│   ├── graph.py               # LangGraph StateGraph definition
│   ├── nodes.py               # intent_classifier, sales_fetcher, market_fetcher, response_generator
│   ├── state.py               # ShopState TypedDict
│   └── prompts.py             # System prompt template
│
├── ml/
│   ├── forecaster.py          # XGBoost train + predict
│   ├── anomaly.py             # Risk alert detection
│   ├── simulation.py          # Profit simulation engine
│   └── models/                # Saved .joblib model files
│
├── services/
│   ├── agmarknet.py           # Agmarknet API client + cache
│   ├── tavily_service.py      # Tavily background search
│   ├── sarvam_stt.py          # STT proxy
│   ├── sarvam_tts.py          # TTS proxy
│   ├── groq_client.py         # Groq LLM client (streaming)
│   └── invoice_generator.py   # ReportLab PDF
│
├── models/                    # SQLAlchemy DB models
│   ├── user.py
│   ├── shop.py
│   ├── product.py
│   ├── sales_entry.py
│   ├── market_price.py
│   ├── ml_forecast.py
│   └── invoice.py
│
├── db/
│   ├── database.py            # Async engine + session
│   └── seed.py                # Benchmark data seeder
│
└── scheduler/
    └── jobs.py                # APScheduler job definitions
```
