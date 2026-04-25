# BTH Expert CRM — Progression de la construction

## État : **🔧 EN COURS — Auth + Layout terminés, pages métier à construire**

---

## ✅ FONCTIONNEL (base complète)

### Configuration projet
- [x] `package.json` — Next.js 16.2.4, 0 vulnérabilité
- [x] `next.config.ts` — turbopack root configuré
- [x] `tsconfig.json` — auto-ajusté par Next.js (jsx: react-jsx, target: ES2017)
- [x] `postcss.config.mjs` — Tailwind v4
- [x] `netlify.toml` — déploiement Netlify Next.js

### Types & Utilitaires
- [x] `types/index.ts`
- [x] `lib/utils.ts`
- [x] `lib/supabase.ts` — compatible clé sb_publishable_
- [x] `lib/supabase-schema.sql` — schéma SQL (3 tables + index) — **exécuté dans Supabase ✅**
- [x] `lib/supabase-rls-policies.sql` — policies RLS — **exécuté dans Supabase ✅**

### IA & Génération documents
- [x] `lib/anthropic.ts` — claude-sonnet-4-5, prompt formel algérien
- [x] `lib/generate-docx.ts` — export Word complet
- [x] `lib/generate-pdf.ts` — export PDF jsPDF v4 + autoTable v5

### API Routes (toutes opérationnelles)
- [x] `app/api/generate/route.ts`
- [x] `app/api/export/docx/route.ts`
- [x] `app/api/export/pdf/route.ts`
- [x] `app/api/soumissions/route.ts`
- [x] `app/api/soumissions/[id]/route.ts`
- [x] `app/api/clients/route.ts`
- [x] `app/api/dashboard/route.ts`

### Pages (toutes créées)
- [x] `app/(app)/dashboard/page.tsx`
- [x] `app/(app)/soumissions/page.tsx`
- [x] `app/(app)/soumissions/nouvelle/page.tsx`
- [x] `app/(app)/soumissions/[id]/page.tsx`
- [x] `app/(app)/clients/page.tsx`

### Composants formulaires
- [x] `components/forms/StepClientInfo.tsx`
- [x] `components/forms/StepProjectInfo.tsx`
- [x] `components/forms/StepBudget.tsx`
- [x] `components/forms/StepPreview.tsx`

---

## ✅ AUTHENTIFICATION SUPABASE (sessions 2026-04-20 → 2026-04-25)

### Auth de base (2026-04-20)
- [x] `middleware.ts` — protection toutes les routes, redirect `/login` si pas de session, routes publiques : `/login`, `/auth/callback`, `/auth/set-password`
- [x] `lib/supabase-server.ts` — `createMiddlewareClient(request)` via `@supabase/ssr`
- [x] `lib/supabase-browser.ts` — `createBrowserClient` pour les Client Components
- [x] `app/(auth)/layout.tsx` — layout minimaliste sans Sidebar pour les pages auth
- [x] `app/(auth)/login/page.tsx` — vérifie session côté serveur, rend `<LoginForm />`
- [x] `components/auth/LoginForm.tsx` — formulaire email + mot de passe, `signInWithPassword`, redirect après succès

### Flow d'invitation Supabase (2026-04-25)
- [x] `app/auth/callback/route.ts` — intercepte le token PKCE, échange contre une session via `exchangeCodeForSession()`, redirige selon `type` (invite/recovery → `/auth/set-password`, sinon → `/dashboard`)
- [x] `app/auth/set-password/page.tsx` — formulaire définition mot de passe, icône œil afficher/masquer, validation 8 caractères, bouton "Confirmer et accéder", redirect `/dashboard`
- [x] `components/auth/HashTokenRedirect.tsx` — bridge flow implicite : détecte `#access_token` dans l'URL de `/login`, appelle `setSession()`, affiche écran de chargement (logo + spinner), redirige vers `/auth/set-password`

