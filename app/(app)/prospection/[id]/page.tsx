"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import type { Prospect, Visite, StatutProspect, ResultatVisite } from "@/types";
import { formatDateFr } from "@/lib/utils";
import VisiteForm, { type VisiteFormData } from "@/components/prospection/VisiteForm";

const RESULTAT_LABELS: Record<string, string> = {
  soumission_demandee: "Soumission demandée",
  rappel_planifie:     "Rappel planifié",
  pas_interesse:       "Pas intéressé",
  absent:              "Absent",
  autre:               "Autre",
};

const RESULTAT_COLORS: Record<string, { bg: string; text: string }> = {
  soumission_demandee: { bg: "bg-emerald-100", text: "text-emerald-700" },
  rappel_planifie:     { bg: "bg-blue-100",    text: "text-blue-700"   },
  pas_interesse:       { bg: "bg-red-100",      text: "text-red-700"   },
  absent:              { bg: "bg-amber-100",    text: "text-amber-700" },
  autre:               { bg: "bg-gray-100",     text: "text-gray-600"  },
};

const STATUT_LABELS: Record<StatutProspect, string> = {
  actif: "Actif", sans_suite: "Sans suite", converti: "Converti",
};
const STATUT_COLORS: Record<StatutProspect, string> = {
  actif: "bg-emerald-100 text-emerald-700",
  sans_suite: "bg-gray-100 text-gray-500",
  converti: "bg-blue-100 text-blue-700",
};

function visiteToFormData(v: Visite): VisiteFormData {
  return {
    date_visite: v.date_visite,
    resultat: v.resultat as ResultatVisite,
    notes_visite: v.notes_visite ?? "",
    date_prochaine_action: v.date_prochaine_action ?? "",
    action_requise: v.action_requise ?? "",
  };
}

