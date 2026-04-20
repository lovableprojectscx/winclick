# Cambios — Conexión Frontend a Supabase
**Proyecto:** WinClick
**Fecha:** 31 de marzo de 2026
**Objetivo:** Reemplazar todos los datos mock por datos reales de Supabase

---

## Resumen ejecutivo

Se reemplazaron **todos los imports de archivos mock** (`@/data/affiliates`, `@/data/orders`, `@/data/products`) por hooks de React Query conectados a Supabase en **7 páginas y 2 archivos de hooks**.

Se creó el sistema completo de hooks para afiliados, admin y tienda.

Se auditaron y corrigieron las políticas RLS directamente en la base de datos de Supabase.

---

## 1. Archivos de hooks

### `src/hooks/useAffiliate.ts` — Actualizado

**Funciones nuevas agregadas:**

#### `useMyStoreConfig()`
Lee la configuración de la tienda del afiliado autenticado desde `affiliate_store_config`.
- Query key: `["store-config", affiliate.id]`
- Retorna: `StoreConfig | null`

#### `useUpdateStoreConfig()`
Hace upsert en `affiliate_store_config` (crea si no existe, actualiza si existe).
- Conflicto en: `affiliate_id`
- Invalida: `store-config`, `store-products`

---

### `src/hooks/useAdmin.ts` — Nuevo archivo

Hooks exclusivos para el panel de administración.

| Hook | Tabla | Operación |
|------|-------|-----------|
| `useAllAffiliates()` | `affiliates` | SELECT * ORDER BY created_at DESC |
| `useAllOrders()` | `orders` + `order_items(*)` | SELECT con join |
| `useAllPayments()` | `affiliate_payments` + `affiliates(name, code)` | SELECT con join |
| `useApprovePayment()` | RPC `approve_affiliate_payment` | Llama función SECURITY DEFINER |
| `useRejectPayment()` | `affiliate_payments` | UPDATE status = 'rechazado' |
| `useBreakageCommissions()` | `commissions` | SELECT WHERE is_breakage = true |
| `useUpdateOrderStatus()` | `orders` | UPDATE status |
| `useUpdateAffiliate()` | `affiliates` | UPDATE name, yape_number, package |
| `useUpdateProduct()` | `products` | UPDATE name, price, stock, description |
| `useCreateProduct()` | `products` | INSERT nuevo producto |

**Tipos exportados:**
```typescript
OrderWithItems = Order & { order_items: OrderItem[] }
PaymentWithAffiliate = AffiliatePayment & { affiliate: { name, affiliate_code } | null }
BreakageCommission = Commission & { affiliate: { name, affiliate_code } | null }
```

---

## 2. Páginas reescritas

### `src/pages/AreaAfiliado.tsx` — Reescritura completa

**Datos reemplazados:**

| Antes (mock) | Después (Supabase) |
|---|---|
| `import { affiliates } from "@/data/affiliates"` | `useAffiliateStats()`, `useMyCommissions()`, `useMyNetwork()` |
| `import { orders } from "@/data/orders"` | `useMyPayments()`, `useWallet()` |
| `user.affiliateCode` | `affiliate.affiliate_code` |
| `user.status` | `affiliate.account_status` |
| `user.referralCount` | `affiliate.referral_count` |
| `user.uvAmount` | `affiliateStats?.uv_amount_month` |
| Red filtrada de mock | `useMyNetwork()` filtrado a `level === 1` |
| Comisiones de mock | `useMyCommissions()` |
| Retiros de mock | `useMyPayments().filter(p => p.type === "retiro")` |

**Upgrade modal:**
- Llama `useSubmitPayment()` con `type: "upgrade"`, `packageFrom`, `packageTo`, `receiptFile`

---

### `src/pages/MiBilletera.tsx` — Reescritura completa

**Datos reemplazados:**

| Antes (mock) | Después (Supabase) |
|---|---|
| `mockTransactions` | `useWallet().transactions` |
| `mockWithdrawals` | `useMyPayments().filter(p => p.type === "retiro")` |
| `user.balance` | `walletData?.balance ?? 0` |
| `user.status` | `affiliate.account_status` |
| `user.nextReactivation` | `affiliate.next_reactivation_due` |

**Mutations conectadas:**
- Reactivación: `submitPayment({ type: "reactivacion", amount: 300, receiptFile, reactivationMonth })`
- Recarga: `submitPayment({ type: "recarga_billetera", amount, receiptFile, walletCreditAmount })`
- Retiro: `submitPayment({ type: "retiro", amount, receiptFile: placeholder, withdrawalMethod, withdrawalAccount })`

