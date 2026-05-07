-- Migration D-1: depenses table + justificatifs storage bucket + RLS policies
-- employe_id is NEVER accepted from request body — always set server-side via auth.uid()

-- ─── 1. TABLE ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.depenses (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  employe_id       uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  categorie        text        NOT NULL
                               CHECK (categorie IN (
                                 'mission', 'vehicule', 'repas',
                                 'materiel', 'communication', 'autre'
                               )),
  montant          numeric     NOT NULL,
  description      text,
  date_depense     date        NOT NULL DEFAULT CURRENT_DATE,
  justificatif_url text,
  projet_lie       uuid        REFERENCES public.soumissions(id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- ─── 2. ROW LEVEL SECURITY ───────────────────────────────────────────────────

ALTER TABLE public.depenses ENABLE ROW LEVEL SECURITY;

-- Policy 1 — Employee SELECT: own rows only
CREATE POLICY "depenses_employee_select"
  ON public.depenses FOR SELECT
  TO authenticated
  USING (employe_id = auth.uid());

-- Policy 2 — Employee INSERT: employe_id must equal caller (enforced server-side too)
CREATE POLICY "depenses_employee_insert"
  ON public.depenses FOR INSERT
  TO authenticated
  WITH CHECK (employe_id = auth.uid());

-- Policy 3 — Employee UPDATE: own rows only, cannot change ownership
CREATE POLICY "depenses_employee_update"
  ON public.depenses FOR UPDATE
  TO authenticated
  USING (employe_id = auth.uid())
  WITH CHECK (employe_id = auth.uid());

-- Policy 4 — Employee DELETE: own rows only
CREATE POLICY "depenses_employee_delete"
  ON public.depenses FOR DELETE
  TO authenticated
  USING (employe_id = auth.uid());

-- Policy 5 — Admin ALL: full access for admin role
CREATE POLICY "depenses_admin_all"
  ON public.depenses FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ─── 3. STORAGE BUCKET ───────────────────────────────────────────────────────
-- Private bucket — never public. Signed URLs only (1h expiry).
-- File path: justificatifs/{user_id}/{depense_id}.jpg

INSERT INTO storage.buckets (id, name, public)
VALUES ('justificatifs', 'justificatifs', false)
ON CONFLICT (id) DO NOTHING;

-- ─── 4. STORAGE RLS ──────────────────────────────────────────────────────────
-- Employee accesses only their own folder: path segment [1] must equal auth.uid()

CREATE POLICY "justificatifs_employee_access"
  ON storage.objects FOR ALL
  TO authenticated
  USING (
    bucket_id = 'justificatifs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'justificatifs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
