-- =============================================================================
-- WinClick — RLS Correcto y Completo
-- Archivo: 09_rls_correct.sql
-- Ejecutar en Supabase SQL Editor.
-- Este archivo reemplaza al 03_rls.sql (que usaba tablas que no existen).
-- Cubre TODAS las tablas que usa el frontend.
-- =============================================================================

-- =============================================================================
-- HELPERS
-- Usan user_roles (tabla real) en lugar de profiles (inexistente en esta BD).
-- SECURITY DEFINER para evitar recursión en las propias policies.
-- =============================================================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Devuelve el affiliates.id del usuario autenticado (NULL si no es afiliado)
CREATE OR REPLACE FUNCTION my_affiliate_id()
RETURNS UUID AS $$
  SELECT id FROM affiliates WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;


-- =============================================================================
-- USER_ROLES
-- Crítica: AuthContext la lee en cada carga de página.
-- =============================================================================

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Cada usuario ve solo su propio rol (necesario para AuthContext)
CREATE POLICY "user_roles: select own"
  ON user_roles FOR SELECT
  USING (user_id = auth.uid());

-- INSERT al registrarse (AuthContext.register inserta el rol 'affiliate')
CREATE POLICY "user_roles: insert own"
  ON user_roles FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Solo admin puede cambiar roles (no puede ser el propio usuario)
CREATE POLICY "user_roles: admin update"
  ON user_roles FOR UPDATE
  USING (is_admin());

CREATE POLICY "user_roles: admin delete"
  ON user_roles FOR DELETE
  USING (is_admin());


-- =============================================================================
-- AFFILIATES
-- - Lectura pública: necesario para TiendaAfiliado y validar código en Checkout.
-- - UPDATE: solo admin (desde AdminDashboard).
-- - INSERT: vía RPC register_affiliate (SECURITY DEFINER, no necesita policy).
-- =============================================================================

ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;

-- Lectura pública (tiendas y checkout validan affiliate_code sin auth)
CREATE POLICY "affiliates: select public"
  ON affiliates FOR SELECT
  USING (true);

-- Solo admin puede actualizar (nombre, yape, paquete desde AdminDashboard)
CREATE POLICY "affiliates: admin update"
  ON affiliates FOR UPDATE
  USING (is_admin());

-- Solo admin puede eliminar
CREATE POLICY "affiliates: admin delete"
  ON affiliates FOR DELETE
  USING (is_admin());


-- =============================================================================
-- PRODUCTS
-- - SELECT público para productos activos (catálogo sin login).
-- - Admin ve todos (incluidos inactivos) y puede crear/editar/eliminar.
-- =============================================================================

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Público ve solo activos; admin ve todos
CREATE POLICY "products: select"
  ON products FOR SELECT
  USING (is_active = TRUE OR is_admin());

-- Solo admin puede crear
CREATE POLICY "products: admin insert"
  ON products FOR INSERT
  WITH CHECK (is_admin());

-- Solo admin puede editar
CREATE POLICY "products: admin update"
  ON products FOR UPDATE
  USING (is_admin());

-- Solo admin puede eliminar
CREATE POLICY "products: admin delete"
  ON products FOR DELETE
  USING (is_admin());


-- =============================================================================
-- ORDERS
-- - INSERT público (checkout de clientes sin cuenta).
-- - SELECT: afiliado ve los suyos; admin ve todos.
-- - UPDATE: solo admin (cambiar estado del pedido).
-- =============================================================================

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Afiliado ve sus pedidos; admin ve todos
CREATE POLICY "orders: select"
  ON orders FOR SELECT
  USING (affiliate_id = my_affiliate_id() OR is_admin());

-- Cualquiera puede crear un pedido (incluyendo clientes sin cuenta)
CREATE POLICY "orders: insert public"
  ON orders FOR INSERT
  WITH CHECK (true);

-- Solo admin cambia el estado
CREATE POLICY "orders: admin update"
  ON orders FOR UPDATE
  USING (is_admin());


-- =============================================================================
-- ORDER_ITEMS
-- Ya tiene RLS de 08_migration.sql. Solo agregar lo que falta.
-- Si ya existen las policies, Supabase mostrará error "ya existe" — ignorar.
-- =============================================================================

-- ALTER TABLE order_items ENABLE ROW LEVEL SECURITY; -- ya habilitado en 08

-- Si las policies de 08_migration.sql ya existen, saltar estas:
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'order_items' AND policyname = 'order_items: select via order'
  ) THEN
    CREATE POLICY "order_items: select via order"
      ON order_items FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM orders o
          WHERE o.id = order_items.order_id
            AND (o.affiliate_id = my_affiliate_id() OR is_admin())
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'order_items' AND policyname = 'order_items: insert'
  ) THEN
    CREATE POLICY "order_items: insert"
      ON order_items FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;


-- =============================================================================
-- COMMISSIONS
-- - SELECT: afiliado ve las suyas; admin ve todas.
-- - INSERT/UPDATE: solo vía funciones SECURITY DEFINER (triggers, RPCs).
-- =============================================================================

ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "commissions: select"
  ON commissions FOR SELECT
  USING (affiliate_id = my_affiliate_id() OR is_admin());


-- =============================================================================
-- AFFILIATE_PAYMENTS
-- Ya tiene RLS de 08_migration.sql. Solo reemplazar el admin check para usar
-- la función is_admin() en vez del subquery inline (más limpio y consistente).
-- Si las policies ya existen, saltar.
-- =============================================================================

