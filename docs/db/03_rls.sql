-- =============================================================================
-- WINNER ORGANA — Row Level Security (RLS)
-- Motor: PostgreSQL (Supabase)
-- Archivo: 03_rls.sql
-- Ejecutar después de 02_triggers.sql
-- Controla qué filas puede ver/modificar cada usuario.
-- =============================================================================


-- =============================================================================
-- Helper: función para obtener el rol del usuario autenticado
-- =============================================================================

CREATE OR REPLACE FUNCTION auth_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT role = 'admin' FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;


-- =============================================================================
-- PROFILES
-- =============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Cada afiliado ve solo su propio perfil
CREATE POLICY "profiles: select own"
  ON profiles FOR SELECT
  USING (id = auth.uid() OR is_admin());

-- Solo el propio usuario puede actualizar su perfil (campos limitados)
CREATE POLICY "profiles: update own"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND role = (SELECT role FROM profiles WHERE id = auth.uid()) -- no puede cambiarse el rol
    AND account_status = (SELECT account_status FROM profiles WHERE id = auth.uid()) -- no cambia su propio estado
  );

-- El admin puede ver y actualizar cualquier perfil
CREATE POLICY "profiles: admin full"
  ON profiles FOR ALL
  USING (is_admin());

-- Inserción permitida solo via trigger (o service_role)
CREATE POLICY "profiles: insert own"
  ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());


-- =============================================================================
-- AFFILIATE_STORES
-- =============================================================================

ALTER TABLE affiliate_stores ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede ver tiendas activas (tienda pública)
CREATE POLICY "stores: public select active"
  ON affiliate_stores FOR SELECT
  USING (active = TRUE OR affiliate_id = auth.uid() OR is_admin());

-- Solo el dueño puede editar su tienda
CREATE POLICY "stores: update own"
  ON affiliate_stores FOR UPDATE
  USING (affiliate_id = auth.uid());

CREATE POLICY "stores: admin full"
  ON affiliate_stores FOR ALL
  USING (is_admin());


-- =============================================================================
-- PRODUCTS
-- =============================================================================

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede ver productos activos
CREATE POLICY "products: public select"
  ON products FOR SELECT
  USING (active = TRUE OR is_admin());

-- Solo admin puede crear/modificar/eliminar productos
CREATE POLICY "products: admin write"
  ON products FOR INSERT, UPDATE, DELETE
  USING (is_admin());


-- =============================================================================
-- ORDERS
-- =============================================================================

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Afiliado ve solo sus pedidos (donde él es el afiliado)
CREATE POLICY "orders: affiliate select own"
  ON orders FOR SELECT
  USING (affiliate_id = auth.uid() OR is_admin());

-- Inserción libre (clientes sin cuenta también compran)
CREATE POLICY "orders: insert"
  ON orders FOR INSERT
  WITH CHECK (TRUE);

-- Solo admin puede cambiar el estado de un pedido
CREATE POLICY "orders: admin update"
  ON orders FOR UPDATE
  USING (is_admin());


-- =============================================================================
-- ORDER_ITEMS
-- =============================================================================

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "order_items: select via order"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_items.order_id
        AND (o.affiliate_id = auth.uid() OR is_admin())
    )
  );

CREATE POLICY "order_items: insert"
  ON order_items FOR INSERT
  WITH CHECK (TRUE);


-- =============================================================================
-- COMMISSIONS
-- =============================================================================

ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;

-- Afiliado ve solo las comisiones donde él es beneficiario
CREATE POLICY "commissions: select own"
  ON commissions FOR SELECT
  USING (beneficiary_id = auth.uid() OR is_admin());

-- Solo triggers internos (service_role) insertan comisiones
-- No se permite INSERT/UPDATE desde el cliente


-- =============================================================================
-- PAYMENTS (comprobantes)
-- =============================================================================

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Afiliado ve sus propios pagos
CREATE POLICY "payments: select own"
  ON payments FOR SELECT
  USING (affiliate_id = auth.uid() OR is_admin());

-- Afiliado puede crear su propio pago (subir comprobante)
CREATE POLICY "payments: insert own"
  ON payments FOR INSERT
  WITH CHECK (affiliate_id = auth.uid());

-- Solo admin puede aprobar/rechazar
CREATE POLICY "payments: admin update"
  ON payments FOR UPDATE
  USING (is_admin());


-- =============================================================================
-- WALLET_TRANSACTIONS
-- =============================================================================

ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Solo lectura propia (el log de billetera nunca se modifica desde el cliente)
CREATE POLICY "wallet_tx: select own"
  ON wallet_transactions FOR SELECT
  USING (affiliate_id = auth.uid() OR is_admin());


-- =============================================================================
-- AFFILIATE_NETWORK
-- =============================================================================

ALTER TABLE affiliate_network ENABLE ROW LEVEL SECURITY;

-- Afiliado puede ver su propio árbol hacia arriba (uplines) y hacia abajo (downlines)
CREATE POLICY "network: select own tree"
  ON affiliate_network FOR SELECT
  USING (upline_id = auth.uid() OR downline_id = auth.uid() OR is_admin());


-- =============================================================================
-- COMMISSION_LEVELS y PACKAGES: solo lectura pública
-- =============================================================================

ALTER TABLE commission_levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "commission_levels: public read"
  ON commission_levels FOR SELECT USING (TRUE);
CREATE POLICY "commission_levels: admin write"
  ON commission_levels FOR INSERT, UPDATE, DELETE USING (is_admin());

ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "packages: public read"
  ON packages FOR SELECT USING (is_active = TRUE OR is_admin());
CREATE POLICY "packages: admin write"
  ON packages FOR INSERT, UPDATE, DELETE USING (is_admin());


-- =============================================================================
-- SYSTEM_CONFIG: solo admin
-- =============================================================================

ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "config: admin only"
  ON system_config FOR ALL USING (is_admin());


-- =============================================================================
-- PRODUCT_REVIEWS
-- =============================================================================

ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reviews: public read"
  ON product_reviews FOR SELECT USING (TRUE);

CREATE POLICY "reviews: insert own"
  ON product_reviews FOR INSERT
  WITH CHECK (reviewer_id = auth.uid());

CREATE POLICY "reviews: admin delete"
  ON product_reviews FOR DELETE USING (is_admin());
