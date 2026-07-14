import { describe, it, expect } from "vitest";
import { prospectPatchSchema, depensePatchSchema } from "@/lib/schemas";
import { sanitizeSearchTerm } from "@/lib/search";

// Ces tests couvrent les régressions déjà attrapées (Kanban, justificatif,
// email vide) et la protection anti mass-assignment des whitelists PATCH.

describe("prospectPatchSchema", () => {
  it("accepte les champs du Kanban (etape, statut_global, raison_perte)", () => {
    expect(prospectPatchSchema.safeParse({ etape: "contact" }).success).toBe(true);
    expect(prospectPatchSchema.safeParse({ etape: "gagne", statut_global: "converti" }).success).toBe(true);
    expect(prospectPatchSchema.safeParse({ etape: "perdu", raison_perte: "prix trop élevé" }).success).toBe(true);
  });

  it("accepte un email vide et un email valide, refuse un email invalide", () => {
    expect(prospectPatchSchema.safeParse({ email: "" }).success).toBe(true);
    expect(prospectPatchSchema.safeParse({ email: "a@b.com" }).success).toBe(true);
    expect(prospectPatchSchema.safeParse({ email: "pas-un-email" }).success).toBe(false);
  });

  it("retire les champs non autorisés (anti mass-assignment)", () => {
    const res = prospectPatchSchema.safeParse({ entreprise: "ACME", created_by: "attacker-uuid" });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.entreprise).toBe("ACME");
      expect("created_by" in res.data).toBe(false);
    }
  });

  it("refuse un corps vide", () => {
    expect(prospectPatchSchema.safeParse({}).success).toBe(false);
  });
});

describe("depensePatchSchema", () => {
  it("accepte un justificatif sous forme de CHEMIN (pas une URL)", () => {
    expect(depensePatchSchema.safeParse({ justificatif_url: "user-id/dep-id.png" }).success).toBe(true);
  });

  it("valide le montant et la catégorie", () => {
    expect(depensePatchSchema.safeParse({ montant: 1500 }).success).toBe(true);
    expect(depensePatchSchema.safeParse({ montant: -5 }).success).toBe(false);
    expect(depensePatchSchema.safeParse({ categorie: "mission" }).success).toBe(true);
    expect(depensePatchSchema.safeParse({ categorie: "categorie_bidon" }).success).toBe(false);
  });

  it("accepte date_depense null (champ effacé)", () => {
    expect(depensePatchSchema.safeParse({ date_depense: null }).success).toBe(true);
  });

  it("retire employe_id (propriété non transférable)", () => {
    const res = depensePatchSchema.safeParse({ montant: 10, employe_id: "autre-uuid" });
    expect(res.success).toBe(true);
    if (res.success) expect("employe_id" in res.data).toBe(false);
  });

  it("refuse un corps vide", () => {
    expect(depensePatchSchema.safeParse({}).success).toBe(false);
  });
});

describe("sanitizeSearchTerm (anti-injection de filtre PostgREST)", () => {
  it("neutralise les caractères de syntaxe de filtre", () => {
    const out = sanitizeSearchTerm("acme,statut.eq.Acceptée)");
    for (const ch of [",", "(", ")", "*", "\\", "%"]) {
      expect(out.includes(ch)).toBe(false);
    }
  });

  it("préserve un terme de recherche normal", () => {
    expect(sanitizeSearchTerm("Construction Alger")).toBe("Construction Alger");
  });

  it("retire les % (le gabarit %q% est ajouté après)", () => {
    expect(sanitizeSearchTerm("100%")).toBe("100");
  });
});
