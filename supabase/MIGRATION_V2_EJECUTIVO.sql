-- WinClick — Migración: Actualización Oficial V2 (Rango Ejecutivo)

-- 1. Añadir la columna de precio para el nuevo rango Ejecutivo en la tabla de configuración
ALTER TABLE business_settings
ADD COLUMN IF NOT EXISTS package_ejecutivo_price NUMERIC(10,2) NOT NULL DEFAULT 600.00;

-- 2. Asegurar que los valores existentes tengan el precio correcto según la V2
UPDATE business_settings
SET package_ejecutivo_price = 600.00
WHERE package_ejecutivo_price <> 600.00;

-- 3. (Opcional) Verificación de integridad
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM information_schema.columns
  WHERE table_name = 'business_settings'
    AND column_name = 'package_ejecutivo_price';

  IF v_count = 0 THEN
    RAISE EXCEPTION '❌ Error: La columna package_ejecutivo_price no se creó correctamente.';
  ELSE
    RAISE NOTICE '✅ Migración completada: Columna package_ejecutivo_price añadida correctamente.';
  END IF;
END $$;
