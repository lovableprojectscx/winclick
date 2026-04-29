# 🗺️ Mapa de Arquitectura Exhaustivo — WinClick V3

---

## SECCIÓN 1: ENRUTAMIENTO Y ACCESO (`src/App.tsx`)

El archivo raíz de la app define todas las rutas y sus guardias de seguridad.

### Rutas Públicas (cualquier visitante)
| Ruta | Componente | Descripción |
|---|---|---|
| `/` | `Index.tsx` | Landing page principal |
| `/catalogo` | `Catalogo.tsx` | Lista de productos |
| `/catalogo/:id` | `ProductDetail.tsx` | Detalle de producto individual |
| `/checkout` | `Checkout.tsx` | Proceso de pago |
| `/programa-afiliados` | `ProgramaAfiliados.tsx` | Presentación del programa |
| `/planes` | `Planes.tsx` | Comparativa de membresías |
| `/registro-afiliado` | `RegistroAfiliado.tsx` | Formulario de registro |
| `/login-afiliado` | `LoginAfiliado.tsx` | Login de socios |
| `/tienda/:codigo` | `TiendaAfiliado.tsx` | Tienda pública de un socio (sin Navbar ni Footer) |
| `/contacto` | `Contacto.tsx` | Formulario de contacto |
| `/reset-password` | `ResetPassword.tsx` | Recuperación de contraseña |
| `/terminos` | `Terminos.tsx` | Términos legales |
| `/privacidad` | `Privacidad.tsx` | Política de privacidad |

### Rutas Privadas (requieren sesión activa)
| Ruta | Guardia | Redirige a si falla |
|---|---|---|
| `/area-afiliado` | `RequireAuth` | `/login-afiliado` |
| `/mi-billetera` | `RequireAuth` | `/login-afiliado` |
| `/editar-tienda` | `RequireAuth` | `/login-afiliado` |
| `/admin-dashboard` | `RequireAdmin` | Si sin sesión → `/login-afiliado`, si afiliado → `/area-afiliado` |
| `/dev-tools` | Solo en `DEV` | Solo modo desarrollo |

---

## SECCIÓN 2: ESTADO GLOBAL (`src/contexts/`)

### `AuthContext.tsx`
Proveedor de sesión que envuelve toda la aplicación. Expone a cada componente:
- `session`: Objeto de sesión JWT de Supabase.
- `affiliate`: El perfil completo del usuario logueado (`affiliates` tabla).
- `role`: `"affiliate"` o `"admin"` (leído de `user_roles`).
- `isAdmin`: Booleano derivado de `role === "admin"`.
- `loading`: Booleano para mostrar el spinner global al iniciar.

**Funciones internas:**
- `loadProfile(userId)`: Al detectar sesión activa, consulta `user_roles` y `affiliates` en paralelo y guarda los resultados en el estado.
- `register(data)`: Flujo de 5 pasos — crea usuario en `auth.users`, genera un código único (`WIN-XXX000`), busca el referidor en la BD, llama al RPC `register_affiliate` (que crea el perfil y el árbol de referidos), y asigna el rol `"affiliate"`.
- `login(email, pass)`: Llama a `supabase.auth.signInWithPassword`.
- `logout()`: Llama a `supabase.auth.signOut`.

### `CartContext.tsx`
Administrador del carrito, **persistido en `localStorage`** bajo la clave `wo_cart_items`.
- `items`: Array de `{ product, quantity, unitPrice }`. El `unitPrice` se fija al momento de agregar el producto (captura el precio del instante).
- `affiliateCode`: Código de referido activo, persistido en `wo_affiliate_code`.
- `total` / `itemCount`: Calculados reactivamente de `items`.
- `addItem / removeItem / updateQuantity / clearCart`: Mutaciones del array de items.
- **Escucha `SIGNED_OUT`**: Al hacer logout, limpia automáticamente el carrito y el código de referido del `localStorage`.

---

## SECCIÓN 3: LÓGICA DE NEGOCIO (`src/lib/`)

