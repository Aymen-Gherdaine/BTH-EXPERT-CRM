-- ============================================================
-- FIABILITÉ — P0 : écritures transactionnelles (RPC)
-- ------------------------------------------------------------
-- Deux flux écrivaient plusieurs tables en plusieurs requêtes NON atomiques :
--
--   1) POST /api/soumissions : client → soumission → lignes_budget.
--      En cas d'échec après l'insertion du client ou de la soumission,
--      on laissait des données partielles (client orphelin, soumission
--      sans lignes).
--
--   2) PUT /api/soumissions/[id]/lignes : DELETE de toutes les lignes
--      puis INSERT du nouveau lot. Un échec entre les deux effaçait
--      DÉFINITIVEMENT toutes les lignes budgétaires (perte de données).
--
-- Correctif : encapsuler chaque flux dans une fonction plpgsql. Une fonction
-- plpgsql s'exécute dans UNE seule transaction → si une instruction échoue,
-- l'ensemble est annulé (rollback). Plus aucun état partiel possible.
--
-- SECURITY INVOKER : la fonction s'exécute avec les droits de l'appelant, donc
-- les policies RLS de clients/soumissions/lignes_budget s'appliquent normalement.
-- L'autorisation par rôle (création = admin ; édition lignes = admin/chargé de
-- projet) reste faite en amont dans les routes API. Idempotent (CREATE OR REPLACE).
-- ============================================================

-- ── 1) Création atomique d'une soumission complète ─────────────────────────
-- Les calculs métier (numéro d'offre, date, totaux, ordre des lignes) restent
-- côté route (TS) et sont passés en JSON. La fonction ne fait que l'écriture
-- atomique. Résolution du client : find-or-insert par (entreprise, nom_contact),
-- avec rafraîchissement des champs modifiables (comportement upsert d'origine).
CREATE OR REPLACE FUNCTION public.create_soumission_tx(
  p_client     jsonb,
  p_soumission jsonb,
  p_lignes     jsonb
) RETURNS public.soumissions
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_client_id uuid;
  v_soum      public.soumissions;
BEGIN
  SELECT id INTO v_client_id
  FROM public.clients
  WHERE entreprise = p_client->>'entreprise'
    AND nom_contact = p_client->>'nom_contact'
  LIMIT 1;

  IF v_client_id IS NULL THEN
    INSERT INTO public.clients (titre, nom_contact, poste, entreprise, adresse, ville)
    VALUES (
      p_client->>'titre',
      p_client->>'nom_contact',
      p_client->>'poste',
      p_client->>'entreprise',
      p_client->>'adresse',
      p_client->>'ville'
    )
    RETURNING id INTO v_client_id;
  ELSE
    UPDATE public.clients SET
      titre   = p_client->>'titre',
      poste   = p_client->>'poste',
      adresse = p_client->>'adresse',
      ville   = p_client->>'ville'
    WHERE id = v_client_id;
  END IF;

  INSERT INTO public.soumissions (
    numero_offre, date_offre, client_id, titre_projet, secteur_activite,
    description_projet, type_etude, delai_jours, total_ht, tva, total_ttc,
    statut, contexte_genere
  )
  VALUES (
    p_soumission->>'numero_offre',
    (p_soumission->>'date_offre')::date,
    v_client_id,
    p_soumission->>'titre_projet',
    p_soumission->>'secteur_activite',
    p_soumission->>'description_projet',
    p_soumission->>'type_etude',
    (p_soumission->>'delai_jours')::integer,
    (p_soumission->>'total_ht')::numeric,
    (p_soumission->>'tva')::numeric,
    (p_soumission->>'total_ttc')::numeric,
    COALESCE(p_soumission->>'statut', 'Brouillon'),
    p_soumission->>'contexte_genere'
  )
  RETURNING * INTO v_soum;

  IF p_lignes IS NOT NULL AND jsonb_array_length(p_lignes) > 0 THEN
    INSERT INTO public.lignes_budget (soumission_id, numero, designation, quantite, prix_unitaire, ordre, groupe)
    SELECT
      v_soum.id,
      (l->>'numero')::integer,
      l->>'designation',
      (l->>'quantite')::integer,
      (l->>'prix_unitaire')::numeric,
      (l->>'ordre')::integer,
      COALESCE(l->>'groupe', 'Mission')
    FROM jsonb_array_elements(p_lignes) AS t(l);
  END IF;

  RETURN v_soum;
END;
$$;

-- ── 2) Remplacement atomique des lignes budget d'une soumission ────────────
CREATE OR REPLACE FUNCTION public.replace_lignes_budget_tx(
  p_soumission_id uuid,
  p_lignes        jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.lignes_budget WHERE soumission_id = p_soumission_id;

  IF p_lignes IS NOT NULL AND jsonb_array_length(p_lignes) > 0 THEN
    INSERT INTO public.lignes_budget (soumission_id, numero, designation, quantite, prix_unitaire, ordre, groupe)
    SELECT
      p_soumission_id,
      (l->>'numero')::integer,
      l->>'designation',
      (l->>'quantite')::integer,
      (l->>'prix_unitaire')::numeric,
      (l->>'ordre')::integer,
      COALESCE(l->>'groupe', 'Mission')
    FROM jsonb_array_elements(p_lignes) AS t(l);
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.create_soumission_tx(jsonb, jsonb, jsonb) FROM public;
GRANT EXECUTE ON FUNCTION public.create_soumission_tx(jsonb, jsonb, jsonb) TO authenticated;

REVOKE ALL ON FUNCTION public.replace_lignes_budget_tx(uuid, jsonb) FROM public;
GRANT EXECUTE ON FUNCTION public.replace_lignes_budget_tx(uuid, jsonb) TO authenticated;
