-- Index sur les clés étrangères de la table depenses.
-- Postgres n'indexe PAS automatiquement les colonnes de clé étrangère. Sans ces
-- index, les filtres/jointures font un scan séquentiel à volume croissant :
--   - employe_id : utilisé par TOUTES les policies RLS (employe_id = auth.uid())
--     et à chaque lecture des dépenses d'un employé.
--   - projet_lie : jointure/filtre vers les soumissions liées.

CREATE INDEX IF NOT EXISTS idx_depenses_employe    ON public.depenses(employe_id);
CREATE INDEX IF NOT EXISTS idx_depenses_projet_lie ON public.depenses(projet_lie);
