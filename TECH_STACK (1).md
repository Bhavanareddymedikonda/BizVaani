# Technology Stack Documentation
## BizVaani — Voice-First AI Business Coach

**Last Updated**: 2026-03-27 | **Version**: 1.0

### Architecture Pattern
- **Type**: Monolithic (hackathon); microservices-ready structure
- **Pattern**: API-first with LangGraph stateful agent
- **Deployment**: Vercel (frontend) + Railway (backend) + SQLite embedded DB

---

## 2. AI & Voice Layer (Core Differentiator)

### Speech-to-Text (STT)
- **Service**: Sarvam AI Saarika v2.5
- **Endpoint**: `https://api.sarvam.ai/speech-to-text`
- **Reason**: Best-in-class Hindi/Telugu/Hinglish recognition; built for Indian accents; 200ms streaming latency
- **Languages**: Hindi, Telugu, English, code-switching supported
- **Documentation**: https://docs.sarvam.ai/stt
- **Alternatives Rejected**: Whisper (English-biased, no Telugu), Google STT (too expensive)

### Text-to-Speech (TTS)
- **Service**: Sarvam AI Bulbul v2
- **Endpoint**: `https://api.sarvam.ai/text-to-speech`
- **Reason**: Natural Indian voice; Hindi + Telugu; low latency streaming
- **Voices**: Meera (Hindi female), Arjun (Hindi male), Pavithra (Telugu female)
- **Documentation**: https://docs.sarvam.ai/tts
- **Streaming**: Fires on first sentence (not full response) — critical for latency

### LLM
- **Model**: Groq LLaMA 3.3 70B Versatile
- **Client**: `groq==0.8.0` (Python SDK)
- **Speed**: 276 tokens/second (vs OpenAI ~40 tok/sec)
- **Free Tier**: 14,400 requests/day
- **Reason**: Speed is critical for voice pipeline; 70B quality; free tier adequate for hackathon
- **Streaming**: `stream=True` enabled — TTS fires on first chunk
- **Documentation**: https://console.groq.com/docs
- **Alternatives Rejected**: OpenAI GPT-4o (too slow for voice), Claude (no free tier)

### Vision LLM (OCR)
- **Model**: Groq LLaMA 3.2 11B Vision Preview
- **Use**: Bill photo OCR — extracts product/quantity/price from images
- **Endpoint**: Same Groq API, vision-capable model
- **Reason**: Free, fast, adequate for structured bill extraction

### AI Agent Framework
- **Framework**: LangGraph 0.2.x
- **Reason**: Stateful graph with parallel node execution; predictable demo behavior; better than basic LangChain agent
- **Pattern**: ShopState TypedDict → 4 nodes (intent_classifier, sales_fetcher, market_fetcher, response_generator)
- **Parallel Execution**: sales_fetcher + market_fetcher run simultaneously (fan-out)
- **Documentation**: https://langchain-ai.github.io/langgraph/

### Web Search (Background Only)
- **Service**: Tavily Search API
- **Client**: `tavily-python==0.3.x`
- **Free Tier**: 1,000 searches/month
- **Critical Rule**: NEVER called in live response path — runs in background via APScheduler
- **Use**: Market news, competitor product launches, seasonal demand signals
- **Cache**: Results cached by product+city, refreshed every 4 hours
- **Documentation**: https://docs.tavily.com

### Market Data API
- **Service**: Agmarknet (data.gov.in)
- **Endpoint**: `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070`
- **Auth**: Free API key from data.gov.in
- **Data**: Daily wholesale prices for 7,000+ APMC markets across India
- **Coverage**: 50+ commodities (chawal, dal, tel, gehu, pyaaz, tamatar...)
- **Refresh**: Background APScheduler job — every 4 hours
- **Reason**: Free, official government data, covers entire India, no scraping needed

### Background Scheduler
- **Library**: APScheduler 3.10.x
- **Use**: Agmarknet refresh every 4 hours; Tavily background search; ML model retraining
- **Pattern**: AsyncIOScheduler for non-blocking execution

---

