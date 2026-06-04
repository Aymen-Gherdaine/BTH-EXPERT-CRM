# Fluidity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Éliminer les skeletons 2-3s et l'écran blanc à la navigation en activant le SSR sur le Dashboard et en fixant le waterfall `/api/me` sur Soumissions.

**Architecture:** Dashboard devient un async Server Component qui fetch 4 sources en `Promise.all` et passe les données en `fallbackData` SWR — zéro skeleton au premier paint. Le hook `useSoumissions` reçoit `initialRole` depuis le server pour éviter le waterfall sur `/api/me`. Le `useDelayedLoading` (déjà présent) est branché sur DashboardClient pour supprimer les flashes.

**Tech Stack:** Next.js App Router (async Server Components), SWR (`fallbackData`, `revalidateOnMount`), Supabase SSR (`createServerClient`), TypeScript strict

---

## Déjà implémenté — NE PAS retoucher

- `hooks/useDelayedLoading.ts` ✓
- `app/(app)/dashboard/loading.tsx` ✓
- `components/layout/Sidebar.tsx` — prefetch `onMouseEnter` + `router.prefetch` on mount ✓
- `components/layout/BottomNav.tsx` — prefetch `onTouchStart` + `router.prefetch` on mount ✓

---

## File Map

| Fichier | Action |
|---|---|
| `app/(app)/dashboard/page.tsx` | Réécriture — async + Promise.all Supabase |
| `app/(app)/dashboard/DashboardClient.tsx` | Ajout props initialData + fallbackData + revalidateOnMount + useDelayedLoading |
| `app/(app)/soumissions/page.tsx` | Ajout fetch profile role + pass initialRole |
| `app/(app)/soumissions/hooks/useSoumissions.ts` | fallbackData + revalidateOnMount sur /api/me |
| `app/(app)/clients/ClientsPageClient.tsx` | Fix expand : SWR pour cache des soumissions par client |

---

## Task 1 — Dashboard SSR : page.tsx

**Files:**
- Modify: `app/(app)/dashboard/page.tsx`

- [ ] **Vérifier l'état actuel**

  ```bash
  cat app/(app)/dashboard/page.tsx
  ```
  Attendu : 5 lignes, `return <DashboardClient />;`, pas de `async`.

- [ ] **Remplacer page.tsx par la version async SSR**

  Contenu complet de `app/(app)/dashboard/page.tsx` :

  ```tsx
  import { cookies } from "next/headers";
  import { createServerClient } from "@supabase/ssr";
  import DashboardClient from "./DashboardClient";
  import type { DashboardStats, Soumission, Prospect } from "@/types";
  import type { UserRole } from "@/types";

  function buildSupabase(cookieStore: Awaited<ReturnType<typeof cookies>>) {
    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll() {},
        },
      }
    );
  }

  export default async function DashboardPage() {
    const cookieStore = await cookies();
    const supabase = buildSupabase(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return <DashboardClient />;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString().split("T")[0];

    const [profileRes, soumRes, prospectsRes] = await Promise.all([
      supabase.from("profiles").select("role, full_name").eq("id", user.id).single(),
      supabase.from("soumissions").select("*, client:clients(*)").order("created_at", { ascending: false }),
      supabase.from("prospects").select("*, visites(*)").eq("statut_global", "actif"),
    ]);

    const allSoumissions: Soumission[] = (soumRes.data ?? []) as Soumission[];
    const acceptees = allSoumissions.filter(s => s.statut === "Acceptée");
    const initialStats: DashboardStats = {
      soumissions_mois: allSoumissions.filter(s => s.date_offre >= startOfMonth).length,
      nombre_mandats_acceptes: acceptees.length,
      total_mandats_acceptes: acceptees.reduce((sum, s) => sum + (s.total_ttc ?? 0), 0),
      taux_acceptation: allSoumissions.length > 0
        ? Math.round((acceptees.length / allSoumissions.length) * 100)
        : 0,
      total_versements_recus: allSoumissions.reduce((sum, s) => sum + (s.versement_recu ?? 0), 0),
    };

    return (
      <DashboardClient
        initialProfile={{
          role: (profileRes.data?.role ?? "admin") as UserRole,
          full_name: profileRes.data?.full_name ?? null,
        }}
        initialStats={initialStats}
        initialSoumissions={allSoumissions}
        initialProspects={(prospectsRes.data ?? []) as Prospect[]}
      />
    );
  }
  ```

