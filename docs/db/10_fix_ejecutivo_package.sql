-- =============================================================================
-- FIX CRÍTICO: Permitir paquete "Ejecutivo" en el registro
-- =============================================================================
-- Este script soluciona el error que impide crear afiliados con el paquete Ejecutivo.
-- Ejecutar en el SQL Editor de Supabase.

-- 1. Eliminar la restricción actual
ALTER TABLE affiliates DROP CONSTRAINT IF EXISTS affiliates_package_check;

-- 2. Añadir la restricción actualizada incluyendo "Ejecutivo"
ALTER TABLE affiliates ADD CONSTRAINT affiliates_package_check CHECK (package IN ('Básico', 'Ejecutivo', 'Intermedio', 'VIP'));

-- 3. Mensaje de confirmación
DO $$
BEGIN
  RAISE NOTICE '✅ Restricción de paquetes actualizada exitosamente.';
END $$;
