-- =============================================================================
-- WINNER ORGANA — Migración 09: Correcciones del sistema de activación
-- Motor: PostgreSQL (Supabase)
-- Archivo: 09_activation_fixes.sql
-- =============================================================================
-- CONTEXTO:
--   La migración 08 estableció el flujo de activación por compras acumuladas.
--   Esta migración corrige dos problemas identificados en la auditoría:
--   1. package_basico_price tenía default 100 pero el negocio usa 120.
--   2. Las órdenes de activación de afiliados pendientes generaban comisiones
--      hacia los uplines, lo cual no corresponde al período de activación.
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. CORREGIR PRECIO BASE DEL PLAN BÁSICO
--    El default de la migración 08 era 100, pero el valor correcto es 120.
-- =============================================================================

UPDATE business_settings
SET package_basico_price = 120
WHERE package_basico_price = 100;

-- Verificar que el valor quedó correcto
-- SELECT package_basico_price FROM business_settings;

-- =============================================================================
-- 2. MARCAR ÓRDENES DE ACTIVACIÓN
--    Agregar columna is_activation_order a la tabla orders.
--    Una orden de activación es la que un afiliado PENDIENTE coloca para
--    alcanzar la meta de su plan. Estas órdenes NO deben generar comisiones
--    de red hacia los uplines (solo actualizar total_sales del propio afiliado).
-- =============================================================================

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS is_activation_order BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN orders.is_activation_order IS
  'TRUE cuando la orden fue colocada por un afiliado con account_status=pending '
  'como parte de su compra de activación de membresía. '
  'No genera comisiones de red (solo actualiza total_sales del afiliado directo).';

-- Retroactivamente marcar órdenes de afiliados que aún están pending
-- (si colocaron una orden antes de ser activados, es de activación)
UPDATE orders o
SET is_activation_order = TRUE
FROM affiliates a
WHERE o.affiliate_id = a.id
  AND a.account_status = 'pending'
  AND o.is_activation_order = FALSE;

-- =============================================================================
-- 3. FUNCIÓN CORREGIDA: create_order_commissions
--    Ahora recibe is_activation_order como parámetro.
--    Si es una orden de activación:
--    - Actualiza total_sales del afiliado directo ✓
--    - Crea comisión nivel 1 para el afiliado directo (breakage = TRUE, no se paga)
--    - NO crea comisiones para uplines (niveles 2-10)
-- =============================================================================

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

  -- Actualizar rango del vendedor directo
  PERFORM public.calculate_affiliate_rank(v_affiliate_id);

  -- Nivel 1 — el vendedor/comprador directo
  v_commission_amount := ROUND(p_order_amount * v_rates[1] / 100, 2);

  -- En órdenes de activación: nivel 1 se crea como breakage (no se paga todavía;
  -- el afiliado ganará comisiones desde su primera recompra una vez activado).
  INSERT INTO commissions (
    affiliate_id, originator_id, order_id, amount, level,
    percentage, base_amount, status, is_breakage
  )
  VALUES (
    v_affiliate_id, v_affiliate_id, p_order_id,
    v_commission_amount, 1, v_rates[1], p_order_amount,
    CASE WHEN p_is_activation THEN 'rejected' ELSE 'pending' END,
    p_is_activation   -- breakage=TRUE en activación → no se paga al nivel 1
  );

  -- Siempre actualizar total_sales (es el contador de progreso de activación)
  UPDATE affiliates
  SET total_sales       = COALESCE(total_sales, 0)       + p_order_amount,
      -- Solo sumar a total_commissions si NO es activación
      total_commissions = COALESCE(total_commissions, 0) +
                          CASE WHEN p_is_activation THEN 0 ELSE v_commission_amount END
  WHERE id = v_affiliate_id;

  -- Registrar UV con monto (para cálculo de rangos)
  INSERT INTO volume_units (affiliate_id, order_id, month_year, source, amount)
  VALUES (v_affiliate_id, p_order_id, TO_CHAR(CURRENT_DATE, 'YYYY-MM'), 'purchase', p_order_amount)
  ON CONFLICT DO NOTHING;

  -- ── NIVELES 2-10: solo para órdenes normales (NO de activación) ──────────
  IF p_is_activation THEN
    RETURN; -- Órdenes de activación no generan comisiones en la red
  END IF;

  -- Recorrer uplines para órdenes de recompra/regulares
  v_current_id := v_next_referrer_id;
  v_level      := 2;

  WHILE v_current_id IS NOT NULL AND v_level <= 10 LOOP
    PERFORM public.calculate_affiliate_rank(v_current_id);

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