- [ ] **Build intermédiaire**

  ```bash
  npm run build 2>&1 | tail -20
  ```
  Attendu : erreur TypeScript sur `DashboardClient` (props non encore définies). Normal, on continue.

- [ ] **Commit**

  ```bash
  git add app/(app)/dashboard/page.tsx
  git commit -m "feat(perf): dashboard SSR — async page.tsx with Promise.all"
  ```

---

## Task 2 — Dashboard SSR : DashboardClient.tsx

**Files:**
- Modify: `app/(app)/dashboard/DashboardClient.tsx` (lignes 1-10 et 627-648)

- [ ] **Ajouter les imports manquants en tête de fichier**

  Actuellement ligne 1-10 :
  ```tsx
  "use client";

  import { useEffect, useMemo, useState } from "react";
  import type { ReactNode } from "react";
  import { motion } from "framer-motion";
  import Link from "next/link";
  import useSWR from "swr";
  import { DashboardStats, Prospect, Soumission, UserRole, Visite } from "@/types";
  import { formatMontant } from "@/lib/utils";
  import { Button } from "@/components/ui/Button";
  ```

  Remplacer par :
  ```tsx
  "use client";

  import { useEffect, useMemo, useState } from "react";
  import type { ReactNode } from "react";
  import { motion } from "framer-motion";
  import Link from "next/link";
  import useSWR from "swr";
  import { DashboardStats, Prospect, Soumission, UserRole, Visite } from "@/types";
  import { formatMontant } from "@/lib/utils";
  import { Button } from "@/components/ui/Button";
  import { fetcher } from "@/lib/fetcher";
  import { useDelayedLoading } from "@/hooks/useDelayedLoading";
  ```

- [ ] **Ajouter les types des props et modifier la signature du composant**

  Actuellement ligne 627 :
  ```tsx
  export default function DashboardClient() {
  ```

  Remplacer par :
  ```tsx
  type DashboardClientProps = {
    initialProfile?: { role: UserRole; full_name: string | null } | null;
    initialStats?: DashboardStats | null;
    initialSoumissions?: Soumission[];
    initialProspects?: Prospect[];
  };

  export default function DashboardClient({
    initialProfile,
    initialStats,
    initialSoumissions,
    initialProspects,
  }: DashboardClientProps = {}) {
  ```

- [ ] **Remplacer les 4 hooks useSWR (lignes 631-634) par des versions avec fallbackData**

  Actuellement :
  ```tsx
  const { data: meRes, isLoading: meLoading } = useSWR<MeResponse>("/api/me");
  const { data: stats, isLoading: statsLoading } = useSWR<DashboardStats>("/api/dashboard");
  const { data: soumRes, isLoading: soumissionsLoading } = useSWR<ApiListResponse<Soumission>>("/api/soumissions");
  const { data: prospectsRes, isLoading: prospectsLoading } = useSWR<ApiListResponse<Prospect>>("/api/prospects?statut=actif");
  ```

  Remplacer par :
  ```tsx
  const hasSSR = !!initialProfile;

  const { data: meRes, isLoading: meLoading } = useSWR<MeResponse>(
    "/api/me",
    fetcher,
    { fallbackData: initialProfile ?? undefined, revalidateOnMount: !hasSSR }
  );
  const { data: stats, isLoading: statsLoading } = useSWR<DashboardStats>(
    "/api/dashboard",
    fetcher,
    { fallbackData: initialStats ?? undefined, revalidateOnMount: !hasSSR }
  );
  const { data: soumRes, isLoading: soumissionsLoading } = useSWR<ApiListResponse<Soumission>>(
    "/api/soumissions",
    fetcher,
    {
      fallbackData: initialSoumissions ? { data: initialSoumissions } : undefined,
      revalidateOnMount: !hasSSR,
    }
  );
  const { data: prospectsRes, isLoading: prospectsLoading } = useSWR<ApiListResponse<Prospect>>(
    "/api/prospects?statut=actif",
    fetcher,
    {
      fallbackData: initialProspects ? { data: initialProspects } : undefined,
      revalidateOnMount: !hasSSR,
    }
  );
  ```

