"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR, { useSWRConfig } from "swr";
import { StatutSoumission, UserRole } from "@/types";
import {
  SoumissionView, SoumissionsPage, SoumissionKpis,
  MeResponse, VersementState, V0, DeleteState, D0,
} from "../types";
import { useToast } from "@/components/ui/Toast";

const EMPTY_KPIS: SoumissionKpis = { counts: {}, totalTTC: null, totalVerse: null };

/**
 * Liste des soumissions pilotée par le serveur (pagination + recherche + tri +
 * filtre + KPIs faits en base). `listUrl` est construit par le composant à
 * partir de la page / taille / recherche / statut / tri courants. `seed` sert de
 * fallbackData pour la page 1 (rendu SSR instantané, sans re-fetch).
 */
export function useSoumissions({ listUrl, seed, initialRole }: {
  listUrl: string;
  seed?: SoumissionsPage;
  initialRole?: UserRole;
}) {
  const router = useRouter();
  const toast = useToast();
  const { mutate: globalMutate } = useSWRConfig();

  const { data: listRes, isLoading: listLoading, mutate: mutateList } =
    useSWR<SoumissionsPage>(listUrl, {
      fallbackData: seed,
      keepPreviousData: true,
    });
  const { data: meRes, isLoading: meLoading } = useSWR<MeResponse>("/api/me", {
    fallbackData: initialRole ? { role: initialRole } : undefined,
    revalidateOnMount: !initialRole,
  });

  const role = meRes?.role ?? "admin";
  const isAdmin = role === "admin" || role === "charge_projet";
  const canCreate = role === "admin";
  const loading = (listLoading && !listRes) || (meLoading && !meRes);

  const [selId, setSelId] = useState<string | null>(null);
  const [selDetail, setSelDetail] = useState<SoumissionView | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [versement, setVersement] = useState<VersementState>(V0);
  const [versementInput, setVersementInput] = useState("");
  const [savingVersement, setSavingVersement] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteState>(D0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);

  // Décore une soumission serveur en vue (nom client / contact affichables).
  const decorate = useCallback((s: SoumissionsPage["data"][number]): SoumissionView => ({
    ...s,
    _cn: s.client?.entreprise ?? "—",
    _contact: s.client ? `${s.client.titre} ${s.client.nom_contact}` : "—",
  }), []);

  const rows = useMemo(
    () => (listRes?.data ?? []).map(decorate),
    [listRes, decorate]
  );
  const total = listRes?.total ?? 0;
  const kpis = listRes?.kpis ?? EMPTY_KPIS;

  // Patch optimiste d'une ligne de la page courante (sans revalider).
  const patchRow = useCallback((id: string, patch: Partial<SoumissionsPage["data"][number]>) => {
    mutateList(
      cur => cur ? { ...cur, data: cur.data.map(s => s.id === id ? { ...s, ...patch } : s) } : cur,
      { revalidate: false }
    );
  }, [mutateList]);

  const closeDetail = useCallback(() => { setSelId(null); setSelDetail(null); }, []);

  const openDetail = useCallback(async (o: SoumissionView) => {
    setSelId(o.id);
    setSelDetail(o);
    setDetailLoading(true);
    const res = await fetch(`/api/soumissions/${o.id}`);
    const json = await res.json();
    if (json.data) setSelDetail(decorate(json.data));
    setDetailLoading(false);
  }, [decorate]);

  const openVersementFor = useCallback((id: string, titre: string, ttc: number, current: number) => {
    setVersementInput(current ? String(current) : "");
    setVersement({ open: true, id, titre, ttc, current });
  }, []);

  const handleStatut = useCallback(async (id: string, statut: StatutSoumission) => {
    const prevDetail = selDetail;

    patchRow(id, { statut });
    if (selDetail?.id === id) setSelDetail(prev => prev ? { ...prev, statut } : null);
    if (statut === "Acceptée") {
      const s = listRes?.data.find(x => x.id === id);
      openVersementFor(id, s?.titre_projet ?? "", s?.total_ttc ?? 0, s?.versement_recu ?? 0);
    }

    try {
      const res = await fetch(`/api/soumissions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut }),
      });
      if (!res.ok) throw new Error("patch failed");
      // Revalide la page (KPIs / compteurs / éventuel changement de filtre).
      mutateList();
      globalMutate("/api/dashboard");
    } catch {
      mutateList();
      if (selDetail?.id === id) setSelDetail(prevDetail);
      toast.error("Le statut n'a pas pu être mis à jour. Réessayez.");
    }
  }, [selDetail, listRes, patchRow, openVersementFor, mutateList, globalMutate, toast]);

  const handleSaveVersement = useCallback(async () => {
    const montant = parseFloat(versementInput.replace(/\s/g, "").replace(",", ".")) || 0;
    const targetId = versement.id;
    const prevDetail = selDetail;

    patchRow(targetId, { versement_recu: montant });
    if (selDetail?.id === targetId) setSelDetail(prev => prev ? { ...prev, versement_recu: montant } : null);
    setVersement(V0);

    setSavingVersement(true);
    try {
      const res = await fetch(`/api/soumissions/${targetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versement_recu: montant }),
      });
      if (!res.ok) throw new Error("patch failed");
      mutateList();
      globalMutate("/api/dashboard");
      toast.success("Versement enregistré.");
    } catch {
      mutateList();
      if (selDetail?.id === targetId) setSelDetail(prevDetail);
      toast.error("Le versement n'a pas pu être enregistré. Réessayez.");
    } finally {
      setSavingVersement(false);
    }
  }, [versementInput, versement.id, selDetail, patchRow, mutateList, globalMutate, toast]);

  const handleDelete = useCallback((s: SoumissionView) => {
    setDeleteConfirm({ open: true, id: s.id, label: s.titre_projet });
  }, []);

  const confirmDelete = useCallback(async () => {
    const targetId = deleteConfirm.id;
    const wasSelected = selId === targetId;

    // Optimiste : retire la ligne de la page courante immédiatement.
    mutateList(
      cur => cur ? { ...cur, data: cur.data.filter(s => s.id !== targetId), total: Math.max(0, cur.total - 1) } : cur,
      { revalidate: false }
    );
    if (wasSelected) closeDetail();
    setDeleteConfirm(D0);

    setDeletingId(targetId);
    try {
      const res = await fetch(`/api/soumissions/${targetId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete failed");
      toast.success("Soumission supprimée.");
      // Recharge la page (re-remplissage depuis la ligne suivante) + cascades.
      mutateList();
      globalMutate("/api/dashboard");
      globalMutate("/api/clients");
    } catch {
      mutateList();
      toast.error("La suppression a échoué. Réessayez.");
    } finally {
      setDeletingId(null);
    }
  }, [deleteConfirm.id, selId, mutateList, closeDetail, globalMutate, toast]);

  const handleDuplicate = useCallback((s: SoumissionView) => router.push(`/soumissions/${s.id}?duplicate=1`), [router]);
  const toggleSel = useCallback((id: string) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]), []);

  return {
    rows,
    total,
    kpis,
    loading,
    isAdmin,
    canCreate,
    selId,
    selDetail,
    detailLoading,
    versement,
    setVersement,
    versementInput,
    setVersementInput,
    savingVersement,
    deleteConfirm,
    setDeleteConfirm,
    deletingId,
    selected,
    openDetail,
    closeDetail,
    handleStatut,
    openVersementFor,
    handleSaveVersement,
    handleDelete,
    confirmDelete,
    handleDuplicate,
    toggleSel,
  };
}
