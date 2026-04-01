-- =============================================================================
-- WINNER ORGANA — Datos de prueba para desarrollo local
-- Motor: PostgreSQL (Supabase local / psql directo)
-- Archivo: 05_dev_seed.sql
-- ⚠️  NO ejecutar en producción. Solo para entorno local.
-- Inserta usuarios de prueba con UUIDs fijos sin pasar por auth.users.
-- =============================================================================

-- IDs fijos para facilitar testing
-- admin:   'aaaaaaaa-0000-0000-0000-000000000001'
-- maría:   'bbbbbbbb-0000-0000-0000-000000000001'
-- carlos:  'bbbbbbbb-0000-0000-0000-000000000002'
-- ana:     'bbbbbbbb-0000-0000-0000-000000000003'
-- jorge:   'bbbbbbbb-0000-0000-0000-000000000004'
-- pedro:   'bbbbbbbb-0000-0000-0000-000000000005'
-- luis:    'bbbbbbbb-0000-0000-0000-000000000006'
-- rosa:    'bbbbbbbb-0000-0000-0000-000000000007'


-- ─── En Supabase local, primero insertar en auth.users ────────────────────
-- (Si usas psql directo sin auth, comentar este bloque y saltar a profiles)

INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', 'admin@winner.com',    crypt('admin1234', gen_salt('bf')), NOW(), NOW(), NOW()),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'maria@email.com',     crypt('demo1234',  gen_salt('bf')), NOW(), NOW(), NOW()),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'carlos@email.com',    crypt('demo1234',  gen_salt('bf')), NOW(), NOW(), NOW()),
  ('bbbbbbbb-0000-0000-0000-000000000003', 'ana@email.com',       crypt('demo1234',  gen_salt('bf')), NOW(), NOW(), NOW()),
  ('bbbbbbbb-0000-0000-0000-000000000004', 'jorge@email.com',     crypt('demo1234',  gen_salt('bf')), NOW(), NOW(), NOW()),
  ('bbbbbbbb-0000-0000-0000-000000000005', 'pedro@email.com',     crypt('demo1234',  gen_salt('bf')), NOW(), NOW(), NOW()),
  ('bbbbbbbb-0000-0000-0000-000000000006', 'luis@email.com',      crypt('demo1234',  gen_salt('bf')), NOW(), NOW(), NOW()),
  ('bbbbbbbb-0000-0000-0000-000000000007', 'rosa@email.com',      crypt('demo1234',  gen_salt('bf')), NOW(), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;


-- =============================================================================
-- PROFILES
-- =============================================================================

INSERT INTO profiles (
  id, name, dni, yape_phone, role,
  affiliate_code, referrer_id, package, account_status, depth_unlocked,
  wallet_balance, total_sales, total_commissions, total_referrals,
  joined_at, activated_at, last_reactivation_at, next_reactivation_due
) VALUES

  -- ADMIN (no tiene código de afiliado ni paquete)
  ('aaaaaaaa-0000-0000-0000-000000000001',
   'Admin Winner', '00000000', NULL, 'admin',
   NULL, NULL, NULL, 'active', 0,
   9999.00, 0, 0, 0,
   '2025-01-01', '2025-01-01', '2026-03-01', '2026-04-01'),

  -- MARÍA (VIP, activa, referrer de Carlos y Ana)
  ('bbbbbbbb-0000-0000-0000-000000000001',
   'María García López', '12345678', '987654321', 'affiliate',
   'WIN-MAR001', NULL, 'VIP', 'active', 10,
   234.50, 4500.00, 675.00, 12,
   '2025-01-15', '2025-01-20', '2026-03-01', '2026-04-01'),

  -- CARLOS (Intermedio, activo, referido por María)
  ('bbbbbbbb-0000-0000-0000-000000000002',
   'Carlos Mendoza', '23456789', '912345678', 'affiliate',
   'WIN-CAR002', 'bbbbbbbb-0000-0000-0000-000000000001', 'Intermedio', 'active', 7,
   180.00, 2100.00, 315.00, 6,
   '2025-03-20', '2025-03-25', '2026-03-01', '2026-04-01'),

  -- ANA (Básico, suspendida, referida por María)
  ('bbbbbbbb-0000-0000-0000-000000000003',
   'Ana Torres Ruiz', '34567890', '956789012', 'affiliate',
   'WIN-ANA003', 'bbbbbbbb-0000-0000-0000-000000000001', 'Básico', 'suspended', 3,
   52.50, 350.00, 52.50, 2,
   '2025-06-10', '2025-06-15', '2026-02-01', NULL),

  -- JORGE (Básico, pendiente — aún no activado)
  ('bbbbbbbb-0000-0000-0000-000000000004',
   'Jorge Ramírez', '45678901', '934567890', 'affiliate',
   'WIN-JOR011', 'bbbbbbbb-0000-0000-0000-000000000001', 'Básico', 'pending', 3,
   0.00, 0.00, 0.00, 0,
   '2026-03-28', NULL, NULL, NULL),

  -- PEDRO (Básico, activo, referido por Carlos)
  ('bbbbbbbb-0000-0000-0000-000000000005',
   'Pedro Sánchez', '56789012', '945678901', 'affiliate',
   'WIN-PED004', 'bbbbbbbb-0000-0000-0000-000000000002', 'Básico', 'active', 3,
   20.00, 200.00, 30.00, 0,
   '2025-08-01', '2025-08-05', '2026-03-01', '2026-04-01'),

  -- LUIS (Intermedio, activo, referido por María)
  ('bbbbbbbb-0000-0000-0000-000000000006',
   'Luis Vargas', '67890123', '923456789', 'affiliate',
   'WIN-LUI005', 'bbbbbbbb-0000-0000-0000-000000000001', 'Intermedio', 'active', 7,
   90.00, 600.00, 90.00, 2,
   '2025-09-10', '2025-09-15', '2026-03-01', '2026-04-01'),

  -- ROSA (Básico, activa, referida por Luis)
  ('bbbbbbbb-0000-0000-0000-000000000007',
   'Rosa Medina', '78901234', '956780123', 'affiliate',
   'WIN-ROS006', 'bbbbbbbb-0000-0000-0000-000000000006', 'Básico', 'active', 3,
   10.00, 100.00, 15.00, 0,
   '2025-11-01', '2025-11-05', '2026-03-01', '2026-04-01')

ON CONFLICT (id) DO NOTHING;


-- =============================================================================
-- RED DE AFILIADOS (affiliate_network)
-- Árbol:
--   María (VIP)
--   ├── Carlos (depth 1 desde María)
--   │   └── Pedro (depth 2 desde María, depth 1 desde Carlos)
--   ├── Ana    (depth 1 desde María)
--   └── Luis   (depth 1 desde María)
--       ├── Rosa (depth 2 desde María, depth 1 desde Luis)
-- =============================================================================

INSERT INTO affiliate_network (upline_id, downline_id, depth) VALUES
  -- Carlos referido por María
  ('bbbbbbbb-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000002', 1),
  -- Ana referida por María
  ('bbbbbbbb-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000003', 1),
  -- Luis referido por María
  ('bbbbbbbb-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000006', 1),
  -- Pedro referido por Carlos (depth 1 desde Carlos, depth 2 desde María)
  ('bbbbbbbb-0000-0000-0000-000000000002', 'bbbbbbbb-0000-0000-0000-000000000005', 1),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000005', 2),
  -- Rosa referida por Luis (depth 1 desde Luis, depth 2 desde María)
  ('bbbbbbbb-0000-0000-0000-000000000006', 'bbbbbbbb-0000-0000-0000-000000000007', 1),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000007', 2)
ON CONFLICT DO NOTHING;


-- =============================================================================
-- TIENDAS DE AFILIADOS
-- =============================================================================

INSERT INTO affiliate_stores (affiliate_id, store_name, tagline, color, emoji, whatsapp_phone, active, featured_product_ids)
VALUES
  ('bbbbbbbb-0000-0000-0000-000000000001', 'Natural Life María',  'Tu bienestar es mi misión',       '#2ECC71', '🌿', '987654321', TRUE,
   ARRAY['00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000004']::UUID[]),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'Orgánico Carlos',     'Salud natural para todos',        '#F2C94C', '💪', '912345678', TRUE,
   ARRAY['00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000005']::UUID[]),
  ('bbbbbbbb-0000-0000-0000-000000000003', 'Ana Orgánica',        'Natura para ti',                  '#2ECC71', '🌱', '956789012', FALSE,
   ARRAY['00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000006']::UUID[]),
  ('bbbbbbbb-0000-0000-0000-000000000004', 'Jorge Natural',       '',                                '#F2C94C', '🌿', '934567890', FALSE,
   ARRAY[]::UUID[])