export default function ProspectPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [prospect, setProspect]           = useState<Prospect | null>(null);
  const [loading, setLoading]             = useState(true);
  const [showAddForm, setShowAddForm]     = useState(false);
  const [savingAdd, setSavingAdd]         = useState(false);
  const [editingId, setEditingId]         = useState<string | null>(null);
  const [savingEdit, setSavingEdit]       = useState(false);
  const [deletingId, setDeletingId]       = useState<string | null>(null);
  const [updatingStatut, setUpdatingStatut] = useState(false);

  async function load() {
    const res = await fetch(`/api/prospects/${id}`);
    const json = await res.json();
    if (res.ok) {
      const p = json.data as Prospect;
      if (p.visites) {
        p.visites = [...p.visites].sort(
          (a, b) => new Date(b.date_visite).getTime() - new Date(a.date_visite).getTime()
        );
      }
      setProspect(p);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, [id]);

  async function handleAddVisite(data: VisiteFormData) {
    setSavingAdd(true);
    const res = await fetch("/api/visites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prospect_id: id, ...data }),
    });
    if (res.ok) { setShowAddForm(false); await load(); }
    setSavingAdd(false);
  }

  async function handleEditVisite(visiteId: string, data: VisiteFormData) {
    setSavingEdit(true);
    const res = await fetch(`/api/visites/${visiteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) { setEditingId(null); await load(); }
    setSavingEdit(false);
  }

  async function handleDeleteVisite(visiteId: string) {
    setDeletingId(visiteId);
    await fetch(`/api/visites/${visiteId}`, { method: "DELETE" });
    await load();
    setDeletingId(null);
  }

  async function handleStatutChange(statut: StatutProspect) {
    if (!prospect || statut === prospect.statut_global) return;
    setUpdatingStatut(true);
    await fetch(`/api/prospects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut_global: statut }),
    });
    setProspect((p) => p ? { ...p, statut_global: statut } : p);
    setUpdatingStatut(false);
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-4">
        <div className="h-8 w-48 bg-gray-100 rounded-lg animate-pulse" />
        <div className="h-40 bg-white rounded-2xl border border-gray-100 animate-pulse" />
        <div className="h-48 bg-white rounded-2xl border border-gray-100 animate-pulse" />
      </div>
    );
  }

  if (!prospect) {
    return <div className="p-8 text-center text-gray-400">Prospect introuvable.</div>;
  }

  const visites = prospect.visites ?? [];

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-3 mb-5">
        <button
          onClick={() => router.back()}
          className="mt-0.5 w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors flex-shrink-0"
        >
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 truncate">{prospect.entreprise}</h1>
          <p className="text-sm text-gray-500 leading-snug">{prospect.secteur_activite}</p>
        </div>
        <span className={`mt-1 text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${STATUT_COLORS[prospect.statut_global]}`}>
          {STATUT_LABELS[prospect.statut_global]}
        </span>
      </div>

      {/* Fiche contact */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Contact</p>
        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Nom</p>
            <p className="font-medium text-gray-800">{prospect.nom_contact}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Poste</p>
            <p className="font-medium text-gray-800">{prospect.poste_contact}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Téléphone</p>
            <a href={`tel:${prospect.telephone}`} className="font-medium text-[#1a2e1e]">
              {prospect.telephone}
            </a>
          </div>
          {prospect.email && (
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Email</p>
              <a href={`mailto:${prospect.email}`} className="font-medium text-[#1a2e1e] truncate block">
                {prospect.email}
              </a>
            </div>
          )}
          <div className="col-span-2">
            <p className="text-xs text-gray-400 mb-0.5">Adresse</p>
            <p className="text-gray-700">{prospect.adresse}</p>
          </div>
          {prospect.notes_generales && (
            <div className="col-span-2">
              <p className="text-xs text-gray-400 mb-0.5">Notes</p>
              <p className="text-gray-700">{prospect.notes_generales}</p>
            </div>
          )}
        </div>

        {/* Changer statut */}
        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Statut du prospect</p>
          <div className="space-y-2">
            {([
              { value: "actif",      label: "Actif",       desc: "Suivi en cours — des visites sont prévues",  icon: "🟢" },
              { value: "sans_suite", label: "Sans suite",  desc: "Arrêt du suivi — plus de contact planifié",  icon: "⚪" },
              { value: "converti",   label: "Converti",    desc: "Prospect devenu client — soumission gagnée", icon: "🔵" },
            ] as { value: StatutProspect; label: string; desc: string; icon: string }[]).map((s) => {
              const isActive = prospect.statut_global === s.value;
              return (
                <button key={s.value} disabled={updatingStatut || isActive}
                  onClick={() => handleStatutChange(s.value)}
                  className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-xl text-left transition-all border ${
                    isActive
                      ? "border-[#1a2e1e] bg-[#1a2e1e08]"
                      : "border-gray-100 bg-gray-50 hover:bg-gray-100"
                  }`}>
                  <span className="text-base flex-shrink-0 mt-0.5">{s.icon}</span>
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold ${isActive ? "text-[#1a2e1e]" : "text-gray-500"}`}>{s.label}</p>
                    <p className="text-xs text-gray-400 leading-snug">{s.desc}</p>
                  </div>
                  {isActive && (
                    <svg className="w-4 h-4 text-[#1a2e1e] ml-auto flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Section Visites */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-5">

        {/* Header visites */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">
            Visites
            <span className="ml-2 text-sm font-normal text-gray-400">({visites.length})</span>
          </h2>
          <motion.button whileTap={{ scale: 0.96 }}
            onClick={() => { setShowAddForm((v) => !v); setEditingId(null); }}
            className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
            style={{ color: "#1a2e1e", backgroundColor: showAddForm ? "#1a2e1e18" : "transparent" }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d={showAddForm ? "M6 18L18 6M6 6l12 12" : "M12 4v16m8-8H4"} />
            </svg>
            {showAddForm ? "Annuler" : "Ajouter"}
          </motion.button>
        </div>

        {/* Formulaire ajout */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}
              className="overflow-hidden border-b border-gray-100">
              <div className="px-5 py-5 bg-gray-50">
                <VisiteForm onSubmit={handleAddVisite} loading={savingAdd} submitLabel="Enregistrer la visite" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Liste visites */}
        {visites.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-gray-400">
            Aucune visite enregistrée
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {visites.map((v: Visite, i: number) => {
              const colors = RESULTAT_COLORS[v.resultat] ?? RESULTAT_COLORS.autre;
              const isEditing = editingId === v.id;
              const isDeleting = deletingId === v.id;

              return (
                <motion.div key={v.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}>

                  {/* Mode lecture */}
                  {!isEditing && (
                    <div className="px-5 py-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          {/* Date de visite — libellé explicite */}
                          <p className="text-xs text-gray-400 mb-1.5 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Visite du {formatDateFr(v.date_visite)}
                          </p>
                          {/* Résultat */}
                          <span className={`inline-block text-xs px-2.5 py-0.5 rounded-full font-medium mb-1.5 ${colors.bg} ${colors.text}`}>
                            Résultat : {RESULTAT_LABELS[v.resultat] ?? v.resultat}
                          </span>
                          {v.notes_visite && (
                            <p className="text-sm text-gray-600 mb-1.5">{v.notes_visite}</p>
                          )}
                          {v.date_prochaine_action && (
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Prochain contact le <span className="font-semibold text-gray-700 ml-1">{formatDateFr(v.date_prochaine_action)}</span>
                              {v.action_requise && <span className="text-gray-400 ml-1">· {v.action_requise}</span>}
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => { setEditingId(v.id); setShowAddForm(false); }}
                            className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
                            style={{ color: "#1a2e1e" }}
                            title="Modifier"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteVisite(v.id)}
                            disabled={isDeleting}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                            title="Supprimer"
                          >
                            {isDeleting ? (
                              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Mode édition */}
                  <AnimatePresence>
                    {isEditing && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="px-5 py-5 bg-gray-50 border-l-2" style={{ borderColor: "#1a2e1e" }}>
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-sm font-semibold text-gray-700">Modifier la visite</p>
                          <button onClick={() => setEditingId(null)}
                            className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded-lg hover:bg-gray-100">
                            Annuler
                          </button>
                        </div>
                        <VisiteForm
                          initialData={visiteToFormData(v)}
                          onSubmit={(data) => handleEditVisite(v.id, data)}
                          loading={savingEdit}
                          submitLabel="Enregistrer les modifications"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
