# Application Flow Documentation
## BizVaani — Voice-First AI Business Coach

---

## 1. Entry Points

### Primary Entry Points
- **Direct URL / PWA**: User opens `bizvaani.vercel.app` → if not registered → Onboarding; if registered → Dashboard
- **PWA Install Prompt**: "Add to Home Screen" on Android Chrome — app opens fullscreen with no browser bar
- **Deep Links**: Shared invoice link opens `/invoice/:id` directly (public, no auth)

### Secondary Entry Points
- **Cold Start Voice Button**: Landing page has one giant mic button — user can speak before registering
- **Push Notification (P1)**: Risk alert triggers → user taps notification → opens app at alert screen

---

## 2. Core User Flows

---

### Flow 1: First-Time Onboarding (Zero Data)

**Goal**: Register shop, get first useful AI response in < 5 minutes
**Entry Point**: Landing page `/`
**Frequency**: Once per owner

#### Happy Path
1. **Screen: Landing (`/`)**
   - Elements: BizVaani logo, tagline in Hindi, giant mic button, "Shuru karein" CTA
   - User Action: Taps "Shuru karein"
   - Trigger: Navigate to `/onboard`

2. **Screen: Onboard Step 1 — Shop Info (`/onboard`)**
   - Elements: Name input, city dropdown (Hindi), category multi-select (Grains/Dairy/FMCG/Vegetables)
   - User Action: Fills name + city + category OR speaks: "Mera naam Ramesh hai, main Nagpur mein chawal bechta hoon"
   - System: Parses voice, pre-fills fields
   - Trigger: Tap "Aage" (Next)

3. **Screen: Onboard Step 2 — Data Path Selection**
   - Elements: 3 option cards
     - 📷 Bill photo (OCR)
     - 📊 Start with averages (benchmark)
     - 🎙️ I'll tell daily (voice entry)
   - User Action: Selects one option (or skips)
   - Trigger: Navigate to selected path OR skip to dashboard

4. **System Action**: Seed benchmark data for selected category; call Agmarknet API for city

5. **Screen: Dashboard (`/dashboard`)**
   - First voice greeting: "Ramesh ji, aaj Nagpur mandi mein chawal ₹39/kg chal raha hai. Kya jaanna chahte hain?"
   - Success State: Owner is registered, market data loaded, voice ready

#### Error States
- **City not in Agmarknet coverage**: Use nearest available district; show "Nearest: Nagpur data"
- **Voice parsing fails**: Fallback to manual text fields
- **Network error on seed**: Use hardcoded FMCG benchmark; retry Agmarknet on next open

#### Edge Cases
- Owner closes app mid-onboarding → Save step progress in localStorage; show "Aapka registration adha hua hai" on return
- Owner speaks in mixed Hindi-English: Sarvam handles code-switching natively

---

### Flow 2: Voice Q&A (Core Loop)

**Goal**: Ask a business question, get spoken answer with WHY + WHAT + ₹
**Entry Point**: Dashboard mic button or wake phrase detection
**Frequency**: Multiple times daily

#### Happy Path
1. **Screen: Dashboard (`/dashboard`)**
   - User Action: Taps mic button OR system detects wake phrase
   - Visual: Mic icon pulses, waveform animation starts

2. **System: STT** — Sarvam Saarika v2.5 captures speech (streaming)
   - Output: Transcribed text appears on screen in real time

3. **System: LangGraph Agent** — Parallel execution
   - Node 1: Fetch sales data from SQLite (shop-specific)
   - Node 2: Read Agmarknet cache for relevant product + city
   - Both run simultaneously (fan-out pattern)

4. **System: Groq LLaMA 3.3 70B** — Generates response (streaming)
   - First sentence arrives in ~800ms
   - TTS fires on first sentence — user hears response before full text is generated

5. **System: TTS** — Sarvam Bulbul v2 streams audio
   - User hears first sentence ≈ 1.4s after speaking

6. **Screen: Response Card**
   - WHY section (root cause)
   - WHAT section (recommended action)
   - ₹ IMPACT number (animated counter)
   - "Aage kya karein?" button

#### Error States
- **STT timeout** (5s no speech): Show "Dobara bolein" prompt
- **LLM error**: Fallback response: "Abhi server mein thodi pareshani hai, 1 minute mein dobara try karein"
- **No relevant data**: "Aapke paas abhi itna data nahi hai. Kya aap aaj ki bikri bol sakte hain?"

#### Decision Points
```
IF shop_data EXISTS (> 7 days)
  THEN use XGBoost forecast + real sales for WHY analysis
ELSE IF shop_data EXISTS (1-7 days)
  THEN blend 30% real + 70% benchmark
ELSE
  THEN use 100% benchmark + market intelligence only
```

