# Winclick — Documentación de Lógica de Funciones

> Generado: 2026-04-07  
> Versión del proyecto: master (f9a2eb1 + cambios de sesión)

---

## Tabla de Contenidos

1. [Contextos](#1-contextos)
   - [AuthContext](#authcontexttsx)
   - [CartContext](#cartcontexttsx)
2. [Hooks](#2-hooks)
   - [useAffiliate](#useaffiliatets)
   - [useOrders](#useordersts)
   - [useProducts](#useproductsts)
   - [useAdmin](#useadmints)
   - [useSEO](#useseots)
3. [Páginas](#3-páginas)
   - [RegistroAfiliado](#registroafiliadotsx)
   - [LoginAfiliado](#loginafiliadotsx)
   - [Checkout](#checkouttsx)
   - [MiBilletera](#mibilletera-tsx)
   - [AdminDashboard](#admindashboard-tsx)
4. [Tipos y Enums](#4-tipos-y-enums)
5. [RPCs de Supabase](#5-rpcs-de-supabase)
6. [Flujos Completos](#6-flujos-completos)

---

## 1. Contextos

### AuthContext.tsx
`src/contexts/AuthContext.tsx`

Provee sesión, perfil del afiliado y funciones de autenticación a toda la app.

---

#### `login(email, password)`

| Campo | Valor |
|---|---|
| Archivo | `src/contexts/AuthContext.tsx` |
| Propósito | Autenticar usuario con email y contraseña |

**Parámetros:**
- `email: string`
- `password: string`

**Pasos:**
1. Llama `supabase.auth.signInWithPassword({ email, password })`
2. Si hay error → retorna `{ error: error.message }`
3. Si éxito → retorna `{ error: null }`
4. El `onAuthStateChange` listener (montado en useEffect) detecta el cambio de sesión y dispara `loadProfile(userId)` automáticamente

**Retorna:** `Promise<{ error: string | null }>`

**Nota:** La sesión y el perfil no se setean aquí directamente — los maneja el listener de `onAuthStateChange`.

---

#### `register(data)`

| Campo | Valor |
|---|---|
| Archivo | `src/contexts/AuthContext.tsx` |
| Propósito | Crear cuenta de afiliado con código único y referidor opcional |

**Parámetros:** `RegisterData`
```typescript
{
  name: string
  email: string
  password: string
  dni: string
  yapeNumber: string
  packageType: PackageType   // "Básico" | "Intermedio" | "VIP"
  referralCode?: string      // código del referidor, opcional
}
```

**Pasos:**
1. Llama `supabase.auth.signUp({ email, password })`
   - Si falla → retorna `{ error: authError.message }`
   - Si `authData.user` es null → retorna `{ error: "No se pudo crear el usuario" }`
2. Genera código de afiliado: `"WIN-" + nombre[0..2].toUpperCase() + random(100–999)`
3. Verifica unicidad del código en tabla `affiliates`; si ya existe, regenera una vez más
4. Si viene `referralCode`: busca el `id` del referidor en tabla `affiliates` (por campo `affiliate_code`, uppercase)
5. Llama RPC `register_affiliate(p_user_id, p_name, p_dni, p_email, p_affiliate_code, p_yape_number, p_package, p_referred_by)`
   - Si falla → retorna `{ error: regError.message }`
6. Inserta `{ user_id, role: "affiliate" }` en tabla `user_roles`
7. Retorna `{ error: null }`

**Retorna:** `Promise<{ error: string | null }>`

**Errores manejados:** fallo en signUp, fallo en RPC, usuario null.

**Dependencias:** `supabase.auth`, tabla `affiliates`, RPC `register_affiliate`, tabla `user_roles`

---

#### `logout()`

| Campo | Valor |
|---|---|
| Propósito | Cerrar sesión |

**Pasos:**
1. Llama `supabase.auth.signOut()`
2. El listener `onAuthStateChange` detecta session=null y limpia `affiliate`, `role`, `loading`

**Retorna:** `Promise<void>`

---

#### `loadProfile(userId)`

| Campo | Valor |
|---|---|
| Propósito | Cargar rol y datos del afiliado tras autenticación |

**Parámetros:**
- `userId: string`

**Pasos:**
1. Setea `loading = true`
2. Consulta `user_roles` → `select("role").eq("user_id", userId).single()`
3. Setea `role = roleData?.role ?? "affiliate"`
4. Consulta `affiliates` → `select("*").eq("user_id", userId).single()`
5. Setea `affiliate = affiliateData ?? null`
6. En `finally` → setea `loading = false`

**Modifica estado:** `role`, `affiliate`, `loading`

**Llamada desde:** `useEffect` cuando `session` existe, tanto en carga inicial como en `onAuthStateChange`

---

#### Estado y propiedades del contexto

| Propiedad | Tipo | Descripción |
|---|---|---|
| `session` | `Session \| null` | Sesión activa de Supabase Auth |
| `affiliate` | `Affiliate \| null` | Perfil completo del afiliado |
| `role` | `"affiliate" \| "admin" \| null` | Rol del usuario |
| `isAdmin` | `boolean` | `role === "admin"` |
| `loading` | `boolean` | true mientras carga sesión o perfil |

---

### CartContext.tsx
`src/contexts/CartContext.tsx`

Maneja el estado del carrito de compras. Sin dependencias externas — lógica pura de `useState`.

---

#### `addItem(product)`

**Parámetros:** `product: Product`

**Pasos:**
1. Busca si `product.id` ya existe en `items`
2. Si existe → incrementa `quantity + 1`
3. Si no → agrega `{ product, quantity: 1 }`
4. Setea `lastAddedId = product.id`
5. Después de 300ms, limpia `lastAddedId = null` (para animación del badge)

**Modifica estado:** `items`, `lastAddedId`

---

#### `removeItem(productId)`

**Parámetros:** `productId: string`

**Pasos:**
1. Filtra `items` eliminando el que tenga `product.id === productId`

**Modifica estado:** `items`

---

#### `updateQuantity(productId, quantity)`

**Parámetros:** `productId: string`, `quantity: number`

**Pasos:**
1. Si `quantity <= 0` → llama `removeItem(productId)` y retorna
2. Si no → mapea `items` actualizando el `quantity` del item correspondiente

**Modifica estado:** `items`

---

#### `clearCart()`

**Pasos:**
1. Setea `items = []`

---

#### Propiedades derivadas (computed)

| Propiedad | Fórmula |
|---|---|
| `total` | `items.reduce((sum, i) => sum + i.product.price * i.quantity, 0)` |
| `itemCount` | `items.reduce((sum, i) => sum + i.quantity, 0)` |

---

#### Propiedades de estado

| Propiedad | Tipo | Default | Descripción |
|---|---|---|---|
| `isOpen` | `boolean` | `false` | Si el CartDrawer está visible |
| `affiliateCode` | `string \| null` | `null` | Código de afiliado para comisiones |
| `lastAddedId` | `string \| null` | `null` | ID del último producto agregado (300ms) |

---

## 2. Hooks

### useAffiliate.ts
`src/hooks/useAffiliate.ts`

---

#### `useBusinessSettings()`

**Propósito:** Obtener configuración pública del negocio (números de pago, comisiones, etc.)

**Query Key:** `["business-settings"]`

**Pasos:**
1. `supabase.from("business_settings").select("*").single()`

**Retorna:** `BusinessSettings | null`

**staleTime:** 5 minutos — esta data cambia poco.

---

#### `useAffiliateStats()`

**Propósito:** Estadísticas actualizadas del afiliado (rank, UV, ventas)

**Query Key:** `["affiliate-stats", affiliate?.id]`

**Pasos:**
1. Llama RPC `calculate_affiliate_rank({ p_affiliate_id })` para recalcular rango
2. Consulta tabla `affiliates` por `id` para obtener datos recalculados

**Enabled:** Solo si `affiliate?.id` existe

**Retorna:** `Affiliate` actualizado con rank y UV del mes

---

#### `useMyCommissions()`

**Propósito:** Comisiones del afiliado (excluye breakage/remanentes)

**Query Key:** `["commissions", affiliate?.id]`

**Filtros aplicados:**
- `affiliate_id = affiliate.id`
- `is_breakage = false`
- Orden: `created_at DESC`

**Enabled:** Solo si `affiliate?.id` existe

**Retorna:** `Commission[]`

---

#### `useWallet()`

**Propósito:** Saldo y transacciones de billetera

**Query Key:** `["wallet", affiliate?.id]`

**Pasos:**
1. Consulta `user_credits` por `user_id` incluyendo `credit_transactions(*)`

**Enabled:** Solo si `session && affiliate` existen

**Retorna:** `{ balance: number; transactions: CreditTransaction[] }`

---

#### `useMyPayments()`

**Propósito:** Historial de comprobantes enviados por el afiliado

**Query Key:** `["affiliate-payments", affiliate?.id]`

**Retorna:** `AffiliatePayment[]` — activaciones, reactivaciones, recargas, retiros

---

#### `useMyNetwork()`

**Propósito:** Red de referidos del afiliado

**Query Key:** `["network", affiliate?.id]`

**Pasos:**
1. Consulta tabla `referrals` donde `referrer_id = affiliate.id`
2. Incluye datos del referido: `id, name, affiliate_code, package, account_status, total_sales, rank, created_at`
3. Orden: `level ASC`

**Retorna:** `Array<{ level: number; referred: Affiliate }>`

---

#### `useSubmitPayment()`

**Propósito:** Mutación para subir comprobante de pago de cualquier tipo

**Parámetros de mutación** (`SubmitPaymentArgs`):

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `type` | `PaymentType` | ✅ | "activacion" \| "reactivacion" \| "upgrade" \| "recarga_billetera" \| "retiro" |
| `amount` | `number` | ✅ | Monto en soles |
| `receiptFile` | `File` | ✅ | Archivo del comprobante (imagen/PDF) |
| `packageTo` | `PackageType` | ❌ | Para activación o upgrade |
| `packageFrom` | `PackageType` | ❌ | Para upgrade |
| `reactivationMonth` | `string` | ❌ | Mes en formato "Abril 2026" |
| `walletCreditAmount` | `number` | ❌ | Para recargas de billetera |
| `withdrawalMethod` | `string` | ❌ | Para retiros: "Yape" \| "Plin" \| "Banco" |
| `withdrawalAccount` | `string` | ❌ | Número de cuenta para retiro |

**Pasos:**
1. Sube archivo a Storage: `receipts/{userId}/{timestamp}.{ext}`
2. Obtiene URL pública del archivo subido
3. Inserta en tabla `affiliate_payments` con `status = "pendiente"`

**onSuccess:** Invalida cache de `["affiliate-payments"]`

**Retorna:** `useMutation<void, Error, SubmitPaymentArgs>`

**Nota para retiros:** Se envía un `File` vacío (`new File([], "retiro.txt")`) como placeholder ya que no hay comprobante.

---

#### `useMyStoreConfig()` y `useUpdateStoreConfig()`

`useMyStoreConfig` — Query de `affiliate_store_config` por `affiliate_id` (`.maybeSingle()` — puede no existir).

`useUpdateStoreConfig` — Hace **upsert** en `affiliate_store_config` con `onConflict: "affiliate_id"`. Invalida `store-config` y `store-products` en éxito.

---

### useOrders.ts
`src/hooks/useOrders.ts`

---

#### `usePlaceOrder()`

**Propósito:** Crear pedido, procesar pago y calcular comisiones

**Parámetros de mutación** (`PlaceOrderArgs`):

| Campo | Tipo | Descripción |
|---|---|---|
| `customerName` | `string` | |
| `customerEmail` | `string` | |
| `customerPhone` | `string` | |
| `customerDni` | `string` | |
| `shippingAddress` | `string` | |
| `shippingCity` | `string` | |
| `paymentMethod` | `"wallet" \| "cash"` | |
| `items` | `Array<{productId, name, price, quantity}>` | |
| `affiliateCode?` | `string` | Para comisiones |

**Pasos:**
1. Calcula `total = suma de (price * quantity)`
2. **Si `paymentMethod === "wallet"`:**
   - Llama RPC `use_credits_for_purchase(p_user_id, p_amount)`
   - Si `result.success === false` → lanza error con `result.error`
3. Resuelve `affiliate_id`:
   - Si el usuario es afiliado, usa su propio id
   - Si viene `affiliateCode`, busca el afiliado en BD
   - Si no, `affiliate_id = null`
4. Inserta en tabla `orders` con `status = "pendiente"`
5. Inserta array en tabla `order_items`
6. **Si hay `affiliateCode` y `affiliateId`:**
   - Llama RPC `create_order_commissions(p_order_id, p_order_amount, p_affiliate_code)`

**onSuccess:** Invalida cache de `["wallet"]` y `["affiliate-stats"]`

**Retorna:** `Order` con `id`, `order_number`, etc.

---

#### `useMyOrders()`

**Query Key:** `["orders", affiliate?.id]`

**Retorna:** `(Order & { order_items: OrderItem[] })[]` ordenado por `created_at DESC`

---

### useProducts.ts
`src/hooks/useProducts.ts`

---

#### `useProducts(categoryId?, includeInactive?)`

| Parámetro | Tipo | Default |
|---|---|---|
| `categoryId` | `string \| undefined` | `undefined` |
| `includeInactive` | `boolean` | `false` |

**Query Key:** `["products", categoryId, includeInactive]`

**Filtros:** `category_id` (si se provee), `is_active = true` (si `!includeInactive`)

---

#### `useProduct(id)`

**Query Key:** `["product", id]`

**Enabled:** Solo si `id` existe

**Retorna:** `Product | null`

---

#### `useCategories()`

**Query Key:** `["categories"]`

**Retorna:** `Category[]` ordenado por nombre

---

#### `useStoreProducts(affiliateCode)`

**Query Key:** `["store", affiliateCode]`

**Pasos:**
1. Busca afiliado por `affiliate_code` en tabla `affiliates`
2. Si no existe → `{ store: null, products: [] }`
3. Consulta `affiliate_store_config` por `affiliate_id`
4. Si `!store.is_public` → `{ store, products: [] }`
5. Si hay `featured_product_ids` → trae solo esos productos
6. Si `featured_product_ids` vacío:
   - Si `show_all_products = true` → trae todos los productos activos
   - Si no → `products: []`

**Retorna:** `{ store: StoreConfig | null; products: Product[] }`

---

### useAdmin.ts
`src/hooks/useAdmin.ts`

Todos los hooks de esta sección son exclusivos para el admin dashboard.

---

#### Queries

| Hook | Query Key | Tabla | staleTime |
|---|---|---|---|
| `useAllAffiliates()` | `["admin-affiliates"]` | `affiliates` | 30s |
| `useAllOrders()` | `["admin-orders"]` | `orders + order_items` | 30s |
| `useAllPayments()` | `["admin-payments"]` | `affiliate_payments + affiliates(name, affiliate_code)` | 20s |
| `useBreakageCommissions()` | `["admin-breakage"]` | `commissions + affiliates` donde `is_breakage=true` | 60s |

---

#### `useApprovePayment()`

**Parámetros:** `paymentId: string`

**Pasos:**
1. Llama RPC `approve_affiliate_payment(p_payment_id, p_admin_id)`
2. El RPC ejecuta la lógica backend según el tipo de pago (ver sección RPCs)

**onSuccess:** Invalida `admin-payments` y `admin-affiliates`

---

#### `useRejectPayment()`

**Parámetros:** `paymentId: string`

**Pasos:**
1. `supabase.from("affiliate_payments").update({ status: "rechazado" }).eq("id", paymentId)`

**onSuccess:** Invalida `admin-payments`

---

#### `useUpdateOrderStatus()`

**Parámetros:** `{ orderId: string; status: OrderStatus }`

**Pasos:**
1. `supabase.from("orders").update({ status }).eq("id", orderId)`

**onSuccess:** Invalida `admin-orders`

---

#### `useUpdateAffiliate()`

**Parámetros:** `{ id, name, yape_number, pkg }`

**Pasos:**
1. Actualiza tabla `affiliates`

**onSuccess:** Invalida `admin-affiliates`

---

#### `useUpdateProduct()` y `useCreateProduct()`

`useUpdateProduct` — Actualiza `name`, `price`, `stock`, `description` en tabla `products`

`useCreateProduct` — Inserta nuevo producto con `organic: true` por defecto

Ambos invalidan `["products"]` en éxito.

---

#### `useUpdateBusinessSettings()`

**Parámetros:** Campos de `BusinessSettings` incluyendo `id` obligatorio

**Pasos:**
1. Actualiza tabla `business_settings` por `id`

**onSuccess:** Invalida `["business-settings"]`

---

### useSEO.ts
`src/hooks/useSEO.ts`

---

#### `useSEO({ title, description, canonical?, ogImage? })`

**Propósito:** Actualizar meta tags del documento para SEO dinámico (SPA)

**Parámetros:**

| Campo | Tipo | Requerido |
|---|---|---|
| `title` | `string` | ✅ |
| `description` | `string` | ✅ |
| `canonical` | `string` | ❌ |
| `ogImage` | `string` | ❌ |

**Pasos (dentro de useEffect):**
1. `document.title = title`
2. Para cada meta tag necesario:
   - Busca el elemento en el DOM (`querySelector`)
   - Si no existe → crea el elemento y lo agrega al `<head>`
   - Actualiza `content` con el valor provisto
3. Meta tags gestionados:
   - `meta[name="description"]`
   - `meta[property="og:title"]`
   - `meta[property="og:description"]`
   - `meta[property="og:image"]` (solo si `ogImage` provisto)
4. Si `canonical` provisto:
   - Busca o crea `link[rel="canonical"]`
   - Actualiza `href`

**Re-ejecuta cuando cambia:** `[title, description, canonical, ogImage]`

---

## 3. Páginas

### RegistroAfiliado.tsx
`src/pages/RegistroAfiliado.tsx`

Flujo de 3 pasos para crear cuenta de afiliado.

---

#### `validateRef(code)`

**Propósito:** Validar código de referido en tiempo real (mientras el usuario escribe)

**Pasos:**
1. Actualiza `form.referral = code`
2. Si `code` vacío → `setRefValid(null)` y retorna
3. Consulta `affiliates` por `affiliate_code = code.toUpperCase()`
4. `setRefValid(!!data)` — true si existe, false si no
5. Si existe → `setRefName(data.name)`

**Llamada desde:** `onChange` del input de código de referido

---

#### `handleStep1(e)`

**Propósito:** Validar formulario del Step 1 y avanzar al Step 2

**Pasos:**
1. `e.preventDefault()`
2. Valida `form.password === form.password2`; si no coinciden → retorna sin avanzar
3. `setStep(2)`

---

#### `handleFinalSubmit()`

**Propósito:** Crear cuenta y procesar comprobante (bifurcación por paquete)

**Pasos:**
1. Si `submitting` → retorna (previene doble envío)
2. **Validación de comprobante:** Para Básico e Intermedio, `receipt` es obligatorio; para VIP no
3. `setSubmitting(true)`
4. Llama `register({...})` del AuthContext
   - Si error → muestra toast y retorna
5. **Básico / Intermedio:**
   - Llama `submitPayment.mutateAsync({ type: "activacion", amount: pkg.investment, receiptFile: receipt, packageTo })`
   - Si falla → toast de advertencia (cuenta creada pero comprobante no subido)
   - Toast de éxito: "Tu comprobante está en revisión"
6. **VIP:**
   - No sube comprobante
   - Toast: "Un asesor te contactará por WhatsApp"
   - El botón de WhatsApp (con `onClick={handleFinalSubmit}`) abre `wa.me/{whatsapp_number}?text={mensaje_prellenado}`
7. `navigate("/area-afiliado")`

**Nota VIP:** La cuenta queda en `account_status = "pending"`. El admin la activa manualmente desde el panel → tab Pagos.

---

#### Flujo de Steps

```
Step 1 (datos personales)
  → nombre, DNI, email, contraseña x2, Yape, código referido (opcional)
  → validación: contraseñas coincidan
  → botón "Continuar → Elegir paquete"

Step 2 (selección de paquete)
  → Básico S/100 (niveles 1-3)
  → Intermedio S/2,000 (niveles 1-7) — RECOMENDADO
  → VIP S/10,000 (niveles 1-10)
  → Preseleccionable via URL param ?package=Intermedio

Step 3 (pago) — condicional por paquete
  Básico:
    → Muestra Yape/Banco del negocio
    → Upload comprobante (imagen/PDF)
    → Submit: crear cuenta + subir comprobante
    
  Intermedio:
    → Banner de advertencia de límite Yape
    → Muestra Yape/Banco
    → Upload comprobante
    → Submit: igual que Básico
    
  VIP:
    → Aviso de pago coordinado
    → Muestra solo datos bancarios
    → Botón WhatsApp verde con mensaje pre-llenado (nombre, DNI, paquete)
    → Al click: crea cuenta + abre WhatsApp
```

---

### LoginAfiliado.tsx
`src/pages/LoginAfiliado.tsx`

---

#### `handleSubmit(e)`

**Pasos:**
1. `e.preventDefault()`
2. Limpia error anterior
3. `setLoading(true)`
4. Llama `login(email, password)`
5. Si `loginError` → muestra "Email o contraseña incorrectos.", `setLoading(false)`, retorna
6. Si éxito → `setPendingNav(true)`
7. `setLoading(false)`

**Nota:** La redirección no ocurre aquí — la maneja el `useEffect` que espera que `authLoading` termine y `role` esté disponible.

---

#### `useEffect` de navegación

**Dependencias:** `[pendingNav, authLoading, role, isAdmin, navigate]`

**Condición de disparo:** `pendingNav === true && authLoading === false && role !== null`

**Pasos:**
1. `setPendingNav(false)`
2. Si `isAdmin` → `navigate("/admin-dashboard")`
3. Si no → `navigate("/area-afiliado")`

**Por qué este patrón:** Después de `login()`, Supabase dispara `onAuthStateChange` que llama `loadProfile()`. `loadProfile` es asíncrono, entonces el role puede no estar disponible inmediatamente. El `useEffect` espera a que `authLoading = false` y `role != null` antes de redirigir.

---

#### `handleRecovery()`

**Pasos:**
1. Valida `recoveryEmail` no vacío
2. Llama `supabase.auth.resetPasswordForEmail(recoveryEmail, { redirectTo: "${origin}/reset-password" })`
3. `setRecoverySent(true)` → muestra mensaje de confirmación

---

### Checkout.tsx
`src/pages/Checkout.tsx`

---

#### `validateRef(code)`

Igual que en RegistroAfiliado pero también llama `setAffiliateCode(data.affiliate_code)` en el CartContext para persistir el código.

---

#### `handleSubmit()`

**Pasos:**
1. Valida `affiliate || session` (usuario autenticado)
2. `setProcessing(true)`
3. **Si `paymentMethod === "cash"` y hay `receipt`:**
   - Sube a Storage: `receipts/{userId}/checkout-{Date.now()}.{ext}`
   - Guarda URL pública en `receiptStorageUrl`
4. Llama `placeOrder.mutateAsync({...})` con todos los datos del formulario + items del carrito
5. Guarda copia local de items/total para pantalla de confirmación: `setConfirmedItems`, `setConfirmedTotal`, etc.
6. `clearCart()`
7. `setOrderNumber(order.order_number)`
8. `setSuccess(true)` → renderiza pantalla de confirmación
9. En catch → `setCheckoutError(msg)`
10. `setProcessing(false)` en finally

---

#### Guards de renderizado

```typescript
// Carrito vacío (y no está en pantalla de éxito)
if (items.length === 0 && !success) → muestra estado vacío + link a catálogo

// Sin autenticación
if (!affiliate && !session) → muestra prompt de login/registro

// Pedido completado
if (success) → muestra confirmación con orderNumber, items, total, método de pago
```

---

#### Método de pago: Billetera

Si `paymentMethod === "wallet"`:
- Muestra saldo disponible
- Muestra advertencia si `walletBalance < total`
- El botón de submit llama `placeOrder` que internamente llama el RPC `use_credits_for_purchase`
- No requiere comprobante

#### Método de pago: Dinero Real

Si `paymentMethod === "cash"`:
- Requiere subir comprobante antes de poder submitear
- `disabled={processing || (paymentMethod === "cash" && !receipt)}`

---

### MiBilletera.tsx
`src/pages/MiBilletera.tsx`

---

#### `handleReactivacion()`

**Propósito:** Pagar reactivación mensual de membresía (S/300 fijo)

**Pasos:**
1. Valida `reactivacionReceipt` no null
2. `setSubmitting(true)`
3. Llama `submitPayment.mutateAsync({ type: "reactivacion", amount: 300, receiptFile, reactivationMonth })`
4. Si éxito → `setSubmitted("reactivacion")`, limpia receipt
5. `setSubmitting(false)` en finally

**Nota:** La reactivación es mensual. Si no se paga, `account_status` queda `"suspended"` y el afiliado deja de generar comisiones.

---

#### `handleRecargar()`

**Propósito:** Recargar saldo de billetera

**Pasos:**
1. Valida `recargarReceipt` no null
2. `setSubmitting(true)`
3. Llama `submitPayment.mutateAsync({ type: "recarga_billetera", amount: recargarAmount, receiptFile, walletCreditAmount: recargarAmount })`
4. Si éxito → `setSubmitted("recargar")`, limpia receipt
5. `setSubmitting(false)` en finally

**Paquetes disponibles en UI:** S/50, S/100 (sin bonus), S/200 (+5% bonus), S/500 (+10% bonus)

---

#### `handleRetiro()`

**Propósito:** Solicitar retiro de saldo a cuenta personal

**Pasos:**
1. Parsea `withdrawAmount` a float
2. Valida `amount >= 20` y `withdrawAccount` no vacío
3. `setSubmitting(true)`
4. Llama `submitPayment.mutateAsync({ type: "retiro", amount, receiptFile: new File([], "retiro.txt"), withdrawalMethod, withdrawalAccount })`
   - **Nota:** Se usa un File vacío como placeholder ya que no hay comprobante en retiros
5. Si éxito → `setSubmitted("retiro")`, limpia campos
6. `setSubmitting(false)` en finally

**Monto mínimo:** S/20

---

### AdminDashboard.tsx
`src/pages/AdminDashboard.tsx`

---

#### `handleApprove(payment)` y `handleReject(payment)`

```typescript
handleApprove → approvePayment.mutate(payment.id)  // RPC backend
handleReject  → rejectPayment.mutate(payment.id)   // UPDATE status="rechazado"
```

---

#### `handleOpenSettings()` y `handleSaveSettings()`

`handleOpenSettings`:
1. Carga valores actuales de `bizSettings` en variables de estado local (`settingsYape`, `settingsBank`, etc.)
2. `setOpenSettings(true)`

`handleSaveSettings`:
1. Valida `bizSettings?.id` existe
2. Llama `updateBusinessSettings.mutateAsync({ id, yape_number, plin_number, bank_name, bank_account, whatsapp_number, contact_phone, contact_email })`
3. `setSettingsSaved(true)` → muestra confirmación

---

#### `openEditAffiliate(a)` y `handleSaveAffiliate()`

Pre-carga nombre, yape y paquete del afiliado en estado local. Al guardar llama `updateAffiliate.mutateAsync()`.

---

#### `openEditProduct(p)` y `handleSaveProduct()` y `handleCreateProduct()`

Pre-carga datos del producto. Al guardar llama `updateProduct.mutateAsync()`. Para nuevo producto llama `createProduct.mutateAsync()`.

---

#### Métricas del dashboard (Tab Resumen)

| Métrica | Cálculo |
|---|---|
| `totalRevenue` | `orders.reduce((s, o) => s + o.total, 0)` |
| `totalCommissions` | `affiliates.reduce((s, a) => s + a.total_commissions, 0)` |
| `pendingWithdrawals` | Pagos tipo "retiro" con status "pendiente" |
| `totalRemanentes` | Comisiones con `is_breakage=true` y `status="pending"` |

---

#### Tabs disponibles

| Tab | Datos mostrados | Acciones |
|---|---|---|
| Resumen | KPIs, gráficos de afiliados/órdenes | — |
| Pedidos | Tabla de órdenes | Cambiar status |
| Afiliados | Lista con filtros | Ver, editar, suspender |
| Catálogo | Productos | Crear, editar |
| Reportes | Estadísticas avanzadas | — |
| Billetera | Balance general, transacciones | — |
| Pagos | Comprobantes pendientes/aprobados | Aprobar, rechazar |
| Gamificación | Temporadas y misiones (mock estático) | — |
| Remanentes | Comisiones de breakage | — |

---

## 4. Tipos y Enums

`src/lib/database.types.ts`

### Enums

```typescript
type AccountStatus    = "pending" | "active" | "suspended"
type PackageType      = "Básico" | "Intermedio" | "VIP"
type PaymentType      = "activacion" | "reactivacion" | "upgrade" | "recarga_billetera" | "retiro"
type PaymentStatus    = "pendiente" | "aprobado" | "rechazado"
type OrderStatus      = "pendiente" | "procesando" | "enviado" | "entregado" | "cancelado"
type CommissionStatus = "pending" | "paid" | "rejected"
```

### Tipos principales exportados

```typescript
type Affiliate        = Database["public"]["Tables"]["affiliates"]["Row"]
type Product          = Database["public"]["Tables"]["products"]["Row"]
type Category         = Database["public"]["Tables"]["categories"]["Row"]
type Order            = Database["public"]["Tables"]["orders"]["Row"]
type OrderItem        = Database["public"]["Tables"]["order_items"]["Row"]
type Commission       = Database["public"]["Tables"]["commissions"]["Row"]
type AffiliatePayment = Database["public"]["Tables"]["affiliate_payments"]["Row"]
type BusinessSettings = Database["public"]["Tables"]["business_settings"]["Row"]
type StoreConfig      = Database["public"]["Tables"]["affiliate_store_config"]["Row"]
type UserCredit       = Database["public"]["Tables"]["user_credits"]["Row"]
type CreditTransaction= Database["public"]["Tables"]["credit_transactions"]["Row"]
```

### Campos clave de Affiliate

| Campo | Tipo | Descripción |
|---|---|---|
| `affiliate_code` | `string` | Único, formato `WIN-XXX###` |
| `depth_unlocked` | `number` | Niveles de red (3, 7 o 10 según paquete) |
| `account_status` | `AccountStatus` | pending / active / suspended |
| `rank` | `string` | Bronce / Plata / Oro / Platino (calculado por UV) |
| `uv_amount_month` | `number` | Volume units del mes actual |
| `next_reactivation_due` | `string \| null` | Fecha de vencimiento mensual |

### Campos clave de Commission

| Campo | Tipo | Descripción |
|---|---|---|
| `level` | `number` | Nivel en la red (1–10) |
| `is_breakage` | `boolean` | true si no había afiliado en ese nivel |
| `percentage` | `number` | % aplicado según nivel y paquete |

---

## 5. RPCs de Supabase

### `register_affiliate`

**Llamado desde:** `AuthContext.register()`

**Parámetros:**
- `p_user_id` — ID del usuario recién creado en auth.users
- `p_name`, `p_dni`, `p_email` — Datos personales
- `p_affiliate_code` — Código único generado en frontend
- `p_yape_number` — Número Yape
- `p_package` — PackageType
- `p_referred_by` — `affiliate.id` del referidor (puede ser null)

**Qué hace:**
1. Inserta en tabla `affiliates` con `account_status = "pending"`
2. Establece `depth_unlocked` según el paquete (3, 7 o 10)
3. Si `p_referred_by` no es null:
   - Crea entrada en `referrals` con `level = 1`
   - Navega la cadena de referidos y crea entradas para todos los ancestros con sus respectivos niveles
4. Inicializa `user_credits` con `balance = 0`

**Retorna:** El objeto `Affiliate` creado

---

### `calculate_affiliate_rank`

**Llamado desde:** `useAffiliateStats()` (cada vez que se carga el dashboard)

**Parámetros:**
- `p_affiliate_id`

**Qué hace:**
1. Suma UV del mes actual del afiliado desde `volume_units` donde `month_year = mes_actual`
2. Asigna rank según UV:
   - Bronce: 0–499
   - Plata: 500–999
   - Oro: 1,000–2,499
   - Platino: 2,500+
3. Actualiza `affiliates.rank` y `affiliates.uv_amount_month`
4. Recuenta `active_directos` (referidos directos con status = "active")

**Retorna:** `string` (nombre del rank)

---

### `create_order_commissions`

**Llamado desde:** `usePlaceOrder()` si hay `affiliateCode`

**Parámetros:**
- `p_order_id`
- `p_order_amount` — Total de la orden
- `p_affiliate_code` — Código del afiliado que referencia la venta

**Qué hace:**
1. Localiza al afiliado por código
2. Itera la cadena de referidos hasta el nivel máximo (`depth_unlocked` de cada afiliado)
3. Para cada nivel (`n = 1` a `depth_unlocked`):
   - Obtiene `commission_level_n` de `business_settings`
   - Calcula `amount = p_order_amount * (percentage / 100)`
   - Inserta en `commissions` con `status = "pending"`, `level = n`, `is_breakage = false`
4. Para niveles donde no existe afiliado en la cadena:
   - Inserta comisión con `is_breakage = true` (remanente de la empresa)
5. Actualiza `total_sales` y `total_commissions` de cada afiliado afectado

**Retorna:** `void`

---

### `approve_affiliate_payment`

**Llamado desde:** `useApprovePayment()` (admin dashboard)

**Parámetros:**
- `p_payment_id`
- `p_admin_id`

**Qué hace según `type`:**

| type | Acciones |
|---|---|
| `"activacion"` | `account_status = "active"`, `activated_at = now()`, crea `volume_units` inicial |
| `"reactivacion"` | `account_status = "active"`, `next_reactivation_due = +1 mes`, crea `volume_units` del mes |
| `"recarga_billetera"` | Acredita `wallet_credit_amount` a `user_credits.balance`, crea `credit_transaction` tipo "credit" |
| `"upgrade"` | Cambia `package`, recalcula `depth_unlocked` |
| `"retiro"` | Deduce `amount` de `user_credits.balance`, crea `credit_transaction` tipo "debit" |

**Siempre:** Actualiza `status = "aprobado"`, `reviewed_by = p_admin_id`, `reviewed_at = now()`

**Retorna:** `Json` con status de la operación

---

### `use_credits_for_purchase`

**Llamado desde:** `usePlaceOrder()` cuando `paymentMethod === "wallet"`

**Parámetros:**
- `p_user_id`
- `p_amount`

**Qué hace:**
1. Consulta `user_credits` por `user_id`
2. Si `balance < p_amount` → retorna `{ success: false, error: "Saldo insuficiente" }`
3. Si `balance >= p_amount`:
   - `balance = balance - p_amount`
   - Crea `credit_transaction` tipo "debit" con descripción de la compra
   - Retorna `{ success: true }`

**Retorna:** `{ success: boolean; error?: string }`

---

### `suspend_overdue_affiliates`

**Propósito:** Tarea programada para suspender afiliados con membresía vencida

**Qué hace:**
1. Busca todos los afiliados con `next_reactivation_due < NOW()` y `account_status = "active"`
2. Para cada uno: `account_status = "suspended"`, `suspended_at = NOW()`

**Llamado desde:** Cron job o manualmente desde el panel admin

---

## 6. Flujos Completos

### Flujo 1: Registro de afiliado

```
Usuario                     Frontend                    Supabase
  |                            |                            |
  |--- Completa Step 1 ------->|                            |
  |--- Selecciona paquete ---->|                            |
  |                            |                            |
  |--- [Básico/Intermedio] --->|                            |
  |    Sube comprobante        |                            |
  |--- Click submit ---------->|                            |
  |                            |--- signUp() ------------->|
  |                            |<-- { user } --------------|
  |                            |--- rpc(register_affiliate)|
  |                            |<-- { affiliate } ---------|
  |                            |--- upload(receipt) ------->|
  |                            |--- insert(affiliate_payments)|
  |                            |                            |
  |<-- Redirige /area-afiliado-|                            |
  |                            |                            |
  |   [Admin aprueba]          |                            |
  |                            |--- rpc(approve_payment) -->|
  |                            |<-- status=active ----------|
  |                            |                            |
  |--- [VIP] ---------------->|                            |
  |    Click botón WhatsApp    |--- signUp() ------------->|
  |                            |--- rpc(register_affiliate)|
  |                            |   (sin comprobante)       |
  |<-- Abre WhatsApp + navega--|                            |
  |    /area-afiliado          |                            |
  |                            |   Admin activa manualmente|
```

---

### Flujo 2: Compra de producto

```
Usuario                     Frontend                    Supabase
  |                            |                            |
  |--- Agrega al carrito ----->|                            |
  |--- Va a /checkout -------->|                            |
  |--- Elige método de pago -->|                            |
  |                            |                            |
  |   [Billetera]              |                            |
  |--- Click "Pagar" --------->|                            |
  |                            |--- rpc(use_credits) ------>|
  |                            |<-- { success: true } ------|
  |                            |--- insert(order) ----------|
  |                            |--- insert(order_items) ----|
  |                            |--- rpc(create_commissions)|
  |<-- Pantalla de éxito ------|                            |
  |                            |                            |
  |   [Dinero Real]            |                            |
  |--- Sube comprobante ------>|                            |
  |--- Click "Confirmar" ----->|                            |
  |                            |--- upload(receipt) ------->|
  |                            |--- insert(order) ----------|
  |                            |--- rpc(create_commissions)|
  |<-- Pantalla de éxito ------|                            |
```

---

### Flujo 3: Comisiones en cascada

```
Ejemplo: red de 3 niveles con paquete VIP (niveles 1-10)

Orden: S/ 1,000 con código de afiliado "WIN-ANA001"

Nivel 1 (WIN-ANA001): 10% → S/ 100 comisión
Nivel 2 (quien refirió a ANA): 4% → S/ 40
Nivel 3 (abuelo de ANA): 2% → S/ 20
Niveles 4-10: is_breakage=true (no hay afiliado) → S/ queda en empresa

Todas las comisiones: status="pending" hasta admin apruebe
```

---

### Flujo 4: Ciclo de billetera

```
[Comisiones aprobadas por admin]
  → RPC approve_affiliate_payment
  → type="activacion" no acredita billetera directamente
  → Las comisiones se aprueban por separado (tab Billetera en admin)

[Recarga manual]
  → Afiliado: Mi Billetera → tab Recargar → elige monto → sube comprobante
  → Admin aprueba → RPC acredita balance

[Compra con billetera]
  → Checkout → método "Billetera Winclick"
  → RPC use_credits_for_purchase → deduce automático

[Retiro]
  → Mi Billetera → tab Retirar → ingresa monto, método, cuenta
  → Admin procesa → RPC deduce balance
  → Admin envía dinero al afiliado manualmente
```

---

### Flujo 5: Reactivación mensual

```
Cada mes:
  → Afiliado: Mi Billetera → tab Reactivación → elige mes → sube comprobante S/300
  → Admin aprueba → RPC:
      account_status = "active"
      next_reactivation_due = +1 mes
      crea volume_units del mes

Si no paga:
  → Cron job suspend_overdue_affiliates
  → account_status = "suspended"
  → Afiliado deja de generar comisiones
  → Puede reactivar pagando los S/300 atrasados
```

---

*Fin del documento. Para actualizaciones, editar este archivo en `docs/LOGICA_FUNCIONES.md`.*
