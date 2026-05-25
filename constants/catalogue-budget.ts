export const GROUPES_ETUDE = [
  "Attestation de classification",
  "Étude d'impact sur l'environnement",
  "Étude de dangers",
  "Personnalisé",
] as const;

export type GroupeEtude = (typeof GROUPES_ETUDE)[number];

export const CATALOGUE_TACHES: Record<string, string[]> = {
  "Attestation de classification": [
    "Rencontre client, collecte et revue des informations, analyse détaillée de l'installation, analyse réglementaire au regard du décret exécutif n° 07-144, détermination du régime d'autorisation et préparation de la lettre de classification de l'installation.",
  ],
  "Étude d'impact sur l'environnement": [
    "Lancement du projet : réunion de démarrage, planification, liste des intrants requis et revue des informations client.",
    "Description détaillée du projet : unités de production + installations de support (QC/R&D, animalerie, STEP), flux matières/effluents/déchets/utilités.",
    "Veille réglementaire et cadrage des exigences de l'EIE (contenu attendu, seuils, format de dépôt).",
    "État initial — Bruit : préparation campagne, mesures terrain (jour/nuit selon contexte), traitement et interprétation.",
    "État initial : Eaux, air, sol, interprétation et compatibilité milieu récepteur.",
    "Évaluation des impacts (chantier + exploitation) : matrices, hiérarchisation, impacts spécifiques.",
    "Plan de gestion environnementale et sociale (PGE) + plan de gestion des déchets/effluents.",
    "Plan de suivi environnemental (indicateurs, fréquences, responsabilités, seuils d'alerte).",
    "Préparation des rapports provisoires et finaux : compilation EIE + annexes.",
  ],
  "Étude de dangers": [
    "Collecte et analyse des informations techniques et réglementaires de l'unité ; identification des sources de dangers ; analyse des scénarios accidentels crédibles ; évaluation qualitative des risques et des conséquences sur le personnel, l'environnement et le voisinage ; analyse des mesures de prévention/protection existantes et proposition de mesures complémentaires ; rédaction et remise du rapport final de l'étude de danger.",
  ],
};
