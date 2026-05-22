export interface Parametres {
  nom_societe: string;
  adresse: string;
  ville: string;
  email_contact: string;
  telephone: string;
  site_web: string;
  signataire1_nom: string;
  signataire1_titre: string;
  signataire2_nom: string;
  signataire2_titre: string;
  tva_pct: number;
  delai_jours: number;
  validite_jours: number;
  modalites_paiement: string;
  signature_responsable_url: string;
  signature_autorise_url: string;
}

export const DEFAULTS: Parametres = {
  nom_societe: "BTH Expert",
  adresse: "",
  ville: "",
  email_contact: "",
  telephone: "",
  site_web: "",
  signataire1_nom: "Hakim Belghouini",
  signataire1_titre: "Expert Co-gérant",
  signataire2_nom: "Amine Lahmer",
  signataire2_titre: "Expert Gérant",
  tva_pct: 19,
  delai_jours: 45,
  validite_jours: 30,
  modalites_paiement: "50% à l'acceptation, 50% à la remise des livrables",
  signature_responsable_url: "",
  signature_autorise_url: "",
};
