-- ============================================================
-- SÉCURITÉ — SEC-05 : bucket `signatures` privé + écriture restreinte
-- ------------------------------------------------------------
-- Problèmes corrigés :
--   (a) Bucket `signatures` PUBLIC + noms de fichiers devinables →
--       n'importe qui (même non connecté) pouvait télécharger les
--       signatures officielles par URL, et les réutiliser pour forger
--       des documents.
--   (b) Policies d'écriture ne vérifiant que `bucket_id` → tout
--       utilisateur connecté (dont un commercial) pouvait remplacer les
--       fichiers de signature embarqués dans les PDF/DOCX générés.
--
-- Correctif :
--   - Bucket passé en privé. L'app lit désormais les signatures via URL
--     signée (aperçu paramètres) ou download service-role (export).
--   - Lecture : utilisateurs connectés uniquement (jamais anon).
--   - Écriture (insert/update/delete) : admin / chargé de projet seulement
--     (les rôles qui accèdent réellement à la page Paramètres).
--
-- ⚠️ Appliquer APRÈS avoir déployé le code (routes export + page paramètres)
--    qui n'utilise plus d'URL publique. Le code fonctionne aussi bien avec
--    le bucket public qu'avec le bucket privé, donc l'ordre déploiement →
--    migration ne casse rien.
-- ============================================================

UPDATE storage.buckets
SET public = false,
    file_size_limit = 1048576,  -- 1 Mo
    allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/webp']
WHERE id = 'signatures';

-- Supprimer les anciennes policies (tous noms connus)
DROP POLICY IF EXISTS "Lecture publique signatures" ON storage.objects;
DROP POLICY IF EXISTS "Upload signatures" ON storage.objects;
DROP POLICY IF EXISTS "Update signatures" ON storage.objects;
DROP POLICY IF EXISTS "Delete signatures" ON storage.objects;
DROP POLICY IF EXISTS "signatures_select" ON storage.objects;
DROP POLICY IF EXISTS "signatures_insert" ON storage.objects;
DROP POLICY IF EXISTS "signatures_update" ON storage.objects;
DROP POLICY IF EXISTS "signatures_delete" ON storage.objects;

-- Lecture : connectés uniquement (URLs signées). Jamais anon.
CREATE POLICY "signatures_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'signatures');

-- Écriture : admin / chargé de projet uniquement.
CREATE POLICY "signatures_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'signatures'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'charge_projet'))
  );

CREATE POLICY "signatures_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'signatures'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'charge_projet'))
  )
  WITH CHECK (
    bucket_id = 'signatures'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'charge_projet'))
  );

CREATE POLICY "signatures_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'signatures'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'charge_projet'))
  );
