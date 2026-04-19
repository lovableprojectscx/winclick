# Auditoría Técnica — Lógica de Activación de Membresía y Catálogo
**Proyecto:** Winclick / winner-s-edge  
**Fecha:** Abril 2026  
**Alcance:** Flujo completo de activación de afiliados y su relación con el catálogo de productos, precios y acumulación de compras.

---

## 1. Resumen Ejecutivo

El sistema implementa un modelo MLM donde los afiliados activan su membresía comprando productos del catálogo hasta alcanzar una meta de inversión según su plan. La auditoría encontró **3 problemas críticos, 4 de riesgo medio y 3 observaciones menores** que afectan la correctitud del flujo de activación, la consistencia de precios por plan y la automatización del proceso de aprobación.

---

## 2. Arquitectura del Flujo de Activación

### 2.1 Tablas involucradas

| Tabla | Rol en la activación |
|---|---|
| `affiliates` | Estado de cuenta (`account_status`), acumulado (`total_sales`), profundidad desbloqueada (`depth_unlocked`) |
| `orders` | Pedidos realizados por el afiliado al catálogo |
| `order_items` | Productos individuales de cada pedido |
| `affiliate_payments` | Pagos administrativos (activación manual, reactivación, upgrade, retiros) |
| `payment_proofs` | Comprobantes de pago adjuntos a cada orden |
| `products` | Catálogo con `public_price`, `partner_price` y `price` (legacy) |

### 2.2 Flujo real paso a paso

```
1. Registro (/registro-afiliado)
   └─ register_affiliate() RPC → affiliates.account_status = 'pending'

2. Catálogo (/catalogo)
   └─ ProductCard / ProductDetail muestran partner_price para afiliados logueados
   └─ addItem() guarda unitPrice = partner_price al momento de agregar

3. Checkout (/checkout)
   └─ ActivationProgress lee affiliate.total_sales (DB) + cart.total (local)
   └─ usePlaceOrder() crea: orders + order_items + payment_proofs
   └─ affiliate_id en la orden = ID del propio afiliado (auto-fill de refCode)

4. Procesamiento admin (AdminDashboard)
   └─ Admin cambia order.status → trigger DB actualiza total_sales
   └─ Admin cambia affiliate.account_status manualmente → 'active'

5. Activación efectiva
   └─ account_status = 'active' desbloquea: tienda, red, comisiones, billetera
```

---

## 3. Hallazgos Críticos

### 🔴 C-01 — Descuento de activación por plan NO se aplica en el carrito

**Severidad:** Crítica  
**Archivos:** `src/components/ProductCard.tsx`, `src/pages/ProductDetail.tsx`, AdminDashboard precio

**Descripción:**  
Los planes publicitan descuentos diferenciados para la compra de activación:
- Básico → 40% OFF
- Intermedio → 50% OFF
- VIP → 55% OFF

Sin embargo, la tabla `products` tiene un **único campo `partner_price`** (fijo al 50% del `public_price` según el admin dashboard). Todos los afiliados —independientemente de su plan y de si están Pendientes o Activos— ven el mismo `partner_price`:

```tsx
// ProductCard.tsx — mismo precio para TODOS los afiliados
const displayPrice = affiliate
  ? (product.partner_price ?? product.public_price ?? product.price)
  : (product.public_price ?? product.price);
```

```tsx
// AdminDashboard.tsx — partner_price = public_price × 0.50 fijo
onChange={(e) => {
  const num = parseFloat(v) || 0;
  if (num > 0) setProdPartnerPrice((num * 0.50).toFixed(2)); // siempre 50%
}}
```

**Consecuencia:** Un afiliado Básico paga el mismo precio que un VIP. El 40% y 55% anunciados en la UI de registro y en el `ProductDetail` son informativos pero no se reflejan en el precio real del carrito.

**Solución recomendada:**  
Agregar lógica de precio dinámico según el plan del afiliado. Opciones:
- **Opción A (simple):** Usar un factor calculado en el frontend: `discountFactor = { Básico: 0.60, Intermedio: 0.50, VIP: 0.45 }[affiliate.package]`, y calcular `displayPrice = public_price * factor` si `account_status === 'pending'`, y `partner_price` si está activo.
- **Opción B (robusta):** Agregar campos `activation_price_basico`, `activation_price_intermedio`, `activation_price_vip` a la tabla `products`, calculados automáticamente al guardar.

