-- ============================================================
-- Dépenses — lecture partagée par tous les rôles
-- ------------------------------------------------------------
-- Décision produit : tout utilisateur connecté peut VOIR toutes les
-- dépenses (pour connaître le total dépensé par projet). La création
-- reste attribuée à son auteur (employe_id fixé serveur) et la
-- modification/suppression reste réservée au propriétaire ou à l'admin
-- (contrôle applicatif `resolveAccess` + policies d'écriture existantes).
--
-- On AJOUTE une policy SELECT permissive `TO authenticated`. Les policies
-- RLS se cumulant en OU, elle rend toutes les lignes lisibles aux
-- connectés sans toucher aux policies d'écriture (insert/update/delete
-- restent owner/admin). Idempotent. Jamais accessible à `anon`.
-- ============================================================

ALTER TABLE public.depenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "depenses_select_all" ON public.depenses;
CREATE POLICY "depenses_select_all" ON public.depenses
  FOR SELECT TO authenticated USING (true);
