-- =============================================================================
-- WinClick — Vistas y queries útiles
-- Motor: PostgreSQL (Supabase)
-- Archivo: 07_views.sql
-- Ejecutar después de 04_seed.sql
-- Provee vistas precalculadas para el dashboard y reportes.
-- =============================================================================


-- =============================================================================
-- VISTA: Dashboard resumen del afiliado autenticado
-- Devuelve una fila con todos los KPIs del área de afiliado.
-- =============================================================================

CREATE OR REPLACE VIEW v_affiliate_dashboard AS
SELECT
  p.id,
  p.name,
  p.email,
  p.affiliate_code,
  p.package,
  p.account_status,
  p.depth_unlocked,
  p.wallet_balance,
  p.total_sales,
  p.total_commissions,
  p.total_referrals,
  p.uv_month,
  p.joined_at,
  p.activated_at,
  p.next_reactivation_due,

  -- Comisiones pendientes (aún no acreditadas)
  COALESCE((
    SELECT SUM(c.amount)
    FROM commissions c
    WHERE c.beneficiary_id = p.id AND c.status = 'pendiente'
  ), 0) AS commissions_pending,

  -- Ventas del mes actual
  COALESCE((
    SELECT SUM(o.total)
    FROM orders o
    WHERE o.affiliate_id = p.id
      AND DATE_TRUNC('month', o.created_at) = DATE_TRUNC('month', NOW())
      AND o.status IN ('procesando', 'enviado', 'entregado')
  ), 0) AS sales_this_month,

  -- Total de referidos directos activos
  (
    SELECT COUNT(*)
    FROM profiles ref
    WHERE ref.referrer_id = p.id AND ref.account_status = 'active'
  ) AS direct_active_referrals,

  -- Nombre del rango UV calculado
  CASE
    WHEN p.uv_month >= 5000 THEN 'Rango Élite'
    WHEN p.uv_month >= 2500 THEN 'Líder Oro'
    WHEN p.uv_month >= 1000 THEN 'Líder Plata'
    WHEN p.uv_month >= 500  THEN 'Emprendedor'
    ELSE 'Socio Activo'
  END AS uv_rank_name

FROM profiles p
WHERE p.id = auth.uid();


-- =============================================================================
-- VISTA: Listado de afiliados para el admin
-- =============================================================================

CREATE OR REPLACE VIEW v_admin_affiliates AS
SELECT
  p.id,
  p.name,
  p.email,
  p.affiliate_code,
  p.package,
  p.account_status,
  p.wallet_balance,
  p.total_sales,
  p.total_commissions,
  p.total_referrals,
  p.joined_at,
  p.activated_at,
  p.next_reactivation_due,
  p.suspended_at,
  ref.name      AS referrer_name,
  ref.affiliate_code AS referrer_code
FROM profiles p
LEFT JOIN profiles ref ON ref.id = p.referrer_id
WHERE p.role = 'affiliate';


-- =============================================================================
-- VISTA: Pagos pendientes de revisión (para el panel admin)
-- =============================================================================

CREATE OR REPLACE VIEW v_admin_pending_payments AS
SELECT
  pay.id,
  pay.type,
  pay.status,
  pay.amount,
  pay.receipt_url,
  pay.package_from,
  pay.package_to,
  pay.reactivation_month,
  pay.wallet_credit_amount,
  pay.withdrawal_method,
  pay.withdrawal_account,
  pay.created_at,
  p.name            AS affiliate_name,
  p.email           AS affiliate_email,
  p.affiliate_code,
  p.package         AS current_package,
  p.account_status  AS current_status
FROM payments pay
JOIN profiles p ON p.id = pay.affiliate_id
WHERE pay.status = 'pendiente'
ORDER BY pay.created_at ASC;


-- =============================================================================
-- VISTA: Historial de comisiones del afiliado autenticado
-- =============================================================================

CREATE OR REPLACE VIEW v_my_commissions AS
SELECT
  c.id,
  c.level,
  c.percentage,
  c.amount,
  c.status,
  c.is_breakage,
  c.date,
  c.paid_at,
  o.order_number,
  orig.name AS originator_name,
  orig.affiliate_code AS originator_code
FROM commissions c
JOIN orders    o    ON o.id = c.order_id
JOIN profiles  orig ON orig.id = c.originator_id
WHERE c.beneficiary_id = auth.uid()
ORDER BY c.date DESC;


-- =============================================================================
-- VISTA: Historial de billetera del afiliado autenticado
-- =============================================================================

CREATE OR REPLACE VIEW v_my_wallet AS
SELECT
  wt.id,
  wt.type,
  wt.amount,
  wt.balance_after,
  wt.description,
  wt.status,
  wt.created_at
FROM wallet_transactions wt
WHERE wt.affiliate_id = auth.uid()
ORDER BY wt.created_at DESC;


-- =============================================================================
-- VISTA: Red directa del afiliado (downlines nivel 1)
-- =============================================================================

CREATE OR REPLACE VIEW v_my_direct_referrals AS
SELECT
  p.id,
  p.name,
  p.affiliate_code,
  p.package,
  p.account_status,
  p.total_sales,
  p.joined_at
FROM profiles p
WHERE p.referrer_id = auth.uid()
ORDER BY p.joined_at DESC;


-- =============================================================================
-- VISTA: KPIs globales del admin (para el header del dashboard)
-- =============================================================================

CREATE OR REPLACE VIEW v_admin_kpis AS
SELECT
  (SELECT COUNT(*) FROM profiles WHERE role = 'affiliate')                              AS total_affiliates,
  (SELECT COUNT(*) FROM profiles WHERE role = 'affiliate' AND account_status = 'active') AS active_affiliates,
  (SELECT COUNT(*) FROM profiles WHERE role = 'affiliate' AND account_status = 'suspended') AS suspended_affiliates,
  (SELECT COUNT(*) FROM profiles WHERE role = 'affiliate' AND account_status = 'pending')   AS pending_affiliates,
  (SELECT COALESCE(SUM(total), 0) FROM orders WHERE status IN ('procesando','enviado','entregado')) AS total_revenue,
  (SELECT COALESCE(SUM(total), 0) FROM orders
    WHERE status IN ('procesando','enviado','entregado')
    AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW()))                  AS revenue_this_month,
  (SELECT COUNT(*) FROM orders WHERE status = 'pendiente')                              AS pending_orders,
  (SELECT COUNT(*) FROM payments WHERE status = 'pendiente')                            AS pending_payments;


-- =============================================================================
-- FUNCIÓN: Árbol de red completo de un afiliado (para el tab Red)
-- Devuelve todos los downlines con su profundidad relativa.
-- Usar: SELECT * FROM get_affiliate_tree('uuid-del-afiliado');
-- =============================================================================

CREATE OR REPLACE FUNCTION get_affiliate_tree(p_affiliate_id UUID)
RETURNS TABLE (
  id              UUID,
  name            TEXT,
  affiliate_code  TEXT,
  package         package_type,
  account_status  account_status,
  total_sales     NUMERIC,
  depth           INT
) AS $$
  SELECT
    p.id,
    p.name,
    p.affiliate_code,
    p.package,
    p.account_status,
    p.total_sales,
    an.depth
  FROM affiliate_network an
  JOIN profiles p ON p.id = an.downline_id
  WHERE an.upline_id = p_affiliate_id
  ORDER BY an.depth, p.name;
$$ LANGUAGE sql STABLE SECURITY DEFINER;
