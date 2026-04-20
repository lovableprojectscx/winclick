-- =============================================================================
-- WinClick — Supabase Storage Buckets
-- Motor: PostgreSQL (Supabase)
-- Archivo: 06_storage.sql
-- Configura los buckets y sus políticas de acceso.
-- =============================================================================


-- =============================================================================
-- BUCKETS
-- =============================================================================

-- Comprobantes de pago (privado — solo admin puede leer)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'receipts',
  'receipts',
  FALSE,
  5242880,   -- 5MB
  ARRAY['image/jpeg','image/png','image/webp','application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- Fotos de perfil de afiliados (público)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  TRUE,
  2097152,   -- 2MB
  ARRAY['image/jpeg','image/png','image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Imágenes de productos (público, solo admin puede subir)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'products',
  'products',
  TRUE,
  5242880,   -- 5MB
  ARRAY['image/jpeg','image/png','image/webp']
) ON CONFLICT (id) DO NOTHING;


-- =============================================================================
-- POLÍTICAS DE STORAGE
-- =============================================================================

-- ── RECEIPTS ─────────────────────────────────────────────────────────────────

-- El afiliado puede subir comprobantes en su propia carpeta: receipts/{uid}/...
CREATE POLICY "receipts: affiliate upload own"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'receipts'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

-- Solo admin puede leer comprobantes
CREATE POLICY "receipts: admin read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'receipts'
    AND is_admin()
  );

-- El afiliado puede leer sus propios comprobantes
CREATE POLICY "receipts: affiliate read own"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'receipts'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );


-- ── AVATARS ───────────────────────────────────────────────────────────────────

-- Cualquiera puede leer avatares (bucket público)
CREATE POLICY "avatars: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Cada afiliado sube solo a su propia carpeta
CREATE POLICY "avatars: upload own"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

CREATE POLICY "avatars: update own"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );


-- ── PRODUCTS ──────────────────────────────────────────────────────────────────

-- Cualquiera puede leer imágenes de productos
CREATE POLICY "products: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'products');

-- Solo admin puede subir/editar imágenes de productos
CREATE POLICY "products: admin upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'products' AND is_admin());

CREATE POLICY "products: admin update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'products' AND is_admin());
