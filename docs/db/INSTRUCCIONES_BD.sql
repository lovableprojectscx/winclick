-- =============================================================================
-- WINNER ORGANA — Diagnóstico y corrección de BD
-- Motor: PostgreSQL (Supabase SQL Editor)
-- =============================================================================
-- INSTRUCCIONES:
--   Ejecuta cada BLOQUE por separado en el SQL Editor de Supabase.
--   Lee el resultado antes de pasar al siguiente.
--   Los bloques están numerados: PASO 1, PASO 2, etc.
-- =============================================================================


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- PASO 1 — Diagnóstico general
-- Ejecuta esto primero. Te dice exactamente qué columnas y funciones existen.
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SELECT
  '1. affiliates.package'              AS check_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='affiliates' AND column_name='package'
  ) THEN '✅ existe' ELSE '❌ FALTA — ejecuta PASO 2A' END AS resultado

UNION ALL SELECT
  '2. affiliates.account_status',
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='affiliates' AND column_name='account_status'
  ) THEN '✅ existe' ELSE '❌ FALTA — ejecuta PASO 2A' END

UNION ALL SELECT
  '3. affiliates.total_sales',
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='affiliates' AND column_name='total_sales'
  ) THEN '✅ existe' ELSE '❌ FALTA — ejecuta PASO 2A' END

UNION ALL SELECT
  '4. affiliates.depth_unlocked',
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='affiliates' AND column_name='depth_unlocked'
  ) THEN '✅ existe' ELSE '❌ FALTA — ejecuta PASO 2A' END

UNION ALL SELECT
  '5. orders.is_activation_order',
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='orders' AND column_name='is_activation_order'
  ) THEN '✅ existe' ELSE '❌ FALTA — ejecuta PASO 3' END

UNION ALL SELECT
  '6. orders.affiliate_id',
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='orders' AND column_name='affiliate_id'
  ) THEN '✅ existe' ELSE '❌ FALTA — ejecuta PASO 2A' END

UNION ALL SELECT
  '7. products.public_price',
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='products' AND column_name='public_price'
  ) THEN '✅ existe' ELSE '❌ FALTA — ejecuta PASO 2B' END

UNION ALL SELECT
  '8. products.partner_price',
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='products' AND column_name='partner_price'
  ) THEN '✅ existe' ELSE '❌ FALTA — ejecuta PASO 2B' END

UNION ALL SELECT
  '9. affiliate_payments tabla',
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name='affiliate_payments'
  ) THEN '✅ existe' ELSE '❌ FALTA — ejecuta PASO 2A' END

UNION ALL SELECT
  '10. business_settings tabla',
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name='business_settings'
  ) THEN '✅ existe' ELSE '❌ FALTA — ejecuta PASO 2C' END

UNION ALL SELECT
  '11. business_settings.package_basico_price valor',
  COALESCE(
    (SELECT CASE WHEN package_basico_price = 120 THEN '✅ es 120'
                 ELSE '⚠️ es ' || package_basico_price || ' — ejecuta PASO 4'
            END FROM business_settings LIMIT 1),
    '❌ FALTA fila — ejecuta PASO 2C'
  )

UNION ALL SELECT
  '12. order_items tabla',
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name='order_items'
  ) THEN '✅ existe' ELSE '❌ FALTA — ejecuta PASO 2A' END

UNION ALL SELECT
  '13. fn create_order_commissions',
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.routines
    WHERE routine_name='create_order_commissions'
  ) THEN '✅ existe' ELSE '❌ FALTA — ejecuta PASO 5' END

UNION ALL SELECT
  '14. trigger comisiones en delivery',
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_name IN ('trg_commissions_on_delivery','trg_distribute_commissions')
  ) THEN '✅ existe' ELSE '❌ FALTA — ejecuta PASO 5' END

UNION ALL SELECT
  '15. products con public_price NULL',
  (SELECT COUNT(*)::TEXT || ' productos sin public_price'
   FROM products WHERE public_price IS NULL)

ORDER BY check_name;


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- PASO 2A — Solo si el PASO 1 mostró ❌ en affiliates, orders o affiliate_payments
-- Agrega las columnas que faltan a las tablas existentes.
-- Es seguro ejecutar aunque ya existan (usa IF NOT EXISTS).
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALTER TABLE affiliates
  ADD COLUMN IF NOT EXISTS package TEXT CHECK (package IN ('Básico','Intermedio','VIP')),
  ADD COLUMN IF NOT EXISTS depth_unlocked INT NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS account_status TEXT NOT NULL DEFAULT 'active'
    CHECK (account_status IN ('pending','active','suspended')),
  ADD COLUMN IF NOT EXISTS activated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_reactivation_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS next_reactivation_due DATE,
  ADD COLUMN IF NOT EXISTS total_sales NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_commissions NUMERIC(10,2) NOT NULL DEFAULT 0;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS affiliate_id UUID REFERENCES affiliates(id),
  ADD COLUMN IF NOT EXISTS order_number TEXT,
  ADD COLUMN IF NOT EXISTS customer_phone TEXT,
  ADD COLUMN IF NOT EXISTS customer_dni TEXT,
  ADD COLUMN IF NOT EXISTS shipping_address TEXT,
  ADD COLUMN IF NOT EXISTS shipping_city TEXT,
  ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cash',
  ADD COLUMN IF NOT EXISTS shipping_voucher_url TEXT;

