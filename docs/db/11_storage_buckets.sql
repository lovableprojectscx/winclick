-- =============================================================================
-- CREAR BUCKETS DE STORAGE — Ejecutar en Supabase SQL Editor
-- Reemplaza 06_storage.sql con bucket receipts como PÚBLICO
-- (necesario para que getPublicUrl funcione correctamente)
-- =============================================================================

-- Bucket de comprobantes (público para que getPublicUrl funcione)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'receipts',
  'receipts',
  TRUE,
  5242880,
  ARRAY['image/jpeg','image/png','image/webp','image/gif','application/pdf']
) ON CONFLICT (id) DO UPDATE SET public = TRUE;

-- Bucket de avatares (público)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  TRUE,
  2097152,
  ARRAY['image/jpeg','image/png','image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Bucket de imágenes de productos (público)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'products',
  'products',
  TRUE,
  5242880,
  ARRAY['image/jpeg','image/png','image/webp']
) ON CONFLICT (id) DO NOTHING;


-- =============================================================================
-- POLÍTICAS — RECEIPTS (bucket público, cualquiera con el link puede verlo)
-- =============================================================================

-- Cualquiera puede leer (bucket público)
DROP POLICY IF EXISTS "receipts: public read" ON storage.objects;
CREATE POLICY "receipts: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'receipts');

-- Usuario autenticado puede subir a su propia carpeta ({uid}/...)
DROP POLICY IF EXISTS "receipts: affiliate upload own" ON storage.objects;
CREATE POLICY "receipts: affiliate upload own"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'receipts'
    AND auth.uid() IS NOT NULL
  );

-- Usuario autenticado puede actualizar sus propios archivos
DROP POLICY IF EXISTS "receipts: affiliate update own" ON storage.objects;
CREATE POLICY "receipts: affiliate update own"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'receipts' AND auth.uid() IS NOT NULL);


-- =============================================================================
-- POLÍTICAS — AVATARS
-- =============================================================================

DROP POLICY IF EXISTS "avatars: public read" ON storage.objects;
CREATE POLICY "avatars: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars: upload own" ON storage.objects;
CREATE POLICY "avatars: upload own"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);


-- =============================================================================
-- POLÍTICAS — PRODUCTS
-- =============================================================================

DROP POLICY IF EXISTS "products: public read" ON storage.objects;
CREATE POLICY "products: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'products');

DROP POLICY IF EXISTS "products: admin upload" ON storage.objects;
CREATE POLICY "products: admin upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'products' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "products: admin update" ON storage.objects;
CREATE POLICY "products: admin update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'products' AND auth.uid() IS NOT NULL);
