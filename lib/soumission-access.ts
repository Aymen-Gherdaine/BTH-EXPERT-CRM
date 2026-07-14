import type { UserRole } from "@/types";

// SEC-04 — Contrôle d'exposition des montants d'une soumission.
// Seuls admin / chargé de projet voient les montants. Le rôle commercial
// ne doit jamais les recevoir : l'UI les masque déjà, mais la charge utile
// (page SSR + réponse API) doit aussi être expurgée, sinon les montants
// restent lisibles dans le HTML / la réponse réseau.

export function canSeeSoumissionAmounts(role: UserRole | null | undefined): boolean {
  return role === "admin" || role === "charge_projet";
}

/**
 * Retire les champs monétaires d'une soumission (et de ses lignes budgétaires)
 * pour les rôles non autorisés. Renvoie l'objet inchangé pour admin / CP.
 * Générique et non destructif : construit un nouvel objet.
 */
export function redactSoumissionAmounts<T extends Record<string, unknown>>(
  soumission: T,
  role: UserRole | null | undefined
): T {
  if (canSeeSoumissionAmounts(role)) return soumission;

  const {
    total_ht,
    tva,
    total_ttc,
    versement_recu,
    lignes_budget,
    ...rest
  } = soumission as Record<string, unknown>;
  void total_ht;
  void tva;
  void total_ttc;
  void versement_recu;

  const redacted: Record<string, unknown> = { ...rest };

  if (Array.isArray(lignes_budget)) {
    redacted.lignes_budget = lignes_budget.map((ligne) => {
      const { prix_unitaire, ...ligneRest } = ligne as Record<string, unknown>;
      void prix_unitaire;
      return ligneRest;
    });
  } else if (lignes_budget !== undefined) {
    redacted.lignes_budget = lignes_budget;
  }

  return redacted as T;
}
