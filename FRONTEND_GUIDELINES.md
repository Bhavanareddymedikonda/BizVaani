# Frontend Design System & Guidelines
## BizVaani — Voice-First AI Business Coach

---

## 1. Design Principles

1. **Voice-First**: Every interaction should be doable by voice. Screen is secondary confirmation.
2. **Hindi-Accessible**: All labels, alerts, and CTAs in Hindi (with English fallback). Font sizes > 16px always.
3. **One Action Per Screen**: Kirana owner should never be confused. One primary CTA per view.
4. **Instant Feedback**: Voice response starts in < 1.5s. Every tap gives visual feedback in < 100ms.
5. **Trust Through Numbers**: Always show ₹ impact. Numbers build trust more than words.

---

## 2. Design Tokens

### Color Palette

#### Primary — Saffron (Trust, India, Business)
```css
--color-primary-50:  #fff7ed;
--color-primary-100: #ffedd5;
--color-primary-200: #fed7aa;
--color-primary-300: #fdba74;
--color-primary-400: #fb923c;
--color-primary-500: #f97316;  /* Main brand — BizVaani saffron */
--color-primary-600: #ea580c;
--color-primary-700: #c2410c;
--color-primary-800: #9a3412;
--color-primary-900: #7c2d12;
```

#### Secondary — Deep Green (Profit, Growth)
```css
--color-secondary-50:  #f0fdf4;
--color-secondary-500: #22c55e;  /* Profit green */
--color-secondary-700: #15803d;
```

#### Neutral
```css
--color-neutral-50:  #fafafa;
--color-neutral-100: #f4f4f5;
--color-neutral-200: #e4e4e7;
--color-neutral-300: #d4d4d8;
--color-neutral-400: #a1a1aa;
--color-neutral-500: #71717a;
--color-neutral-600: #52525b;
--color-neutral-700: #3f3f46;
--color-neutral-800: #27272a;
--color-neutral-900: #18181b;
```

#### Semantic
```css
--color-success: #22c55e;   /* ₹ profit, positive delta */
--color-warning: #f59e0b;   /* Low stock, stale data */
--color-error:   #ef4444;   /* Risk alert, sales drop */
--color-info:    #3b82f6;   /* Market price info */
```

### Typography

```css
--font-hindi:   'Noto Sans Devanagari', sans-serif;  /* For all Hindi text */
--font-sans:    'Inter', system-ui, sans-serif;       /* UI chrome, numbers */
--font-mono:    'JetBrains Mono', monospace;          /* Price values, debug */
```

#### Font Sizes
```css
--text-xs:   0.75rem;   /* 12px — labels, badges */
--text-sm:   0.875rem;  /* 14px — secondary text */
--text-base: 1rem;      /* 16px — body, minimum size */
--text-lg:   1.125rem;  /* 18px — card content */
--text-xl:   1.25rem;   /* 20px — card titles */
--text-2xl:  1.5rem;    /* 24px — section headers */
--text-3xl:  1.875rem;  /* 30px — ₹ impact number */
--text-4xl:  2.25rem;   /* 36px — hero numbers */
```

#### Font Weights
```css
--font-normal:   400;
--font-medium:   500;
--font-semibold: 600;
--font-bold:     700;
```

### Spacing Scale
```css
--spacing-1:  0.25rem;  /* 4px */
--spacing-2:  0.5rem;   /* 8px */
--spacing-3:  0.75rem;  /* 12px */
--spacing-4:  1rem;     /* 16px — default padding */
--spacing-5:  1.25rem;  /* 20px */
--spacing-6:  1.5rem;   /* 24px */
--spacing-8:  2rem;     /* 32px — section spacing */
--spacing-10: 2.5rem;   /* 40px */
--spacing-12: 3rem;     /* 48px */
--spacing-16: 4rem;     /* 64px */
```

### Border Radius
```css
--radius-sm:   0.25rem;  /* 4px — tags, badges */
--radius-base: 0.5rem;   /* 8px — inputs */
--radius-md:   0.75rem;  /* 12px — cards */
--radius-lg:   1rem;     /* 16px — modals */
--radius-xl:   1.5rem;   /* 24px — mic button */
--radius-full: 9999px;   /* Circular — mic FAB */
```

### Shadows
```css
--shadow-sm: 0 1px 2px 0 rgba(0,0,0,0.05);
--shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
--shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05);
--shadow-glow-orange: 0 0 20px rgba(249,115,22,0.4);  /* Mic button active */
```

---

## 3. Layout System

### Container
```css
max-width: 480px;      /* Mobile-first cap */
margin: 0 auto;
padding: 0 spacing-4;
```

### Responsive Breakpoints
```css
--breakpoint-sm:  480px;   /* Large phone */
--breakpoint-md:  768px;   /* Tablet */
--breakpoint-lg: 1024px;   /* Desktop */
```

### Layout Patterns

**Mobile Stack (default)**
```jsx
<div className="flex flex-col min-h-screen bg-neutral-50">
  <Header />
  <main className="flex-1 px-4 py-4 pb-24">{content}</main>
  <BottomNav />   {/* Fixed at bottom */}
  <MicFAB />      {/* Floating over bottom nav */}
</div>
```

