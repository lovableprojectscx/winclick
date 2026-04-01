import { useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Upload, X, Check, Gift } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useWallet } from "@/hooks/useAffiliate";
import { usePlaceOrder } from "@/hooks/useOrders";
import { supabase } from "@/lib/supabase";

export default function Checkout() {
  const { items, total, clearCart, affiliateCode, setAffiliateCode } = useCart();
  const { affiliate, session }   = useAuth();
  const { data: walletData }     = useWallet();
  const placeOrder               = usePlaceOrder();

  const [paymentMethod,   setPaymentMethod]   = useState<"wallet" | "cash">("cash");
  const [receipt,         setReceipt]         = useState<File | null>(null);
  const [receiptUrl,      setReceiptUrl]      = useState<string | null>(null);
  const [refCode,         setRefCode]         = useState(affiliateCode || "");
  const [refValid,        setRefValid]        = useState<boolean | null>(affiliateCode ? true : null);
  const [refName,         setRefName]         = useState("");
  const [processing,      setProcessing]      = useState(false);
  const [checkoutError,   setCheckoutError]   = useState<string | null>(null);
  const [success,         setSuccess]         = useState(false);
  const [orderNumber,     setOrderNumber]     = useState("");
  const [confirmedItems,  setConfirmedItems]  = useState<typeof items>([]);
  const [confirmedTotal,  setConfirmedTotal]  = useState(0);
  const [confirmedPayment,setConfirmedPayment]= useState<"wallet" | "cash">("cash");
  const [formData,        setFormData]        = useState({ dni: "", phone: "", address: "", city: "" });

  const walletBalance = walletData?.balance ?? 0;

  const validateRef = async (code: string) => {
    setRefCode(code);
    if (!code) { setRefValid(null); return; }
    const { data } = await supabase
      .from("affiliates")
      .select("id, name, affiliate_code")
      .eq("affiliate_code", code.toUpperCase())
      .single();
    setRefValid(!!data);
    setRefName(data?.name ?? "");
    if (data) setAffiliateCode(data.affiliate_code);
  };

  const handleSubmit = async () => {
    if (!affiliate && !session) return;
    setProcessing(true);
    setCheckoutError(null);
    try {
      // Upload receipt to storage if cash payment
      let receiptStorageUrl: string | undefined;
      if (paymentMethod === "cash" && receipt && session) {
        const ext  = receipt.name.split(".").pop();
        const path = `${session.user.id}/checkout-${Date.now()}.${ext}`;
        await supabase.storage.from("receipts").upload(path, receipt);
        const { data: { publicUrl } } = supabase.storage.from("receipts").getPublicUrl(path);
        receiptStorageUrl = publicUrl;
      }

      const order = await placeOrder.mutateAsync({
        customerName:    affiliate?.name ?? formData.dni,
        customerEmail:   affiliate?.email ?? session?.user?.email ?? "",
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
      });

      setConfirmedItems([...items]);
      setConfirmedTotal(total);
      setConfirmedPayment(paymentMethod);
      setOrderNumber(order.order_number);
      clearCart();
      setSuccess(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      setCheckoutError(`No se pudo crear el pedido. ${msg}. Por favor intenta nuevamente.`);
    } finally {
      setProcessing(false);
    }
  };

  if (items.length === 0 && !success) {
    return (
      <div className="min-h-screen bg-background pt-24 flex flex-col items-center justify-center gap-4">
        <ShoppingCart size={48} className="text-wo-crema-muted opacity-30" />
        <h2 className="font-syne font-bold text-[22px] text-wo-crema">Tu carrito está vacío</h2>
        <Link to="/catalogo" className="bg-primary text-primary-foreground font-jakarta font-bold text-sm px-6 py-3 rounded-wo-btn">
          Ir al catálogo
        </Link>
      </div>
    );
  }

  if (!affiliate && !session) {
    return (
      <div className="min-h-screen bg-background pt-24 flex items-center justify-center">
        <div className="bg-wo-grafito rounded-wo-card p-8 max-w-sm text-center" style={{ border: "0.5px solid rgba(255,255,255,0.07)" }}>
          <h2 className="font-syne font-bold text-lg text-wo-crema mb-4">Inicia sesión para continuar</h2>
          <Link to="/login-afiliado" className="block bg-primary text-primary-foreground font-jakarta font-bold text-sm py-3 rounded-wo-btn mb-3">
            Iniciar sesión
          </Link>
          <Link to="/registro-afiliado" className="font-jakarta text-sm text-primary hover:underline">Registrarse</Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-16">
        <div className="max-w-lg mx-auto px-4">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-secondary/15 flex items-center justify-center mx-auto mb-4" style={{ border: "1px solid rgba(46,204,113,0.3)" }}>
              <Check size={28} className="text-secondary" />
            </div>
            <h2 className="font-syne font-extrabold text-[26px] text-wo-crema">¡Pedido confirmado!</h2>
            <p className="font-jakarta text-sm text-wo-crema-muted mt-1">Nos pondremos en contacto contigo cuando sea enviado.</p>
          </div>

          <div className="rounded-wo-card p-4 text-center mb-6" style={{ background: "rgba(242,201,76,0.06)", border: "0.5px solid rgba(242,201,76,0.25)" }}>
            <p className="font-jakarta text-[11px] text-wo-crema-muted uppercase font-semibold mb-1">Número de pedido</p>
            <p className="font-syne font-extrabold text-3xl text-primary">{orderNumber}</p>
            <p className="font-jakarta text-[11px] text-wo-crema-muted mt-1">Guarda este número para seguimiento</p>
          </div>

          <div className="bg-wo-grafito rounded-wo-card p-5 mb-4" style={{ border: "0.5px solid rgba(255,255,255,0.07)" }}>
            <p className="font-jakarta text-[11px] text-wo-crema-muted uppercase font-semibold mb-3">Productos</p>
            <div className="space-y-2 mb-3">
              {confirmedItems.map((item) => (
                <div key={item.product.id} className="flex justify-between items-center">
                  <span className="font-jakarta text-xs text-wo-crema">{item.product.name} × {item.quantity}</span>
                  <span className="font-jakarta text-xs text-primary font-semibold">S/ {(item.product.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center pt-3" style={{ borderTop: "0.5px solid rgba(255,255,255,0.07)" }}>
              <span className="font-jakarta text-sm text-wo-crema font-semibold">Total</span>
              <span className="font-syne font-extrabold text-xl text-primary">S/ {confirmedTotal.toFixed(2)}</span>
            </div>
          </div>

          <div className="bg-wo-grafito rounded-wo-card p-5 mb-6" style={{ border: "0.5px solid rgba(255,255,255,0.07)" }}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-jakarta text-[11px] text-wo-crema-muted uppercase font-semibold mb-1.5">Método de pago</p>
                <p className="font-jakarta text-sm text-wo-crema">
                  {confirmedPayment === "wallet" ? "💳 Billetera Winner" : "💵 Dinero Real"}
                </p>
              </div>
              {formData.address && (
                <div>
                  <p className="font-jakarta text-[11px] text-wo-crema-muted uppercase font-semibold mb-1.5">Dirección de envío</p>
                  <p className="font-jakarta text-sm text-wo-crema">{formData.address}</p>
                  {formData.city && <p className="font-jakarta text-xs text-wo-crema-muted">{formData.city}</p>}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <p className="font-jakarta text-[11px] text-wo-crema/40 text-center">
              📦 Te contactaremos cuando tu pedido sea enviado
            </p>
            <Link to="/catalogo" className="block text-center bg-primary text-primary-foreground font-jakarta font-bold text-sm py-3 rounded-wo-btn hover:bg-wo-oro-dark transition-colors">
              Seguir comprando
            </Link>
            <Link to="/area-afiliado" className="block text-center font-jakarta text-sm text-wo-crema-muted hover:text-wo-crema py-2">
              Ir a mi dashboard →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-syne font-extrabold text-[28px] text-wo-crema mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Form */}
          <div className="lg:col-span-3 space-y-6">
            {/* Payment method */}
            <div>
              <h3 className="font-jakarta font-semibold text-sm text-wo-crema mb-3">Método de pago</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { value: "wallet" as const, icon: "💳", label: "Billetera Winner", sub: `Saldo: S/ ${walletBalance.toFixed(2)}` },
                  { value: "cash"   as const, icon: "💵", label: "Dinero Real",       sub: "Yape / Plin / Banco" },
                ].map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setPaymentMethod(m.value)}
                    className={`text-left p-4 rounded-wo-btn transition-all ${paymentMethod === m.value ? "bg-primary/5" : "bg-wo-carbon"}`}
                    style={{ border: paymentMethod === m.value ? "0.5px solid rgba(242,201,76,0.5)" : "0.5px solid rgba(255,255,255,0.07)" }}
                  >
                    <span className="text-lg">{m.icon}</span>
                    <p className="font-jakarta font-semibold text-sm text-wo-crema mt-1">{m.label}</p>
                    <p className="font-jakarta text-xs text-wo-crema-muted">{m.sub}</p>
                  </button>
                ))}
              </div>
            </div>

            {paymentMethod === "wallet" ? (
              <div className="rounded-wo-btn p-3.5" style={{ background: "rgba(46,204,113,0.08)", border: "0.5px solid rgba(46,204,113,0.3)" }}>
                <p className="font-jakarta text-sm text-secondary flex items-center gap-2">
                  <Check size={14} /> Se descontarán S/ {total.toFixed(2)} de tu billetera
                </p>
              </div>
            ) : (
              <div>
                <h3 className="font-jakarta font-semibold text-sm text-wo-crema mb-3">Comprobante de pago</h3>
                {!receipt ? (
                  <label className="block bg-wo-carbon rounded-wo-btn p-8 text-center cursor-pointer hover:bg-wo-grafito transition-colors" style={{ border: "1px dashed rgba(255,255,255,0.15)" }}>
                    <Upload size={24} className="mx-auto text-wo-crema-muted mb-2" />
                    <p className="font-jakarta text-sm text-wo-crema-muted">Sube tu comprobante de pago</p>
                    <p className="font-jakarta text-[11px] text-wo-crema/30 mt-1">JPG, PNG o PDF</p>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*,.pdf"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) { setReceipt(f); setReceiptUrl(URL.createObjectURL(f)); }
                      }}
                    />
                  </label>
                ) : (
                  <div className="flex items-center gap-3 bg-wo-carbon rounded-lg p-3" style={{ border: "0.5px solid rgba(255,255,255,0.07)" }}>
                    {receiptUrl && <img src={receiptUrl} alt="Comprobante" className="w-20 h-20 rounded-lg object-cover" />}
                    <div className="flex-1">
                      <p className="font-jakarta text-sm text-wo-crema">{receipt.name}</p>
                    </div>
                    <button onClick={() => { setReceipt(null); setReceiptUrl(null); }} className="text-destructive"><X size={14} /></button>
                  </div>
                )}
              </div>
            )}

            {/* Shipping */}
            <div className="space-y-4">
              <h3 className="font-jakarta font-semibold text-sm text-wo-crema">Datos de envío</h3>
              <div className="bg-wo-carbon rounded-wo-btn py-3 px-4 opacity-60" style={{ border: "0.5px solid rgba(255,255,255,0.07)" }}>
                <p className="font-jakarta text-sm text-wo-crema">{affiliate?.email ?? session?.user?.email}</p>
              </div>
              {[
                { key: "dni",     label: "DNI",              placeholder: "12345678",      maxLength: 8 },
                { key: "phone",   label: "Teléfono",          placeholder: "+51 987654321" },
                { key: "address", label: "Dirección",         placeholder: "Av. Lima 123" },
                { key: "city",    label: "Ciudad / Distrito", placeholder: "Miraflores, Lima" },
              ].map((f) => (
                <div key={f.key}>
                  <label className="block font-jakarta text-xs text-wo-crema-muted font-medium mb-1.5">{f.label}</label>
                  <input
                    value={formData[f.key as keyof typeof formData]}
                    onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                    maxLength={f.maxLength}
                    className="w-full bg-wo-carbon font-jakarta text-sm text-wo-crema placeholder:text-wo-crema/30 px-4 py-3 rounded-wo-btn outline-none focus:ring-1 focus:ring-primary"
                    style={{ border: "0.5px solid rgba(255,255,255,0.1)" }}
                  />
                </div>
              ))}

              {/* Affiliate code */}
              <div>
                <label className="block font-jakarta text-xs text-wo-crema-muted font-medium mb-1.5">Código de afiliado (opcional)</label>
                <div className="relative">
                  <Gift size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-wo-crema-muted" />
                  <input
                    value={refCode}
                    onChange={(e) => validateRef(e.target.value)}
                    placeholder="WIN-XXXXXX"
                    className="w-full bg-wo-carbon font-jakarta text-sm text-wo-crema placeholder:text-wo-crema/30 pl-9 pr-4 py-3 rounded-wo-btn outline-none"
                    style={{ border: refValid === true ? "0.5px solid hsl(var(--wo-esmeralda))" : refValid === false ? "0.5px solid hsl(var(--destructive))" : "0.5px solid rgba(255,255,255,0.1)" }}
                  />
                </div>
                {refValid === true  && <p className="font-jakarta text-xs text-secondary mt-1">✓ Código válido — Referido por: {refName}</p>}
                {refValid === false && <p className="font-jakarta text-xs text-destructive mt-1">✗ Código no encontrado</p>}
              </div>
            </div>

            {/* Error message */}
            {checkoutError && (
              <div className="rounded-wo-btn p-3.5" style={{ background: "rgba(231,76,60,0.08)", border: "0.5px solid rgba(231,76,60,0.3)" }}>
                <p className="font-jakarta text-sm text-destructive">{checkoutError}</p>
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={processing || (paymentMethod === "cash" && !receipt)}
              className="w-full bg-primary text-primary-foreground font-jakarta font-bold text-sm py-4 rounded-wo-btn hover:bg-wo-oro-dark transition-colors disabled:opacity-35 disabled:cursor-not-allowed"
            >
              {processing ? "Procesando..." : paymentMethod === "wallet" ? `Pagar S/ ${total.toFixed(2)} con Billetera` : `Confirmar Pedido (S/ ${total.toFixed(2)})`}
            </button>
          </div>

          {/* Summary */}
          <div className="lg:col-span-2">
            <div className="bg-wo-grafito rounded-wo-card p-5 lg:sticky lg:top-24" style={{ border: "0.5px solid rgba(255,255,255,0.07)" }}>
              <h3 className="font-jakarta font-semibold text-sm text-wo-crema-muted uppercase tracking-[0.1em] mb-4">Resumen del pedido</h3>
              <div className="space-y-3 mb-4">
                {items.map((item) => (
                  <div key={item.product.id} className="flex justify-between">
                    <span className="font-jakarta text-sm text-wo-crema-muted">{item.product.name} × {item.quantity}</span>
                    <span className="font-jakarta text-sm text-primary">S/ {(item.product.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="pt-4 flex justify-between" style={{ borderTop: "0.5px solid rgba(255,255,255,0.07)" }}>
                <span className="font-jakarta text-sm text-wo-crema">Total</span>
                <span className="font-syne font-extrabold text-[22px] text-primary">S/ {total.toFixed(2)}</span>
              </div>
              {paymentMethod === "wallet" && (
                <div className="mt-3">
                  <span className={`text-xs font-jakarta font-bold px-2 py-0.5 rounded-wo-pill ${walletBalance >= total ? "bg-secondary/12 text-secondary" : "bg-destructive/12 text-destructive"}`} style={{ border: walletBalance >= total ? "0.5px solid rgba(46,204,113,0.25)" : "0.5px solid rgba(231,76,60,0.25)" }}>
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
