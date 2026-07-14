-- ============================================================
-- SÉCURITÉ — Bucket `justificatifs` : limites taille + types MIME
-- ------------------------------------------------------------
-- Le bucket n'avait ni file_size_limit ni allowed_mime_types → un
-- utilisateur pouvait y déposer des fichiers arbitraires (type/taille),
-- servis ensuite via URL signée. On borne côté serveur (contrôle réel,
-- complémentaire à la validation client) : 5 Mo, images + PDF uniquement.
-- Le bucket reste privé et scopé par utilisateur (RLS existante). Idempotent.
-- ============================================================

UPDATE storage.buckets
SET file_size_limit = 5242880,  -- 5 Mo
    allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
WHERE id = 'justificatifs';