ON CONFLICT (affiliate_id) DO NOTHING;


-- =============================================================================
-- PEDIDOS DE PRUEBA
-- =============================================================================

INSERT INTO orders (id, order_number, client_name, client_email, client_phone, client_dni,
  shipping_address, affiliate_id, affiliate_code, total, payment_method, status, date)
VALUES
  ('cccccccc-0000-0000-0000-000000000001', 'WO-0001',
   'Juan Pérez', 'juan@email.com', '987654321', '12345678',
   'Av. Lima 123, Miraflores',
   'bbbbbbbb-0000-0000-0000-000000000001', 'WIN-MAR001',
   179.80, 'cash', 'entregado', '2026-03-25'),

  ('cccccccc-0000-0000-0000-000000000002', 'WO-0002',
   'Laura Ríos', 'laura@email.com', NULL, NULL,
   NULL,
   NULL, NULL,
   129.90, 'wallet', 'procesando', '2026-03-26'),

  ('cccccccc-0000-0000-0000-000000000003', 'WO-0003',
   'Roberto Díaz', 'roberto@email.com', NULL, NULL,
   NULL,
   'bbbbbbbb-0000-0000-0000-000000000002', 'WIN-CAR002',
   249.70, 'cash', 'pendiente', '2026-03-27')
ON CONFLICT (id) DO NOTHING;


