# Design System: BTH Hub CRM

## 1. Visual Theme & Atmosphere

A precision-calibrated, data-forward dashboard for environmental consultants. The atmosphere is **professional without being sterile** — like a well-lit architecture studio that happens to run financial projections. Every surface breathes; every element earns its place.

**Density:** 6/10 — "Daily App Balanced." Data tables and cards coexist without crowding. Generous vertical rhythm inside dense components.

**Variance:** 5/10 — Structured asymmetry. Left-anchored navigation, offset hero sections, split-column layouts with deliberate weight imbalance. Not chaotic — disciplined.

**Motion:** 6/10 — Fluid CSS with spring physics. Slide-over panels spring in from the right. Status badges pulse on active state. Staggered list reveals on every data load. No theatrics — motion serves comprehension.

**Mood language:** "A dense forest at dawn — precise, deep, alive. The green is not decorative; it is territorial. The interface knows what it is for."

---

## 2. Color Palette & Roles

### Backgrounds & Surfaces
- **Warm Parchment** (`#f6f6f4`) — Global page canvas. Warm off-white, never stark.
- **Pure Surface** (`#ffffff`) — Cards, modals, sidebar, header. Elevated from canvas.
- **Whisper Fill** (`#f3f4f6`) — Alternating table rows, skeleton loaders, inactive input fills.
- **Subtle Fill** (`#edf5ee`) — Active navigation items, selected states, hover backgrounds for green-adjacent contexts.

### Text Hierarchy
- **Deep Ink** (`#111827`) — Primary text. Headlines, values, labels. Near-black, never pure black.
- **Steel** (`#6b7280`) — Secondary text. Descriptions, dates, metadata.
- **Ash** (`#9ca3af`) — Tertiary text. Placeholders, column headers, helper text, timestamps.

### Structure
- **Cool Border** (`#e5e7eb`) — Primary structural lines. Table dividers, card outlines, input borders.
- **Ghost Border** (`#f3f4f6`) — Subtle internal dividers. Table row separators, between-section lines.

### Brand Green (Single Accent System)
- **Forest Deep** (`#1a2e1e`) — Primary CTA buttons, active sidebar items, brand mark, avatar fills. Maximum authority.
- **Forest Mid** (`#2d5a3d`) — Progress bars, versement indicators, secondary green actions.
- **Forest Whisper** (`#edf5ee`) — Green tinted backgrounds for selected rows, filter chip active state, status change hover.

### Status Semantic Colors
- **Draft Gray** — Background `#f3f4f6` · Text `#4b5563` · Dot `#9ca3af`
- **Sent Blue** — Background `#dbeafe` · Text `#1d4ed8` · Dot `#60a5fa`
- **Accepted Green** — Background `#dcfce7` · Text `#16a34a` · Dot `#4ade80`
- **Refused Red** — Background `#fee2e2` · Text `#dc2626` · Dot `#f87171`

### Banned Colors
- Pure black `#000000` — NEVER use. Use Deep Ink `#111827` instead.
- Any purple, violet, or indigo — off-brand.
- Neon or oversaturated greens — the brand green is desaturated and deep, not lime.
- Warm grays mixed with cool grays — the palette is exclusively cool-neutral.

---

## 3. Typography Rules

### Display & Headings — Syne
- **Font:** `Syne` (Google Fonts, weights 700 and 800)
- **Usage:** Page titles (`h1`), panel headers, section headers, modal titles
- **Letter spacing:** `-0.4px` to `-0.8px` depending on size — always track-tight
- **Scale:** `28px` (desktop page title) → `24px` (mobile) → `20px` (card title) → `17px` (panel title) → `14px` (section label)
- **Rendering:** `lineHeight: 1` for large headlines, `1.3` for panel headers

### Body & UI — Figtree
- **Font:** `Figtree` (Google Fonts, weights 400, 500, 600, 700)
- **Usage:** All body copy, table data, button labels, form inputs, metadata, navigation
- **Base size:** `13px` for UI text, `12px` for metadata, `11.5px` for tertiary labels
- **Leading:** `1.5` for multi-line body, `1` for single-line UI elements
- **Max-width:** 65ch for all paragraph text

### Numeric Display — Tabular Nums
- **Property:** `fontVariantNumeric: "tabular-nums"` on all monetary values and statistics
- **Applies to:** TTC amounts in table rows, dashboard KPIs, versement percentages
- **Letter spacing:** `-0.4px` to `-0.5px` on large numeric displays (16px+)

