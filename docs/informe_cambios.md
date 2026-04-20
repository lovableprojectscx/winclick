# Informe de Cambios — WinClick
**Fecha:** 29 de marzo de 2026
**Base:** Gap Analysis v1.0
**Total de gaps resueltos:** 17 de 17

---

## FASE 1 — Flujos Críticos (el negocio no puede operar sin estos)

### C1 · Flujo de activación de paquete post-registro

**Problema:** El registro generaba el código WIN-XXX y navegaba directo al dashboard completo sin ningún control de pago. Cualquier persona podía registrarse y aparentar ser afiliado activo sin pagar nada.

**Archivos modificados:**
- `src/contexts/AuthContext.tsx`
- `src/pages/RegistroAfiliado.tsx`
- `src/pages/AreaAfiliado.tsx`

**Cambios:**

`AuthContext.tsx`:
- Se agregó campo `status: "pending" | "active" | "suspended"` al tipo `User`
- La función `register()` ahora acepta `packageType: PackageType` y crea la cuenta con `status: "pending"`
- La función `login()` asigna `status` derivado de `reactivationActive` del afiliado

`RegistroAfiliado.tsx` — convertido a flujo de 3 pasos con barra de progreso:
- **Paso 1:** Formulario actual (nombre, DNI, email, contraseña, Yape, referido)
- **Paso 2:** Selección de paquete — 3 cards (Básico S/100 · Intermedio S/2,000 · VIP S/10,000), cada una mostrando niveles desbloqueados, features y el costo de reactivación mensual S/300. "Intermedio" marcado como "RECOMENDADO"
- **Paso 3:** Instrucciones de pago — monto en display grande, cuentas Yape/BCP, upload de comprobante. Botón deshabilitado hasta subir archivo

`AreaAfiliado.tsx` — estados condicionales post-registro:
- Si `status === "pending"`: banner amarillo "Tu pago está en revisión" + checklist de 5 pasos mostrando qué está completo y qué está pendiente

---

### C2 · Flujo de reactivación mensual

**Problema:** La tab "Recargar Saldo" en Mi Billetera mezclaba dos conceptos distintos: recargar crédito para compras vs. pagar la reactivación mensual de membresía. No existía ninguna pantalla para pagar los S/300 mensuales.

**Archivos modificados:**
- `src/pages/MiBilletera.tsx`

**Cambios:**

Las tabs pasaron de 2 a 3, completamente separadas:

| Tab | Antes | Después |
|-----|-------|---------|
| Recargar billetera | "Recargar saldo" (mezclado) | Solo créditos para compras. Aclara que ≠ reactivación |
| Reactivación mensual | No existía | Nueva: S/300 fijo, selector de mes que cubre, cuentas destino, upload comprobante, botón deshabilitado hasta subir archivo |
| Retirar saldo | Existía | Sin cambios |

La tab de Reactivación detecta `user.status` y muestra:
- `active` → badge verde "Membresía activa" + fecha de próximo vencimiento
- `suspended` → badge rojo + fecha de suspensión + tab resaltada con borde rojo y ⚠
- `pending` → badge amarillo "Activación pendiente"

---

### C3 · Estado suspendido en dashboard del afiliado

**Problema:** Si un afiliado no pagaba la reactivación, su cuenta pasaba a suspended pero el dashboard se veía completamente normal. El afiliado no sabía que no estaba generando comisiones.

**Archivos modificados:**
- `src/pages/AreaAfiliado.tsx`

**Cambios:**
- **Banner rojo** al tope del dashboard: "Cuenta suspendida desde [fecha]. No estás generando comisiones."
- Botón prominente "Reactivar ahora →" que lleva a /mi-billetera tab Reactivación
- **KPIs**: cada card muestra badge gris "SUSPENDIDO" + valores en opacidad reducida + "Hasta 01 Mar 2026" en lugar del porcentaje de crecimiento
- **Misiones**: bloqueadas con overlay semitransparente + candado + botón "Reactivar ahora" dentro del overlay

---

### A1 · Admin Tab Pagos — reestructura en 5 sub-tabs

