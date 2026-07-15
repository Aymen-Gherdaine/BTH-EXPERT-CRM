-- ============================================================
-- SÉCURITÉ — P0 : verrouiller l'écriture de `parametres`
-- ------------------------------------------------------------
-- Problème corrigé :
--   La policy UPDATE de `parametres` était `TO authenticated
--   USING(true) WITH CHECK(true)` → n'importe quel utilisateur connecté
--   (y compris un commercial) pouvait réécrire le nom de société, le
--   taux de TVA et les noms des signataires. Ces valeurs alimentent les
--   PDF générés (offres) → impact direct sur des documents officiels.
--
-- Correctif (même modèle que `profiles`, SEC-03) :
--   1) SELECT conservé pour tous les utilisateurs connectés (la page et
--      les exports lisent les paramètres).
--   2) AUCUNE policy INSERT/UPDATE/DELETE pour `authenticated` : la RLS
--      refuse donc toute écriture depuis le client navigateur.
--   3) La seule écriture légitime passe par la route /api/parametres,
--      gantée `admin`/`charge_projet` côté serveur et exécutée avec la
--      clé service-role (bypass RLS).
--
-- Robustesse : on supprime d'abord TOUTES les policies existantes de
--   `parametres` (quel que soit leur nom), puis on recrée uniquement la
--   policy SELECT. Idempotent.
-- ============================================================

ALTER TABLE public.parametres ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'parametres'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.parametres', pol.policyname);
  END LOOP;
END $$;

-- Lecture seule pour les utilisateurs connectés. Aucune écriture cliente :
-- la mise à jour passe par /api/parametres (service-role, ganté route).
CREATE POLICY "parametres_select" ON public.parametres
  FOR SELECT TO authenticated USING (true);
