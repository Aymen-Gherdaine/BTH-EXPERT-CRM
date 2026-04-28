import { Client, LigneBudget, Soumission, TypeEtude } from "@/types";
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

export function buildDocumentData(
  soumission: Soumission,
  client: Client,
  lignes: LigneBudget[],
  contexteData: ContexteData,
  parametres: Parametres
): DocumentData {
  const paragraphes = contexteData.section_1.split("\n").filter((p) => p.trim());
  const objectifs = contexteData.section_1_1
    .split("\n")
    .filter((l) => l.trim().startsWith("-"))
    .map((l) => l.replace(/^-\s*/, "").trim());

  return {
    // Client
    titre: client.titre,
    nom_client: client.nom_contact,
    nom_client_majuscule: client.nom_contact.toUpperCase(),
    poste_client: client.poste,
    entreprise: client.entreprise,
    adresse: client.adresse,
    ville: client.ville,
    code_postal: "",
    // Offre
    numero_offre: soumission.numero_offre,
    date_offre: formatDateFr(soumission.date_offre),
    // Projet
    titre_projet: soumission.titre_projet,
    description_mission: `Sarl BTH EXPERT a le plaisir de vous transmettre son offre de services professionnels relative au projet ${soumission.titre_projet.toLowerCase()}.`,
    contexte_paragraphe_1: paragraphes[0] ?? "",
    contexte_paragraphe_2: paragraphes[1] ?? "",
    // Objectifs
    objectif_1: objectifs[0] ?? "",
    objectif_2: objectifs[1] ?? "",
    objectif_3: objectifs[2] ?? "",
    objectif_4: objectifs[3] ?? "",
    // Hypothèses
    ...getHypotheses(soumission.type_etude),
    // Délais
    delai_jours: soumission.delai_jours,
    validite_jours: parametres.validite_jours ?? 30,
    tva_pct: parametres.tva_pct ?? 19,
    // Budget
    lignes_budget: lignes.map((l) => ({
      numero: l.numero,
      designation: l.designation,
      quantite: l.quantite,
      prix_unitaire: l.prix_unitaire,
    })),
    // Totaux
    total_ht: soumission.total_ht,
    tva: soumission.tva,
    total_ttc: soumission.total_ttc,
    // Signataires
    signataire_1_nom: parametres.signataire1_nom ?? "",
    signataire_1_titre: parametres.signataire1_titre ?? "",
    signataire_2_nom: parametres.signataire2_nom ?? "",
    signataire_2_titre: parametres.signataire2_titre ?? "",
  };
}
