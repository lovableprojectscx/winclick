-- =============================================================================
-- MIGRACIÓN CORRECTIVA: Eliminar referencias a volume_units en la función de 4 parámetros
-- =============================================================================

BEGIN;

-- 1. Recrear la función de 4 parámetros SIN volume_units ni calculate_affiliate_rank
CREATE OR REPLACE FUNCTION public.create_order_commissions(
  p_order_id           UUID,
  p_order_amount       NUMERIC,
  p_affiliate_code     TEXT,
  p_is_activation      BOOLEAN DEFAULT FALSE
)
RETURNS VOID AS $$
DECLARE
  v_affiliate_id        UUID;
  v_current_id          UUID;
  v_next_referrer_id    UUID;
  v_level               INT;
  v_upline_depth        INT;
  v_commission_amount   NUMERIC;
  v_is_breakage         BOOLEAN;
  v_upline_status       TEXT;
  v_rates               NUMERIC[] := ARRAY[10, 4, 2, 2, 1, 1, 1, 3, 0.5, 0.5];
BEGIN
  -- Buscar afiliado por código
  SELECT id, referred_by
  INTO v_affiliate_id, v_next_referrer_id
  FROM affiliates
  WHERE affiliate_code = UPPER(p_affiliate_code);

  IF v_affiliate_id IS NULL THEN RETURN; END IF;

  -- Nivel 1 — el vendedor/comprador directo
  v_commission_amount := ROUND(p_order_amount * v_rates[1] / 100, 2);

  -- En órdenes de activación: nivel 1 se crea como breakage
  INSERT INTO commissions (
    affiliate_id, originator_id, order_id, amount, level,
    percentage, base_amount, status, is_breakage
  )
  VALUES (
    v_affiliate_id, v_affiliate_id, p_order_id,
    v_commission_amount, 1, v_rates[1], p_order_amount,
    CASE WHEN p_is_activation THEN 'rejected' ELSE 'pending' END,
    p_is_activation
  );

  -- Actualizar total_sales
  UPDATE affiliates
  SET total_sales       = COALESCE(total_sales, 0)       + p_order_amount,
      total_commissions = COALESCE(total_commissions, 0) +
                          CASE WHEN p_is_activation THEN 0 ELSE v_commission_amount END
  WHERE id = v_affiliate_id;

  -- ── NIVELES 2-10: solo para órdenes normales ──────────
  IF p_is_activation THEN
    RETURN;
  END IF;

  v_current_id := v_next_referrer_id;
  v_level      := 2;

  WHILE v_current_id IS NOT NULL AND v_level <= 10 LOOP
    SELECT depth_unlocked, account_status
    INTO v_upline_depth, v_upline_status
    FROM affiliates
    WHERE id = v_current_id;

    v_is_breakage := (v_level > v_upline_depth) OR (v_upline_status != 'active');
    v_commission_amount := ROUND(p_order_amount * v_rates[v_level] / 100, 2);

    INSERT INTO commissions (
      affiliate_id, originator_id, order_id, amount, level,
      percentage, base_amount, status, is_breakage
    )
    VALUES (
      v_current_id, v_affiliate_id, p_order_id,
      v_commission_amount, v_level, v_rates[v_level], p_order_amount,
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


-- 2. Asegurar que calculate_affiliate_rank exista pero no haga nada
--    (Para evitar errores si algún trigger viejo todavía lo llama)
CREATE OR REPLACE FUNCTION public.calculate_affiliate_rank(p_affiliate_id UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN 'Socio Activo';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- 3. Dropear la versión de 3 parámetros de create_order_commissions para evitar ambigüedades
DROP FUNCTION IF EXISTS public.create_order_commissions(UUID, NUMERIC, TEXT);

COMMIT;
