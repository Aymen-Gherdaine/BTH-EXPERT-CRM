import Anthropic from "@anthropic-ai/sdk";
import { FormDataStep1, FormDataStep2, TypeEtude } from "@/types";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `Tu es le rédacteur officiel de BTH Expert, bureau d'études environnemental en Algérie.
Tu génères uniquement le contenu variable des soumissions (20% du document).
Le reste du document est fixe et géré par le template.

━━━ STYLE RÉDACTIONNEL BTH EXPERT ━━━

Reproduis EXACTEMENT ce style — ni plus formel, ni moins formel.

PRINCIPES FONDAMENTAUX :
- Phrases affirmatives, directes, sans rhétorique commerciale
- Terminologie technique réglementaire algérienne précise
- Verbes au présent indicatif : "projette", "relève", "nécessite", "implique"
- Structure logique systématique : fait → enjeu → obligation réglementaire
- Jamais : "nous sommes ravis", "solution innovante", "approche globale",
  "dans ce cadre", "il convient de"
- Jamais de références réglementaires inventées

━━━ EXEMPLES RÉELS BTH EXPERT (reproduire ce style) ━━━

EXEMPLE CONTEXTE APPROUVÉ (AT PHARMA Phase II) :
Paragraphe 1 — Description factuelle :
"AT PHARMA projette la réalisation de la Phase II « Fill & Finish »,
correspondant à une installation pharmaceutique intégrée comprenant
plusieurs unités de production ainsi que des infrastructures de support,
notamment un laboratoire, une animalerie et une station de traitement
des eaux usées (STEP)."
→ Structure : [Client] projette [description installation] comprenant [composantes]

Paragraphe 2 — Enjeux réglementaires :
"Compte tenu de la nature des procédés mis en œuvre, des intrants utilisés,
des exigences élevées en maîtrise des risques sanitaires et environnementaux,
ainsi que de la gestion des effluents et des déchets générés, le projet relève
du cadre des installations classées."
→ Structure : Compte tenu de [enjeux techniques], le projet relève de [cadre réglementaire]

EXEMPLE OBJECTIFS APPROUVÉS (AT PHARMA Phase II) :
"Déterminer le régime d'assujettissement applicable (autorisation ministérielle,
wilaya ou APC) à partir de la classification réglementaire du projet."
"Réaliser l'EIE (incluant un état initial/état des lieux avec mesures terrain
de bruit) et identifier les impacts en phase chantier et exploitation."
"Réaliser l'EDD : inventaire des dangers, identification structurée (HAZID),
analyse des scénarios accidentels crédibles et recommandations de maîtrise des risques."
"Mettre à disposition des livrables complets, cohérents et conformes pour
permettre le dépôt de la demande d'autorisation et l'instruction du dossier."
→ Toujours commencer par un verbe infinitif
→ Ordre fixe : classification → EIE → EDD/étude → livrables/dépôt

EXEMPLE HYPOTHÈSES APPROUVÉES (AT PHARMA Phase II) :
"La classification de l'établissement au titre du décret exécutif n° 07-144
constitue l'étape préalable déterminante pour préciser le régime d'autorisation
(Ministère, Wilaya ou APC)."
"Les informations de base (capacités, procédés, intrants, plans d'implantation,
listes de produits, quantités stockées, principe de la STEP, etc.) seront
fournies par le client et réputées exactes."
"L'EIE inclut des mesures terrain et des analyses en laboratoire réalisées
par des tiers ; les délais d'exécution s'entendent hors délais d'instruction
administrative et hors délais des laboratoires."
→ Toujours 3 hypothèses minimum, 4 maximum
→ Ordre fixe : classification réglementaire → informations client → délais/tiers

EXEMPLE LIVRABLES APPROUVÉS (AT PHARMA Phase II — EIE+Dangers) :
"Attestation (lettre) de classification de l'établissement, incluant
l'identification des rubriques applicables et la détermination du régime
d'autorisation."
"Étude environnementale : Rapport d'étude d'Impact sur l'Environnement (EIE)"
"Étude de risques : Rapport d'étude de Dangers"

EXEMPLE INCLUSIONS APPROUVÉES :
"La collecte et revue des informations disponibles auprès du client
(réunions de lancement et suivi)."
"La veille réglementaire nécessaire à la conformité des livrables."
"La rédaction, compilation et remise des rapports et documents finaux
(un CD format électronique et/ou une copie papier selon besoin)."
"Un échange technique (commentaires/ajustements) par livrable avant émission finale."

EXEMPLE EXCLUSIONS APPROUVÉES :
"Les analyses des eaux (rejets, eaux usées, eaux pluviales, etc.)
effectuées en laboratoire (coûts et délais d'un tiers)."
"La production ou mise à jour des plans d'architecture/implantation
détaillés et documents d'ingénierie (plans, coupes, réseaux, etc.)."
"Modélisations (dispersion atmosphérique, hydraulique, panache toxique)
non incluses dans le périmètre de base."
"Tout service additionnel non explicitement mentionné dans les livrables."

━━━ ADAPTATION PAR SECTEUR ━━━

Adapte UNIQUEMENT les détails techniques, jamais le style ni la structure.

Pharma : effluents API/CIP-SIP, déchets biologiques, confinement,
  installations classées, GMP, STEP pharmaceutique
Agroalimentaire : rejets organiques, DCO/DBO, STEP, nuisances olfactives,
  gestion déchets solides, hygiène alimentaire
Cimenterie/BTP : émissions atmosphériques, poussières, bruit,
  carrières, eaux de ruissellement
Chimie/pétrochimie : substances dangereuses, risques majeurs,
  plan d'urgence, POI/PPI, sécurité industrielle
Autre industrie : approche EIE standard conforme décret 07-144

━━━ RÈGLES ABSOLUES ━━━
- Ne jamais inventer de références réglementaires
- Ne jamais utiliser d'autres décrets que ceux listés ci-dessous
- Longueur sobre : contexte 2-3 phrases par paragraphe maximum
- Les livrables correspondent EXACTEMENT au type d'étude demandé

RÉFÉRENCES AUTORISÉES UNIQUEMENT :
- Décret exécutif 07-144 du 19 mai 2007 (études d'impact)
- Loi 03-10 du 19 juillet 2003 (protection environnement)
- Décret exécutif 06-198 du 31 mai 2006 (installations classées)
- Décret exécutif 90-198 du 23 juin 1990 (substances explosives)`;

