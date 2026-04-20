-- =============================================================================
-- WinClick — Schema principal
-- Motor: PostgreSQL (Supabase)
-- Archivo: 01_schema.sql
-- Ejecutar primero. Crea todas las tablas del sistema.
-- =============================================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- ENUM TYPES
-- =============================================================================

CREATE TYPE package_type    AS ENUM ('Básico', 'Intermedio', 'VIP');
CREATE TYPE account_status  AS ENUM ('pending', 'active', 'suspended');
CREATE TYPE user_role       AS ENUM ('affiliate', 'admin');

CREATE TYPE order_status    AS ENUM ('pendiente', 'procesando', 'enviado', 'entregado', 'cancelado');
CREATE TYPE payment_method  AS ENUM ('wallet', 'cash');

CREATE TYPE payment_type    AS ENUM ('activacion', 'reactivacion', 'upgrade', 'recarga_billetera', 'retiro');
CREATE TYPE payment_status  AS ENUM ('pendiente', 'aprobado', 'rechazado');

CREATE TYPE commission_status AS ENUM ('pendiente', 'pagada', 'rechazada');
CREATE TYPE tx_type         AS ENUM ('credit', 'debit');
CREATE TYPE tx_status       AS ENUM ('completada', 'pendiente', 'revertida');


-- =============================================================================
-- 1. USUARIOS / AFILIADOS
-- Extiende la tabla auth.users de Supabase.
-- =============================================================================