---

### Flow 3: Risk Alert Response

**Goal**: Owner taps alert, understands risk, takes action
**Entry Point**: Alert banner on dashboard OR push notification
**Frequency**: Triggered automatically when anomaly detected

#### Happy Path
1. **Alert Banner appears**: "⚠️ Chawal ki bikri 22% giri — jaanna chahte hain kyun?"
2. User taps banner → System auto-asks the WHY question
3. LangGraph fetches: sales anomaly data + competitor price delta + Agmarknet
4. Voice response: "Competitor ₹2 sasta kar raha hai. Combo offer dein — ₹1,400 extra milega"
5. Profit simulation animates on screen
6. Owner taps "Combo Offer Lagao" → action logged

#### Error States
- Alert fires but data is stale (> 24h): Show "Data purana hai, aaj ki bikri update karein"

---

### Flow 4: CSV Upload (Post-Onboarding)

**Goal**: Owner with Excel/CSV history gets ML-powered insights synced to their profile
**Entry Point**: Dashboard Settings / Profile Menu → "Upload Old Records (CSV/Excel)"

#### Happy Path
1. File picker opens → Owner selects file
2. System reads first 5 rows → shows preview table → "Kya ye sahi hai?"
3. Column mapping: system auto-detects Date, Product, Quantity, Price columns
4. If auto-detect fails → manual mapping with dropdown labels
5. Upload confirmed → XGBoost model trained in background
6. Dashboard reloads with updated 7-day forecast chart and historical data

#### Validation Rules
- Accepted formats: `.csv`, `.xlsx`, `.xls`
- Max file size: 10MB
- Required columns: Date + at least one of (Product, Quantity, Price)
- Date format auto-detected (DD/MM/YYYY, YYYY-MM-DD, etc.)

---

### Flow 5: Bill Photo OCR

**Goal**: Owner photographs paper bill; system extracts and logs inventory
**Entry Point**: Onboard Step 2 OR daily "+ Add Stock" button

#### Happy Path
1. Camera opens (or gallery picker)
2. Owner photographs purchase bill
3. Groq Vision (LLaMA 3.2 Vision) extracts: product names, quantities, unit prices, total
4. Extracted table shown for confirmation: "Kya ye sahi hai?"
5. Owner corrects any OCR errors (tap to edit)
6. Confirmed → inventory logged to DB

#### Error States
- **Blurry image**: "Thodi saaf photo lijiye" with camera re-open
- **OCR confidence < 60%**: Show raw extraction + ask manual confirmation for each row

---

### Flow 6: Daily Voice Entry

**Goal**: Owner speaks end-of-day sales; system logs without any typing
**Entry Point**: Daily reminder notification OR "Aaj ki bikri" button

#### Happy Path
1. Screen shows: "Aaj kya kya bika?"
2. Owner speaks: "Chawal 30kg, dal 15kg, tel 10 bottles"
3. System transcribes + parses into structured JSON
4. Confirmation card shown: "Aaj ka total ₹4,230. Sahi hai?"
5. Owner: "Haan" → logged to DB
6. ML model retrains with new data point

---

### Flow 7: GST Invoice Generation

**Goal**: Generate valid GST invoice from one voice command
**Entry Point**: "Invoice banao" button OR voice command from anywhere

#### Happy Path
1. Owner speaks: "Ramu ke liye 50kg chawal ₹1,950 ka invoice banao"
2. System extracts: customer=Ramu, product=chawal, qty=50kg, amount=₹1,950
3. GST calculated (5% for grains); HSN code auto-looked up
4. Preview shown: invoice card with all fields
5. "Download karo" → ReportLab generates PDF → download link
6. "Share karo" → WhatsApp pre-filled (P1)

#### Validation
- Amount must be numeric; product must match known inventory items (or accept free-text)
- GSTIN required for B2B invoices; system prompts if not set

---

### Flow 8: Competitor Price Update (Crowdsourced)

**Goal**: Owner reports competitor price; feeds into network intelligence
**Entry Point**: "Competitor ka bhav batao" button

#### Happy Path
1. Owner speaks: "Saamne wali dukan ne chawal ₹37 kar diya"
2. System: product=chawal, competitor_price=₹37, source=user_report
3. Stored anonymously with city+product key
4. Confidence-weighted into market price for all nearby shops
5. If delta > threshold → triggers risk alert for other shops silently

---

## 3. Navigation Map