### BANNED
- `Inter` — generic, overused in dashboards, no personality
- Any serif font — this is a professional software UI, never editorial
- `system-ui` fallbacks as primary — always specify Syne or Figtree explicitly
- ALL CAPS labels beyond 10.5px — use uppercase only for section headers at ≤11px

---

## 4. Component Stylings

### Buttons
- **Primary (Forest Deep):** `background: #1a2e1e`, white text, `borderRadius: 8–10px`, `height: 36–38px`, `padding: 0 13–14px`. Box shadow: `0 2px 8px rgba(26,46,30,.18)`. Active state: `whileTap={{ scale: .94 }}` — tactile push.
- **Secondary (Ghost):** `border: 1.5px solid #e5e7eb`, white background, `#6b7280` text. No shadow. Active: `scale: .96`.
- **Danger (Softened):** `background: #fee2e2`, `color: #dc2626`, `border: 1.5px solid #f8717140`. Not aggressive — contained red.
- **Success (Green Tint):** `background: #edf5ee`, `color: #16a34a`, `border: 1.5px solid #4ade8060`.
- **Square Icon Button:** `36×36px`, `borderRadius: 10px`. Used for mobile "+" and compact actions.
- NO outer glows. NO neon drop-shadows. NO custom cursors.

### Cards & Panels
- **List Cards (Mobile):** `borderRadius: 14px`, `border: 1px solid #e5e7eb`, `boxShadow: 0 1px 3px rgba(0,0,0,.05), 0 4px 12px rgba(0,0,0,.04)`. Left status bar: 4px wide, colored by `statut` dot color. No color background fill.
- **KPI Chips (Stats Bar):** `borderRadius: 8px`, `background: #f6f6f4`, `border: 1px solid #e5e7eb`, `padding: 6px 12px`. Inline icon + label + value. Compact, non-elevated.
- **Detail Panels (Sections inside slide-over):** `background: #f6f6f4`, `borderRadius: 10px`, `border: 1px solid #e5e7eb`, `padding: 12–14px`. Used for grouped information (finances, status change, budget lines).
- **Modals:** `borderRadius: 20px`, `boxShadow: 0 25px 60px rgba(0,0,0,.15)`, `maxWidth: 400px`. Spring in from center with scale + y transform. Backdrop: `rgba(0,0,0,.3)` + `backdropFilter: blur(4px)`.

### Table (Desktop)
- **Row height:** 44px — compact single-line. No wrapping.
- **Header:** `height: 36px`, `background: #f6f6f4`, `fontSize: 10.5px`, uppercase, `letterSpacing: 0.7px`, `color: #9ca3af`. Sticky with `position: sticky, top: 0`.
- **Hover:** `background: #f7f8f6`. Selected: `#edf5ee`. Active (panel open): `#e6f0e7`.
- **Actions column:** Hidden by default (`opacity: 0`), appear on row hover (`opacity: 1`). 28×28px icon buttons.
- **Footer total:** 52px fixed bar at table bottom. Left: count. Right: total DZD TTC. Separated by spacer flex-1.
- **Sort indicator:** Small chevron SVG, 10px, appended to active column header only.

### Status Pills
- `display: inline-flex`, `alignItems: center`, `gap: 5px`. Colored dot (4–5px) + label. `borderRadius: 20px`. `fontWeight: 600`. Sizes: small (`fontSize: 10.5px, padding: 2px 8px`) and regular (`fontSize: 11.5px, padding: 3px 10px`).

### Avatars (Client Initials)
- Circle or rounded square depending on `size`. Background color deterministically derived from client name (stable hash → palette index). `AVATAR_COLORS`: 7 forest-adjacent deep tones. White text, `fontWeight: 700`. Size 26–32px for tables, 28–30px for cards.

### Inputs & Forms
- `height: 38px`, `border: 1.5px solid #e5e7eb`, `borderRadius: 8px`. `fontFamily: Figtree`, `fontSize: 13px`. Focus: border color transitions to `#1a2e1e` (no ring glow, no box-shadow explosion).
- Label always above. Error text below in `#dc2626`. Helper text in `#9ca3af`.
- Search fields: Left-aligned icon at 10px from edge, `paddingLeft: 32–34px`. Icon color `#9ca3af`.
- NO floating labels. NO animated label morphing on focus.

### Slide-over Detail Panel
- **Desktop:** Fixed right `width: 440px`, `position: fixed, top: 0, right: 0, bottom: 0`. Spring animation: `x: "100%" → 0`, `type: "spring", damping: 28, stiffness: 280`. Background overlay: `rgba(0,0,0,.12)` — light, not blocking.
- **Mobile:** Bottom sheet, `borderRadius: 20px 20px 0 0`, `maxHeight: 90%`. Spring animation: `y: "100%" → 0`. Backdrop: `rgba(0,0,0,.38)` + blur. Drag handle: 36×4px pill at top.

