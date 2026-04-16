-- =============================================================================
-- WINCLICK — RESET COMPLETO DE BASE DE DATOS
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ⚠️  ESTO BORRA TODOS LOS DATOS. No se puede deshacer.
-- =============================================================================

-- ─── PASO 1: Limpiar tablas de datos (orden respetando FK) ────────────────────

TRUNCATE TABLE
  credit_transactions,
  commissions,
  affiliate_payments,
  affiliate_store_config,
  payment_proofs,
  order_items,
  orders,
  referrals,
  favorites,
  user_addresses,
  user_credits,
  user_roles,
  affiliates,
  categories,
  products,
  contact_messages,
  payment_methods,
  site_snapshots
CASCADE;

-- ─── PASO 2: Limpiar usuarios de Auth ────────────────────────────────────────
-- Borra todos los usuarios de Supabase Auth (incluye tokens, sesiones, etc.)

DELETE FROM auth.users;

-- ─── PASO 3: Crear usuario Admin ─────────────────────────────────────────────
-- Credenciales del nuevo admin:
--   Email:    admin@winclick.pe
--   Password: Winclick2024!

DO $$
DECLARE
  new_user_id UUID := gen_random_uuid();
BEGIN
  -- Insertar en auth.users
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
  ) VALUES (
    new_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'admin@winclick.pe',
    crypt('Winclick2024!', gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Administrador"}',
    FALSE,
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  );

  -- Insertar identidad de email (requerido por Supabase Auth v2)
  INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    new_user_id,
    'admin@winclick.pe',
    jsonb_build_object(
      'sub',   new_user_id::text,
      'email', 'admin@winclick.pe'
    ),
    'email',
    NOW(),
    NOW(),
    NOW()
  );

  -- Asignar rol admin en user_roles
  INSERT INTO user_roles (user_id, role)
  VALUES (new_user_id, 'admin');

END $$;

-- ─── PASO 4: Restaurar configuración base del negocio ─────────────────────────
-- business_settings siempre debe tener una fila (la app la espera)

INSERT INTO business_settings (
  id,
  business_name,
  yape_number,
  yape_qr_url,
  plin_number,
  whatsapp_number,
  contact_phone,
  contact_email,
  bank_name,
  bank_account,
  account_holder_name,
  commission_level_1,
  commission_level_2,
  commission_level_3,
  commission_level_4,
  commission_level_5,
  commission_level_6,
  commission_level_7,
  commission_level_8,
  commission_level_9,
  commission_level_10,
  partner_price_base,
  public_price_base,
  company_profit_percentage,
  package_basico_price,
  package_intermedio_price,
  package_vip_price,
  reactivation_fee,
  min_withdrawal,
  wp_conversion_rate,
  notify_new_orders,
  notify_new_affiliates
) VALUES (
  gen_random_uuid(),
  'Winclick Perú',
  NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
  10, 4, 2, 2, 1, 1, 1, 3, 0.5, 0.5,
  0.72, 1.20, 0.08,
  100, 2000, 10000,
  300, 50, 1.0,
  TRUE, TRUE
)
ON CONFLICT DO NOTHING;

-- =============================================================================
-- ✅ RESULTADO
-- Admin creado:
--   Email:    admin@winclick.pe
--   Password: Winclick2024!
--   Ruta:     /admin-login
-- =============================================================================
