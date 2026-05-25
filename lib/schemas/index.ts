import { z } from "zod"

// ── Prospects ──────────────────────────────────────────────
export const prospectCreateSchema = z.object({
  entreprise: z.string().min(1, "Entreprise requise").max(200),
  secteur_activite: z.string().min(1, "Secteur requis").max(100),
  nom_contact: z.string().min(1, "Nom contact requis").max(100),
  poste_contact: z.string().max(100).optional(),
  telephone: z.string().max(30).optional(),
  email: z.string().email("Email invalide").optional().nullable(),
  adresse: z.string().max(300).optional(),
  notes_generales: z.string().max(2000).optional().nullable(),
})

// ── Visites ────────────────────────────────────────────────
const RESULTATS_VALIDES = [
  "soumission_demandee",
  "rappel_planifie",
  "pas_interesse",
  "absent",
  "autre",
  "visite_expert_demandee",
] as const

export const visiteCreateSchema = z.object({
  prospect_id: z.string().uuid("prospect_id invalide"),
  date_visite: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format date invalide (YYYY-MM-DD)"),
  resultat: z.enum(RESULTATS_VALIDES),
  notes_visite: z.string().max(3000).optional().nullable(),
  date_prochaine_action: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  action_requise: z.string().max(500).optional().nullable(),
})

export const visitePatchSchema = z.object({
  date_visite: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  resultat: z.enum(RESULTATS_VALIDES).optional(),
  notes_visite: z.string().max(3000).optional().nullable(),
  date_prochaine_action: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  action_requise: z.string().max(500).optional().nullable(),
}).refine(data => Object.keys(data).length > 0, "Au moins un champ requis")

// ── Generate (AI) ──────────────────────────────────────────
export const generateSchema = z.object({
  step1: z.object({
    titre: z.string().min(1),
    nom_contact: z.string().min(1).max(100),
    poste: z.string().max(100),
    entreprise: z.string().min(1).max(200),
    adresse: z.string().max(300),
    ville: z.string().max(100),
  }),
  step2: z.object({
    titre_projet: z.string().min(3).max(300),
    secteur_activite: z.string().min(1).max(100),
    description_projet: z.string().min(10).max(5000),
    type_etude: z.string().min(1).max(100),
    delai_jours: z.number().int().min(1).max(3650),
  }),
})

// ── Soumission POST ────────────────────────────────────────
export const ligneBudgetSchema = z.object({
  numero: z.number().int().min(1),
  designation: z.string().min(1).max(1000),
  quantite: z.number().min(0),
  prix_unitaire: z.number().min(0),
  groupe: z.string().max(200).default("Mission"),
})

export const soumissionCreateSchema = z.object({
  formData: z.object({
    step1: z.object({
      titre: z.string().min(1),
      nom_contact: z.string().min(1).max(100),
      poste: z.string().max(100),
      entreprise: z.string().min(1).max(200),
      adresse: z.string().max(300),
      ville: z.string().max(100),
    }),
    step2: z.object({
      titre_projet: z.string().min(3).max(300),
      secteur_activite: z.string().min(1).max(100),
      description_projet: z.string().min(10).max(5000),
      type_etude: z.string().min(1).max(100),
      delai_jours: z.number().int().min(1).max(3650),
    }),
    step3: z.object({
      lignes: z.array(ligneBudgetSchema).min(1, "Au moins une ligne de budget requise"),
    }),
  }),
  contexte: z.object({
    section_1: z.string().min(1).max(10000),
    section_1_1: z.string().min(1).max(10000),
  }),
})

// ── Client PATCH ──────────────────────────────────────────
export const clientPatchSchema = z.object({
  titre: z.string().min(1).max(10).optional(),
  nom_contact: z.string().min(1).max(100).optional(),
  poste: z.string().max(100).optional(),
  entreprise: z.string().min(1).max(200).optional(),
  adresse: z.string().max(300).optional(),
  ville: z.string().max(100).optional(),
  telephone: z.string().max(30).optional(),
  email: z.string().email().optional().nullable(),
}).refine(data => Object.keys(data).length > 0, "Au moins un champ requis")

// ── Dépense POST ──────────────────────────────────────────
const CATEGORIES_VALIDES = [
  "mission",
  "vehicule",
  "repas",
  "materiel",
  "communication",
  "autre",
] as const

export const depenseCreateSchema = z.object({
  categorie: z.enum(CATEGORIES_VALIDES),
  montant: z.number().positive("Le montant doit être positif"),
  description: z.string().max(1000).optional().nullable(),
  date_depense: z.string().regex(
    /^\d{4}-\d{2}-\d{2}$/,
    "Format date invalide (YYYY-MM-DD)"
  ).optional(),
  justificatif_url: z.string().url().optional().nullable(),
  projet_lie: z.string().uuid("projet_lie doit être un UUID valide").optional().nullable(),
})

// ── Export DOCX / PDF ──────────────────────────────────────
export const exportDocumentSchema = z.object({
  soumission: z.object({
    id: z.string().uuid().optional().nullable(),
    numero_offre: z.string().min(1),
    titre_projet: z.string().min(1),
  }).passthrough(),
  client: z.object({
    entreprise: z.string(),
  }).passthrough().optional(),
  lignes: z.array(ligneBudgetSchema),
  contexteData: z.object({
    section_1: z.string(),
    section_1_1: z.string(),
  }).optional(),
  editablePreview: z.record(z.string(), z.unknown()).optional(),
})
