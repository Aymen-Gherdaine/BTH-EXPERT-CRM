# BTH Hub — Fluidité de navigation (Design Spec)

**Date** : 2026-06-02  
**Objectif** : Éliminer les skeletons 2-3s et le "rien du tout" à la navigation. Cible : expérience Supabase/Render — données présentes au premier paint, transitions < 100ms.

---

## Contexte & diagnostic

### Problèmes identifiés

| Problème | Fichier | Sévérité |
|---|---|---|
| Dashboard 100% client-side — 4 `useSWR` sans `fallbackData` | `DashboardClient.tsx` | Critique |
| `SWRProvider` manque `revalidateOnMount: false` — refetch au montage même avec `fallbackData` | `SWRProvider.tsx` | Haute |
| Waterfall `/api/me` sans `fallbackData` dans `useSoumissions` | `useSoumissions.ts:16` | Haute |
| Mobile : chunks JS non préchargés → écran blanc avant `loading.tsx` | `BottomNav.tsx`, layout | Haute |
| Skeletons sans délai — flash visible même si données arrivent en 80ms | `DashboardClient.tsx` | Moyenne |

### Ce qui fonctionne déjà

- `ClientsPage`, `SoumissionsPage`, `DepensesPage` : SSR avec `Promise.all` ✓
- `loading.tsx` présent pour clients + soumissions, bien calqué sur le layout final ✓
- `SWRProvider` : `keepPreviousData: true`, `revalidateOnFocus: false` ✓
- `NavigationProgress` (NProgress gold) ✓
- `<Link>` Next.js utilisé partout (pas de `router.push` sur la nav) ✓

---

## Approche retenue

**A + C** : SSR-first sur toutes les pages manquantes + SWR tuning + prefetch au survol/touch.

---

## Section 1 — SSR Dashboard

### Problème
`DashboardPage` (`app/(app)/dashboard/page.tsx`) est synchrone et ne fait que `return <DashboardClient />`. Les 4 requêtes (`/api/me`, `/api/dashboard`, `/api/soumissions`, `/api/prospects?statut=actif`) partent du navigateur après montage → skeleton immédiat et systématique.

### Solution
Rendre `DashboardPage` **async Server Component**. Fetcher les 4 sources en `Promise.all` direct Supabase (sans passer par les API routes, même pattern que `ClientsPage`).

```ts
// app/(app)/dashboard/page.tsx — après
export default async function DashboardPage() {
  const supabase = createServerClient(...)
  const { data: { user } } = await supabase.auth.getUser()

  const [profileRes, statsRes, soumRes, prospectsRes] = await Promise.all([
    supabase.from("profiles").select("role, full_name").eq("id", user!.id).single(),
    supabase.from("soumissions").select("statut, total_ttc, versement_recu, date_offre"),
    supabase.from("soumissions").select("*, client:clients(*)").order("created_at", { ascending: false }).limit(10),
    supabase.from("prospects").select("*, visites(*)").eq("statut_global", "actif"),
  ])

  return (
    <DashboardClient
      initialProfile={profileRes.data}
      initialStats={/* computed from statsRes */}
      initialSoumissions={soumRes.data ?? []}
      initialProspects={prospectsRes.data ?? []}
    />
  )
}
```

`DashboardClient` reçoit ces props et les passe en `fallbackData` à chaque `useSWR`. Le composant rend immédiatement avec les données SSR, zéro état de chargement au premier paint.

**Note** : `/api/dashboard` calcule des agrégats (`total_mandats_acceptes`, `total_versements_recus`, `taux_acceptation`, etc.). Ces calculs sont déplacés côté serveur dans `page.tsx` pour éviter un appel API supplémentaire.

### Fichiers
- `app/(app)/dashboard/page.tsx` — réécriture complète (async + Promise.all)
- `app/(app)/dashboard/DashboardClient.tsx` — ajout props `initialProfile`, `initialStats`, `initialSoumissions`, `initialProspects` ; `fallbackData` sur les 4 `useSWR`

### Ajout : `loading.tsx` Dashboard
Dashboard n'a pas de `loading.tsx`. Le créer pour que le skeleton s'affiche immédiatement si la route n'est pas encore préchargée.

- `app/(app)/dashboard/loading.tsx` — nouveau, skeleton calqué sur le layout dashboard

---

## Section 2 — SWR tuning global

### Changements dans `SWRProvider.tsx`

Aucun ajout — la config globale reste telle quelle (`keepPreviousData: true`, `revalidateOnFocus: false`, `dedupingInterval: 30000`).

**Pourquoi ne pas mettre `revalidateOnMount: false` globalement** : Si appliqué globalement, tous les hooks SWR sans `fallbackData` ne fetcheraient jamais leur donnée au montage — data `undefined` permanente. Le flag doit être appliqué **par-hook**, uniquement là où `fallbackData` est fourni via SSR.

### `revalidateOnMount: false` par-hook

Dans chaque hook qui reçoit des données SSR via `fallbackData`, ajouter explicitement le flag :

```ts
// Dans DashboardClient.tsx — après ajout des props SSR
const { data: meRes }     = useSWR("/api/me",     { fallbackData: initialProfile, revalidateOnMount: false })
const { data: stats }     = useSWR("/api/dashboard", { fallbackData: initialStats,   revalidateOnMount: false })
const { data: soumRes }   = useSWR("/api/soumissions", { fallbackData: { data: initialSoumissions }, revalidateOnMount: false })
const { data: prospectsRes } = useSWR("/api/prospects?statut=actif", { fallbackData: { data: initialProspects }, revalidateOnMount: false })

// Dans useSoumissions.ts — après ajout du fallbackData pour /api/me
const { data: meRes } = useSWR("/api/me", {
  fallbackData: initialRole ? { role: initialRole } : undefined,
  revalidateOnMount: !initialRole,   // revalide seulement si pas de donnée SSR
})
```