CREATE TABLE IF NOT EXISTS order_items (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID          NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id  UUID          REFERENCES products(id),
  name        TEXT          NOT NULL,
  price       NUMERIC(10,2) NOT NULL,
  quantity    INT           NOT NULL DEFAULT 1 CHECK (quantity > 0),
  subtotal    NUMERIC(10,2) GENERATED ALWAYS AS (price * quantity) STORED,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS affiliate_payments (
  id                   UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id         UUID          NOT NULL REFERENCES affiliates(id),
  type                 TEXT          NOT NULL CHECK (type IN ('activacion','reactivacion','upgrade','recarga_billetera','retiro')),
  status               TEXT          NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente','aprobado','rechazado')),
  amount               NUMERIC(10,2) NOT NULL,
  receipt_url          TEXT,
  package_from         TEXT          CHECK (package_from IN ('Básico','Intermedio','VIP')),
  package_to           TEXT          CHECK (package_to   IN ('Básico','Intermedio','VIP')),
  reactivation_month   DATE,
  wallet_credit_amount NUMERIC(10,2),
  withdrawal_method    TEXT,
  withdrawal_account   TEXT,
  reviewed_by          UUID          REFERENCES affiliates(id),
  reviewed_at          TIMESTAMPTZ,
  review_notes         TEXT,
  created_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- PASO 2B — Solo si el PASO 1 mostró ❌ en public_price o partner_price
-- Agrega columnas de precio a products.
-- IMPORTANTE: Después de agregar, debes rellenar los valores manualmente
--             desde el panel de Supabase (Table Editor → products).
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS public_price  NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS partner_price NUMERIC(10,2);

-- Si tienes products con la columna "price" y quieres calcular automáticamente:
-- public_price  = price (el precio actual IS el precio público)
-- partner_price = price * 0.50 (50% del precio público = precio socio activo)

UPDATE products
SET
  public_price  = COALESCE(public_price, price),
  partner_price = COALESCE(partner_price, ROUND(price * 0.50, 2))
WHERE public_price IS NULL OR partner_price IS NULL;

-- Verificar resultado:
-- SELECT name, price, public_price, partner_price FROM products LIMIT 10;


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- PASO 2C — Solo si el PASO 1 mostró ❌ en business_settings
-- Crea la tabla y la fila de configuración inicial.
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS business_settings (
  id                      UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name           TEXT          NOT NULL DEFAULT 'Winclick',
  package_basico_price    NUMERIC(10,2) NOT NULL DEFAULT 120,
  package_intermedio_price NUMERIC(10,2) NOT NULL DEFAULT 2000,
  package_vip_price       NUMERIC(10,2) NOT NULL DEFAULT 10000,
  reactivation_fee        NUMERIC(10,2) NOT NULL DEFAULT 300,
  partner_price_base      NUMERIC(10,2) NOT NULL DEFAULT 0.50,
  public_price_base       NUMERIC(10,2) NOT NULL DEFAULT 1.00,
  commission_level_1      NUMERIC(5,2)  NOT NULL DEFAULT 10,
  commission_level_2      NUMERIC(5,2)  NOT NULL DEFAULT 4,
  commission_level_3      NUMERIC(5,2)  NOT NULL DEFAULT 2,
  commission_level_4      NUMERIC(5,2)  NOT NULL DEFAULT 2,
  commission_level_5      NUMERIC(5,2)  NOT NULL DEFAULT 1,
  commission_level_6      NUMERIC(5,2)  NOT NULL DEFAULT 1,
  commission_level_7      NUMERIC(5,2)  NOT NULL DEFAULT 1,
  commission_level_8      NUMERIC(5,2)  NOT NULL DEFAULT 3,
  commission_level_9      NUMERIC(5,2)  NOT NULL DEFAULT 0.5,
  commission_level_10     NUMERIC(5,2)  NOT NULL DEFAULT 0.5,
  company_profit_percentage NUMERIC(5,2) NOT NULL DEFAULT 25,
  min_withdrawal          NUMERIC(10,2) NOT NULL DEFAULT 20,
  wp_conversion_rate      NUMERIC(10,2) NOT NULL DEFAULT 1,
  yape_number             TEXT,
  plin_number             TEXT,
  yape_qr_url             TEXT,
  whatsapp_number         TEXT,
  account_holder_name     TEXT,
  bank_name               TEXT,
  bank_account            TEXT,
  logo_url                TEXT,
  contact_email           TEXT,
  contact_phone           TEXT,
  address                 TEXT,
  notify_new_affiliates   BOOLEAN       NOT NULL DEFAULT TRUE,
  notify_new_orders       BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Insertar fila si no existe
INSERT INTO business_settings (business_name)
SELECT 'Winclick'
WHERE NOT EXISTS (SELECT 1 FROM business_settings);


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- PASO 3 — Agregar columna is_activation_order
-- SIEMPRE ejecutar esto si el PASO 1 mostró ❌ en "orders.is_activation_order".
-- Marca automáticamente como TRUE las órdenes de afiliados pendientes.
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

-- Verificar:
-- SELECT COUNT(*) as activation_orders FROM orders WHERE is_activation_order = TRUE;


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- PASO 4 — Corregir precio del plan Básico
-- SIEMPRE ejecutar si el PASO 1 mostró "⚠️ es 100" en package_basico_price.
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

UPDATE business_settings
SET package_basico_price = 120
WHERE package_basico_price <> 120;

-- Verificar:
-- SELECT package_basico_price, package_intermedio_price, package_vip_price FROM business_settings;
-- Debe devolver: 120 | 2000 | 10000


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- PASO 5 — Función y trigger de comisiones actualizado
-- SIEMPRE ejecutar. Reemplaza cualquier versión anterior (CREATE OR REPLACE).
-- Esto garantiza que las órdenes de activación NO generen comisiones de red.
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
-- PASO 6 — Verificación final
-- Ejecuta esto al terminar. Todo debe mostrar ✅
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