-- =============================================================================
-- 4. ACTUALIZAR EL TRIGGER DE COMISIONES
--    El trigger debe pasar is_activation_order a la función corregida.
--    NOTA: El trigger actual llama a create_order_commissions cuando el pedido
--    llega a 'entregado'. Necesita pasar el campo is_activation_order.
--    Si el trigger no existe aún, crear uno básico aquí.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.trigger_commissions_on_delivery()
RETURNS TRIGGER AS $$
DECLARE
  v_affiliate_code TEXT;
  v_is_activation  BOOLEAN;
BEGIN
  -- Solo disparar cuando el status cambia A 'entregado'
  IF NEW.status = 'entregado' AND (OLD.status IS DISTINCT FROM 'entregado') THEN

    -- Obtener código del afiliado referidor de la orden
    SELECT a.affiliate_code
    INTO v_affiliate_code
    FROM affiliates a
    WHERE a.id = NEW.affiliate_id;

    -- Si no hay afiliado referido, no hay comisiones
    IF v_affiliate_code IS NULL THEN
      RETURN NEW;
    END IF;

    v_is_activation := COALESCE(NEW.is_activation_order, FALSE);

    PERFORM public.create_order_commissions(
      NEW.id,
      NEW.total,
      v_affiliate_code,
      v_is_activation
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- Recrear el trigger con la función actualizada
DROP TRIGGER IF EXISTS trg_commissions_on_delivery ON orders;
CREATE TRIGGER trg_commissions_on_delivery
  AFTER UPDATE OF status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION trigger_commissions_on_delivery();

COMMENT ON FUNCTION public.trigger_commissions_on_delivery IS
  'Dispara create_order_commissions cuando una orden pasa a status=entregado. '
  'Pasa is_activation_order para que las órdenes de activación no generen comisiones de red.';


-- =============================================================================
-- 5. MARCAR is_activation_order = TRUE AUTOMÁTICAMENTE PARA AFILIADOS PENDING
--    Trigger en INSERT de orders: si el afiliado_id tiene account_status=pending,
--    la orden se marca automáticamente como de activación.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.auto_mark_activation_order()
RETURNS TRIGGER AS $$
DECLARE
  v_status TEXT;
BEGIN
  IF NEW.affiliate_id IS NOT NULL THEN
    SELECT account_status INTO v_status
    FROM affiliates
    WHERE id = NEW.affiliate_id;

    IF v_status = 'pending' THEN
      NEW.is_activation_order := TRUE;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

DROP TRIGGER IF EXISTS trg_auto_mark_activation ON orders;
CREATE TRIGGER trg_auto_mark_activation
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION auto_mark_activation_order();

COMMENT ON FUNCTION public.auto_mark_activation_order IS
  'Al insertar una orden, si el afiliado está en estado pending, '
  'la marca automáticamente como is_activation_order=TRUE. '
  'Esto garantiza que la lógica sea automática sin requerir cambios en el frontend.';


-- =============================================================================
-- FIN DE MIGRACIÓN
-- =============================================================================

COMMIT;

-- Verificación post-migración
SELECT
  'package_basico_price'        AS check_name,
  package_basico_price::TEXT    AS result
FROM business_settings
LIMIT 1

UNION ALL

SELECT
  'is_activation_order column',
  COUNT(*)::TEXT
FROM information_schema.columns
WHERE table_name = 'orders' AND column_name = 'is_activation_order'

UNION ALL

SELECT
  'pending orders marked as activation',
  COUNT(*)::TEXT
FROM orders
WHERE is_activation_order = TRUE;