**Card Grid**
```jsx
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{cards}</div>
```

---

## 4. Component Library

### Mic FAB (Floating Action Button) — Core Component
```jsx
// Active (listening)
<button className="
  fixed bottom-20 left-1/2 -translate-x-1/2
  w-16 h-16 rounded-full
  bg-primary-500 hover:bg-primary-600
  shadow-glow-orange
  flex items-center justify-center
  animate-pulse
  z-50
">
  <Mic className="w-7 h-7 text-white" />
</button>

// Idle
<button className="
  fixed bottom-20 left-1/2 -translate-x-1/2
  w-16 h-16 rounded-full
  bg-primary-500 hover:bg-primary-600
  shadow-lg
  flex items-center justify-center
  transition-all duration-200 active:scale-95
  z-50
">
  <Mic className="w-7 h-7 text-white" />
</button>
```

### Primary Button
```jsx
<button className="
  w-full px-6 py-3
  bg-primary-500 hover:bg-primary-600 active:bg-primary-700
  text-white font-semibold text-base
  rounded-lg
  transition-colors duration-150
  disabled:opacity-50 disabled:cursor-not-allowed
  focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
">
  {label}
</button>
```

### Secondary Button
```jsx
<button className="
  w-full px-6 py-3
  bg-white border border-neutral-300
  hover:bg-neutral-50 active:bg-neutral-100
  text-neutral-800 font-medium text-base
  rounded-lg
  transition-colors duration-150
">
  {label}
</button>
```

### Risk Alert Card
```jsx
<div className="
  bg-red-50 border-l-4 border-error
  rounded-lg p-4
  flex items-start gap-3
  shadow-sm
">
  <AlertTriangle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
  <div>
    <p className="font-semibold text-error text-base">{alertTitle}</p>
    <p className="text-neutral-600 text-sm mt-1">{alertBody}</p>
    <button className="mt-2 text-primary-500 font-medium text-sm">
      BizVaani se poochho →
    </button>
  </div>
</div>
```

### Product Card (Dashboard)
```jsx
<div className="
  bg-white border border-neutral-200
  rounded-xl p-4 shadow-sm
  hover:shadow-md transition-shadow duration-200
">
  <div className="flex justify-between items-start">
    <p className="font-semibold text-neutral-800 text-base">{productName}</p>
    <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${
      trend > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
    }`}>
      {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
    </span>
  </div>
  <p className="text-2xl font-bold text-neutral-900 mt-2">₹{price}</p>
  <p className="text-xs text-neutral-400 mt-1">Mandi: ₹{mandiPrice}/kg</p>
</div>
```

### ₹ Impact Simulation Card
```jsx
<div className="
  bg-gradient-to-br from-green-50 to-green-100
  border border-green-200 rounded-xl p-5
  text-center
">
  <p className="text-neutral-600 text-sm mb-2">Is hafte extra kamaoge</p>
  <p className="text-4xl font-bold text-green-700">
    ₹<CountUp end={impactValue} duration={0.8} />
  </p>
  <p className="text-xs text-neutral-500 mt-2">{actionDescription}</p>
</div>
```

### Voice Response Card
```jsx
<div className="fixed inset-0 bg-black/60 flex items-end z-50">
  <div className="
    bg-white w-full rounded-t-2xl p-5
    max-h-[80vh] overflow-y-auto
  ">
    {/* Waveform while speaking */}
    <WaveformVisualizer isActive={isSpeaking} />

    {/* Transcript */}
    <p className="text-sm text-neutral-400 mb-3">{transcript}</p>

    {/* WHY */}
    <div className="mb-3">
      <span className="text-xs font-bold text-red-500 uppercase">Kyun</span>
      <p className="text-base text-neutral-800 mt-1">{whyText}</p>
    </div>

    {/* WHAT */}
    <div className="mb-3">
      <span className="text-xs font-bold text-blue-500 uppercase">Kya Karen</span>
      <p className="text-base text-neutral-800 mt-1">{whatText}</p>
    </div>

    {/* ₹ Impact */}
    <ImpactCard impactValue={rupeesImpact} />

    <button className="mt-4 w-full primary-button">Theek hai, kar dete hain</button>
  </div>
</div>
```

### Input Field
```jsx
<div className="space-y-1.5">
  <label className="block text-sm font-medium text-neutral-700">
    {label}
  </label>
  <input
    className="
      block w-full px-4 py-3
      border border-neutral-300 rounded-lg
      text-base text-neutral-900
      placeholder:text-neutral-400
      focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
      disabled:bg-neutral-50
    "
    placeholder={placeholder}
  />
  {error && <p className="text-sm text-error">{error}</p>}
</div>
```

### Bottom Navigation Bar
```jsx
<nav className="
  fixed bottom-0 left-0 right-0
  bg-white border-t border-neutral-200
  flex items-center justify-around
  px-4 py-2
  z-40 safe-area-pb
">
  {[
    { icon: Home, label: 'Home', href: '/dashboard' },
    { icon: Bell, label: 'Alerts', href: '/alerts' },
    { icon: Package, label: 'Stock', href: '/inventory' },
    { icon: FileText, label: 'Invoice', href: '/invoice' },
  ].map(item => (
    <Link href={item.href} className={`flex flex-col items-center gap-1 ${
      isActive(item.href) ? 'text-primary-500' : 'text-neutral-400'
    }`}>
      <item.icon className="w-5 h-5" />
      <span className="text-xs">{item.label}</span>
    </Link>
  ))}
</nav>
```

### Loading Skeleton
```jsx
<div className="animate-pulse space-y-3">
  <div className="h-5 bg-neutral-200 rounded w-3/4" />
  <div className="h-4 bg-neutral-200 rounded w-1/2" />
  <div className="h-10 bg-neutral-200 rounded" />
</div>
```

### Toast / Alert Banner
```jsx
// Success
<div className="fixed top-4 left-4 right-4 bg-green-600 text-white rounded-lg p-4 shadow-lg z-50 flex gap-3">
  <CheckCircle className="w-5 h-5 flex-shrink-0" />
  <p className="text-sm font-medium">{message}</p>
</div>

// Warning (offline / stale data)
<div className="bg-amber-50 border border-amber-300 rounded-lg p-3 text-sm text-amber-800">
  ⚠️ {message}
</div>
```

---

## 5. Accessibility Guidelines
- All interactive elements: min touch target 44×44px
- Hindi text: always `font-hindi` class; fallback to system Devanagari
- Mic button: `aria-label="Bol ke poochho"`, `role="button"`
- Alert cards: `role="alert"` for screen readers
- Color contrast: 4.5:1 minimum for all text on white
- Focus visible: 2px orange ring on all focusable elements
- Voice is primary — all actions doable without reading

---

## 6. Animation Guidelines
```css
/* Standard transitions */
transition-colors: 150ms ease-in-out
transition-shadow: 200ms ease-in-out
transition-transform: 200ms ease-out

/* Mic pulse (listening state) */
@keyframes mic-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(249,115,22,0.4); }
  50% { box-shadow: 0 0 0 12px rgba(249,115,22,0); }
}