DO $$
BEGIN
  -- SELECT
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'affiliate_payments' AND policyname = 'affiliate_payments: select own'
  ) THEN
    CREATE POLICY "affiliate_payments: select own"
      ON affiliate_payments FOR SELECT
      USING (affiliate_id = my_affiliate_id() OR is_admin());
  END IF;

  -- INSERT
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'affiliate_payments' AND policyname = 'affiliate_payments: insert own'
  ) THEN
    CREATE POLICY "affiliate_payments: insert own"
      ON affiliate_payments FOR INSERT
      WITH CHECK (affiliate_id = my_affiliate_id());
  END IF;

  -- UPDATE (admin aprueba/rechaza)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'affiliate_payments' AND policyname = 'affiliate_payments: admin update'
  ) THEN
    CREATE POLICY "affiliate_payments: admin update"
      ON affiliate_payments FOR UPDATE
      USING (is_admin());
  END IF;
END $$;


-- =============================================================================
-- AFFILIATE_STORE_CONFIG
-- - SELECT público (las tiendas son accesibles sin login).
-- - UPSERT/UPDATE: solo el dueño o admin.
-- =============================================================================

ALTER TABLE affiliate_store_config ENABLE ROW LEVEL SECURITY;

-- Público puede ver cualquier config de tienda (necesario para /tienda/:code)
CREATE POLICY "store_config: select public"
  ON affiliate_store_config FOR SELECT
  USING (true);

-- Solo el dueño crea su config (upsert)
CREATE POLICY "store_config: insert own"
  ON affiliate_store_config FOR INSERT
  WITH CHECK (affiliate_id = my_affiliate_id() OR is_admin());

-- Solo el dueño o admin actualiza
CREATE POLICY "store_config: update own"
  ON affiliate_store_config FOR UPDATE
  USING (affiliate_id = my_affiliate_id() OR is_admin());


-- =============================================================================
-- USER_CREDITS
-- - SELECT: usuario ve solo su saldo; admin ve todo.
-- - INSERT/UPDATE: solo vía RPC approve_affiliate_payment (SECURITY DEFINER).
-- =============================================================================

ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_credits: select own"
  ON user_credits FOR SELECT
  USING (user_id = auth.uid() OR is_admin());


-- =============================================================================
-- CREDIT_TRANSACTIONS
-- - SELECT: usuario ve las suyas (via user_credits); admin ve todas.
-- - INSERT: solo vía RPC (SECURITY DEFINER).
-- =============================================================================

ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "credit_transactions: select own"
  ON credit_transactions FOR SELECT
  USING (
    user_credit_id IN (
      SELECT id FROM user_credits WHERE user_id = auth.uid()
    )
    OR is_admin()
  );


-- =============================================================================
-- REFERRALS
-- - SELECT: afiliado ve su red (como referrer o referred); admin ve todo.
-- - INSERT: solo vía RPC register_affiliate (SECURITY DEFINER).
-- =============================================================================

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "referrals: select own"
  ON referrals FOR SELECT
  USING (
    referrer_id = my_affiliate_id()
    OR referred_id = my_affiliate_id()
    OR is_admin()
  );


-- =============================================================================
-- CATEGORIES
-- - SELECT público (filtros del catálogo).
-- - Admin puede gestionar.
-- =============================================================================

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories: public select"
  ON categories FOR SELECT
  USING (true);

CREATE POLICY "categories: admin write"
  ON categories FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "categories: admin update"
  ON categories FOR UPDATE
  USING (is_admin());

CREATE POLICY "categories: admin delete"
  ON categories FOR DELETE
  USING (is_admin());


-- =============================================================================
-- BUSINESS_SETTINGS
-- - SELECT público (la app muestra números de contacto, datos de Yape/Plin).
-- - UPDATE: solo admin.
-- =============================================================================

ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "business_settings: public select"
  ON business_settings FOR SELECT
  USING (true);

CREATE POLICY "business_settings: admin update"
  ON business_settings FOR UPDATE
  USING (is_admin());


-- =============================================================================
-- VOLUME_UNITS
-- - SELECT: afiliado ve los suyos; admin ve todos.
-- - INSERT: solo vía función create_order_commissions (SECURITY DEFINER).
-- =============================================================================

ALTER TABLE volume_units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "volume_units: select own"
  ON volume_units FOR SELECT
  USING (affiliate_id = my_affiliate_id() OR is_admin());


-- =============================================================================
-- STORAGE: bucket "receipts"
-- - Afiliados pueden subir sus propios comprobantes.
-- - Admin puede leer todos.
-- - La política se configura en Supabase Dashboard > Storage > receipts.
-- Ejemplo de política SQL para storage (si se gestiona vía SQL):
-- =============================================================================
-- INSERT INTO storage.policies (name, bucket_id, definition, check_expression)
-- VALUES (
--   'receipts: upload own',
--   'receipts',
--   '(storage.foldername(name))[1] = auth.uid()::text',
--   '(storage.foldername(name))[1] = auth.uid()::text'
-- );

-- =============================================================================
-- VERIFICACIÓN POST-APLICACIÓN
-- Ejecutar para confirmar que todas las policies están en su lugar.
-- =============================================================================
SELECT
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'user_roles', 'affiliates', 'products', 'orders', 'order_items',
    'commissions', 'affiliate_payments', 'affiliate_store_config',
    'user_credits', 'credit_transactions', 'referrals',
    'categories', 'business_settings', 'volume_units'
  )
ORDER BY tablename, cmd;
