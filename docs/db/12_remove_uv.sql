-- =============================================================================
-- MIGRACIÓN: Eliminar sistema UV (Unidades de Volumen)
-- Decisión de negocio: no se trabaja con UV, el sistema opera por monto en soles.
-- El sistema de comisiones MLM NO se ve afectado — usa depth_unlocked y account_status.
-- Ejecutar en Supabase SQL Editor.
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. REEMPLAZAR create_order_commissions sin las partes UV
--    Se eliminan:
--      - PERFORM calculate_affiliate_rank(...)  (x2: nivel 1 y el loop)
--      - INSERT INTO volume_units (...)
--    Se conserva íntegra la lógica de comisiones MLM.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.create_order_commissions(
  p_order_id       UUID,
  p_order_amount   NUMERIC,
  p_affiliate_code TEXT
)
RETURNS VOID AS $$
DECLARE
  v_affiliate_id      UUID;
  v_current_id        UUID;
  v_next_referrer_id  UUID;
  v_level             INT;
  v_upline_depth      INT;
  v_commission_amount NUMERIC;
  v_is_breakage       BOOLEAN;
  v_upline_status     TEXT;
  v_rates             NUMERIC[] := ARRAY[10, 4, 2, 2, 1, 1, 1, 3, 0.5, 0.5];
BEGIN
  -- Buscar afiliado por código
  SELECT id, referred_by
  INTO v_affiliate_id, v_next_referrer_id
  FROM affiliates
  WHERE affiliate_code = UPPER(p_affiliate_code);

  IF v_affiliate_id IS NULL THEN RETURN; END IF;

  -- Nivel 1: el vendedor directo
  v_commission_amount := ROUND(p_order_amount * v_rates[1] / 100, 2);

  INSERT INTO commissions (affiliate_id, originator_id, order_id, amount, level, percentage, base_amount, status, is_breakage)
  VALUES (v_affiliate_id, v_affiliate_id, p_order_id, v_commission_amount, 1, v_rates[1], p_order_amount, 'pending', FALSE);

  UPDATE affiliates
  SET total_sales       = COALESCE(total_sales, 0)       + p_order_amount,
      total_commissions = COALESCE(total_commissions, 0) + v_commission_amount
  WHERE id = v_affiliate_id;

  -- Niveles 2-10: recorrer uplines
  v_current_id := v_next_referrer_id;
  v_level      := 2;

  WHILE v_current_id IS NOT NULL AND v_level <= 10 LOOP

    SELECT depth_unlocked, account_status
    INTO v_upline_depth, v_upline_status
    FROM affiliates
    WHERE id = v_current_id;

    -- Breakage: upline sin acceso al nivel O suspendido/pendiente
    v_is_breakage := (v_level > v_upline_depth) OR (v_upline_status != 'active');

    v_commission_amount := ROUND(p_order_amount * v_rates[v_level] / 100, 2);

    INSERT INTO commissions (affiliate_id, originator_id, order_id, amount, level, percentage, base_amount, status, is_breakage)
    VALUES (
      v_current_id,
      v_affiliate_id,
      p_order_id,
      v_commission_amount,
      v_level,
      v_rates[v_level],
      p_order_amount,
      CASE WHEN v_is_breakage THEN 'rejected' ELSE 'pending' END,
      v_is_breakage
    );

    IF NOT v_is_breakage THEN
      UPDATE affiliates
      SET total_commissions = COALESCE(total_commissions, 0) + v_commission_amount
      WHERE id = v_current_id;
    END IF;

    SELECT referred_by INTO v_next_referrer_id FROM affiliates WHERE id = v_current_id;
    v_current_id := v_next_referrer_id;
    v_level      := v_level + 1;

  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';


-- =============================================================================
-- 2. ELIMINAR funciones UV
-- =============================================================================

DROP FUNCTION IF EXISTS public.calculate_affiliate_rank(UUID);
DROP FUNCTION IF EXISTS public.recalculate_uv_month();


-- =============================================================================
-- 3. ELIMINAR tabla volume_units (y sus políticas RLS en cascada)
-- =============================================================================

DROP TABLE IF EXISTS public.volume_units CASCADE;


-- =============================================================================
-- 4. ELIMINAR columnas UV de affiliates
--    Se eliminan: uv_month, uv_current_month, uv_amount_month, uv_month_year, rank
--    Se conservan: total_sales, total_commissions, active_directos (usados en stats)
-- =============================================================================

ALTER TABLE public.affiliates
  DROP COLUMN IF EXISTS uv_month,
  DROP COLUMN IF EXISTS uv_current_month,
  DROP COLUMN IF EXISTS uv_amount_month,
  DROP COLUMN IF EXISTS uv_month_year,
  DROP COLUMN IF EXISTS rank;


-- =============================================================================
-- 5. ELIMINAR view legacy que usaba uv_month / rank (si existe)
-- =============================================================================

DROP VIEW IF EXISTS public.affiliate_summary CASCADE;
DROP VIEW IF EXISTS public.affiliate_rank_view CASCADE;


-- =============================================================================
-- VERIFICACIÓN POST-MIGRACIÓN
-- =============================================================================

-- Debe devolver 0 columnas UV en affiliates:
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'affiliates'
  AND column_name IN ('uv_month', 'uv_current_month', 'uv_amount_month', 'uv_month_year', 'rank');

-- Debe devolver 0 (tabla eliminada):
SELECT COUNT(*) AS volume_units_exist
FROM information_schema.tables
WHERE table_name = 'volume_units';

COMMIT;
