# Product Requirements Document (PRD)
## BizVaani — Voice-First AI Business Coach for Kirana Owners

- **Project Title**: BizVaani
- **Version**: 1.0
- **Last Updated**: 2026-03-27
- **Owner**: Pankaj Yadav / BizVaani Team

---

## 2. Problem Statement

63 million kirana and small retail shop owners in India operate their businesses entirely verbally — no digital records, no pricing intelligence, no demand forecasting. Existing tools (Zoho, Tally, Shopify) are too complex, too English-heavy, and too screen-dependent for Tier 2/3 city shop owners. One wrong inventory decision causes days of loss with no way to know why it happened or how to fix it.

---

## 3. Goals & Objectives

### Business Goals
- Demonstrate AI + vernacular voice as a viable product for Indian MSMEs
- Win hackathon with demo that judges can visibly understand within 3 minutes
- Prove market intelligence (Agmarknet + Tavily) + ML forecasting works with zero user data on Day 1

### User Goals
- Ask business questions in Hindi/Telugu and get spoken answers
- Understand WHY a product's sales dropped and WHAT to do
- See ₹ profit/loss impact before taking any action
- Register a shop and start getting value in under 5 minutes — no CSV required

---

## 4. Success Metrics
- Voice response latency: < 1.5 seconds perceived (target: 0.4s with streaming)
- Cold start: Useful market intelligence available on Day 1, zero personal data needed
- Onboarding: Owner can register, ask first question, get spoken answer in < 5 minutes
- Demo: Judges understand value proposition within first 90 seconds
- Accuracy: ML price/sales forecasts within ±15% of actual (Day 15+ with real data)

---

## 5. Target Users & Personas

### Primary Persona: Ramesh — Kirana Shop Owner
- **Demographics**: Male, 35–55, Tier 2/3 city, Class 10–12 education, Hindi/Telugu speaking
- **Pain Points**: No visibility into why sales drop, gets shocked by competitor price cuts, orders too much/too little stock, no trusted advisor for business decisions
- **Goals**: Know what's selling, avoid dead stock, not lose customers to competitor
- **Technical Proficiency**: Uses WhatsApp daily, can speak into phone, cannot type fast, no laptop

### Secondary Persona: Sunita — Grain Trader / Sabzi Dealer
- **Demographics**: Female, 28–45, APMC market or roadside vendor, Telugu/Hindi
- **Pain Points**: Wholesale price fluctuates daily, doesn't know Agmarknet exists, tracks sales in a notebook
- **Goals**: Know today's mandi price before buying stock, understand best day to sell
- **Technical Proficiency**: Owns smartphone, uses voice messages on WhatsApp, no app experience

---

## 6. Features & Requirements

### Must-Have Features (P0)

1. **Voice Q&A in Hindi/Telugu**
   - Description: Owner speaks a business question; system responds in their language by voice
   - User Story: As a kirana owner, I want to ask why my chawal sales dropped so I can fix it today
   - Acceptance Criteria:
     - [ ] STT captures Hindi/Telugu speech using Sarvam Saarika v2.5
     - [ ] LangGraph agent processes query and fetches context
     - [ ] TTS responds using Sarvam Bulbul v2 within 1.5s perceived latency
     - [ ] Response includes WHY (root cause) + WHAT (action) + ₹ impact
   - Success Metric: < 1.5s perceived response time; owner gets actionable answer

2. **Market Intelligence (Live Prices)**
   - Description: System knows current wholesale mandi prices and nearby retail prices
   - User Story: As a shop owner, I want to know today's market rate so I don't overprice
   - Acceptance Criteria:
     - [ ] Agmarknet API called by background scheduler (APScheduler), cached by product+city
     - [ ] Tavily web search runs in background, never in live response path
     - [ ] Price data refreshed every 4 hours
     - [ ] Works from Day 1 with zero owner data
   - Success Metric: Price data available for 50+ commodities across major APMC markets

3. **Sales Forecasting + Risk Alerts**
   - Description: XGBoost model predicts 7-day/30-day demand; auto-alerts when anomaly detected
   - User Story: As a shop owner, I want to know when a product's sales are dropping before it's too late
   - Acceptance Criteria:
     - [ ] XGBoost model trained on available shop data (or benchmark if cold start)
     - [ ] Risk alert fires when actual sales deviate > 20% from forecast
     - [ ] Alert delivered via voice on next app open
   - Success Metric: Alert triggers within 24 hours of anomaly; < 20% false positive rate

4. **Profit Simulation (₹ Impact)**
   - Description: Before any action, owner sees how much money they will make/save
   - User Story: As a shop owner, I want to see ₹1,400 extra profit if I run a combo offer
   - Acceptance Criteria:
     - [ ] Simulation uses price elasticity model (default: 1.3 for grocery)
     - [ ] Shows current profit vs projected profit with action
     - [ ] Displayed as animated number on screen + spoken by TTS
   - Success Metric: Simulation runs in < 200ms locally

5. **Zero-Data Cold Start**
   - Description: New owner with no digital records gets immediate value from Day 1
   - Acceptance Criteria:
     - [ ] Path A: CSV upload (structured data)
     - [ ] Path B: Bill photo OCR via Groq Vision
     - [ ] Path C: Category benchmark seeding (FMCG averages)
     - [ ] Path D: Voice-first daily entry (owner speaks daily sales)
     - [ ] Market intelligence (Agmarknet) works with zero personal data
   - Success Metric: First useful response delivered < 5 min after registration

