import { Client, EditablePreview, LigneBudget, Soumission, TypeEtude } from "@/types";
import { DocumentData, nombreEnLettres } from "@/lib/generate-document";
import { formatDateFr, formatMontant } from "@/lib/utils";
import { sanitizeAiText } from "@/lib/sanitize-ai-text";

type ContexteData = { section_1: string; section_1_1: string };

export type Parametres = {
  signataire1_nom?: string | null;
  signataire1_titre?: string | null;
  signataire2_nom?: string | null;
  signataire2_titre?: string | null;
  tva_pct?: number | null;
  validite_jours?: number | null;
  modalites_paiement?: string | null;
};

// Derived types for structural compatibility with non-exported interfaces in generate-document
type ListItem = DocumentData["objectifs_items"][0];
type BudgetLigneDoc = DocumentData["groupes_budget"][0]["lignes"][0];
type BudgetGroupeDoc = DocumentData["groupes_budget"][0];

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
      h1, h2_intro,
      h2_a: "Étude d'Impact sur l'Environnement (EIE)",
      h2_b: "Étude de Dangers",
      h3, h4,
    };
  }
  if (type === "Notice+ProduitsDangereux") {
    return {
      h1, h2_intro,
      h2_a: "Notice d'Impact / Audit environnemental",
      h2_b: "Rapport sur les produits dangereux",
      h3, h4,
    };
  }
  return {
    h1, h2_intro,
    h2_a: "Étude environnementale adaptée selon le régime d'autorisation",
    h2_b: "Rapport réglementaire complémentaire selon les exigences applicables",
    h3, h4,
  };
}

function buildBudgetGroups(lignes: LigneBudget[]): BudgetGroupeDoc[] {
  const groupMap = new Map<string, LigneBudget[]>();
  for (const ligne of lignes) {
    const key = ligne.groupe || "Mission";
    if (!groupMap.has(key)) groupMap.set(key, []);
    groupMap.get(key)!.push(ligne);
  }

  return Array.from(groupMap.entries()).map(([titre, lines]) => {
    const sous_total = lines.reduce((s, l) => s + l.quantite * l.prix_unitaire, 0);
    return {
      titre_groupe: `Tableau — Devis ${titre}`,
      lignes: lines.map((l) => ({
        numero: l.numero,
        designation: sanitizeAiText(l.designation),
        quantite: l.quantite,
        prix_formate: formatMontant(l.prix_unitaire),
      })),
      sous_total_formate: formatMontant(sous_total),
    };
  });
}

