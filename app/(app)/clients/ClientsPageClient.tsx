"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, m as motion } from "framer-motion";
import useSWR, { preload, useSWRConfig } from "swr";
import { fetcher } from "@/lib/fetcher";
import { Client, Soumission, UserRole } from "@/types";
import { formatDateFr } from "@/lib/utils";
import { useDynamicPerPage } from "@/hooks/useDynamicPerPage";
import { useToast } from "@/components/ui/Toast";
import {
  D0,
  I,
  type ApiListResponse,
  type ClientWithSoumissions,
  type ClientsPageResponse,
  type DeleteState,
} from "./lib";
import { Ic } from "./components";
import { ClientCard, ClientsTable } from "./ClientsTable";

const CSS = `
  @keyframes sk { 0%,100%{opacity:1} 50%{opacity:.4} }
  .sk { animation: sk 1.5s ease-in-out infinite; }
  /* Barre de progression indéterminée (hauteur réservée → aucun décalage) */
  .clients-progress { position: relative; height: 2px; flex-shrink: 0; overflow: hidden; }
  .clients-progress::before {
    content: ""; position: absolute; top: 0; bottom: 0; left: 0; width: 35%;
    border-radius: 9999px;
    background: linear-gradient(90deg, transparent, #3a7a50, transparent);
    opacity: 0; transition: opacity .2s ease;
  }
  .clients-progress[data-active="1"]::before {
    opacity: 1; animation: clients-progress-slide 1.1s cubic-bezier(.4,0,.2,1) infinite;
  }
  @keyframes clients-progress-slide {
    0% { transform: translateX(-120%); }
    100% { transform: translateX(400%); }
  }
  .clients-shell {
    background: linear-gradient(180deg, #ffffff 0%, #faf8f5 38%, #f7f2ea 100%);
    color: #1a1714;
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  .clients-header {
    padding: 24px clamp(16px, 3vw, 40px) 18px;
    border-bottom: 1px solid #e8e2d8;
    background: rgba(255,255,255,.92);
    flex-shrink: 0;
  }
  .clients-header-top {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 18px;
    align-items: start;
  }
  .clients-kicker {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
    color: #7c6238;
    font-size: 11px;
    font-weight: 800;
  }
  .clients-kicker::before {
    content: "";
    width: 28px;
    height: 1px;
    background: #c9a96e;
  }
  .clients-title {
    margin: 0;
    color: #1a1714;
    font-family: var(--font-display);
    font-size: 30px;
    font-weight: 600;
    line-height: 1.02;
  }
  .clients-subtitle {
    margin-top: 7px;
    color: #887f74;
    font-size: 13px;
  }
  .clients-export {
    height: 40px;
    padding: 0 15px;
    border-radius: 9999px;
    border: 1px solid #d0c9be;
    background: #ffffff;
    color: #635c54;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    text-decoration: none;
    font-size: 13px;
    font-weight: 800;
    white-space: nowrap;
    box-shadow: 0 8px 22px rgba(26,46,30,.05);
  }
  .clients-summary {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
    margin-top: 18px;
  }
  .clients-stat {
    min-height: 76px;
    border-radius: 14px;
    border: 1px solid #e8e2d8;
    background: rgba(255,255,255,.78);
    padding: 13px 14px;
    box-shadow: 0 14px 34px rgba(26,46,30,.05);
  }
  .clients-stat-label {
    color: #887f74;
    font-size: 10.5px;
    font-weight: 650;
  }
  .clients-stat-value {
    margin-top: 8px;
    color: #1a2e1e;
    font-size: 17px;
    font-weight: 750;
    line-height: 1;
  }
  .clients-stat-note {
    margin-top: 5px;
    color: #887f74;
    font-size: 11.5px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .clients-search-wrap {
    position: relative;
    margin-top: 16px;
  }
  .clients-search-icon,
  .clients-clear {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .clients-search-icon {
    left: 15px;
    color: #887f74;
    pointer-events: none;
  }
  .clients-clear {
    right: 12px;
    width: 30px;
    height: 30px;
    border: 0;
    border-radius: 9999px;
    background: #f5f0e8;
    color: #887f74;
    cursor: pointer;
  }
  .clients-search {
    width: 100%;
    height: 44px;
    box-sizing: border-box;
    padding: 0 44px;
    border-radius: 9999px;
    border: 1px solid #d0c9be;
    background: #ffffff;
    color: #1a1714;
    font-size: 13px;
    outline: none;
    box-shadow: 0 10px 28px rgba(26,46,30,.04);
  }
  .clients-search:focus {
    border-color: #1a2e1e;
    box-shadow: 0 0 0 4px rgba(26,46,30,.10);
  }
  .clients-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
  }
  .clients-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding-bottom: 0;
  }
  .clients-empty {
    min-height: 360px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 42px 20px;
    border: 1px solid #e8e2d8;
    border-radius: 16px;
    background: rgba(255,255,255,.78);
    box-shadow: 0 18px 46px rgba(26,46,30,.06);
  }
  .clients-empty-icon {
    width: 62px;
    height: 62px;
    border-radius: 14px;
    background: #1a2e1e;
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 18px;
  }
  .clients-table-shell {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
    background: #ffffff;
  }
  .clients-table-head {
    background: #fbfaf7;
    border-bottom: 1px solid #e8e2d8;
  }
  .clients-pagination {
    background: #fbfaf7;
    border-top: 1px solid #e8e2d8;
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 12px;
    height: 40px;
    padding: 0 24px;
    flex-shrink: 0;
  }
  .clients-page-btn {
    width: 26px;
    height: 26px;
    border-radius: 6px;
    border: 1px solid #e8e2d8;
    background: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 150ms, border-color 150ms;
  }
  .clients-page-btn:not(:disabled):hover {
    background: #f0ebe3;
    border-color: #d0c9be;
  }
  @media (max-width: 767px) {
    .clients-shell.clients-has-mobile-pagination {
      padding-bottom: calc(68px + env(safe-area-inset-bottom));
    }
    /* Header compact mobile : moins d'espace en haut → les clients visibles d'emblée */
    .clients-header {
      padding: 14px 14px 12px;
    }
    .clients-header-top {
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 12px;
      align-items: center;
    }
    .clients-kicker { margin-bottom: 5px; }
    .clients-title {
      font-size: 22px;
    }
    /* Sous-titre redondant masqué sur mobile (les mini-stats portent l'info) */
    .clients-subtitle { display: none; }
    .clients-export {
      width: auto;
      justify-content: center;
      padding: 0 13px;
      height: 36px;
    }
    /* 2 mini-stats sur une fine rangée (la 3e « Dernière entrée » est masquée :
       déjà visible en tête de liste) */
    .clients-summary {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
      overflow: visible;
      padding-bottom: 0;
      margin-top: 12px;
    }
    .clients-stat {
      min-height: 0;
      border-radius: 12px;
      padding: 9px 12px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      min-width: 0;
    }
    .clients-stat:last-child { display: none; }
    .clients-stat-label {
      font-size: 10.5px;
      line-height: 1.2;
      white-space: nowrap;
    }
    .clients-stat-value {
      margin-top: 3px;
      font-size: 18px;
      line-height: 1.05;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .clients-stat-note {
      margin-top: 2px;
      font-size: 11px;
      line-height: 1.2;
      white-space: nowrap;
    }
    .clients-content {
      padding: 14px 14px 12px;
      overflow-y: auto;
      overflow-x: hidden;
    }
    .clients-list {
      gap: 12px;
      padding-bottom: 12px;
    }
    .clients-client-card {
      border-radius: 18px !important;
      box-shadow: 0 14px 34px rgba(26,46,30,.07) !important;
    }
    .clients-card-main {
      display: grid !important;
      grid-template-columns: 48px minmax(0, 1fr) auto;
      align-items: center !important;
      gap: 10px !important;
      min-height: 90px;
      padding: 16px 12px 16px 16px !important;
    }
    .clients-card-actions {
      align-self: stretch;
      justify-content: center;
      gap: 0 !important;
    }
    .clients-card-delete { display: none !important; }
    .clients-client-card.clients-expanded .clients-card-actions {
      justify-content: space-between;
      gap: 6px !important;
    }
    .clients-client-card.clients-expanded .clients-card-delete { display: flex !important; }
    .clients-card-contact {
      margin-top: 4px !important;
      font-size: 12.5px !important;
      line-height: 1.35 !important;
      color: #6f675e !important;
      white-space: normal !important;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }
    .clients-card-name {
      font-size: 14px !important;
      line-height: 1.2 !important;
      letter-spacing: 0 !important;
    }
    .clients-card-avatar {
      padding: 3px !important;
    }
    .clients-card-chips {
      margin-top: 9px !important;
      gap: 6px !important;
    }
    .clients-card-chip {
      min-height: 21px;
      padding: 3px 8px !important;
      font-size: 10.5px !important;
      max-width: 100%;
    }
    .clients-address-chip {
      max-width: 100%;
      white-space: normal !important;
      line-height: 1.35;
    }
    /* Pagination mobile identique à Soumissions : flex, fond clair, fixée en bas */
    .clients-pagination {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: auto;
      background: #fffdfa;
      padding: 10px 16px calc(10px + env(safe-area-inset-bottom));
      position: fixed;
      left: 0;
      right: 0;
      bottom: calc(56px + env(safe-area-inset-bottom));
      z-index: 19;
      box-shadow: 0 -10px 28px rgba(26,46,30,.06);
    }
    .clients-modal-actions { flex-direction: column-reverse; }
  }
`;

