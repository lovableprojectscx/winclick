-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- MIGRACIÓN V3: ACTUALIZACIÓN DE REGLAS DE COMISIONES WINCLICK
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Cambios principales:
-- 1. Los afiliados PENDING o SUSPENDED ahora SÍ cobran comisiones (no generan breakage).
-- 2. El breakage solo ocurre si el nivel de la comisión supera la profundidad (depth_unlocked) del líder.
-- 3. La profundidad (depth_unlocked) se asigna automáticamente al momento del registro.
-- 4. El total de residuales se mantiene en 25%.
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 1. FUNCIÓN PARA ASIGNAR PROFUNDIDAD AUTOMÁTICA AL REGISTRARSE
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

-- 2. TRIGGER PARA APLICAR LA PROFUNDIDAD AL INSERTAR EN AFFILIATES
DROP TRIGGER IF EXISTS trg_set_depth_on_insert ON public.affiliates;
CREATE TRIGGER trg_set_depth_on_insert
  BEFORE INSERT ON public.affiliates
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_set_depth_on_insert();

-- 3. ACTUALIZACIÓN DE LA FUNCIÓN DE DISTRIBUCIÓN DE COMISIONES (V3)
CREATE OR REPLACE FUNCTION public.distribute_commissions_v2(p_order_id uuid, p_is_activation boolean DEFAULT false)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  v_package        TEXT;
  -- Tasas de comisión por nivel (Recompras - Total 25%)
  -- Nivel 1: 10%, N2: 4%, N3: 2%, N4: 2%, N5: 1%, N6: 1%, N7: 1%, N8: 3%, N9: 0.5%, N10: 0.5%
  v_rates          NUMERIC[] := ARRAY[10, 4, 2, 2, 1, 1, 1, 3, 0.5, 0.5];
  -- Tasas fijas para Bonos de Patrocinio (Activación)
  v_bonus_rates    NUMERIC[];
BEGIN
  SELECT * INTO v_order FROM orders WHERE id = p_order_id;
  IF v_order IS NULL OR v_order.affiliate_id IS NULL THEN RETURN; END IF;

  v_affiliate_id := v_order.affiliate_id;
  v_total        := v_order.total;

  -- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  -- FLUJO A: BONO DE PATROCINIO (ÓRDENES DE ACTIVACIÓN)
  -- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  IF p_is_activation THEN
    
    -- El afiliado que se activa NO recibe cashback (está pagando su ingreso).
    UPDATE affiliates
    SET total_sales = COALESCE(total_sales, 0) + v_total
    WHERE id = v_affiliate_id;

    -- Historial del comprador (Nivel 1 rejected)
    INSERT INTO commissions (
      affiliate_id, originator_id, order_id, amount, level, percentage, base_amount, status, is_breakage
    ) VALUES (
      v_affiliate_id, v_affiliate_id, p_order_id,
      0, 1, 0, v_total,
      'rejected', TRUE
    ) ON CONFLICT DO NOTHING;

    -- Determinar qué paquete adquirió
    SELECT package INTO v_package FROM affiliates WHERE id = v_affiliate_id;
    
    IF v_package = 'Básico' THEN
      v_bonus_rates := ARRAY[48.00, 0.00, 0.00, 0.00];
    ELSIF v_package = 'Ejecutivo' THEN
      v_bonus_rates := ARRAY[100.00, 30.00, 12.00, 3.00];
    ELSIF v_package = 'Intermedio' THEN
      v_bonus_rates := ARRAY[300.00, 100.00, 40.00, 10.00];
    ELSIF v_package = 'VIP' THEN
      v_bonus_rates := ARRAY[1500.00, 150.00, 50.00, 50.00];
    ELSE
      RETURN;
    END IF;

    -- Repartir a los 4 niveles ascendentes
    FOR v_level IN 1..4 LOOP
      v_amount := v_bonus_rates[v_level];
      IF v_amount = 0 THEN CONTINUE; END IF;

      -- Buscar upline
      SELECT a.* INTO v_upline
      FROM affiliates a
      WHERE a.id = (
        SELECT referred_by FROM affiliates
        WHERE id = (
          WITH RECURSIVE tree AS (
            SELECT id, referred_by, 1 AS depth FROM affiliates WHERE id = v_affiliate_id
            UNION ALL
            SELECT a2.id, a2.referred_by, tree.depth + 1
            FROM affiliates a2
            JOIN tree ON tree.referred_by = a2.id
            WHERE tree.depth < v_level
          )
          SELECT id FROM tree WHERE depth = v_level
        )
      );

      IF v_upline IS NULL THEN EXIT; END IF;

      -- REGLA V3: El breakage SOLO ocurre por profundidad (depth_unlocked).
      -- Ya NO importa si el account_status es 'pending' o 'suspended'.
      v_is_breakage := (v_level > v_upline.depth_unlocked);

      INSERT INTO commissions (
        affiliate_id, originator_id, order_id, amount, level, percentage, base_amount, status, is_breakage
      ) VALUES (
        v_upline.id, v_affiliate_id, p_order_id,
        v_amount, v_level, 0, v_total,
        CASE WHEN v_is_breakage THEN 'rejected' ELSE 'pending' END,
        v_is_breakage
      ) ON CONFLICT DO NOTHING;

      -- Actualizar saldo si no es breakage
      IF NOT v_is_breakage THEN
        UPDATE affiliates
        SET total_commissions = COALESCE(total_commissions, 0) + v_amount
        WHERE id = v_upline.id;
      END IF;
    END LOOP;

    RETURN;
  END IF;

  -- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  -- FLUJO B: RECOMPRAS MENSUALES (COMISIONES RESIDUALES)
  -- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  -- Nivel 1: Cashback (10%)
  v_amount := ROUND(v_total * v_rates[1] / 100, 2);

  INSERT INTO commissions (
    affiliate_id, originator_id, order_id, amount, level, percentage, base_amount, status, is_breakage
  ) VALUES (
    v_affiliate_id, v_affiliate_id, p_order_id,
    v_amount, 1, v_rates[1], v_total,
    'pending', FALSE
  ) ON CONFLICT DO NOTHING;

  UPDATE affiliates
  SET total_sales       = COALESCE(total_sales, 0) + v_total,
      total_commissions = COALESCE(total_commissions, 0) + v_amount
  WHERE id = v_affiliate_id;

  -- Niveles 2-10: Residuales
  FOR v_level IN 2..10 LOOP
    SELECT a.* INTO v_upline
    FROM affiliates a
    WHERE a.id = (
      SELECT referred_by FROM affiliates
      WHERE id = (
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

    -- REGLA V3: El breakage SOLO ocurre por profundidad (depth_unlocked).
    v_is_breakage := ((v_level - 1) > v_upline.depth_unlocked);
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
$function$;
