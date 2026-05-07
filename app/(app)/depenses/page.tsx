"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { Depense, CategorieDepense } from "@/types";
import { formatMontant } from "@/lib/utils";

// ─── Category config ──────────────────────────────────────────────────────────

type CatConfig = { value: CategorieDepense; label: string; bg: string; text: string };

const CATEGORIES: CatConfig[] = [
  { value: "mission",       label: "Mission",       bg: "bg-blue-100",   text: "text-blue-700"   },
  { value: "vehicule",      label: "Véhicule",      bg: "bg-amber-100",  text: "text-amber-700"  },
  { value: "repas",         label: "Repas",         bg: "bg-emerald-100",text: "text-emerald-700"},
  { value: "materiel",      label: "Matériel",      bg: "bg-purple-100", text: "text-purple-700" },
  { value: "communication", label: "Communication", bg: "bg-indigo-100", text: "text-indigo-700" },
  { value: "autre",         label: "Autre",         bg: "bg-gray-100",   text: "text-gray-500"   },
];

function catCfg(cat: string): CatConfig {
  return CATEGORIES.find((c) => c.value === cat) ?? CATEGORIES[5];
}

// ─── Types ────────────────────────────────────────────────────────────────────

type SoumissionOption = { id: string; titre_projet: string; numero_offre: string };

type FormState = {
  categorie: CategorieDepense | "";
  montant: string;
  description: string;
  date_depense: string;
  projet_lie: string;
};

const EMPTY_FORM: FormState = {
  categorie: "",
  montant: "",
  description: "",
  date_depense: new Date().toISOString().slice(0, 10),
  projet_lie: "",
};

// ─── Spinner ──────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

// ─── DepenseForm ──────────────────────────────────────────────────────────────

interface DepenseFormProps {
  form: FormState;
  onChange: React.Dispatch<React.SetStateAction<FormState>>;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  saving: boolean;
  photo: File | null;
  onPhoto: (f: File | null) => void;
  soumissions: SoumissionOption[];
  submitLabel: string;
}

