-- =============================================================================
-- WINCLICK — REGULARIZACIÓN TOTAL DE BASE DE DATOS (V3)
-- =============================================================================
-- Este script unifica todas las correcciones críticas:
-- 1. Soporte completo para el paquete "Ejecutivo".
-- 2. Corrección de restricciones de paquetes (Básico, Ejecutivo, Intermedio, VIP).
-- 3. Configuración de precios de negocio.
-- 4. Actualización de lógica de comisiones (Residuales y Patrocinio).
-- 5. Sincronización de Profundidad (depth_unlocked) automática.
-- =============================================================================

BEGIN;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 1. SOPORTE PARA PAQUETE "EJECUTIVO"
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Actualizar restricción en la tabla affiliates
ALTER TABLE affiliates DROP CONSTRAINT IF EXISTS affiliates_package_check;
ALTER TABLE affiliates ADD CONSTRAINT affiliates_package_check CHECK (package IN ('Básico', 'Ejecutivo', 'Intermedio', 'VIP'));

-- Actualizar restricción en la tabla affiliate_payments
ALTER TABLE affiliate_payments DROP CONSTRAINT IF EXISTS affiliate_payments_package_from_check;
ALTER TABLE affiliate_payments DROP CONSTRAINT IF EXISTS affiliate_payments_package_to_check;
ALTER TABLE affiliate_payments ADD CONSTRAINT affiliate_payments_package_from_check CHECK (package_from IN ('Básico', 'Ejecutivo', 'Intermedio', 'VIP'));
ALTER TABLE affiliate_payments ADD CONSTRAINT affiliate_payments_package_to_check CHECK (package_to IN ('Básico', 'Ejecutivo', 'Intermedio', 'VIP'));

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 2. CONFIGURACIÓN DE NEGOCIO (PRECIOS V2/V3)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALTER TABLE business_settings ADD COLUMN IF NOT EXISTS package_ejecutivo_price NUMERIC(10,2) NOT NULL DEFAULT 600.00;

UPDATE business_settings SET
  package_basico_price = 120.00,
  package_ejecutivo_price = 600.00,
  package_intermedio_price = 2000.00,
  package_vip_price = 10000.00
WHERE id IS NOT NULL; -- Aplica a la fila única

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 3. LÓGICA DE PROFUNDIDAD AUTOMÁTICA
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE OR REPLACE FUNCTION public.handle_set_depth_on_insert()
RETURNS trigger AS $$
BEGIN
  NEW.depth_unlocked := CASE NEW.package
    WHEN 'VIP'        THEN 10
    WHEN 'Intermedio' THEN 7
    WHEN 'Ejecutivo'  THEN 5
    ELSE 3 -- Básico
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_depth_on_insert ON public.affiliates;
CREATE TRIGGER trg_set_depth_on_insert
  BEFORE INSERT ON public.affiliates
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_set_depth_on_insert();

-- Regularizar profundidad para registros existentes que no la tengan correcta
UPDATE affiliates SET
  depth_unlocked = CASE package
    WHEN 'VIP'        THEN 10
    WHEN 'Intermedio' THEN 7
    WHEN 'Ejecutivo'  THEN 5
    ELSE 3
  END
WHERE depth_unlocked IS NULL OR depth_unlocked = 0;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 4. DISTRIBUCIÓN DE COMISIONES (V3 — REGLA FINAL)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE OR REPLACE FUNCTION public.distribute_commissions_v2(p_order_id uuid, p_is_activation boolean DEFAULT false)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_order          RECORD;
  v_affiliate_id   UUID;
  v_upline         RECORD;
  v_level          INT;
  v_is_breakage    BOOLEAN;
  v_amount         NUMERIC(10,2);
  v_total          NUMERIC(10,2);
  v_package        TEXT;
  -- Residuales (Total 25%)
  v_rates          NUMERIC[] := ARRAY[10, 4, 2, 2, 1, 1, 1, 3, 0.5, 0.5];
  -- Patrocinio
  v_bonus_rates    NUMERIC[];
