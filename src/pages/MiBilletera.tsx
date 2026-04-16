import { useState } from "react";

async function compressImage(file: File): Promise<File> {
  if (file.type === "application/pdf") return file;
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
import { useAuth } from "@/contexts/AuthContext";
import { useWallet, useSubmitPayment, useBusinessSettings } from "@/hooks/useAffiliate";
import { useMyOrders } from "@/hooks/useOrders";
import { ArrowUpRight, ArrowDownRight, Check, AlertTriangle, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";

export default function MiBilletera() {
  const { affiliate } = useAuth();
  const [activeTab,            setActiveTab]            = useState<"recargar" | "reactivar" | "retirar">("recargar");
  const [recargarReceipt,      setRecargarReceipt]      = useState<File | null>(null);
  const [recargarAmount,       setRecargarAmount]       = useState(100);
  const [withdrawAmount,       setWithdrawAmount]       = useState("");
  const [withdrawMethod,       setWithdrawMethod]       = useState("Yape");
  const [withdrawAccount,      setWithdrawAccount]      = useState("");
  const [submitting,           setSubmitting]           = useState(false);
  const [submitted,            setSubmitted]            = useState<string | null>(null);
  const [submitError,          setSubmitError]          = useState<string | null>(null);

  const { data: walletData,  isLoading: loadingWallet } = useWallet();
  const { data: settings                               } = useBusinessSettings();
  const { data: myOrders = []                          } = useMyOrders();
  const submitPayment = useSubmitPayment();

  // Progreso de reactivación — compras entregadas del mes actual
  const thisMonth = new Date().toISOString().slice(0, 7); // "2026-04"
  const monthlyOrders = myOrders.filter((o) => o.created_at?.startsWith(thisMonth));
  const reactivationFee = settings?.reactivation_fee ?? 300;
  const monthlyDelivered = monthlyOrders
    .filter((o) => o.status === "entregado")
    .reduce((s, o) => s + (o.total ?? 0), 0);
  const reactivationProgress = Math.min((monthlyDelivered / reactivationFee) * 100, 100);

  const bankDisplay = settings?.bank_account
    ? `${settings.bank_account}${settings.bank_name ? ` · ${settings.bank_name}` : ""}`
    : null;

  if (!affiliate) {
    return (
      <div className="min-h-screen bg-background pt-24 flex items-center justify-center">
        <div className="text-center">
          <p className="text-wo-crema-muted font-jakarta mb-4">Inicia sesión para ver tu billetera.</p>
          <Link to="/login-afiliado" className="bg-primary text-primary-foreground font-jakarta font-bold text-sm px-6 py-3 rounded-wo-btn">Iniciar sesión</Link>
        </div>
      </div>
    );
  }

  const balance      = walletData?.balance ?? 0;
  const transactions = walletData?.transactions ?? [];
  const totalReceived = transactions.filter((t) => t.type === "credit").reduce((s, t) => s + t.amount, 0);
  const totalSpent    = transactions.filter((t) => t.type === "debit").reduce((s, t) => s + t.amount, 0);

  const minWithdrawal = settings?.min_withdrawal ?? 20;

  const calculatedCredit =
    recargarAmount >= 500 ? recargarAmount * 1.1
    : recargarAmount >= 200 ? recargarAmount * 1.05
    : recargarAmount;

  const handleRecargar = async () => {
    if (!recargarReceipt) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await submitPayment.mutateAsync({
        type:               "recarga_billetera",
        amount:             recargarAmount,
        receiptFile:        recargarReceipt,
        walletCreditAmount: calculatedCredit,
      });
      setSubmitted("recargar");
      setRecargarReceipt(null);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Error al enviar el comprobante. Inténtalo de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };


  const handleRetiro = async () => {
    const amt = parseFloat(withdrawAmount);
    if (isNaN(amt) || amt < minWithdrawal || amt > balance || !withdrawAccount) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await submitPayment.mutateAsync({
        type:              "retiro",
        amount:            amt,
        withdrawalMethod:  withdrawMethod,
        withdrawalAccount: withdrawAccount,
      });
      setSubmitted("retiro");
      setWithdrawAmount("");
      setWithdrawAccount("");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Error al enviar la solicitud. Inténtalo de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-syne font-extrabold text-[28px] text-wo-crema mb-8">Mi Billetera</h1>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-wo-grafito rounded-wo-card p-5" style={{ border: "0.5px solid rgba(232,116,26,0.15)", background: "rgba(232,116,26,0.03)" }}>
            <p className="font-jakarta text-xs text-wo-crema-muted uppercase mb-1">Saldo actual</p>
            <p className="font-syne font-extrabold text-[36px] text-primary">
              {loadingWallet ? "..." : `S/ ${balance.toFixed(2)}`}
            </p>
          </div>
          <div className="bg-wo-grafito rounded-wo-card p-5" style={{ border: "0.5px solid rgba(255,255,255,0.07)" }}>
            <p className="font-jakarta text-xs text-wo-crema-muted uppercase mb-1">Total recibido</p>
            <p className="font-syne font-extrabold text-2xl text-secondary flex items-center gap-1">
              <ArrowUpRight size={16} /> S/ {totalReceived.toFixed(2)}
            </p>
          </div>
          <div className="bg-wo-grafito rounded-wo-card p-5" style={{ border: "0.5px solid rgba(255,255,255,0.07)" }}>
            <p className="font-jakarta text-xs text-wo-crema-muted uppercase mb-1">Total gastado</p>
            <p className="font-syne font-extrabold text-2xl text-wo-crema-muted flex items-center gap-1">
              <ArrowDownRight size={16} /> S/ {totalSpent.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {([
            { id: "recargar",  label: "Recargar billetera" },
            { id: "reactivar", label: "Reactivación" },
            { id: "retirar",   label: "Retirar saldo" },
          ] as const).map((t) => (
            <button
              key={t.id}
              onClick={() => { setActiveTab(t.id); setSubmitted(null); }}
              className={`font-jakarta font-bold text-xs px-5 py-2.5 rounded-wo-btn transition-colors ${activeTab === t.id ? "bg-primary text-primary-foreground" : "bg-wo-carbon text-wo-crema-muted"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Tab: Recargar billetera ── */}
        {activeTab === "recargar" && (
          <div className="bg-wo-grafito rounded-wo-card p-6 mb-8" style={{ border: "0.5px solid rgba(255,255,255,0.07)" }}>
            {submitted === "recargar" ? (
              <div className="flex items-center gap-2 text-secondary py-4 justify-center">
                <Check size={18} />
                <span className="font-jakarta text-sm font-semibold">Comprobante enviado — el admin acreditará tu saldo pronto.</span>
              </div>
            ) : (
              <>
                <p className="font-jakarta text-xs text-wo-crema-muted mb-1">Agrega crédito a tu billetera para comprar productos.</p>
                <p className="font-jakarta text-[11px] text-wo-crema/30 mb-5">Nota: esto no sustituye la reactivación mensual de membresía.</p>
                <h3 className="font-jakarta font-semibold text-sm text-wo-crema mb-4">Paquetes de recarga</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  {[50, 100, 200, 500].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setRecargarAmount(amount)}
                      className={`rounded-wo-btn p-4 text-center transition-colors ${recargarAmount === amount ? "bg-primary/10" : "bg-wo-carbon hover:bg-wo-grafito"}`}
                      style={{ border: recargarAmount === amount ? "0.5px solid rgba(232,116,26,0.5)" : "0.5px solid rgba(255,255,255,0.07)" }}
                    >
                      <p className="font-syne font-extrabold text-xl text-primary">S/ {amount}</p>
                      {amount >= 200 && <p className="font-jakarta text-[10px] text-secondary mt-1">+{amount >= 500 ? "10" : "5"}% bonus</p>}
                    </button>
                  ))}
                </div>
                <p className="font-jakarta text-xs text-wo-crema-muted mb-3">Realiza tu pago por Yape/Plin al:</p>
                {settings?.yape_qr_url && (
                  <div className="flex justify-center mb-4">
                    <img src={settings.yape_qr_url} alt="QR Yape" className="w-32 h-32 rounded-xl object-contain bg-white p-2" />
                  </div>
                )}
                <div className="bg-wo-carbon rounded-wo-btn p-4 text-center mb-4" style={{ border: "0.5px solid rgba(255,255,255,0.07)" }}>
                  <p className="font-syne font-bold text-lg text-primary">{settings?.yape_number ?? "—"}</p>
                  <p className="font-jakarta text-xs text-wo-crema-muted">{settings?.business_name ?? "Winclick"}</p>
                </div>
                {recargarAmount >= 200 && (
                  <div className="flex items-center justify-between px-4 py-3 rounded-wo-btn mb-4" style={{ background: "rgba(30,192,213,0.08)", border: "0.5px solid rgba(30,192,213,0.2)" }}>
                    <span className="font-jakarta text-xs text-wo-crema-muted">Recibirás en tu billetera</span>
                    <span className="font-syne font-bold text-lg text-secondary">S/ {calculatedCredit.toFixed(2)}</span>
                  </div>
                )}
                <label className="block bg-wo-carbon rounded-wo-btn p-6 text-center cursor-pointer" style={{ border: recargarReceipt ? "1px dashed hsl(var(--wo-esmeralda))" : "1px dashed rgba(255,255,255,0.15)" }}>
                  {recargarReceipt ? (
                    <>
                      <Check size={18} className="mx-auto text-secondary mb-1" />
                      <p className="font-jakarta text-sm text-secondary font-semibold">{recargarReceipt.name}</p>
                    </>
                  ) : (
                    <p className="font-jakarta text-sm text-wo-crema-muted">Sube tu comprobante</p>
                  )}
                  <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    setRecargarReceipt(await compressImage(f));
                  }} />
                </label>
                <button
                  onClick={handleRecargar}
                  disabled={!recargarReceipt || submitting}
                  className="w-full mt-4 bg-primary text-primary-foreground font-jakarta font-bold text-sm py-3.5 rounded-wo-btn hover:bg-wo-oro-dark transition-colors disabled:opacity-40"
                >
                  {submitting ? "Enviando..." : `Enviar comprobante — S/ ${recargarAmount}`}
                </button>
              </>
            )}
          </div>
        )}


        {/* ── Tab: Reactivación ── */}
        {activeTab === "reactivar" && (
          <div className="bg-wo-grafito rounded-wo-card p-6 mb-8" style={{ border: "0.5px solid rgba(255,255,255,0.07)" }}>
            <p className="font-jakarta text-[10px] font-bold tracking-[0.15em] uppercase text-primary mb-3">Reactivación mensual</p>
            <p className="font-jakarta text-sm text-wo-crema-muted mb-6">
              Tu cuenta se reactiva <span className="text-wo-crema font-semibold">automáticamente</span> cuando
              acumulás <span className="text-primary font-semibold">S/ {reactivationFee}</span> en compras entregadas del catálogo durante el mes.
              No necesitas hacer ningún pago adicional.
            </p>

            {/* Barra de progreso */}
            <div className="rounded-wo-btn p-5 mb-5" style={{ background: "rgba(232,116,26,0.05)", border: "0.5px solid rgba(232,116,26,0.2)" }}>
              <div className="flex items-center justify-between mb-3">
                <span className="font-jakarta text-xs text-wo-crema-muted capitalize">
                  {new Date().toLocaleDateString("es-PE", { month: "long", year: "numeric" })}
                </span>
                <span className="font-syne font-bold text-sm text-primary">
                  S/ {monthlyDelivered.toFixed(0)} / S/ {reactivationFee}
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-wo-carbon overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${reactivationProgress}%`,
                    background: reactivationProgress >= 100
                      ? "hsl(var(--secondary))"
                      : "hsl(var(--primary))",
                  }}
                />
              </div>
              {reactivationProgress >= 100 ? (
                <p className="font-jakarta text-xs text-secondary mt-2.5 flex items-center gap-1.5">
                  <Check size={12} /> ¡Meta alcanzada! Tu cuenta se reactivó automáticamente.
                </p>
              ) : (
                <p className="font-jakarta text-xs text-wo-crema-muted mt-2.5">
                  Faltan <span className="text-wo-crema font-semibold">S/ {(reactivationFee - monthlyDelivered).toFixed(0)}</span> en compras entregadas para reactivar.
                </p>
              )}
            </div>

            {/* Pedidos del mes */}
            {monthlyOrders.length > 0 && (
              <div className="mb-5">
                <p className="font-jakarta text-[10px] font-bold text-wo-crema-muted uppercase tracking-widest mb-3">Tus pedidos este mes</p>
                <div className="space-y-0">
                  {monthlyOrders.map((o) => (
                    <div key={o.id} className="flex items-center justify-between py-2.5" style={{ borderBottom: "0.5px solid rgba(255,255,255,0.06)" }}>
                      <div className="flex items-center gap-2">
                        <span className={`font-jakarta text-[10px] font-bold px-2 py-0.5 rounded-wo-pill ${
                          o.status === "entregado" ? "bg-secondary/10 text-secondary" :
                          o.status === "cancelado"  ? "bg-destructive/10 text-destructive" :
                          "bg-primary/10 text-primary"
                        }`}>
                          {o.status}
                        </span>
                        <span className="font-jakarta text-xs text-wo-crema-muted">#{o.order_number ?? o.id.slice(0, 8)}</span>
                      </div>
                      <span className={`font-jakarta text-sm font-bold ${o.status === "entregado" ? "text-secondary" : "text-wo-crema-muted"}`}>
                        S/ {(o.total ?? 0).toFixed(0)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CTA al catálogo */}
            <Link
              to="/catalogo"
              className="flex items-center justify-center gap-2 w-full bg-primary text-primary-foreground font-jakarta font-bold text-sm py-3.5 rounded-wo-btn hover:opacity-90 transition-opacity"
            >
              <ShoppingBag size={16} /> Comprar en el catálogo
            </Link>
            <p className="font-jakarta text-[11px] text-wo-crema/30 mt-3 text-center">
              Cuentan pedidos con estado "aprobado" o "entregado" del mes actual.
            </p>
          </div>
        )}


        {/* ── Tab: Retirar saldo ── */}
        {activeTab === "retirar" && (
          <div className="bg-wo-grafito rounded-wo-card p-6 mb-8" style={{ border: "0.5px solid rgba(255,255,255,0.07)" }}>
            {submitted === "retiro" ? (
              <div className="flex items-center gap-2 text-secondary py-4 justify-center">
                <Check size={18} />
                <span className="font-jakarta text-sm font-semibold">Solicitud enviada — el admin procesará tu retiro pronto.</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between px-4 py-2.5 rounded-wo-btn" style={{ background: "rgba(232,116,26,0.05)", border: "0.5px solid rgba(232,116,26,0.15)" }}>
                  <span className="font-jakarta text-xs text-wo-crema-muted">Saldo disponible</span>
                  <span className="font-syne font-bold text-base text-primary">S/ {balance.toFixed(2)}</span>
                </div>
                <div>
                  <label className="block font-jakarta text-xs text-wo-crema-muted font-medium mb-1.5">Monto a retirar <span className="text-wo-crema/30">(mínimo S/ {minWithdrawal})</span></label>
                  <input
                    type="number"
                    min={minWithdrawal}
                    max={balance}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder={`Mínimo S/ ${minWithdrawal}`}
                    className="w-full bg-wo-carbon font-jakarta text-sm text-wo-crema placeholder:text-wo-crema/30 px-4 py-3 rounded-wo-btn outline-none focus:ring-1 focus:ring-primary"
                    style={{ border: "0.5px solid rgba(255,255,255,0.1)" }}
                  />
                  {withdrawAmount && !isNaN(parseFloat(withdrawAmount)) && parseFloat(withdrawAmount) > balance && (
                    <p className="font-jakarta text-xs text-destructive mt-1.5">El monto supera tu saldo disponible (S/ {balance.toFixed(2)})</p>
                  )}
                  {withdrawAmount && !isNaN(parseFloat(withdrawAmount)) && parseFloat(withdrawAmount) < minWithdrawal && parseFloat(withdrawAmount) > 0 && (
                    <p className="font-jakarta text-xs text-destructive mt-1.5">El monto mínimo de retiro es S/ {minWithdrawal}</p>
                  )}
                </div>
                <div>
                  <label className="block font-jakarta text-xs text-wo-crema-muted font-medium mb-1.5">Método</label>
                  <select
                    value={withdrawMethod}
                    onChange={(e) => setWithdrawMethod(e.target.value)}
                    className="w-full bg-wo-carbon font-jakarta text-sm text-wo-crema px-4 py-3 rounded-wo-btn outline-none focus:ring-1 focus:ring-primary appearance-none"
                    style={{ border: "0.5px solid rgba(255,255,255,0.1)" }}
                  >
                    <option>Yape</option>
                    <option>Plin</option>
                    <option>Banco</option>
                  </select>
                  {withdrawMethod === "Banco" && bankDisplay && (
                    <div className="mt-2 px-3 py-2 rounded-wo-btn" style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.07)" }}>
                      <p className="font-jakarta text-[11px] text-wo-crema-muted">Cuenta bancaria de la empresa:</p>
                      <p className="font-jakarta text-sm text-wo-crema font-medium">{bankDisplay}</p>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block font-jakarta text-xs text-wo-crema-muted font-medium mb-1.5">
                    {withdrawMethod === "Banco" ? "Número de cuenta destino" : `Tu número de ${withdrawMethod}`}
                  </label>
                  <input
                    value={withdrawAccount}
                    onChange={(e) => setWithdrawAccount(e.target.value)}
                    placeholder={withdrawMethod === "Banco" ? "Número de cuenta bancaria" : "987654321"}
                    className="w-full bg-wo-carbon font-jakarta text-sm text-wo-crema placeholder:text-wo-crema/30 px-4 py-3 rounded-wo-btn outline-none focus:ring-1 focus:ring-primary"
                    style={{ border: "0.5px solid rgba(255,255,255,0.1)" }}
                  />
                </div>
                <button
                  onClick={handleRetiro}
                  disabled={!withdrawAmount || isNaN(parseFloat(withdrawAmount)) || parseFloat(withdrawAmount) < minWithdrawal || parseFloat(withdrawAmount) > balance || !withdrawAccount || submitting}
                  className="w-full bg-primary text-primary-foreground font-jakarta font-bold text-sm py-3 rounded-wo-btn hover:bg-wo-oro-dark transition-colors disabled:opacity-40"
                >
                  {submitting ? "Enviando..." : "Solicitar retiro"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Submit error (shared across tabs) */}
        {submitError && (
          <div className="flex items-start gap-2 px-4 py-3 rounded-wo-btn mb-6" style={{ background: "rgba(239,68,68,0.08)", border: "0.5px solid rgba(239,68,68,0.3)" }}>
            <AlertTriangle size={14} className="text-destructive mt-0.5 shrink-0" />
            <p className="font-jakarta text-xs text-destructive">{submitError}</p>
          </div>
        )}

        {/* Transaction history */}
        <h3 className="font-syne font-bold text-lg text-wo-crema mb-1">Historial de transacciones</h3>
        <p className="font-jakarta text-[11px] text-wo-crema/40 mb-4">Los movimientos aparecen una vez que el administrador aprueba tu comprobante.</p>
        <div className="space-y-0">
          {transactions.length === 0 ? (
            <p className="text-center font-jakarta text-sm text-wo-crema-muted py-12">No hay transacciones aún</p>
          ) : (
            transactions.map((t) => (
              <div key={t.id} className="flex items-center gap-3 py-3" style={{ borderBottom: "0.5px solid rgba(255,255,255,0.07)" }}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${t.type === "credit" ? "bg-secondary/15 text-secondary" : "bg-destructive/15 text-destructive"}`}>
                  {t.type === "credit" ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-jakarta font-medium text-sm text-wo-crema truncate">{t.description}</p>
                  <p className="font-jakarta text-xs text-wo-crema-muted">{new Date(t.created_at).toLocaleDateString("es-PE")}</p>
                </div>
                <span className={`font-jakarta font-bold text-sm ${t.type === "credit" ? "text-secondary" : "text-destructive"}`}>
                  {t.type === "credit" ? "+" : "−"}S/ {t.amount.toFixed(2)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