- [ ] **Remplacer la variable `loading` par `useDelayedLoading`**

  Actuellement (lignes 645-648) :
  ```tsx
  const loading = (meLoading && !meRes)
    || (statsLoading && !stats)
    || (soumissionsLoading && !soumRes)
    || (prospectsLoading && !prospectsRes);
  ```

  Remplacer par :
  ```tsx
  const rawLoading = (meLoading && !meRes)
    || (statsLoading && !stats)
    || (soumissionsLoading && !soumRes)
    || (prospectsLoading && !prospectsRes);
  const loading = useDelayedLoading(rawLoading, 300);
  ```

- [ ] **Build et vérification TypeScript**

  ```bash
  npm run build 2>&1 | tail -30
  ```
  Attendu : **0 erreurs**. Si erreur sur `MeResponse` ne contenant pas `role` et `full_name` : vérifier que `MeResponse` dans `DashboardClient.tsx` est défini comme `{ role?: UserRole; full_name?: string | null }`.

- [ ] **Commit**

  ```bash
  git add app/(app)/dashboard/DashboardClient.tsx
  git commit -m "feat(perf): dashboard client — fallbackData SSR + revalidateOnMount + useDelayedLoading"
  ```

---

## Task 3 — Soumissions : pass initialRole depuis SSR

**Files:**
- Modify: `app/(app)/soumissions/page.tsx`

- [ ] **Vérifier l'état actuel**

  ```bash
  cat "app/(app)/soumissions/page.tsx"
  ```
  Attendu : `return <SoumissionsClient initialSoumissions={initialSoumissions} />;` sans `initialRole`.

- [ ] **Modifier soumissions/page.tsx pour extraire et passer le rôle**

  Remplacer le contenu complet :

  ```tsx
  import { cookies } from "next/headers";
  import { createServerClient } from "@supabase/ssr";
  import SoumissionsClient from "./SoumissionsClient";
  import type { Soumission, UserRole } from "@/types";

  export default async function SoumissionsPage() {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll() {},
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    const [soumRes, profileRes] = await Promise.all([
      supabase.from("soumissions").select("*, client:clients(*)").order("created_at", { ascending: false }),
      user
        ? supabase.from("profiles").select("role").eq("id", user.id).single()
        : Promise.resolve({ data: null }),
    ]);

    const initialSoumissions: Soumission[] = (soumRes.data ?? []) as Soumission[];
    const initialRole = (profileRes.data?.role ?? null) as UserRole | null;

    return (
      <SoumissionsClient
        initialSoumissions={initialSoumissions}
        initialRole={initialRole}
      />
    );
  }
  ```

- [ ] **Build intermédiaire**

  ```bash
  npm run build 2>&1 | tail -20
  ```
  Attendu : 0 erreurs (SoumissionsClient accepte déjà `initialRole?: UserRole | null`).

- [ ] **Commit**

  ```bash
  git add "app/(app)/soumissions/page.tsx"
  git commit -m "feat(perf): soumissions SSR — pass initialRole to eliminate /api/me waterfall"
  ```

---

## Task 4 — useSoumissions : fallbackData sur /api/me

**Files:**
- Modify: `app/(app)/soumissions/hooks/useSoumissions.ts`

- [ ] **Remplacer le hook `/api/me` (ligne 16)**

  Actuellement :
  ```tsx
  const { data: meRes, isLoading: meLoading } = useSWR<MeResponse>("/api/me");
  ```

  Remplacer par :
  ```tsx
  const { data: meRes, isLoading: meLoading } = useSWR<MeResponse>(
    "/api/me",
    { fallbackData: initialRole ? { role: initialRole } : undefined,
      revalidateOnMount: !initialRole }
  );
  ```

- [ ] **Build**

  ```bash
  npm run build 2>&1 | tail -20
  ```
  Attendu : 0 erreurs.

- [ ] **Commit**

  ```bash
  git add "app/(app)/soumissions/hooks/useSoumissions.ts"
  git commit -m "feat(perf): useSoumissions — fallbackData on /api/me, no waterfall"
  ```

---

## Task 5 — ClientsPageClient : cache SWR pour expand soumissions

