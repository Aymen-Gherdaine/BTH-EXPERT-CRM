"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Soumission, StatutSoumission, UserRole } from "@/types";
import { SoumissionView, ApiListResponse, MeResponse, VersementState, V0, DeleteState, D0 } from "../types";

export function useSoumissions(initialSoumissions: Soumission[] = [], initialRole?: UserRole) {
  const router = useRouter();

  const { data: soumissionsRes, isLoading: soumissionsLoading, mutate: mutateSoumissions } =
    useSWR<ApiListResponse<Soumission>>("/api/soumissions", {
      fallbackData: { data: initialSoumissions },
    });
  const { data: meRes, isLoading: meLoading } = useSWR<MeResponse>("/api/me", {
    fallbackData: initialRole ? { role: initialRole } : undefined,
    revalidateOnMount: !initialRole,
  });

  const role = meRes?.role ?? "admin";
  const isAdmin = role === "admin" || role === "charge_projet";
  const soumissions = soumissionsRes?.data ?? [];
  const loading = (soumissionsLoading && !soumissionsRes) || (meLoading && !meRes);

  const [selId, setSelId] = useState<string | null>(null);
  const [selDetail, setSelDetail] = useState<SoumissionView | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [versement, setVersement] = useState<VersementState>(V0);
  const [versementInput, setVersementInput] = useState("");
  const [savingVersement, setSavingVersement] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteState>(D0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);

  const toView = useCallback((s: Soumission): SoumissionView => ({
    ...s,
    _cn: s.client?.entreprise ?? "—",
    _contact: s.client ? `${s.client.titre} ${s.client.nom_contact}` : "—",
  }), []);

  const updateSoumissions = useCallback((updater: (items: Soumission[]) => Soumission[]) => {
    mutateSoumissions(
      current => ({ data: updater(current?.data ?? []) }),
      { revalidate: false }
    );
  }, [mutateSoumissions]);

  function closeDetail() { setSelId(null); setSelDetail(null); }

  async function openDetail(o: SoumissionView) {
    setSelId(o.id);
    setSelDetail(o);
    setDetailLoading(true);
    const res = await fetch(`/api/soumissions/${o.id}`);
    const json = await res.json();
    if (json.data) setSelDetail(toView(json.data));
    setDetailLoading(false);
  }

  function openVersementFor(id: string, titre: string, ttc: number, current: number) {
    setVersementInput(current ? String(current) : "");
    setVersement({ open: true, id, titre, ttc, current });
  }

  async function handleStatut(id: string, statut: StatutSoumission) {
    // Snapshot for rollback
    const prevSoumissions = soumissionsRes?.data ?? [];
    const prevDetail = selDetail;

    // Optimistic update — immediate
    updateSoumissions(prev => prev.map(s => s.id === id ? { ...s, statut } : s));
    if (selDetail?.id === id) setSelDetail(prev => prev ? { ...prev, statut } : null);
    if (statut === "Acceptée") {
      const s = prevSoumissions.find(x => x.id === id);
      openVersementFor(id, s?.titre_projet ?? "", s?.total_ttc ?? 0, s?.versement_recu ?? 0);
    }

    // Background fetch — fire and forget
    try {
      const res = await fetch(`/api/soumissions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut }),
      });
      if (!res.ok) throw new Error("patch failed");
    } catch {
      // Revert
      mutateSoumissions({ data: prevSoumissions }, { revalidate: false });
      if (selDetail?.id === id) setSelDetail(prevDetail);
    }
  }

  async function handleSaveVersement() {
    const montant = parseFloat(versementInput.replace(/\s/g, "").replace(",", ".")) || 0;
    const targetId = versement.id;

    // Snapshot for rollback
    const prevSoumissions = soumissionsRes?.data ?? [];
    const prevDetail = selDetail;

    // Optimistic update — immediate
    updateSoumissions(prev => prev.map(s => s.id === targetId ? { ...s, versement_recu: montant } : s));
    if (selDetail?.id === targetId) setSelDetail(prev => prev ? { ...prev, versement_recu: montant } : null);
    setVersement(V0);   // close modal immediately

    // Background save
    setSavingVersement(true);
    try {
      const res = await fetch(`/api/soumissions/${targetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versement_recu: montant }),
      });
      if (!res.ok) throw new Error("patch failed");
    } catch {
      // Revert
      mutateSoumissions({ data: prevSoumissions }, { revalidate: false });
      if (selDetail?.id === targetId) setSelDetail(prevDetail);
    } finally {
      setSavingVersement(false);
    }
  }

  function handleDelete(s: SoumissionView) {
    setDeleteConfirm({ open: true, id: s.id, label: s.titre_projet });
  }

  async function confirmDelete() {
    const targetId = deleteConfirm.id;

    // Snapshot
    const prevSoumissions = soumissionsRes?.data ?? [];

    // Optimistic update — immediate
    const wasSelected = selId === targetId;
    updateSoumissions(prev => prev.filter(s => s.id !== targetId));
    if (wasSelected) closeDetail();
    setDeleteConfirm(D0);     // close confirm modal immediately

    // Background delete
    setDeletingId(targetId);
    try {
      const res = await fetch(`/api/soumissions/${targetId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete failed");
    } catch {
      // Revert
      mutateSoumissions({ data: prevSoumissions }, { revalidate: false });
    } finally {
      setDeletingId(null);
    }
  }

  const handleDuplicate = (s: SoumissionView) => router.push(`/soumissions/${s.id}?duplicate=1`);
  const toggleSel = (id: string) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  return {
    soumissions,
    loading,
    isAdmin,
    toView,
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
