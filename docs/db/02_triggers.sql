-- =============================================================================
-- WINNER ORGANA — Triggers y funciones automáticas
-- Motor: PostgreSQL (Supabase)
-- Archivo: 02_triggers.sql
-- Ejecutar después de 01_schema.sql
-- =============================================================================


-- =============================================================================
-- TRIGGER: updated_at automático
-- =============================================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_stores_updated_at
  BEFORE UPDATE ON affiliate_stores
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- =============================================================================
-- TRIGGER: Generar affiliate_code al registrarse
-- Se ejecuta al insertar en profiles si el rol es affiliate.
-- =============================================================================

CREATE OR REPLACE FUNCTION generate_affiliate_code()
RETURNS TRIGGER AS $$
DECLARE
  prefix TEXT;
  code   TEXT;
  suffix INT;
BEGIN
  IF NEW.role = 'affiliate' AND NEW.affiliate_code IS NULL THEN
    prefix := 'WIN-' || UPPER(SUBSTRING(NEW.name FROM 1 FOR 3));
    suffix := FLOOR(RANDOM() * 900 + 100)::INT;
    code   := prefix || suffix::TEXT;

    -- Garantizar unicidad
    WHILE EXISTS (SELECT 1 FROM profiles WHERE affiliate_code = code) LOOP
      suffix := FLOOR(RANDOM() * 900 + 100)::INT;
      code   := prefix || suffix::TEXT;
    END LOOP;

    NEW.affiliate_code := code;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_affiliate_code
  BEFORE INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION generate_affiliate_code();


-- =============================================================================
-- TRIGGER: Crear tienda vacía al activar un afiliado
-- =============================================================================

