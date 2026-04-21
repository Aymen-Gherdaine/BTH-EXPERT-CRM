# BTH Expert CRM — Progression de la construction

## État : **🔧 EN COURS — Corrections design PDF/DOCX**

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
- [x] `lib/supabase-schema.sql` — schéma SQL (3 tables + index)
- [x] `lib/supabase-rls-policies.sql` — policies RLS

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
- [x] `app/(app)/layout.tsx` — Sidebar layout
- [x] `app/(app)/dashboard/page.tsx`
- [x] `app/(app)/soumissions/page.tsx`
- [x] `app/(app)/soumissions/nouvelle/page.tsx`
- [x] `app/(app)/soumissions/[id]/page.tsx`
- [x] `app/(app)/clients/page.tsx`

### Composants
- [x] `components/layout/Sidebar.tsx`
- [x] `components/forms/StepClientInfo.tsx`
- [x] `components/forms/StepProjectInfo.tsx`
- [x] `components/forms/StepBudget.tsx`
- [x] `components/forms/StepPreview.tsx`

---

## 🔧 AUTHENTIFICATION SUPABASE (session 2026-04-20)

### ✅ Fait dans cette session

| # | Fichier | Description |
|---|---------|-------------|
| 1 | `middleware.ts` (racine) | Middleware Next.js — protection toutes les routes, redirect `/login` si pas de session, redirect `/dashboard` si déjà connecté sur `/login` |
| 2 | `lib/supabase-server.ts` | `createMiddlewareClient(request)` via `@supabase/ssr` — gère les cookies de session côté serveur |
| 3 | `@supabase/ssr` installé | Package ajouté dans `package.json` — coexiste sans conflit avec `@supabase/supabase-js` |

### ✅ Complété (session 2026-04-20 suite)

| # | Fichier | Description |
|---|---------|-------------|
| A | `lib/supabase-browser.ts` | `createBrowserClient` de `@supabase/ssr` — pour les Client Components |
| B | `app/(auth)/layout.tsx` | Layout minimaliste sans Sidebar pour les pages login |
| C | `app/(auth)/login/page.tsx` | Page login — vérifie session côté serveur, rend `<LoginForm />` |
| D | `components/auth/LoginForm.tsx` | Formulaire email + mot de passe, `signInWithPassword`, redirect après succès |
| E | `app/(app)/layout.tsx` | Vérification session côté serveur ajoutée + redirect `/login` si non connecté |

### ❌ Reste à faire (auth)

| # | Point | Détail |
|---|-------|--------|
| A | Créer un utilisateur Supabase | Aller dans Supabase > Authentication > Users > Invite user — aucun système d'inscription prévu |
| B | Bouton logout | Ajouter `supabase.auth.signOut()` + redirect `/login` dans `components/layout/Sidebar.tsx` |
| C | Test visuel login | Vérifier le flux complet : accès `/dashboard` sans session → redirect `/login` → connexion → redirect `/dashboard` |

---

## 🔧 CORRECTIONS PDF/DOCX EN COURS (session 2026-04-19)

### ✅ Corrigé dans cette session

| # | Problème | Fichier | Statut |
|---|----------|---------|--------|
| 1 | `formatMontant` affichait `100 /000,00` | `lib/utils.ts` | ✅ Corrigé — implémentation manuelle avec espace insécable |
| 2 | Police amateur (tout Helvetica) | `lib/generate-pdf.ts` | ✅ Corrigé — body en Times, titres en Helvetica Bold |
| 3 | Police DOCX (Calibri) | `lib/generate-docx.ts` | ✅ Corrigé — Times New Roman |
| 4 | Tableau 4-2 dupliquait toutes les lignes | `lib/generate-pdf.ts` | ✅ Corrigé — Tableau 4-2 = recap seul (Total HT / TVA 19% / TTC) |
| 5 | Tableau 4-2 DOCX dupliquait les lignes | `lib/generate-docx.ts` | ✅ Corrigé — même logique recap |
| 6 | Signatures sans espace pour paraphes | `lib/generate-pdf.ts` | ✅ Corrigé — 35 mm d'espace avant chaque nom |
| 7 | En-tête "BTH EXPERT" sans tracking | `lib/generate-pdf.ts` | ✅ Corrigé — `setCharSpace(1.5)` |
| 8 | "Offre No :" sur une seule ligne | `lib/generate-pdf.ts` | ✅ Corrigé — label + numéro sur deux lignes (comme SAFMA p.1) |

### ⏳ À vérifier après test visuel du PDF généré

| # | Point | Détail |
|---|-------|--------|
| A | Espacement général | Vérifier que les sauts de page tombent aux bons endroits avec la police Times (metrics différentes d'Helvetica) |
| B | Tableau 4-2 DOCX | Vérifier que le tableau sans header visuel est cohérent dans Word |
| C | Logo BTH EXPERT | Actuellement texte seulement — prévoir import d'un vrai fichier logo PNG si disponible |
| D | Couleur en-tête DOCX | Vérifier que la ligne bleue sous le header Word s'affiche correctement dans tous les éditeurs |
| E | `setCharSpace` jsPDF | Confirmer que le rendu du tracking est visible et ne déplace pas le texte hors de la page |

### ❌ Pas encore traité

| # | Problème | Note |
|---|----------|------|
| F | Logo BTH EXPERT (image réelle) | Nécessite un fichier PNG/SVG du logo à placer en haut à droite — texte utilisé en attendant |
| G | Page de garde distincte | Le modèle SAFMA n'en a pas, mais peut être demandé plus tard |

---

## 🔧 SETUP SUPABASE (à faire manuellement)

1. Aller dans Supabase > SQL Editor
2. Exécuter `lib/supabase-schema.sql` (crée les 3 tables)
3. Exécuter `lib/supabase-rls-policies.sql` (active RLS + policies)

---

## 🚀 DÉPLOIEMENT NETLIFY

1. Push sur GitHub
2. Connecter le repo dans Netlify
3. Ajouter les 3 variables d'environnement dans Netlify :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `ANTHROPIC_API_KEY`
4. Déployer

---

## Versions installées

- Next.js : 16.2.4
- Framer Motion : 12.9.4
- Supabase JS : 2.49.4
- Anthropic SDK : 0.39.0
- docx : 9.5.0
- jsPDF : 4.2.1
- jspdf-autotable : 5.0.7
- Tailwind CSS : v4
