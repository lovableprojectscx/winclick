-- =============================================================================
-- WINNER ORGANA — Migración: Activación + Precio Básico + Comisiones
-- Pasos 3, 4 y 5 de INSTRUCCIONES_BD.sql
-- Motor: PostgreSQL (Supabase SQL Editor)
-- Fecha: 2026-04-19
-- =============================================================================


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- PASO 3 — Columna is_activation_order + trigger automático
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 3a. Agregar columna
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS is_activation_order BOOLEAN NOT NULL DEFAULT FALSE;

-- 3b. Marcar órdenes existentes de afiliados que aún están pending
UPDATE orders o
SET is_activation_order = TRUE
FROM affiliates a
WHERE o.affiliate_id = a.id
  AND a.account_status = 'pending'
  AND o.is_activation_order = FALSE;

-- 3c. Trigger automático: al insertar una orden de un afiliado pending,
--     marcarla como activación sin intervención manual.
CREATE OR REPLACE FUNCTION auto_mark_activation_order()
RETURNS TRIGGER AS $$
DECLARE v_status TEXT;
BEGIN
  IF NEW.affiliate_id IS NOT NULL THEN
    SELECT account_status INTO v_status FROM affiliates WHERE id = NEW.affiliate_id;
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


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- PASO 4 — Corregir precio del plan Básico a S/120
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

UPDATE business_settings
SET package_basico_price = 120
WHERE package_basico_price <> 120;


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- PASO 5 — Función y trigger de comisiones actualizado
-- Reemplaza cualquier versión anterior (CREATE OR REPLACE).
-- Las órdenes de activación NO generan comisiones hacia la red.
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 5a. Función de distribución de comisiones
CREATE OR REPLACE FUNCTION distribute_commissions_v2(
  p_order_id       UUID,
  p_is_activation  BOOLEAN DEFAULT FALSE
)
RETURNS VOID AS $$
DECLARE
  v_order          RECORD;
  v_affiliate_id   UUID;
  v_upline_id      UUID;
  v_upline         RECORD;
  v_level          INT;
  v_percentage     NUMERIC(5,2);
  v_is_breakage    BOOLEAN;
  v_amount         NUMERIC(10,2);
  v_total          NUMERIC(10,2);
  -- Tasas de comisión por nivel
  v_rates          NUMERIC[] := ARRAY[10, 4, 2, 2, 1, 1, 1, 3, 0.5, 0.5];
BEGIN
  SELECT * INTO v_order FROM orders WHERE id = p_order_id;
  IF v_order IS NULL OR v_order.affiliate_id IS NULL THEN RETURN; END IF;

  v_affiliate_id := v_order.affiliate_id;
  v_total        := v_order.total;

  -- Nivel 1: el propio afiliado que hizo la venta/compra
  v_amount := ROUND(v_total * v_rates[1] / 100, 2);

  INSERT INTO commissions (
    affiliate_id, originator_id, order_id, amount, level, percentage, base_amount, status, is_breakage
  ) VALUES (
    v_affiliate_id, v_affiliate_id, p_order_id,
    v_amount, 1, v_rates[1], v_total,
    CASE WHEN p_is_activation THEN 'rejected' ELSE 'pending' END,
    p_is_activation
  ) ON CONFLICT DO NOTHING;

  -- Actualizar total_sales (siempre, tanto en activación como en recompra)
  UPDATE affiliates
  SET total_sales       = COALESCE(total_sales, 0) + v_total,
      total_commissions = COALESCE(total_commissions, 0) +
                          CASE WHEN p_is_activation THEN 0 ELSE v_amount END
  WHERE id = v_affiliate_id;

  -- En órdenes de ACTIVACIÓN: no distribuir comisiones a la red
  IF p_is_activation THEN RETURN; END IF;

  -- Niveles 2-10: recorrer uplines del árbol
  FOR v_level IN 2..10 LOOP
    -- Buscar el upline en la profundidad v_level
    SELECT a.* INTO v_upline
    FROM affiliates a
    WHERE a.id = (
      SELECT referred_by FROM affiliates
      WHERE id = (
        -- Subir v_level-1 veces desde el afiliado original
        WITH RECURSIVE tree AS (
          SELECT id, referred_by, 1 AS depth FROM affiliates WHERE id = v_affiliate_id
          UNION ALL
          SELECT a2.id, a2.referred_by, tree.depth + 1
          FROM affiliates a2
          JOIN tree ON tree.referred_by = a2.id
          WHERE tree.depth < v_level - 1
        )
        SELECT id FROM tree WHERE depth = v_level - 1
      )
    );

    IF v_upline IS NULL THEN EXIT; END IF;

    -- Breakage si el upline no tiene acceso a este nivel o está inactivo
    v_is_breakage := (v_level > v_upline.depth_unlocked) OR (v_upline.account_status != 'active');
    v_amount      := ROUND(v_total * v_rates[v_level] / 100, 2);

    INSERT INTO commissions (
      affiliate_id, originator_id, order_id, amount, level, percentage, base_amount, status, is_breakage
    ) VALUES (
      v_upline.id, v_affiliate_id, p_order_id,
      v_amount, v_level, v_rates[v_level], v_total,
      CASE WHEN v_is_breakage THEN 'rejected' ELSE 'pending' END,
      v_is_breakage
    ) ON CONFLICT DO NOTHING;

    IF NOT v_is_breakage THEN
      UPDATE affiliates
      SET total_commissions = COALESCE(total_commissions, 0) + v_amount
      WHERE id = v_upline.id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';


