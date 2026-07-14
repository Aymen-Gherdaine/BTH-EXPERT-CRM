-- RPC d'agrégats pour la LISTE des soumissions (KPIs du hero + compteurs du
-- filtre par statut).
--
-- Contexte : la page /soumissions passe en pagination serveur. Le client ne
-- reçoit plus qu'UNE page de lignes ; il ne peut donc plus calculer lui-même les
-- totaux globaux (Total TTC, Versements) ni les compteurs par statut affichés
-- dans la barre de filtre. Cette fonction les renvoie en une passe.
--
-- Ces indicateurs sont GLOBAUX (sur toutes les soumissions visibles par
-- l'appelant) et indépendants de la recherche/du filtre courant — exactement
-- comme le comportement actuel où ils sont calculés sur la liste complète.
--
-- SÉCURITÉ : `security invoker` (défaut) → RLS de `soumissions` appliquée comme
-- aujourd'hui (un commercial n'agrège que ses lignes). Les montants ne sont de
-- toute façon exposés qu'aux rôles admin/chargé de projet côté endpoint.

CREATE OR REPLACE FUNCTION public.soumissions_list_stats()
RETURNS TABLE (
  total_ttc       numeric,
  total_verse     numeric,
  count_brouillon integer,
  count_envoyee   integer,
  count_acceptee  integer,
  count_refusee   integer
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    COALESCE(SUM(total_ttc), 0)                          AS total_ttc,
    COALESCE(SUM(versement_recu), 0)                     AS total_verse,
    COUNT(*) FILTER (WHERE statut = 'Brouillon')::int    AS count_brouillon,
    COUNT(*) FILTER (WHERE statut = 'Envoyée')::int      AS count_envoyee,
    COUNT(*) FILTER (WHERE statut = 'Acceptée')::int     AS count_acceptee,
    COUNT(*) FILTER (WHERE statut = 'Refusée')::int      AS count_refusee
  FROM public.soumissions;
$$;

GRANT EXECUTE ON FUNCTION public.soumissions_list_stats() TO authenticated;