### `activationPrice.ts` — El Cerebro Financiero del Frontend
| Constante/Función | Valor / Descripción |
|---|---|
| `PLAN_ORDER` | `["Básico", "Ejecutivo", "Intermedio", "VIP"]` — Orden ascendente oficial de rangos |
| `ACTIVATION_FACTOR` | Básico: 1.0 / Ejecutivo: 1.0 / Intermedio: 1.0 / **VIP: 0.50** — Multiplicador del precio en activación |
| `ACTIVATION_DISCOUNT_PCT` | Básico: 0% / Ejecutivo: 0% / Intermedio: 0% / **VIP: 50%** — Para mostrar el badge en UI |
| `ACTIVATION_TARGET` | Básico: S/ 120 / Ejecutivo: S/ 600 / Intermedio: S/ 2,000 / VIP: S/ 10,000 — Meta para activar |
| `RECOMPRA_DISCOUNT_PCT` | Básico: 40% / Ejecutivo: 50% / Intermedio: 50% / VIP: 50% — Descuento en recompras |
| `PLAN_DEPTH` | Básico: 3 / Ejecutivo: 5 / Intermedio: 7 / VIP: 10 — Niveles de red desbloqueados |
| `getActivationCap(pkg)` | Devuelve `ACTIVATION_TARGET[pkg]` |
| `getDiscountRate(affiliate, isActivation)` | Si `pending` → usa `ACTIVATION_FACTOR`. Si `active` → usa `1 - RECOMPRA_DISCOUNT_PCT/100` |
| `getReachedPlan(pkg, total)` | Itera `PLAN_ORDER` de mayor a menor y retorna el plan más alto cuya `ACTIVATION_TARGET ≤ total`. Excluye VIP (plan manual) |

### `supabase.ts`
Instancia única del cliente de Supabase, exportada como `supabase`. URL y anon key leídas de variables de entorno.

### `imageUtils.ts`
- `compressImage(file)`: Recibe un `File` y retorna una Promise con el archivo comprimido. Redimensiona a máximo 1200px en el lado más largo, calidad JPEG 0.82. Ignora PDFs.

### `database.types.ts`
Tipos TypeScript auto-generados desde el esquema de Supabase. Define los tipos `Affiliate`, `Order`, `Commission`, `Product`, `BusinessSettings`, etc.

### `utils.ts`
- `toN(value)`: Convierte cualquier valor (string, null, undefined) a `number`. Previene bugs de "NaN" al normalizar datos de PostgREST.

---

## SECCIÓN 4: HOOKS DE DATOS (`src/hooks/`)

### `useAdmin.ts` — Acciones del Administrador
| Hook | Acción | Detalles Técnicos |
|---|---|---|
| `useAllAffiliates()` | Lista todos los afiliados | Join con `sponsor:referred_by(name)` |
| `useAllOrders()` | Lista todos los pedidos | Join con `order_items(*)` |
| `useAllPayments()` | Lista todos los comprobantes | Join con `affiliates(name, affiliate_code)` |
| `useUpdateOrderStatus()` | Cambia el estado de un pedido | **CRÍTICO:** Si la orden es `is_activation_order` y pasa a `procesando/enviado/entregado`, verifica si el total acumulado alcanza la meta del paquete. Si sí → actualiza `account_status` a `"active"`. |
| `useUpdateAffiliate()` | Edita nombre, Yape y plan de un afiliado | **Sincroniza automáticamente `depth_unlocked`** usando `PACKAGE_DEPTH` local. |
| `useUpdateAffiliateStatus()` | Cambia estado a `active/suspended/pending` | Actualización directa a la tabla `affiliates` |
| `useDeleteAffiliate()` | Elimina un afiliado | Intenta RPC `admin_delete_user` primero. Si falla, hace fallback eliminando de tablas públicas (no libera el email en Auth). |
| `useApprovePayment()` | Aprueba comprobante | Llama al RPC `approve_affiliate_payment` |
| `useRejectPayment()` | Rechaza comprobante | Actualiza `status = "rechazado"` en `affiliate_payments` |
| `useBreakageCommissions()` | Lista comisiones bloqueadas | Filtra `is_breakage = true` |
| `usePendingCommissions()` | KPI: total S/ pendientes de pago | Filtra `is_breakage=false` y `status=pending` |
| `useTotalWallets()` | KPI: total S/ en billeteras | Suma `balance` de `user_credits` |
| `useAllWallets()` | Detalle de billeteras | Lee `user_credits` ordenado por `balance DESC` |
| `useAllPendingCommissions()` | Tabla de comisiones por acreditar | Usa FK hint explícito `!commissions_affiliate_id_fkey` para resolver ambigüedad de las 2 FK hacia `affiliates` |
| `useAffiliateReferralTree()` | Árbol de referidos de un afiliado | Lee `referrals` con join a `affiliates` |
| `useAffiliatePayments()` | Comprobantes de un afiliado específico | Usado para el panel de detalles en el Admin |
| `useCreateProduct/useUpdateProduct/useDeleteProduct()` | CRUD de catálogo | `delete` hace fallback a `is_active = false` si el producto tiene pedidos (error FK 23503) |
| `useCreateCategory/useUpdateCategory/useDeleteCategory()` | CRUD de categorías | `delete` desasigna productos antes de borrar |
| `useUpdateBusinessSettings()` | Actualiza los datos de la empresa | Yape/Plin, WhatsApp, datos bancarios |

