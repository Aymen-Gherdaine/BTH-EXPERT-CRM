// ============================================================
// Modèle de rôles — SOURCE UNIQUE DE VÉRITÉ
// ------------------------------------------------------------
// Fonctions pures (testables) décrivant qui peut faire quoi. Utilisées
// par les routes API et l'UI pour ne jamais dupliquer la logique de rôle.
//
// Rôles : "admin", "charge_projet" (Expert), "commercial".
//
// Matrice :
//   Capacité                         | admin | expert | commercial
//   ---------------------------------|-------|--------|-----------
//   Voir les montants (soumissions)  |  ✓    |   ✓    |    ✓
//   Créer une soumission             |  ✓    |   ✗    |    ✗
//   Modifier/supprimer soumission    |  ✓    |   ✓    |    ✗
//   Supprimer un client (cascade)    |  ✓    |   ✗    |    ✗
//   Ajouter/modifier un client       |  ✓    |   ✓    |    ✓
//   Prospection (prospects/visites)  |  ✓    |   ✗    |    ✓
//   Modifier/supprimer une dépense   |  ✓    | owner  |  owner
//   Coûts & Marges / stats dépenses  |  ✓    |   ✗    |    ✗
//   Gérer les utilisateurs           |  ✓    |   ✗    |    ✗
// ============================================================

export type Role = string | null | undefined;

const isAdmin = (r: Role): boolean => r === "admin";
const isExpert = (r: Role): boolean => r === "charge_projet";
const isCommercial = (r: Role): boolean => r === "commercial";

/** Admin ou Expert : gérer une soumission (statut, versement, lignes, suppression). */
export const canManageSoumissions = (role: Role): boolean => isAdmin(role) || isExpert(role);

/** Seul l'admin crée une soumission via le formulaire. */
export const canCreateSoumission = (role: Role): boolean => isAdmin(role);

/** Montants des soumissions : visibles par tous les rôles connectés. */
export const canSeeSoumissionAmounts = (): boolean => true;

/** Suppression d'un client (cascade sur les soumissions) : admin uniquement. */
export const canDeleteClient = (role: Role): boolean => isAdmin(role);

/** Ajout / modification d'un client : tout rôle connecté. */
export const canEditClient = (role: Role): boolean =>
  isAdmin(role) || isExpert(role) || isCommercial(role);

/** Prospection (prospects + visites) : admin + commercial (Expert exclu). */
export const canAccessProspection = (role: Role): boolean => isAdmin(role) || isCommercial(role);

/** Coûts & Marges + stats/export dépenses : admin uniquement. */
export const canSeeCoutsMarges = (role: Role): boolean => isAdmin(role);

/** Modifier / supprimer une dépense : le propriétaire ou l'admin. */
export const canModifyDepense = (role: Role, isOwner: boolean): boolean => isAdmin(role) || isOwner;

/** Gestion des utilisateurs : admin uniquement. */
export const canManageUsers = (role: Role): boolean => isAdmin(role);
