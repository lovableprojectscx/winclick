-- =============================================================================
-- ⚠️  NO EJECUTAR — REDUNDANTE
-- El trigger `handle_order_status_change` ya existente en el DB vivo
-- maneja la reactivación automática. Ejecutar este archivo crearía
-- un trigger duplicado con comportamiento idéntico.
-- Conservado solo como documentación de referencia.
-- =============================================================================
--
-- REACTIVACIÓN AUTOMÁTICA POR COMPRAS DEL CATÁLOGO
-- (referencia — ver handle_order_status_change en el DB vivo)
--
-- Lógica: cuando admin marca un pedido como "entregado",
--         si el afiliado vinculado (affiliate_id) alcanzó S/reactivation_fee
--         en pedidos entregados este mes Y estaba suspendido
--         → se reactiva automáticamente sin acción adicional del admin.
--
-- NOTA: affiliate_id en orders = el "comisionista" (referidor).
--       En la práctica, cuando el afiliado compra para sí mismo usando
--       su propio código, affiliate_id = su propio ID.
--       Para distinguir compras personales de ventas a clientes se
--       necesitaría un campo buyer_affiliate_id (mejora futura).
-- =============================================================================

CREATE OR REPLACE FUNCTION check_reactivation_on_delivery()
RETURNS TRIGGER AS $$
DECLARE
  v_reactivation_fee NUMERIC(10,2);
  v_monthly_total    NUMERIC(10,2);
  v_status           TEXT;
BEGIN
  -- Solo cuando el estado cambia a 'entregado'
  IF NEW.status != 'entregado' OR OLD.status = 'entregado' THEN
    RETURN NEW;
  END IF;

  -- Solo si el pedido tiene afiliado vinculado
  IF NEW.affiliate_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Obtener estado actual de la cuenta del afiliado
  SELECT account_status INTO v_status
  FROM affiliates
  WHERE id = NEW.affiliate_id;

  -- Solo procesar si está suspendido
  IF v_status IS DISTINCT FROM 'suspended' THEN
    RETURN NEW;
  END IF;

  -- Obtener fee de reactivación configurado
  SELECT COALESCE(reactivation_fee, 300) INTO v_reactivation_fee
  FROM business_settings
  LIMIT 1;

  -- Sumar pedidos entregados del afiliado en el mes actual
  -- El trigger es AFTER UPDATE, por lo que el row actual ya está con status='entregado'
  SELECT COALESCE(SUM(total), 0) INTO v_monthly_total
  FROM orders
  WHERE affiliate_id = NEW.affiliate_id
    AND status = 'entregado'
    AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW());

  -- Si alcanzó el umbral → reactivar automáticamente
  IF v_monthly_total >= v_reactivation_fee THEN
    UPDATE affiliates
    SET
      account_status        = 'active',
      status                = 'Activo',   -- campo legacy
      last_reactivation_at  = NOW(),
      suspended_at          = NULL,
      next_reactivation_due = (DATE_TRUNC('month', NOW()) + INTERVAL '1 month')::DATE
    WHERE id = NEW.affiliate_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- Crear el trigger (eliminar si ya existe)
DROP TRIGGER IF EXISTS trg_reactivation_on_delivery ON orders;

CREATE TRIGGER trg_reactivation_on_delivery
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION check_reactivation_on_delivery();