CREATE TABLE profiles (
  id                UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name              TEXT        NOT NULL,
  dni               TEXT        NOT NULL,
  yape_phone        TEXT,
  role              user_role   NOT NULL DEFAULT 'affiliate',

  -- Datos del afiliado
  affiliate_code    TEXT        UNIQUE,          -- WIN-MAR001
  referrer_id       UUID        REFERENCES profiles(id),   -- quien lo refirió
  package           package_type,
  account_status    account_status NOT NULL DEFAULT 'pending',
  depth_unlocked    INT         NOT NULL DEFAULT 3,        -- niveles desbloqueados según paquete

  -- Métricas calculadas (actualizadas por triggers/cron)
  wallet_balance    NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_sales       NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_commissions NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_referrals   INT           NOT NULL DEFAULT 0,
  uv_month          NUMERIC(10,2) NOT NULL DEFAULT 0,      -- Unidades de Volumen del mes actual

  -- Fechas clave
  joined_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  activated_at      TIMESTAMPTZ,
  suspended_at      TIMESTAMPTZ,
  last_reactivation_at TIMESTAMPTZ,
  next_reactivation_due DATE,                              -- fecha límite del próximo S/300

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices frecuentes
CREATE INDEX idx_profiles_referrer    ON profiles(referrer_id);
CREATE INDEX idx_profiles_code        ON profiles(affiliate_code);
CREATE INDEX idx_profiles_status      ON profiles(account_status);


-- =============================================================================
-- 2. PAQUETES (configuración central, no hardcodeada)
-- =============================================================================

CREATE TABLE packages (
  id                  SERIAL      PRIMARY KEY,
  name                package_type UNIQUE NOT NULL,
  investment_amount   NUMERIC(10,2) NOT NULL,   -- costo de activación (S/100, 2000, 10000)
  depth_unlocked      INT         NOT NULL,      -- niveles de red desbloqueados
  reactivation_amount NUMERIC(10,2) NOT NULL DEFAULT 300,
  description         TEXT,
  is_active           BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =============================================================================
-- 3. ESTRUCTURA DE COMISIONES POR NIVEL
-- =============================================================================

CREATE TABLE commission_levels (
  id              SERIAL      PRIMARY KEY,
  level           INT         NOT NULL CHECK (level BETWEEN 1 AND 10),
  percentage      NUMERIC(5,2) NOT NULL,         -- 10, 4, 2, 2, 1, 1, 1, 3, 0.5, 0.5
  label           TEXT,
  -- qué paquetes tienen acceso a este nivel
  requires_package package_type[] NOT NULL,       -- ej: {Básico, Intermedio, VIP}
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(level)
);


-- =============================================================================
-- 4. PRODUCTOS
-- =============================================================================

CREATE TABLE products (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT        NOT NULL,
  description TEXT,
  price       NUMERIC(10,2) NOT NULL,
  stock       INT         NOT NULL DEFAULT 0,
  category    TEXT        NOT NULL,
  tags        TEXT[]      NOT NULL DEFAULT '{}',
  rating      NUMERIC(3,2) DEFAULT 0,
  reviews_count INT       DEFAULT 0,
  image_url   TEXT,
  organic     BOOLEAN     NOT NULL DEFAULT FALSE,
  active      BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_active   ON products(active);


-- =============================================================================
-- 5. TIENDA DEL AFILIADO
-- Relación 1:1 con profiles (solo afiliados tienen tienda).
-- =============================================================================

CREATE TABLE affiliate_stores (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  affiliate_id    UUID        NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  store_name      TEXT        NOT NULL,
  tagline         TEXT,
  color           TEXT        NOT NULL DEFAULT '#F2C94C',
  emoji           TEXT        NOT NULL DEFAULT '🌿',
  whatsapp_phone  TEXT,
  active          BOOLEAN     NOT NULL DEFAULT FALSE,
  featured_product_ids UUID[] NOT NULL DEFAULT '{}',   -- hasta 6 productos destacados
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =============================================================================
-- 6. PEDIDOS
-- =============================================================================

CREATE TABLE orders (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number    TEXT        NOT NULL UNIQUE,    -- WO-0001
  sequence_num    SERIAL,                         -- número auto-incremental interno

  -- Cliente (puede no ser afiliado)
  client_name     TEXT        NOT NULL,
  client_email    TEXT,
  client_phone    TEXT,
  client_dni      TEXT,
  shipping_address TEXT,

  -- Comisionista
  affiliate_id    UUID        REFERENCES profiles(id),
  affiliate_code  TEXT,

  total           NUMERIC(10,2) NOT NULL,
  payment_method  payment_method NOT NULL DEFAULT 'cash',
  status          order_status   NOT NULL DEFAULT 'pendiente',
  receipt_url     TEXT,
  tracking_number TEXT,
  notes           TEXT,

  date            DATE        NOT NULL DEFAULT CURRENT_DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_affiliate  ON orders(affiliate_id);
CREATE INDEX idx_orders_status     ON orders(status);
CREATE INDEX idx_orders_date       ON orders(date);


-- =============================================================================
-- 7. ITEMS DE PEDIDO
-- =============================================================================

CREATE TABLE order_items (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id    UUID        NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id  UUID        NOT NULL REFERENCES products(id),
  name        TEXT        NOT NULL,   -- snapshot del nombre al momento de compra
  price       NUMERIC(10,2) NOT NULL, -- snapshot del precio
  quantity    INT         NOT NULL CHECK (quantity > 0),
  subtotal    NUMERIC(10,2) GENERATED ALWAYS AS (price * quantity) STORED
);

CREATE INDEX idx_order_items_order ON order_items(order_id);


-- =============================================================================
-- 8. COMISIONES
-- Una fila por cada nodo de la red que debe recibir comisión por un pedido.
-- =============================================================================

CREATE TABLE commissions (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id        UUID        NOT NULL REFERENCES orders(id),
  order_item_id   UUID        REFERENCES order_items(id),
  beneficiary_id  UUID        NOT NULL REFERENCES profiles(id),  -- quien recibe
  originator_id   UUID        REFERENCES profiles(id),            -- quien hizo la venta
  level           INT         NOT NULL CHECK (level BETWEEN 1 AND 10),
  percentage      NUMERIC(5,2) NOT NULL,
  base_amount     NUMERIC(10,2) NOT NULL,   -- monto sobre el que se calcula
  amount          NUMERIC(10,2) NOT NULL,   -- monto real acreditado
  status          commission_status NOT NULL DEFAULT 'pendiente',
  is_breakage     BOOLEAN     NOT NULL DEFAULT FALSE,  -- TRUE si el upline no tiene acceso a ese nivel
  date            DATE        NOT NULL DEFAULT CURRENT_DATE,
  paid_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_commissions_beneficiary ON commissions(beneficiary_id);
CREATE INDEX idx_commissions_order       ON commissions(order_id);
CREATE INDEX idx_commissions_status      ON commissions(status);


-- =============================================================================
-- 9. PAGOS / COMPROBANTES
-- Tabla unificada para todos los tipos de pago que requieren aprobación del admin.
-- =============================================================================

CREATE TABLE payments (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  affiliate_id    UUID        NOT NULL REFERENCES profiles(id),
  type            payment_type NOT NULL,
  status          payment_status NOT NULL DEFAULT 'pendiente',
  amount          NUMERIC(10,2) NOT NULL,
  receipt_url     TEXT,                   -- URL del comprobante subido a Storage

  -- Metadata según tipo
  package_from    package_type,           -- upgrade: paquete origen
  package_to      package_type,           -- activacion / upgrade: paquete destino
  reactivation_month DATE,                -- reactivacion: mes que cubre (primer día del mes)
  wallet_credit_amount NUMERIC(10,2),     -- recarga_billetera: crédito a acreditar

  -- Retiros
  withdrawal_method TEXT,                 -- Yape, Plin, BCP
  withdrawal_account TEXT,               -- número de cuenta/teléfono

  reviewed_by     UUID        REFERENCES profiles(id),   -- admin que revisó
  reviewed_at     TIMESTAMPTZ,
  review_notes    TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_affiliate ON payments(affiliate_id);
CREATE INDEX idx_payments_type      ON payments(type);
CREATE INDEX idx_payments_status    ON payments(status);


-- =============================================================================
-- 10. TRANSACCIONES DE BILLETERA
-- Log inmutable de todos los movimientos de saldo.
-- =============================================================================

CREATE TABLE wallet_transactions (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  affiliate_id    UUID        NOT NULL REFERENCES profiles(id),
  type            tx_type     NOT NULL,
  amount          NUMERIC(10,2) NOT NULL,
  balance_after   NUMERIC(10,2) NOT NULL,  -- saldo tras la transacción (snapshot)
  description     TEXT        NOT NULL,
  reference_id    UUID,                    -- puede apuntar a payment_id, order_id, commission_id
  reference_type  TEXT,                    -- 'payment' | 'order' | 'commission'
  status          tx_status   NOT NULL DEFAULT 'completada',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wallet_tx_affiliate ON wallet_transactions(affiliate_id);
CREATE INDEX idx_wallet_tx_date      ON wallet_transactions(created_at);


-- =============================================================================
-- 11. RED DE AFILIADOS (árbol MLM)
-- Tabla de cierre transitivo — registra la relación entre cualquier par
-- (upline, downline) junto con la profundidad. Permite calcular comisiones
-- en una sola query sin recursión en tiempo real.
-- =============================================================================

CREATE TABLE affiliate_network (
  upline_id     UUID  NOT NULL REFERENCES profiles(id),
  downline_id   UUID  NOT NULL REFERENCES profiles(id),
  depth         INT   NOT NULL CHECK (depth BETWEEN 1 AND 10),  -- 1 = directo
  PRIMARY KEY (upline_id, downline_id)
);

CREATE INDEX idx_network_upline   ON affiliate_network(upline_id);
CREATE INDEX idx_network_downline ON affiliate_network(downline_id);


-- =============================================================================
-- 12. RESEÑAS DE PRODUCTOS
-- =============================================================================

CREATE TABLE product_reviews (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id  UUID        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  reviewer_id UUID        REFERENCES profiles(id),
  rating      INT         NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  verified    BOOLEAN     NOT NULL DEFAULT FALSE,  -- compra verificada
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reviews_product ON product_reviews(product_id);


-- =============================================================================
-- 13. CONFIGURACIÓN DEL SISTEMA (admin)
-- KV store para ajustes que el admin puede cambiar sin deploy.
-- =============================================================================

CREATE TABLE system_config (
  key         TEXT  PRIMARY KEY,
  value       JSONB NOT NULL,
  description TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by  UUID REFERENCES profiles(id)
);
