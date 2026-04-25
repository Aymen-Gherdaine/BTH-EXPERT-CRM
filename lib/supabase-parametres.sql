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

-- Colonnes signatures (idempotent)
ALTER TABLE public.parametres ADD COLUMN IF NOT EXISTS signature_responsable_url TEXT DEFAULT '';
ALTER TABLE public.parametres ADD COLUMN IF NOT EXISTS signature_autorise_url TEXT DEFAULT '';

-- Insérer la ligne initiale avec les valeurs par défaut
INSERT INTO public.parametres (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- RLS
ALTER TABLE public.parametres ENABLE ROW LEVEL SECURITY;

-- Lecture : tout utilisateur connecté
DROP POLICY IF EXISTS "Lecture parametres" ON public.parametres;
CREATE POLICY "Lecture parametres"
ON public.parametres FOR SELECT
TO authenticated
USING (true);

-- Modification : tout utilisateur connecté (admin uniquement en prod)
DROP POLICY IF EXISTS "Modification parametres" ON public.parametres;
CREATE POLICY "Modification parametres"
ON public.parametres FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================================
-- Supabase Storage — Bucket "signatures"
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'signatures',
  'signatures',
  true,
  1048576,  -- 1 Mo max
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Lecture publique
DROP POLICY IF EXISTS "Lecture publique signatures" ON storage.objects;
CREATE POLICY "Lecture publique signatures"
ON storage.objects FOR SELECT
USING (bucket_id = 'signatures');

-- Upload : utilisateurs connectés uniquement
DROP POLICY IF EXISTS "Upload signatures" ON storage.objects;
CREATE POLICY "Upload signatures"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'signatures');

-- Mise à jour : utilisateurs connectés
DROP POLICY IF EXISTS "Update signatures" ON storage.objects;
CREATE POLICY "Update signatures"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'signatures');

-- Suppression : utilisateurs connectés
DROP POLICY IF EXISTS "Delete signatures" ON storage.objects;
CREATE POLICY "Delete signatures"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'signatures');