-- =============================================================================
-- ITEMS DE PEDIDOS
-- =============================================================================

INSERT INTO order_items (order_id, product_id, name, price, quantity)
VALUES
  ('cccccccc-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Detox Green Supreme',        89.90, 2),
  ('cccccccc-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 'Proteína Vegetal Premium',  129.90, 1),
  ('cccccccc-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', 'Colágeno Marino Hidrolizado',109.90, 1),
  ('cccccccc-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000008', 'Colágeno + Biotina Beauty',  139.90, 1)
ON CONFLICT DO NOTHING;


-- =============================================================================
-- PAGOS DE PRUEBA (comprobantes)
-- =============================================================================

INSERT INTO payments (affiliate_id, type, status, amount, package_to)
VALUES
  -- Activación de Jorge (pendiente de aprobación)
  ('bbbbbbbb-0000-0000-0000-000000000004', 'activacion', 'pendiente', 100.00, 'Básico'),
  -- Reactivación pendiente
  ('bbbbbbbb-0000-0000-0000-000000000003', 'reactivacion', 'pendiente', 300.00, NULL),
  -- Retiro solicitado por María
  ('bbbbbbbb-0000-0000-0000-000000000001', 'retiro', 'pendiente', 100.00, NULL);

-- Actualizar el retiro con datos de método
UPDATE payments
SET withdrawal_method = 'Yape', withdrawal_account = '987654321'
WHERE affiliate_id = 'bbbbbbbb-0000-0000-0000-000000000001' AND type = 'retiro';

UPDATE payments
SET reactivation_month = '2026-03-01'
WHERE affiliate_id = 'bbbbbbbb-0000-0000-0000-000000000003' AND type = 'reactivacion';


-- =============================================================================
-- COMISIONES DE PRUEBA
-- =============================================================================

INSERT INTO commissions (
  order_id, beneficiary_id, originator_id,
  level, percentage, base_amount, amount, status
) VALUES
  ('cccccccc-0000-0000-0000-000000000001',
   'bbbbbbbb-0000-0000-0000-000000000001',
   'bbbbbbbb-0000-0000-0000-000000000001',
   1, 10.0, 179.80, 17.98, 'pagada'),

  ('cccccccc-0000-0000-0000-000000000003',
   'bbbbbbbb-0000-0000-0000-000000000001',
   'bbbbbbbb-0000-0000-0000-000000000002',
   1, 10.0, 249.70, 24.97, 'pendiente'),

  ('cccccccc-0000-0000-0000-000000000003',
   'bbbbbbbb-0000-0000-0000-000000000001',
   'bbbbbbbb-0000-0000-0000-000000000002',
   2, 4.0, 249.70, 9.99, 'pendiente')
ON CONFLICT DO NOTHING;


-- =============================================================================
-- TRANSACCIONES DE BILLETERA DE PRUEBA
-- =============================================================================

INSERT INTO wallet_transactions (affiliate_id, type, amount, balance_after, description, status)
VALUES
  ('bbbbbbbb-0000-0000-0000-000000000001', 'credit', 17.98, 17.98,  'Comisión nivel 1 — pedido WO-0001', 'completada'),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'credit', 50.00, 67.98,  'Recarga de saldo', 'completada'),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'debit',  129.90, -61.92, 'Compra pedido WO-0002', 'completada'),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'credit', 296.50, 234.50, 'Comisiones acumuladas del mes', 'completada');
