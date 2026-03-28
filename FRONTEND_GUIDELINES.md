# Frontend Design System & Guidelines
## BizVaani - Desktop-First Claymorphism Web App

---

## 1. Design Principles

1. **Web-First Desktop Experience**: Primary layout target is laptop and desktop web. Mobile remains responsive, but not the primary canvas.
2. **Claymorphism Visual Language**: Use soft extrusions, rounded surfaces, layered cards, warm light, and tactile controls.
3. **Voice-Augmented, Not Voice-Only**: Voice remains important, but the screen should stand alone as a rich business cockpit.
4. **Decision Clarity**: Every major panel should answer one business question clearly: what changed, why it changed, and what to do next.
5. **Trust Through Numbers**: Rupee impact, trend deltas, and forecast confidence must be prominent and easy to compare.

---

## 2. Design Direction

BizVaani should feel like a premium Indian business intelligence product, not a generic admin panel.

- Default viewport: desktop dashboard with persistent navigation, multi-column layout, and larger visual hierarchy
- Surface style: claymorphism with soft highlights, inset shadows, rounded cards, and warm tonal layers
- Brand tone: grounded, confident, business-forward
- Interaction style: tactile buttons, clear hover states, restrained motion

Avoid:

- flat white cards on plain backgrounds
- overly dark cyber UI
- pure mobile-app conventions as the primary layout model
- cramped analytics screens with too many equally weighted elements

---

## 3. Design Tokens

### Color Palette

#### Primary - Clay Orange
```css
--color-primary-50:  #fff7f0;
--color-primary-100: #ffe9d6;
--color-primary-200: #ffd0a8;
--color-primary-300: #ffb678;
--color-primary-400: #f89a4d;
--color-primary-500: #ea7a22;
--color-primary-600: #cf6416;
--color-primary-700: #ab4f12;
--color-primary-800: #893f13;
--color-primary-900: #6d3314;
```

#### Surface - Warm Clay Neutrals
```css
--color-surface-0: #f8f3ec;
--color-surface-1: #efe6db;
--color-surface-2: #e4d7c8;
--color-surface-3: #d6c3b0;
--color-surface-4: #bfa791;
--color-surface-5: #8f7764;
```

#### Accent
```css
--color-success: #2f9e5f;
--color-warning: #d68a1d;
--color-error:   #d64f45;
--color-info:    #3f78c7;
```

#### Text
```css
--color-text-strong: #241d17;
--color-text-base:   #4e4033;
--color-text-muted:  #7a6a5d;
--color-text-soft:   #9f9084;
```

### Typography

```css
--font-display: 'Syne', 'Inter', sans-serif;
--font-sans:    'Inter', system-ui, sans-serif;
--font-hindi:   'Noto Sans Devanagari', sans-serif;
--font-mono:    'JetBrains Mono', monospace;
```

#### Font Sizes
```css
--text-xs:   0.75rem;
--text-sm:   0.875rem;
--text-base: 1rem;
--text-lg:   1.125rem;
--text-xl:   1.25rem;
--text-2xl:  1.5rem;
--text-3xl:  1.875rem;
--text-4xl:  2.25rem;
--text-5xl:  3rem;
```

### Radius
```css
--radius-sm: 10px;
--radius-md: 18px;
--radius-lg: 24px;
--radius-xl: 32px;
--radius-pill: 999px;
```

### Shadows
```css
--shadow-clay: 8px 8px 18px rgba(146, 121, 96, 0.18), -8px -8px 18px rgba(255, 255, 255, 0.55);
--shadow-clay-inset: inset 3px 3px 6px rgba(146, 121, 96, 0.12), inset -3px -3px 6px rgba(255, 255, 255, 0.45);
--shadow-clay-soft: 0 10px 30px rgba(88, 66, 46, 0.12);
--shadow-glow-orange: 0 0 0 8px rgba(234, 122, 34, 0.12);
```

---

## 4. Layout System

### Primary Container
```css
max-width: 1440px;
margin: 0 auto;
padding: 0 32px;
```

### Responsive Breakpoints
```css
--breakpoint-sm:  640px;
--breakpoint-md:  768px;
--breakpoint-lg:  1024px;
--breakpoint-xl:  1280px;
--breakpoint-2xl: 1440px;
```

