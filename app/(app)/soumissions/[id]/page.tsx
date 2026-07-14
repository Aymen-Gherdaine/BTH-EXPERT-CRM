"use client";

import { useEffect, useState } from "react";
import { useSWRConfig } from "swr";
import { m as motion } from "framer-motion";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Client, EditablePreview, LigneBudget, Soumission, StatutSoumission, UserRole } from "@/types";
import type { SoumissionAIContent } from "@/lib/anthropic";
import { formatMontant, formatDateFr, generateNumeroOffre } from "@/lib/utils";
import { DeleteState, D0 } from "../types";
import { DeleteModal } from "../components/DeleteModal";

const STATUTS: StatutSoumission[] = ["Brouillon", "Envoyée", "Acceptée", "Refusée"];

const STATUT_STYLES: Record<StatutSoumission, string> = {
  Brouillon: "bg-gray-100 text-gray-600",
  Envoyée: "bg-blue-100 text-blue-700",
  Acceptée: "bg-emerald-100 text-emerald-700",
  Refusée: "bg-red-100 text-red-600",
};

const TYPE_LABELS: Record<string, string> = {
  "EIE+Dangers": "EIE + Étude de Dangers",
  "Notice+ProduitsDangereux": "Notice d'Impact + Produits Dangereux",
  Audit: "Audit environnemental",
  Autre: "Autre étude réglementaire",
};

type MeResponse = { role?: UserRole };

