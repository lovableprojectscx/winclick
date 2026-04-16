-- =============================================================================
-- Agregar columnas de galería e imagen SEO a products
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- =============================================================================

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS image_alt    TEXT,
  ADD COLUMN IF NOT EXISTS gallery_images JSONB NOT NULL DEFAULT '[]';

-- gallery_images estructura esperada:
-- [ { "url": "https://...", "alt": "texto alternativo" }, ... ]
