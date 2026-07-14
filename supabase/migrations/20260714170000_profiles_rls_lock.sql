-- ============================================================
-- SÉCURITÉ — SEC-03 : verrouiller la table `profiles`
-- ------------------------------------------------------------
-- Problème corrigé :
--   `profiles` porte la colonne `role` (socle de toute l'autorisation).
--   Si une policy d'écriture permissive (ex. USING(true)/WITH CHECK(true))
--   existe pour le rôle authenticated, n'importe quel utilisateur peut
--   faire  update({ role: 'admin' })  sur sa propre ligne et s'auto-
--   promouvoir administrateur.
--
-- Correctif :
--   1) RLS activée.
--   2) SELECT autorisé aux utilisateurs connectés (nécessaire aux
--      vérifications de rôle côté serveur) — jamais à `anon`.
--   3) AUCUNE policy INSERT/UPDATE/DELETE pour `authenticated` :
--      la RLS refuse donc toute écriture depuis le client. Les seules
--      écritures légitimes (invitation, changement de rôle, désactivation)
--      passent par le client service-role, qui contourne la RLS et reste
--      strictement ganté par une vérification `role = 'admin'` côté route.
--
-- Robustesse : on supprime d'abord TOUTES les policies existantes de
--   `profiles` (quel que soit leur nom, la table n'étant pas versionnée),
--   puis on recrée uniquement la policy SELECT voulue. Idempotent.
-- ============================================================

-- Colonne is_active (référencée par l'app, idempotent)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Supprimer toutes les policies existantes (dérive de schéma possible)
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
  END LOOP;
END $$;

-- Lecture seule pour les utilisateurs connectés. Aucune écriture cliente :
-- les mutations admin utilisent la clé service-role (bypass RLS, ganté route).
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT TO authenticated USING (true);
