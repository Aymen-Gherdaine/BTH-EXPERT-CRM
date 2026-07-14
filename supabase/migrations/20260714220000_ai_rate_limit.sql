-- ============================================================
-- Rate-limit IA — store partagé (Postgres)
-- ------------------------------------------------------------
-- Le rate-limit de /api/generate était une Map en mémoire, donc par
-- instance serverless (contournable sous forte concurrence). On le déplace
-- dans Postgres via une fonction atomique, partagée entre toutes les
-- instances. La fonction utilise auth.uid() (jamais un id fourni par le
-- client) → un utilisateur ne peut pas viser le quota d'un autre.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.ai_rate_limit (
  user_id      uuid PRIMARY KEY,
  window_start timestamptz NOT NULL DEFAULT now(),
  count        integer NOT NULL DEFAULT 0
);

-- Aucune policy cliente : seule la fonction SECURITY DEFINER y écrit.
ALTER TABLE public.ai_rate_limit ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.check_ai_rate_limit(
  p_max integer,
  p_window_seconds integer
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid   uuid := auth.uid();
  v_now   timestamptz := now();
  v_count integer;
BEGIN
  IF v_uid IS NULL THEN
    RETURN false;
  END IF;

  INSERT INTO public.ai_rate_limit (user_id, window_start, count)
  VALUES (v_uid, v_now, 1)
  ON CONFLICT (user_id) DO UPDATE SET
    window_start = CASE
      WHEN public.ai_rate_limit.window_start < v_now - make_interval(secs => p_window_seconds)
      THEN v_now ELSE public.ai_rate_limit.window_start END,
    count = CASE
      WHEN public.ai_rate_limit.window_start < v_now - make_interval(secs => p_window_seconds)
      THEN 1 ELSE public.ai_rate_limit.count + 1 END
  RETURNING count INTO v_count;

  RETURN v_count <= p_max;
END;
$$;

REVOKE ALL ON FUNCTION public.check_ai_rate_limit(integer, integer) FROM public;
GRANT EXECUTE ON FUNCTION public.check_ai_rate_limit(integer, integer) TO authenticated;