BEGIN
  SELECT * INTO v_order FROM orders WHERE id = p_order_id;
  IF v_order IS NULL OR v_order.affiliate_id IS NULL THEN RETURN; END IF;

  v_affiliate_id := v_order.affiliate_id;
  v_total        := v_order.total;

  IF p_is_activation THEN
    -- Actualizar ventas totales del activado
    UPDATE affiliates SET total_sales = COALESCE(total_sales, 0) + v_total WHERE id = v_affiliate_id;

    -- Bono de Patrocinio (4 niveles)
    SELECT package INTO v_package FROM affiliates WHERE id = v_affiliate_id;
    
    v_bonus_rates := CASE v_package
      WHEN 'Básico'     THEN ARRAY[48.00, 0.00, 0.00, 0.00]
      WHEN 'Ejecutivo'  THEN ARRAY[100.00, 30.00, 12.00, 3.00]
      WHEN 'Intermedio' THEN ARRAY[300.00, 100.00, 40.00, 10.00]
      WHEN 'VIP'        THEN ARRAY[1500.00, 150.00, 50.00, 50.00]
      ELSE ARRAY[0.00, 0.00, 0.00, 0.00]
    END;

    FOR v_level IN 1..4 LOOP
      v_amount := v_bonus_rates[v_level];
      IF v_amount <= 0 THEN CONTINUE; END IF;

      -- Buscar upline N-ésimo
      SELECT a.* INTO v_upline FROM affiliates a WHERE a.id = (
        WITH RECURSIVE tree AS (
          SELECT id, referred_by, 1 AS depth FROM affiliates WHERE id = v_affiliate_id
          UNION ALL
          SELECT a2.id, a2.referred_by, tree.depth + 1 FROM affiliates a2 JOIN tree ON tree.referred_by = a2.id WHERE tree.depth < v_level
        ) SELECT id FROM tree WHERE depth = v_level
      );

      IF v_upline IS NULL THEN EXIT; END IF;

      v_is_breakage := (v_level > v_upline.depth_unlocked);

      INSERT INTO commissions (affiliate_id, originator_id, order_id, amount, level, percentage, base_amount, status, is_breakage)
      VALUES (v_upline.id, v_affiliate_id, p_order_id, v_amount, v_level, 0, v_total, CASE WHEN v_is_breakage THEN 'rejected' ELSE 'pending' END, v_is_breakage)
      ON CONFLICT DO NOTHING;

      IF NOT v_is_breakage THEN
        UPDATE affiliates SET total_commissions = COALESCE(total_commissions, 0) + v_amount WHERE id = v_upline.id;
      END IF;
    END LOOP;
    RETURN;
  END IF;

  -- FLUJO RESIDUAL (RECOMPRAS)
  -- Nivel 1: Cashback
  v_amount := ROUND(v_total * v_rates[1] / 100, 2);
  INSERT INTO commissions (affiliate_id, originator_id, order_id, amount, level, percentage, base_amount, status, is_breakage)
  VALUES (v_affiliate_id, v_affiliate_id, p_order_id, v_amount, 1, v_rates[1], v_total, 'pending', FALSE)
  ON CONFLICT DO NOTHING;

  UPDATE affiliates SET
    total_sales       = COALESCE(total_sales, 0) + v_total,
    total_commissions = COALESCE(total_commissions, 0) + v_amount
  WHERE id = v_affiliate_id;

  -- Niveles 2-10: Residuales
  FOR v_level IN 2..10 LOOP
    SELECT a.* INTO v_upline FROM affiliates a WHERE a.id = (
      WITH RECURSIVE tree AS (
        SELECT id, referred_by, 1 AS depth FROM affiliates WHERE id = v_affiliate_id
        UNION ALL
        SELECT a2.id, a2.referred_by, tree.depth + 1 FROM affiliates a2 JOIN tree ON tree.referred_by = a2.id WHERE tree.depth < v_level - 1
      ) SELECT id FROM tree WHERE depth = v_level - 1
    );

    IF v_upline IS NULL THEN EXIT; END IF;

    v_is_breakage := ((v_level - 1) > v_upline.depth_unlocked);
    v_amount      := ROUND(v_total * v_rates[v_level] / 100, 2);

    INSERT INTO commissions (affiliate_id, originator_id, order_id, amount, level, percentage, base_amount, status, is_breakage)
    VALUES (v_upline.id, v_affiliate_id, p_order_id, v_amount, v_level, v_rates[v_level], v_total, CASE WHEN v_is_breakage THEN 'rejected' ELSE 'pending' END, v_is_breakage)
    ON CONFLICT DO NOTHING;

    IF NOT v_is_breakage THEN
      UPDATE affiliates SET total_commissions = COALESCE(total_commissions, 0) + v_amount WHERE id = v_upline.id;
    END IF;
  END LOOP;
END;
$function$;

COMMIT;

-- VERIFICACIÓN FINAL
SELECT 'affiliates_check' as info, COUNT(*) from pg_constraint where conname = 'affiliates_package_check';
SELECT 'ejecutivo_price' as info, package_ejecutivo_price from business_settings LIMIT 1;