### Config Supabase (faite manuellement ✅)
- [x] Authentication → URL Configuration → Redirect URLs : `http://localhost:3000/auth/callback` ajouté
- [ ] Authentication → Settings → Auth flow type : passer de **Implicit** à **PKCE** *(à faire pour sécuriser)*

---

## ✅ LAYOUT & NAVIGATION (session 2026-04-25)

- [x] `components/layout/Sidebar.tsx` — logo BTH Hub, navigation (Dashboard / Soumissions / Clients), CTA "Nouvelle soumission" en bas — section utilisateur retirée (déplacée dans Header)
- [x] `components/layout/Header.tsx` — barre sticky en haut à droite, nom utilisateur + avatar (photo Supabase ou initiales `#1a2e1e`), dropdown animé (Mon profil / Paramètres / Se déconnecter), skeleton de chargement, `signOut()` → redirect `/login`
- [x] `app/(app)/layout.tsx` — structure : Sidebar (gauche) + colonne droite (Header sticky + main)

### Design pages auth (session 2026-04-25)
- [x] `components/auth/LoginForm.tsx` — logo BTH Hub centré, couleurs `#1a2e1e`, champs avec `autoComplete`, message d'erreur stylé
- [x] `app/auth/set-password/page.tsx` — logo BTH Hub, design professionnel, icône œil, focus ring `#1a2e1e`

---

## ✅ REBRANDING BTH Hub + couleurs vertes (session 2026-04-25)

- [x] `app/layout.tsx` — title → "BTH Hub", description → "BTH Hub — Gestion des offres"
- [x] `app/globals.css` — `--color-primary: #1a2e1e` (était `#2E7DB2`)
- [x] `components/layout/Sidebar.tsx` — "BTH Hub" + toutes couleurs → `#1a2e1e`
- [x] `app/(app)/dashboard/page.tsx` — texte + couleur
- [x] `app/(app)/clients/page.tsx` — couleur
- [x] `app/(app)/soumissions/page.tsx` — couleur
- [x] `app/(app)/soumissions/nouvelle/page.tsx` — couleur
- [x] `app/(app)/soumissions/[id]/page.tsx` — couleur
- [x] `components/forms/StepBudget.tsx` — couleur
- [x] `components/forms/StepClientInfo.tsx` — couleur
- [x] `components/forms/StepProjectInfo.tsx` — couleur
- [x] `components/forms/StepPreview.tsx` — couleur
- [x] `lib/generate-pdf.ts` / `lib/generate-docx.ts` / `lib/anthropic.ts` — **intacts** (conservent "BTH Expert" pour les documents officiels)
- [x] Commit : `feat: rebranding BTH Hub + couleurs vert #1a2e1e`

---

## 🔧 CORRECTIONS PDF/DOCX (session 2026-04-19)

| # | Problème | Fichier | Statut |
|---|----------|---------|--------|
| 1 | `formatMontant` affichait `100 /000,00` | `lib/utils.ts` | ✅ Corrigé |
| 2 | Police amateur (tout Helvetica) | `lib/generate-pdf.ts` | ✅ body Times, titres Helvetica Bold |
| 3 | Police DOCX (Calibri) | `lib/generate-docx.ts` | ✅ Times New Roman |
| 4 | Tableau 4-2 dupliquait toutes les lignes | `lib/generate-pdf.ts` | ✅ Corrigé — recap seul |
| 5 | Tableau 4-2 DOCX dupliquait les lignes | `lib/generate-docx.ts` | ✅ Corrigé |
| 6 | Signatures sans espace pour paraphes | `lib/generate-pdf.ts` | ✅ 35 mm d'espace avant chaque nom |
| 7 | En-tête "BTH EXPERT" sans tracking | `lib/generate-pdf.ts` | ✅ `setCharSpace(1.5)` |
| 8 | "Offre No :" sur une seule ligne | `lib/generate-pdf.ts` | ✅ label + numéro sur deux lignes |