export default function SoumissionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { mutate: globalMutate } = useSWRConfig();
  const isDuplicate = searchParams.get("duplicate") === "1";
  const id = params.id as string;

  const [soumission, setSoumission] = useState<Soumission | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [lignes, setLignes] = useState<LigneBudget[]>([]);
  const [contexte, setContexte] = useState<SoumissionAIContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<"docx" | "pdf" | null>(null);
  const [changingStatut, setChangingStatut] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteState>(D0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showStatutMenu, setShowStatutMenu] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [role, setRole] = useState<UserRole | null>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/soumissions/${id}`);
      if (!res.ok) {
        router.push("/soumissions");
        return;
      }
      const json = await res.json();
      const data = json.data;
      setSoumission(data);
      setClient(data.client ?? null);
      setLignes(data.lignes_budget ?? []);
      if (data.contexte_genere) {
        try {
          setContexte(JSON.parse(data.contexte_genere));
        } catch {}
      }
      setLoading(false);

      if (isDuplicate) {
        handleDuplicate(data, data.client, data.lignes_budget ?? []);
      }
    }
    load();
  }, [id]);

  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.ok ? res.json() : null)
      .then((data: MeResponse | null) => {
        if (data?.role) setRole(data.role);
      })
      .catch(() => {});
  }, []);

  async function handleDuplicate(s: Soumission, c: Client, l: LigneBudget[]) {
    setDuplicating(true);
    try {
      const contexteData = s.contexte_genere ? JSON.parse(s.contexte_genere) : null;
      const res = await fetch("/api/soumissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formData: {
            step1: {
              titre: c.titre,
              nom_contact: c.nom_contact,
              poste: c.poste,
              entreprise: c.entreprise,
              adresse: c.adresse,
              ville: c.ville,
            },
            step2: {
              titre_projet: s.titre_projet + " (copie)",
              secteur_activite: s.secteur_activite,
              description_projet: s.description_projet,
              type_etude: s.type_etude,
              delai_jours: s.delai_jours,
            },
            step3: {
              lignes: l.map((ligne) => ({
                numero: ligne.numero,
                designation: ligne.designation,
                quantite: ligne.quantite,
                prix_unitaire: ligne.prix_unitaire,
                ordre: ligne.ordre,
              })),
            },
          },
          contexte: contexteData,
        }),
      });
      const json = await res.json();
      if (res.ok) router.push(`/soumissions/${json.data.id}`);
    } finally {
      setDuplicating(false);
    }
  }

  async function handleExport(format: "docx" | "pdf") {
    if (!soumission || !client || !contexte) return;
    setExporting(format);
    try {
      const editablePreview: EditablePreview = {
        titre: client.titre,
        nom_contact: client.nom_contact,
        poste_contact: client.poste,
        entreprise: client.entreprise,
        adresse: client.adresse,
        ville: client.ville,
        numero_offre: soumission.numero_offre,
        date_offre: soumission.date_offre,
        titre_projet: soumission.titre_projet,
        intro_paragraphe: "",
        contexte_paragraphe_1: contexte.contexte_paragraphe_1 ?? "",
        contexte_paragraphe_2: contexte.contexte_paragraphe_2 ?? "",
        objectif_1: contexte.objectif_1 ?? "",
        objectif_2: contexte.objectif_2 ?? "",
        objectif_3: contexte.objectif_3 ?? "",
        objectif_4: contexte.objectif_4 ?? "",
        livrable_1: contexte.livrable_1 ?? "",
        livrable_2: contexte.livrable_2 ?? "",
        livrable_3: contexte.livrable_3 ?? "",
        hypothese_specifique: [contexte.hypothese_1, contexte.hypothese_2, contexte.hypothese_3].filter(Boolean).join("\n"),
        inclusions_specifiques: contexte.inclusions_specifiques ?? "",
        exclusions_specifiques: contexte.exclusions_specifiques ?? "",
        description_echeancier: contexte.description_echeancier ?? "",
        lignes_budget: lignes,
      };
      const res = await fetch(`/api/export/${format}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ soumission, client, lignes, editablePreview }),
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Offre_${soumission.numero_offre}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(null);
    }
  }

  async function handleStatut(statut: StatutSoumission) {
    if (!soumission) return;
    setChangingStatut(true);
    setShowStatutMenu(false);
    await fetch(`/api/soumissions/${soumission.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut }),
    });
    setSoumission({ ...soumission, statut });
    setChangingStatut(false);
  }

  function handleDelete() {
    if (!soumission) return;
    setDeleteConfirm({ open: true, id: soumission.id, label: soumission.titre_projet });
  }

  async function confirmDelete() {
    const targetId = deleteConfirm.id;
    setDeletingId(targetId);
    setDeleting(true);
    try {
      const res = await fetch(`/api/soumissions/${targetId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete failed");
      // Invalide les caches liés avant la navigation pour que la liste et le dashboard soient à jour
      globalMutate("/api/soumissions");
      globalMutate("/api/dashboard");
      globalMutate("/api/clients");
      router.push("/soumissions");
    } finally {
      setDeletingId(null);
      setDeleting(false);
      setDeleteConfirm(D0);
    }
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-8 max-w-4xl mx-auto">
        <div className="space-y-4">
          <div className="h-8 w-64 bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-4 w-40 bg-gray-50 rounded-lg animate-pulse" />
          <div className="h-48 bg-gray-50 rounded-2xl animate-pulse mt-6" />
          <div className="h-64 bg-gray-50 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!soumission || !client) return null;

  const canSeeAmounts = role === "admin" || role === "charge_projet";
  const canManageSoumissions = canSeeAmounts;

  const objectifs = contexte ? [
    contexte.objectif_1,
    contexte.objectif_2,
    contexte.objectif_3,
    contexte.objectif_4,
  ].filter(Boolean) : [];

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-4 sm:mb-6">
        <Link href="/soumissions" className="hover:text-gray-600 transition-colors cursor-pointer">
          Soumissions
        </Link>
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-gray-600 truncate">{soumission.titre_projet}</span>
      </div>

      {/* Header — stacked on mobile, side-by-side on desktop */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight mb-2">
          {soumission.titre_projet}
        </h1>

        {/* Meta: ref · date · statut */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mb-4">
          <span className="text-sm text-gray-400 font-mono">{soumission.numero_offre}</span>
          <span className="text-gray-200">·</span>
          <span className="text-sm text-gray-500">{formatDateFr(soumission.date_offre)}</span>
          <span className="text-gray-200">·</span>

          <div className="relative">
            {canManageSoumissions ? (
              <button
                onClick={() => setShowStatutMenu(!showStatutMenu)}
                disabled={changingStatut}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all min-h-[28px] ${STATUT_STYLES[soumission.statut]}`}
              >
                {changingStatut ? (
                  <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : soumission.statut}
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            ) : (
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${STATUT_STYLES[soumission.statut]}`}>
                {soumission.statut}
              </span>
            )}

            {canManageSoumissions && showStatutMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowStatutMenu(false)} />
                <div className="absolute left-0 top-8 z-50 bg-white rounded-xl border border-gray-200 shadow-lg py-1 w-36 overflow-hidden">
                  {STATUTS.map((st) => (
                    <button
                      key={st}
                      onClick={() => handleStatut(st)}
                      className={`w-full text-left px-3 py-2 text-xs font-medium cursor-pointer transition-colors hover:bg-gray-50 ${
                        st === soumission.statut ? "opacity-40 cursor-default" : ""
                      }`}
                    >
                      <span className={`inline-flex px-2 py-0.5 rounded-full ${STATUT_STYLES[st]}`}>{st}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Action buttons — wrap on mobile */}
        <div className="flex flex-wrap gap-2">
          {canManageSoumissions && (
            <button
              onClick={() => handleDuplicate(soumission, client, lignes)}
              disabled={duplicating}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-gray-700 border border-gray-200 hover:bg-gray-50 transition-all cursor-pointer disabled:opacity-50 min-h-[40px]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              {duplicating ? "Duplication…" : "Dupliquer"}
            </button>
          )}

          {canSeeAmounts && (
            <>
              <button
                onClick={() => handleExport("docx")}
                disabled={!!exporting || !contexte}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-gray-700 border border-gray-200 hover:bg-gray-50 transition-all cursor-pointer disabled:opacity-50 min-h-[40px]"
              >
                {exporting === "docx" ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                )}
                .docx
              </button>

              <button
                onClick={() => handleExport("pdf")}
                disabled={!!exporting || !contexte}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all cursor-pointer disabled:opacity-50 hover:opacity-90 min-h-[40px]"
                style={{ backgroundColor: "#1a2e1e" }}
              >
                {exporting === "pdf" ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                )}
                .pdf
              </button>
            </>
          )}

          {canManageSoumissions && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 border border-gray-200 transition-all cursor-pointer disabled:opacity-50 min-h-[40px] min-w-[40px] hidden sm:flex items-center justify-center"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </motion.div>

      <div className="space-y-6">
        {/* Client info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6"
        >
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Client</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-400 mb-1">Contact</p>
              <p className="text-sm font-medium text-gray-900">{client.titre} {client.nom_contact}</p>
              <p className="text-xs text-gray-500">{client.poste}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Entreprise</p>
              <p className="text-sm font-medium text-gray-900">{client.entreprise}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Adresse</p>
              <p className="text-sm text-gray-700">{client.adresse}</p>
              <p className="text-xs text-gray-500">{client.ville}</p>
            </div>
          </div>
        </motion.div>

        {/* Projet info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6"
        >
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Projet</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs text-gray-400 mb-1">Secteur d'activité</p>
              <p className="text-sm text-gray-700">{soumission.secteur_activite}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Type d'étude</p>
              <p className="text-sm text-gray-700">{TYPE_LABELS[soumission.type_etude] ?? soumission.type_etude}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Délai d'exécution</p>
              <p className="text-sm text-gray-700">{soumission.delai_jours} jours</p>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Description</p>
            <p className="text-sm text-gray-700 leading-relaxed">{soumission.description_projet}</p>
          </div>
        </motion.div>

        {/* Contexte IA */}
        {contexte && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6"
          >

            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2" style={{ color: "#1a2e1e" }}>1. Contexte et objectifs</h3>
              {contexte.contexte_paragraphe_1 && (
                <p className="text-sm text-gray-700 mb-2 leading-relaxed">{contexte.contexte_paragraphe_1}</p>
              )}
              {contexte.contexte_paragraphe_2 && (
                <p className="text-sm text-gray-700 mb-2 leading-relaxed">{contexte.contexte_paragraphe_2}</p>
              )}
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-2" style={{ color: "#1a2e1e" }}>1.1 Objectifs du projet</h3>
              <ul className="space-y-1.5">
                {objectifs.map((obj, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-gray-400 mt-0.5 flex-shrink-0">▪</span>
                    <span>{obj}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}

        {/* Budget */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
        >
          <div className="px-5 sm:px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Budget</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F4F6F7]">
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 w-10">N°</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500">Désignation</th>
                  <th className="px-4 sm:px-6 py-3 text-center text-xs font-semibold text-gray-500 w-12">Q</th>
                  {canSeeAmounts && (
                    <>
                      <th className="px-4 sm:px-6 py-3 text-right text-xs font-semibold text-gray-500 w-32 sm:w-40">P.U.</th>
                      <th className="px-4 sm:px-6 py-3 text-right text-xs font-semibold text-gray-500 w-32 sm:w-40">Total HT</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {lignes.map((l) => (
                  <tr key={l.id ?? l.numero} className="border-t border-gray-50">
                    <td className="px-4 sm:px-6 py-3 text-gray-400 text-center">{l.numero}</td>
                    <td className="px-4 sm:px-6 py-3 text-gray-700">{l.designation}</td>
                    <td className="px-4 sm:px-6 py-3 text-center text-gray-500">{l.quantite}</td>
                    {canSeeAmounts && (
                      <>
                        <td className="px-4 sm:px-6 py-3 text-right text-gray-700 tnum whitespace-nowrap">{formatMontant(l.prix_unitaire)}</td>
                        <td className="px-4 sm:px-6 py-3 text-right font-medium text-gray-900 tnum whitespace-nowrap">{formatMontant(l.quantite * l.prix_unitaire)}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {canSeeAmounts && (
            <div className="px-5 sm:px-6 py-4 bg-[#F4F6F7] border-t border-gray-200">
              <div className="space-y-2 max-w-full sm:max-w-xs ml-auto">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total HT</span>
                  <span className="font-medium tnum">{formatMontant(soumission.total_ht)} DZD</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">TVA 19%</span>
                  <span className="font-medium tnum">{formatMontant(soumission.tva)} DZD</span>
                </div>
                <div className="flex justify-between text-base font-bold border-t border-gray-300 pt-2">
                  <span className="text-gray-900">Total TTC</span>
                  <span className="tnum" style={{ color: "#1a2e1e" }}>{formatMontant(soumission.total_ttc)} DZD</span>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Danger zone */}
        {canManageSoumissions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex justify-end"
          >
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl border border-red-200 transition-all cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              {deleting ? "Suppression en cours…" : "Supprimer cette soumission"}
            </button>
          </motion.div>
        )}
      </div>

      <DeleteModal
        deleteConfirm={deleteConfirm}
        onCancel={() => setDeleteConfirm(D0)}
        onConfirm={confirmDelete}
        deletingId={deletingId}
      />
    </div>
  );
}
