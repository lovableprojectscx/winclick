-- =============================================================================
-- WinClick — Migración: Borrado total de usuarios desde Admin
-- =============================================================================

-- Crea una función segura para que solo los administradores puedan borrar
-- usuarios desde la raíz de Supabase (auth.users), liberando el correo.
CREATE OR REPLACE FUNCTION admin_delete_user(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  -- Verificar si el que ejecuta es un administrador real mediante auth.uid()
  SELECT is_admin INTO v_is_admin FROM affiliates WHERE id = auth.uid();
  
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Permiso denegado: solo administradores pueden borrar usuarios permanentemente.';
  END IF;

  -- 1. Eliminar referencias directas en el esquema público
  DELETE FROM referrals WHERE referrer_id = p_user_id OR referred_id = p_user_id;
  DELETE FROM affiliate_payments WHERE affiliate_id = p_user_id;
  DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE affiliate_id = p_user_id);
  DELETE FROM payment_proofs WHERE order_id IN (SELECT id FROM orders WHERE affiliate_id = p_user_id);
  DELETE FROM orders WHERE affiliate_id = p_user_id;
  
  -- Borrar el afiliado público (por si acaso no hay cascade completo)
  DELETE FROM affiliates WHERE id = p_user_id;

  -- 2. Eliminar al usuario de la "caja fuerte" de Supabase (libera el email)
  -- NOTA: Supabase Auth está en el esquema auth.
  DELETE FROM auth.users WHERE id = p_user_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'auth';