### Desktop Shell
```jsx
<div className="min-h-screen bg-[var(--color-surface-0)] text-[var(--color-text-strong)]">
  <Sidebar />
  <main className="ml-72 min-h-screen px-8 py-8">
    <Topbar />
    <section className="grid grid-cols-12 gap-6">{content}</section>
  </main>
</div>
```

### Tablet/Mobile Behavior

- Collapse the sidebar into a compact drawer
- Convert dense multi-column dashboards into a 2-column then 1-column grid
- Keep full analytics intact; do not redesign the whole product around bottom navigation

---

## 5. Component Guidance

### Clay Card
```jsx
<div className="rounded-[24px] bg-[var(--color-surface-1)] shadow-[var(--shadow-clay)] border border-white/40">
  {content}
</div>
```

### Primary Button
```jsx
<button className="
  rounded-[18px] px-5 py-3
  bg-[var(--color-primary-500)] text-white
  shadow-[var(--shadow-clay-soft)]
  transition-all duration-150
  hover:-translate-y-0.5 hover:bg-[var(--color-primary-600)]
  active:translate-y-0 active:shadow-none
">
  {label}
</button>
```

### Secondary Button
```jsx
<button className="
  rounded-[18px] px-5 py-3
  bg-[var(--color-surface-1)] text-[var(--color-text-base)]
  shadow-[var(--shadow-clay)]
  transition-all duration-150
">
  {label}
</button>
```

### Desktop Sidebar

- Persistent on desktop
- Contains primary routes: Dashboard, Alerts, Forecast, Invoice, Settings
- Clay surface with active pill indicator
- Shop switcher and user area pinned near footer

### Dashboard Composition

- Row 1: headline, date range, market summary, primary CTA
- Row 2: KPI cards for revenue, alerts, forecast confidence, profit delta
- Row 3: main trend chart and alert stack
- Row 4: product insight cards, simulation panel, invoice shortcuts

### Voice Panel

- Voice should live as a right-side assistant panel or centered modal on desktop
- Transcript, WHY, WHAT, and INR impact should render in structured sections
- Mic is no longer the center of navigation; it is a power tool inside the dashboard

---

## 6. Claymorphism Rules

1. Use light, warm backgrounds instead of stark white.
2. Cards should feel raised, inputs slightly inset.
3. Maintain large radii and generous spacing.
4. Use contrast through elevation, not only borders.
5. Blend business seriousness with tactile warmth.

Do not overdo claymorphism:

- avoid too many nested raised layers
- avoid weak contrast
- avoid mushy low-information cards

---

## 7. Accessibility Guidelines

- All interactive elements minimum 44x44px
- Desktop keyboard navigation must be first-class
- Hindi copy should use `font-hindi` where applicable
- Maintain 4.5:1 contrast minimum
- Respect `prefers-reduced-motion`
- All analytics color coding must have text/icon reinforcement

---

## 8. Animation Guidelines

- Use soft elevation shifts on hover
- Use count-up animations only for KPI moments
- Use subtle fade/slide for panel transitions
- Voice waveform can animate, but should not dominate desktop layouts

```css
transition-colors: 150ms ease-in-out;
transition-transform: 180ms ease-out;
transition-shadow: 180ms ease-out;
```

---

## 9. Tailwind Direction

Extend Tailwind with:

- clay surface colors
- custom shadow tokens
- large radii
- display font for headings
- reusable utility classes like `clay-card`, `clay-input`, `clay-btn`

---

## 10. Device Support

- **Primary**: Desktop Chrome, Edge, Safari on laptops and monitors
- **Secondary**: Tablet landscape
- **Responsive Support**: Mobile browsers remain supported, but as a compact adaptation of the desktop system
- **Minimum desktop target**: 1280x800
- **Minimum responsive target**: 390x844

---

## 11. Product Positioning Reminder

BizVaani frontend is now a **desktop-first web application** with a premium **claymorphism analytics interface**.

It should feel like:

- an AI business cockpit
- a modern SaaS dashboard for Indian retail
- tactile, warm, and trustworthy

It should not feel like:

- a generic mobile app clone
- a flat admin dashboard
- a voice-only experiment with weak visual hierarchy