### Skeleton Loaders
- Exact layout dimensions, `borderRadius: 10px`, `background: #f3f4f6`, animated with CSS keyframe: `opacity 1 → 0.4 → 1`, `1.5s ease-in-out infinite`. NO circular spinners.

### Filter Dropdown
- Trigger button: `height: 38px`, `borderRadius: 8px`. Active state border turns Forest Deep `#1a2e1e` with Whisper background.
- Popover: Spring scale from `0.97` + `y: -6px → 0`. `borderRadius: 10px`, `boxShadow: 0 8px 24px rgba(0,0,0,.10)`. Fixed overlay div at `z: 49` for click-outside dismiss.
- Items: 36px rows with dot indicator + count in muted parenthesis.

---

## 5. Layout Principles

### Navigation Architecture
- **Desktop sidebar:** `width: 256px (64 * 4)`, fixed height, `border-right: 1px solid #e5e7eb`, `background: white`. Nav items: `height: ~40px`, `borderRadius: 8px`, icon + label. Active: Forest Deep background + white text. `hidden md:flex`.
- **Mobile bottom nav:** Fixed bottom, `background: white`, `border-top: 1px solid #e5e7eb`. 5 items equally spaced. Active item gets `background: #edf5ee` pill behind icon. `position: absolute, bottom: 0` (within layout container, not fixed to viewport).
- **Header:** `height: 56px`, sticky top, `z: 40`. Mobile only — shows BTH Hub logo + user avatar.

### Page Content Container
- All page content lives in `<main>` with `flex-1 overflow-y-auto overflow-x-hidden pb-16 md:pb-0`.
- Desktop table pages: card container `margin: 16px 32px`, `borderRadius: 12px`, `border: 1px solid #e5e7eb`, `overflow: hidden`.
- Mobile: `padding: 12px 18px 80px` (80px to clear bottom nav).

### Hero / Page Header Section
- White background, `border-bottom: 1px solid #e5e7eb`. Padding: `20px [px]px 16px`.
- Title (Syne 800) + count badge on left. Action buttons on right.
- Stats chips row below title when isAdmin — `gap: 8px, flexWrap: wrap`.
- Filter bar as its own white stripe below hero, `border-bottom: 1px solid #e5e7eb`.

### Grid & Spacing
- CSS Grid for all table layouts: explicit `gridTemplateColumns` strings, never `repeat(auto-fill)` for data tables.
- Flexbox for navigation, cards, and inline compositions.
- 44px minimum touch target for all interactive elements on mobile.
- Section padding: `px` variable scales from `18px` (mobile) to `32px` (desktop).
- `max-width` for modal content: `400px`.

---

## 6. Motion & Interaction

### Spring Physics
- **Default spring:** `type: "spring", damping: 28, stiffness: 280` — used for slide-over panels (snappy, premium).
- **Snappier spring:** `damping: 28, stiffness: 320` — mobile bottom sheets.
- **Slower reveal:** `duration: .25, ease: [.25,.46,.45,.94]` — card list items on page load.
- NO `linear` easing anywhere. NO `ease-in` or abrupt stops.

### Perpetual Micro-Interactions
- **Status dot badge in header:** Ping animation (`animate-ping`) on unread alerts. Red outer ring pulse.
- **Progress bars:** Always animate from `width: 0` to `width: ${pct}%` with `duration: .6, ease: "easeOut"` on mount.
- **Skeleton loaders:** Continuous opacity pulse at 1.5s cycle.
- **Row hover:** Background color transition `0.08s`. Action buttons opacity `0.12s`.

### Staggered Reveals
- Mobile cards: `delay: idx * 0.06` stagger, `duration: .25` each.
- Progress bars on mobile cards: `delay: idx * .06 + .3` (offset to follow card entrance).
- List items inside detail panel: no stagger (already inside a panel animation).

### Transition Constraints
- Animate ONLY `transform` and `opacity`. Never `width`, `height`, `top`, `left`, `backgroundColor`.
- Exception: background-color on hover/selected rows uses CSS `transition: background .08s` — not Framer Motion (native browser transition for performance on dense tables).
- Detail panel backdrop: `opacity 0 → 1` only. No scale, no blur animation on backdrop.

### whileTap Feedback
- Primary buttons: `scale: .94`
- Secondary/ghost buttons: `scale: .96`
- Mobile cards: `scale: .988`
- Danger buttons in panel: `scale: .96`
- Modals buttons: `scale: .97`