## 3. Backend Stack

### Runtime & Framework
- **Language**: Python 3.11
- **Framework**: FastAPI 0.111.x
- **ASGI Server**: Uvicorn 0.30.x
- **Reason**: Async-native, perfect for WebSocket voice streaming, automatic OpenAPI docs
- **Documentation**: https://fastapi.tiangolo.com

### Database
- **Primary**: SQLite (hackathon) — single file, zero config
- **ORM**: SQLAlchemy 2.0.x with async support
- **File**: `bizvaani.db` in project root
- **Migration**: Alembic 1.13.x
- **Production Path**: PostgreSQL 16 (schema is identical — just change DATABASE_URL)
- **Reason**: SQLite is instant setup for hackathon; no separate DB server needed

### Caching (In-Memory)
- **Library**: `cachetools 5.3.x` (TTLCache)
- **Use**: Agmarknet prices (TTL: 4h), Tavily results (TTL: 4h), TTS audio (TTL: 24h for repeated phrases)
- **Reason**: No Redis needed for hackathon scale; in-memory cache sufficient

### ML Engine
- **Library**: XGBoost 2.0.x
- **Features**: day_of_week, month, lag_7, lag_30, price_delta, competitor_price_delta, is_festival
- **Scaler**: scikit-learn 1.4.x StandardScaler
- **Serialization**: joblib 1.3.x
- **Training Trigger**: After each 5 new daily entries
- **Reason**: Fast training (< 1 second on shop-scale data), interpretable, works on small datasets

### PDF Generation
- **Library**: ReportLab 4.1.x
- **Use**: GST invoice PDF generation
- **Template**: Hardcoded GST-compliant layout (GSTIN, HSN code, CGST/SGST breakdown)

### File Processing
- **CSV/Excel**: pandas 2.2.x + openpyxl 3.1.x
- **Image Processing**: Pillow 10.x (resize before sending to Groq Vision)

---

## 4. Frontend Stack

### Core Framework
- **Framework**: Next.js 14.2.x (App Router)
- **Language**: TypeScript 5.4.x
- **Reason**: Built-in API routes, SSR for fast desktop web load, App Router flexibility, Vercel deploy in 1 click
- **Documentation**: https://nextjs.org/docs

### UI Library
- **Framework**: React 18.3.x (bundled with Next.js)
- **Styling**: Tailwind CSS 3.4.x
- **Component Library**: shadcn/ui (Radix UI primitives)
- **Icons**: Lucide React 0.395.x

### State Management
- **Library**: Zustand 4.5.x
- **Stores**: `useVoiceStore` (mic state, transcript, response), `useShopStore` (shop data, alerts)
- **Reason**: Lightweight, no boilerplate, perfect for voice state management

### Voice Integration (Browser)
- **STT**: Web Speech API (fallback) OR custom WebSocket to backend Sarvam STT
- **TTS Audio**: HTML5 `<audio>` element streaming from Sarvam Bulbul
- **Waveform**: `wavesurfer.js 7.x` for mic amplitude visualization

### Charts
- **Library**: Recharts 2.12.x
- **Use**: 7-day/30-day demand forecast, sales trend, competitor price chart
- **Reason**: React-native, lightweight, good Hindi label support

### Web App Delivery
- **Config**: `next-pwa 5.6.x`
- **Manifest**: App icon, name in Hindi ("बिज़वाणी"), display: standalone
- **Primary Experience**: Desktop-first browser application
- **Responsive Strategy**: Tablet and mobile adapt from the desktop information architecture
- **Offline Support**: Cache last dashboard state for demo resilience where useful

### HTTP Client
- **Library**: Axios 1.7.x with interceptors for JWT refresh
- **WebSocket**: Native browser WebSocket for real-time voice streaming

---

## 5. DevOps & Infrastructure

### Version Control
- **Platform**: GitHub
- **Branch Strategy**: `main` (demo-ready), `dev` (working), `feature/*`

