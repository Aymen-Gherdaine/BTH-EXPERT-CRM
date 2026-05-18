# BTH Hub — Design System
> Version 1.0 · Mai 2026 · Référentiel : Linear (structure) + Stripe (data) + Apple (typography)
> **Source de vérité UI pour tous les composants de BTH Hub.**
> Claude Code lit ce fichier avant de générer ou modifier tout composant UI.
> Mode : Light uniquement — dark mode non supporté dans BTH Hub.

---

## Fichiers de référence

```
DESIGN.md              ← ce fichier (racine du projet)
CLAUDE.md              ← instructions Claude Code (résumé des règles design inclus)
app/globals.css        ← tous les tokens CSS (@theme --color-bth-*, :root --bth-ease-*)
app/layout.tsx         ← import des fonts (Space Grotesk, Playfair Display, Lora)
```

---

## Stack & Contraintes

- Next.js App Router + TypeScript strict
- Tailwind CSS v4 — tokens via `@theme` dans `globals.css`
- Framer Motion pour les animations
- Polices chargées dans `app/layout.tsx` via `next/font/google`
  - `Space Grotesk` (subsets: latin, weights: 300 400 500 600 700)
  - `Playfair Display` (subsets: latin, weights: 400 500 600 700, italic: 400 500)
  - `Lora` (subsets: latin, weights: 400 500, italic: 400)

---

## Philosophie