---

### 🔴 C-02 — `total_sales` no se actualiza en tiempo real: la barra de progreso queda en 0%

**Severidad:** Crítica  
**Archivos:** `src/pages/Checkout.tsx`, `src/pages/AreaAfiliado.tsx`, `docs/db/08_migration.sql`

**Descripción:**  
La barra de progreso de activación lee `affiliate.total_sales` de la DB:

```tsx
// AreaAfiliado.tsx
const spent = totalSales; // affiliateStats.total_sales
const pct = Math.min(100, (spent / target) * 100);

// Checkout.tsx — ActivationProgress
alreadySpent={affiliate.total_sales ?? 0}
```

El campo `total_sales` en la tabla `affiliates` se actualiza mediante la función `create_order_commissions()`, que se ejecuta **solo cuando un trigger de DB dispara** al cambiar el estado del pedido. Hasta que el admin no procese la orden, el campo queda en su valor anterior.

**Consecuencia práctica:**
- Afiliado paga S/120 y confirma pedido → order.status = 'pendiente'
- Barra de progreso sigue en **0%** — confunde al usuario
- Puede esperar hasta 24h sin feedback visual de que su pago fue registrado

**Solución recomendada:**  
Agregar un indicador "en revisión" usando `orders` pendientes del propio afiliado:
```tsx
// En el hook useAffiliateStats o en Checkout/AreaAfiliado
const pendingOrdersTotal = myOrders
  .filter(o => o.status === 'pendiente' && o.affiliate_id === affiliate.id)
  .reduce((s, o) => s + o.total, 0);

const effectiveSpent = totalSales + pendingOrdersTotal;
```
Mostrar el segmento de pedidos pendientes en color distinto (gris o punteado) para comunicar "en revisión".

---

### 🔴 C-03 — No existe automatización para activar la cuenta al alcanzar la meta

**Severidad:** Crítica  
**Archivos:** `docs/db/08_migration.sql` (`approve_affiliate_payment`), `src/hooks/useAdmin.ts`

**Descripción:**  
Cuando un afiliado pendiente acumula suficientes compras (total_sales ≥ target), el sistema **no cambia automáticamente** `account_status` de `'pending'` a `'active'`. El admin debe hacerlo manualmente en el panel.

La función `approve_affiliate_payment()` SÍ tiene lógica de activación automática al aprobar un `affiliate_payment` de tipo `'activacion'`, pero el flujo de checkout **nunca crea** un registro en `affiliate_payments`. Solo crea `orders`. El gap es total:

```
Flujo diseñado (DB):
  affiliate_payments (type='activacion') → approve_affiliate_payment() → auto-activa

Flujo real (frontend):
  orders (checkout) → admin cambia status manualmente → nothing automatic
```

**Consecuencia:** La activación depende de que el admin revise y apruebe manualmente. Si el admin no interviene, la cuenta queda en `'pending'` indefinidamente aunque el afiliado haya cumplido la meta.

**Solución recomendada:**  
Crear un trigger en PostgreSQL sobre la tabla `orders` que dispare cuando `orders.status = 'entregado'` y verifique si el afiliado pendiente alcanzó la meta:

```sql
CREATE OR REPLACE FUNCTION check_activation_on_delivery()
RETURNS TRIGGER AS $$
DECLARE
  v_status TEXT; v_package TEXT; v_target NUMERIC; v_total NUMERIC;
BEGIN
  IF NEW.status != 'entregado' OR NEW.affiliate_id IS NULL THEN RETURN NEW; END IF;

  SELECT account_status, package INTO v_status, v_package
  FROM affiliates WHERE id = NEW.affiliate_id;

  IF v_status != 'pending' THEN RETURN NEW; END IF;

  v_target := CASE v_package WHEN 'VIP' THEN 10000 WHEN 'Intermedio' THEN 2000 ELSE 120 END;

  SELECT COALESCE(SUM(total), 0) INTO v_total
  FROM orders
  WHERE affiliate_id = NEW.affiliate_id AND status = 'entregado';

  IF v_total >= v_target THEN
    UPDATE affiliates SET
      account_status = 'active', activated_at = NOW(),
      last_reactivation_at = NOW(),
      next_reactivation_due = (DATE_TRUNC('month', NOW()) + INTERVAL '1 month')::DATE
    WHERE id = NEW.affiliate_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 4. Riesgos Medios

### 🟡 M-01 — Condición de pendiente usa dos campos distintos

**Archivos:** `src/pages/Checkout.tsx`

```tsx
// Banner usa activated_at (timestamp)
} else if (affiliate && !affiliate.activated_at) {
  // "Compra de activación..."

// Barra de progreso usa account_status (string)
{affiliate && affiliate.account_status === "pending" && affiliate.package && (
  <ActivationProgress ... />
)}
```

Si por alguna razón `activated_at` se rellena antes de que `account_status` cambie a `'active'` (ej. migración de datos, fallo parcial de DB), el banner desaparece pero la barra sigue visible, o viceversa.

**Solución:** Unificar la condición en `account_status === 'pending'` en ambos lugares.

---

### 🟡 M-02 — `total_sales` acumula todas las compras, no solo las de activación

**Descripción:**  
Una vez activo, `total_sales` sigue incrementando con cada recompra mensual. El campo pierde su significado específico de "monto acumulado para activación" y pasa a ser "ventas totales históricas". Esto no causa bugs visibles porque la barra de activación solo se muestra cuando `account_status === 'pending'`, pero complica análisis futuros.

**Recomendación:** Agregar un campo separado `activation_sales` que solo acumule durante el período de pendiente, y usar `total_sales` exclusivamente para el volumen de ventas histórico.

---

### 🟡 M-03 — Precio en carrito puede quedar desactualizado (staleness)

**Archivos:** `src/contexts/CartContext.tsx`

```tsx
// El precio se fija al momento de agregar al carrito
const resolvedPrice = toN(unitPrice ?? product.public_price ?? product.price);
// Se persiste en localStorage indefinidamente
localStorage.setItem("wo_cart_items", JSON.stringify(items));
```

Si el admin actualiza `partner_price` de un producto después de que un afiliado lo agregó al carrito, el afiliado compra al precio antiguo. El pedido se crea con ese precio sin validación contra el precio actual en DB.

**Solución:** Al cargar el checkout, revalidar los precios del carrito contra la DB:
```tsx
// En useEffect del Checkout, re-fetch de precios actuales
const freshPrices = await supabase.from('products').select('id, partner_price, public_price').in('id', items.map(i => i.product.id));
// Actualizar unitPrice si cambió
```

---

### 🟡 M-04 — `create_order_commissions` nunca se llama desde el frontend

**Archivos:** `src/hooks/useOrders.ts`, `docs/db/08_migration.sql`

```tsx
// useOrders.ts — comentario incorrecto
// Las comisiones se calculan automáticamente via trigger DB
// cuando el pedido alcanza el estado 'entregado' (trigger_commissions_on_delivery)
```

La función `create_order_commissions` está registrada como RPC en `database.types.ts` pero **no se llama desde ningún punto del frontend**. El comentario dice "automáticamente via trigger" pero el trigger en `02_triggers.sql` llama a `distribute_commissions()` (función del schema antiguo), no a `create_order_commissions()`. Existe riesgo de que la función correcta no esté asociada al trigger en el DB de producción.

**Acción:** Verificar en Supabase SQL Editor qué función está efectivamente asociada al trigger de distribución de comisiones, y asegurar que es `create_order_commissions` (que actualiza `total_sales`).

---

## 5. Observaciones Menores

### 🔵 O-01 — `data/orders.ts` contiene datos mock sin uso

El archivo `src/data/orders.ts` define tipos e interfaces duplicadas (`Order`, `Commission`, etc.) con datos mock que no se usan en producción. Puede confundir a futuros desarrolladores. **Recomendación:** Eliminar o marcar claramente como `@deprecated`.

### 🔵 O-02 — `affiliate_payments` de tipo `'activacion'` nunca se crea

La tabla `affiliate_payments` y la RPC `approve_affiliate_payment()` tienen soporte completo para activación (type='activacion'), pero el frontend no crea nunca ese tipo de registro. El flujo de activación real usa `orders`. La tabla `affiliate_payments` actualmente se usa solo para: reactivación, upgrade, recarga de billetera y retiros.

### 🔵 O-03 — `10_reactivation_auto.sql` marcado como "NO EJECUTAR" pero crítico

El archivo `docs/db/10_reactivation_auto.sql` está marcado como redundante pero contiene una nota importante:
> "affiliate_id en orders = el comisionista (referidor). Para distinguir compras personales de ventas a clientes se necesitaría un campo `buyer_affiliate_id` (mejora futura)."

Actualmente el sistema no distingue si el afiliado está comprando para sí mismo (activación) o generando una venta a un cliente. El `affiliate_id` en `orders` representa al referidor, no necesariamente al comprador. Esta ambigüedad afecta el cálculo de `total_sales` para activación.

---

## 6. Mapa de Relación: Catálogo ↔ Activación

```
products
├── public_price  ← precio mostrado a clientes (fuente de verdad)
├── partner_price ← public_price × 0.50 (fijo — no diferencia por plan)
└── price         ← campo legacy, usar como último fallback

                        ┌─────────────────┐
Afiliado PENDING ──────►│   ProductCard   │ → muestra partner_price (50% off)
                        │   ProductDetail │ → muestra tiered prices (UI only)
                        └────────┬────────┘
                                 │ addItem(product, partner_price)
                        ┌────────▼────────┐
                        │   CartContext   │ → persiste unitPrice en localStorage
                        └────────┬────────┘
                                 │ items.map(i => { price: i.unitPrice })
                        ┌────────▼────────┐
                        │    Checkout     │ → usePlaceOrder() → INSERT orders
                        │ ActivationBar   │ → lee affiliate.total_sales (DB) ← desfasado
                        └────────┬────────┘
                                 │ orders.status = 'pendiente'
                        ┌────────▼────────┐
                        │ AdminDashboard  │ → cambia status → trigger DB
                        └────────┬────────┘
                    ┌────────────┴────────────┐
                    │                         │
           create_order_commissions()    check_reactivation_on_delivery()
           UPDATE affiliates.total_sales  (solo para 'suspended', no 'pending')
                    │
                    └─► Barra de progreso actualizada
                        (pero activación aún manual)
```

---

## 7. Tabla de Severidades y Prioridades

| ID | Descripción | Severidad | Esfuerzo | Prioridad |
|---|---|---|---|---|
| C-01 | Descuento por plan no se aplica en carrito | 🔴 Crítica | Alto | P1 |
| C-02 | Barra de progreso no refleja pedidos pendientes | 🔴 Crítica | Bajo | P1 |
| C-03 | Activación no es automática al alcanzar meta | 🔴 Crítica | Medio | P1 |
| M-01 | Condición pendiente usa dos campos distintos | 🟡 Media | Bajo | P2 |
| M-02 | total_sales acumula activación + recompras | 🟡 Media | Medio | P2 |
| M-03 | Precio en carrito puede desactualizarse | 🟡 Media | Bajo | P2 |
| M-04 | create_order_commissions puede no estar en trigger activo | 🟡 Media | Bajo | P1 |
| O-01 | data/orders.ts con mock sin uso | 🔵 Menor | Bajo | P3 |
| O-02 | affiliate_payments type='activacion' nunca se crea | 🔵 Menor | — | P3 |
| O-03 | buyer_affiliate_id vs affiliate_id ambigüedad | 🔵 Menor | Alto | P3 |

---

## 8. Plan de Acción Recomendado

### Inmediato (esta semana)
1. **M-01**: Unificar condición `account_status === 'pending'` en Checkout.tsx (10 min).
2. **M-04**: Verificar en Supabase SQL Editor que el trigger de órdenes llama `create_order_commissions`. Si no, asociarlo.
3. **C-02**: Agregar indicador visual de "pedidos en revisión" en la barra de progreso usando `useMyOrders()`.

### Corto plazo (próximas 2 semanas)
4. **C-03**: Implementar trigger `check_activation_on_delivery()` para activación automática al cumplir la meta.
5. **M-03**: Revalidar precios del carrito al abrir el checkout.

### Mediano plazo (próximo mes)
6. **C-01**: Implementar precios diferenciados por plan. Definir con el negocio si el descuento de activación debe variar realmente o si todos pagan el mismo `partner_price`.
7. **M-02**: Agregar campo `activation_sales` separado de `total_sales`.
8. **O-01**: Eliminar `src/data/orders.ts`.

---

*Auditoría realizada sobre el código fuente completo del repositorio winner-s-edge-main. Las recomendaciones asumen PostgreSQL 14+ (Supabase) y React 18 + TypeScript.*
