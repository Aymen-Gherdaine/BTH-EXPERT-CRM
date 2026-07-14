/**
 * Skeletons — shells de chargement du Hub.
 *
 * Composants purement présentationnels (aucun hook, aucun "use client")
 * → rendus côté serveur et streamés instantanément par les loading.tsx.
 *
 * Objectif : au changement d'onglet « à froid » (cache routeur expiré), Next.js
 * affiche ce shell IMMÉDIATEMENT à la place d'un écran figé, le temps que la page
 * serveur (auth + requêtes Supabase) se résolve. La structure copie celle des
 * vraies pages (hero + KPIs + table/cartes) pour éviter tout saut de mise en page.
 */

/* ── Bloc de base ──────────────────────────────────────────────────────────── */

export function Skel({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return <div className={`bth-skel ${className}`} style={style} aria-hidden="true" />;
}

/* ── Hero (en-tête de page) ────────────────────────────────────────────────── */

function Hero({
  kpis = 0,
  withAction = true,
}: {
  kpis?: number;
  withAction?: boolean;
}) {
  return (
    <div
      className="flex-shrink-0 bg-white border-b border-bth-hairline px-4 md:px-6 pt-[18px] pb-4"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          {/* Kicker : trait doré + label */}
          <div className="flex items-center gap-[10px] mb-[9px]">
            <span className="inline-block h-px w-7 bg-bth-gold-500" />
            <Skel className="h-[10px] w-16" />
          </div>
          {/* Titre + pastille de compte */}
          <div className="flex items-center gap-[10px]">
            <Skel className="h-[22px] w-40 md:w-52" />
            <Skel className="h-[22px] w-8 bth-skel-pill" />
          </div>
        </div>
        {withAction && (
          <Skel className="h-9 w-28 md:w-44 bth-skel-pill flex-shrink-0" />
        )}
      </div>

      {kpis > 0 && (
        <div className="flex gap-2 flex-wrap mt-[14px]">
          {Array.from({ length: kpis }).map((_, i) => (
            <Skel key={i} className="h-[58px] flex-1 min-w-[120px] bth-skel-lg" />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Table ─────────────────────────────────────────────────────────────────── */

function TableBlock({ rows = 9 }: { rows?: number }) {
  return (
    <div className="px-4 md:px-6 py-4">
      <div className="bg-white border border-bth-hairline rounded-bth-lg overflow-hidden">
        {/* En-tête de colonnes */}
        <div className="flex items-center gap-4 px-4 h-11 border-b border-bth-hairline bg-bth-n-50">
          <Skel className="h-[9px] w-20" />
          <Skel className="h-[9px] w-32 flex-1" />
          <Skel className="h-[9px] w-16 hidden md:block" />
          <Skel className="h-[9px] w-16 hidden md:block" />
          <Skel className="h-[9px] w-14" />
        </div>
        {/* Lignes */}
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-4 min-h-[52px] border-b border-bth-hairline last:border-b-0"
          >
            <Skel className="h-3 w-20" />
            <div className="flex-1 flex flex-col gap-1.5 min-w-0">
              <Skel className="h-3 w-[60%] max-w-[240px]" />
              <Skel className="h-[9px] w-16" />
            </div>
            <Skel className="h-5 w-16 hidden md:block bth-skel-pill" />
            <Skel className="h-3 w-10 hidden md:block" />
            <Skel className="h-3 w-14" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Grille de cartes ──────────────────────────────────────────────────────── */

function CardGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="px-4 md:px-6 py-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="bg-white border border-bth-hairline rounded-bth-lg p-4 flex flex-col gap-3"
          >
            <div className="flex items-center gap-3">
              <Skel className="h-10 w-10 bth-skel-pill flex-shrink-0" />
              <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                <Skel className="h-3 w-[70%]" />
                <Skel className="h-[9px] w-[45%]" />
              </div>
            </div>
            <Skel className="h-[9px] w-full" />
            <Skel className="h-[9px] w-[80%]" />
            <div className="flex gap-2 mt-1">
              <Skel className="h-7 flex-1 bth-skel-md" />
              <Skel className="h-7 flex-1 bth-skel-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Shells de page (assemblages prêts à l'emploi) ─────────────────────────── */

function Page({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex flex-col h-full bg-bth-canvas"
      role="status"
      aria-busy="true"
      aria-label="Chargement en cours"
    >
      {children}
    </div>
  );
}

/** Page liste : hero + table (optionnellement une rangée de KPIs). */
export function ListPageSkeleton({
  kpis = 0,
  rows = 9,
}: {
  kpis?: number;
  rows?: number;
}) {
  return (
    <Page>
      <Hero kpis={kpis} />
      <div className="flex-1 overflow-hidden">
        <TableBlock rows={rows} />
      </div>
    </Page>
  );
}

/** Page en cartes : hero + grille de cartes. */
export function CardsPageSkeleton({
  kpis = 0,
  count = 6,
}: {
  kpis?: number;
  count?: number;
}) {
  return (
    <Page>
      <Hero kpis={kpis} />
      <div className="flex-1 overflow-hidden">
        <CardGrid count={count} />
      </div>
    </Page>
  );
}

/** Page détail (consultation) : colonne centrée, fil d'Ariane, titre, méta,
 *  boutons d'action, puis blocs de contenu. Copie la structure des pages
 *  /soumissions/[id] et /prospection/[id] pour éviter tout saut de mise en page. */
export function DetailPageSkeleton() {
  return (
    <div
      className="h-full overflow-y-auto bg-bth-canvas"
      role="status"
      aria-busy="true"
      aria-label="Chargement en cours"
    >
      <div className="p-4 sm:p-8 max-w-4xl mx-auto">
        {/* Fil d'Ariane */}
        <div className="flex items-center gap-2 mb-6">
          <Skel className="h-3 w-24" />
          <Skel className="h-3 w-3" />
          <Skel className="h-3 w-40" />
        </div>
        {/* Titre */}
        <Skel className="h-7 w-2/3 max-w-md mb-3" />
        {/* Méta : réf · date · statut */}
        <div className="flex items-center gap-3 mb-5">
          <Skel className="h-3 w-20" />
          <Skel className="h-3 w-24" />
          <Skel className="h-6 w-20 bth-skel-pill" />
        </div>
        {/* Boutons d'action */}
        <div className="flex flex-wrap gap-2 mb-8">
          <Skel className="h-10 w-28 bth-skel-md" />
          <Skel className="h-10 w-20 bth-skel-md" />
          <Skel className="h-10 w-20 bth-skel-md" />
        </div>
        {/* Blocs de contenu */}
        <div className="grid gap-4">
          <Skel className="h-28 w-full bth-skel-lg" />
          <Skel className="h-44 w-full bth-skel-lg" />
          <Skel className="h-32 w-full bth-skel-lg" />
        </div>
      </div>
    </div>
  );
}

/** Tableau de bord : hero + rangée de stats + deux panneaux. */
export function DashboardSkeleton() {
  return (
    <Page>
      <Hero withAction={false} />
      <div className="flex-1 overflow-hidden px-4 md:px-6 py-4 flex flex-col gap-4">
        {/* Rangée de cartes statistiques */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-white border border-bth-hairline rounded-bth-lg p-4 flex flex-col gap-3"
            >
              <Skel className="h-[9px] w-20" />
              <Skel className="h-7 w-24" />
              <Skel className="h-[9px] w-16" />
            </div>
          ))}
        </div>
        {/* Deux panneaux (listes récentes) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
          {Array.from({ length: 2 }).map((_, p) => (
            <div
              key={p}
              className="bg-white border border-bth-hairline rounded-bth-lg p-4 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <Skel className="h-3 w-32" />
                <Skel className="h-[9px] w-14" />
              </div>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-1.5">
                  <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                    <Skel className="h-3 w-[65%]" />
                    <Skel className="h-[9px] w-20" />
                  </div>
                  <Skel className="h-5 w-16 bth-skel-pill" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </Page>
  );
}

/** Page kanban (prospection) : hero + colonnes horizontales de cartes. */
export function KanbanPageSkeleton({
  columns = 4,
  kpis = 0,
}: {
  columns?: number;
  kpis?: number;
}) {
  return (
    <Page>
      <Hero kpis={kpis} />
      <div className="flex-1 overflow-hidden px-4 md:px-6 py-4">
        <div className="flex gap-4 h-full overflow-hidden">
          {Array.from({ length: columns }).map((_, c) => (
            <div
              key={c}
              className="flex-shrink-0 w-[260px] flex flex-col gap-3"
            >
              {/* En-tête de colonne */}
              <div className="flex items-center justify-between px-1">
                <Skel className="h-3 w-24" />
                <Skel className="h-5 w-6 bth-skel-pill" />
              </div>
              {/* Cartes empilées */}
              {Array.from({ length: 3 + ((c + 1) % 3) }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white border border-bth-hairline rounded-bth-lg p-3 flex flex-col gap-2"
                >
                  <Skel className="h-3 w-[75%]" />
                  <Skel className="h-[9px] w-[50%]" />
                  <div className="flex items-center gap-2 mt-1">
                    <Skel className="h-6 w-6 bth-skel-pill" />
                    <Skel className="h-[9px] w-16" />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </Page>
  );
}

/** Page formulaire (profil / paramètres) : hero + champs. */
export function FormPageSkeleton({ groups = 2 }: { groups?: number }) {
  return (
    <Page>
      <Hero withAction={false} />
      <div className="flex-1 overflow-hidden px-4 md:px-6 py-4">
        <div className="max-w-2xl flex flex-col gap-4">
          {Array.from({ length: groups }).map((_, g) => (
            <div
              key={g}
              className="bg-white border border-bth-hairline rounded-bth-lg p-5 flex flex-col gap-4"
            >
              <Skel className="h-3 w-40" />
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <Skel className="h-[10px] w-24" />
                  <Skel className="h-11 w-full bth-skel-md" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </Page>
  );
}
