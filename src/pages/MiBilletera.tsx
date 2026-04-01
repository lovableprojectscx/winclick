import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useWallet, useMyPayments, useSubmitPayment, useBusinessSettings } from "@/hooks/useAffiliate";
import { ArrowUpRight, ArrowDownRight, Upload, Check, AlertTriangle, Clock, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";

export default function MiBilletera() {
  const { affiliate } = useAuth();
  const [activeTab,            setActiveTab]            = useState<"recargar" | "reactivacion" | "retirar">("recargar");
  const [reactivacionReceipt,  setReactivacionReceipt]  = useState<File | null>(null);
  const [reactivacionMonth,    setReactivacionMonth]    = useState(() => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + 1);
    const s = d.toLocaleDateString("es-PE", { month: "long", year: "numeric" });
    return s.replace(/^\w/, (c) => c.toUpperCase());
  });
  const [recargarReceipt,      setRecargarReceipt]      = useState<File | null>(null);
  const [recargarAmount,       setRecargarAmount]       = useState(100);
  const [withdrawAmount,       setWithdrawAmount]       = useState("");
  const [withdrawMethod,       setWithdrawMethod]       = useState("Yape");
  const [withdrawAccount,      setWithdrawAccount]      = useState("");
  const [submitting,           setSubmitting]           = useState(false);
  const [submitted,            setSubmitted]            = useState<string | null>(null);

  const { data: walletData,  isLoading: loadingWallet } = useWallet();
  const { data: payments = []                          } = useMyPayments();
  const { data: settings                               } = useBusinessSettings();
  const submitPayment = useSubmitPayment();

  const upcomingMonths = Array.from({ length: 3 }, (_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + i + 1);
    return d.toLocaleDateString("es-PE", { month: "long", year: "numeric" })
      .replace(/^\w/, (c) => c.toUpperCase());
  });

  const yapeDisplay = settings?.yape_number
    ? `${settings.yape_number}${settings.business_name ? ` — ${settings.business_name}` : ""}`
    : "—";
  const bankDisplay = settings?.bank_account
    ? `${settings.bank_account}${settings.bank_name ? ` (${settings.bank_name})` : ""}`
    : "—";

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

  const handleReactivacion = async () => {
    if (!reactivacionReceipt) return;
    setSubmitting(true);
    try {
      await submitPayment.mutateAsync({
        type:               "reactivacion",
        amount:             300,
        receiptFile:        reactivacionReceipt,
        reactivationMonth:  reactivacionMonth,
      });
      setSubmitted("reactivacion");
      setReactivacionReceipt(null);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecargar = async () => {
    if (!recargarReceipt) return;
    setSubmitting(true);
    try {
      await submitPayment.mutateAsync({
        type:               "recarga_billetera",
        amount:             recargarAmount,
        receiptFile:        recargarReceipt,
        walletCreditAmount: recargarAmount,
      });
      setSubmitted("recargar");
      setRecargarReceipt(null);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetiro = async () => {
    const amt = parseFloat(withdrawAmount);
    if (!amt || amt < 20 || !withdrawAccount) return;
    setSubmitting(true);
    try {
      await submitPayment.mutateAsync({
        type:              "retiro",
        amount:            amt,
        receiptFile:       new File([], "retiro.txt"),   // no receipt for withdrawal
        withdrawalMethod:  withdrawMethod,
        withdrawalAccount: withdrawAccount,
      });
      setSubmitted("retiro");
      setWithdrawAmount("");
      setWithdrawAccount("");
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
          <div className="bg-wo-grafito rounded-wo-card p-5" style={{ border: "0.5px solid rgba(242,201,76,0.15)", background: "rgba(242,201,76,0.03)" }}>
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
            { id: "recargar",     label: "Recargar billetera" },
            { id: "reactivacion", label: "Reactivación mensual" },
            { id: "retirar",      label: "Retirar saldo" },
          ] as const).map((t) => (
            <button
              key={t.id}
              onClick={() => { setActiveTab(t.id); setSubmitted(null); }}
              className={`font-jakarta font-bold text-xs px-5 py-2.5 rounded-wo-btn transition-colors ${activeTab === t.id ? "bg-primary text-primary-foreground" : "bg-wo-carbon text-wo-crema-muted"}`}
              style={t.id === "reactivacion" && affiliate.account_status === "suspended" ? { background: activeTab === "reactivacion" ? undefined : "rgba(239,68,68,0.1)", color: activeTab === "reactivacion" ? undefined : "rgb(239,68,68)", border: "0.5px solid rgba(239,68,68,0.3)" } : {}}
            >
              {t.id === "reactivacion" && affiliate.account_status === "suspended" && activeTab !== "reactivacion" && "⚠ "}
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
                      style={{ border: recargarAmount === amount ? "0.5px solid rgba(242,201,76,0.5)" : "0.5px solid rgba(255,255,255,0.07)" }}
                    >
                      <p className="font-syne font-extrabold text-xl text-primary">S/ {amount}</p>
                      {amount >= 200 && <p className="font-jakarta text-[10px] text-secondary mt-1">+{amount >= 500 ? "10" : "5"}% bonus</p>}
                    </button>
                  ))}
                </div>
                <p className="font-jakarta text-xs text-wo-crema-muted mb-3">Realiza tu pago por Yape/Plin al:</p>
                <div className="bg-wo-carbon rounded-wo-btn p-4 text-center mb-4" style={{ border: "0.5px solid rgba(255,255,255,0.07)" }}>
                  <p className="font-syne font-bold text-lg text-primary">{settings?.yape_number ?? "—"}</p>
                  <p className="font-jakarta text-xs text-wo-crema-muted">{settings?.business_name ?? "Winner Organa"}</p>
                </div>
                <label className="block bg-wo-carbon rounded-wo-btn p-6 text-center cursor-pointer" style={{ border: recargarReceipt ? "1px dashed hsl(var(--wo-esmeralda))" : "1px dashed rgba(255,255,255,0.15)" }}>
                  {recargarReceipt ? (
                    <>
                      <Check size={18} className="mx-auto text-secondary mb-1" />
                      <p className="font-jakarta text-sm text-secondary font-semibold">{recargarReceipt.name}</p>
                    </>
                  ) : (
                    <p className="font-jakarta text-sm text-wo-crema-muted">Sube tu comprobante</p>
                  )}
                  <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => setRecargarReceipt(e.target.files?.[0] ?? null)} />
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

        {/* ── Tab: Reactivación mensual ── */}
        {activeTab === "reactivacion" && (
          <div className="space-y-4 mb-8">
            <div className="rounded-wo-card p-5" style={{
              background: affiliate.account_status === "active" ? "rgba(46,204,113,0.05)" : affiliate.account_status === "suspended" ? "rgba(239,68,68,0.06)" : "rgba(242,201,76,0.06)",
              border: affiliate.account_status === "active" ? "0.5px solid rgba(46,204,113,0.25)" : affiliate.account_status === "suspended" ? "0.5px solid rgba(239,68,68,0.3)" : "0.5px solid rgba(242,201,76,0.25)",
            }}>
              <div className="flex items-center gap-3">
                {affiliate.account_status === "active"
                  ? <Check size={18} className="text-secondary shrink-0" />
                  : affiliate.account_status === "suspended"
                    ? <AlertTriangle size={18} className="text-destructive shrink-0" />
                    : <Clock size={18} className="text-primary shrink-0" />}
                <div>
                  <p className={`font-jakarta font-bold text-sm ${affiliate.account_status === "active" ? "text-secondary" : affiliate.account_status === "suspended" ? "text-destructive" : "text-primary"}`}>
                    {affiliate.account_status === "active" ? "Membresía activa" : affiliate.account_status === "suspended" ? "Membresía suspendida" : "Activación pendiente"}
                  </p>
                  <p className="font-jakarta text-xs text-wo-crema-muted mt-0.5">
                    {affiliate.account_status === "active"
                      ? affiliate.next_reactivation_due
                          ? `Próximo vencimiento: ${new Date(affiliate.next_reactivation_due).toLocaleDateString("es-PE")}`
                          : "Membresía vigente"
                      : affiliate.account_status === "suspended"
                        ? `Suspendida${affiliate.suspended_at ? " desde " + new Date(affiliate.suspended_at).toLocaleDateString("es-PE") : ""} — No estás generando comisiones`
                        : "Tu paquete inicial está en revisión"}
                  </p>
                </div>
              </div>
            </div>

            {submitted === "reactivacion" ? (
              <div className="bg-wo-grafito rounded-wo-card p-6 flex items-center gap-3 justify-center" style={{ border: "0.5px solid rgba(46,204,113,0.3)" }}>
                <Check size={18} className="text-secondary" />
                <span className="font-jakarta text-sm text-secondary font-semibold">Comprobante enviado — el admin revisará y activará tu cuenta en menos de 24h.</span>
              </div>
            ) : (
              <div className="bg-wo-grafito rounded-wo-card p-6" style={{ border: "0.5px solid rgba(255,255,255,0.07)" }}>
                <div className="flex items-center gap-2 mb-5">
                  <RefreshCw size={16} className="text-primary" />
                  <h3 className="font-jakarta font-semibold text-sm text-wo-crema">Pagar reactivación mensual</h3>
                </div>

                <div className="rounded-wo-card p-4 mb-5 flex items-center justify-between" style={{ background: "rgba(242,201,76,0.06)", border: "0.5px solid rgba(242,201,76,0.2)" }}>
                  <div>
                    <p className="font-jakarta text-[11px] text-wo-crema-muted uppercase font-semibold">Monto de reactivación</p>
                    <p className="font-syne font-extrabold text-3xl text-primary mt-0.5">S/ 300</p>
                    <p className="font-jakarta text-[11px] text-wo-crema-muted">Monto fijo mensual — todos los paquetes</p>
                  </div>
                  <span className="font-jakarta font-bold text-[10px] px-2 py-1 rounded-wo-pill" style={{ background: "rgba(242,201,76,0.12)", color: "hsl(var(--wo-oro))", border: "0.5px solid rgba(242,201,76,0.3)" }}>
                    {affiliate.package}
                  </span>
                </div>

                <div className="mb-5">
                  <label className="block font-jakarta text-xs text-wo-crema-muted font-medium mb-1.5">Mes que cubre esta reactivación</label>
                  <select
                    value={reactivacionMonth}
                    onChange={(e) => setReactivacionMonth(e.target.value)}
                    className="w-full bg-wo-carbon font-jakarta text-sm text-wo-crema px-4 py-3 rounded-wo-btn outline-none focus:ring-1 focus:ring-primary appearance-none"
                    style={{ border: "0.5px solid rgba(255,255,255,0.1)" }}
                  >
                    {upcomingMonths.map((m) => <option key={m}>{m}</option>)}
                  </select>
                </div>

                <div className="mb-5">
                  <p className="font-jakarta text-xs text-wo-crema-muted font-semibold uppercase mb-2">Transferir S/ 300 a</p>
                  {[
                    { icon: "📱", label: "Yape / Plin", value: yapeDisplay },
                    { icon: "🏦", label: settings?.bank_name ?? "Banco", value: bankDisplay },
                  ].map((acc) => (
                    <div key={acc.label} className="flex items-center gap-3 bg-wo-carbon rounded-wo-btn px-4 py-3 mb-2" style={{ border: "0.5px solid rgba(255,255,255,0.07)" }}>
                      <span>{acc.icon}</span>
                      <div>
                        <p className="font-jakarta text-[11px] text-wo-crema-muted">{acc.label}</p>
                        <p className="font-jakarta text-sm text-wo-crema font-medium">{acc.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mb-5">
                  <p className="font-jakarta text-xs text-wo-crema-muted font-semibold uppercase mb-2">Comprobante de pago</p>
                  <label className="block cursor-pointer">
                    <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => setReactivacionReceipt(e.target.files?.[0] ?? null)} />
                    <div
                      className="rounded-wo-card p-5 flex flex-col items-center gap-2 transition-all"
                      style={{
                        border: reactivacionReceipt ? "1px dashed hsl(var(--wo-esmeralda))" : "1px dashed rgba(255,255,255,0.15)",
                        background: reactivacionReceipt ? "rgba(46,204,113,0.04)" : "rgba(255,255,255,0.01)",
                      }}
                    >
                      {reactivacionReceipt ? (
                        <>
                          <Check size={18} className="text-secondary" />
                          <p className="font-jakarta text-sm text-secondary font-semibold">{reactivacionReceipt.name}</p>
                          <p className="font-jakarta text-[11px] text-wo-crema-muted">Toca para cambiar</p>
                        </>
                      ) : (
                        <>
                          <Upload size={18} className="text-wo-crema-muted" />
                          <p className="font-jakarta text-sm text-wo-crema-muted">Subir comprobante</p>
                          <p className="font-jakarta text-[11px] text-wo-crema/30">JPG · PNG · PDF</p>
                        </>
                      )}
                    </div>
                  </label>
                </div>

                <button
                  disabled={!reactivacionReceipt || submitting}
                  onClick={handleReactivacion}
                  className="w-full bg-primary text-primary-foreground font-jakarta font-bold text-sm py-4 rounded-wo-btn hover:bg-wo-oro-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {submitting ? "Enviando..." : `Enviar comprobante — ${reactivacionMonth}`}
                </button>
                <p className="font-jakarta text-[11px] text-wo-crema/30 text-center mt-2">El admin revisará tu pago y reactivará tu cuenta en menos de 24h.</p>
              </div>
            )}
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
                <div>
                  <label className="block font-jakarta text-xs text-wo-crema-muted font-medium mb-1.5">Monto a retirar</label>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="Mínimo S/ 20"
                    className="w-full bg-wo-carbon font-jakarta text-sm text-wo-crema placeholder:text-wo-crema/30 px-4 py-3 rounded-wo-btn outline-none focus:ring-1 focus:ring-primary"
                    style={{ border: "0.5px solid rgba(255,255,255,0.1)" }}
                  />
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
                </div>
                <div>
                  <label className="block font-jakarta text-xs text-wo-crema-muted font-medium mb-1.5">Número de cuenta / Yape</label>
                  <input
                    value={withdrawAccount}
                    onChange={(e) => setWithdrawAccount(e.target.value)}
                    placeholder="987654321"
                    className="w-full bg-wo-carbon font-jakarta text-sm text-wo-crema placeholder:text-wo-crema/30 px-4 py-3 rounded-wo-btn outline-none focus:ring-1 focus:ring-primary"
                    style={{ border: "0.5px solid rgba(255,255,255,0.1)" }}
                  />
                </div>
                <button
                  onClick={handleRetiro}
                  disabled={!withdrawAmount || parseFloat(withdrawAmount) < 20 || !withdrawAccount || submitting}
                  className="w-full bg-primary text-primary-foreground font-jakarta font-bold text-sm py-3 rounded-wo-btn hover:bg-wo-oro-dark transition-colors disabled:opacity-40"
                >
                  {submitting ? "Enviando..." : "Solicitar retiro"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Transaction history */}
        <h3 className="font-syne font-bold text-lg text-wo-crema mb-4">Historial de transacciones</h3>
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