### Hosting
- **Frontend**: Vercel (free tier) — `vercel deploy`
- **Backend**: Railway (free tier) — auto-deploys from GitHub
- **Database**: SQLite file on Railway volume (persistent)
- **Reason**: Zero DevOps; both deploy from `git push`; no Kubernetes, no Docker Compose in prod

### CI/CD
- **Platform**: GitHub Actions
- **Workflow**: Push to `main` → auto-deploy to Vercel + Railway

### Monitoring (Minimal)
- **Logging**: Python `logging` module → Railway log viewer
- **Error Tracking**: Sentry (free tier) for critical voice pipeline errors only

---

## 6. Development Tools

### Code Quality
- **Python Linter**: Ruff 0.4.x (replaces flake8 + black)
- **Python Formatter**: Black 24.x
- **JS Linter**: ESLint 8.x with `eslint-config-next`
- **JS Formatter**: Prettier 3.3.x

### IDE
- **Editor**: VS Code with GitHub Copilot
- **Extensions**: Pylance, Tailwind IntelliSense, REST Client (for API testing)

---

## 7. Environment Variables

```bash
# ── AI / Voice ──────────────────────────────────
SARVAM_API_KEY="sk-sarvam-..."          # sarvam.ai console
GROQ_API_KEY="gsk_..."                  # console.groq.com
TAVILY_API_KEY="tvly-..."               # tavily.com

# ── Market Data ─────────────────────────────────
AGMARKNET_API_KEY="..."                 # data.gov.in API key (free)

# ── App ─────────────────────────────────────────
DATABASE_URL="sqlite:///./bizvaani.db"
JWT_SECRET="change-this-to-32-char-random-string"
JWT_EXPIRY_MINUTES=10080                # 7 days (hackathon — no refresh flow)
NEXT_PUBLIC_API_URL="http://localhost:8000"

# ── Scheduler ───────────────────────────────────
AGMARKNET_REFRESH_HOURS=4
TAVILY_CACHE_HOURS=4

# ── Demo Settings ───────────────────────────────
DEMO_CITY="Nagpur"
DEMO_DISTRICT="Nagpur"
DEMO_STATE="Maharashtra"
```

---

## 8. Dependencies Lock

### Backend (requirements.txt)
```
fastapi==0.111.0
uvicorn[standard]==0.30.1
sqlalchemy==2.0.30
alembic==1.13.1
pydantic==2.7.1
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.9
groq==0.8.0
tavily-python==0.3.3
apscheduler==3.10.4
xgboost==2.0.3
scikit-learn==1.4.2
pandas==2.2.2
openpyxl==3.1.2
reportlab==4.1.0
Pillow==10.3.0
cachetools==5.3.3
httpx==0.27.0
python-dotenv==1.0.1
joblib==1.4.0
```

### Frontend (package.json)
```json
{
  "next": "14.2.3",
  "react": "18.3.1",
  "react-dom": "18.3.1",
  "typescript": "5.4.5",
  "tailwindcss": "3.4.4",
  "zustand": "4.5.2",
  "axios": "1.7.2",
  "recharts": "2.12.7",
  "wavesurfer.js": "7.7.11",
  "lucide-react": "0.395.0",
  "next-pwa": "5.6.0",
  "@radix-ui/react-dialog": "1.0.5",
  "@radix-ui/react-toast": "1.1.5",
  "class-variance-authority": "0.7.0",
  "clsx": "2.1.1",
  "tailwind-merge": "2.3.0"
}
```

---

## 9. Security Considerations
- JWT tokens: 7-day expiry (hackathon simplification — no refresh flow)
- Passwords: bcrypt with 12 rounds (passlib)
- HTTPS: Enforced by Vercel + Railway
- CORS: Allowed only from Vercel domain in production
- Rate Limiting: 60 requests/minute per IP (FastAPI middleware)
- No PII in logs: User IDs only; no names/phone in log output
- API keys: Never exposed to frontend; all AI calls server-side only

---

## 10. Version Upgrade Policy
- Hackathon: Pin all versions; no updates during build sprint
- Post-hackathon: Monthly security patches via Dependabot
- Major upgrades: Test in `dev` branch first, then merge to `main`