### `useAffiliate.ts` — Datos del Líder Autenticado
| Hook | Acción |
|---|---|
| `useProfile()` | Perfil completo del afiliado autenticado |
| `useUpdateProfile()` | Actualiza dirección de envío, Yape, teléfono, DNI |
| `useBusinessSettings()` | Configuración pública de la empresa (cacheo 5 min) |
| `useAffiliateStats()` | Totales de ventas y comisiones con normalización numérica |
| `useMyCommissions()` | Historial de comisiones (excluye breakages) |
| `useWallet()` | Saldo y transacciones de la billetera digital |
| `useMyPayments()` | Comprobantes enviados por el afiliado |
| `useMyNetwork()` | Red directa e indirecta del afiliado |
| `useSubmitPayment()` | Sube comprobante al Storage `receipts` y crea registro en `affiliate_payments` |
| `useMyStoreConfig/useUpdateStoreConfig()` | Configuración de la tienda personal del afiliado (upsert por `affiliate_id`) |

### Otros Hooks
- `useProducts.ts`: CRUD público de productos (con filtros de categoría, búsqueda, paginación).
- `useOrders.ts`: Consulta de pedidos del usuario autenticado.
- `useFavorites.ts`: Gestión de productos favoritos en `localStorage`.

---

## SECCIÓN 5: MOTOR FINANCIERO — BASE DE DATOS (Supabase / PostgreSQL)

### Tablas Clave
| Tabla | Columnas Clave | Rol |
|---|---|---|
| `affiliates` | `id`, `user_id`, `package`, `account_status` (`pending/active/suspended`), `depth_unlocked`, `referred_by`, `wallet_balance`, `total_sales`, `total_commissions` | El corazón del árbol MLM |
| `orders` | `id`, `affiliate_id`, `total`, `status`, `is_activation_order`, `receipt_url` | Registro de ventas |
| `commissions` | `affiliate_id`, `originator_id`, `order_id`, `amount`, `level`, `percentage`, `base_amount`, `status`, `is_breakage` | Libro contable de ganancias |
| `referrals` | `referrer_id`, `referred_id`, `level` | Árbol genealógico de la red |
| `affiliate_payments` | `affiliate_id`, `type`, `status`, `amount`, `receipt_url`, `package_to` | Comprobantes y solicitudes de pago/retiro |
| `user_credits` | `user_id`, `balance`, `email` | Billeteras digitales |
| `business_settings` | `whatsapp_number`, `yape_number`, `yape_qr_url`, `plin_number`, `package_basico_price`, `package_ejecutivo_price` | Configuración maestra de la empresa |

