const https = require('https');

const TOKEN = 'sbp_4c004da70f0dd675f4bd1a4a9cd24c7f91d4583c';
const PROJECT = 'llabtbikofbbkongilqg';

const SQL = `
-- =============================================================================
-- WinClick — Migración: Acreditación de Comisiones a Billetera
-- Motor: PostgreSQL (Supabase)
-- Fecha: 2026-04-30
-- =============================================================================

-- 1. FUNCIÓN PARA LIQUIDAR UNA COMISIÓN INDIVIDUAL
CREATE OR REPLACE FUNCTION public.liquidate_commission(p_commission_id UUID, p_admin_id UUID)
RETURNS JSON AS $$
DECLARE
  v_comm   commissions%ROWTYPE;
  v_user_id UUID;
  v_email  TEXT;
  v_uc_id  UUID;
BEGIN
  -- 1. Obtener la comisión y validar estado
  SELECT * INTO v_comm FROM commissions WHERE id = p_commission_id;
  
  IF v_comm IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Comisión no encontrada');
  END IF;
  
  IF v_comm.status != 'pending' THEN
    RETURN json_build_object('success', false, 'error', 'La comisión ya no está pendiente (Estado: ' || v_comm.status || ')');
  END IF;

  IF v_comm.is_breakage THEN
    RETURN json_build_object('success', false, 'error', 'No se pueden acreditar comisiones de tipo breakage/rejected');
  END IF;

  -- 2. Obtener el user_id del afiliado beneficiario
  SELECT user_id, email INTO v_user_id, v_email FROM affiliates WHERE id = v_comm.affiliate_id;
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Afiliado no encontrado para esta comisión');
  END IF;

  -- 3. Asegurar que existe la fila en user_credits y obtener su ID
  INSERT INTO user_credits (user_id, email, balance)
  VALUES (v_user_id, v_email, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  SELECT id INTO v_uc_id FROM user_credits WHERE user_id = v_user_id;

  -- 4. Actualizar el saldo de la billetera
  UPDATE user_credits
  SET balance    = balance + v_comm.amount,
      updated_at = NOW()
  WHERE id = v_uc_id;

  -- 5. Registrar la transacción en el historial de la billetera
  INSERT INTO credit_transactions (user_credit_id, amount, type, description)
  VALUES (v_uc_id, v_comm.amount, 'credit', 'Comisión acreditada - Pedido #' || SUBSTRING(v_comm.order_id::text, 1, 8));

  -- 6. Marcar la comisión como pagada
  UPDATE commissions
  SET status = 'paid',
      updated_at = NOW()
  WHERE id = p_commission_id;

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';


-- 2. FUNCIÓN PARA LIQUIDAR TODAS LAS COMISIONES PENDIENTES
CREATE OR REPLACE FUNCTION public.liquidate_all_pending_commissions(p_admin_id UUID)
RETURNS JSON AS $$
DECLARE
  v_rec     RECORD;
  v_count   INT := 0;
  v_res     JSON;
BEGIN
  FOR v_rec IN 
    SELECT id FROM commissions 
    WHERE status = 'pending' 
      AND is_breakage = FALSE
  LOOP
    v_res := public.liquidate_commission(v_rec.id, p_admin_id);
    IF (v_res->>'success')::boolean THEN
      v_count := v_count + 1;
    END IF;
  END LOOP;

  RETURN json_build_object('success', true, 'count', v_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- 3. COMENTARIOS DE SEGURIDAD
COMMENT ON FUNCTION public.liquidate_commission IS 'Mueve saldo de una comisión pendiente a la billetera del afiliado. Solo ejecutable por admin.';
COMMENT ON FUNCTION public.liquidate_all_pending_commissions IS 'Mueve saldo de TODAS las comisiones pendientes a las billeteras. Solo ejecutable por admin.';
`;

function runSql(sql) {
  return new Promise((resolve) => {
    const body = JSON.stringify({ query: sql });
    const options = {
      hostname: 'api.supabase.com',
      path: `/v1/projects/${PROJECT}/database/query`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const status = res.statusCode;
        try {
          const parsed = JSON.parse(data);
          if (status >= 200 && status < 300) {
            console.log(`\n✅ SQL Ejecutado con éxito`);
            resolve(true);
          } else {
            console.log(`\n❌ Error en SQL — HTTP ${status}`);
            console.log('  ', JSON.stringify(parsed));
            resolve(false);
          }
        } catch {
          console.log(`\n❌ Error en SQL — HTTP ${status}`);
          console.log('  RAW:', data);
          resolve(false);
        }
      });
    });

    req.on('error', (e) => {
      console.log(`\n❌ Error — ${e.message}`);
      resolve(false);
    });

    req.write(body);
    req.end();
  });
}

async function main() {
  console.log('=== Aplicando Mejora de Acreditación a Supabase ===\n');
  const ok = await runSql(SQL);
  if (ok) {
    console.log('\n=== MEJORA APLICADA CON EXITO ===');
  } else {
    console.log('\n=== FALLO AL APLICAR LA MEJORA ===');
  }
}

main();