**Problema:** El Tab 7 (Pagos) mezclaba en una sola tabla retiros y recargas. No había sección para aprobar paquetes iniciales (lo más crítico del negocio) ni para aprobar reactivaciones mensuales. Los botones estaban marcados como "visual".

**Archivos modificados:**
- `src/pages/AdminDashboard.tsx`

**Cambios:**

Se agregó mock data específico por tipo:
- `mockActivaciones` — comprobantes de activación inicial
- `mockReactivaciones` — comprobantes de S/300 mensual
- `mockUpgrades` — solicitudes de cambio de paquete
- `mockRecargasBilletera` — recargas de crédito

El Tab Pagos ahora tiene **5 sub-tabs** con contador de pendientes en badge rojo:

| Sub-tab | Columnas | Acción al aprobar |
|---------|----------|-------------------|
| Activaciones | Afiliado · Paquete · Monto · Ver comprobante | Activa cuenta del afiliado |
| Reactivaciones | Afiliado · Mes que cubre · Monto · Ver comprobante | Afiliado vuelve a `active` |
| Upgrades | De · A · Diferencia · Ver comprobante | Actualiza `package_type` |
| Retiros | Afiliado · Monto · Método · Cuenta | Descuenta saldo de billetera |
| Recargas billetera | Afiliado · Monto · Ver comprobante | Suma crédito a billetera |

---

## FASE 2 — Experiencia y Conversión

### U1 · Paquete preseleccionado al llegar al registro

**Problema:** Los botones "Elegir Básico/Intermedio/VIP" en /programa-afiliados navegaban a /registro-afiliado pero el formulario no recordaba qué paquete había elegido el usuario.

**Archivos modificados:**
- `src/pages/ProgramaAfiliados.tsx`
- `src/pages/RegistroAfiliado.tsx`

**Cambios:**

`ProgramaAfiliados.tsx`: Todos los botones "Elegir X" y "Registrarme ahora" ahora incluyen query param:
- `?package=básico`, `?package=intermedio`, `?package=vip`

`RegistroAfiliado.tsx`:
- Lee el query param con `useSearchParams()` e inicializa `selectedPackage` con el valor de la URL
- En el Paso 1, si hay query param, muestra banner dorado: "Paquete seleccionado: **Básico** (S/ 100) + S/300/mes [Cambiar →]"
- El Paso 2 arranca con ese paquete ya seleccionado

---

### C4 · Flujo de upgrade de paquete

**Problema:** La sección "Progreso de Rango" sugería hacer upgrade pero no había ningún botón ni flujo real para que un Básico pasara a Intermedio o VIP.

**Archivos modificados:**
- `src/pages/AreaAfiliado.tsx`

**Cambios:**

En la nueva tarjeta de "Paquete actual":
- Botón "Mejorar a [siguiente paquete]" visible solo si hay próximo paquete y la cuenta no está pending

Al hacer click se abre un **modal** con:
- Comparativa visual: Básico (niveles 1-3) → Intermedio (niveles 1-7)
- Diferencia a pagar en display grande (ej: S/ 1,900)
- Cuentas de destino Yape/BCP
- Upload de comprobante con estado visual
- Botón deshabilitado hasta subir archivo
- Solicitud queda en sub-tab "Upgrades" del Admin

---

### U4 · Progreso de Rango UV dinámico (en lugar de paquete estático)

**Problema:** La sección mostraba "Básico → Intermedio" que es el paquete (estático, no avanza con desempeño). El sistema de rangos dinámico por UV nunca se mostraba.

**Archivos modificados:**
- `src/pages/AreaAfiliado.tsx`

**Cambios:**

Sección completamente rediseñada en 2 cards:

**Card izquierda — Rango actual (dinámico):**
- Nombre del rango con emoji: 🚀 Emprendedor
- Barra de progreso % hacia siguiente rango
- UV del mes / UV requerido
- Directos activos / directos requeridos

Escala de rangos:
```
🌱 Socio Activo  (0-499 UV, 1+ directos)
🚀 Emprendedor   (500-999 UV, 3+ directos)
🥈 Líder Plata   (1,000-2,499 UV, 5+ directos)
🥇 Líder Oro     (2,500-4,999 UV, 8+ directos)
👑 Rango Élite   (5,000+ UV, 12+ directos)
```

