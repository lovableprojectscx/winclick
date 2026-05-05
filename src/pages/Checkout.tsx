import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Upload, X, Check, Gift, AlertTriangle, MessageCircle, TrendingUp } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useWallet } from "@/hooks/useAffiliate";
import { usePlaceOrder } from "@/hooks/useOrders";
import { useBusinessSettings, useUpdateProfile } from "@/hooks/useAffiliate";
import { useStoreProducts } from "@/hooks/useProducts";
import { supabase } from "@/lib/supabase";
import {
  ACTIVATION_TARGET,
  ACTIVATION_DISCOUNT_PCT,
  RECOMPRA_DISCOUNT_PCT,
  hasActivationDiscount,
  getNextPlan,
  getReachedPlan,
  PLAN_DEPTH,
  getActivationCap,
} from "@/lib/activationPrice";

import { compressImage } from "@/lib/imageUtils";
import { ActivationProgress } from "@/components/checkout/ActivationProgress";
import { CheckoutSuccess } from "@/components/checkout/CheckoutSuccess";
import { DynamicIcon } from "@/components/DynamicIcon";

/* ── Componente Principal: Checkout ──────────────────────── */

export default function Checkout() {
  const { items, total, clearCart, affiliateCode, setAffiliateCode } = useCart();
  const { affiliate, session, loading: authLoading }   = useAuth();
  const { data: walletData }       = useWallet();
  const { data: settings }         = useBusinessSettings();
  const placeOrder                 = usePlaceOrder();
  
  const [refCode, setRefCode]      = useState(affiliateCode || "");
  const { data: storeData }        = useStoreProducts(refCode);

  const [paymentMethod,    setPaymentMethod]    = useState<"wallet" | "cash">("cash");
  const [receipt,          setReceipt]          = useState<File | null>(null);
  const [receiptUrl,       setReceiptUrl]       = useState<string | null>(null);
  const [refValid,         setRefValid]         = useState<boolean | null>(affiliateCode ? true : null);
  const [refName,          setRefName]          = useState("");
  const [processing,       setProcessing]       = useState(false);
  const [isUpgrading,      setIsUpgrading]      = useState(false);
  const [isCompressing,    setIsCompressing]    = useState(false);
  const [checkoutError,    setCheckoutError]    = useState<string | null>(null);
  const [success,          setSuccess]          = useState(false);
  const [orderNumber,      setOrderNumber]      = useState("");
  const [confirmedItems,       setConfirmedItems]       = useState<typeof items>([]);
  const [confirmedTotal,       setConfirmedTotal]       = useState(0);
  const [confirmedPayment,     setConfirmedPayment]     = useState<"wallet" | "cash">("cash");
  const [confirmedHighValue,   setConfirmedHighValue]   = useState(false);   // pago > S/700 → coordinar por WhatsApp con asesor
  const [formData,         setFormData]         = useState({ name: "", email: "", dni: "", phone: "", address: "", city: "" });
  const [savePreferences,  setSavePreferences]  = useState(true);

  const walletBalance = walletData?.balance ?? 0;
  const updateProfile = useUpdateProfile();

  useEffect(() => {
    if (!session?.user?.id) return;

    // 1. Primero cargar desde user_addresses (base)
    supabase
      .from("user_addresses")
      .select("*")
      .eq("user_id", session.user.id)
      .maybeSingle()
      .then(({ data: addr }) => {
        setFormData(prev => ({
          ...prev,
          dni:     addr?.dni     ?? prev.dni,
          phone:   addr?.phone   ?? prev.phone,
          address: addr?.address ?? prev.address,
          city:    addr?.city    ?? prev.city,
        }));

        // 2. Sobreescribir con perfil de afiliado si tiene datos más recientes
        if (affiliate) {
          setFormData(prev => ({
            ...prev,
            dni:     affiliate.dni             ?? prev.dni,
            phone:   affiliate.phone           ?? prev.phone,
            address: affiliate.shipping_address ?? prev.address,
            city:    affiliate.shipping_city   ?? prev.city,
          }));
        }
      });

    // 3. Auto-fill del propio código de afiliado
    if (affiliate?.affiliate_code && !affiliateCode && !refCode) {
      setRefCode(affiliate.affiliate_code);
      setRefValid(true);
      setRefName(affiliate.name ?? "");
    }
  }, [session?.user?.id, affiliate?.id]);

  // Sync form con usuario
  useEffect(() => {
    if (session?.user && !formData.email) {
      setFormData(f => ({ ...f, name: affiliate?.name ?? "", email: session.user.email ?? "" }));
    }
  }, [session, affiliate]);

  const handleUpgradePlan = async (planName: string) => {
    if (!affiliate) return;
    setIsUpgrading(true);
    setCheckoutError(null);
    try {
      // Obtenemos la profundidad correspondiente al nuevo plan
      const newDepth = PLAN_DEPTH[planName as keyof typeof PLAN_DEPTH] ?? 3;

      const { error } = await supabase
        .from("affiliates")
        .update({ 
          package: planName,
          depth_unlocked: newDepth 
        })
        .eq("id", affiliate.id);
      
      if (error) throw error;
      
      // Recargar para refrescar descuentos, carrito y estado de auth
      window.location.reload();
    } catch (err: any) {
      setCheckoutError("Error al ascender plan: " + err.message);
      setIsUpgrading(false);
    }
  };

  const validateRef = useCallback(async (code: string) => {
    setRefCode(code);
    if (!code) { setRefValid(null); return; }
    const { data } = await supabase
      .from("affiliates")
      .select("id, name, affiliate_code")
      .eq("affiliate_code", code.toUpperCase())
      .maybeSingle();
    setRefValid(!!data);
    setRefName(data?.name ?? "");
    if (data) setAffiliateCode(data.affiliate_code);
  }, [setAffiliateCode]);

  const handleSubmit = async () => {
    setCheckoutError(null);

    // Validación: mínimo acumulado de activación (total_sales ENTREGADO + carrito actual)
    if (affiliate?.account_status === "pending" && affiliate.package) {
      const target       = ACTIVATION_TARGET[affiliate.package] ?? 120;
      const cap          = getActivationCap(affiliate.package);
      const alreadySpent = affiliate.total_sales ?? 0;
      const cumulative   = alreadySpent + total;

      if (cumulative < target) {
        const remaining = (target - cumulative).toFixed(2);
        setCheckoutError(
          `Tu plan ${affiliate.package} requiere una compra de activación de S/ ${target.toLocaleString()} en total. ` +
          `Llevas acumulado S/ ${alreadySpent.toFixed(2)} — te faltan S/ ${remaining} más. ` +
          `Agrega más productos al carrito.`
        );
        return;
      }

      if (cumulative > cap) {
        setCheckoutError(
          `Tu carrito supera el tope máximo de activación ${affiliate.package} (S/ ${cap.toLocaleString()}). ` +
          `Por favor retira algunos productos antes de continuar.`
        );
        return;
      }
    }

    // Validación de campos requeridos
    if (!session && !formData.name.trim()) {
      setCheckoutError("Por favor ingresa tu nombre completo.");
      return;
    }
    if (!session && !formData.email.trim()) {
      setCheckoutError("Por favor ingresa tu correo electrónico.");
      return;
    }
    if (!formData.phone.trim()) {
      setCheckoutError("Por favor ingresa tu número de teléfono.");
      return;
    }
    if (!formData.address.trim()) {
      setCheckoutError("Por favor ingresa tu dirección de entrega.");
      return;
    }
    if (!formData.city.trim()) {
      setCheckoutError("Por favor ingresa tu ciudad o distrito.");
      return;
    }

    setProcessing(true);
    try {
      let receiptStorageUrl: string | undefined;
      if (paymentMethod === "cash" && receipt) {
        const ext  = receipt.name.split(".").pop();
        const folder = session ? session.user.id : "public";
        const uuid = (typeof crypto !== 'undefined' && crypto.randomUUID) 
          ? crypto.randomUUID() 
          : Math.random().toString(36).substring(2) + Date.now().toString(36);
        const path = `${folder}/checkout-${uuid}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("receipts").upload(path, receipt);
        if (uploadError) throw new Error(`Error al subir imagen: ${uploadError.message}`);
        const { data: { publicUrl } } = supabase.storage.from("receipts").getPublicUrl(path);
        receiptStorageUrl = publicUrl;
      }
      const order = await placeOrder.mutateAsync({
        customerName:    session ? (affiliate?.name ?? formData.name) : formData.name,
        customerEmail:   session ? (affiliate?.email ?? session.user.email ?? formData.email) : formData.email,
        customerPhone:   formData.phone,
        customerDni:     formData.dni,
        shippingAddress: formData.address,
        shippingCity:    formData.city,
        paymentMethod,
        items: items.map((i) => ({
          productId: i.product.id,
          name:      i.product.name,
          price:     i.unitPrice,   // precio real (public/partner/standard según contexto)
          quantity:  i.quantity,
        })),
        affiliateCode: refCode || affiliateCode || undefined,
        receiptUrl: receiptStorageUrl,
        isDropshipping,
      });
      setConfirmedItems([...items]);
      setConfirmedTotal(total);
      setConfirmedPayment(paymentMethod);
      setConfirmedHighValue(paymentMethod === "cash" && total > 700);
      setOrderNumber(order.order_number);

      if (session) {
        // Save address for future
        const { data: existing } = await supabase.from("user_addresses").select("id").eq("user_id", session.user.id).maybeSingle();
        if (existing) {
          await supabase.from("user_addresses").update({ address: formData.address, city: formData.city, dni: formData.dni, phone: formData.phone }).eq("id", existing.id);
        } else {
          await supabase.from("user_addresses").insert({ user_id: session.user.id, address: formData.address, city: formData.city, dni: formData.dni, phone: formData.phone });
        }

        // Also save to affiliate if checked
        if (affiliate && savePreferences) {
          try {
            await updateProfile.mutateAsync({
              shipping_address: formData.address,
              shipping_city:    formData.city,
              phone:            formData.phone,
              dni:              formData.dni || undefined,
            });
          } catch(e) {
            console.error("Error auto-saving profile", e);
          }
        }
      }

      clearCart();
      setSuccess(true);
    } catch (err: any) {
      const msg = err?.message || (err instanceof Error ? err.message : "Error desconocido");
      console.error("Order creation failed:", err);
      setCheckoutError(`No se pudo crear el pedido: ${msg}`);
    } finally {
      setProcessing(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background pt-20 flex flex-col items-center justify-center gap-4 px-4">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="font-jakarta text-sm text-wo-crema-muted">Cargando datos de socio...</p>
      </div>
    );
  }

  if (items.length === 0 && !success) {

    return (
      <div className="min-h-screen bg-background pt-20 flex flex-col items-center justify-center gap-4 px-4">
        <ShoppingCart size={48} className="text-wo-crema-muted opacity-30" />
        <h2 className="font-syne font-bold text-[22px] text-wo-crema text-center">Tu carrito está vacío</h2>
        <Link to="/catalogo" className="bg-primary text-primary-foreground font-jakarta font-bold text-sm px-8 py-3.5 rounded-wo-btn min-h-[48px] flex items-center">
          Ir al catálogo
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <CheckoutSuccess
        orderNumber={orderNumber}
        confirmedItems={confirmedItems}
        confirmedTotal={confirmedTotal}
        confirmedPayment={confirmedPayment}
        formData={formData}
        confirmedHighValue={confirmedHighValue}
        settings={settings}
      />
    );
  }

  const isPending = affiliate?.account_status === "pending";
  // Un pedido es dropshipping solo si no hay sesión (invitado en tienda)
  // o si el afiliado logueado está comprando con el código de otro (y no es activación)
  const isDropshipping = !isPending && (
    !session || 
    (!!affiliate && !!refCode && refCode.toUpperCase() !== affiliate.affiliate_code?.toUpperCase())
  );

  const isRetailFlow = !!refCode && isDropshipping;
  const store = storeData?.store;

  return (
    <div className="min-h-screen bg-background">
      {/* Header Dinámico (Branding de Tienda o Winclick) */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-wo-grafito/80 backdrop-blur-xl border-b border-white/5 h-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
          <Link to={isRetailFlow ? `/tienda/${refCode}` : "/"} className="flex items-center gap-2 group">
            {isRetailFlow && store ? (
              <>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-lg transform group-hover:rotate-12 transition-transform"
                     style={{ backgroundColor: store.accent_color || "hsl(var(--primary))" }}>
                   {store.banner_icon ? (
                     <DynamicIcon name={store.banner_icon} size={18} className="text-primary-foreground" />
                   ) : (
                     <span className="text-sm">{store.banner_emoji ?? "🏪"}</span>
                   )}
                </div>
                <span className="font-syne font-bold text-wo-crema text-lg tracking-tight">
                  {store.store_name}
                </span>
              </>
            ) : (
              <>
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-syne font-bold text-primary-foreground transform group-hover:rotate-12 transition-transform">
                  W
                </div>
                <span className="font-syne font-bold text-wo-crema text-lg tracking-tight">Winclick</span>
              </>
            )}
          </Link>

          <Link to={isRetailFlow ? `/tienda/${refCode}` : "/catalogo"} className="text-wo-crema-muted hover:text-wo-crema font-jakarta text-xs flex items-center gap-1.5 transition-colors">
             <ShoppingCart size={14} /> {isRetailFlow ? "Volver a la tienda" : "Volver al catálogo"}
          </Link>
        </div>
      </header>

      <div className="pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <h1 className="font-syne font-extrabold text-[26px] sm:text-[28px] text-wo-crema mb-4">Finalizar Compra</h1>

        {/* ── Banners contextuales ─────────────────────────────────────────── */}
        {!session && !refCode && (
          /* Guest normal (sin tienda): invitar a iniciar sesión */
          <div className="rounded-xl px-4 py-3 mb-6 flex items-center justify-between gap-4 flex-wrap"
            style={{ background: "rgba(232,116,26,0.07)", border: "0.5px solid rgba(232,116,26,0.25)" }}>
            <div className="flex items-center gap-2.5">
              <span className="text-primary text-lg">✦</span>
              <p className="font-jakarta text-[13px] text-wo-crema leading-snug">
                ¿Eres socio? <span className="text-wo-crema-muted">Inicia sesión para comprar con tu precio afiliado.</span>
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Link to="/login-afiliado" state={{ from: "/checkout" }}
                className="font-jakarta font-bold text-[12px] px-4 py-2 rounded-full"
                style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}>
                Iniciar sesión
              </Link>
            </div>
          </div>
        )}

        {session && affiliate?.account_status === "pending" && affiliate.package && (
          /* Afiliado pendiente — compra de activación */
          (() => {
            const plan = affiliate.package;
            const vipDiscount = hasActivationDiscount(plan);
            return (
              <div className="rounded-xl px-4 py-3 mb-6 flex items-center gap-3"
                style={{
                  background: vipDiscount ? "rgba(245,200,66,0.06)" : "rgba(232,116,26,0.07)",
                  border: vipDiscount ? "0.5px solid rgba(245,200,66,0.35)" : "0.5px solid rgba(232,116,26,0.30)",
                }}>
                <span className="shrink-0" style={{ fontSize: "16px" }}>
                  {vipDiscount ? "👑" : "🔥"}
                </span>
                <p className="font-jakarta text-[13px] text-wo-crema leading-snug">
                  <span className="font-bold" style={{ color: vipDiscount ? "#D4A017" : "hsl(var(--primary))" }}>
                    Compra de activación — {plan}
                  </span>
                  <span className="text-wo-crema-muted ml-1.5">
                    {vipDiscount
                      ? `— Precio con ${ACTIVATION_DISCOUNT_PCT[plan]}% OFF exclusivo de tu plan VIP para activar tu membresía.`
                      : "— Estás comprando al precio público para activar tu membresía."
                    }
                    {" "}Las comisiones de red arrancan desde tu primera recompra mensual (
                    <span className="font-semibold text-wo-crema">{RECOMPRA_DISCOUNT_PCT[plan] ?? 0}% OFF</span>).
                  </span>
                </p>
              </div>
            );
          })()
        )}

        {session && affiliate?.account_status === "suspended" && (
          /* Afiliado suspendido */
          <div className="rounded-xl px-4 py-3 mb-6 flex items-center gap-3"
            style={{ background: "rgba(231,76,60,0.07)", border: "0.5px solid rgba(231,76,60,0.30)" }}>
            <AlertTriangle size={16} className="text-destructive shrink-0" />
            <p className="font-jakarta text-[13px] text-wo-crema leading-snug">
              <span className="font-bold text-destructive">Membresía suspendida</span>
              <span className="text-wo-crema-muted ml-1.5">— Reactiva tu cuenta para seguir ganando comisiones en tu red.</span>
            </p>
          </div>
        )}

        {session && affiliate && affiliate.account_status === "active" && !isRetailFlow && (
          /* Afiliado activo: precio socio aplicado */
          <div className="rounded-xl px-4 py-3 mb-6 flex items-center gap-3"
            style={{ background: "rgba(30,192,213,0.06)", border: "0.5px solid rgba(30,192,213,0.20)" }}>
            <Check size={16} style={{ color: "hsl(var(--secondary))", flexShrink: 0 }} />
            <p className="font-jakarta text-[13px] text-wo-crema-muted">
              Precio de socio aplicado — <span className="font-bold text-wo-crema">comprando como {affiliate.name ?? "afiliado"}</span>
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
          {/* Form */}
          <div className="lg:col-span-3 space-y-5">

            {/* ── Señal de upgrade dinámico: el acumulado alcanza un plan superior ── */}
            {(() => {
              // Ahora disponible para todos los afiliados (pending o active) que no sean VIP
              if (!affiliate || !affiliate.package || affiliate.package === "VIP") return null;
              
              // Para activación se usa total_sales + carrito. Para activos, el upgrade se basa en la misma lógica acumulativa.
              const cumulative = (affiliate.total_sales ?? 0) + total;
              const reachedPlan = getReachedPlan(affiliate.package, cumulative);
              if (!reachedPlan) return null;
              
              const nextDiscount = RECOMPRA_DISCOUNT_PCT[reachedPlan];
              const nextDepth    = PLAN_DEPTH[reachedPlan];
              
              return (
                <div className="rounded-xl px-4 py-3.5 mb-4 flex items-start gap-3 relative overflow-hidden"
                  style={{ background: "rgba(245,200,66,0.07)", border: "0.5px solid rgba(245,200,66,0.35)" }}>
                  
                  {isUpgrading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                      <div className="w-5 h-5 rounded-full border-2 border-wo-oro border-t-transparent animate-spin" />
                    </div>
                  )}

                  <span className="text-lg shrink-0 mt-0.5">👑</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-jakarta font-bold text-[13px]" style={{ color: "#D4A017" }}>
                      ¡Tu carrito ya alcanza la meta del plan {reachedPlan}!
                    </p>
                    <p className="font-jakarta text-[12px] text-wo-crema-muted mt-0.5 leading-snug">
                      Asciende tu cuenta ahora y obtén{" "}
                      <strong>{nextDiscount}% OFF en tus recompras mensuales</strong> más{" "}
                      <strong>{nextDepth} niveles</strong> de red residual.
                    </p>
                    <button
                      onClick={() => handleUpgradePlan(reachedPlan)}
                      disabled={isUpgrading}
                      className="inline-block mt-2.5 font-jakarta text-[11px] font-bold px-4 py-2 rounded-full transition-transform hover:scale-105 active:scale-95"
                      style={{ background: "#D4A017", color: "hsl(var(--background))", border: "none" }}>
                      Ascender a {reachedPlan} ahora →
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Barra de activación para afiliados pendientes */}
            {affiliate && affiliate.account_status === "pending" && affiliate.package && (
              <ActivationProgress
                packageName={affiliate.package}
                alreadySpent={affiliate.total_sales ?? 0}
                cartTotal={total}
              />
            )}

            {/* Payment method */}
            <div>
              <h3 className="font-jakarta font-semibold text-sm text-wo-crema mb-3">Método de pago</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(session && !isRetailFlow ? [
                  { value: "wallet" as const, icon: "💳", label: "Billetera Winclick", sub: `Saldo: S/ ${walletBalance.toFixed(2)}` },
                  { value: "cash"   as const, icon: "💵", label: "Dinero Real",        sub: "Yape / Plin / Banco" },
                ] : [
                  { value: "cash"   as const, icon: "💵", label: "Dinero Real",        sub: "Yape / Plin / Banco" },
                ]).map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setPaymentMethod(m.value)}
                    className={`text-left p-4 rounded-wo-btn transition-all min-h-[80px] ${paymentMethod === m.value ? "bg-primary/5" : "bg-wo-carbon"}`}
                    style={{ border: paymentMethod === m.value ? "0.5px solid rgba(232,116,26,0.5)" : "0.5px solid rgba(255,255,255,0.07)" }}
                  >
                    <span className="text-xl">{m.icon}</span>
                    <p className="font-jakarta font-semibold text-sm text-wo-crema mt-1.5">{m.label}</p>
                    <p className="font-jakarta text-xs text-wo-crema-muted">{m.sub}</p>
                  </button>
                ))}
              </div>
            </div>

            {paymentMethod === "wallet" ? (
              <div className="rounded-wo-btn p-4" style={{ background: "rgba(30,192,213,0.08)", border: "0.5px solid rgba(30,192,213,0.3)" }}>
                <p className="font-jakarta text-sm text-secondary flex items-center gap-2">
                  <Check size={14} /> Se descontarán S/ {total.toFixed(2)} de tu billetera
                </p>
              </div>
            ) : (
              <div>
                <h3 className="font-jakarta font-semibold text-sm text-wo-crema mb-3">
                  {total > 700 ? "Proceso con asesor" : "Comprobante de pago"}
                </h3>

                {/* ── Datos de pago — siempre visibles ── */}
                {total <= 700 && (settings?.yape_number || settings?.plin_number) && (
                  <div className="rounded-wo-card p-4 mb-4" style={{ background: "rgba(232,116,26,0.05)", border: "0.5px solid rgba(232,116,26,0.25)" }}>
                    <p className="font-jakarta text-[10px] font-bold text-wo-crema-muted uppercase tracking-widest mb-3">Realiza tu pago a</p>
                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                      {settings?.yape_qr_url && (
                        <img src={settings.yape_qr_url} alt="QR Yape/Plin" className="w-28 h-28 rounded-xl object-contain bg-white p-2 shrink-0" />
                      )}
                      <div className="flex-1 space-y-2 w-full">
                        {settings?.yape_number && (
                          <div className="flex items-center justify-between bg-wo-carbon rounded-lg px-4 py-2.5" style={{ border: "0.5px solid rgba(255,255,255,0.07)" }}>
                            <span className="font-jakarta text-xs text-wo-crema-muted">Yape</span>
                            <span className="font-syne font-bold text-base text-primary">{settings.yape_number}</span>
                          </div>
                        )}
                        {settings?.plin_number && (
                          <div className="flex items-center justify-between bg-wo-carbon rounded-lg px-4 py-2.5" style={{ border: "0.5px solid rgba(255,255,255,0.07)" }}>
                            <span className="font-jakarta text-xs text-wo-crema-muted">Plin</span>
                            <span className="font-syne font-bold text-base text-primary">{settings.plin_number}</span>
                          </div>
                        )}
                            {settings?.account_holder_name && (
                          <div className="flex items-center justify-between bg-wo-carbon rounded-lg px-4 py-2.5" style={{ border: "0.5px solid rgba(255,255,255,0.07)" }}>
                            <span className="font-jakarta text-xs text-wo-crema-muted">A nombre de</span>
                            <span className="font-jakarta font-semibold text-sm text-wo-crema">{settings.account_holder_name}</span>
                          </div>
                        )}
                        <p className="font-jakarta text-[11px] text-wo-crema/40 text-center">Monto exacto: <span className="text-primary font-bold">S/ {total.toFixed(2)}</span></p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Pago > S/700: Proceso de pago con asesor ── */}
                {total > 700 ? (
                  <div className="rounded-wo-card p-5"
                    style={{ background: "rgba(37,211,102,0.05)", border: "0.5px solid rgba(37,211,102,0.28)" }}>
                    <div className="flex items-start gap-3">
                      <span className="text-xl shrink-0 mt-0.5">📲</span>
                      <div className="flex-1">
                        <p className="font-jakarta font-bold text-[14px] text-wo-crema mb-1">
                          Proceso de atención personalizada
                        </p>
                        <p className="font-jakarta text-[12px] text-wo-crema-muted leading-snug mb-1">
                          Atención: Para compras que superan los S/ 700, el proceso es personalizado. Llena tus datos de envío y confirma tu pedido ahora. No necesitas subir comprobante aquí.
                        </p>
                        <p className="font-jakarta text-[11px] font-bold mb-3" style={{ color: "rgba(37,211,102,0.85)" }}>
                          ✓ Al confirmar, se registrará tu orden y te daremos un enlace a WhatsApp. Comunícate con un asesor para que procese tu pago y pedido de forma segura.
                        </p>
                        {settings?.whatsapp_number && (
                          <div className="flex items-center gap-2 bg-wo-carbon rounded-lg px-3 py-2" style={{ border: "0.5px solid rgba(37,211,102,0.2)" }}>
                            <MessageCircle size={13} style={{ color: "rgba(37,211,102,0.8)" }} />
                            <span className="font-jakarta text-[12px] text-wo-crema-muted">WhatsApp Asesor: </span>
                            <span className="font-syne font-bold text-sm text-wo-crema">{settings.whatsapp_number}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {!receipt ? (
                      <label 
                        htmlFor="receipt-upload"
                        className="block bg-wo-carbon rounded-wo-btn p-6 sm:p-8 text-center cursor-pointer hover:bg-wo-grafito transition-colors" 
                        style={{ border: "1px dashed rgba(255,255,255,0.15)" }}
                      >
                        <div className="flex flex-col items-center">
                          {isCompressing ? (
                            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mb-3" />
                          ) : (
                            <Upload size={24} className="mx-auto text-wo-crema-muted mb-3" />
                          )}
                        </div>
                        <p className="font-jakarta text-sm text-wo-crema-muted">
                          {isCompressing ? "Procesando imagen..." : "Sube tu comprobante"}
                        </p>
                        <p className="font-jakarta text-xs text-wo-crema/30 mt-1">JPG, PNG, HEIC o PDF</p>
                      </label>
                    ) : (
                      <div className="flex items-center gap-3 bg-wo-carbon rounded-lg p-3.5 border border-secondary/30">
                        <div className="w-12 h-12 rounded-lg bg-wo-grafito flex items-center justify-center shrink-0 overflow-hidden">
                          {receiptUrl && (receipt.type.startsWith('image/') || receipt.name.toLowerCase().endsWith('.heic')) ? (
                            <img 
                              src={receiptUrl} 
                              alt="Comprobante" 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <Check size={20} className="text-secondary" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-jakarta text-[13px] font-bold text-wo-crema truncate">¡Imagen lista!</p>
                          <p className="font-jakarta text-[11px] text-wo-crema-muted truncate">{receipt.name}</p>
                        </div>
                        <button 
                          onClick={() => { setReceipt(null); setReceiptUrl(null); setCheckoutError(null); }} 
                          className="w-10 h-10 flex items-center justify-center text-wo-crema/40 hover:text-destructive transition-colors shrink-0"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}

                    {/* El input se mantiene siempre fuera de los condicionales para no perder el foco/contexto en móviles */}
                    <input 
                      id="receipt-upload"
                      type="file" 
                      className="hidden" 
                      accept="image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf" 
                      disabled={isCompressing}
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        
                        setIsCompressing(true);
                        setCheckoutError(null);

                        try {
                          const compressed = await compressImage(f);
                          setReceipt(compressed);
                          setReceiptUrl(URL.createObjectURL(compressed));
                        } catch (err) {
                          console.error("Upload error:", err);
                          if (f.size <= 10 * 1024 * 1024) {
                            setReceipt(f);
                            setReceiptUrl(URL.createObjectURL(f));
                          } else {
                            setCheckoutError("La imagen es demasiado pesada (>10MB).");
                          }
                        } finally {
                          setIsCompressing(false);
                          // Reset input value to allow selecting the same file again if needed
                          e.target.value = '';
                        }
                      }} 
                    />
                    
                    {checkoutError && !processing && (
                      <div className="mt-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                        <p className="font-jakarta text-[11px] text-destructive text-center font-medium">{checkoutError}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Shipping */}
            <div className="space-y-4">
              <h3 className="font-jakarta font-semibold text-sm text-wo-crema">Datos de envío</h3>
              {session ? (
                <div className="bg-wo-carbon rounded-wo-btn py-3 px-4 opacity-70" style={{ border: "0.5px solid rgba(255,255,255,0.07)" }}>
                  <p className="font-jakarta text-sm text-wo-crema">{affiliate?.email ?? session.user.email}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { key: "name",  label: "Nombre completo", placeholder: "Juan Pérez",         maxLength: 100 },
                    { key: "email", label: "Correo electrónico", placeholder: "correo@email.com", maxLength: 100 },
                  ].map((f) => (
                    <div key={f.key}>
                      <label className="block font-jakarta text-xs text-wo-crema-muted font-medium mb-1.5">{f.label}</label>
                      <input
                        value={formData[f.key as keyof typeof formData]}
                        onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })}
                        placeholder={f.placeholder}
                        maxLength={f.maxLength}
                        className="w-full bg-wo-carbon font-jakarta text-sm text-wo-crema placeholder:text-wo-crema/30 px-4 py-3.5 rounded-wo-btn outline-none focus:ring-1 focus:ring-primary min-h-[48px]"
                        style={{ border: "0.5px solid rgba(255,255,255,0.1)" }}
                      />
                    </div>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { key: "dni",   label: "DNI / CE",     placeholder: "Número de documento",      maxLength: 12, sensitive: true },
                  { key: "phone", label: "Teléfono", placeholder: "+51 987654321",              sensitive: true },
                ].map((f) => (
                  <div key={f.key}>
                    <label className="block font-jakarta text-xs text-wo-crema-muted font-medium mb-1.5">{f.label}</label>
                    <input
                      value={formData[f.key as keyof typeof formData]}
                      onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })}
                      placeholder={f.placeholder}
                      maxLength={f.maxLength}
                      {...(f.sensitive ? { "data-idenza-ignore": true } : {})}
                      className="w-full bg-wo-carbon font-jakarta text-sm text-wo-crema placeholder:text-wo-crema/30 px-4 py-3.5 rounded-wo-btn outline-none focus:ring-1 focus:ring-primary min-h-[48px]"
                      style={{ border: "0.5px solid rgba(255,255,255,0.1)" }}
                    />
                  </div>
                ))}
              </div>
              {[
                { key: "address", label: "Dirección",         placeholder: "Av. Lima 123" },
                { key: "city",    label: "Ciudad / Distrito", placeholder: "Miraflores, Lima" },
              ].map((f) => (
                <div key={f.key}>
                  <label className="block font-jakarta text-xs text-wo-crema-muted font-medium mb-1.5">{f.label}</label>
                  <input
                    value={formData[f.key as keyof typeof formData]}
                    onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                    className="w-full bg-wo-carbon font-jakarta text-sm text-wo-crema placeholder:text-wo-crema/30 px-4 py-3.5 rounded-wo-btn outline-none focus:ring-1 focus:ring-primary min-h-[48px]"
                    style={{ border: "0.5px solid rgba(255,255,255,0.1)" }}
                  />
                </div>
              ))}

              {affiliate && (
                <label className="flex items-start gap-3 p-3 bg-wo-grafito rounded-lg cursor-pointer transform -translate-y-2 mt-4" style={{ border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div className="pt-0.5">
                    <input type="checkbox" checked={savePreferences} onChange={(e) => setSavePreferences(e.target.checked)} className="peer sr-only" />
                    <div className="w-4 h-4 rounded-full border border-wo-crema/20 peer-checked:bg-secondary peer-checked:border-secondary flex items-center justify-center transition-colors">
                      {savePreferences && <Check size={10} className="text-white" />}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-jakarta text-[13px] text-wo-crema font-bold leading-none mb-1">Guardar esta información para mis futuras compras</h4>
                    <p className="font-jakarta text-[11px] text-wo-crema-muted leading-tight">Autorizo vincular la dirección y teléfono a mi perfil para no ingresarlos nuevamente.</p>
                  </div>
                </label>
              )}

              {/* Affiliate code */}
              <div>
                <label className="block font-jakarta text-xs text-wo-crema-muted font-medium mb-1.5">Código de afiliado (opcional)</label>
                <div className="relative">
                  <Gift size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-wo-crema-muted pointer-events-none" />
                  <input
                    value={refCode}
                    onChange={(e) => validateRef(e.target.value)}
                    placeholder="WIN-XXXXXX"
                    className="w-full bg-wo-carbon font-jakarta text-sm text-wo-crema placeholder:text-wo-crema/30 pl-10 pr-4 py-3.5 rounded-wo-btn outline-none min-h-[48px]"
                    style={{ border: refValid === true ? "0.5px solid hsl(var(--wo-esmeralda))" : refValid === false ? "0.5px solid hsl(var(--destructive))" : "0.5px solid rgba(255,255,255,0.1)" }}
                  />
                </div>
                {refValid === true  && <p className="font-jakarta text-xs text-secondary mt-1.5">✓ Código válido — Referido por: {refName}</p>}
                {refValid === false && <p className="font-jakarta text-xs text-destructive mt-1.5">✗ Código no encontrado</p>}

                {/* Aviso para activaciones (NO generan comisiones al red) */}
                {affiliate && affiliate.account_status === "pending" && (
                  <div className="mt-3 p-3 rounded-lg flex gap-2" style={{ background: "rgba(232,116,26,0.06)", border: "0.5px solid rgba(232,116,26,0.3)" }}>
                    <span className="text-wo-crema-muted mt-0.5 shrink-0"><Check size={14} /></span>
                    <p className="font-jakarta text-[11px] text-wo-crema-muted leading-tight">
                      <strong className="text-wo-crema">Nota sobre tu referido:</strong> Como esta es tu compra de activación, no genera comisiones para tu patrocinador. 
                      Tu patrocinador ganará a partir de tu primera recompra mensual.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {checkoutError && (
              <div className="rounded-wo-btn p-4" style={{ background: "rgba(231,76,60,0.08)", border: "0.5px solid rgba(231,76,60,0.3)" }}>
                <p className="font-jakarta text-sm text-destructive">{checkoutError}</p>
              </div>
            )}

            {/* Aviso mínimo de activación — muestra el avance acumulado real */}
            {affiliate?.account_status === "pending" && affiliate.package && (() => {
              const target       = ACTIVATION_TARGET[affiliate.package] ?? 120;
              const alreadySpent = affiliate.total_sales ?? 0;
              const cumulative   = alreadySpent + total;
              if (cumulative >= target) return null;
              const remaining    = (target - cumulative).toFixed(2);
              return (
                <div className="rounded-wo-btn px-4 py-3 flex items-start gap-2.5"
                  style={{ background: "rgba(232,116,26,0.07)", border: "0.5px solid rgba(232,116,26,0.30)" }}>
                  <AlertTriangle size={14} className="text-primary shrink-0 mt-0.5" />
                  <p className="font-jakarta text-[12px] text-wo-crema-muted leading-snug">
                    Para activar tu membresía <strong className="text-wo-crema">{affiliate.package}</strong> necesitas
                    alcanzar{" "}
                    <strong style={{ color: "hsl(var(--primary))" }}>S/ {target.toLocaleString()}</strong> en compras acumuladas.
                    {alreadySpent > 0 && (
                      <> Llevas <strong className="text-wo-crema">S/ {alreadySpent.toFixed(2)}</strong> ya entregado.</>
                    )}
                    {" "}Con este carrito llegarías a{" "}
                    <strong className="text-wo-crema">S/ {cumulative.toFixed(2)}</strong>.
                    {" "}Te faltan{" "}
                    <strong style={{ color: "hsl(var(--primary))" }}>S/ {remaining}</strong>.{" "}
                    <Link to="/catalogo" className="font-bold underline" style={{ color: "hsl(var(--primary))" }}>
                      Agregar más productos →
                    </Link>
                  </p>
                </div>
              );
            })()}

            <button
              onClick={handleSubmit}
              disabled={
                processing ||
                // Para pagos en efectivo: receipt requerido solo si total <= 700
                // Compras > S/700 coordinan con asesor por WhatsApp después del pedido — sin receipt previo
                (paymentMethod === "cash" && !receipt && total <= 700) ||
                (paymentMethod === "wallet" && total > walletBalance) ||
                // Bloquear si el acumulado (entregado + carrito) no alcanza la meta de activación
                (affiliate?.account_status === "pending" && !!affiliate.package &&
                  (affiliate.total_sales ?? 0) + total < (ACTIVATION_TARGET[affiliate.package] ?? 120))
              }
              className="w-full bg-primary text-primary-foreground font-jakarta font-bold text-sm py-4 rounded-wo-btn hover:bg-wo-oro-dark transition-colors disabled:opacity-35 disabled:cursor-not-allowed min-h-[52px]"
            >
              {processing
                ? "Procesando..."
                : paymentMethod === "wallet"
                  ? `Pagar S/ ${total.toFixed(2)} con Billetera`
                  : total > 700
                    ? `Generar pedido (S/ ${total.toFixed(2)}) y coordinar pago`
                    : `Confirmar Pedido (S/ ${total.toFixed(2)})`}
            </button>
          </div>

          {/* Summary */}
          <div className="lg:col-span-2 order-first lg:order-last">
            <div className="bg-wo-grafito rounded-wo-card p-5 lg:sticky lg:top-24" style={{ border: "0.5px solid rgba(255,255,255,0.07)" }}>
              <h3 className="font-jakarta font-semibold text-sm text-wo-crema-muted uppercase tracking-[0.1em] mb-4">Resumen</h3>
              <div className="space-y-3 mb-4">
                {items.map((item) => (
                  <div key={item.product.id} className="flex justify-between gap-2">
                    <span className="font-jakarta text-sm text-wo-crema-muted">{item.product.name} × {item.quantity}</span>
                    <span className="font-jakarta text-sm text-primary shrink-0">S/ {(item.unitPrice * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="pt-4 flex justify-between items-center" style={{ borderTop: "0.5px solid rgba(255,255,255,0.07)" }}>
                <span className="font-jakarta text-sm text-wo-crema">Total</span>
                <span className="font-syne font-extrabold text-[22px] text-primary">S/ {total.toFixed(2)}</span>
              </div>
              {paymentMethod === "wallet" && (
                <div className="mt-3">
                  <span className={`text-xs font-jakarta font-bold px-2 py-1 rounded-wo-pill inline-block ${walletBalance >= total ? "bg-secondary/12 text-secondary" : "bg-destructive/12 text-destructive"}`} style={{ border: walletBalance >= total ? "0.5px solid rgba(30,192,213,0.25)" : "0.5px solid rgba(231,76,60,0.25)" }}>
                    {walletBalance >= total ? "Saldo suficiente" : "Saldo insuficiente"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