---

## 7. Responsive Rules

### Breakpoints
- **Mobile:** `< 640px` — single column, bottom nav, 5 cards per page, square icon buttons
- **Tablet:** `640px–1023px` — hybrid; sidebar hidden, bottom nav shown, card layout
- **Desktop:** `≥ 1024px` — sidebar visible, table layout, 10 rows per page, full button labels

### Layout Collapse
- Sidebar `hidden md:flex` → BottomNav appears on mobile
- Page hero: `fontSize: 24px` on mobile → `28px` on desktop
- "Nouvelle soumission" button: full label on desktop → square `+` icon button on mobile (36×36px)
- Stats chips: wrap freely (`flexWrap: wrap`) — never clip or overflow horizontally
- Table: hidden below `md`, replaced by card list

### Typography Scaling
- `h1` page title: `28px desktop / 24px mobile` (explicit, not clamp — step function tied to sidebar breakpoint)
- Body text minimum `13px` (never below `11px` for any visible label)
- All `fontSize` values are `px` or `em` — no `rem` needed since page root font is standard

### Touch Targets
- All interactive elements: `minHeight: 44px` on mobile
- Table action buttons (28px) are desktop-only — hidden on mobile
- Bottom nav items: `minHeight: 44px` with `5-item` grid

---

## 8. Iconography

- **Source:** Hand-drawn SVG paths (`viewBox="0 0 24 24"`), `strokeLinecap="round"`, `strokeLinejoin="round"`
- **Weight:** `strokeWidth: 1.6` default, `2` for active/emphasized states, `2.5` for close/dismiss buttons
- **Size scale:** `12px` for action row icons, `13px` for chip icons, `14–15px` for button icons, `18–20px` for empty state icons, `28px` for large empty state illustrations
- **Color:** Always inherits from parent (`currentColor`) or explicit `s="#9ca3af"` for muted contexts
- **Fill:** Always `fill="none"` for stroke icons. Circle fills only for status dots.

---

## 9. Anti-Patterns (Banned)

### Typography
- `Inter` font — BANNED. Use Syne (display) + Figtree (body).
- Any serif font (`Georgia`, `Times New Roman`, `Garamond`) — BANNED for all dashboard and software UI contexts.
- ALL CAPS labels at body size — use `textTransform: uppercase` only at 10.5px max with 0.7px letter-spacing.
- Gradient text on headings — BANNED.

### Color
- Pure black `#000000` — BANNED. Use `#111827`.
- Neon outer glow shadows (`0 0 20px rgba(0,255,0,.5)`) — BANNED.
- Oversaturated or lime green — the brand green is `#1a2e1e`, not #00ff00.
- Purple, violet, indigo — completely off-brand.
- Warm gray mixed with cool gray in the same view — pick one and hold it.

### Layout
- Centered hero sections — this is a dashboard, not a landing page.
- Three equal-width cards horizontally — use offset asymmetric grids, zig-zag, or horizontal scroll.
- `h-screen` for full-height sections — use `min-h-[100dvh]` (iOS Safari bug).
- Overlapping elements — every element occupies a clean spatial zone with no stacking.
- Horizontal overflow on mobile — always clip or collapse.
- `position: absolute` for layout — only for overlays and positioned dropdowns.

### Motion
- `linear` easing — BANNED. Spring physics or named easing curves only.
- Animating `width`, `height`, `top`, `left` — use `transform: scaleX()` or `transform: translateX()` instead.
- Mounting entire lists instantly — always stagger with `delay: idx * 0.06`.
- Grain/noise filters without `will-change: transform` — perf failure on low-end devices.

### Content & Copy
- Placeholder names like "John Doe", "Acme Corp", "Entreprise SAS" — BANNED in demos.
- Fabricated metrics ("99.99% uptime", "124ms response") — BANNED. Use `[metric]` placeholders.
- AI copywriting: "Elevate your workflow", "Seamless integration", "Unleash potential" — BANNED.
- Filler UI: "Scroll to explore", bouncing chevrons, "Learn more →" secondary CTAs — BANNED.
- Emojis anywhere in the UI — BANNED.
- `LABEL // YEAR` formatting conventions — BANNED.

### Components
- Circular loading spinners — use skeletal loaders matching exact layout dimensions.
- Custom mouse cursors — BANNED.
- Floating labels on inputs — always label above, static.
- Generic "No data" empty states — compose meaningful empty states with context-aware messaging.
- Action menus on click without visual affordance — use hover-reveal with smooth opacity transition.
