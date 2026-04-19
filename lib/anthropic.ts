import Anthropic from "@anthropic-ai/sdk";
import { FormDataStep1, FormDataStep2, TypeEtude } from "@/types";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `Tu es un expert rédacteur pour BTH Expert, bureau d'études environnemental en Algérie.
Tu rédiges des soumissions professionnelles en français formel, avec un vocabulaire réglementaire algérien exact.

Références réglementaires autorisées uniquement :
- Décret exécutif 07-144 du 19 mai 2007 relatif aux études d'impact sur l'environnement
- Loi 03-10 du 19 juillet 2003 relative à la protection de l'environnement dans le cadre du développement durable
- Décret exécutif 06-198 du 31 mai 2006 relatif aux installations classées pour la protection de l'environnement
- Décret exécutif 90-198 du 23 juin 1990 réglementant les substances explosives

RÈGLES ABSOLUES :
- Ne jamais inventer de références réglementaires
- Style formel, professionnel, sobre
- Utiliser uniquement les références listées ci-dessus si pertinentes
- Pas de formules creuses ni de remplissage
- Longueur adaptée : section 1 (2-3 paragraphes), section 1.1 (liste de 4 points max)`;

function getTypeEtudeLabel(type: TypeEtude): string {
  const labels: Record<TypeEtude, string> = {
    "EIE+Dangers": "Étude d'Impact sur l'Environnement (EIE) accompagnée d'une Étude de Dangers",
    "Notice+ProduitsDangereux": "Notice d'Impact environnemental accompagnée d'un Rapport sur les produits dangereux",
    "Audit": "Audit environnemental",
    "Autre": "Étude environnementale réglementaire",
  };
  return labels[type];
}

export async function generateContexte(
  step1: FormDataStep1,
  step2: FormDataStep2
): Promise<string> {
  const prompt = `Génère les sections 1 (Contexte et objectifs) et 1.1 (Objectifs du projet) pour une soumission BTH Expert.

CLIENT :
- Entreprise : ${step1.entreprise}
- Contact : ${step1.titre} ${step1.nom_contact}, ${step1.poste}
- Ville : ${step1.ville}

PROJET :
- Titre : ${step2.titre_projet}
- Secteur d'activité : ${step2.secteur_activite}
- Description : ${step2.description_projet}
- Type d'étude : ${getTypeEtudeLabel(step2.type_etude)}
- Délai d'exécution : ${step2.delai_jours} jours

FORMAT DE RÉPONSE (JSON strict) :
{
  "section_1": "Texte de la section 1 Contexte et objectifs (2-3 paragraphes)",
  "section_1_1": "Texte de la section 1.1 Objectifs du projet (liste à puces, 4 points max, format markdown avec - pour chaque point)"
}`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Réponse IA invalide");

  const text = content.text.trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Format JSON invalide dans la réponse IA");

  return jsonMatch[0];
}