6. **GST Invoice by Voice**
   - Description: Owner says "Ramu ke liye ₹500 ka invoice bana do"; system generates PDF invoice
   - Acceptance Criteria:
     - [ ] Invoice generated using ReportLab
     - [ ] Contains GST-compliant fields: GSTIN, HSN code, tax breakdown
     - [ ] PDF downloadable in < 3 seconds
   - Success Metric: Valid GST invoice generated from one voice command

### Should-Have Features (P1)
1. **Bill Photo OCR** — Owner photographs paper bill; system extracts product names, quantities, prices
2. **Daily Voice Entry** — Owner speaks end-of-day sales summary; system logs to database
3. **Competitor Price Crowdsourcing** — Owners in same area (anonymized) share price updates
4. **Hindi/Telugu Dashboard** — Visual summary card of top 5 products with risk indicators

### Nice-to-Have Features (P2)
1. **WhatsApp Integration** — Receive alerts and ask questions via WhatsApp
2. **Multi-language Expansion** — Marathi, Tamil, Kannada
3. **Supplier Recommendations** — AI recommends cheapest supplier for replenishment
4. **Seasonal Demand Calendar** — Pre-seeded patterns for festivals (Diwali, Eid, harvest season)

---

## 7. Explicitly OUT OF SCOPE
- No payment processing or UPI integration
- No multi-store management in v1
- No B2B wholesale ordering
- No delivery/logistics management
- No employee management
- No customer loyalty program
- No web scraping in real-time response path (Tavily is background-only)
- No Kubernetes or production-grade DevOps (Railway + Vercel only)
- No iOS App Store / Google Play submission (PWA only)

---

## 8. User Scenarios

### Scenario 1: New Owner Cold Start (Voice-First)
- **Context**: Ramesh just downloaded app. Has no CSV. Uses phone.
- **Steps**:
  1. Opens app → sees voice button
  2. Speaks: "Mera naam Ramesh hai, main chawal aur dal bechta hoon"
  3. System seeds benchmark data for Grains category
  4. Agmarknet loads current mandi price for district
  5. Voice response: "Ramesh ji, aaj Nagpur mandi mein chawal ₹39/kg chal raha hai"
- **Expected Outcome**: First useful response in < 60 seconds, zero CSV
- **Edge Cases**: No internet → cached last known price with timestamp

### Scenario 2: Risk Alert + Profit Simulation
- **Context**: Ramesh has 14 days of daily entries. Sales drop detected.
- **Steps**:
  1. App notifies: "Chawal ki bikri 22% gir gayi hai"
  2. Ramesh asks: "Kyun?"
  3. BizVaani: "Competitor ₹2 sasta kar raha hai. 5kg+1kg combo offer dein"
  4. Profit simulation animates: "₹1,400 extra is hafte"
  5. Ramesh says: "Theek hai, combo chalao"
- **Expected Outcome**: Owner acts with confidence, profit improves
- **Edge Cases**: Competitor data stale → show confidence percentage

### Scenario 3: GST Invoice Generation
- **Context**: Owner needs to give invoice to wholesale buyer
- **Steps**:
  1. Owner speaks: "Ramu ke liye 50kg chawal ka invoice banao ₹1,950 mein"
  2. System parses: customer=Ramu, product=chawal, qty=50kg, amount=₹1,950
  3. GST calculated, PDF generated
  4. Download link shown + invoice spoken back for confirmation
- **Expected Outcome**: Valid GST PDF in < 3 seconds
- **Edge Cases**: GSTIN not set up → prompt owner to add it in settings

---

## 9. Dependencies & Constraints
- **API Dependencies**: Sarvam AI (STT/TTS), Groq (LLM), Agmarknet (market data), Tavily (web search)
- **Free Tier Limits**: Groq 14,400 req/day; Tavily 1,000 searches/month; Sarvam pay-as-you-go
- **Technical Constraints**: Must run on mobile PWA; voice pipeline must be < 1.5s perceived latency
- **Business Constraints**: Hackathon sprint (36 hours); 3-minute demo constraint
- **Connectivity**: Must degrade gracefully on 2G/3G (cache last known prices)

---

## 10. Timeline & Milestones
- **Hour 0–4**: Project setup, env, DB schema, LangGraph skeleton
- **Hour 4–12**: Voice pipeline (STT → LangGraph → TTS), Agmarknet integration
- **Hour 12–20**: ML forecasting (XGBoost), risk alerts, profit simulation
- **Hour 20–28**: Frontend (Next.js PWA), cold start flows, invoice generation
- **Hour 28–34**: Integration testing, latency fixes, demo polishing
- **Hour 34–36**: Final rehearsal, bug fixes, deploy

---

## 11. Risks & Assumptions

### Risks
- **Sarvam API rate limit**: Mitigation — cache TTS audio for repeated phrases
- **Agmarknet API downtime**: Mitigation — fallback to cached prices with timestamp shown
- **Groq latency spike**: Mitigation — streaming enabled, first sentence fires TTS immediately
- **Demo internet failure**: Mitigation — pre-cache 3 demo flows locally

### Assumptions
- Indian kirana owners will speak naturally into phone if UI is simple enough
- Benchmark FMCG data approximates real shop performance within ±25% (validated by plan)
- Agmarknet data available for demo district (Nagpur or Hyderabad)
- Price elasticity of 1.3 is reasonable for basic grocery categories

---

## 12. Non-Functional Requirements
- **Performance**: Voice response < 1.5s perceived; invoice PDF < 3s; page load < 2s on 4G
- **Security**: No PII in logs; JWT-based auth; HTTPS only
- **Accessibility**: Voice-first = accessible by default; screen text in Hindi/English
- **Scalability**: SQLite for hackathon; Postgres-ready schema for production
- **Offline Degradation**: Last cached price served with "as of [time]" label