// Référence stable pour les lignes non dépliées : évite un nouveau `[]` à chaque
// render qui casserait le React.memo des lignes.
const NO_SOUMISSIONS: Soumission[] = [];

/* ── useBp (breakpoint desktop ≥ 768px, spécifique à cette page) ── */
function useBp() {
  const [bp, setBp] = useState<"mobile" | "desktop">("mobile");
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    setBp(mq.matches ? "desktop" : "mobile");
    const fn = (e: MediaQueryListEvent) => setBp(e.matches ? "desktop" : "mobile");
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);
  return bp;
}

export default function ClientsPageClient({
  initialClients,
  initialTotal,
  initialCityCount,
  initialPerPage,
  initialRole,
}: {
  initialClients: ClientWithSoumissions[];
  initialTotal: number;
  initialCityCount: number;
  initialPerPage: number;
  initialRole: UserRole | null;
}) {
  const bp = useBp();
  const isDesktop = bp === "desktop";
  const gridRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { data: expandedSoumRes, isLoading: expandedSoumLoading } = useSWR<ApiListResponse<Soumission>>(
    expandedId ? `/api/soumissions?client_id=${expandedId}` : null,
    { revalidateOnMount: true, keepPreviousData: false }
  );
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteState>(D0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const toast = useToast();
  const { mutate: globalMutate } = useSWRConfig();
  // "Dernière entrée" = client le plus récent (page 1, tri desc) — mémorisé
  const latestRef = useRef<ClientWithSoumissions | null>(initialClients[0] ?? null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(1); }, [debouncedSearch]);

  // Taille de page : remplit la fenêtre (desktop/tablette, sans scroll), 10/page mobile (scroll).
  // rowHeight=64 (minHeight réel) ; safetyPx=28 → arrondi conservateur = jamais de
  // ligne coupée ni de scroll interne. immediate=true → mesure avant paint (pas de saut).
  // initialPerPage doit matcher le rendu SSR (évite un mismatch d'hydratation).
  const perPage = useDynamicPerPage(
    gridRef,
    { view: "table", isDesktop, rowHeight: 64, tableHeaderHeight: 44, pagerHeight: 40, mobilePerPage: 6, safetyPx: 28, initialPerPage, immediate: true },
    []
  );

  // SWR paginé serveur. Pour la page 1 sans recherche, on sert la tranche du buffer
  // SSR (initialClients) à la taille mesurée → AUCUN re-fetch visible, donc pas de saut.
  const buildUrl = (p: number) =>
    `/api/clients?page=${p}&pageSize=${perPage}${debouncedSearch ? `&q=${encodeURIComponent(debouncedSearch)}` : ""}`;
  const clientsUrl = buildUrl(page);
  const canSeedFromBuffer = page === 1 && !debouncedSearch && perPage <= initialClients.length;
  const { data: clientsRes, isLoading: clientsLoading, isValidating, mutate: mutateClients } =
    useSWR<ClientsPageResponse>(
      clientsUrl,
      {
        fallbackData: canSeedFromBuffer
          ? { data: initialClients.slice(0, perPage), total: initialTotal, cityCount: initialCityCount }
          : undefined,
        keepPreviousData: true,
        // Données SSR fraîches → pas de revalidation (ni barre) au tout premier paint
        revalidateOnMount: !canSeedFromBuffer,
      }
    );

  const role = initialRole;
  const canSeeAmounts = role === "admin" || role === "charge_projet";
  const clients = clientsRes?.data ?? [];
  const total = clientsRes?.total ?? initialTotal;
  const cityCount = clientsRes?.cityCount ?? initialCityCount;
  const loading = clientsLoading && !clientsRes;

  // Stabilisés (useCallback) : passés aux lignes memoïsées (ClientCard /
  // ClientTableRow) → une référence stable évite de re-rendre toutes les lignes
  // quand on n'en déplie qu'une.
  const toggleExpand = useCallback((id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  }, []);

  const askDelete = useCallback((c: ClientWithSoumissions, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirm({ open: true, id: c.id, label: c.entreprise });
  }, []);

  async function confirmDelete() {
    const targetId = deleteConfirm.id;
    setDeletingId(targetId);
    try {
      const res = await fetch(`/api/clients/${targetId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete failed");
      if (expandedId === targetId) setExpandedId(null);
      setDeleteConfirm(D0);
      // Revalide la page courante (total + remplissage corrects après suppression)
      await mutateClients();
      // Rafraîchit le dashboard et les soumissions (cascade) après suppression du client
      globalMutate("/api/dashboard");
      globalMutate("/api/soumissions");
      toast.success("Client supprimé.");
    } catch {
      toast.error("La suppression a échoué. Le client a peut-être des soumissions liées.");
    } finally {
      setDeletingId(null);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / Math.max(1, perPage)));
  // La réponse serveur est déjà la page courante — pas de slice client.
  const paginated = clients;

  // Mémorise le client le plus récent (page 1, sans recherche) pour "Dernière entrée"
  useEffect(() => {
    if (page === 1 && !debouncedSearch && clients.length > 0) latestRef.current = clients[0];
  }, [page, debouncedSearch, clients]);
  const latestClient = latestRef.current;

  // Recadre la page si elle dépasse le total (ex. fenêtre agrandie → page plus grande)
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const showPagination = !loading && total > 0 && totalPages > 1;
  // Mobile : la barre du bas reste affichée tant qu'il y a des clients (compteur
  // permanent, fixé en bas). Les boutons de page n'apparaissent que s'il y a
  // plusieurs pages.
  const showMobileBar = !loading && total > 0;

  // Préchargement des pages adjacentes → clic suivant/précédent instantané (cache chaud)
  useEffect(() => {
    if (loading || perPage <= 0) return;
    if (page < totalPages) preload(buildUrl(page + 1), fetcher);
    if (page > 1) preload(buildUrl(page - 1), fetcher);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, perPage, totalPages, debouncedSearch, loading]);

  // Mise à jour en arrière-plan (données déjà visibles) → repère subtil, jamais d'écran blanc
  const updating = isValidating && !loading;

  return (
    <>
      <style>{CSS}</style>
      <div className={`clients-shell ${showMobileBar && bp !== "desktop" ? "clients-has-mobile-pagination" : ""}`}>

        {/* ── Header ──────────────────────────────────────── */}
        <div className="clients-header">
          <div className="clients-header-top">
            <div>
              <div className="clients-kicker">Portefeuille</div>
              <h1 className="clients-title">Clients</h1>
              <p className="clients-subtitle">
                {total} client{total !== 1 ? "s" : ""} enregistré{total !== 1 ? "s" : ""}, suivi commercial et historique des soumissions.
              </p>
            </div>
            <a href="/api/clients/export" target="_blank" rel="noreferrer" className="clients-export">
              <Ic d={I.download} z={14} />
              Export
            </a>
          </div>

          <div className="clients-summary">
            <div className="clients-stat">
              <div className="clients-stat-label">Base clients</div>
              <div className="clients-stat-value">{total}</div>
              <div className="clients-stat-note">contacts actifs</div>
            </div>
            <div className="clients-stat">
              <div className="clients-stat-label">Présence</div>
              <div className="clients-stat-value">{cityCount}</div>
              <div className="clients-stat-note">ville{cityCount > 1 ? "s" : ""} couverte{cityCount > 1 ? "s" : ""}</div>
            </div>
            <div className="clients-stat">
              <div className="clients-stat-label">Dernière entrée</div>
              <div className="clients-stat-value" style={{ fontSize: 17 }}>
                {latestClient ? latestClient.entreprise : "-"}
              </div>
              <div className="clients-stat-note">
                {latestClient ? formatDateFr(latestClient.created_at) : "Aucun client"}
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="clients-search-wrap">
            <span className="clients-search-icon">
              <Ic d={I.search} z={15} />
            </span>
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher par entreprise ou contact..."
              className="clients-search"
            />
            {search && (
              <button onClick={() => setSearch("")} className="clients-clear" aria-label="Effacer la recherche">
                <Ic d={I.x} z={14} />
              </button>
            )}
          </div>
        </div>

        {/* ── Content ─────────────────────────────────────── */}
        <div className="clients-content">
          {/* Repère de mise à jour (recherche / changement de page non préchargé) */}
          <div className="clients-progress" data-active={updating ? "1" : "0"} aria-hidden="true" />
          {loading ? (
            bp === "desktop" ? (
              <div style={{ flex: 1, margin: "16px 32px 20px", borderRadius: 8, border: "1px solid #e8e2d8", overflow: "hidden", boxShadow: "0 18px 48px rgba(26,46,30,0.07)" }}>
                <div className="sk" style={{ height: 44, background: "#fbfaf7", borderBottom: "1px solid #e8e2d8" }} />
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="sk" style={{ height: 64, background: "white", borderBottom: "1px solid #f1ece4" }} />
                ))}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "14px 14px 12px" }}>
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="sk" style={{ height: 82, borderRadius: 14, background: "white", border: "1px solid #ededeb" }} />
                ))}
              </div>
            )
          ) : total === 0 ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 24px" }}>
              <div className="clients-empty" style={{ width: "100%", maxWidth: 480 }}>
                <div className="clients-empty-icon">
                  <Ic d={I.user} z={28} s="white" />
                </div>
                <p style={{ fontSize: 17, fontWeight: 700, color: "#1a1714", marginBottom: 8 }}>
                  Aucun client
                </p>
                <p style={{ fontSize: 14, color: "#887f74", lineHeight: 1.6, maxWidth: 340 }}>
                  {search
                    ? "Aucun résultat pour cette recherche."
                    : "Les clients sont créés automatiquement lors d'une soumission."}
                </p>
              </div>
            </div>
          ) : bp === "desktop" ? (
            <div ref={gridRef} style={{
              flex: 1, display: "flex", flexDirection: "column", minHeight: 0,
              margin: "16px 32px 20px", borderRadius: 8,
              border: "1px solid #e8e2d8", overflow: "hidden",
              boxShadow: "0 18px 48px rgba(26,46,30,0.07)",
              background: "linear-gradient(180deg, #fffdfa 0%, #ffffff 100%)",
            }}>
              <ClientsTable
                clients={paginated}
                expandedId={expandedId}
                expandedSoumissions={expandedSoumRes?.data ?? NO_SOUMISSIONS}
                expandedSoumLoading={expandedSoumLoading}
                canSeeAmounts={canSeeAmounts}
                onToggle={toggleExpand}
                onDelete={askDelete}
              />
              {showPagination && (
                <div className="clients-pagination">
                  <span style={{ fontSize: 11, color: "#a09690", letterSpacing: "0.01em" }}>
                    <strong style={{ color: "#1a1714", fontWeight: 600 }}>{clients.length}</strong>
                    {" "}client{clients.length !== 1 ? "s" : ""}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <motion.button whileTap={{ scale: 0.93 }}
                      onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                      className="clients-page-btn"
                      style={{ color: page <= 1 ? "#d0c9be" : "#3d5c41", cursor: page <= 1 ? "default" : "pointer" }}
                    >
                      <Ic d={I.chevL} z={12} />
                    </motion.button>
                    <span style={{ fontSize: 11, color: "#887f74", fontWeight: 500, minWidth: 52, textAlign: "center", userSelect: "none", letterSpacing: "0.02em" }}>
                      {page} / {totalPages}
                    </span>
                    <motion.button whileTap={{ scale: 0.93 }}
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                      className="clients-page-btn"
                      style={{ color: page >= totalPages ? "#d0c9be" : "#3d5c41", cursor: page >= totalPages ? "default" : "pointer" }}
                    >
                      <Ic d={I.chevR} z={12} />
                    </motion.button>
                  </div>
                  <div className="clients-pagination-spacer" />
                </div>
              )}
            </div>
          ) : (
            <div className="clients-list">
              <AnimatePresence>
                {paginated.map((client) => (
                  <ClientCard
                    key={client.id} client={client}
                    isExpanded={expandedId === client.id}
                    soumissions={expandedId === client.id ? (expandedSoumRes?.data ?? NO_SOUMISSIONS) : NO_SOUMISSIONS}
                    isLoadingSoum={expandedId === client.id && expandedSoumLoading}
                    canSeeAmounts={canSeeAmounts}
                    onToggle={toggleExpand}
                    onDelete={askDelete}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* ── Pagination mobile (style Soumissions / Pager) ──── */}
        {showMobileBar && bp !== "desktop" && (
          <div className="clients-pagination">
            <span style={{ fontSize: 12, color: "#6b7280" }}>
              <strong style={{ color: "#111827" }}>{(page - 1) * perPage + 1}–{Math.min(page * perPage, total)}</strong>
              {" "}sur{" "}
              <strong style={{ color: "#111827" }}>{total}</strong>
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <motion.button whileTap={{ scale: 0.94 }}
                onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                style={{ width: 32, height: 32, borderRadius: 9999, border: "1px solid #e8e2d8", background: "white", display: "flex", alignItems: "center", justifyContent: "center", color: page <= 1 ? "#d0c9be" : "#1a2e1e", cursor: page <= 1 ? "default" : "pointer" }}
              >
                <Ic d={I.chevL} z={13} />
              </motion.button>
              <span style={{ fontSize: 12, color: "#374151", fontWeight: 500, minWidth: 76, textAlign: "center", userSelect: "none" }}>
                Page {page} / {totalPages}
              </span>
              <motion.button whileTap={{ scale: 0.94 }}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                style={{ width: 32, height: 32, borderRadius: 9999, border: "1px solid #e8e2d8", background: "white", display: "flex", alignItems: "center", justifyContent: "center", color: page >= totalPages ? "#d0c9be" : "#1a2e1e", cursor: page >= totalPages ? "default" : "pointer" }}
              >
                <Ic d={I.chevR} z={13} />
              </motion.button>
            </div>
          </div>
        )}

        {/* ── Delete modal ─────────────────────────────────── */}
        <AnimatePresence>
          {deleteConfirm.open && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setDeleteConfirm(D0)}
                style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,.3)", backdropFilter: "blur(4px)" }}
              />
              <div style={{ position: "fixed", inset: 0, zIndex: 301, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, pointerEvents: "none" }}>
                <motion.div
                  initial={{ opacity: 0, scale: .95, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: .95, y: 8 }}
                  style={{ background: "white", borderRadius: 20, boxShadow: "0 25px 60px rgba(0,0,0,.15)", width: "100%", maxWidth: 400, pointerEvents: "auto" }}
                >
                  <div style={{ padding: "24px 24px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                      <div style={{ width: 42, height: 42, borderRadius: 12, background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Ic d={I.trash} z={20} s="#dc2626" />
                      </div>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>Supprimer ce client ?</p>
                        <p style={{ fontSize: 11.5, color: "#9ca3af", marginTop: 2 }}>{deleteConfirm.label}</p>
                      </div>
                    </div>
                    <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 14px", marginBottom: 10 }}>
                      <p style={{ fontSize: 13, color: "#dc2626", fontWeight: 500 }}>
                        Toutes les soumissions associées seront supprimées définitivement.
                      </p>
                    </div>
                    <p style={{ fontSize: 13, color: "#6b7280" }}>Cette action est irréversible.</p>
                  </div>
                  <div className="clients-modal-actions" style={{ padding: "0 24px 24px", display: "flex", gap: 10 }}>
                    <button onClick={() => setDeleteConfirm(D0)} style={{ flex: 1, padding: "11px 0", borderRadius: 9999, border: "1.5px solid #d0c9be", background: "white", fontSize: 13, fontWeight: 700, color: "#635c54", cursor: "pointer" }}>
                      Annuler
                    </button>
                    <motion.button whileTap={{ scale: .97 }} onClick={confirmDelete} disabled={!!deletingId}
                      style={{ flex: 1, padding: "11px 0", borderRadius: 9999, border: "none", background: "#c44a3a", fontSize: 13, fontWeight: 700, color: "white", cursor: "pointer", opacity: deletingId ? .5 : 1 }}
                    >
                      {deletingId ? "Suppression…" : "Supprimer"}
                    </motion.button>
                  </div>
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
