import { describe, it, expect } from "vitest";
import {
  canManageSoumissions,
  canCreateSoumission,
  canSeeSoumissionAmounts,
  canDeleteClient,
  canEditClient,
  canAccessProspection,
  canSeeCoutsMarges,
  canModifyDepense,
  canManageUsers,
} from "@/lib/permissions";

// Matrice de référence du modèle de rôles. Ces tests verrouillent qui peut
// faire quoi : toute modification involontaire d'un prédicat casse un test.

const ADMIN = "admin";
const EXPERT = "charge_projet";
const COMMERCIAL = "commercial";
const UNKNOWN = "autre_role";

describe("canManageSoumissions (modifier/supprimer/statut/versement)", () => {
  it("autorise admin et expert", () => {
    expect(canManageSoumissions(ADMIN)).toBe(true);
    expect(canManageSoumissions(EXPERT)).toBe(true);
  });
  it("refuse commercial, rôle inconnu, null/undefined", () => {
    expect(canManageSoumissions(COMMERCIAL)).toBe(false);
    expect(canManageSoumissions(UNKNOWN)).toBe(false);
    expect(canManageSoumissions(null)).toBe(false);
    expect(canManageSoumissions(undefined)).toBe(false);
  });
});

describe("canCreateSoumission (créer via formulaire)", () => {
  it("admin uniquement", () => {
    expect(canCreateSoumission(ADMIN)).toBe(true);
    expect(canCreateSoumission(EXPERT)).toBe(false);
    expect(canCreateSoumission(COMMERCIAL)).toBe(false);
    expect(canCreateSoumission(null)).toBe(false);
  });
});

describe("canSeeSoumissionAmounts (voir les montants)", () => {
  it("visible par tous les rôles", () => {
    expect(canSeeSoumissionAmounts()).toBe(true);
  });
});

describe("canDeleteClient (suppression cascade)", () => {
  it("admin uniquement", () => {
    expect(canDeleteClient(ADMIN)).toBe(true);
    expect(canDeleteClient(EXPERT)).toBe(false);
    expect(canDeleteClient(COMMERCIAL)).toBe(false);
    expect(canDeleteClient(undefined)).toBe(false);
  });
});

describe("canEditClient (ajouter/modifier)", () => {
  it("tout rôle connu", () => {
    expect(canEditClient(ADMIN)).toBe(true);
    expect(canEditClient(EXPERT)).toBe(true);
    expect(canEditClient(COMMERCIAL)).toBe(true);
  });
  it("refuse rôle inconnu / non connecté", () => {
    expect(canEditClient(UNKNOWN)).toBe(false);
    expect(canEditClient(null)).toBe(false);
    expect(canEditClient(undefined)).toBe(false);
  });
});

describe("canAccessProspection (prospects + visites)", () => {
  it("admin et commercial ; expert exclu", () => {
    expect(canAccessProspection(ADMIN)).toBe(true);
    expect(canAccessProspection(COMMERCIAL)).toBe(true);
    expect(canAccessProspection(EXPERT)).toBe(false);
    expect(canAccessProspection(null)).toBe(false);
  });
});

describe("canSeeCoutsMarges (coûts & marges + stats/export dépenses)", () => {
  it("admin uniquement", () => {
    expect(canSeeCoutsMarges(ADMIN)).toBe(true);
    expect(canSeeCoutsMarges(EXPERT)).toBe(false);
    expect(canSeeCoutsMarges(COMMERCIAL)).toBe(false);
  });
});

describe("canModifyDepense (modifier/supprimer une dépense)", () => {
  it("admin peut modifier toute dépense", () => {
    expect(canModifyDepense(ADMIN, false)).toBe(true);
    expect(canModifyDepense(ADMIN, true)).toBe(true);
  });
  it("expert/commercial : seulement les leurs", () => {
    expect(canModifyDepense(EXPERT, true)).toBe(true);
    expect(canModifyDepense(EXPERT, false)).toBe(false);
    expect(canModifyDepense(COMMERCIAL, true)).toBe(true);
    expect(canModifyDepense(COMMERCIAL, false)).toBe(false);
  });
  it("non-propriétaire non-admin refusé", () => {
    expect(canModifyDepense(null, false)).toBe(false);
  });
});

describe("canManageUsers (gestion des utilisateurs)", () => {
  it("admin uniquement", () => {
    expect(canManageUsers(ADMIN)).toBe(true);
    expect(canManageUsers(EXPERT)).toBe(false);
    expect(canManageUsers(COMMERCIAL)).toBe(false);
    expect(canManageUsers(undefined)).toBe(false);
  });
});
