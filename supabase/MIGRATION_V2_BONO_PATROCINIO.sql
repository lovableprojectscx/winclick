-- =============================================================================
-- WinClick — Migración V2: Bono de Patrocinio (Activación)
-- Actualización de la función distribute_commissions_v2
-- =============================================================================

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
  v_package        TEXT;
  -- Tasas de comisión por nivel (Recompras)
  v_rates          NUMERIC[] := ARRAY[10, 4, 2, 2, 1, 1, 1, 3, 0.5, 0.5];
  -- Tasas fijas para Bonos de Patrocinio
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
    
    -- El afiliado que se activa NO recibe cashback.
    -- Pero SÍ suma la compra a su total_sales para su historial.
    UPDATE affiliates
    SET total_sales = COALESCE(total_sales, 0) + v_total
    WHERE id = v_affiliate_id;

    -- Dejamos un registro "rejected" de Nivel 1 en su cuenta como historial
    INSERT INTO commissions (
      affiliate_id, originator_id, order_id, amount, level, percentage, base_amount, status, is_breakage
    ) VALUES (
      v_affiliate_id, v_affiliate_id, p_order_id,
      0, 1, 0, v_total,
      'rejected', TRUE
    ) ON CONFLICT DO NOTHING;

    -- Determinar qué paquete adquirió el nuevo afiliado
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
      RETURN; -- Si no hay paquete definido, no hay bonos que repartir
    END IF;

    -- Repartir a los 4 niveles ascendentes
    FOR v_level IN 1..4 LOOP
      v_amount := v_bonus_rates[v_level];
      
      -- Si el monto es 0 (ej. nivel 2 de Básico), omitimos y pasamos al siguiente
      IF v_amount = 0 THEN CONTINUE; END IF;

      -- Buscar al patrocinador correspondiente hacia arriba
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

      -- Si llegamos a la raíz y no hay más uplines, terminamos
      IF v_upline IS NULL THEN EXIT; END IF;

      -- Breakage: el líder debe estar activo y tener profundidad suficiente para cobrar este nivel
      v_is_breakage := (v_level > v_upline.depth_unlocked) OR (v_upline.account_status != 'active');

      -- Insertamos la comisión fija (percentage = 0 porque es monto directo)
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

    RETURN; -- Fin del flujo de Activación
  END IF;

  -- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  -- FLUJO B: RECOMPRAS MENSUALES (COMISIONES RESIDUALES PORCENTUALES)
  -- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  -- Nivel 1: el propio afiliado que hizo la compra recibe cashback
  v_amount := ROUND(v_total * v_rates[1] / 100, 2);

  INSERT INTO commissions (
    affiliate_id, originator_id, order_id, amount, level, percentage, base_amount, status, is_breakage
  ) VALUES (
    v_affiliate_id, v_affiliate_id, p_order_id,
    v_amount, 1, v_rates[1], v_total,
    'pending', FALSE
  ) ON CONFLICT DO NOTHING;

  -- Actualizar historial del comprador
  UPDATE affiliates
  SET total_sales       = COALESCE(total_sales, 0) + v_total,
      total_commissions = COALESCE(total_commissions, 0) + v_amount
  WHERE id = v_affiliate_id;

  -- Niveles 2-10: recorrer uplines
  FOR v_level IN 2..10 LOOP
    -- Buscar el upline en la profundidad v_level - 1 (Sponsor Directo = Nivel 2)
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

    v_is_breakage := ((v_level - 1) > v_upline.depth_unlocked) OR (v_upline.account_status != 'active');
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