CREATE OR REPLACE FUNCTION create_store_on_activation()
RETURNS TRIGGER AS $$
BEGIN
  -- Si la cuenta pasa de pending/suspended a active y no tiene tienda aún
  IF NEW.account_status = 'active' AND OLD.account_status != 'active' THEN
    INSERT INTO affiliate_stores (affiliate_id, store_name, tagline, active)
    VALUES (NEW.id, NEW.name || ' Store', 'Productos naturales de calidad', FALSE)
    ON CONFLICT (affiliate_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_create_store_on_activation
  AFTER UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION create_store_on_activation();


-- =============================================================================
-- TRIGGER: Generar número de orden (WO-XXXX)
-- =============================================================================

CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number := 'WO-' || LPAD(NEXTVAL('order_number_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  WHEN (NEW.order_number IS NULL OR NEW.order_number = '')
  EXECUTE FUNCTION generate_order_number();


-- =============================================================================
-- TRIGGER: Descontar stock al confirmar un pedido
-- =============================================================================

CREATE OR REPLACE FUNCTION decrement_stock_on_order()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo descontar cuando el pedido pasa a 'procesando' o 'enviado' por primera vez
  IF NEW.status IN ('procesando', 'enviado') AND OLD.status = 'pendiente' THEN
    UPDATE products p
    SET stock = p.stock - oi.quantity
    FROM order_items oi
    WHERE oi.order_id = NEW.id
      AND oi.product_id = p.id;
  END IF;

  -- Restaurar stock si se cancela antes de procesarse
  IF NEW.status = 'cancelado' AND OLD.status IN ('procesando', 'enviado') THEN
    UPDATE products p
    SET stock = p.stock + oi.quantity
    FROM order_items oi
    WHERE oi.order_id = NEW.id
      AND oi.product_id = p.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_decrement_stock
  AFTER UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION decrement_stock_on_order();


-- =============================================================================
-- FUNCIÓN: Calcular y distribuir comisiones al confirmar un pedido
-- Recorre la red upline del afiliado hasta el nivel máximo de su paquete.
-- Aplica "breakage" si algún nivel del upline no tiene acceso a ese nivel.
-- =============================================================================

CREATE OR REPLACE FUNCTION distribute_commissions(p_order_id UUID)
RETURNS VOID AS $$
DECLARE
  v_order         RECORD;
  v_item          RECORD;
  v_level_row     RECORD;
  v_upline        RECORD;
  v_amount        NUMERIC(10,2);
  v_is_breakage   BOOLEAN;
BEGIN
  SELECT * INTO v_order FROM orders WHERE id = p_order_id;

  IF v_order.affiliate_id IS NULL THEN
    RETURN; -- pedido sin afiliado, sin comisiones
  END IF;

  -- Por cada item del pedido
  FOR v_item IN
    SELECT * FROM order_items WHERE order_id = p_order_id
  LOOP
    -- Por cada nivel de comisión (1-10)
    FOR v_level_row IN
      SELECT * FROM commission_levels ORDER BY level
    LOOP
      -- Buscar el upline en ese nivel de profundidad
      SELECT p.* INTO v_upline
      FROM affiliate_network an
      JOIN profiles p ON p.id = an.upline_id
      WHERE an.downline_id = v_order.affiliate_id
        AND an.depth = v_level_row.level;

      IF NOT FOUND THEN
        EXIT; -- no hay más uplines, fin del árbol
      END IF;

      -- Verificar si el upline tiene acceso a este nivel según su paquete
      v_is_breakage := NOT (v_level_row.requires_package @> ARRAY[v_upline.package]::package_type[]);

      -- Si la cuenta del upline está suspendida, es breakage
      IF v_upline.account_status != 'active' THEN
        v_is_breakage := TRUE;
      END IF;

      -- Calcular monto
      v_amount := ROUND((v_item.price * v_item.quantity) * (v_level_row.percentage / 100), 2);

      -- Insertar registro de comisión
      INSERT INTO commissions (
        order_id, order_item_id, beneficiary_id, originator_id,
        level, percentage, base_amount, amount, status, is_breakage
      ) VALUES (
        p_order_id,
        v_item.id,
        v_upline.id,
        v_order.affiliate_id,
        v_level_row.level,
        v_level_row.percentage,
        v_item.price * v_item.quantity,
        v_amount,
        CASE WHEN v_is_breakage THEN 'rechazada' ELSE 'pendiente' END,
        v_is_breakage
      );

    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger que llama a distribute_commissions cuando un pedido se procesa
CREATE OR REPLACE FUNCTION trigger_distribute_commissions()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'procesando' AND OLD.status = 'pendiente' THEN
    PERFORM distribute_commissions(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_distribute_commissions
  AFTER UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION trigger_distribute_commissions();


-- =============================================================================
-- FUNCIÓN: Acreditar comisión a billetera
-- Llamada cuando una comisión pasa a status='pagada'.
-- =============================================================================

CREATE OR REPLACE FUNCTION credit_commission_to_wallet()
RETURNS TRIGGER AS $$
DECLARE
  v_new_balance NUMERIC(10,2);
BEGIN
  IF NEW.status = 'pagada' AND OLD.status = 'pendiente' THEN
    -- Actualizar saldo
    UPDATE profiles
    SET wallet_balance      = wallet_balance + NEW.amount,
        total_commissions   = total_commissions + NEW.amount
    WHERE id = NEW.beneficiary_id
    RETURNING wallet_balance INTO v_new_balance;

    -- Registrar transacción
    INSERT INTO wallet_transactions
      (affiliate_id, type, amount, balance_after, description, reference_id, reference_type)
    VALUES
      (NEW.beneficiary_id, 'credit', NEW.amount, v_new_balance,
       'Comisión nivel ' || NEW.level || ' — pedido ' || (SELECT order_number FROM orders WHERE id = NEW.order_id),
       NEW.id, 'commission');

    NEW.paid_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_credit_commission
  BEFORE UPDATE ON commissions
  FOR EACH ROW EXECUTE FUNCTION credit_commission_to_wallet();


-- =============================================================================
-- FUNCIÓN: Aprobar pago (activacion / reactivacion / upgrade / recarga / retiro)
-- Llamada cuando payments.status cambia a 'aprobado'.
-- =============================================================================

CREATE OR REPLACE FUNCTION process_payment_approval()
RETURNS TRIGGER AS $$
DECLARE
  v_new_balance NUMERIC(10,2);
  v_depth       INT;
BEGIN
  IF NEW.status != 'aprobado' OR OLD.status != 'pendiente' THEN
    RETURN NEW;
  END IF;

  -- ── ACTIVACIÓN ────────────────────────────────────────────────────────────
  IF NEW.type = 'activacion' THEN
    SELECT depth_unlocked INTO v_depth FROM packages WHERE name = NEW.package_to;

    UPDATE profiles SET
      account_status        = 'active',
      package               = NEW.package_to,
      depth_unlocked        = v_depth,
      activated_at          = NOW(),
      last_reactivation_at  = NOW(),
      next_reactivation_due = (DATE_TRUNC('month', NOW()) + INTERVAL '1 month')::DATE
    WHERE id = NEW.affiliate_id;

  -- ── REACTIVACIÓN ──────────────────────────────────────────────────────────
  ELSIF NEW.type = 'reactivacion' THEN
    UPDATE profiles SET
      account_status        = 'active',
      last_reactivation_at  = NOW(),
      suspended_at          = NULL,
      next_reactivation_due = (NEW.reactivation_month + INTERVAL '1 month')::DATE
    WHERE id = NEW.affiliate_id;

  -- ── UPGRADE ───────────────────────────────────────────────────────────────
  ELSIF NEW.type = 'upgrade' THEN
    SELECT depth_unlocked INTO v_depth FROM packages WHERE name = NEW.package_to;

    UPDATE profiles SET
      package        = NEW.package_to,
      depth_unlocked = v_depth
    WHERE id = NEW.affiliate_id;

  -- ── RECARGA BILLETERA ─────────────────────────────────────────────────────
  ELSIF NEW.type = 'recarga_billetera' THEN
    UPDATE profiles
    SET wallet_balance = wallet_balance + NEW.wallet_credit_amount
    WHERE id = NEW.affiliate_id
    RETURNING wallet_balance INTO v_new_balance;

    INSERT INTO wallet_transactions
      (affiliate_id, type, amount, balance_after, description, reference_id, reference_type)
    VALUES
      (NEW.affiliate_id, 'credit', NEW.wallet_credit_amount, v_new_balance,
       'Recarga de billetera', NEW.id, 'payment');

  -- ── RETIRO ────────────────────────────────────────────────────────────────
  ELSIF NEW.type = 'retiro' THEN
    UPDATE profiles
    SET wallet_balance = wallet_balance - NEW.amount
    WHERE id = NEW.affiliate_id
    RETURNING wallet_balance INTO v_new_balance;

    INSERT INTO wallet_transactions
      (affiliate_id, type, amount, balance_after, description, reference_id, reference_type)
    VALUES
      (NEW.affiliate_id, 'debit', NEW.amount, v_new_balance,
       'Retiro vía ' || NEW.withdrawal_method, NEW.id, 'payment');
  END IF;

  NEW.reviewed_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_process_payment_approval
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION process_payment_approval();


-- =============================================================================
-- FUNCIÓN: Registrar en affiliate_network al activarse un afiliado
-- Recorre todos los uplines del referidor y cierra las relaciones transitivas.
-- =============================================================================

CREATE OR REPLACE FUNCTION build_network_on_activation()
RETURNS TRIGGER AS $$
DECLARE
  v_current_id  UUID;
  v_depth       INT;
BEGIN
  IF NEW.account_status = 'active' AND OLD.account_status != 'active'
     AND NEW.referrer_id IS NOT NULL THEN

    -- Insertar relación directa (depth=1)
    INSERT INTO affiliate_network (upline_id, downline_id, depth)
    VALUES (NEW.referrer_id, NEW.id, 1)
    ON CONFLICT DO NOTHING;

    -- Insertar relaciones transitivas hacia arriba (depth=2..10)
    v_current_id := NEW.referrer_id;
    v_depth      := 2;

    LOOP
      SELECT referrer_id INTO v_current_id FROM profiles WHERE id = v_current_id;
      EXIT WHEN v_current_id IS NULL OR v_depth > 10;

      INSERT INTO affiliate_network (upline_id, downline_id, depth)
      VALUES (v_current_id, NEW.id, v_depth)
      ON CONFLICT DO NOTHING;

      v_depth := v_depth + 1;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_build_network
  AFTER UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION build_network_on_activation();


-- =============================================================================
-- FUNCIÓN: Suspender afiliados con reactivación vencida (para cron diario)
-- =============================================================================

CREATE OR REPLACE FUNCTION suspend_overdue_affiliates()
RETURNS INT AS $$
DECLARE
  v_count INT;
BEGIN
  UPDATE profiles
  SET account_status = 'suspended',
      suspended_at   = NOW()
  WHERE account_status = 'active'
    AND next_reactivation_due < CURRENT_DATE
    AND role = 'affiliate';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =============================================================================
-- FUNCIÓN: Recalcular UV del mes (para cron mensual)
-- UV = sum de ventas del afiliado + ventas de su red en el mes actual
-- =============================================================================

CREATE OR REPLACE FUNCTION recalculate_uv_month()
RETURNS VOID AS $$
BEGIN
  UPDATE profiles p
  SET uv_month = (
    SELECT COALESCE(SUM(o.total), 0)
    FROM orders o
    WHERE o.affiliate_id = p.id
      AND DATE_TRUNC('month', o.created_at) = DATE_TRUNC('month', NOW())
      AND o.status IN ('procesando', 'enviado', 'entregado')
  )
  WHERE role = 'affiliate';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
