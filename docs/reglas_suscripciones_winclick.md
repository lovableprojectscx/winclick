# Reglas de Suscripción y Descuentos (Winclick)

Este documento es la **fuente de la verdad** para la lógica de precios y membresías del sistema de afiliados, diseñado para evitar confusiones entre el proceso de **Afiliación (Activación)** y **Recompra Mensual**.

## 1. Etapa de Afiliación (Primera Compra / Activación)
Es la compra obligatoria inicial que un visitante realiza para activar su red de referidos.
- **Membresía Básica (S/120)**
  - No tiene descuento en productos en esta primera compra.
  - El afiliado paga el precio público del producto.
  - El "bono especial" radica en la habilitación de su red residual y su oficina virtual.
- **Membresía Ejecutivo (S/600)**
  - No tiene descuento en productos en esta primera compra.
  - El afiliado paga el precio público.
- **Pack 2,000 (Intermedio) (S/2,000)**
  - No tiene descuento en productos en esta primera compra.
  - El afiliado paga el precio público.
- **Membresía VIP (S/10,000)**
  - **BENEFICIO EXCLUSIVO VIP:** Tiene **50% de descuento** desde esta primera compra. Ellos SÍ pagan menos en el carrito inicial de activación, por haber elegido el máximo nivel.

## 2. Etapa de Recompra Mensual
Una vez que la cuenta está ACTIVA, todas las futuras compras generan **Recompra Mensual**, la cual otorga comisiones a toda la red ascendente de acuerdo a niveles.
- **Membresía Básica:**
  - Obtiene un **40% OFF** en todos los productos del catálogo.
- **Membresía Ejecutivo:**
  - Obtiene un **50% OFF** en todos los productos del catálogo.
- **Pack 2,000 (Intermedio):**
  - Obtiene un **50% OFF** en todos los productos del catálogo.
- **Membresía VIP:**
  - Obtiene un **50% OFF** en todos los productos del catálogo.

## 3. Comisiones de Red
- **Básico:** Comisiona hasta **3 niveles** de profundidad.
- **Ejecutivo:** Comisiona hasta **5 niveles** de profundidad.
- **Intermedio:** Comisiona hasta **7 niveles** de profundidad.
- **VIP:** Comisiona hasta **10 niveles** de profundidad, incluyendo un bono adicional especial del 3% en el nivel 8.

---

> [!IMPORTANT]
> - Cuando hablamos de descuentos con cuentas Básicas e Intermedias, nos referimos SIEMPRE a **Recompra**.
> - Cuando mostramos un badge de descuento en el carrito vacío de una persona nueva, NO debe aplicar descuento si elige Básico o Intermedio.
> - Esto está programado de forma sólida en el archivo `src/lib/activationPrice.ts`.
