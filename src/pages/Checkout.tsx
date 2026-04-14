import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Upload, X, Check, Gift, AlertTriangle, MessageCircle } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useWallet } from "@/hooks/useAffiliate";
import { usePlaceOrder } from "@/hooks/useOrders";
import { useBusinessSettings, useUpdateProfile } from "@/hooks/useAffiliate";
import { supabase } from "@/lib/supabase";

// Comprime una imagen a máx 1200px y calidad 0.8 → File JPEG < ~500 KB
async function compressImage(file: File): Promise<File> {
  if (file.type === "application/pdf") return file; // PDFs no se comprimen
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 1200;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round((height * MAX) / width); width = MAX; }
        else                { width = Math.round((width * MAX) / height);  height = MAX; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          resolve(blob ? new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }) : file);
        },
        "image/jpeg", 0.82
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

export default function Checkout() {
  const { items, total, clearCart, affiliateCode, setAffiliateCode } = useCart();
  const { affiliate, session }   = useAuth();
  const { data: walletData }     = useWallet();
  const { data: settings }       = useBusinessSettings();
  const placeOrder               = usePlaceOrder();

  const [paymentMethod,    setPaymentMethod]    = useState<"wallet" | "cash">("cash");
  const [receipt,          setReceipt]          = useState<File | null>(null);
  const [receiptUrl,       setReceiptUrl]       = useState<string | null>(null);
  const [refCode,          setRefCode]          = useState(affiliateCode || "");
  const [refValid,         setRefValid]         = useState<boolean | null>(affiliateCode ? true : null);
  const [refName,          setRefName]          = useState("");
  const [processing,       setProcessing]       = useState(false);
  const [checkoutError,    setCheckoutError]    = useState<string | null>(null);
  const [success,          setSuccess]          = useState(false);
  const [orderNumber,      setOrderNumber]      = useState("");
  const [confirmedItems,   setConfirmedItems]   = useState<typeof items>([]);
  const [confirmedTotal,   setConfirmedTotal]   = useState(0);
  const [confirmedPayment, setConfirmedPayment] = useState<"wallet" | "cash">("cash");
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

  const validateRef = async (code: string) => {
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
  };

  const handleSubmit = async () => {
    setCheckoutError(null);

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
        const path = `${folder}/checkout-${crypto.randomUUID()}.${ext}`;
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
          price:     i.product.price,
          quantity:  i.quantity,
        })),
        affiliateCode: refCode || affiliateCode || undefined,
        receiptUrl: receiptStorageUrl,
      });
      setConfirmedItems([...items]);
      setConfirmedTotal(total);
      setConfirmedPayment(paymentMethod);
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
      <div className="min-h-screen bg-background pt-20 pb-16">
        <div className="max-w-lg mx-auto px-4">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-secondary/15 flex items-center justify-center mx-auto mb-4" style={{ border: "1px solid rgba(30,192,213,0.3)" }}>
              <Check size={28} className="text-secondary" />
            </div>
            <h2 className="font-syne font-extrabold text-[26px] text-wo-crema">¡Pedido confirmado!</h2>
            <p className="font-jakarta text-sm text-wo-crema-muted mt-1">Nos pondremos en contacto contigo cuando sea enviado.</p>
          </div>

          <div className="rounded-wo-card p-5 text-center mb-4" style={{ background: "rgba(232,116,26,0.06)", border: "0.5px solid rgba(232,116,26,0.25)" }}>
            <p className="font-jakarta text-[11px] text-wo-crema-muted uppercase font-semibold mb-1">Número de pedido</p>
            <p className="font-syne font-extrabold text-3xl text-primary">{orderNumber}</p>
            <p className="font-jakarta text-[11px] text-wo-crema-muted mt-1">Guarda este número para seguimiento</p>
          </div>

          <div className="bg-wo-grafito rounded-wo-card p-5 mb-4" style={{ border: "0.5px solid rgba(255,255,255,0.07)" }}>
            <p className="font-jakarta text-[11px] text-wo-crema-muted uppercase font-semibold mb-3">Productos</p>
            <div className="space-y-2 mb-3">
              {confirmedItems.map((item) => (
                <div key={item.product.id} className="flex justify-between items-center gap-2">
                  <span className="font-jakarta text-xs text-wo-crema">{item.product.name} × {item.quantity}</span>
                  <span className="font-jakarta text-xs text-primary font-semibold shrink-0">S/ {(item.product.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center pt-3" style={{ borderTop: "0.5px solid rgba(255,255,255,0.07)" }}>
              <span className="font-jakarta text-sm text-wo-crema font-semibold">Total</span>
              <span className="font-syne font-extrabold text-xl text-primary">S/ {confirmedTotal.toFixed(2)}</span>
            </div>
          </div>

          <div className="bg-wo-grafito rounded-wo-card p-5 mb-6" style={{ border: "0.5px solid rgba(255,255,255,0.07)" }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="font-jakarta text-[11px] text-wo-crema-muted uppercase font-semibold mb-1.5">Método de pago</p>
                <p className="font-jakarta text-sm text-wo-crema">
                  {confirmedPayment === "wallet" ? "💳 Billetera Winclick" : "💵 Dinero Real"}
                </p>
              </div>
              {formData.address && (
                <div>
                  <p className="font-jakarta text-[11px] text-wo-crema-muted uppercase font-semibold mb-1.5">Dirección</p>
                  <p className="font-jakarta text-sm text-wo-crema">{formData.address}</p>
                  {formData.city && <p className="font-jakarta text-xs text-wo-crema-muted">{formData.city}</p>}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <p className="font-jakarta text-[11px] text-wo-crema/40 text-center">📦 Te contactaremos cuando tu pedido sea enviado</p>
            <Link to="/catalogo" className="block text-center bg-primary text-primary-foreground font-jakarta font-bold text-sm py-4 rounded-wo-btn hover:bg-wo-oro-dark transition-colors min-h-[52px] flex items-center justify-center">
              Seguir comprando
            </Link>
            <Link to="/area-afiliado" className="block text-center font-jakarta text-sm text-wo-crema-muted hover:text-wo-crema py-3">
              Ir a mi dashboard →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <h1 className="font-syne font-extrabold text-[26px] sm:text-[28px] text-wo-crema mb-6">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
          {/* Form */}
          <div className="lg:col-span-3 space-y-5">
            {/* Payment method */}
            <div>
              <h3 className="font-jakarta font-semibold text-sm text-wo-crema mb-3">Método de pago</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(session ? [
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
                <h3 className="font-jakarta font-semibold text-sm text-wo-crema mb-3">Comprobante de pago</h3>

                {/* ── Datos de pago — siempre visibles ── */}
                {total <= 500 && (settings?.yape_number || settings?.plin_number) && (
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

                {total > 500 && (
                  <div className="bg-amber-900/10 border border-amber-500/20 rounded-wo-card p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle size={16} className="text-amber-400 mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <p className="font-jakarta font-semibold text-sm text-amber-400 mb-1">Tu compra supera el límite diario de Yape/Plin</p>
                        <p className="font-jakarta text-[13px] text-wo-crema-muted leading-relaxed mb-3">
                          Para compras mayores a S/ 500 (Ej. Activación VIP o Intermedia), por favor comunícate con un asesor para recibir la cuenta bancaria de la empresa y finalizar tu compra internamente o subir las capturas fragmentadas aquí.
                        </p>
                        <a
                          href={`https://wa.me/${(settings?.whatsapp_number ?? "").replace(/\D/g, "")}?text=${encodeURIComponent(
                            `Hola, quiero realizar un pedido por S/ ${total.toFixed(2)}. Mi DNI/RUC es ${formData.dni || 'Aún no ingresado'}. Por favor indíquenme los números de cuenta bancaria.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 bg-[#25D366] text-white font-jakarta font-bold text-xs px-4 py-2.5 rounded-wo-btn hover:bg-[#1ebe5d] transition-colors"
                        >
                          <MessageCircle size={15} /> Coordinar por WhatsApp
                        </a>
                      </div>
                    </div>
                  </div>
                )}
                {!receipt ? (
                  <label className="block bg-wo-carbon rounded-wo-btn p-6 sm:p-8 text-center cursor-pointer hover:bg-wo-grafito transition-colors" style={{ border: "1px dashed rgba(255,255,255,0.15)" }}>
                    <Upload size={24} className="mx-auto text-wo-crema-muted mb-3" />
                    <p className="font-jakarta text-sm text-wo-crema-muted">Sube tu comprobante</p>
                    <p className="font-jakarta text-xs text-wo-crema/30 mt-1">JPG, PNG o PDF</p>
                    <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const compressed = await compressImage(f);
                      setReceipt(compressed);
                      setReceiptUrl(URL.createObjectURL(compressed));
                    }} />
                  </label>
                ) : (
                  <div className="flex items-center gap-3 bg-wo-carbon rounded-lg p-3.5" style={{ border: "0.5px solid rgba(255,255,255,0.07)" }}>
                    {receiptUrl && <img src={receiptUrl} alt="Comprobante" className="w-16 h-16 rounded-lg object-cover shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="font-jakarta text-sm text-wo-crema truncate">{receipt.name}</p>
                    </div>
                    <button onClick={() => { setReceipt(null); setReceiptUrl(null); }} className="w-9 h-9 flex items-center justify-center text-destructive shrink-0">
                      <X size={15} />
                    </button>
                  </div>
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
                  { key: "dni",   label: "DNI",     placeholder: "12345678",      maxLength: 8, sensitive: true },
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
              </div>
            </div>

            {checkoutError && (
              <div className="rounded-wo-btn p-4" style={{ background: "rgba(231,76,60,0.08)", border: "0.5px solid rgba(231,76,60,0.3)" }}>
                <p className="font-jakarta text-sm text-destructive">{checkoutError}</p>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={processing || (paymentMethod === "cash" && !receipt)}
              className="w-full bg-primary text-primary-foreground font-jakarta font-bold text-sm py-4 rounded-wo-btn hover:bg-wo-oro-dark transition-colors disabled:opacity-35 disabled:cursor-not-allowed min-h-[52px]"
            >
              {processing ? "Procesando..." : paymentMethod === "wallet" ? `Pagar S/ ${total.toFixed(2)} con Billetera` : `Confirmar Pedido (S/ ${total.toFixed(2)})`}
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
                    <span className="font-jakarta text-sm text-primary shrink-0">S/ {(item.product.price * item.quantity).toFixed(2)}</span>
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
  );
}
