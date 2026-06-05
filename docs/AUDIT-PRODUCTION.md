# Audit production — BTH Expert CRM

> État des lieux pour passer de « v0.1 fonctionnelle » à **production premium**.
> Audit fondé sur le code réel (pas de recommandations génériques). Daté du 2026-06-05.

## Résumé exécutif

La base est **saine** : validation zod sur une partie des routes, error boundaries,
auth gating côté serveur, `service_role` correctement isolé derrière un check auth,
RLS sur les tables cœur, tests unitaires, husky + lint-staged, config perf
(staleTimes, tree-shaking). Code propre : **0 `TODO`, 0 `any`**.

Il reste cependant des **trous de sécurité et d'industrialisation** à combler avant
une vraie mise en production. Priorisation ci-dessous.

| # | Chantier | Priorité | Effort | Risque si ignoré |
|---|----------|----------|--------|------------------|
| 1 | Schéma + RLS de `profiles`, `prospects`, `visites` | **P0** | M | Fuite de données entre comptes / DB non reproductible |
| 2 | Validation d'entrée sur 6 routes mutantes | **P0** | S | Données corrompues, erreurs 500, injection logique |
| 3 | Monitoring d'erreurs runtime (Sentry) | **P0** | S | Aveugle sur les crashs en prod |
| 4 | Validation des variables d'env au boot | **P0** | S | Crash opaque si une env manque |
| 5 | CI GitHub Actions (lint + test + build) | **P1** | S | Régressions non détectées |
| 6 | Rate limiting étendu | **P1** | S | Abus / brute-force / coûts IA |
| 7 | Headers de sécurité HTTP | **P1** | S | Clickjacking, XSS, fuites referrer |
| 8 | Tests d'intégration + E2E des parcours critiques | **P1** | L | Régressions silencieuses sur le cœur métier |
| 9 | Découpage des 4 fichiers monolithes | **P2** | L | Maintenabilité, taille des bundles |
| 10 | CSS runtime `<style>` → Tailwind/CSS modules | **P2** | M | Perf, cohérence |
| 11 | Audit accessibilité (a11y) | **P2** | M | Exclusion utilisateurs, conformité |
| 12 | PWA installable + offline | **P2** | M | Expérience mobile non « premium » |
| 13 | Logging structuré (remplacer `console.*`) | **P2** | S | Debug difficile en prod |

Effort : **S** = < ½ journée · **M** = 1–2 jours · **L** = 3 jours+

---

## P0 — Sécurité & fiabilité (bloquant pour la prod)

### 1. Schéma et RLS manquants pour `profiles`, `prospects`, `visites`