**Context :** Quand l'utilisateur expand un client, `toggleExpand` fait un `fetch()` plain sans SWR. Les soumissions du client sont mises en cache dans `soumMap` (Map en state local) — donc le re-expand est instant. Mais **le premier expand** montre des boîtes blanches vides pendant la requête. La solution : utiliser SWR avec clé dynamique pour bénéficier du cache inter-sessions ET avoir un `fallbackData` depuis les données initiales si elles existent.

**Files:**
- Modify: `app/(app)/clients/ClientsPageClient.tsx` (autour de ligne 620 et 675)

- [ ] **Lire les imports actuels en tête de fichier**

  ```bash
  head -20 "app/(app)/clients/ClientsPageClient.tsx"
  ```

- [ ] **Ajouter un hook de cache pour les soumissions par client**

  Trouver la définition de `expandedId` et `soumMap` dans le composant. Repérer les `useState` correspondants (autour de la ligne 620-640) puis **ajouter juste après eux** un hook SWR conditionnel :

  ```tsx
  const { data: expandedSoumRes } = useSWR<ApiListResponse<Soumission>>(
    expandedId ? `/api/soumissions?client_id=${expandedId}` : null,
    { revalidateOnMount: true, keepPreviousData: false }
  );
  ```

  Et **remplacer** la fonction `toggleExpand` (ligne ~675) par :

  ```tsx
  function toggleExpand(id: string) {
    setExpandedId(prev => (prev === id ? null : id));
    setLoadingS(null);
  }
  ```

- [ ] **Remplacer les usages de `soumMap[expandedId]`**

  Chercher dans le JSX les occurrences `soumMap[` et les remplacer par `expandedSoumRes?.data` :

  ```bash
  grep -n "soumMap" "app/(app)/clients/ClientsPageClient.tsx"
  ```

  Pour chaque occurrence dans le JSX du type `soumMap[expandedId]` ou `soumMap[id]`, remplacer par :
  ```tsx
  expandedSoumRes?.data ?? []
  ```

  Et `loadingS === id` devient :
  ```tsx
  expandedId === id && !expandedSoumRes
  ```

- [ ] **Supprimer les state devenus inutiles**

  Supprimer les lignes qui déclarent `soumMap` et `setLoadingS` si elles ne sont plus utilisées nulle part après les modifications ci-dessus. Vérifier avec :
  ```bash
  grep -n "soumMap\|setLoadingS\|loadingS" "app/(app)/clients/ClientsPageClient.tsx"
  ```

- [ ] **Build complet**

  ```bash
  npm run build 2>&1 | tail -30
  ```
  Attendu : **0 erreurs**.

- [ ] **Commit**

  ```bash
  git add "app/(app)/clients/ClientsPageClient.tsx"
  git commit -m "feat(perf): clients expand — SWR cache for per-client soumissions"
  ```

---

## Vérification finale

- [ ] **Vérifier build propre**

  ```bash
  npm run build
  ```
  Attendu : 0 errors, 0 warnings TypeScript.

- [ ] **Test manuel Dashboard**

  1. `npm run dev`
  2. Naviguer vers `/dashboard`
  3. Vérifier : aucun skeleton (données présentes au premier paint)
  4. Naviguer ailleurs puis revenir : données instantanées depuis cache SWR
  5. Inspecter Network tab : aucun appel `/api/dashboard` au re-mount

- [ ] **Test manuel Soumissions**

  1. Naviguer vers `/soumissions`
  2. Inspecter Network tab : `/api/me` ne doit PAS être appelé au montage si `initialRole` est présent (filter XHR, pas de requête `/api/me` visible)

- [ ] **Test manuel Clients expand**

  1. Naviguer vers `/clients`
  2. Expand un client → noter le temps d'apparition des soumissions
  3. Collapse puis re-expand → doit être instantané (cache SWR)

- [ ] **Commit final si tout OK**

  ```bash
  git add .
  git commit -m "perf: verify fluidity — SSR dashboard + SWR cache working"
  ```

---

## Critères de succès

| Critère | Comment vérifier |
|---|---|
| Dashboard : 0 skeleton au premier paint | Inspecter le HTML initial (View Source) — données visibles dans le markup |
| Navigation re-visit : données instantanées | Network tab : pas d'appel aux API au re-mount quand cache chaud |
| Mobile expand clients : instantané au 2e clic | Test manuel, 2e expand après collapse |
| `npm run build` : 0 erreurs | `npm run build` passe sans erreur TypeScript |