function DepenseForm({
  form, onChange, onSubmit, onCancel, saving,
  photo, onPhoto, soumissions, submitLabel,
}: DepenseFormProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  const field =
    "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white outline-none focus:border-[#1a2e1e] transition-colors";
  const lbl = "block text-xs font-medium text-gray-600 mb-1";

  return (
    <form onSubmit={onSubmit} className="p-4 space-y-3">

      {/* Montant + Catégorie (required) */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={lbl}>Montant (DZD) *</label>
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="0,00"
            value={form.montant}
            onChange={(e) => onChange((p) => ({ ...p, montant: e.target.value }))}
            required
            className={field}
          />
        </div>
        <div>
          <label className={lbl}>Catégorie *</label>
          <div className="relative">
            <select
              value={form.categorie}
              onChange={(e) =>
                onChange((p) => ({ ...p, categorie: e.target.value as CategorieDepense }))
              }
              required
              className={field + " appearance-none pr-8 cursor-pointer"}
            >
              <option value="">Choisir...</option>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <svg
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Date + Projet lié (optional) */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={lbl}>Date</label>
          <input
            type="date"
            value={form.date_depense}
            onChange={(e) => onChange((p) => ({ ...p, date_depense: e.target.value }))}
            className={field + " cursor-pointer"}
          />
        </div>
        <div>
          <label className={lbl}>Projet lié</label>
          <div className="relative">
            <select
              value={form.projet_lie}
              onChange={(e) => onChange((p) => ({ ...p, projet_lie: e.target.value }))}
              className={field + " appearance-none pr-8 cursor-pointer"}
            >
              <option value="">Aucun</option>
              {soumissions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.numero_offre} — {s.titre_projet}
                </option>
              ))}
            </select>
            <svg
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Description (optional) */}
      <div>
        <label className={lbl}>Description</label>
        <input
          type="text"
          placeholder="Notes optionnelles..."
          value={form.description}
          onChange={(e) => onChange((p) => ({ ...p, description: e.target.value }))}
          className={field}
        />
      </div>

      {/* Photo capture */}
      <div>
        <label className={lbl}>Justificatif (photo optionnelle)</label>
        <div
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-3 min-h-[44px] px-3 py-2.5 border border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-[#1a2e1e] transition-colors"
        >
          <svg
            className="w-5 h-5 text-gray-400 flex-shrink-0"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-sm text-gray-500 truncate flex-1">
            {photo ? photo.name : "Photo ou fichier (optionnel)"}
          </span>
          {photo && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onPhoto(null); }}
              className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onPhoto(e.target.files?.[0] ?? null)}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <motion.button
          type="submit"
          disabled={saving}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex-1 flex items-center justify-center gap-2 min-h-[44px] rounded-xl text-sm font-medium text-white cursor-pointer disabled:opacity-60"
          style={{ backgroundColor: "#1a2e1e" }}
        >
          {saving && <Spinner />}
          {submitLabel}
        </motion.button>
        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          onClick={onCancel}
          className="px-4 min-h-[44px] rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
        >
          Annuler
        </motion.button>
      </div>
    </form>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DepensesPage() {
  const [depenses, setDepenses] = useState<Depense[]>([]);
  const [soumissions, setSoumissions] = useState<SoumissionOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Add form
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [photo, setPhoto] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  // Edit
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormState>(EMPTY_FORM);
  const [editPhoto, setEditPhoto] = useState<File | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  // Delete
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── Load ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });

    Promise.all([
      fetch("/api/depenses").then((r) => r.json()),
      fetch("/api/soumissions").then((r) => r.json()),
    ]).then(([depData, souData]) => {
      setDepenses(depData.data ?? []);
      setSoumissions(
        (
          souData.data as Array<{
            id: string;
            titre_projet: string;
            numero_offre: string;
          }> ?? []
        ).map((s) => ({
          id: s.id,
          titre_projet: s.titre_projet,
          numero_offre: s.numero_offre,
        }))
      );
      setLoading(false);
    });
  }, []);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const currentMonth = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }, []);

  const thisMonth = useMemo(
    () => depenses.filter((d) => d.date_depense.startsWith(currentMonth)),
    [depenses, currentMonth]
  );

  const totalThisMonth = useMemo(
    () => thisMonth.reduce((s, d) => s + Number(d.montant), 0),
    [thisMonth]
  );

  const byCat = useMemo(
    () =>
      CATEGORIES.map((c) => ({
        ...c,
        total: thisMonth
          .filter((d) => d.categorie === c.value)
          .reduce((s, d) => s + Number(d.montant), 0),
      })).filter((c) => c.total > 0),
    [thisMonth]
  );

  // ── Storage upload ────────────────────────────────────────────────────────
  async function uploadPhoto(file: File, depenseId: string): Promise<string | null> {
    if (!userId) return null;
    const supabase = createSupabaseBrowserClient();
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${userId}/${depenseId}.${ext}`;
    const { error } = await supabase.storage
      .from("justificatifs")
      .upload(path, file, { upsert: true });
    if (error) return null;
    return path;
  }

  // ── Add ───────────────────────────────────────────────────────────────────
  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.categorie || !form.montant) return;
    setSaving(true);

    const res = await fetch("/api/depenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        categorie: form.categorie,
        montant: parseFloat(form.montant),
        description: form.description || null,
        date_depense: form.date_depense || null,
        projet_lie: form.projet_lie || null,
      }),
    });

    const json = await res.json();
    if (res.ok && json.data) {
      const created = json.data as Depense;
      if (photo) {
        const path = await uploadPhoto(photo, created.id);
        if (path) {
          await fetch(`/api/depenses/${created.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ justificatif_url: path }),
          });
          created.justificatif_url = path;
        }
      }
      setDepenses((prev) => [created, ...prev]);
      setForm(EMPTY_FORM);
      setPhoto(null);
      setShowForm(false);
    }
    setSaving(false);
  }

  // ── Edit ──────────────────────────────────────────────────────────────────
  function openEdit(d: Depense) {
    setEditId(d.id);
    setEditForm({
      categorie: d.categorie,
      montant: String(d.montant),
      description: d.description ?? "",
      date_depense: d.date_depense,
      projet_lie: d.projet_lie ?? "",
    });
    setEditPhoto(null);
    setShowForm(false);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editId || !editForm.categorie || !editForm.montant) return;
    setEditSaving(true);

    const payload: Record<string, unknown> = {
      categorie: editForm.categorie,
      montant: parseFloat(editForm.montant),
      description: editForm.description || null,
      date_depense: editForm.date_depense || null,
      projet_lie: editForm.projet_lie || null,
    };

    if (editPhoto) {
      const path = await uploadPhoto(editPhoto, editId);
      if (path) payload.justificatif_url = path;
    }

    const res = await fetch(`/api/depenses/${editId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    if (res.ok) {
      setDepenses((prev) =>
        prev.map((d) => (d.id === editId ? { ...d, ...(json.data as Depense) } : d))
      );
      setEditId(null);
      setEditPhoto(null);
    }
    setEditSaving(false);
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette dépense définitivement ?")) return;
    setDeletingId(id);
    const res = await fetch(`/api/depenses/${id}`, { method: "DELETE" });
    if (res.ok) setDepenses((prev) => prev.filter((d) => d.id !== id));
    setDeletingId(null);
  }

  // ── Signed URL ────────────────────────────────────────────────────────────
  async function viewJustificatif(path: string) {
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase.storage
      .from("justificatifs")
      .createSignedUrl(path, 3600);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  }

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-4">
        <div className="h-10 bg-white rounded-2xl animate-pulse border border-gray-100" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-2xl h-28 animate-pulse border border-gray-100" />
          ))}
        </div>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-2xl h-16 animate-pulse border border-gray-100" />
        ))}
      </div>
    );
  }

  const monthLabel = new Date().toLocaleDateString("fr-DZ", {
    month: "long",
    year: "numeric",
  });

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-4 pb-24 md:pb-6">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-xl font-bold text-gray-900">Mes dépenses</h1>
          <p className="text-sm text-gray-500 capitalize">{monthLabel}</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => { setShowForm((v) => !v); setEditId(null); }}
          className="flex items-center gap-2 min-h-[44px] px-4 rounded-xl text-sm font-medium text-white cursor-pointer"
          style={{ backgroundColor: "#1a2e1e" }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d={showForm ? "M6 18L18 6M6 6l12 12" : "M12 4v16m8-8H4"}
            />
          </svg>
          <span className="hidden sm:inline">{showForm ? "Fermer" : "Ajouter"}</span>
        </motion.button>
      </motion.div>

      {/* Summary cards */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-2 gap-3"
      >
        {/* Total ce mois */}
        <div className="col-span-2 sm:col-span-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs font-medium text-gray-500">Total ce mois</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {formatMontant(totalThisMonth)}{" "}
            <span className="text-sm font-normal text-gray-400">DZD</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {thisMonth.length} dépense{thisMonth.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Par catégorie */}
        <div className="col-span-2 sm:col-span-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs font-medium text-gray-500 mb-2">Par catégorie</p>
          {byCat.length === 0 ? (
            <p className="text-xs text-gray-400 mt-2">Aucune dépense ce mois</p>
          ) : (
            <div className="space-y-1.5">
              {byCat.slice(0, 4).map((c) => (
                <div key={c.value} className="flex items-center justify-between gap-2">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${c.bg} ${c.text}`}>
                    {c.label}
                  </span>
                  <span className="text-xs font-semibold text-gray-700">
                    {formatMontant(c.total)}
                  </span>
                </div>
              ))}
              {byCat.length > 4 && (
                <p className="text-xs text-gray-400">+{byCat.length - 4} autres</p>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Quick-add form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            key="add-form"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="px-4 py-3 bg-[#F4F6F7] border-b border-gray-100 rounded-t-2xl">
                <p className="text-sm font-semibold text-gray-700">Nouvelle dépense</p>
              </div>
              <DepenseForm
                form={form}
                onChange={setForm}
                onSubmit={handleAdd}
                onCancel={() => { setShowForm(false); setForm(EMPTY_FORM); setPhoto(null); }}
                saving={saving}
                photo={photo}
                onPhoto={setPhoto}
                soumissions={soumissions}
                submitLabel="Enregistrer"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
      >
        <div className="px-4 py-3 bg-[#F4F6F7] border-b border-gray-100 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-700">Historique</p>
          <span className="text-xs text-gray-400">{depenses.length} au total</span>
        </div>

        {depenses.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-gray-400">Aucune dépense enregistrée</p>
            <p className="text-xs text-gray-300 mt-1">Appuyez sur Ajouter pour commencer</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            <AnimatePresence>
              {depenses.map((d, i) => {
                const cat = catCfg(d.categorie);
                const projet = soumissions.find((s) => s.id === d.projet_lie);
                const isEditing = editId === d.id;

                return (
                  <motion.li
                    key={d.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ delay: i * 0.02 }}
                  >
                    {/* Normal row */}
                    {!isEditing && (
                      <div className="px-4 py-3 flex items-start gap-3">
                        {/* Category badge */}
                        <div
                          className={`mt-0.5 w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cat.bg}`}
                        >
                          <span className={`text-[10px] font-bold uppercase ${cat.text}`}>
                            {cat.label.slice(0, 3)}
                          </span>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="text-sm font-bold text-gray-900">
                              {formatMontant(Number(d.montant))}{" "}
                              <span className="text-xs font-normal text-gray-400">DZD</span>
                            </span>
                            <span className="text-xs text-gray-400 flex-shrink-0">
                              {new Date(d.date_depense + "T00:00:00").toLocaleDateString("fr-DZ", {
                                day: "2-digit",
                                month: "short",
                              })}
                            </span>
                          </div>
                          {d.description && (
                            <p className="text-xs text-gray-500 mt-0.5 truncate">{d.description}</p>
                          )}
                          {projet && (
                            <div className="flex items-center gap-1 mt-1">
                              <svg
                                className="w-3 h-3 text-gray-400 flex-shrink-0"
                                fill="none" stroke="currentColor" viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span className="text-xs text-gray-400 truncate">
                                {projet.numero_offre} — {projet.titre_projet}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-0.5 flex-shrink-0">
                          {d.justificatif_url && (
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={() => viewJustificatif(d.justificatif_url!)}
                              className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:bg-blue-50 hover:text-blue-500 transition-colors cursor-pointer"
                              title="Voir justificatif"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                              </svg>
                            </motion.button>
                          )}
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => openEdit(d)}
                            className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
                            title="Modifier"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </motion.button>
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDelete(d.id)}
                            disabled={deletingId === d.id}
                            className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer disabled:opacity-50"
                            title="Supprimer"
                          >
                            {deletingId === d.id ? (
                              <Spinner />
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            )}
                          </motion.button>
                        </div>
                      </div>
                    )}

                    {/* Inline edit */}
                    <AnimatePresence>
                      {isEditing && (
                        <motion.div
                          key="edit"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden bg-gray-50"
                        >
                          <div className="px-4 py-2.5 border-b border-gray-100">
                            <span className="text-xs font-semibold text-gray-600">
                              Modifier la dépense
                            </span>
                          </div>
                          <DepenseForm
                            form={editForm}
                            onChange={setEditForm}
                            onSubmit={handleEdit}
                            onCancel={() => { setEditId(null); setEditPhoto(null); }}
                            saving={editSaving}
                            photo={editPhoto}
                            onPhoto={setEditPhoto}
                            soumissions={soumissions}
                            submitLabel="Enregistrer"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        )}
      </motion.div>
    </div>
  );
}
