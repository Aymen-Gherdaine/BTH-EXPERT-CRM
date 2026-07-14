-- RPC d'agrégats du tableau de bord.
-- AVANT : le dashboard (page SSR + /api/dashboard) téléchargeait TOUTES les
-- lignes de `soumissions` puis comptait/sommait en JavaScript
-- (jusqu'à 4 scans complets de la table pour /api/dashboard). À volume
-- croissant : payload et temps de calcul qui explosent.
-- APRÈS : Postgres calcule les 5 indicateurs directement (une seule passe) et
-- ne renvoie que ces 5 nombres.
--
-- SÉCURITÉ : `security invoker` (défaut) → la fonction s'exécute avec les
-- droits de l'appelant, donc les policies RLS de `soumissions` s'appliquent
-- EXACTEMENT comme aujourd'hui (un admin agrège toutes les lignes, un
-- commercial uniquement les siennes). Ne JAMAIS passer en `security definer`
-- ici : cela contournerait la RLS et fuiterait les chiffres globaux.
--
-- `p_start_of_month` est passé par l'appelant (date du 1er du mois courant),
-- pour rester identique au calcul JS existant et éviter toute dérive de fuseau.

CREATE OR REPLACE FUNCTION public.dashboard_stats(p_start_of_month date)
RETURNS TABLE (
  soumissions_mois        integer,
  nombre_mandats_acceptes integer,
  total_mandats_acceptes  numeric,
  taux_acceptation        integer,
  total_versements_recus  numeric
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    COUNT(*) FILTER (WHERE date_offre >= p_start_of_month)::int      AS soumissions_mois,
    COUNT(*) FILTER (WHERE statut = 'Acceptée')::int                 AS nombre_mandats_acceptes,
    COALESCE(SUM(total_ttc) FILTER (WHERE statut = 'Acceptée'), 0)   AS total_mandats_acceptes,
    CASE WHEN COUNT(*) > 0
      THEN ROUND(
        COUNT(*) FILTER (WHERE statut = 'Acceptée')::numeric
        / COUNT(*)::numeric * 100
      )::int
      ELSE 0
    END                                                              AS taux_acceptation,
    COALESCE(SUM(versement_recu), 0)                                 AS total_versements_recus
  FROM public.soumissions;
$$;

-- Un utilisateur connecté (rôle `authenticated`) peut appeler la fonction.
GRANT EXECUTE ON FUNCTION public.dashboard_stats(date) TO authenticated;