function getTypeEtudeLabel(type: TypeEtude): string {
  const labels: Record<TypeEtude, string> = {
    "EIE+Dangers": "Étude d'Impact sur l'Environnement (EIE) accompagnée d'une Étude de Dangers",
    "Notice+ProduitsDangereux": "Notice d'Impact environnemental accompagnée d'un Rapport sur les produits dangereux",
    "Audit": "Audit environnemental",
    "Audit+RapportProduits": "Audit environnemental et Rapport sur les produits dangereux",
    "Autre": "Étude environnementale réglementaire",
  };
  return labels[type];
}

function getLivrablesParType(type: TypeEtude): string {
  const livrables: Record<TypeEtude, string> = {
    "EIE+Dangers": `Génère 3 livrables :
      L1 : Attestation de classification (lettre) incluant identification rubriques et régime autorisation
      L2 : Rapport d'étude d'Impact sur l'Environnement (EIE)
      L3 : Rapport d'étude de Dangers (EDD)`,
    "Notice+ProduitsDangereux": `Génère 2 livrables :
      L1 : Notice d'Impact sur l'Environnement
      L2 : Rapport sur les produits dangereux`,
    "Audit": `Génère 1-2 livrables :
      L1 : Rapport d'audit environnemental
      L2 : Plan d'actions correctives (si applicable au contexte)`,
    "Audit+RapportProduits": `Génère 2 livrables :
      L1 : Rapport d'audit environnemental
      L2 : Rapport sur les produits dangereux`,
    "Autre": `Génère 2 livrables adaptés au projet décrit`,
  };
  return livrables[type];
}

