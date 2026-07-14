-- ============================================================
-- SÉCURITÉ — SEC-01 : restreindre les policies RLS à `authenticated`
-- ------------------------------------------------------------
-- Problème corrigé :
--   Les policies de clients / soumissions / lignes_budget étaient
--   `FOR <op> USING (true)` SANS clause `TO authenticated`. En
--   PostgreSQL, une policy sans rôle s'applique à PUBLIC — donc au
--   rôle `anon`, dont la clé (NEXT_PUBLIC_SUPABASE_ANON_KEY) est
--   publique. N'importe qui pouvait donc lire/écrire toute la base
--   via PostgREST sans être connecté.
--
-- Effet de cette migration :
--   Ajoute `TO authenticated` à chaque policy. Le comportement pour
--   les utilisateurs CONNECTÉS est identique (USING(true) conservé) ;
--   seul l'accès ANONYME est désormais bloqué. Aucune rupture pour
--   l'application (toutes ses requêtes passent par une session).
--
-- Idempotent : peut être ré-exécutée sans risque.
-- NB : le durcissement par rôle/propriété (écritures) sera traité
--      séparément (SEC-20) pour rester incrémental.
-- ============================================================

-- =====================
-- TABLE: clients
-- =====================
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clients_select" ON public.clients;
DROP POLICY IF EXISTS "clients_insert" ON public.clients;
DROP POLICY IF EXISTS "clients_update" ON public.clients;
DROP POLICY IF EXISTS "clients_delete" ON public.clients;

CREATE POLICY "clients_select" ON public.clients
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "clients_insert" ON public.clients
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "clients_update" ON public.clients
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "clients_delete" ON public.clients
  FOR DELETE TO authenticated USING (true);

-- =====================
-- TABLE: soumissions
-- =====================
ALTER TABLE public.soumissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "soumissions_select" ON public.soumissions;
DROP POLICY IF EXISTS "soumissions_insert" ON public.soumissions;
DROP POLICY IF EXISTS "soumissions_update" ON public.soumissions;
DROP POLICY IF EXISTS "soumissions_delete" ON public.soumissions;

CREATE POLICY "soumissions_select" ON public.soumissions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "soumissions_insert" ON public.soumissions
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "soumissions_update" ON public.soumissions
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "soumissions_delete" ON public.soumissions
  FOR DELETE TO authenticated USING (true);

-- =====================
-- TABLE: lignes_budget
-- =====================
ALTER TABLE public.lignes_budget ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lignes_budget_select" ON public.lignes_budget;
DROP POLICY IF EXISTS "lignes_budget_insert" ON public.lignes_budget;
DROP POLICY IF EXISTS "lignes_budget_update" ON public.lignes_budget;
DROP POLICY IF EXISTS "lignes_budget_delete" ON public.lignes_budget;

CREATE POLICY "lignes_budget_select" ON public.lignes_budget
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "lignes_budget_insert" ON public.lignes_budget
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "lignes_budget_update" ON public.lignes_budget
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "lignes_budget_delete" ON public.lignes_budget
  FOR DELETE TO authenticated USING (true);
