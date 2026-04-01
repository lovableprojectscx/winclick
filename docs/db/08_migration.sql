-- =============================================================================
-- WINNER ORGANA — Migración correctiva sobre base de datos existente
-- Motor: PostgreSQL (Supabase)
-- Archivo: 08_migration.sql
-- Ejecutar en Supabase SQL Editor (no requiere Docker).
-- ⚠️  Este script modifica la BD existente sin borrar datos.
-- =============================================================================

-- Ejecutar en una sola transacción
BEGIN;

-- =============================================================================
-- 1. AFFILIATES — columnas faltantes y normalización de status
-- =============================================================================

-- 1a. Agregar package (Básico / Intermedio / VIP)
ALTER TABLE affiliates
  ADD COLUMN IF NOT EXISTS package TEXT CHECK (package IN ('Básico', 'Intermedio', 'VIP')),
  ADD COLUMN IF NOT EXISTS depth_unlocked INT NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS account_status TEXT NOT NULL DEFAULT 'active'
    CHECK (account_status IN ('pending', 'active', 'suspended')),
  ADD COLUMN IF NOT EXISTS activated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_reactivation_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS next_reactivation_due DATE;

-- 1b. Normalizar status existente (español → inglés)
--     'Activo' → account_status='active', 'Inactivo'/'Suspendido' → 'suspended'
UPDATE affiliates SET account_status = CASE
  WHEN LOWER(status) IN ('activo', 'active')        THEN 'active'
  WHEN LOWER(status) IN ('suspendido', 'suspended')  THEN 'suspended'
  WHEN LOWER(status) IN ('pendiente', 'pending')     THEN 'pending'
  ELSE 'active'
END;

-- 1c. Marcar activated_at para los ya activos
UPDATE affiliates
SET activated_at = COALESCE(created_at, NOW())
WHERE account_status = 'active' AND activated_at IS NULL;

-- 1d. depth_unlocked según package (se actualizará cuando se llene el campo package)
--     Por ahora asignar según rank para los ya existentes
UPDATE affiliates SET
  depth_unlocked = CASE rank
    WHEN 'Rango Élite' THEN 10
    WHEN 'Líder Oro'   THEN 7
    WHEN 'Líder Plata' THEN 7
    WHEN 'Emprendedor' THEN 3
    ELSE 3
  END;

-- 1e. Agregar uv_amount_month (soles UV del mes, distinto del conteo de rows)
ALTER TABLE affiliates
  ADD COLUMN IF NOT EXISTS uv_amount_month NUMERIC(10,2) NOT NULL DEFAULT 0;

COMMENT ON COLUMN affiliates.uv_current_month IS 'Conteo de unidades (rows) — deprecado, usar uv_amount_month';
COMMENT ON COLUMN affiliates.uv_amount_month   IS 'Monto en soles del volumen del mes actual';
COMMENT ON COLUMN affiliates.account_status    IS 'Estado de cuenta: pending | active | suspended';
COMMENT ON COLUMN affiliates.package           IS 'Paquete de activación: Básico | Intermedio | VIP';
COMMENT ON COLUMN affiliates.depth_unlocked    IS 'Niveles de red desbloqueados según paquete';


-- =============================================================================
-- 2. VOLUME_UNITS — agregar columna amount (monto en soles)
-- =============================================================================

ALTER TABLE volume_units
  ADD COLUMN IF NOT EXISTS amount NUMERIC(10,2) NOT NULL DEFAULT 0;

COMMENT ON COLUMN volume_units.amount IS 'Monto del pedido que generó esta unidad de volumen';

-- Rellenar amount desde orders para registros existentes
UPDATE volume_units vu
SET amount = COALESCE(o.amount, 0)
FROM orders o
WHERE vu.order_id = o.id AND vu.amount = 0;


-- =============================================================================
-- 3. ORDER_ITEMS — nueva tabla (el problema crítico: orders solo soporta 1 producto)
-- =============================================================================

