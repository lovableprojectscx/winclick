-- =============================================================================
-- WinClick — Migración: Borrado total de usuarios desde Admin (V4 Corregida)
-- =============================================================================

-- Esta versión corrige el orden de borrado para manejar comisiones vinculadas
-- a los pedidos del usuario que se está borrando.

CREATE OR REPLACE FUNCTION admin_delete_user(p_affiliate_id UUID)
RETURNS VOID AS $$
DECLARE
    v_user_id UUID;
    v_is_admin BOOLEAN;
BEGIN
    -- 1. Verificar si el usuario que llama es admin
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ) INTO v_is_admin;

    IF NOT v_is_admin THEN
        RAISE EXCEPTION 'Permiso denegado: solo administradores pueden borrar usuarios.';
    END IF;

    -- 2. Obtener el user_id de auth vinculado al afiliado
    SELECT user_id INTO v_user_id FROM public.affiliates WHERE id = p_affiliate_id;

    -- 3. Eliminar referencias en el esquema público vinculadas al affiliate_id
    DELETE FROM public.referrals WHERE referrer_id = p_affiliate_id OR referred_id = p_affiliate_id;
    DELETE FROM public.affiliate_payments WHERE affiliate_id = p_affiliate_id OR reviewed_by = p_affiliate_id;
    
    -- Pedidos y dependencias (IMPORTANTE: Borrar comisiones del pedido antes que el pedido)
    DELETE FROM public.order_items WHERE order_id IN (SELECT id FROM public.orders WHERE affiliate_id = p_affiliate_id);
    DELETE FROM public.payment_proofs WHERE order_id IN (SELECT id FROM public.orders WHERE affiliate_id = p_affiliate_id);
    DELETE FROM public.commissions WHERE order_id IN (SELECT id FROM public.orders WHERE affiliate_id = p_affiliate_id);
    DELETE FROM public.orders WHERE affiliate_id = p_affiliate_id;
    
    -- Comisiones directas (donde el usuario es beneficiario u originador)
    DELETE FROM public.commissions WHERE affiliate_id = p_affiliate_id OR originator_id = p_affiliate_id;
    DELETE FROM public.affiliate_store_config WHERE affiliate_id = p_affiliate_id;
    
    -- 4. Limpiar tablas vinculadas al user_id (auth)
    IF v_user_id IS NOT NULL THEN
        -- Billetera
        DELETE FROM public.credit_transactions WHERE user_credit_id IN (SELECT id FROM public.user_credits WHERE user_id = v_user_id);
        DELETE FROM public.user_credits WHERE user_id = v_user_id;
        
        -- Perfil y Accesos
        DELETE FROM public.user_roles WHERE user_id = v_user_id;
        DELETE FROM public.user_addresses WHERE user_id = v_user_id;
        DELETE FROM public.favorites WHERE user_id = v_user_id;
        
        -- 5. Borrar de auth.users (libera el email)
        DELETE FROM auth.users WHERE id = v_user_id;
    END IF;

    -- 6. Borrar el registro de afiliado final
    DELETE FROM public.affiliates WHERE id = p_affiliate_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'auth';



