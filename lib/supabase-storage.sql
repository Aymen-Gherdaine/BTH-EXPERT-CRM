-- ============================================================
-- Supabase Storage — Bucket "avatars"
-- Exécuter dans Supabase > SQL Editor
-- ============================================================

-- 1. Créer le bucket public "avatars"
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5 MB max
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Policy : lecture publique (tout le monde peut voir les avatars)
CREATE POLICY "Avatars publics en lecture"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- 3. Policy : upload uniquement pour l'utilisateur connecté (dans son propre dossier)
CREATE POLICY "Upload avatar — utilisateur connecté"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Policy : mise à jour uniquement par le propriétaire
CREATE POLICY "Mise à jour avatar — propriétaire"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. Policy : suppression uniquement par le propriétaire
CREATE POLICY "Suppression avatar — propriétaire"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