/* ₹ count-up: use react-countup, duration 0.8s, easing easeOut */
/* Waveform: requestAnimationFrame, 60fps amplitude bars */
/* Page transitions: opacity 0→1, 200ms */
```

- Never animate width/height (causes layout reflow)
- Respect `prefers-reduced-motion`: skip all animations except essential transitions

---

## 7. Icon System
- **Library**: Lucide React 0.395.x
- **Sizes**: w-4 h-4 (16px), w-5 h-5 (20px), w-6 h-6 (24px), w-7 h-7 (28px for FAB)
- **Stroke**: 2px (default Lucide)
- **Color**: Inherited from parent or explicit text-{color} class

---

## 8. State Indicators

### Loading (Voice Processing)
```jsx
// Show inside voice modal while LLM is thinking
<div className="flex gap-1 items-center justify-center py-4">
  {[0,1,2].map(i => (
    <div key={i} className={`w-2 h-2 bg-primary-500 rounded-full animate-bounce`}
      style={{ animationDelay: `${i * 0.15}s` }} />
  ))}
</div>
```

### Empty State (No Data)
```jsx
<div className="text-center py-12 px-4">
  <Mic className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
  <h3 className="text-lg font-semibold text-neutral-700 mb-1">
    Abhi koi data nahi hai
  </h3>
  <p className="text-neutral-400 text-sm mb-4">
    Bol ke shuru karein
  </p>
  <button className="primary-button">Bol ke Poochho</button>
</div>
```

### Offline State
```jsx
<div className="bg-amber-400 text-white text-center py-2 text-sm font-medium">
  📡 Network nahi hai — purana data dikha raha hai
</div>
```

---

## 9. Tailwind Config Extensions
```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        hindi: ['Noto Sans Devanagari', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#fff7ed', 100: '#ffedd5', 200: '#fed7aa',
          300: '#fdba74', 400: '#fb923c', 500: '#f97316',
          600: '#ea580c', 700: '#c2410c', 800: '#9a3412', 900: '#7c2d12'
        },
        error: '#ef4444',
        success: '#22c55e',
        warning: '#f59e0b',
      },
      boxShadow: {
        'glow-orange': '0 0 20px rgba(249,115,22,0.4)',
      },
      animation: {
        'mic-pulse': 'mic-pulse 1.5s ease-in-out infinite',
      },
      keyframes: {
        'mic-pulse': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(249,115,22,0.4)' },
          '50%': { boxShadow: '0 0 0 12px rgba(249,115,22,0)' },
        }
      }
    }
  }
}
```

---

## 10. Browser & Device Support
- **Primary**: Android Chrome 110+ (target device: ₹8,000–₹15,000 Android phones)
- **Secondary**: iOS Safari 16+ (iPhone users in Tier 2 cities)
- **Desktop**: Chrome 110+ (for demo/judges)
- **PWA**: Install banner on Android Chrome; iOS "Add to Home Screen" manual
- **Minimum screen**: 360×640px