-- 5b. Trigger que llama a la función cuando el status cambia a 'entregado'
CREATE OR REPLACE FUNCTION trigger_commissions_on_delivery()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'entregado' AND (OLD.status IS DISTINCT FROM 'entregado') THEN
    PERFORM distribute_commissions_v2(NEW.id, COALESCE(NEW.is_activation_order, FALSE));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

DROP TRIGGER IF EXISTS trg_commissions_on_delivery    ON orders;
DROP TRIGGER IF EXISTS trg_distribute_commissions     ON orders;  -- por si existe versión antigua

CREATE TRIGGER trg_commissions_on_delivery
  AFTER UPDATE OF status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION trigger_commissions_on_delivery();


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- VERIFICACIÓN FINAL — Todo debe mostrar ✅
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SELECT
  'orders.is_activation_order'          AS check_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='orders' AND column_name='is_activation_order'
  ) THEN '✅ OK' ELSE '❌ falta — ejecuta PASO 3' END AS estado

UNION ALL SELECT
  'business_settings.package_basico_price = 120',
  COALESCE((
    SELECT CASE WHEN package_basico_price = 120 THEN '✅ OK'
                ELSE '❌ valor incorrecto: ' || package_basico_price
           END FROM business_settings LIMIT 1
  ), '❌ falta fila')

UNION ALL SELECT
  'trigger trg_commissions_on_delivery',
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_name = 'trg_commissions_on_delivery'
  ) THEN '✅ OK' ELSE '❌ falta — ejecuta PASO 5' END

UNION ALL SELECT
  'trigger trg_auto_mark_activation',
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_name = 'trg_auto_mark_activation'
  ) THEN '✅ OK' ELSE '❌ falta — ejecuta PASO 3' END

UNION ALL SELECT
  'products sin public_price',
  (SELECT COUNT(*)::TEXT || ' productos — '
   || CASE WHEN COUNT(*) = 0 THEN '✅ todos con precio'
           ELSE '⚠️ ejecuta PASO 2B' END
   FROM products WHERE public_price IS NULL)

UNION ALL SELECT
  'afiliados pending sin package',
  (SELECT COUNT(*)::TEXT || ' afiliados — '
   || CASE WHEN COUNT(*) = 0 THEN '✅ OK'
           ELSE '⚠️ corrige desde el panel: affiliates → columna package' END
   FROM affiliates WHERE account_status = 'pending' AND package IS NULL)

ORDER BY check_name;