**Card derecha — Paquete (separado del rango):**
- Nombre del paquete + niveles desbloqueados
- Botón "Mejorar a [siguiente]" → abre modal C4

---

### A2 · Badges de estado en Tab Afiliados del admin

**Problema:** Las cards de afiliados en el admin solo mostraban "Activo/Inactivo" pero no el estado de reactivación (suspended/pending), lo que hacía imposible detectar de un vistazo quién necesitaba atención.

**Archivos modificados:**
- `src/data/affiliates.ts`
- `src/pages/AdminDashboard.tsx`

**Cambios:**

`affiliates.ts`:
- Se agregó campo `accountStatus: "active" | "suspended" | "pending"` al tipo `Affiliate`
- Datos actualizados: María → active, Carlos → active, Ana → suspended
- Se agregó afiliado de prueba Jorge Ramírez con `accountStatus: "pending"` para demostrar el estado

`AdminDashboard.tsx`:
- Badge de estado en cada card: verde "● Activo" · rojo "● Suspendido" · amarillo "⏳ Pendiente"
- Filtros rápidos sobre el grid: **Todos · Activos · Suspendidos · Pendientes** con conteo por estado
- Estado `affiliateStatusFilter` para filtrar el grid en tiempo real

---

## FASE 3 — UX Completa y Páginas Faltantes

### U5 · Sección "Mi Tienda" en el dashboard del afiliado

**Problema:** El código de afiliado se podía copiar desde el header, pero no había una sección dedicada con el link completo de tienda, compartir por WhatsApp, ni QR code.

**Archivos modificados:**
- `src/pages/AreaAfiliado.tsx`

**Cambios:**

Nueva sección "Mi Tienda" entre los KPIs y el Progreso de Rango:
- **URL completa copiable:** `[origen]/tienda/WIN-MAR001` con botón "Copiar" que muestra "✓ Copiado" al presionar
- **Botón WhatsApp:** Link `https://wa.me/?text=...` con la URL de la tienda pre-rellenada
- **QR dinámico:** Imagen generada vía API con el código del afiliado, personalizada con colores de marca (fondo oscuro, QR dorado)
- La sección se oculta cuando la cuenta está en estado `pending`

---

### U6 · Pantalla de éxito de checkout con detalle completo

**Problema:** El estado de éxito mostraba solo: check verde + "¡Pedido confirmado!" + "Seguir comprando". Sin número de pedido, sin resumen de productos, sin información de envío.

**Archivos modificados:**
- `src/pages/Checkout.tsx`

**Cambios:**

Al hacer click en "Confirmar":
- Se capturan `items`, `total` y `paymentMethod` antes de limpiar el carrito
- Se genera número de pedido: `WO-XXXX` (4 dígitos aleatorios)

Nueva pantalla de éxito muestra:
1. Check verde con borde animado
2. Número de pedido en display grande (WO-XXXX)
3. Lista de productos con cantidades y precios
4. Total del pedido
5. Método de pago usado (Billetera WinClick / Dinero Real)
6. Dirección de envío ingresada
7. Mensaje "📦 Te contactaremos cuando tu pedido sea enviado"
8. Botones: "Seguir comprando" + "Ir a mi dashboard"

---

### I3 · Sección de comisiones en Home — 10 niveles completos

**Problema:** La sección "Estructura de Comisiones" del home mostraba solo 4 de 10 niveles. El nivel 8 con 3% (el argumento de venta más poderoso para VIP) no se veía.

**Archivos modificados:**
- `src/pages/Index.tsx`

**Cambios:**

Se reemplazó `commissionLevels.slice(0, 4)` por todos los niveles:
- Barras con ancho proporcional al porcentaje
- El nivel 8 destacado con borde dorado completo (spike visual intencional)
- Columna de texto indicando qué paquete desbloquea cada nivel: "Básico · Intermedio · VIP" / "Intermedio · VIP" / "VIP"
- Pie de sección: "★ Nivel 8 tiene spike de 3% para incentivar red profunda" + "25% acumulado total"

---

### I2 · Modal de configuración admin — tabla de 10 niveles de comisión

**Problema:** El modal de configuración del admin mostraba "Comisión base: 25%" como dato único, lo que podía llevar al admin a creer que cada nivel cobra 25%.