**Constat.** Tables réellement utilisées par le code (nombre d'appels `.from()`) :

| Table | Usages | `create table` versionné | RLS versionné |
|-------|:------:|:------------------------:|:-------------:|
| profiles | 21 | ❌ | ❌ |
| soumissions | 11 | ✅ `lib/supabase-schema.sql` | ✅ `lib/supabase-rls-policies.sql` |
| clients | 9 | ✅ | ✅ |
| prospects | 7 | ❌ | ❌ |
| depenses | 7 | ✅ `supabase/migrations/20260506000000_add_depenses.sql` | ✅ (6 policies) |
| visites | 4 | ❌ | ❌ |
| lignes_budget | 4 | ✅ | ✅ |
| parametres | 2 | ✅ `lib/supabase-parametres.sql` | ✅ (6 policies) |

`profiles`, `prospects` et `visites` n'ont **ni `create table` ni `enable row level
security` versionnés** dans le repo. Elles existent probablement créées à la main
dans Supabase, mais :
- **Risque sécurité** : impossible de garantir que la RLS est active. Sur un CRM
  multi-utilisateur, une seule table sans RLS = n'importe quel utilisateur
  authentifié peut lire/écrire les données des autres via l'API Supabase.
  `profiles` (rôles utilisateurs) sans RLS correcte = escalade de privilèges.
- **Risque reproductibilité** : impossible de recréer la base depuis le repo
  (nouvel environnement, rollback, onboarding).

**Action.**
1. Vérifier dans le dashboard Supabase que RLS est **activé** sur `profiles`,
   `prospects`, `visites` + lister les policies existantes.
2. Versionner le schéma + les policies de ces 3 tables dans
   `supabase/migrations/`.
3. Ajouter un test/script qui échoue si une table de `public` n'a pas RLS.

**Fichiers** : `supabase/migrations/` (nouveaux), `lib/supabase-rls-policies.sql`.

---

### 2. Six routes mutantes sans validation d'entrée

**Constat.** 9 routes valident déjà via zod (`safeParse` / helper `validateBody`),
mais 6 routes en `POST`/`PUT`/`PATCH` acceptent un body **non vérifié** :

- `app/api/admin/users/[id]/route.ts`
- `app/api/admin/users/invite/route.ts`
- `app/api/prospects/[id]/route.ts`
- `app/api/soumissions/[id]/route.ts`
- `app/api/soumissions/[id]/lignes/route.ts`
- `app/api/depenses/[id]/route.ts`

`admin/users/*` est le plus sensible (gestion des comptes/rôles).

**Action.** Étendre le pattern existant : créer un schéma zod dans
`lib/schemas/` et passer le body par `validateBody()` (`lib/schemas/helpers.ts`).

**Effort** : S (le helper existe déjà, c'est de la réplication).

---

### 3. Aucun monitoring d'erreurs runtime

**Constat.** Aucune intégration Sentry / équivalent. Les erreurs sont gérées par
les error boundaries (`app/error.tsx`, `app/(app)/error.tsx`) et quelques
`console.error` côté serveur (8 occurrences) — mais **rien ne remonte** en prod.
Tu découvres les bugs par les utilisateurs.

**Action.** Intégrer Sentry (Next.js SDK) : capture client + serveur,
source maps, alerting. Brancher sur les error boundaries existantes.

**Fichiers** : `sentry.*.config.ts`, `next.config.ts`, `app/error.tsx`,
`app/(app)/error.tsx`.

---

### 4. Pas de validation des variables d'environnement

**Constat.** Les env sont lues partout avec l'assertion non-null `process.env.X!`
(28 fichiers). Si une variable manque en prod, le crash est **opaque** et tardif
(au premier appel, pas au boot).

Variables critiques : `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, clé Anthropic.

**Action.** Un module `lib/env.ts` qui valide toutes les env au démarrage via zod
et exporte un objet typé. Remplacer les `process.env.X!` par `env.X`.

**Effort** : S.

---

## P1 — Industrialisation

### 5. Aucune CI

**Constat.** `.github/workflows/` est absent. husky + lint-staged tournent **en
local uniquement** → rien ne garantit que `lint` / `test` / `build` passent sur un
push ou une PR.

**Action.** Workflow GitHub Actions : `npm ci` → `lint` → `test` → `build` sur
push et PR. Bloquer le merge si rouge.

**Fichier** : `.github/workflows/ci.yml` (nouveau).

---

### 6. Rate limiting limité à une seule route

**Constat.** Seul `app/api/generate/route.ts` (génération IA) est limité. Sont
exposés sans limite : `auth/*`, `admin/users/invite`, les exports
(`export/docx`, `export/pdf`, `*/export`).

**Action.** Middleware de rate limit (ex. Upstash Ratelimit) sur les endpoints
sensibles : auth (anti-brute-force), invitations, exports (coûteux).

---

### 7. Headers de sécurité HTTP absents

**Constat.** `next.config.ts` ne définit aucun header de sécurité.

**Action.** Ajouter via `headers()` : `Content-Security-Policy`,
`Strict-Transport-Security`, `X-Frame-Options: DENY`, `X-Content-Type-Options:
nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`,
`Permissions-Policy`.

**Fichier** : `next.config.ts`.

---

### 8. Tests d'intégration et E2E manquants

**Constat.** 5 tests unitaires, **uniquement sur des fonctions pures** :
`__tests__/{formatMontant,calcTotaux,generateNumeroOffre,sanitizeAiText,nombreEnLettres}.test.ts`.
Aucun test sur :
- les routes API (auth, validation, autorisation par rôle) ;
- les composants ;
- les parcours critiques bout-en-bout.

**Action.**
- Tests d'intégration des routes API (Vitest + mock Supabase) : focus auth +
  validation + RLS.
- E2E Playwright sur les parcours cœur : login, créer une soumission, exporter,
  gérer un client.

**Effort** : L.

---

## P2 — Polish & maintenabilité

### 9. Quatre fichiers monolithes

| Fichier | Taille |
|---------|-------:|
| `app/(app)/prospection/ProspectionPageClient.tsx` | 76 Ko |
| `app/(app)/clients/ClientsPageClient.tsx` | 58 Ko |
| `app/(app)/depenses/DepensesPageClient.tsx` | 50 Ko |
| `app/(app)/admin/utilisateurs/page.tsx` | 42 Ko |

Difficiles à maintenir, et chacun gonfle le bundle JS de sa route. À découper en
sous-composants + hooks (le dossier `components/forms/StepPreview/hooks/` montre
que le pattern est déjà maîtrisé ailleurs).

### 10. CSS injecté en `<style>` au runtime

Plusieurs pages injectent de gros blocs `<style>{CSS}</style>` (ex.
`ClientsPageClient`). À migrer vers Tailwind / CSS modules : meilleure perf
(pas de réinjection au montage), cohérence avec le reste du design system.

### 11. Accessibilité

Audit à mener : gestion du focus (modales, sheets), attributs ARIA, navigation
clavier, contrastes, `prefers-reduced-motion` (beaucoup d'animations framer-motion).

### 12. PWA installable

Seul `app/icon.svg` existe. Pour un CRM **mobile-first**, ajouter
`app/manifest.ts` + icônes maskables + service worker (offline lecture seule)
serait un vrai cran « premium ».

### 13. Logging structuré

8 `console.error` côté serveur (`export/docx`, `export/pdf`, `soumissions`,
`generate`, `generate-document`) + 2 côté client. À remplacer par un logger
structuré relié au monitoring (#3).

---

## Hors périmètre (volontairement)

- **SEO / sitemap / robots** : l'app est privée (derrière auth), non prioritaire.

---

## Ordre d'exécution recommandé

1. **#1 + #4** (RLS + env) — sécurise le socle de données et le boot.
2. **#2 + #3** (validation routes + Sentry) — ferme les trous d'entrée et donne de
   la visibilité.
3. **#5 + #7 + #6** (CI + headers + rate limit) — industrialise.
4. **#8** (tests) — verrouille le cœur métier contre les régressions.
5. **#9 → #13** (refacto, CSS, a11y, PWA, logs) — polish premium.
