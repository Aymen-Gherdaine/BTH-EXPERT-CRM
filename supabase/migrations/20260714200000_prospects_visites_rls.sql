-- ============================================================
-- SÉCURITÉ — RLS sur `prospects` et `visites`
-- ------------------------------------------------------------
-- Ces tables n'avaient aucune policy versionnée. Si la RLS est
-- désactivée, elles sont accessibles au rôle `anon` (clé publique) —
-- même faille que SEC-01. On active la RLS et on autorise uniquement
-- les utilisateurs CONNECTÉS.
--
-- Le filtrage fin par rôle (admin + commercial uniquement, l'Expert est
-- exclu) est appliqué au niveau applicatif dans les routes API
-- (/api/prospects, /api/visites). Ici, l'objectif RLS est de fermer
-- l'accès anonyme et de garder un modèle « pool partagé » entre
-- utilisateurs connectés. Idempotent.
-- ============================================================

ALTER TABLE public.prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visites ENABLE ROW LEVEL SECURITY;

-- Nettoyage robuste (dérive de nommage possible)
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT tablename, policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename IN ('prospects', 'visites')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

CREATE POLICY "prospects_authenticated" ON public.prospects
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "visites_authenticated" ON public.visites
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