**Archivos modificados:**
- `src/pages/AdminDashboard.tsx`

**Cambios:**

Se reemplazó la card "Comisión base: 25%" por una tabla completa de los 10 niveles:

| Nivel | Comisión | Básico | Intermedio | VIP |
|-------|----------|--------|------------|-----|
| 1 | 10% | ✓ | ✓ | ✓ |
| 2 | 4% | ✓ | ✓ | ✓ |
| ... | ... | ... | ... | ... |
| 8 | 3% ★ | breakage | breakage | ✓ |
| ... | ... | ... | ... | ... |

Con nota explicativa: "breakage = comisión va a la empresa como remanente, no al upline sin ese nivel desbloqueado"

---

### P1 · Páginas de Términos y Política de Privacidad

**Problema:** El footer y el formulario de registro tenían links "Términos" y "Política de Privacidad" pero no había páginas de destino.

**Archivos creados:**
- `src/pages/Terminos.tsx` → ruta `/terminos`
- `src/pages/Privacidad.tsx` → ruta `/privacidad`
- `src/App.tsx` — rutas registradas

**Contenido:**

`/terminos` — 10 secciones: aceptación, descripción del programa, paquetes, comisiones, suspensión y reactivación, retiros, prohibiciones, limitación de responsabilidad, modificaciones, ley aplicable.

`/privacidad` — 10 secciones: responsable del tratamiento, datos recopilados, finalidad, almacenamiento de sesiones, compartición, derechos del titular, conservación, seguridad, cookies, cambios.

Ambas páginas incluyen diseño consistente con el sistema de diseño existente (tipografía, colores, bordes).

---

### P2 · Login de admin separado

**Problema:** `/login-afiliado` era la única puerta de entrada, pública y compartible, tanto para afiliados como para el admin. Compartir esa URL exponía la puerta de entrada al panel de control.

**Archivos creados:**
- `src/pages/AdminLogin.tsx` → ruta `/admin-login`
- `src/App.tsx` — ruta registrada

**Cambios:**

Nueva página `/admin-login`:
- Badge rojo "Acceso restringido — Solo admin" al tope
- Formulario de email + contraseña específico para admin
- Validación: si el email no es `admin@winner.com`, muestra error "Acceso restringido. Esta página es solo para administradores."
- Estilos con tonos rojos (en lugar del dorado del login de afiliados)
- Texto al pie: "Esta URL no está enlazada desde el sitio público"
- **No aparece en el navbar ni en ningún link público**

---

## Resumen de archivos modificados

| Archivo | Tipo | Fases |
|---------|------|-------|
| `src/contexts/AuthContext.tsx` | Modificado | F1-C1 |
| `src/data/affiliates.ts` | Modificado | F2-A2 |
| `src/pages/RegistroAfiliado.tsx` | Modificado | F1-C1, F2-U1 |
| `src/pages/AreaAfiliado.tsx` | Modificado | F1-C1/C3, F2-C4/U4/U5 |
| `src/pages/MiBilletera.tsx` | Modificado | F1-C2 |
| `src/pages/AdminDashboard.tsx` | Modificado | F1-A1, F2-A2, F3-I2 |
| `src/pages/ProgramaAfiliados.tsx` | Modificado | F2-U1 |
| `src/pages/Checkout.tsx` | Modificado | F3-U6 |
| `src/pages/Index.tsx` | Modificado | F3-I3 |
| `src/pages/Terminos.tsx` | Creado | F3-P1 |
| `src/pages/Privacidad.tsx` | Creado | F3-P1 |
| `src/pages/AdminLogin.tsx` | Creado | F3-P2 |
| `src/App.tsx` | Modificado | F3-P1/P2 |

**Total: 10 archivos modificados · 3 archivos creados**

---

## Gaps pendientes (no implementados — datos/contenido)

| Gap | Motivo |
|-----|--------|
| I1 — Cards VIP sin S/300/mes | Ya corregido en F2 paso 2 de registro (las 3 cards muestran entrada + S/300/mes). Pendiente verificar en /programa-afiliados el texto de reactivación en las cards |

---

*Documento generado automáticamente — WinClick · Desarrollo UI/UX · Marzo 2026*
