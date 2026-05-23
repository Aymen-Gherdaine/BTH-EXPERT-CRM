import type { EditablePreview, FormDataStep1, FormDataStep2, LigneBudget } from "@/types";
import type { SoumissionAIContent } from "@/lib/anthropic";

export function buildAIContent(preview: EditablePreview): SoumissionAIContent {
  const hyps = preview.hypothese_specifique
    .split("\n\n")
    .map((h) => h.trim())
    .filter(Boolean);
  return {
    contexte_paragraphe_1: preview.contexte_paragraphe_1,
    contexte_paragraphe_2: preview.contexte_paragraphe_2,
    objectif_1: preview.objectif_1,
    objectif_2: preview.objectif_2,
    objectif_3: preview.objectif_3,
    objectif_4: preview.objectif_4,
    livrable_1: preview.livrable_1,
    livrable_2: preview.livrable_2,
    livrable_3: preview.livrable_3,
    hypothese_1: hyps[0] ?? "",
    hypothese_2: hyps[1] ?? "",
    hypothese_3: hyps[2] ?? "",
    description_echeancier: preview.description_echeancier,
    inclusions_specifiques: preview.inclusions_specifiques,
    exclusions_specifiques: preview.exclusions_specifiques,
  };
}

export function initEditablePreview(
  step1: FormDataStep1,
  step2: FormDataStep2,
  ai: SoumissionAIContent,
  numeroOffre: string,
  lignes: LigneBudget[]
): EditablePreview {
  const today = new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const titreLong =
    step1.titre === "M."
      ? "Monsieur"
      : step1.titre === "Mme"
      ? "Madame"
      : step1.titre;
  return {
    titre: step1.titre,
    nom_contact: step1.nom_contact,
    poste_contact: step1.poste,
    entreprise: step1.entreprise,
    adresse: step1.adresse,
    ville: step1.ville,
    numero_offre: numeroOffre,
    date_offre: today,
    titre_projet: step2.titre_projet,
    intro_paragraphe: `${titreLong} ${step1.nom_contact},\n\nSarl BTH EXPERT a le plaisir de vous transmettre son offre de services professionnels relative au projet ${step2.titre_projet.toLowerCase()}.`,
    contexte_paragraphe_1: ai.contexte_paragraphe_1,
    contexte_paragraphe_2: ai.contexte_paragraphe_2,
    objectif_1: ai.objectif_1,
    objectif_2: ai.objectif_2,
    objectif_3: ai.objectif_3,
    objectif_4: ai.objectif_4,
    livrable_1: ai.livrable_1,
    livrable_2: ai.livrable_2,
    livrable_3: ai.livrable_3 ?? "",
    hypothese_specifique: [ai.hypothese_1, ai.hypothese_2, ai.hypothese_3]
      .filter(Boolean)
      .join("\n\n"),
    description_echeancier: ai.description_echeancier,
    inclusions_specifiques: ai.inclusions_specifiques,
    exclusions_specifiques: ai.exclusions_specifiques,
    lignes_budget: lignes.map((l) => ({ ...l })),
  };
}
