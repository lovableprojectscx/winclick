# Winner Organa — Base de datos

Motor: **PostgreSQL** vía **Supabase**

## Orden de ejecución

| # | Archivo | Descripción |
|---|---------|-------------|
| 1 | `01_schema.sql` | Tablas, tipos ENUM, índices |
| 2 | `02_triggers.sql` | Funciones y triggers automáticos |
| 3 | `03_rls.sql` | Row Level Security (quién ve qué) |
| 4 | `04_seed.sql` | Datos iniciales del sistema (paquetes, niveles, productos) |
| 5 | `05_dev_seed.sql` | ⚠️ Solo desarrollo — usuarios y datos de prueba |
| 6 | `06_storage.sql` | Buckets de Storage y sus políticas |
| 7 | `07_views.sql` | Vistas y funciones para dashboards |

## Tablas principales

| Tabla | Descripción |
|-------|-------------|
| `profiles` | Usuarios (extiende `auth.users` de Supabase) |
| `packages` | Configuración de paquetes Básico/Intermedio/VIP |
| `commission_levels` | Porcentajes por nivel (1-10) |
| `products` | Catálogo de productos |
| `affiliate_stores` | Tienda personalizada de cada afiliado |
| `orders` | Pedidos de clientes |
| `order_items` | Items de cada pedido |
| `commissions` | Comisiones generadas por cada pedido |
| `payments` | Comprobantes de pago (activación, reactivación, upgrade, retiro, recarga) |
| `wallet_transactions` | Log inmutable de movimientos de billetera |
| `affiliate_network` | Árbol MLM (tabla de cierre transitivo, depth 1-10) |
| `product_reviews` | Reseñas de productos |
| `system_config` | Configuración dinámica del sistema (KV) |

## Automatizaciones (triggers)

| Trigger | Evento | Acción |
|---------|--------|--------|
| `trg_generate_affiliate_code` | INSERT profiles | Genera código WIN-XXX automáticamente |
| `trg_create_store_on_activation` | UPDATE profiles (→ active) | Crea tienda vacía |
| `trg_generate_order_number` | INSERT orders | Genera WO-XXXX |
| `trg_decrement_stock` | UPDATE orders (→ procesando) | Descuenta stock |
| `trg_distribute_commissions` | UPDATE orders (→ procesando) | Calcula y crea filas en `commissions` |
| `trg_credit_commission` | UPDATE commissions (→ pagada) | Acredita a billetera |
| `trg_process_payment_approval` | UPDATE payments (→ aprobado) | Activa/reactiva/upgrade/recarga/retiro |
| `trg_build_network` | UPDATE profiles (→ active) | Construye árbol en `affiliate_network` |

## Funciones cron (ejecutar con pg_cron o Supabase Edge Functions)

```sql
-- Diario: suspender afiliados con reactivación vencida
SELECT suspend_overdue_affiliates();

-- Mensual (día 1): recalcular UV del mes
SELECT recalculate_uv_month();
```

## Storage buckets

| Bucket | Público | Uso |
|--------|---------|-----|
| `receipts` | No | Comprobantes de pago de afiliados |
| `avatars` | Sí | Fotos de perfil |
| `products` | Sí | Imágenes de productos (admin sube) |

## Credenciales de prueba (solo dev)

| Usuario | Email | Contraseña |
|---------|-------|------------|
| Admin | `admin@winner.com` | `admin1234` |
| María (VIP activa) | `maria@email.com` | `demo1234` |
| Carlos (Intermedio activo) | `carlos@email.com` | `demo1234` |
| Ana (Básico suspendida) | `ana@email.com` | `demo1234` |
| Jorge (Básico pendiente) | `jorge@email.com` | `demo1234` |
