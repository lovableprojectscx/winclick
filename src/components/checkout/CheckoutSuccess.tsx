import { Check, MessageCircle } from "lucide-react";

export function CheckoutSuccess({
  orderNumber,
  confirmedItems,
  confirmedTotal,
  confirmedPayment,
  formData,
  confirmedHighValue,
  settings,
}: {
  orderNumber: string;
  confirmedItems: any[];
  confirmedTotal: number;
  confirmedPayment: "wallet" | "cash";
  formData: { address: string; city: string };
  confirmedHighValue: boolean;
  settings: any;
}) {
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
                <span className="font-jakarta text-xs text-primary font-semibold shrink-0">S/ {(item.unitPrice * item.quantity).toFixed(2)}</span>
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

        {/* Pago de alto valor (>S/700) — proceso con asesor por WhatsApp */}
        {confirmedHighValue && (
          <div className="rounded-wo-card p-5 mb-4"
            style={{ background: "rgba(37,211,102,0.06)", border: "0.5px solid rgba(37,211,102,0.30)" }}>
            <div className="flex items-start gap-3">
              <span className="text-2xl shrink-0">📲</span>
              <div className="flex-1">
                <p className="font-jakarta font-bold text-[14px] text-wo-crema mb-1">
                  ¡Pedido registrado exitosamente!
                </p>
                <p className="font-jakarta text-[12px] text-wo-crema-muted leading-snug mb-3">
                  Tu compra supera los S/ 700. Para mayor seguridad, comunícate con un asesor 
                  por WhatsApp indicando tu número de pedido para procesar tu pago y confirmar el envío de forma personalizada.
                </p>
                <a
                  href={`https://wa.me/${(settings?.whatsapp_number ?? "").replace(/\D/g, "")}?text=${encodeURIComponent(
                    `Hola asesor, acabo de registrar mi pedido *${orderNumber}* por S/ ${confirmedTotal.toFixed(2)}. Quisiera coordinar el pago y envío.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#25D366] text-white font-jakarta font-bold text-sm px-5 py-3 rounded-wo-btn hover:bg-[#1ebe5d] transition-colors"
                >
                  <MessageCircle size={16} />
                  Contactar asesor por WhatsApp
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