### Triggers y Funciones SQL
| Función/Trigger | Cuándo se ejecuta | Qué hace |
|---|---|---|
| `auto_mark_activation_order` | `BEFORE INSERT` en `orders` | Si el `affiliate_id` apunta a un afiliado `pending`, marca `is_activation_order = TRUE` automáticamente |
| `trigger_commissions_on_delivery` | `AFTER UPDATE OF status` en `orders` | Cuando `status` cambia a `"entregado"`, llama a `distribute_commissions_v2` |
| `distribute_commissions_v2` | Llamado por el trigger anterior | **Flujo A (activación):** reparte bonos fijos a 4 niveles según el paquete del nuevo afiliado. **Flujo B (recompra):** reparte porcentajes (10%, 4%, 2%...) a 10 niveles (Total 25%). **Regla V3:** Aplica *breakage* únicamente si el nivel de red supera la profundidad desbloqueada (`depth_unlocked`). El estado de cuenta (`pending/suspended`) ya no bloquea el cobro. |
| `register_affiliate` (RPC) | Al registrarse | Crea el perfil en `affiliates` y llena el árbol `referrals` |
| `approve_affiliate_payment` (RPC) | Al aprobar pago | Mueve saldo de comisión a `wallet_balance` del afiliado |
| `admin_delete_user` (RPC) | Al eliminar afiliado | Borrado en cascada seguro incluyendo `auth.users` |
| `handle_order_status_change` | `AFTER UPDATE` en `orders` | **Gestor de Activación:** Si una orden entregada alcanza la meta de inversión (`ACTIVATION_TARGET`), cambia al afiliado de `pending` a `active`. También maneja reactivaciones. |
| `trg_set_depth_on_insert` | `BEFORE INSERT` en `affiliates` | **Regla V3:** Asigna automáticamente el `depth_unlocked` inicial según el paquete al momento del registro. |

### Tabla de Bonos Fijos (Flujo A — Activación)
| Paquete Activado | Nivel 1 (Patrocinador Directo) | Nivel 2 (Abuelo) | Nivel 3 (Bisabuelo) | Nivel 4 (Tatarabuelo) |
|---|---|---|---|---|
| Básico (S/ 120) | S/ 48.00 | — | — | — |
| Ejecutivo (S/ 600) | S/ 100.00 | S/ 30.00 | S/ 12.00 | S/ 3.00 |
| Intermedio (S/ 2,000) | S/ 300.00 | S/ 100.00 | S/ 40.00 | S/ 10.00 |
| VIP (S/ 10,000) | S/ 1,500.00 | S/ 150.00 | S/ 50.00 | S/ 50.00 |

---

## SECCIÓN 6: FLUJOS CRÍTICOS DE NEGOCIO

### Flujo 1: Registro de Nuevo Afiliado
```
RegistroAfiliado.tsx
  → AuthContext.register()
    → supabase.auth.signUp() — crea usuario en auth.users
    → supabase.rpc("register_affiliate") — crea affiliates + referrals tree
    → supabase.from("user_roles").insert() — asigna rol "affiliate"
  → Redirige a /area-afiliado
```

### Flujo 2: Compra y Activación de Cuenta
```
Checkout.tsx
  → handleSubmit() — inserta en orders tabla
    → Trigger: auto_mark_activation_order — marca is_activation_order=TRUE si pending
AdminDashboard.tsx
  → useUpdateOrderStatus("entregado")
    → Trigger: trigger_commissions_on_delivery
      → distribute_commissions_v2(order_id, is_activation=TRUE)
        → Detecta paquete del comprador
        → Inserta bonos fijos en commissions (Niveles 1-4)
    → Trigger: handle_order_status_change
      → Verifica si total_mes >= ACTIVATION_TARGET
      → Si sí: UPDATE affiliates SET account_status = "active", depth_unlocked = V_DEPTH
```

### Flujo 3: Compra > S/ 700 (Asesor WhatsApp)
```
Checkout.tsx (carrito con total > 700)
  → No muestra campos de comprobante (Yape/Plin)
  → Muestra aviso "Proceso de atención personalizada"
  → Al confirmar: inserta orden en BD sin receipt_url
CheckoutSuccess.tsx
  → Detecta confirmedHighValue = TRUE
  → Muestra botón de WhatsApp con mensaje pre-cargado:
    "Hola asesor, acabo de registrar mi pedido #XXXX..."
  → El asesor confirma el pago y marca el pedido como "entregado" en AdminDashboard
    → El trigger de la BD reparte comisiones automáticamente
```