### Waterfall `/api/me` dans `useSoumissions`

La page `soumissions/page.tsx` fetche déjà le user Supabase (ligne 25). Elle peut extraire le rôle et le passer comme prop.

```ts
// soumissions/page.tsx
const [soumRes, profileRes] = await Promise.all([
  supabase.from("soumissions").select("*, client:clients(*)").order(...),
  supabase.from("profiles").select("role").eq("id", user.id).single(),
])
return <SoumissionsClient initialSoumissions={...} initialRole={profileRes.data?.role} />
```

```ts
// useSoumissions.ts
export function useSoumissions(initialSoumissions = [], initialRole?: UserRole) {
  const { data: meRes } = useSWR<MeResponse>("/api/me", {
    fallbackData: initialRole ? { role: initialRole } : undefined,
  })
  // ...
}
```

**Fichiers** : `app/(app)/soumissions/page.tsx`, `app/(app)/soumissions/SoumissionsClient.tsx`, `app/(app)/soumissions/hooks/useSoumissions.ts`

---

## Section 3 — Skeleton différé 300ms

### Hook `useDelayedLoading`

```ts
// hooks/useDelayedLoading.ts
export function useDelayedLoading(loading: boolean, delay = 300): boolean {
  const [show, setShow] = useState(false)
  useEffect(() => {
    if (!loading) { setShow(false); return }
    const t = setTimeout(() => setShow(true), delay)
    return () => clearTimeout(t)
  }, [loading, delay])
  return show
}
```

Utilisé dans `DashboardClient` pour remplacer la variable `loading` brute. Si les données arrivent en < 300ms (cache SWR), aucun skeleton n'apparaît jamais.

**Fichier** : `hooks/useDelayedLoading.ts` (nouveau)

---

## Section 4 — Prefetch au survol et au touch (Approach C)

### Mapping routes → clés SWR

```ts
const PREFETCH_MAP: Record<string, string[]> = {
  "/dashboard":   ["/api/dashboard", "/api/soumissions", "/api/me", "/api/prospects?statut=actif"],
  "/soumissions": ["/api/soumissions", "/api/me"],
  "/clients":     ["/api/clients"],
  "/prospection": ["/api/prospects?statut=actif"],
  "/depenses":    ["/api/depenses", "/api/soumissions"],
}
```

### Desktop — `Sidebar.tsx`

Sur chaque item nav, ajouter `onMouseEnter` :

```tsx
onMouseEnter={() => {
  const keys = PREFETCH_MAP[item.href] ?? []
  keys.forEach(key => preload(key, fetcher))
}}
```

`preload` est importé depuis `swr`. Si la clé est déjà en cache (`dedupingInterval`), l'appel est no-op.

### Mobile — `BottomNav.tsx`

`touchstart` se déclenche ~100ms avant `click`. Sur mobile, il n'y a pas de hover, donc le prefetch doit se faire sur `touchstart` :

```tsx
onTouchStart={() => {
  router.prefetch(item.href)          // précharge le JS chunk Next.js
  const keys = PREFETCH_MAP[item.href] ?? []
  keys.forEach(key => preload(key, fetcher))  // précharge les données SWR
}}
```

`router.prefetch()` télécharge le bundle JS de la route. Sans ça, la première navigation vers une route non visitée télécharge le chunk sur le clic → écran blanc.

### Prefetch au montage du layout

Dans `app/(app)/layout.tsx` (ou dans le `Sidebar.tsx`), au montage, prefetch les routes primaires proactvement pour les routes toujours visibles :

```tsx
useEffect(() => {
  ["/dashboard", "/soumissions", "/clients"].forEach(href => router.prefetch(href))
}, [])
```

**Fichiers** : `components/layout/Sidebar.tsx`, `components/layout/BottomNav.tsx`

---

## Récapitulatif des fichiers

| Fichier | Action | Impact |
|---|---|---|
| `app/(app)/dashboard/page.tsx` | Réécriture async + Promise.all | Critique |
| `app/(app)/dashboard/DashboardClient.tsx` | Props initialData + fallbackData | Critique |
| `app/(app)/dashboard/loading.tsx` | Nouveau skeleton dashboard | Haute |
| `components/layout/SWRProvider.tsx` | Inchangé — config globale déjà correcte | — |
| `app/(app)/soumissions/page.tsx` | Extraire + passer `initialRole` | Haute |
| `app/(app)/soumissions/SoumissionsClient.tsx` | Recevoir + transmettre `initialRole` | Haute |
| `app/(app)/soumissions/hooks/useSoumissions.ts` | `fallbackData` sur `/api/me` | Haute |
| `hooks/useDelayedLoading.ts` | Nouveau hook (10 lignes) | Moyenne |
| `components/layout/Sidebar.tsx` | `onMouseEnter` + `preload` | Haute mobile |
| `components/layout/BottomNav.tsx` | `onTouchStart` + `router.prefetch` + `preload` | Haute mobile |

---

## Critères de succès

- [ ] Dashboard : zéro skeleton au premier paint après SSR
- [ ] Navigation Clients/Soumissions : skeleton apparaît en < 100ms au clic
- [ ] Revisit d'une page : données instantanées depuis cache SWR
- [ ] Mobile BottomNav : touchstart déclenche prefetch avant le clic
- [ ] `npm run build` : 0 erreurs

## Hors scope

- Optimistic UI sur les mutations (scope distinct)
- Virtualisation des listes longues
- Supabase Realtime (subscriptions)