function buildFromEditablePreview(
  preview: EditablePreview,
  soumission: Soumission,
  lignes_param: LigneBudget[],
  parametres: Parametres
): DocumentData {
  const s = sanitizeAiText;

  const toItems = (...strs: (string | null | undefined)[]): ListItem[] =>
    strs.filter(Boolean).map((item) => ({ item: s(item!) }));

  const splitToItems = (text: string | null | undefined): ListItem[] =>
    (text ?? "")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((item) => ({ item: s(item) }));

  const titreLong =
    preview.titre === "M." ? "Monsieur" :
    preview.titre === "Mme" ? "Madame" :
    preview.titre;
  const salutation = `${titreLong} ${s(preview.nom_contact)}`;
  const salutation_fin = titreLong;

  const callout_objectif = s(
    preview.callout_objectif ?? preview.contexte_paragraphe_2 ?? ""
  );

  const objectifs_items = toItems(
    preview.objectif_1, preview.objectif_2, preview.objectif_3, preview.objectif_4
  );
  const livrables_items = toItems(
    preview.livrable_1, preview.livrable_2, preview.livrable_3
  );
  const hypotheses_items = splitToItems(preview.hypothese_specifique);
  const inclusions_items = splitToItems(preview.inclusions_specifiques);
  const exclusions_items = splitToItems(preview.exclusions_specifiques);
  const perimetre_items: ListItem[] = [];

  const src = preview.lignes_budget?.length ? preview.lignes_budget : lignes_param;
  const total_ht = src.reduce((sum, l) => sum + l.quantite * l.prix_unitaire, 0);
  const groupes_budget = buildBudgetGroups(src);
  const recap_lignes: BudgetLigneDoc[] = groupes_budget.map((g, i) => ({
    numero: i + 1,
    designation: g.titre_groupe.replace(/^Tableau\s*—\s*Devis\s*/i, ""),
    quantite: 1,
    prix_formate: g.sous_total_formate,
  }));
  const tva_rate = (parametres.tva_pct ?? 19) / 100;
  const tva_amt = total_ht * tva_rate;
  const total_ttc = total_ht + tva_amt;

  const validite_jours = parametres.validite_jours ?? 30;

  return {
    titre: preview.titre,
    nom_client: s(preview.nom_contact),
    poste_client: s(preview.poste_contact),
    entreprise: s(preview.entreprise),
    adresse: s(preview.adresse),
    ville: s(preview.ville),
    numero_offre: preview.numero_offre,
    date_offre: preview.date_offre,
    objet_ligne1: s(preview.titre_projet),
    salutation,
    salutation_fin,
    intro_paragraphe: s(preview.intro_paragraphe),
    contexte_paragraphe_1: s(preview.contexte_paragraphe_1),
    contexte_paragraphe_2: s(preview.contexte_paragraphe_2),
    callout_objectif,
    perimetre_items,
    objectifs_items,
    hypotheses_items,
    livrables_items,
    inclusions_items,
    exclusions_items,
    description_echeancier: s(preview.description_echeancier),
    groupes_budget,
    recap_lignes,
    total_ht_formate: formatMontant(total_ht),
    tva_pct: parametres.tva_pct ?? 19,
    tva_formate: formatMontant(tva_amt),
    total_ttc_formate: formatMontant(total_ttc),
    modalites_paiement: s(parametres.modalites_paiement ?? ""),
    validite_jours,
    validite_jours_lettres: nombreEnLettres(validite_jours),
    signataire_1_nom: s(parametres.signataire1_nom ?? ""),
    signataire_1_titre: s(parametres.signataire1_titre ?? ""),
    signataire_2_nom: s(parametres.signataire2_nom ?? ""),
    signataire_2_titre: s(parametres.signataire2_titre ?? ""),
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
  const salutation = `${titreLong} ${sanitizeAiText(client.nom_contact)}`;
  const salutation_fin = titreLong;

  const hyps = getHypotheses(soumission.type_etude);
  const hypotheses_items: ListItem[] = [
    hyps.h1,
    `${hyps.h2_intro} ${hyps.h2_a} / ${hyps.h2_b}`,
    hyps.h3,
    hyps.h4,
  ]
    .filter(Boolean)
    .map((item) => ({ item: sanitizeAiText(item) }));

  const objectifs_items: ListItem[] = objectifs
    .filter(Boolean)
    .map((item) => ({ item: sanitizeAiText(item) }));

  const total_ht = soumission.total_ht;
  const groupes_budget = buildBudgetGroups(lignes);
  const recap_lignes: BudgetLigneDoc[] = groupes_budget.map((g, i) => ({
    numero: i + 1,
    designation: g.titre_groupe.replace(/^Tableau\s*—\s*Devis\s*/i, ""),
    quantite: 1,
    prix_formate: g.sous_total_formate,
  }));
  const tva_amt = soumission.tva;
  const total_ttc = soumission.total_ttc;

  const validite_jours = parametres.validite_jours ?? 30;

  return {
    titre: client.titre,
    nom_client: sanitizeAiText(client.nom_contact),
    poste_client: sanitizeAiText(client.poste),
    entreprise: sanitizeAiText(client.entreprise),
    adresse: sanitizeAiText(client.adresse),
    ville: sanitizeAiText(client.ville),
    numero_offre: soumission.numero_offre,
    date_offre: formatDateFr(soumission.date_offre),
    objet_ligne1: sanitizeAiText(soumission.titre_projet),
    salutation,
    salutation_fin,
    intro_paragraphe: "",
    contexte_paragraphe_1: sanitizeAiText(paragraphes[0] ?? ""),
    contexte_paragraphe_2: sanitizeAiText(paragraphes[1] ?? ""),
    callout_objectif: sanitizeAiText(paragraphes[1] ?? ""),
    perimetre_items: [],
    objectifs_items,
    hypotheses_items,
    livrables_items: [],
    inclusions_items: [],
    exclusions_items: [],
    description_echeancier: "",
    groupes_budget,
    recap_lignes,
    total_ht_formate: formatMontant(total_ht),
    tva_pct: parametres.tva_pct ?? 19,
    tva_formate: formatMontant(tva_amt),
    total_ttc_formate: formatMontant(total_ttc),
    modalites_paiement: sanitizeAiText(parametres.modalites_paiement ?? ""),
    validite_jours,
    validite_jours_lettres: nombreEnLettres(validite_jours),
    signataire_1_nom: sanitizeAiText(parametres.signataire1_nom ?? ""),
    signataire_1_titre: sanitizeAiText(parametres.signataire1_titre ?? ""),
    signataire_2_nom: sanitizeAiText(parametres.signataire2_nom ?? ""),
    signataire_2_titre: sanitizeAiText(parametres.signataire2_titre ?? ""),
  };
}
