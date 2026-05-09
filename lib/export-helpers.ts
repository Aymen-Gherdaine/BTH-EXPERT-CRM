import { Client, EditablePreview, LigneBudget, Soumission, TypeEtude } from "@/types";
import { DocumentData } from "@/lib/generate-document";
import { formatDateFr } from "@/lib/utils";

type ContexteData = { section_1: string; section_1_1: string };

export type Parametres = {
  signataire1_nom?: string | null;
  signataire1_titre?: string | null;
  signataire2_nom?: string | null;
  signataire2_titre?: string | null;
  tva_pct?: number | null;
  validite_jours?: number | null;
};

function getHypotheses(type: TypeEtude) {
  const h1 =
    "La classification de l'établissement au titre du décret 07-144 constitue l'étape préalable déterminante pour préciser le régime d'autorisation (Ministère, Wilaya ou APC).";
  const h2_intro = "Selon la classification retenue, les documents suivants seront réalisés :";
  const h3 =
    "Les informations de base (capacités, procédés, intrants, plans d'implantation, listes de produits, volumes stockés) seront fournies par le client et réputées exactes.";
  const h4 =
    "Les délais d'exécution s'entendent hors délais d'instruction administrative et hors délais d'analyses de laboratoire par des tiers.";

  if (type === "EIE+Dangers") {
    return {
      hypothese_1: h1,
      hypothese_2_intro: h2_intro,
      hypothese_2_a: "Étude d'Impact sur l'Environnement (EIE)",
      hypothese_2_b: "Étude de Dangers",
      hypothese_3: h3,
      hypothese_4: h4,
    };
  }
  if (type === "Notice+ProduitsDangereux") {
    return {
      hypothese_1: h1,
      hypothese_2_intro: h2_intro,
      hypothese_2_a: "Notice d'Impact / Audit environnemental",
      hypothese_2_b: "Rapport sur les produits dangereux",
      hypothese_3: h3,
      hypothese_4: h4,
    };
  }
  return {
    hypothese_1: h1,
    hypothese_2_intro: h2_intro,
    hypothese_2_a: "Étude environnementale adaptée selon le régime d'autorisation",
    hypothese_2_b: "Rapport réglementaire complémentaire selon les exigences applicables",
    hypothese_3: h3,
    hypothese_4: h4,
  };
}

// Build document data from EditablePreview — used when user has edited the preview.
// soumission is still needed for computed/non-editable fields (totals, delai_jours).
function buildFromEditablePreview(
  preview: EditablePreview,
  soumission: Soumission,
  lignes: LigneBudget[],
  parametres: Parametres
): DocumentData {
  const titreLong =
    preview.titre === "M." ? "Monsieur" :
    preview.titre === "Mme" ? "Madame" :
    preview.titre;

  const hyps = preview.hypothese_specifique
    .split("\n\n")
    .map((h) => h.trim())
    .filter(Boolean);

  return {
    // Client — from editablePreview
    titre: preview.titre,
    titre_long: titreLong,
    nom_client: preview.nom_contact,
    nom_client_majuscule: preview.nom_contact.toUpperCase(),
    poste_client: preview.poste_contact,
    entreprise: preview.entreprise,
    adresse: preview.adresse,
    ville: preview.ville,
    code_postal: "",
    // Offre — from editablePreview (date_offre already formatted as French string)
    numero_offre: preview.numero_offre,
    date_offre: preview.date_offre,
    // Projet — from editablePreview
    titre_projet: preview.titre_projet,
    description_mission: preview.titre_projet.toLowerCase(),
    contexte_paragraphe_1: preview.contexte_paragraphe_1,
    contexte_paragraphe_2: preview.contexte_paragraphe_2,
    // Objectifs — from editablePreview
    objectif_1: preview.objectif_1,
    objectif_2: preview.objectif_2,
    objectif_3: preview.objectif_3,
    objectif_4: preview.objectif_4,
    // Hypothèses — split hypothese_specifique back to template variables
    hypothese_1: hyps[0] ?? "",
    hypothese_2_intro: "",
    hypothese_2_a: "",
    hypothese_2_b: "",
    hypothese_3: hyps[1] ?? "",
    hypothese_4: hyps[2] ?? "",
    // Délais — from soumission (not editable in preview)
    delai_jours: soumission.delai_jours,
    validite_jours: parametres.validite_jours ?? 30,
    tva_pct: parametres.tva_pct ?? 19,
    // Budget — from lignes
    lignes_budget: lignes.map((l) => ({
      numero: l.numero,
      designation: l.designation,
      quantite: l.quantite,
      prix_unitaire: l.prix_unitaire,
    })),
    // Totaux — from soumission
    total_ht: soumission.total_ht,
    tva: soumission.tva,
    total_ttc: soumission.total_ttc,
    // Signataires — from parametres
    signataire_1_nom: parametres.signataire1_nom ?? "",
    signataire_1_titre: parametres.signataire1_titre ?? "",
    signataire_2_nom: parametres.signataire2_nom ?? "",
    signataire_2_titre: parametres.signataire2_titre ?? "",
  };
}

export function buildDocumentData(
  soumission: Soumission,
  client: Client,
  lignes: LigneBudget[],
  contexteData: ContexteData | null | undefined,
  parametres: Parametres,
  editablePreview?: EditablePreview
): DocumentData {
  // When editablePreview is provided, it takes full precedence over contexteData + client
  if (editablePreview) {
    return buildFromEditablePreview(editablePreview, soumission, lignes, parametres);
  }

  // Legacy path — used by [id] page exports that don't have editablePreview
  const data = contexteData ?? { section_1: "", section_1_1: "" };
  const paragraphes = data.section_1.split("\n").filter((p) => p.trim());
  const objectifs = data.section_1_1
    .split("\n")
    .filter((l) => l.trim().startsWith("-"))
    .map((l) => l.replace(/^-\s*/, "").trim());

  const titreLong =
    client.titre === "M." ? "Monsieur" :
    client.titre === "Mme" ? "Madame" :
    client.titre;

  return {
    titre: client.titre,
    titre_long: titreLong,
    nom_client: client.nom_contact,
    nom_client_majuscule: client.nom_contact.toUpperCase(),
    poste_client: client.poste,
    entreprise: client.entreprise,
    adresse: client.adresse,
    ville: client.ville,
    code_postal: "",
    numero_offre: soumission.numero_offre,
    date_offre: formatDateFr(soumission.date_offre),
    titre_projet: soumission.titre_projet,
    description_mission: soumission.titre_projet.toLowerCase(),
    contexte_paragraphe_1: paragraphes[0] ?? "",
    contexte_paragraphe_2: paragraphes[1] ?? "",
    objectif_1: objectifs[0] ?? "",
    objectif_2: objectifs[1] ?? "",
    objectif_3: objectifs[2] ?? "",
    objectif_4: objectifs[3] ?? "",
    ...getHypotheses(soumission.type_etude),
    delai_jours: soumission.delai_jours,
    validite_jours: parametres.validite_jours ?? 30,
    tva_pct: parametres.tva_pct ?? 19,
    lignes_budget: lignes.map((l) => ({
      numero: l.numero,
      designation: l.designation,
      quantite: l.quantite,
      prix_unitaire: l.prix_unitaire,
    })),
    total_ht: soumission.total_ht,
    tva: soumission.tva,
    total_ttc: soumission.total_ttc,
    signataire_1_nom: parametres.signataire1_nom ?? "",
    signataire_1_titre: parametres.signataire1_titre ?? "",
    signataire_2_nom: parametres.signataire2_nom ?? "",
    signataire_2_titre: parametres.signataire2_titre ?? "",
  };
}
