-- ============================================================
-- Supabase — Table "parametres"
-- Exécuter dans Supabase > SQL Editor
-- Modèle à ligne unique (id = 1 toujours)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.parametres (
  id              INTEGER PRIMARY KEY DEFAULT 1,

  -- Informations société
  nom_societe     TEXT NOT NULL DEFAULT 'BTH Expert',
  adresse         TEXT NOT NULL DEFAULT '',
  ville           TEXT NOT NULL DEFAULT '',
  email_contact   TEXT NOT NULL DEFAULT '',
  telephone       TEXT NOT NULL DEFAULT '',
  site_web        TEXT DEFAULT '',

  -- Signataires
  signataire1_nom   TEXT NOT NULL DEFAULT 'Hakim Belghouini',
  signataire1_titre TEXT NOT NULL DEFAULT 'Expert Co-gérant',
  signataire2_nom   TEXT NOT NULL DEFAULT 'Amine Lahmer',
  signataire2_titre TEXT NOT NULL DEFAULT 'Expert Gérant',

  -- Valeurs par défaut soumissions
  tva_pct             NUMERIC(5,2) NOT NULL DEFAULT 19,
  delai_jours         INTEGER      NOT NULL DEFAULT 45,
  validite_jours      INTEGER      NOT NULL DEFAULT 30,
  modalites_paiement  TEXT         NOT NULL DEFAULT '50% à l''acceptation, 50% à la remise des livrables',

  -- Timestamps
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT single_row CHECK (id = 1)
);

-- Insérer la ligne initiale avec les valeurs par défaut
INSERT INTO public.parametres (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- RLS
ALTER TABLE public.parametres ENABLE ROW LEVEL SECURITY;

-- Lecture : tout utilisateur connecté
CREATE POLICY "Lecture parametres"
ON public.parametres FOR SELECT
TO authenticated
USING (true);

-- Modification : tout utilisateur connecté (admin uniquement en prod)
CREATE POLICY "Modification parametres"
ON public.parametres FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);
