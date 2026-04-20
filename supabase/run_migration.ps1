param([string]$Step, [string]$Sql)

$headers = @{
    'Authorization' = 'Bearer sbp_4c004da70f0dd675f4bd1a4a9cd24c7f91d4583c'
    'Content-Type'  = 'application/json'
}

function Run-Sql($label, $query) {
    Write-Host "`n=== $label ===" -ForegroundColor Cyan
    $body = [System.Text.Encoding]::UTF8.GetBytes(
        ((@{ query = $query } | ConvertTo-Json -Depth 5 -Compress))
    )
    try {
        $res = Invoke-RestMethod `
            -Uri 'https://api.supabase.com/v1/projects/llabtbikofbbkongilqg/database/query' `
            -Method POST `
            -Headers $headers `
            -Body $body `
            -ContentType 'application/json'
        Write-Host "OK" -ForegroundColor Green
        $res | ForEach-Object {
            Write-Host ("  " + ($_ | ConvertTo-Json -Compress))
        }
    } catch {
        Write-Host "ERROR" -ForegroundColor Red
        try {
            $stream = $_.Exception.Response.GetResponseStream()
            $reader = [System.IO.StreamReader]::new($stream)
            Write-Host $reader.ReadToEnd()
        } catch {
            Write-Host $_.Exception.Message
        }
    }
}

# ── PASO 3a: Agregar columna is_activation_order ──────────────────────────────
Run-Sql "PASO 3a — ALTER TABLE orders ADD is_activation_order" @"
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS is_activation_order BOOLEAN NOT NULL DEFAULT FALSE;
"@

# ── PASO 3b: Marcar ordenes pending existentes ────────────────────────────────
Run-Sql "PASO 3b — UPDATE ordenes pending existentes" @"
UPDATE orders o
SET is_activation_order = TRUE
FROM affiliates a
WHERE o.affiliate_id = a.id
  AND a.account_status = 'pending'
  AND o.is_activation_order = FALSE;
"@

# ── PASO 3c: Función y trigger auto_mark_activation ──────────────────────────
Run-Sql "PASO 3c — Función auto_mark_activation_order" @"
CREATE OR REPLACE FUNCTION auto_mark_activation_order()
RETURNS TRIGGER AS `$`$
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
`$`$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';
"@

Run-Sql "PASO 3c — Trigger trg_auto_mark_activation" @"
DROP TRIGGER IF EXISTS trg_auto_mark_activation ON orders;
CREATE TRIGGER trg_auto_mark_activation
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION auto_mark_activation_order();
"@

# ── PASO 4: Precio Basico = 120 ───────────────────────────────────────────────
Run-Sql "PASO 4 — package_basico_price = 120" @"
UPDATE business_settings
SET package_basico_price = 120
WHERE package_basico_price <> 120;
"@

# ── PASO 5a: Función distribute_commissions_v2 ────────────────────────────────
Run-Sql "PASO 5a — distribute_commissions_v2" @"
CREATE OR REPLACE FUNCTION distribute_commissions_v2(
  p_order_id       UUID,
  p_is_activation  BOOLEAN DEFAULT FALSE
)
RETURNS VOID AS `$`$
DECLARE
  v_order          RECORD;
  v_affiliate_id   UUID;
  v_upline         RECORD;
  v_level          INT;
  v_is_breakage    BOOLEAN;
  v_amount         NUMERIC(10,2);
  v_total          NUMERIC(10,2);
  v_rates          NUMERIC[] := ARRAY[10, 4, 2, 2, 1, 1, 1, 3, 0.5, 0.5];
BEGIN
  SELECT * INTO v_order FROM orders WHERE id = p_order_id;
  IF v_order IS NULL OR v_order.affiliate_id IS NULL THEN RETURN; END IF;
  v_affiliate_id := v_order.affiliate_id;
  v_total        := v_order.total;
  v_amount := ROUND(v_total * v_rates[1] / 100, 2);
  INSERT INTO commissions (
    affiliate_id, originator_id, order_id, amount, level, percentage, base_amount, status, is_breakage
  ) VALUES (
    v_affiliate_id, v_affiliate_id, p_order_id,
    v_amount, 1, v_rates[1], v_total,
    CASE WHEN p_is_activation THEN 'rejected' ELSE 'pending' END,
    p_is_activation
  ) ON CONFLICT DO NOTHING;
  UPDATE affiliates
  SET total_sales       = COALESCE(total_sales, 0) + v_total,
      total_commissions = COALESCE(total_commissions, 0) +
                          CASE WHEN p_is_activation THEN 0 ELSE v_amount END
  WHERE id = v_affiliate_id;
  IF p_is_activation THEN RETURN; END IF;
  FOR v_level IN 2..10 LOOP
    SELECT a.* INTO v_upline
    FROM affiliates a
    WHERE a.id = (
      SELECT referred_by FROM affiliates
      WHERE id = (
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
`$`$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';
"@

# ── PASO 5b: Trigger comisiones en entregado ──────────────────────────────────
Run-Sql "PASO 5b — trigger_commissions_on_delivery function" @"
CREATE OR REPLACE FUNCTION trigger_commissions_on_delivery()
RETURNS TRIGGER AS `$`$
BEGIN
  IF NEW.status = 'entregado' AND (OLD.status IS DISTINCT FROM 'entregado') THEN
    PERFORM distribute_commissions_v2(NEW.id, COALESCE(NEW.is_activation_order, FALSE));
  END IF;
  RETURN NEW;
END;
`$`$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';
"@

Run-Sql "PASO 5b — DROP + CREATE trigger trg_commissions_on_delivery" @"
DROP TRIGGER IF EXISTS trg_commissions_on_delivery ON orders;
DROP TRIGGER IF EXISTS trg_distribute_commissions  ON orders;
CREATE TRIGGER trg_commissions_on_delivery
  AFTER UPDATE OF status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION trigger_commissions_on_delivery();
"@

# ── VERIFICACION FINAL ────────────────────────────────────────────────────────
Run-Sql "VERIFICACION FINAL" @"
SELECT
  'orders.is_activation_order' AS check_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='orders' AND column_name='is_activation_order'
  ) THEN 'OK' ELSE 'FALTA PASO 3' END AS estado
UNION ALL SELECT
  'business_settings.package_basico_price = 120',
  COALESCE((
    SELECT CASE WHEN package_basico_price = 120 THEN 'OK'
                ELSE 'INCORRECTO: ' || package_basico_price
           END FROM business_settings LIMIT 1
  ), 'FALTA FILA')
UNION ALL SELECT
  'trigger trg_commissions_on_delivery',
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_name = 'trg_commissions_on_delivery'
  ) THEN 'OK' ELSE 'FALTA PASO 5' END
UNION ALL SELECT
  'trigger trg_auto_mark_activation',
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_name = 'trg_auto_mark_activation'
  ) THEN 'OK' ELSE 'FALTA PASO 3' END
UNION ALL SELECT
  'products sin public_price',
  COUNT(*)::TEXT || ' productos'
  FROM products WHERE public_price IS NULL
ORDER BY check_name;
"@

Write-Host "`n=== MIGRACION COMPLETADA ===" -ForegroundColor Green