export type SoumissionAIContent = {
  contexte_paragraphe_1: string
  contexte_paragraphe_2: string
  objectif_1: string
  objectif_2: string
  objectif_3: string
  objectif_4: string
  livrable_1: string
  livrable_2: string
  livrable_3: string
  hypothese_1: string
  hypothese_2: string
  hypothese_3: string
  description_echeancier: string
  inclusions_specifiques: string
  exclusions_specifiques: string
}

export async function generateSoumissionContent(
  step1: FormDataStep1,
  step2: FormDataStep2
): Promise<SoumissionAIContent> {
  const prompt = `Génère le contenu variable pour une soumission BTH Expert.
Reproduis exactement le style des exemples fournis dans tes instructions.

CLIENT :
- Entreprise : ${step1.entreprise}
- Contact : ${step1.titre} ${step1.nom_contact}, ${step1.poste}
- Ville : ${step1.ville}

PROJET :
- Titre : ${step2.titre_projet}
- Secteur : ${step2.secteur_activite}
- Description : ${step2.description_projet}
- Type d'étude : ${getTypeEtudeLabel(step2.type_etude)}
- Délai d'exécution : ${step2.delai_jours} jours

LIVRABLES ATTENDUS SELON LE TYPE D'ÉTUDE :
${getLivrablesParType(step2.type_etude)}

FORMAT JSON STRICT — aucun texte avant ou après, aucun markdown :
{
  "contexte_paragraphe_1": "Description factuelle du projet. Structure : [Client] projette [installation] comprenant [composantes]. 2-3 phrases maximum.",
  "contexte_paragraphe_2": "Enjeux environnementaux et obligation réglementaire. Structure : Compte tenu de [enjeux], le projet relève de [cadre réglementaire]. 2 phrases maximum.",
  "objectif_1": "Déterminer le régime d'assujettissement applicable... (adapter au secteur)",
  "objectif_2": "Réaliser [étude principale]... (selon type d'étude)",
  "objectif_3": "Réaliser [deuxième étude si applicable] ou Proposer des mesures...",
  "objectif_4": "Mettre à disposition des livrables complets, cohérents et conformes pour permettre le dépôt de la demande d'autorisation et l'instruction du dossier.",
  "livrable_1": "Premier livrable exact selon type d'étude",
  "livrable_2": "Deuxième livrable exact selon type d'étude",
  "livrable_3": "Troisième livrable si applicable, sinon chaîne vide",
  "hypothese_1": "La classification de l'établissement au titre du décret exécutif n° 07-144 constitue l'étape préalable déterminante pour préciser le régime d'autorisation (Ministère, Wilaya ou APC).",
  "hypothese_2": "Les informations de base ([liste adaptée au secteur]) seront fournies par le client et réputées exactes.",
  "hypothese_3": "[Hypothèse sur délais/tiers adaptée au type d'étude]",
  "description_echeancier": "Le délai global d'exécution est de [délai en lettres] (${step2.delai_jours}) jours à compter de la réception de la commande et du paiement de l'avance. Ce délai couvre la préparation et la remise des livrables prévus au mandat, sous réserve de la disponibilité des informations et accès nécessaires.",
  "inclusions_specifiques": "Liste 4 inclusions séparées par \\n — basées sur l'exemple BTH Expert approuvé, adapter uniquement si nécessaire au type d'étude",
  "exclusions_specifiques": "Liste 4-5 exclusions séparées par \\n — basées sur l'exemple BTH Expert approuvé, adapter au secteur"
}`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Réponse IA invalide");

  const text = content.text.trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Format JSON invalide dans la réponse IA");

  const parsed = JSON.parse(jsonMatch[0]);
  return parsed as SoumissionAIContent;
}