### Flujo 4: Retiro de Comisiones
```
MiBilletera.tsx / AreaAfiliado.tsx
  → useSubmitPayment({ type: "withdrawal", amount, ... })
    → Crea registro en affiliate_payments con status="pendiente"
AdminDashboard.tsx
  → useApprovePayment(paymentId)
    → supabase.rpc("approve_affiliate_payment")
      → Reduce wallet_balance del afiliado
      → Crea transacción en credit_transactions
```

---

## SECCIÓN 7: ESTRUCTURA DE ARCHIVOS

```
src/
├── App.tsx                   ← Enrutamiento, guardias de acceso
├── main.tsx                  ← Punto de entrada React
├── index.css                 ← Tokens de diseño globales (CSS variables)
│
├── contexts/
│   ├── AuthContext.tsx        ← Sesión, perfil, login/register/logout
│   └── CartContext.tsx        ← Carrito persistido en localStorage
│
├── hooks/
│   ├── useAdmin.ts            ← Todas las acciones del administrador (12+ hooks)
│   ├── useAffiliate.ts        ← Datos del afiliado autenticado (8+ hooks)
│   ├── useProducts.ts         ← Catálogo público
│   ├── useOrders.ts           ← Pedidos del usuario
│   ├── useFavorites.ts        ← Favoritos en localStorage
│   ├── useSEO.ts              ← Meta tags dinámicos
│   └── use-mobile.tsx         ← Detección de dispositivo móvil
│
├── lib/
│   ├── activationPrice.ts     ← REGLAS DE NEGOCIO: rangos, precios, profundidades
│   ├── supabase.ts            ← Cliente de Supabase (singleton)
│   ├── database.types.ts      ← Tipado TypeScript del esquema SQL
│   ├── imageUtils.ts          ← Compresión de imágenes JPEG
│   └── utils.ts               ← toN() y helpers globales
│
├── pages/
│   ├── Index.tsx              ← Landing Page
│   ├── Catalogo.tsx           ← Vitrina de productos
│   ├── ProductDetail.tsx      ← Detalle con cálculo de precios por rango
│   ├── Checkout.tsx           ← Proceso de pago + Switch > S/700
│   ├── Planes.tsx             ← Comparativa de membresías
│   ├── RegistroAfiliado.tsx   ← Embudo de nuevos socios
│   ├── LoginAfiliado.tsx      ← Autenticación de socios
│   ├── AreaAfiliado.tsx       ← Dashboard del líder (ganancias, red, activación)
│   ├── MiBilletera.tsx        ← Gestión de billetera digital
│   ├── TiendaAfiliado.tsx     ← Tienda personal por código de afiliado
│   ├── AdminDashboard.tsx     ← Panel completo del administrador
│   ├── EditarTienda.tsx       ← Personalización de tienda del socio
│   ├── AdminLogin.tsx         ← Login admin
│   └── DevTools.tsx           ← Solo en desarrollo
│
├── components/
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   ├── CartDrawer.tsx         ← Carrito lateral deslizante
│   ├── ProductCard.tsx        ← Tarjeta con precio según rango
│   ├── ProductImageUploader.tsx
│   ├── checkout/
│   │   ├── ActivationProgress.tsx ← Barra de progreso de activación
│   │   └── CheckoutSuccess.tsx    ← Pantalla de éxito + botón WhatsApp
│   └── ui/                    ← Átomos (botones, inputs, tooltips...)
│
supabase/
├── MIGRATION_ACTIVATION_COMMISSIONS.sql  ← Columna is_activation_order + trigger de comisiones original
├── MIGRATION_V2_EJECUTIVO.sql            ← Columna precio Ejecutivo en business_settings
├── MIGRATION_V2_BONO_PATROCINIO.sql      ← Bonos fijos V2 (función distribute_commissions_v2)
├── MIGRATION_V3_RULES.sql                ← V3: bonos sin restricción de account_status + trg_set_depth_on_insert
└── MIGRATION_ADMIN_DELETE_USER.sql       ← Función RPC de borrado seguro
```