---

### `src/pages/Checkout.tsx` — Reescritura completa

**Datos reemplazados:**

| Antes (mock) | Después (Supabase) |
|---|---|
| `mockAffiliates` para validar ref | `supabase.from("affiliates").select().eq("affiliate_code", code)` async |
| `user.walletBalance` | `useWallet().balance` |
| Número de pedido generado localmente | `order.order_number` desde `usePlaceOrder()` |

**Flujo de pago con efectivo:**
1. Sube comprobante a Storage bucket `receipts`
2. Guarda URL pública
3. Crea pedido con `usePlaceOrder()` pasando `receiptUrl`

---

### `src/pages/EditarTienda.tsx` — Reescritura completa

**Datos reemplazados:**

| Antes (mock) | Después (Supabase) |
|---|---|
| `products` de `@/data/products` | `useProducts()` |
| `mockAffiliates` para código | `affiliate.affiliate_code` de `useAuth()` |
| Estado hardcodeado | `useMyStoreConfig()` popula el formulario |
| Sin save real | `useUpdateStoreConfig().mutateAsync(...)` |

**useEffect** que carga config al montar:
```typescript
useEffect(() => {
  if (storeConfig) {
    setStoreName(storeConfig.store_name ?? "");
    setStoreTagline(storeConfig.tagline ?? "");
    setStoreColor(storeConfig.accent_color ?? "#F2C94C");
    setStoreEmoji(storeConfig.banner_emoji ?? "🌿");
    setStoreWhatsapp(storeConfig.whatsapp ?? "");
    setStoreActive(storeConfig.is_public ?? true);
    setSelectedProducts(storeConfig.featured_product_ids ?? []);
  }
}, [storeConfig]);
```

---

### `src/pages/AdminDashboard.tsx` — Reescritura completa

**Datos mock eliminados:**
- `mockOrders`, `mockAffiliates`, `mockCommissions`
- `mockWithdrawals`, `mockTransactions`
- `mockActivaciones`, `mockReactivaciones`, `mockUpgrades`
- `mockRecargasBilletera`, `mockRemanentes`
- `mockPaymentApprovals`
- `products` de `@/data/products`

**Hooks conectados:**

| Hook | Uso |
|---|---|
| `useAllAffiliates()` | Tab Afiliados, Resumen KPIs, Reportes |
| `useAllOrders()` | Tab Pedidos, Resumen últimos pedidos |
| `useAllPayments()` | Tab Pagos (5 sub-tabs) |
| `useBreakageCommissions()` | Tab Remanentes |
| `useProducts()` | Tab Catálogo |
| `useApprovePayment()` | Botón Aprobar en cada sub-tab de pagos |
| `useRejectPayment()` | Botón Rechazar en cada sub-tab de pagos |
| `useUpdateAffiliate()` | Modal Editar Afiliado → Guardar |
| `useUpdateProduct()` | Modal Editar Producto → Guardar |
| `useCreateProduct()` | Modal Nuevo Producto → Crear |

**Agregados derivados (sin hook extra):**
```typescript
const totalRevenue     = orders.reduce((s, o) => s + o.total, 0);
const totalCommissions = affiliates.reduce((s, a) => s + (a.total_commissions ?? 0), 0);
const pendingWithdrawals = payments.filter(...).reduce((s, p) => s + p.amount, 0);
```

**Modales conectados:**

| Modal | Antes | Después |
|---|---|---|
| Editar Afiliado | Solo cerraba | UPDATE affiliates (name, yape, package) |
| Editar Producto | Solo cerraba | UPDATE products (name, price, stock, description) |
| Nuevo Producto | Sin acción | INSERT products |

---

## 3. Base de datos — Políticas RLS

### Auditoría realizada

Se conectó directamente a Supabase (proyecto `llabtbikofbbkongilqg`) y se auditaron todas las policies existentes.

**Estado antes de los fixes:**

