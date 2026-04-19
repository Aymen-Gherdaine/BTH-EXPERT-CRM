# BTH Expert CRM — Progression de la construction

## État : **En cours — ~70% complété**

---

## ✅ COMPLÉTÉ

### Configuration projet
- [x] `package.json` — Next.js 15.3.1, toutes les dépendances (tailwind, framer-motion, supabase, docx, jspdf, anthropic)
- [x] `next.config.ts`
- [x] `tsconfig.json`
- [x] `postcss.config.mjs` — Tailwind v4

### Types & Utilitaires
- [x] `types/index.ts` — Tous les types TypeScript (Client, Soumission, LigneBudget, FormData, etc.)
- [x] `lib/utils.ts` — generateNumeroOffre (T+DDMMYYYY), formatMontant, calcTotaux, formatDateFr
- [x] `lib/supabase.ts` — Client Supabase
- [x] `lib/supabase-schema.sql` — Schéma SQL complet (tables: clients, soumissions, lignes_budget + index)

### IA & Génération documents
- [x] `lib/anthropic.ts` — Génération IA claude-sonnet-4-5, prompt system formel algérien, références réglementaires strictes
- [x] `lib/generate-docx.ts` — Export Word complet (6 pages, structure exacte du PDF SAFMA, header BTH Expert, footer paginé, tableaux budget, signatures)
- [x] `lib/generate-pdf.ts` — Export PDF complet (jsPDF + autoTable, même structure, pagination auto)

### API Routes
- [x] `app/api/generate/route.ts` — POST génération IA
- [x] `app/api/export/docx/route.ts` — POST export .docx
- [x] `app/api/export/pdf/route.ts` — POST export .pdf
- [x] `app/api/soumissions/route.ts` — GET liste + POST création (upsert client, création soumission, lignes budget)
- [x] `app/api/soumissions/[id]/route.ts` — GET détail + PATCH mise à jour + DELETE
- [x] `app/api/clients/route.ts` — GET liste avec recherche (autocomplete)
- [x] `app/api/dashboard/route.ts` — GET stats (soumissions mois, mandats acceptés, taux acceptation, CA)

### Layout & Navigation
- [x] `app/globals.css` — Tailwind v4, couleurs BTH (#2E7DB2)
- [x] `app/layout.tsx` — Root layout avec Inter font
- [x] `app/page.tsx` — Redirect vers /dashboard
- [x] `app/(app)/layout.tsx` — Layout avec Sidebar
- [x] `components/layout/Sidebar.tsx` — Sidebar animée Framer Motion (Dashboard, Soumissions, Clients, CTA Nouvelle soumission)

### Pages complétées
- [x] `app/(app)/dashboard/page.tsx` — Dashboard avec stats animées (4 cards Framer Motion) + liste soumissions récentes
- [x] `app/(app)/soumissions/nouvelle/page.tsx` — Formulaire 4 étapes avec AnimatePresence (transitions slide)

### Formulaire 4 étapes (complet)
- [x] `components/forms/StepClientInfo.tsx` — Étape 1 : titre, nom, poste, entreprise, adresse, ville
- [x] `components/forms/StepProjectInfo.tsx` — Étape 2 : titre projet, secteur, description, type_etude (4 options), délai
- [x] `components/forms/StepBudget.tsx` — Étape 3 : tableau dynamique lignes ajoutables/supprimables, totaux auto HT+TVA+TTC
- [x] `components/forms/StepPreview.tsx` — Étape 4 : prévisualisation complète du document + boutons export .docx et .pdf

---

## ❌ RESTE À FAIRE

### Pages manquantes (priorité haute)
- [ ] `app/(app)/soumissions/page.tsx` — Liste des soumissions avec filtres (statut, client, date, montant) + actions par ligne
- [ ] `app/(app)/soumissions/[id]/page.tsx` — Page détail soumission : voir, télécharger docx+pdf, modifier, dupliquer, changer statut, supprimer
- [ ] `app/(app)/clients/page.tsx` — Liste et gestion des clients

### Configuration déploiement
- [ ] `netlify.toml` — Config Netlify (plugin Next.js)
- [ ] `.env.local` — Remplir les 3 variables (Supabase URL, Supabase Key, Anthropic Key)

### Setup Supabase
- [ ] Exécuter `lib/supabase-schema.sql` dans l'éditeur SQL Supabase
- [ ] Configurer les policies RLS si nécessaire

### Installation
- [ ] Exécuter `npm install` pour installer les dépendances

---

## Variables d'environnement requises

Remplir `.env.local` :
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
ANTHROPIC_API_KEY=sk-ant-...
```

---

## Prochaines étapes pour reprendre

**Message à envoyer en début de nouvelle session :**

> Reprends la construction du projet BTH Expert CRM. Lis PROGRESS.md pour voir où on en est. Il reste à créer : (1) app/(app)/soumissions/page.tsx avec filtres et actions, (2) app/(app)/soumissions/[id]/page.tsx pour le détail/edit/export, (3) app/(app)/clients/page.tsx, (4) netlify.toml. Ensuite fais npm install et vérifie que tout compile.

---

## Architecture du projet (rappel)

```
BTH-Expert-CRM/
├── app/
│   ├── (app)/
│   │   ├── layout.tsx           ✅ Sidebar layout
│   │   ├── dashboard/page.tsx   ✅ Dashboard stats
│   │   ├── soumissions/
│   │   │   ├── page.tsx         ❌ À créer
│   │   │   ├── nouvelle/page.tsx ✅ Formulaire 4 étapes
│   │   │   └── [id]/page.tsx    ❌ À créer
│   │   └── clients/page.tsx     ❌ À créer
│   ├── api/
│   │   ├── generate/route.ts    ✅
│   │   ├── export/docx/route.ts ✅
│   │   ├── export/pdf/route.ts  ✅
│   │   ├── soumissions/route.ts ✅
│   │   ├── soumissions/[id]/route.ts ✅
│   │   ├── clients/route.ts     ✅
│   │   └── dashboard/route.ts   ✅
│   ├── globals.css              ✅
│   ├── layout.tsx               ✅
│   └── page.tsx                 ✅
├── components/
│   ├── layout/Sidebar.tsx       ✅
│   └── forms/
│       ├── StepClientInfo.tsx   ✅
│       ├── StepProjectInfo.tsx  ✅
│       ├── StepBudget.tsx       ✅
│       └── StepPreview.tsx      ✅
├── lib/
│   ├── anthropic.ts             ✅
│   ├── generate-docx.ts         ✅
│   ├── generate-pdf.ts          ✅
│   ├── supabase.ts              ✅
│   ├── supabase-schema.sql      ✅
│   └── utils.ts                 ✅
├── types/index.ts               ✅
├── package.json                 ✅
├── next.config.ts               ✅
├── tsconfig.json                ✅
└── postcss.config.mjs           ✅
```