BTH Hub est un **outil professionnel premium** pour des consultants en environnement.
- La densité est assumée — pas de décoration superflue
- Chaque animation a une raison fonctionnelle
- Le vert (#1a2e1e) est l'autorité. Le gold (#C9A96E) est l'accent rare.
- Les montants DZD utilisent TOUJOURS `font-feature-settings: "tnum"` — signature d'un outil financier sérieux (principe Stripe)
- Jamais de gris froid — warm neutrals uniquement

---

## Tokens Couleurs

> Tokens disponibles comme classes Tailwind : `bg-bth-green-800`, `text-bth-n-600`, etc.
> Définis dans `app/globals.css` bloc `@theme`.

### Canvas & Surfaces Hub (Light-first, 4 niveaux — principe Linear)
```
--color-bth-canvas:    #faf8f5   /* fond de page — warm cream */
--color-bth-surface-1: #ffffff   /* cards, panels */
--color-bth-surface-2: #f5f0e8   /* featured cards, hover state */
--color-bth-surface-3: #e8e2d8   /* sub-nav, dropdown menus */
--color-bth-surface-4: #d0c9be   /* deepest lifted surface */
--color-bth-hairline:        #e8e2d8
--color-bth-hairline-strong: #d0c9be
```

### Primaire — Forest Green
```
--color-bth-green-50:  #f2f7f3
--color-bth-green-100: #e2ede5
--color-bth-green-200: #c1d9c6
--color-bth-green-300: #90bb9a
--color-bth-green-400: #5d9a6e
--color-bth-green-500: #3a7a50
--color-bth-green-600: #2b5c3c
--color-bth-green-700: #1f4429
--color-bth-green-800: #1a2e1e   /* ← brand primary — CTA, headings, focus */
--color-bth-green-900: #101c12
```

### Accent — Gold (SCARCE — max 8 usages par page)
```
--color-bth-gold-50:  #fefaef
--color-bth-gold-100: #faf1d4
--color-bth-gold-200: #f3dfa0
--color-bth-gold-300: #e8c96a
--color-bth-gold-400: #d9b24a
--color-bth-gold-500: #C9A96E   /* ← brand accent */
--color-bth-gold-600: #a8874e
--color-bth-gold-700: #7c6238
```

**Usages gold autorisés (8 max) :**
logo separator · bullet points listes · barre gauche nav-item actif · ligne TTC tableaux ·
filets de séparation H1 · top-border page documents · eyebrow text · OBJET italique documents

### Neutrals Warm (JAMAIS de gris froid — #f8f8f8, gray-100, etc.)
```
--color-bth-n-50:  #faf8f5
--color-bth-n-100: #f5f0e8
--color-bth-n-200: #e8e2d8
--color-bth-n-300: #d0c9be
--color-bth-n-400: #b0a898
--color-bth-n-500: #887f74
--color-bth-n-600: #635c54
--color-bth-n-700: #45403a
--color-bth-n-800: #2e2a26
--color-bth-n-900: #1a1714
```

### Ink (texte)
```
--color-bth-ink:         = bth-n-900 → #1a1714  /* titres, texte principal */
Utiliser directement bg-bth-n-900 / text-bth-n-900 dans Tailwind.
```

### Sémantiques
```
--color-bth-success: #3a7a50   /* vert-500 */
--color-bth-warning: #C9A96E   /* gold-500 */
--color-bth-error:   #c44a3a
--color-bth-info:    #3a7ca5
```

---

## Typographie

### Familles
- **Space Grotesk** — TOUT l'UI Hub : titres, labels, boutons, inputs, tableaux, navigation
- **Playfair Display** — titres display uniquement (hero sections, titres de page majeurs)
- **Lora** — uniquement corps de texte dense (aperçus de soumission, texte éditorial)
- Jamais Inter, Roboto, ou la police système par défaut

### Échelle (principe Linear — tracking négatif sur grandes tailles)
```
Token          Size  Weight  Line-H  Tracking  Usage
display-xl     40px  700     1.10    -1.0px    Titres de page (Playfair ou Space Grotesk)
display-lg     32px  600     1.15    -0.6px    Titres de section
headline       24px  600     1.20    -0.4px    Card titles
title          20px  500     1.25    -0.2px    Sous-titres
body-lg        17px  400     1.50    0         Corps principal (principe Apple — 17px pas 16px)
body           15px  400     1.50    0         UI par défaut
body-sm        13px  400     1.50    0         Labels secondaires
caption        11px  500     1.40    +0.02em   Meta, timestamps
button         14px  500     1.20    0         Labels boutons
eyebrow        10px  600     1.30    +0.28em   Section eyebrow (tracking POSITIF intentionnel)
mono-num       14px  400     1.40    -0.42px   Montants DZD (+ tnum obligatoire)
```

### Règle critique — montants financiers (principe Stripe)
```tsx
// Classe utilitaire globale définie dans globals.css
<td className="tnum text-right font-medium">
  {formatMontant(montant)} DZD
</td>

// CSS équivalent :
// font-feature-settings: "tnum";
// letter-spacing: -0.42px;
// font-weight: 500;
```

### Weight ladder : 300 / 400 / 500 / 600 / 700 — jamais 800+, jamais 500 absent

---

## Espacement (base 4px)

Classes Tailwind générées : `p-bth-6` = 24px, `gap-bth-4` = 16px, etc.

```
--spacing-bth-1:  4px    p-bth-1
--spacing-bth-2:  8px    p-bth-2
--spacing-bth-3:  12px   p-bth-3
--spacing-bth-4:  16px   p-bth-4
--spacing-bth-5:  20px   p-bth-5
--spacing-bth-6:  24px   p-bth-6   ← card padding standard
--spacing-bth-8:  32px   p-bth-8   ← modal padding
--spacing-bth-10: 40px
--spacing-bth-12: 48px
--spacing-bth-16: 64px
--spacing-bth-20: 80px
```

---

## Border Radius

```
--radius-bth-xs:   4px    badges, status chips
--radius-bth-sm:   6px    inline tags, sidebar nav items
--radius-bth-md:   8px    TOUS les boutons Hub (JAMAIS pill)
--radius-bth-lg:   12px   cards, panels
--radius-bth-xl:   16px   modals, drawers
--radius-bth-pill: 9999px status badges uniquement — PAS les boutons Hub
```

---

## Animations

### Tokens (dans :root de globals.css — non supportés dans @theme)
```
--bth-ease-out:    cubic-bezier(0.16, 1, 0.3, 1)    /* reveals, entrées */
--bth-ease-apple:  cubic-bezier(0.2, 0, 0, 1)        /* transitions de page */
--bth-ease-in-out: cubic-bezier(0.4, 0, 0.2, 1)      /* changements d'état */
--bth-ease-micro:  cubic-bezier(0.25, 0.46, 0.45, 0.94) /* hover, focus */
--bth-ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1) /* modals, drawers */

--bth-dur-instant: 100ms   hover bg, focus ring
--bth-dur-fast:    150ms   tooltips, badges
--bth-dur-normal:  250ms   menus, state changes
--bth-dur-slow:    400ms   modals, reveals
--bth-dur-slower:  600ms   scroll reveals
--bth-dur-slowest: 800ms   hero reveals
```

### Règles d'animation
- Déclenchées par l'utilisateur ou scroll — jamais auto-play loop
- Jamais : float infini, pulse-glow, gradient animé
- Modal enter : `scale(0.95) translateY(16px) → scale(1) translateY(0)` · 400ms ease-spring
- Bouton press : `transform: scale(0.97)` · 100ms instant (principe Apple)
- Hover card : `translateY(-2px)` · 250ms ease-out
- Focus ring : border + box-shadow · 150ms ease-out
- Page transition : `translateX` · 400ms ease-apple · Framer Motion AnimatePresence
- Skeleton : shimmer 1.8s ease-in-out infinite (seul loop autorisé — utilitaire)
- Jamais `transition: all` — nommer la propriété explicitement

---

## Composants

### Button

**Primary** — 1 par zone maximum
```tsx
className="bg-bth-green-800 hover:bg-bth-green-700 text-white
           font-medium text-sm px-4 py-2 rounded-bth-md
           transition-colors duration-bth-instant
           active:scale-97 bth-focus"
```

**Secondary**
```tsx
className="bg-white hover:bg-bth-n-50 text-bth-n-900
           border border-bth-hairline-strong
           font-medium text-sm px-4 py-2 rounded-bth-md
           transition-colors duration-bth-instant bth-focus"
```

**Ghost**
```tsx
className="bg-transparent hover:bg-bth-n-100 text-bth-n-600
           font-medium text-sm px-4 py-2 rounded-bth-md
           transition-colors duration-bth-instant bth-focus"
```

**Danger**
```tsx
className="bg-bth-error hover:bg-[#a83c2e] text-white
           font-medium text-sm px-4 py-2 rounded-bth-md
           transition-colors duration-bth-instant bth-focus"
```

### Input / Form Field
```tsx
className="w-full bg-white border border-bth-n-300
           rounded-bth-md px-3 py-2.5 text-sm text-bth-n-900
           placeholder:text-bth-n-400 font-normal
           focus:border-bth-green-800 focus:ring-0
           focus:shadow-[0_0_0_3px_rgba(26,46,30,0.10)]
           transition-[border-color,box-shadow] duration-bth-fast"
```

### Card
```tsx
/* Surface-1 standard */
className="bg-white border border-bth-hairline rounded-bth-lg p-6
           shadow-[var(--bth-shadow-sm)]
           hover:shadow-[var(--bth-shadow-md)] hover:-translate-y-0.5
           transition-[box-shadow,transform] duration-bth-normal"

/* Surface-2 featured */
className="bg-bth-surface-2 border border-bth-hairline-strong rounded-bth-lg p-6"
```

### Status Badge
```tsx
/* accepted */  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[rgba(58,122,80,0.12)] text-bth-success"
/* pending */   "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[rgba(201,169,110,0.12)] text-bth-gold-600"
/* refused */   "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[rgba(196,74,58,0.12)] text-bth-error"
/* draft */     "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-bth-n-100 text-bth-n-600"
```

### Navigation Top Nav
```
height: 56px · bg-white · border-b border-bth-hairline · px-6
Logo: Space Grotesk 600 · text-[13px] · tracking-[0.15em] · text-bth-green-800
Links: text-[13px] · text-bth-n-500 · hover:text-bth-n-900
Active: text-bth-n-900 · font-medium
```

### Sidebar
```
width: 240px · bg-white · border-r border-bth-hairline · px-3 py-4

nav-item default: px-3 py-2 · rounded-bth-sm · text-[13px] · text-bth-n-500
nav-item hover:  bg-bth-n-100 · text-bth-n-900 · transition 100ms
nav-item active: bg-bth-green-50 · text-bth-green-800 · font-semibold
                 border-l-2 border-bth-gold-500 (gold — usage autorisé)

section-label: text-[9px] · font-semibold · tracking-[0.25em] · uppercase · text-bth-n-400
               pt-4 pb-1 px-3
```

### Table
```
thead:
  bg-bth-n-200 · border-t-2 border-bth-green-800 · border-b border-bth-n-300
  th: Space Grotesk 600 · text-[11px] · tracking-[0.06em] · uppercase · text-bth-green-800
      px-4 py-2.5

tbody tr: border-b border-bth-hairline · hover:bg-bth-n-50 · transition 100ms
tbody td: text-[13px] · text-bth-n-700 · px-4 py-3

td.amount (OBLIGATOIRE):
  className="tnum text-right font-medium"

row-total: bg-bth-n-800 · text-white · font-semibold
row-tva:   bg-bth-n-100 · text-bth-n-600
row-ttc:   bg-bth-gold-500 · text-white · font-bold   (gold — usage autorisé)
```

### Modal (Framer Motion)
```tsx
// Overlay
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
  className="fixed inset-0 bg-[rgba(1,8,2,0.6)] backdrop-blur-sm flex items-center justify-center z-50"
>
// Box
<motion.div
  initial={{ scale: 0.95, y: 16, opacity: 0 }}
  animate={{ scale: 1, y: 0, opacity: 1 }}
  exit={{ scale: 0.95, opacity: 0 }}
  transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
  className="bg-white border border-bth-n-200 rounded-bth-xl p-8 max-w-[480px] w-full
             shadow-[var(--bth-shadow-xl)]"
>
```

### Toast
```tsx
// enter: translateY(80px)→0 · 400ms ease-spring · auto-dismiss 3000ms
className="bg-bth-n-800 text-white px-5 py-3 rounded-bth-md
           font-medium text-[13px] shadow-[0_4px_24px_rgba(0,0,0,0.2)]
           flex items-center gap-2"
```

### Skeleton
```tsx
className="animate-pulse bg-gradient-to-r from-bth-n-100 via-bth-n-200 to-bth-n-100
           bg-[length:200%_100%] rounded-bth-xs"
// animation: shimmer 1.8s ease-in-out infinite (seul loop autorisé)
```

---

## Do's ✓

- `font-feature-settings: "tnum"` + classe `tnum` sur TOUS les montants DZD
- 1 seul bouton Primary par section/zone
- Hiérarchie surfaces : canvas → surface-1 → surface-2 → surface-3 (ne pas sauter)
- Gold uniquement pour les 8 usages documentés ci-dessus
- Classe `bth-focus` sur TOUS les éléments interactifs
- Touch targets ≥ 44×44px (accessibilité obligatoire)
- Nommer la propriété dans `transition:` (pas `transition: all`)
- Body text à 17px pas 16px (principe Apple)
- `font-feature-settings: "ss01"` déjà actif globalement via html dans globals.css

## Don'ts ✗

- Jamais gradient décoratif, float infini, pulse-glow
- Jamais gris froid (gray-100, #f8f8f8, #e0e0e0)
- Jamais couleur hardcodée en dehors des tokens
- Jamais montant sans classe `tnum`
- Jamais `border-radius: 9999px` sur les boutons Hub
- Jamais `transition: all`
- Jamais font-size < 11px
- Jamais Inter ou Roboto
- Jamais weight 800+ ou weight 500 absent du ladder

---

## Responsive

### Breakpoints (Tailwind v4)
```
xs:  320px   sm:480px   md:768px   lg:1024px   xl:1280px   2xl:1440px
```

### Typographie fluid (clamp)
```css
display-xl: clamp(28px, 2.5vw + 14px, 40px)
display-lg: clamp(22px, 2vw + 10px, 32px)
headline:   clamp(18px, 1.5vw + 8px, 24px)
body-lg:    clamp(15px, 1vw + 10px, 17px)
```

### Layout adaptatif
- Desktop ≥1024px : sidebar fixe 240px · toutes colonnes tables
- Tablet 768-1023px : sidebar en drawer overlay · colonnes secondaires masquées
- Mobile <768px : bottom navigation bar · tables en card layout

---

## Prompt Claude Code — page de test

Pour valider l'intégration du design system, créer `/app/design-test/page.tsx` :

```
Lis DESIGN.md.

Crée /app/design-test/page.tsx — page de test isolée (n'impacte rien d'existant).
Affiche : palette bth-*, échelle typo, 4 variants boutons, card avec badge,
input avec focus state, tableau 3 lignes avec montants DZD (classe tnum obligatoire),
skeleton loading.

Utilise uniquement les classes Tailwind bg-bth-*, text-bth-*, border-bth-*
et les variables CSS var(--bth-*).
Aucune couleur hardcodée. Aucun composant existant modifié.
Lance npm run build après. 0 erreurs attendues.
```