### ⏳ À vérifier
- [ ] Espacement général PDF avec police Times (metrics différentes d'Helvetica)
- [ ] Tableau 4-2 DOCX — cohérence dans Word
- [ ] Logo BTH EXPERT — texte seulement pour l'instant, prévoir PNG si disponible
- [ ] Couleur en-tête DOCX — vérifier rendu dans tous les éditeurs
- [ ] `setCharSpace` jsPDF — confirmer que le tracking ne déplace pas le texte

---

## ✅ PAGE PROFIL (session 2026-04-25)

- [x] `app/(app)/profil/page.tsx` — section 1 : avatar (upload → Supabase Storage bucket "avatars", preview immédiate), nom complet modifiable, email en lecture seule, `updateUser()` + `router.refresh()` ; section 2 : changement mot de passe avec icône œil, validation 8 car. + correspondance
- [x] `lib/supabase-storage.sql` — script SQL bucket "avatars" (public, 5 Mo max, JPEG/PNG/WEBP/GIF) + 4 policies RLS (lecture publique, upload/update/delete par propriétaire uniquement) — **à exécuter manuellement dans Supabase SQL Editor**
- [x] `components/layout/Sidebar.tsx` — "Mon profil" retiré de la nav (accessible uniquement via dropdown header)

---

## ✅ PAGE PARAMÈTRES (session 2026-04-25)

- [x] `app/(app)/parametres/page.tsx` — 3 sections : informations société (nom, adresse, ville, email, tél, site web), signataires par défaut (2 × nom + titre), valeurs par défaut (TVA %, délai jours, validité jours, modalités paiement) ; chargement depuis Supabase au démarrage, upsert `id=1` à la sauvegarde, feedback succès/erreur
- [x] `lib/supabase-parametres.sql` — table `parametres` ligne unique (contrainte `id=1`), valeurs par défaut intégrées, RLS (lecture + modification pour utilisateurs connectés) — **à exécuter dans Supabase SQL Editor**
- [x] `lib/generate-pdf.ts` — interface `ParametresPdf` + param optionnel ajouté à `generatePdf()`, signataires dynamiques avec fallback sur les valeurs hardcodées
- [x] `lib/generate-docx.ts` — interface `ParametresDocx` + param optionnel ajouté à `generateDocx()`, TVA dynamique (`tva_pct / 100`), signataires dynamiques avec fallback
- [x] `components/layout/Header.tsx` — lien "Paramètres" déjà présent, pas de modification nécessaire

---

## 🔲 RESTE À FAIRE

### Pages & UI
- [ ] Dashboard — statistiques réelles, KPIs, activité récente (page créée mais vide)
- [ ] Soumissions — vérifier UX complète (liste, filtres, statuts)
- [ ] Clients — vérifier UX complète

### Fonctionnalités métier
- [ ] Brancher les paramètres sur les exports : mettre à jour `app/api/export/pdf/route.ts` et `app/api/export/docx/route.ts` pour fetcher les paramètres Supabase et les passer à `generatePdf()` / `generateDocx()`
- [ ] Génération IA — tester et valider les sections générées via API Anthropic
- [ ] Export PDF — test visuel complet conforme à Soumission_Sarl SAFMA.pdf
- [ ] Export DOCX — test visuel complet
- [ ] Numérotation automatique des offres (format `T + JJMMAAAA`)

### Infrastructure & Déploiement
- [ ] Passer Auth flow Supabase en **PKCE** (Supabase Dashboard → Authentication → Settings)
- [ ] Config Supabase production : ajouter `https://mondomaine.com/auth/callback` dans Redirect URLs
- [ ] Variables d'environnement Netlify : `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ANTHROPIC_API_KEY`
- [ ] Push GitHub + déploiement Netlify

---

## Versions installées

| Package | Version |
|---------|---------|
| Next.js | 16.2.4 |
| Framer Motion | 12.9.4 |
| Supabase JS | 2.49.4 |
| @supabase/ssr | installé |
| Anthropic SDK | 0.39.0 |
| docx | 9.5.0 |
| jsPDF | 4.2.1 |
| jspdf-autotable | 5.0.7 |
| Tailwind CSS | v4 |
