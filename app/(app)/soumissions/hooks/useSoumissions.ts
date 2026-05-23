"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Soumission, StatutSoumission } from "@/types";
import { SoumissionView, ApiListResponse, MeResponse, VersementState, V0, DeleteState, D0 } from "../types";

export function useSoumissions(initialSoumissions: Soumission[] = []) {
  const router = useRouter();

  const { data: soumissionsRes, isLoading: soumissionsLoading, mutate: mutateSoumissions } =
    useSWR<ApiListResponse<Soumission>>("/api/soumissions", {
      fallbackData: { data: initialSoumissions },
    });
  const { data: meRes, isLoading: meLoading } = useSWR<MeResponse>("/api/me");

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
    await fetch(`/api/soumissions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut }),
    });
    updateSoumissions(prev => prev.map(s => s.id === id ? { ...s, statut } : s));
    if (selDetail?.id === id) setSelDetail(prev => prev ? { ...prev, statut } : null);
    if (statut === "Acceptée") {
      const s = soumissions.find(x => x.id === id);
      openVersementFor(id, s?.titre_projet ?? "", s?.total_ttc ?? 0, s?.versement_recu ?? 0);
    }
  }

  async function handleSaveVersement() {
    const montant = parseFloat(versementInput.replace(/\s/g, "").replace(",", ".")) || 0;
    setSavingVersement(true);
    await fetch(`/api/soumissions/${versement.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ versement_recu: montant }),
    });
    updateSoumissions(prev => prev.map(s => s.id === versement.id ? { ...s, versement_recu: montant } : s));
    if (selDetail?.id === versement.id) setSelDetail(prev => prev ? { ...prev, versement_recu: montant } : null);
    setSavingVersement(false);
    setVersement(V0);
  }

  function handleDelete(s: SoumissionView) {
    setDeleteConfirm({ open: true, id: s.id, label: s.titre_projet });
  }

  async function confirmDelete() {
    setDeletingId(deleteConfirm.id);
    await fetch(`/api/soumissions/${deleteConfirm.id}`, { method: "DELETE" });
    updateSoumissions(prev => prev.filter(s => s.id !== deleteConfirm.id));
    if (selId === deleteConfirm.id) closeDetail();
    setDeletingId(null);
    setDeleteConfirm(D0);
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