```
/ (Landing)
├── /onboard (Step 1: Shop Info → Step 2: Data Path)
│   ├── /onboard/ocr
│   └── /onboard/voice
│
├── /dashboard (Auth required)
│   ├── Voice Q&A (modal/overlay)
│   ├── /alerts (Risk alert list)
│   ├── /forecast (7-day + 30-day charts)
│   ├── /inventory (Stock list + add)
│   └── /invoice (Invoice generator)
│       └── /invoice/:id (Public — shareable PDF link)
│
└── /settings (Auth required)
    ├── Shop profile
    ├── GSTIN setup
    ├── Upload Records (CSV/Excel)
    └── Language preference
```

---

## 4. Screen Inventory

| Screen | Route | Access | Purpose | Key Elements |
|--------|-------|--------|---------|--------------|
| Landing | `/` | Public | First impression + CTA | Logo, Hindi tagline, mic button, "Shuru karein" |
| Onboard | `/onboard` | Public | Register shop + choose data path | Step indicator, form fields, voice input |
| Dashboard | `/dashboard` | Auth | Main hub | Mic button, top-5 products, alert banner, quick actions |
| Voice Modal | Overlay | Auth | Live voice Q&A | Waveform, transcript text, response card, ₹ simulation |
| Alerts | `/alerts` | Auth | Review all risk alerts | Alert list, severity badges, "Ask BizVaani" per alert |
| Forecast | `/forecast` | Auth | 7/30-day demand charts | Line chart, confidence bands, product selector |
| Inventory | `/inventory` | Auth | View/add stock | Table, "+ Add" (voice/OCR/manual), search |
| Invoice | `/invoice` | Auth | Generate GST invoices | Voice trigger, preview card, download/share |
| Invoice View | `/invoice/:id` | Public | View/share invoice | PDF preview, download button |
| Settings | `/settings` | Auth | Profile + GSTIN + language | Form fields, save button |

---

## 5. Decision Points

### Authentication Check
```
IF user has valid JWT token
  THEN render requested page
ELSE IF page is public (/invoice/:id, /)
  THEN render normally
ELSE
  THEN redirect to /onboard
```

### Data Maturity Routing
```
IF shop_data.days >= 15
  THEN use XGBoost (full ML mode)
ELSE IF shop_data.days >= 8
  THEN blend: 50% real + 50% benchmark
ELSE IF shop_data.days >= 1
  THEN blend: 30% real + 70% benchmark
ELSE
  THEN use 100% benchmark + market intelligence
```

### Cold Start Path
```
IF csv_uploaded
  THEN immediate ML mode
ELSE IF ocr_bills_count >= 3
  THEN partial ML mode
ELSE IF voice_entries >= 1
  THEN voice-seeded mode
ELSE
  THEN benchmark mode (default)
```

### Risk Alert Threshold
```
IF (actual_sales / forecast_sales) < 0.80 FOR 2+ consecutive days
  THEN fire risk alert
  AND call LangGraph WHY analysis
  AND push notification if PWA installed
```

---

## 6. Error Handling Flows

### 404 Not Found
- Display: Hindi 404 — "Yeh page nahi mila"
- Actions: "Dashboard pe jaao" button

### API Error (Sarvam / Groq / Agmarknet)
- STT fails: "Dobara bolein" prompt with retry button
- LLM fails: Cached response template + "Live AI thodi der mein wapas aayega"
- Agmarknet fails: Show cached price with "Kal ka bhav" label

### Network Offline
- Show orange offline banner: "Network nahi hai — purana data dikha raha hai"
- All cached prices and last forecast still visible
- Voice Q&A disabled with "Internet chahiye" message

---

## 7. Responsive Behavior

### Mobile (Primary — 360px+)
- Bottom nav bar (Dashboard, Alerts, Inventory, Invoice)
- Mic button floats center-bottom (FAB style)
- Cards stack vertically
- Font: 16px minimum for readability

### Tablet (768px+)
- Side nav replaces bottom bar
- Two-column card grid on dashboard
- Larger mic button

### Desktop (1024px+)
- Full sidebar nav
- Three-column layout on dashboard
- Voice still primary; keyboard fallback available

---

## 8. Animation & Transitions

| Interaction | Animation | Duration |
|-------------|-----------|----------|
| Page navigation | Fade in/out | 200ms |
| Mic button press | Scale 0.95 + pulse ring | 300ms loop |
| Voice waveform | Real-time amplitude bars | Live |
| ₹ Impact counter | Count-up animation | 800ms ease-out |
| Alert banner | Slide down from top | 250ms |
| Risk alert card | Shake once on appear | 400ms |
| Invoice generation | Progress bar + checkmark | 2s |