| Tabla | RLS | Policies existentes |
|---|---|---|
| affiliates | ✅ | SELECT own + admin. **Sin SELECT público** |
| products | ✅ | SELECT public (true) + admin write ✓ |
| orders | ✅ | INSERT public + SELECT affiliate/admin ✓ |
| order_items | ✅ | INSERT public + SELECT via order ✓ |
| commissions | ✅ | SELECT affiliate/admin ✓ |
| affiliate_payments | ✅ | SELECT own + INSERT own + UPDATE admin ✓ |
| affiliate_store_config | ✅ | SELECT if is_public=true + owner ALL ✓ |
| user_credits | ✅ | SELECT own + admin ✓ |
| credit_transactions | ✅ | SELECT own + admin ✓ |
| referrals | ✅ | SELECT own + admin ✓ |
| user_roles | ✅ | SELECT own + admin. **Sin INSERT** |
| categories | ✅ | SELECT public + admin write ✓ |
| business_settings | ✅ | Admin only ✓ |
| volume_units | ✅ | SELECT own + admin ✓ |

### Bugs encontrados y corregidos

#### Bug 1: `affiliates` sin SELECT público — CRÍTICO
**Consecuencia:** `TiendaAfiliado` y validación de código de referido en `Checkout` fallaban completamente para visitantes no autenticados. Las tiendas públicas no cargaban.

**Fix aplicado en Supabase:**
```sql
CREATE POLICY "affiliates: public select"
  ON affiliates FOR SELECT USING (true);
```

#### Bug 2: `user_roles` sin INSERT — IMPORTANTE
**Consecuencia:** Al registrar un nuevo afiliado, el INSERT del rol `"affiliate"` en `user_roles` fallaba silenciosamente. El rol no quedaba guardado en la DB.

**Fix aplicado en Supabase:**
```sql
CREATE POLICY "user_roles: insert own"
  ON user_roles FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### Notas sobre el sistema de roles

- Roles disponibles (enum `app_role`): `admin`, `affiliate`, `user`
- Función `has_role(user_id, role)` — definida en la BD, usada por la mayoría de policies
- Función `is_admin()` del `03_rls.sql` original estaba **rota** (consultaba tabla `profiles` inexistente) — nunca fue ejecutada
- El archivo `09_rls_correct.sql` en `docs/db/` documenta las policies correctas para referencia futura

---

## 4. Archivo de referencia SQL generado

### `docs/db/09_rls_correct.sql`

Documenta las políticas RLS correctas y completas para todas las tablas.
Incluye helpers `is_admin()` y `my_affiliate_id()` correctos (usan `user_roles`, no `profiles`).
**Los 2 fixes críticos fueron aplicados directamente a la BD** — el resto de las policies ya estaban correctas.

---

## 5. Estado final del proyecto

### Páginas y su fuente de datos

| Página | Ruta | Fuente de datos |
|---|---|---|
| Catálogo | `/catalogo` | `useProducts()` → Supabase ✅ |
| Detalle producto | `/producto/:id` | `useProductById()` → Supabase ✅ |
| Tienda afiliado | `/tienda/:code` | `useStoreByCode()` → Supabase ✅ |
| Login afiliado | `/login-afiliado` | `supabase.auth.signIn` ✅ |
| Registro afiliado | `/registro-afiliado` | `register_affiliate` RPC ✅ |
| Área afiliado | `/area-afiliado` | `useAffiliateStats()` + demás ✅ |
| Mi billetera | `/mi-billetera` | `useWallet()` + `useMyPayments()` ✅ |
| Editar tienda | `/editar-tienda` | `useMyStoreConfig()` ✅ |
| Checkout | `/checkout` | `usePlaceOrder()` + `useWallet()` ✅ |
| Admin dashboard | `/admin` | `useAllAffiliates/Orders/Payments()` ✅ |

### Cero datos mock en producción
Todos los archivos de datos eliminados del flujo de producción:
- `@/data/affiliates` — no se importa en ninguna página principal
- `@/data/orders` — no se importa en ninguna página principal
- `@/data/products` — no se importa en ninguna página principal

### TypeScript
`npx tsc --noEmit` ejecutado después de cada cambio. **0 errores** en todos los casos.

---

## 6. Pendientes conocidos (no bloqueantes)

| Tema | Detalle |
|---|---|
| Retiro sin comprobante | `useSubmitPayment` siempre sube a Storage; retiros pasan `new File([], "retiro.txt")` como placeholder |
| Settings hardcodeados | Números de banco/Yape en MiBilletera y AreaAfiliado son texto fijo — deberían venir de `business_settings` |
| `useWallet` puede fallar | Si el afiliado no tiene fila en `user_credits` aún, retorna balance 0 (no rompe, pero muestra vacío) |
| Gamificación estática | Tab Gamificación en AdminDashboard usa datos mock vacíos — tablas `missions`/`seasons` fueron eliminadas de la BD |

---

*WinClick · Conexión Supabase · 31 de marzo de 2026*
