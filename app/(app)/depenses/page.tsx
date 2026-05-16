"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { Depense, CategorieDepense } from "@/types";
import { formatMontant } from "@/lib/utils";

// ─── Breakpoint ───────────────────────────────────────────────────────────────

function useBp(): "mobile" | "tablet" | "desktop" {
  const [bp, set] = useState<"mobile" | "tablet" | "desktop">("mobile");
  useEffect(() => {
    const h = () =>
      set(
        window.innerWidth >= 1024
          ? "desktop"
          : window.innerWidth >= 640
          ? "tablet"
          : "mobile"
      );
    h();
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return bp;
}

// ─── Category config ──────────────────────────────────────────────────────────

type CatConfig = {
  value: CategorieDepense;
  label: string;
  abbr: string;
  bg: string;
  text: string;
  dot: string;
};

const CATEGORIES: CatConfig[] = [
  { value: "mission",       label: "Mission",       abbr: "MIS", bg: "#dbeafe", text: "#1e40af", dot: "#3b82f6" },
  { value: "vehicule",      label: "Véhicule",      abbr: "VEH", bg: "#fef3c7", text: "#92400e", dot: "#f59e0b" },
  { value: "repas",         label: "Repas",         abbr: "REP", bg: "#d1fae5", text: "#065f46", dot: "#10b981" },
  { value: "materiel",      label: "Matériel",      abbr: "MAT", bg: "#ede9fe", text: "#5b21b6", dot: "#8b5cf6" },
  { value: "communication", label: "Communication", abbr: "COM", bg: "#e0e7ff", text: "#3730a3", dot: "#6366f1" },
  { value: "autre",         label: "Autre",         abbr: "AUT", bg: "#f3f4f6", text: "#4b5563", dot: "#9ca3af" },
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

const PER_PAGE = 10;

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

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    fontSize: 13,
    color: "#374151",
    background: "#fff",
    outline: "none",
    boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 11,
    fontWeight: 600,
    color: "#6b7280",
    marginBottom: 5,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  };

  return (
    <form onSubmit={onSubmit} style={{ padding: "16px 20px 20px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div>
          <label style={labelStyle}>Montant (DZD) *</label>
          <input
            type="number" min="0" step="0.01" placeholder="0,00"
            value={form.montant}
            onChange={(e) => onChange((p) => ({ ...p, montant: e.target.value }))}
            required
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Catégorie *</label>
          <div style={{ position: "relative" }}>
            <select
              value={form.categorie}
              onChange={(e) => onChange((p) => ({ ...p, categorie: e.target.value as CategorieDepense }))}
              required
              style={{ ...inputStyle, appearance: "none", paddingRight: 32, cursor: "pointer" }}
            >
              <option value="">Choisir...</option>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <svg style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "#9ca3af", pointerEvents: "none" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div>
          <label style={labelStyle}>Date</label>
          <input
            type="date"
            value={form.date_depense}
            onChange={(e) => onChange((p) => ({ ...p, date_depense: e.target.value }))}
            style={{ ...inputStyle, cursor: "pointer" }}
          />
        </div>
        <div>
          <label style={labelStyle}>Projet lié</label>
          <div style={{ position: "relative" }}>
            <select
              value={form.projet_lie}
              onChange={(e) => onChange((p) => ({ ...p, projet_lie: e.target.value }))}
              style={{ ...inputStyle, appearance: "none", paddingRight: 32, cursor: "pointer" }}
            >
              <option value="">Aucun</option>
              {soumissions.map((s) => (
                <option key={s.id} value={s.id}>{s.numero_offre} — {s.titre_projet}</option>
              ))}
            </select>
            <svg style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "#9ca3af", pointerEvents: "none" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle}>Description</label>
        <input
          type="text" placeholder="Notes optionnelles..."
          value={form.description}
          onChange={(e) => onChange((p) => ({ ...p, description: e.target.value }))}
          style={inputStyle}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Justificatif</label>
        <div
          onClick={() => fileRef.current?.click()}
          style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 40, padding: "8px 12px", border: "1px dashed #d1d5db", borderRadius: 8, cursor: "pointer" }}
        >
          <svg style={{ width: 14, height: 14, color: "#9ca3af", flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
          <span style={{ fontSize: 12, color: "#9ca3af", flex: 1 }}>{photo ? photo.name : "Photo ou fichier (optionnel)"}</span>
          {photo && (
            <button type="button" onClick={(e) => { e.stopPropagation(); onPhoto(null); }} style={{ border: "none", background: "none", cursor: "pointer", color: "#9ca3af", padding: 0 }}>
              <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => onPhoto(e.target.files?.[0] ?? null)} />
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <motion.button
          type="submit"
          disabled={saving}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          style={{ flex: 1, height: 40, borderRadius: 8, border: "none", background: "#1a2e1e", color: "#fff", fontSize: 13, fontWeight: 600, cursor: saving ? "wait" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, opacity: saving ? 0.75 : 1 }}
        >
          {saving && <Spinner />}
          {submitLabel}
        </motion.button>
        <button
          type="button"
          onClick={onCancel}
          style={{ padding: "0 16px", height: 40, borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", color: "#6b7280", fontSize: 13, fontWeight: 500, cursor: "pointer" }}
        >
          Annuler
        </button>
      </div>
    </form>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const TH: React.CSSProperties = {
  textAlign: "left",
  padding: "10px 16px",
  fontSize: 11,
  fontWeight: 600,
  color: "#6b7280",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  whiteSpace: "nowrap",
  background: "#fafafa",
  position: "sticky",
  top: 0,
  zIndex: 1,
  borderBottom: "1px solid #eaecef",
};

export default function DepensesPage() {
  const bp = useBp();
  const isDesktop = bp !== "mobile";

  const [depenses, setDepenses] = useState<Depense[]>([]);
  const [soumissions, setSoumissions] = useState<SoumissionOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [photo, setPhoto] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormState>(EMPTY_FORM);
  const [editPhoto, setEditPhoto] = useState<File | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<CategorieDepense | "">("");

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
        (souData.data as Array<{ id: string; titre_projet: string; numero_offre: string }> ?? []).map((s) => ({
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

  // ── Filtered & Paginated ──────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return depenses.filter((d) => {
      if (catFilter && d.categorie !== catFilter) return false;
      if (q) {
        const proj = soumissions.find((s) => s.id === d.projet_lie);
        return (
          d.description?.toLowerCase().includes(q) ||
          d.categorie.includes(q) ||
          proj?.titre_projet.toLowerCase().includes(q) ||
          proj?.numero_offre.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [depenses, search, catFilter, soumissions]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  useEffect(() => setPage(1), [search, catFilter]);

  // ── Storage upload ────────────────────────────────────────────────────────
  async function uploadPhoto(file: File, depenseId: string): Promise<string | null> {
    if (!userId) return null;
    const supabase = createSupabaseBrowserClient();
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${userId}/${depenseId}.${ext}`;
    const { error } = await supabase.storage.from("justificatifs").upload(path, file, { upsert: true });
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
    const { data } = await supabase.storage.from("justificatifs").createSignedUrl(path, 3600);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ height: 44, background: "#fff", borderRadius: 10, animation: "pulse 1.5s ease-in-out infinite", border: "1px solid #eaecef" }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: 72, background: "#fff", borderRadius: 12, animation: "pulse 1.5s ease-in-out infinite", border: "1px solid #eaecef" }} />
          ))}
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} style={{ height: 48, background: "#fff", borderRadius: 10, animation: "pulse 1.5s ease-in-out infinite", border: "1px solid #eaecef" }} />
        ))}
      </div>
    );
  }

  const px = isDesktop ? 28 : 16;
  const monthLabel = new Date().toLocaleDateString("fr-DZ", { month: "long", year: "numeric" });

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#f4f5f7" }}>

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div style={{ padding: `${isDesktop ? 24 : 20}px ${px}px 0`, flexShrink: 0 }}>
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}
        >
          <h1 style={{ fontSize: isDesktop ? 26 : 22, fontWeight: 700, color: "#0f1923", letterSpacing: "-0.5px", margin: 0 }}>
            Dépenses
          </h1>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => { setShowForm((v) => !v); setEditId(null); }}
            style={{ background: "#1a2e1e", color: "#fff", borderRadius: 9999, padding: "0 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, height: 36, border: "none", flexShrink: 0 }}
          >
            <span style={{ fontSize: 16, lineHeight: 1 }}>{showForm ? "×" : "+"}</span>
            {isDesktop && <span>Nouvelle dépense</span>}
          </motion.button>
        </motion.div>

        {/* Stat cards */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}
        >
          {/* Total ce mois */}
          <div style={{ background: "#fff", border: "1px solid #eaecef", borderRadius: 12, padding: isDesktop ? "16px 20px" : "12px 14px", boxShadow: "0 1px 3px rgba(0,0,0,.04)" }}>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#9ca3af", marginBottom: 8 }}>
              Total {monthLabel}
            </div>
            <div style={{ fontSize: isDesktop ? 21 : 15, fontWeight: 700, color: "#0f1923", lineHeight: 1.2, letterSpacing: "-0.5px" }}>
              {formatMontant(totalThisMonth)}
              <span style={{ fontSize: 11, fontWeight: 400, color: "#9ca3af", marginLeft: 4 }}>DZD</span>
            </div>
            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>
              {thisMonth.length} dépense{thisMonth.length !== 1 ? "s" : ""}
            </div>
          </div>

          {/* Dépenses au total */}
          <div style={{ background: "#fff", border: "1px solid #eaecef", borderRadius: 12, padding: isDesktop ? "16px 20px" : "12px 14px", boxShadow: "0 1px 3px rgba(0,0,0,.04)" }}>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#9ca3af", marginBottom: 8 }}>
              Total enregistrées
            </div>
            <div style={{ fontSize: isDesktop ? 21 : 15, fontWeight: 700, color: "#0f1923", lineHeight: 1.2, letterSpacing: "-0.5px" }}>
              {depenses.length}
              <span style={{ fontSize: 13, fontWeight: 400, color: "#9ca3af", marginLeft: 6 }}>dépenses</span>
            </div>
            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>
              {depenses.filter(d => d.projet_lie).length} liée{depenses.filter(d => d.projet_lie).length !== 1 ? "s" : ""} à un projet
            </div>
          </div>

          {/* Justificatifs */}
          {(() => {
            const avecRecu = thisMonth.filter(d => d.justificatif_url).length;
            const total = thisMonth.length;
            const complet = total > 0 && avecRecu === total;
            return (
              <div style={{ background: "#fff", border: "1px solid #eaecef", borderRadius: 12, padding: isDesktop ? "16px 20px" : "12px 14px", boxShadow: "0 1px 3px rgba(0,0,0,.04)" }}>
                <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#9ca3af", marginBottom: 8 }}>
                  Justificatifs
                </div>
                <div style={{ fontSize: isDesktop ? 21 : 15, fontWeight: 700, color: "#0f1923", lineHeight: 1.2, letterSpacing: "-0.5px" }}>
                  {avecRecu}
                  <span style={{ fontSize: 13, fontWeight: 400, color: "#9ca3af", marginLeft: 2 }}>/ {total}</span>
                </div>
                <div style={{ fontSize: 11, marginTop: 4, color: complet ? "#16a34a" : total === 0 ? "#9ca3af" : "#f59e0b", fontWeight: complet ? 600 : 400 }}>
                  {total === 0 ? "ce mois" : complet ? "✓ Tous fournis" : `${total - avecRecu} manquant${total - avecRecu > 1 ? "s" : ""}`}
                </div>
              </div>
            );
          })()}
        </motion.div>
      </div>

      {/* ── ADD FORM ─────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            key="add-form"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            style={{ overflow: "hidden", flexShrink: 0 }}
          >
            <div style={{ padding: `0 ${px}px 8px` }}>
              <div style={{ background: "#fff", border: "1px solid #eaecef", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,.06)" }}>
                <div style={{ padding: "13px 20px", background: "#fafafa", borderBottom: "1px solid #eaecef", fontSize: 13, fontWeight: 600, color: "#374151" }}>
                  Nouvelle dépense
                </div>
                <DepenseForm
                  form={form} onChange={setForm} onSubmit={handleAdd}
                  onCancel={() => { setShowForm(false); setForm(EMPTY_FORM); setPhoto(null); }}
                  saving={saving} photo={photo} onPhoto={setPhoto}
                  soumissions={soumissions} submitLabel="Enregistrer"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CONTENT (scrollable) ─────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, padding: `0 ${px}px`, paddingBottom: 20 }}>

        {/* Filter bar */}
        <div style={{ display: "flex", gap: 8, marginBottom: 10, flexShrink: 0 }}>
          <div style={{ position: "relative", flex: 1 }}>
            <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "#9ca3af", pointerEvents: "none" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Rechercher une dépense..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: "100%", paddingLeft: 32, paddingRight: 12, height: 36, border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, color: "#374151", background: "#fff", outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <div style={{ position: "relative" }}>
            <select
              value={catFilter}
              onChange={(e) => setCatFilter(e.target.value as CategorieDepense | "")}
              style={{ height: 36, border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, color: catFilter ? "#374151" : "#9ca3af", background: "#fff", paddingLeft: 10, paddingRight: 28, outline: "none", cursor: "pointer", appearance: "none" }}
            >
              <option value="">Toutes catégories</option>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <svg style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", width: 12, height: 12, color: "#9ca3af", pointerEvents: "none" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Table / Card container */}
        <div style={{ flex: 1, overflow: "auto", background: "#fff", border: "1px solid #eaecef", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,.04)" }}>

          {/* ─── DESKTOP : table ───────────────────────────────────────────── */}
          {isDesktop && (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={TH}>Description</th>
                  <th style={TH}>Projet</th>
                  <th style={TH}>Date</th>
                  <th style={{ ...TH, textAlign: "right" }}>Montant</th>
                  <th style={{ ...TH, textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {paginated.map((d, i) => {
                    const cat = catCfg(d.categorie);
                    const projet = soumissions.find((s) => s.id === d.projet_lie);
                    const isEditing = editId === d.id;

                    return (
                      <React.Fragment key={d.id}>
                        <motion.tr
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ delay: i * 0.02 }}
                          style={{ borderBottom: "1px solid #f0f2f5", transition: "background 0.1s, box-shadow 0.1s" }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#f9fafb";
                            e.currentTarget.style.boxShadow = "inset 3px 0 0 #1a2e1e";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                            e.currentTarget.style.boxShadow = "none";
                          }}
                        >
                          {/* Description */}
                          <td style={{ padding: "13px 16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 5, background: cat.bg, color: cat.text, border: `1px solid ${cat.dot}40`, flexShrink: 0, letterSpacing: "0.04em" }}>
                                {cat.abbr}
                              </span>
                              <span style={{ fontSize: 13, color: d.description ? "#374151" : "#9ca3af", fontStyle: d.description ? "normal" : "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 220 }}>
                                {d.description || "—"}
                              </span>
                            </div>
                          </td>

                          {/* Projet */}
                          <td style={{ padding: "13px 16px" }}>
                            {projet ? (
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <svg style={{ width: 12, height: 12, color: "#9ca3af", flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span style={{ fontSize: 12, color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200 }}>
                                  {projet.numero_offre} — {projet.titre_projet}
                                </span>
                              </div>
                            ) : (
                              <span style={{ color: "#d1d5db", fontSize: 13 }}>—</span>
                            )}
                          </td>

                          {/* Date */}
                          <td style={{ padding: "13px 16px" }}>
                            <span style={{ fontSize: 13, color: "#6b7280" }}>
                              {new Date(d.date_depense + "T00:00:00").toLocaleDateString("fr-DZ", { day: "2-digit", month: "short" })}
                            </span>
                          </td>

                          {/* Montant */}
                          <td style={{ padding: "13px 16px", textAlign: "right" }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: "#0f1923" }}>{formatMontant(Number(d.montant))}</span>
                            <span style={{ fontSize: 11, color: "#9ca3af", marginLeft: 3 }}>DZD</span>
                          </td>

                          {/* Actions */}
                          <td style={{ padding: "10px 16px", textAlign: "right" }}>
                            <div style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
                              {d.justificatif_url && (
                                <button
                                  onClick={() => viewJustificatif(d.justificatif_url!)}
                                  title="Voir justificatif"
                                  style={{ width: 32, height: 32, borderRadius: 7, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280" }}
                                >
                                  <svg style={{ width: 13, height: 13 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                  </svg>
                                </button>
                              )}
                              <button
                                onClick={() => openEdit(d)}
                                title="Modifier"
                                style={{ width: 32, height: 32, borderRadius: 7, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280" }}
                              >
                                <svg style={{ width: 13, height: 13 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDelete(d.id)}
                                disabled={deletingId === d.id}
                                title="Supprimer"
                                style={{ width: 32, height: 32, borderRadius: 7, border: "1px solid #fee2e2", background: "#fff", cursor: deletingId === d.id ? "wait" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#ef4444", opacity: deletingId === d.id ? 0.6 : 1 }}
                              >
                                {deletingId === d.id ? <Spinner /> : (
                                  <svg style={{ width: 13, height: 13 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                )}
                              </button>
                            </div>
                          </td>
                        </motion.tr>

                        {/* Inline edit row */}
                        <AnimatePresence>
                          {isEditing && (
                            <motion.tr
                              key={`edit-${d.id}`}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                            >
                              <td colSpan={5} style={{ padding: 0, background: "#f8fafc", borderBottom: "1px solid #eaecef" }}>
                                <div style={{ padding: "10px 16px", background: "#f0f2f5", fontSize: 12, fontWeight: 600, color: "#374151", borderBottom: "1px solid #e5e7eb" }}>
                                  Modifier la dépense
                                </div>
                                <DepenseForm
                                  form={editForm} onChange={setEditForm} onSubmit={handleEdit}
                                  onCancel={() => { setEditId(null); setEditPhoto(null); }}
                                  saving={editSaving} photo={editPhoto} onPhoto={setEditPhoto}
                                  soumissions={soumissions} submitLabel="Enregistrer"
                                />
                              </td>
                            </motion.tr>
                          )}
                        </AnimatePresence>
                      </React.Fragment>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          )}

          {/* ─── MOBILE : card list ────────────────────────────────────────── */}
          {!isDesktop && (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              <AnimatePresence>
                {paginated.map((d, i) => {
                  const cat = catCfg(d.categorie);
                  const projet = soumissions.find((s) => s.id === d.projet_lie);
                  const isEditing = editId === d.id;

                  return (
                    <motion.li
                      key={d.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, x: -12 }}
                      transition={{ delay: i * 0.03 }}
                      style={{ borderBottom: "1px solid #f0f2f5" }}
                    >
                      {!isEditing ? (
                        <div style={{ padding: "14px 16px", display: "flex", alignItems: "flex-start", gap: 12 }}>
                          {/* Category badge */}
                          <div style={{ width: 38, height: 38, borderRadius: 9, background: cat.bg, border: `1px solid ${cat.dot}40`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                            <span style={{ fontSize: 9, fontWeight: 800, color: cat.text, letterSpacing: "0.05em" }}>{cat.abbr}</span>
                          </div>

                          {/* Content */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, marginBottom: 3 }}>
                              <span style={{ fontSize: 14, fontWeight: 700, color: "#0f1923" }}>
                                {formatMontant(Number(d.montant))}
                                <span style={{ fontSize: 11, fontWeight: 400, color: "#9ca3af", marginLeft: 3 }}>DZD</span>
                              </span>
                              <span style={{ fontSize: 12, color: "#9ca3af", flexShrink: 0 }}>
                                {new Date(d.date_depense + "T00:00:00").toLocaleDateString("fr-DZ", { day: "2-digit", month: "short" })}
                              </span>
                            </div>
                            {d.description && (
                              <p style={{ fontSize: 12, color: "#6b7280", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {d.description}
                              </p>
                            )}
                            {projet && (
                              <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                                <svg style={{ width: 11, height: 11, color: "#9ca3af", flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span style={{ fontSize: 11, color: "#9ca3af", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {projet.numero_offre} — {projet.titre_projet}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div style={{ display: "flex", gap: 3, flexShrink: 0 }}>
                            {d.justificatif_url && (
                              <button onClick={() => viewJustificatif(d.justificatif_url!)} style={{ width: 36, height: 36, borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280" }}>
                                <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                </svg>
                              </button>
                            )}
                            <button onClick={() => openEdit(d)} style={{ width: 36, height: 36, borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280" }}>
                              <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button onClick={() => handleDelete(d.id)} disabled={deletingId === d.id} style={{ width: 36, height: 36, borderRadius: 8, border: "1px solid #fee2e2", background: "#fff", cursor: deletingId === d.id ? "wait" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#ef4444" }}>
                              {deletingId === d.id ? <Spinner /> : (
                                <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ background: "#f8fafc" }}>
                          <div style={{ padding: "10px 16px", background: "#f0f2f5", fontSize: 12, fontWeight: 600, color: "#374151", borderBottom: "1px solid #e5e7eb" }}>
                            Modifier la dépense
                          </div>
                          <DepenseForm
                            form={editForm} onChange={setEditForm} onSubmit={handleEdit}
                            onCancel={() => { setEditId(null); setEditPhoto(null); }}
                            saving={editSaving} photo={editPhoto} onPhoto={setEditPhoto}
                            soumissions={soumissions} submitLabel="Enregistrer"
                          />
                        </div>
                      )}
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          )}

          {/* Empty state */}
          {filtered.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ padding: "56px 24px", textAlign: "center" }}
            >
              <svg style={{ width: 36, height: 36, color: "#d1d5db", margin: "0 auto 12px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p style={{ fontSize: 14, color: "#6b7280", fontWeight: 500, margin: 0 }}>
                {search || catFilter ? "Aucun résultat" : "Aucune dépense enregistrée"}
              </p>
              <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>
                {search || catFilter ? "Essayez d'autres filtres" : "Cliquez sur + pour commencer"}
              </p>
            </motion.div>
          )}

          {/* End of history */}
          {filtered.length > 0 && paginated.length < PER_PAGE && page === totalPages && (
            <div style={{ padding: "20px 24px", textAlign: "center", borderTop: "1px solid #f0f2f5" }}>
              <svg style={{ width: 24, height: 24, color: "#e5e7eb", margin: "0 auto 6px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>Fin de l&apos;historique</p>
            </div>
          )}
        </div>
      </div>

      {/* ── PAGINATION ───────────────────────────────────────────────────────── */}
      <div style={{ borderTop: "1px solid #eaecef", padding: `10px ${px}px`, display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", flexShrink: 0 }}>
        <span style={{ fontSize: 12, color: "#9ca3af" }}>
          {filtered.length} dépense{filtered.length !== 1 ? "s" : ""}
          {(search || catFilter) ? " trouvée" + (filtered.length !== 1 ? "s" : "") : ""}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #e5e7eb", background: "#fff", cursor: page <= 1 ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: page <= 1 ? 0.35 : 1 }}
          >
            <svg style={{ width: 12, height: 12, color: "#374151" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 500, minWidth: 52, textAlign: "center" }}>
            {page} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #e5e7eb", background: "#fff", cursor: page >= totalPages ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: page >= totalPages ? 0.35 : 1 }}
          >
            <svg style={{ width: 12, height: 12, color: "#374151" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

    </div>
  );
}