CREATE TABLE IF NOT EXISTS order_items (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID        NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id  UUID        REFERENCES products(id),
  name        TEXT        NOT NULL,
  price       NUMERIC(10,2) NOT NULL,
  quantity    INT         NOT NULL DEFAULT 1 CHECK (quantity > 0),
  subtotal    NUMERIC(10,2) GENERATED ALWAYS AS (price * quantity) STORED,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- Migrar pedidos existentes (cada order tiene 1 producto → crear 1 order_item)
INSERT INTO order_items (order_id, product_id, name, price, quantity)
SELECT
  o.id,
  o.product_id,
  o.product_name,
  o.amount,    -- amount en orders es el total (con qty=1 es correcto)
  1
FROM orders o
WHERE o.product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM order_items oi WHERE oi.order_id = o.id);

COMMENT ON TABLE order_items IS 'Items de cada pedido. Los pedidos previos al 2026-03-29 tienen qty=1 migrados del campo product_id de orders.';


-- =============================================================================
-- 4. ORDERS — agregar columna affiliate_id (FK a affiliates)
-- =============================================================================

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS affiliate_id UUID REFERENCES affiliates(id);

-- Rellenar affiliate_id para pedidos existentes que tienen affiliate_store_code
UPDATE orders o
SET affiliate_id = a.id
FROM affiliates a
WHERE o.affiliate_store_code = a.affiliate_code
  AND o.affiliate_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_orders_affiliate_id ON orders(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_orders_status        ON orders(status);


-- =============================================================================
-- 5. COMMISSIONS — columnas faltantes
-- =============================================================================

ALTER TABLE commissions
  ADD COLUMN IF NOT EXISTS originator_id UUID REFERENCES affiliates(id),
  ADD COLUMN IF NOT EXISTS percentage    NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS base_amount   NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS is_breakage   BOOLEAN NOT NULL DEFAULT FALSE;

-- Marcar breakage en registros existentes (antes usaba status='breakage')
UPDATE commissions
SET is_breakage = TRUE
WHERE status = 'breakage' AND is_breakage = FALSE;

-- Normalizar status a 'pending'/'paid'/'rejected'
UPDATE commissions SET status = 'pending'  WHERE status IN ('pending', 'pendiente');
UPDATE commissions SET status = 'paid'     WHERE status IN ('paid', 'pagada', 'pagado');
UPDATE commissions SET status = 'rejected' WHERE status IN ('rejected', 'rechazada', 'breakage');

COMMENT ON COLUMN commissions.is_breakage   IS 'TRUE si el upline no tiene acceso a este nivel por su paquete o está suspendido';
COMMENT ON COLUMN commissions.originator_id IS 'Afiliado que hizo la venta que generó esta comisión';


-- =============================================================================
-- 6. AFFILIATE_PAYMENTS — nueva tabla para activaciones, reactivaciones y upgrades
--    (payment_proofs existente es solo para comprobantes de pedidos de clientes)
-- =============================================================================

CREATE TABLE IF NOT EXISTS affiliate_payments (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id         UUID        NOT NULL REFERENCES affiliates(id),
  type                 TEXT        NOT NULL CHECK (type IN ('activacion', 'reactivacion', 'upgrade', 'recarga_billetera', 'retiro')),
  status               TEXT        NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'aprobado', 'rechazado')),
  amount               NUMERIC(10,2) NOT NULL,
  receipt_url          TEXT,

  -- Solo para activacion / upgrade
  package_from         TEXT CHECK (package_from IN ('Básico', 'Intermedio', 'VIP')),
  package_to           TEXT CHECK (package_to   IN ('Básico', 'Intermedio', 'VIP')),

  -- Solo para reactivacion
  reactivation_month   DATE,   -- primer día del mes que cubre

  -- Solo para recarga_billetera
  wallet_credit_amount NUMERIC(10,2),

  -- Solo para retiro
  withdrawal_method    TEXT,   -- Yape, Plin, BCP
  withdrawal_account   TEXT,

  -- Revisión admin
  reviewed_by          UUID REFERENCES affiliates(id),
  reviewed_at          TIMESTAMPTZ,
  review_notes         TEXT,

  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_payments_affiliate ON affiliate_payments(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_payments_type      ON affiliate_payments(type);
CREATE INDEX IF NOT EXISTS idx_affiliate_payments_status    ON affiliate_payments(status);

COMMENT ON TABLE affiliate_payments IS 'Comprobantes de activación, reactivación, upgrade de paquete, recarga de billetera y retiros. Separado de payment_proofs que es para pagos de pedidos de clientes.';


-- =============================================================================
-- 7. BUSINESS_SETTINGS — agregar campo wp_conversion_rate si no existe
--    y agregar paquetes como configuración
-- =============================================================================

ALTER TABLE business_settings
  ADD COLUMN IF NOT EXISTS wp_conversion_rate     NUMERIC(10,2) NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS package_basico_price   NUMERIC(10,2) NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS package_intermedio_price NUMERIC(10,2) NOT NULL DEFAULT 2000,
  ADD COLUMN IF NOT EXISTS package_vip_price      NUMERIC(10,2) NOT NULL DEFAULT 10000,
  ADD COLUMN IF NOT EXISTS reactivation_fee       NUMERIC(10,2) NOT NULL DEFAULT 300,
  ADD COLUMN IF NOT EXISTS min_withdrawal         NUMERIC(10,2) NOT NULL DEFAULT 20;


-- =============================================================================
-- 8. FUNCIÓN CORREGIDA: calculate_affiliate_rank
--    Usa uv_amount_month (soles) en lugar de contar filas.
--    Umbrales: 0-499 / 500-999 / 1000-2499 / 2500-4999 / 5000+ soles UV
-- =============================================================================

CREATE OR REPLACE FUNCTION public.calculate_affiliate_rank(p_affiliate_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_uv_amount  NUMERIC;
  v_directos   INT;
  v_rank       TEXT;
  v_month_year TEXT := TO_CHAR(CURRENT_DATE, 'YYYY-MM');
BEGIN
  -- UV = suma de montos de ventas del mes (no conteo de filas)
  SELECT COALESCE(SUM(vu.amount), 0)
  INTO v_uv_amount
  FROM volume_units vu
  WHERE vu.affiliate_id = p_affiliate_id
    AND vu.month_year   = v_month_year;

  -- Directos activos
  SELECT COUNT(*)
  INTO v_directos
  FROM affiliates
  WHERE referred_by    = p_affiliate_id
    AND account_status = 'active';

  -- Escala de rangos
  v_rank := CASE
    WHEN v_uv_amount >= 5000 AND v_directos >= 12 THEN 'Rango Élite'
    WHEN v_uv_amount >= 2500 AND v_directos >= 8  THEN 'Líder Oro'
    WHEN v_uv_amount >= 1000 AND v_directos >= 5  THEN 'Líder Plata'
    WHEN v_uv_amount >= 500  AND v_directos >= 3  THEN 'Emprendedor'
    ELSE 'Socio Activo'
  END;

  UPDATE affiliates SET
    rank              = v_rank,
    uv_amount_month   = v_uv_amount,
    active_directos   = v_directos,
    uv_month_year     = v_month_year,
    uv_current_month  = (  -- mantener campo legacy como conteo
      SELECT COUNT(*) FROM volume_units
      WHERE affiliate_id = p_affiliate_id AND month_year = v_month_year
    )
  WHERE id = p_affiliate_id;

  RETURN v_rank;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';


-- =============================================================================
-- 9. FUNCIÓN CORREGIDA: create_order_commissions
--    Ahora usa depth_unlocked del PAQUETE del upline (no el rango UV).
--    Porcentajes fijos: 10,4,2,2,1,1,1,3,0.5,0.5
--    El spike del nivel 8 solo lo cobra quien tiene VIP (depth>=8).
-- =============================================================================

CREATE OR REPLACE FUNCTION public.create_order_commissions(
  p_order_id      UUID,
  p_order_amount  NUMERIC,
  p_affiliate_code TEXT
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
  -- Porcentajes por nivel (índice 1-10)
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

  -- Nivel 1 — el vendedor directo
  v_commission_amount := ROUND(p_order_amount * v_rates[1] / 100, 2);
  INSERT INTO commissions (affiliate_id, originator_id, order_id, amount, level, percentage, base_amount, status, is_breakage)
  VALUES (v_affiliate_id, v_affiliate_id, p_order_id, v_commission_amount, 1, v_rates[1], p_order_amount, 'pending', FALSE);

  UPDATE affiliates
  SET total_sales       = COALESCE(total_sales, 0)       + p_order_amount,
      total_commissions = COALESCE(total_commissions, 0) + v_commission_amount
  WHERE id = v_affiliate_id;

  -- Registrar UV con monto
  INSERT INTO volume_units (affiliate_id, order_id, month_year, source, amount)
  VALUES (v_affiliate_id, p_order_id, TO_CHAR(CURRENT_DATE, 'YYYY-MM'), 'purchase', p_order_amount)
  ON CONFLICT DO NOTHING;

  -- Niveles 2-10: recorrer uplines
  v_current_id := v_next_referrer_id;
  v_level      := 2;

  WHILE v_current_id IS NOT NULL AND v_level <= 10 LOOP
    PERFORM public.calculate_affiliate_rank(v_current_id);

    SELECT depth_unlocked, account_status
    INTO v_upline_depth, v_upline_status
    FROM affiliates
    WHERE id = v_current_id;

    -- Breakage: el upline no tiene acceso a este nivel O está suspendido/pendiente
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
-- 10. FUNCIÓN NUEVA: aprobar pago de afiliado
--     Llamar desde el admin al hacer click en "Aprobar".
-- =============================================================================

CREATE OR REPLACE FUNCTION public.approve_affiliate_payment(p_payment_id UUID, p_admin_id UUID)
RETURNS JSON AS $$
DECLARE
  v_pay   affiliate_payments%ROWTYPE;
  v_depth INT;
BEGIN
  SELECT * INTO v_pay FROM affiliate_payments WHERE id = p_payment_id;

  IF v_pay IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Pago no encontrado');
  END IF;

  IF v_pay.status != 'pendiente' THEN
    RETURN json_build_object('success', false, 'error', 'El pago ya fue procesado');
  END IF;

  -- ── ACTIVACIÓN ────────────────────────────────────────────────────────────
  IF v_pay.type = 'activacion' THEN
    SELECT CASE v_pay.package_to
      WHEN 'VIP'        THEN 10
      WHEN 'Intermedio' THEN 7
      ELSE 3
    END INTO v_depth;

    UPDATE affiliates SET
      account_status       = 'active',
      package              = v_pay.package_to,
      depth_unlocked       = v_depth,
      activated_at         = NOW(),
      last_reactivation_at = NOW(),
      next_reactivation_due = (DATE_TRUNC('month', NOW()) + INTERVAL '1 month')::DATE,
      status               = 'Activo'   -- mantener campo legacy
    WHERE id = v_pay.affiliate_id;

  -- ── REACTIVACIÓN ──────────────────────────────────────────────────────────
  ELSIF v_pay.type = 'reactivacion' THEN
    UPDATE affiliates SET
      account_status       = 'active',
      suspended_at         = NULL,
      last_reactivation_at = NOW(),
      next_reactivation_due = (v_pay.reactivation_month + INTERVAL '1 month')::DATE,
      status               = 'Activo'
    WHERE id = v_pay.affiliate_id;

  -- ── UPGRADE ───────────────────────────────────────────────────────────────
  ELSIF v_pay.type = 'upgrade' THEN
    SELECT CASE v_pay.package_to
      WHEN 'VIP'        THEN 10
      WHEN 'Intermedio' THEN 7
      ELSE 3
    END INTO v_depth;

    UPDATE affiliates SET
      package        = v_pay.package_to,
      depth_unlocked = v_depth
    WHERE id = v_pay.affiliate_id;

  -- ── RECARGA BILLETERA ─────────────────────────────────────────────────────
  ELSIF v_pay.type = 'recarga_billetera' THEN
    -- Actualizar user_credits existente
    UPDATE user_credits
    SET balance    = balance + v_pay.wallet_credit_amount,
        updated_at = NOW()
    WHERE user_id = (SELECT user_id FROM affiliates WHERE id = v_pay.affiliate_id);

    IF NOT FOUND THEN
      INSERT INTO user_credits (user_id, email, balance)
      SELECT user_id, email, v_pay.wallet_credit_amount
      FROM affiliates WHERE id = v_pay.affiliate_id;
    END IF;

    INSERT INTO credit_transactions (user_credit_id, amount, type, description)
    SELECT uc.id, v_pay.wallet_credit_amount, 'topup', 'Recarga de billetera'
    FROM user_credits uc
    JOIN affiliates a ON a.user_id = uc.user_id
    WHERE a.id = v_pay.affiliate_id;

  -- ── RETIRO ────────────────────────────────────────────────────────────────
  ELSIF v_pay.type = 'retiro' THEN
    -- Verificar saldo suficiente
    IF (SELECT balance FROM user_credits WHERE user_id = (SELECT user_id FROM affiliates WHERE id = v_pay.affiliate_id)) < v_pay.amount THEN
      RETURN json_build_object('success', false, 'error', 'Saldo insuficiente');
    END IF;

    UPDATE user_credits
    SET balance    = balance - v_pay.amount,
        updated_at = NOW()
    WHERE user_id = (SELECT user_id FROM affiliates WHERE id = v_pay.affiliate_id);

    INSERT INTO credit_transactions (user_credit_id, amount, type, description)
    SELECT uc.id, v_pay.amount, 'withdrawal', 'Retiro vía ' || v_pay.withdrawal_method
    FROM user_credits uc
    JOIN affiliates a ON a.user_id = uc.user_id
    WHERE a.id = v_pay.affiliate_id;
  END IF;

  -- Marcar como aprobado
  UPDATE affiliate_payments SET
    status      = 'aprobado',
    reviewed_by = p_admin_id,
    reviewed_at = NOW(),
    updated_at  = NOW()
  WHERE id = p_payment_id;

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';


-- =============================================================================
-- 11. FUNCIÓN NUEVA: suspender afiliados con reactivación vencida
--     Ejecutar diariamente (via Supabase Edge Function cron o pg_cron).
-- =============================================================================

CREATE OR REPLACE FUNCTION public.suspend_overdue_affiliates()
RETURNS INT AS $$
DECLARE
  v_count INT;
BEGIN
  UPDATE affiliates SET
    account_status = 'suspended',
    suspended_at   = NOW(),
    status         = 'Suspendido'
  WHERE account_status     = 'active'
    AND next_reactivation_due IS NOT NULL
    AND next_reactivation_due < CURRENT_DATE;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';


-- =============================================================================
-- 12. TRIGGER: updated_at automático para affiliate_payments
-- =============================================================================

CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_affiliate_payments_updated_at ON affiliate_payments;
CREATE TRIGGER trg_affiliate_payments_updated_at
  BEFORE UPDATE ON affiliate_payments
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();


-- =============================================================================
-- 13. RLS para las tablas nuevas
-- =============================================================================

-- order_items: acceso igual que orders
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "order_items: select via order"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_items.order_id
        AND (
          o.affiliate_id = (SELECT id FROM affiliates WHERE user_id = auth.uid())
          OR (SELECT role FROM user_roles WHERE user_id = auth.uid()) = 'admin'
        )
    )
  );

CREATE POLICY "order_items: insert"
  ON order_items FOR INSERT WITH CHECK (TRUE);

-- affiliate_payments: afiliado ve los suyos, admin ve todos
ALTER TABLE affiliate_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "affiliate_payments: select own"
  ON affiliate_payments FOR SELECT
  USING (
    affiliate_id = (SELECT id FROM affiliates WHERE user_id = auth.uid())
    OR (SELECT role FROM user_roles WHERE user_id = auth.uid()) = 'admin'
  );

CREATE POLICY "affiliate_payments: insert own"
  ON affiliate_payments FOR INSERT
  WITH CHECK (
    affiliate_id = (SELECT id FROM affiliates WHERE user_id = auth.uid())
  );

CREATE POLICY "affiliate_payments: admin update"
  ON affiliate_payments FOR UPDATE
  USING ((SELECT role FROM user_roles WHERE user_id = auth.uid()) = 'admin');


-- =============================================================================
-- FIN DE MIGRACIÓN
-- =============================================================================

COMMIT;

-- Verificación post-migración
SELECT
  'affiliates columns'  AS check_name,
  COUNT(*)              AS result
FROM information_schema.columns
WHERE table_name = 'affiliates' AND column_name IN ('package','account_status','depth_unlocked','uv_amount_month')

UNION ALL

SELECT 'order_items table', COUNT(*) FROM information_schema.tables
WHERE table_name = 'order_items'

UNION ALL

SELECT 'affiliate_payments table', COUNT(*) FROM information_schema.tables
WHERE table_name = 'affiliate_payments'

UNION ALL

SELECT 'order_items migrated', COUNT(*) FROM order_items

UNION ALL

SELECT 'commissions is_breakage col', COUNT(*) FROM information_schema.columns
WHERE table_name = 'commissions' AND column_name = 'is_breakage';
