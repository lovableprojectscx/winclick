import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Gift, Check, Upload, MessageCircle, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import type { PackageType } from "@/lib/database.types";
import { useToast } from "@/hooks/use-toast";
import { useSubmitPayment, useBusinessSettings } from "@/hooks/useAffiliate";

const packages = [
  { name: "Básico"     as const, investment: 100,   depthUnlocked: 3  },
  { name: "Intermedio" as const, investment: 2000,  depthUnlocked: 7  },
  { name: "VIP"        as const, investment: 10000, depthUnlocked: 10 },
];

const packageFeatures: Record<PackageType, string[]> = {
  Básico: ["Comisiones niveles 1–3", "Tienda online propia", "Dashboard completo", "Soporte por WhatsApp"],
  Intermedio: ["Comisiones niveles 1–7", "Todo lo de Básico", "Red 7 niveles de profundidad", "Mayor potencial de ingresos"],
  VIP: ["Comisiones niveles 1–10", "Todo lo de Intermedio", "Nivel 8: comisión 3% ★", "Máximo potencial de red"],
};

export default function RegistroAfiliado() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const submitPayment = useSubmitPayment();
  const { data: settings } = useBusinessSettings();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [form, setForm] = useState({ name: "", dni: "", email: "", password: "", password2: "", yape: "", referral: "" });
  const [refValid, setRefValid] = useState<boolean | null>(null);
  const [refName, setRefName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<PackageType>(() => {
    const p = searchParams.get("package");
    const found = packages.find((pkg) => pkg.name.toLowerCase() === p?.toLowerCase());
    return found?.name ?? "Intermedio";
  });
  const [receipt, setReceipt] = useState<File | null>(null);
  const pkgFromUrl = searchParams.get("package");
  const preselectedPkg = pkgFromUrl ? packages.find((pkg) => pkg.name.toLowerCase() === pkgFromUrl.toLowerCase()) : null;

  const set = (key: string, value: string) => setForm({ ...form, [key]: value });

  const validateRef = async (code: string) => {
    set("referral", code);
    if (!code) { setRefValid(null); return; }
    const { data } = await supabase
      .from("affiliates")
      .select("id, name")
      .eq("affiliate_code", code.toUpperCase())
      .single();
    setRefValid(!!data);
    setRefName(data?.name ?? "");
  };

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.password2) return;
    setStep(2);
  };

  const handleFinalSubmit = async () => {
    if (submitting) return;
    // Para Básico e Intermedio el comprobante es obligatorio; para VIP no (trato directo)
    if (selectedPackage !== "VIP" && !receipt) return;
    setSubmitting(true);

    // 1. Crear cuenta en Supabase Auth + registro en affiliates
    const { error: regError } = await register({
      name: form.name, email: form.email, password: form.password,
      dni: form.dni, yapeNumber: form.yape,
      referralCode: form.referral || undefined,
      packageType: selectedPackage,
    });

    if (regError) {
      toast({ title: "Error al crear cuenta", description: regError, variant: "destructive" });
      setSubmitting(false);
      return;
    }

    // 2. Subir comprobante de activación (solo Básico e Intermedio)
    if (selectedPackage !== "VIP" && receipt) {
      try {
        const pkg = packages.find((p) => p.name === selectedPackage)!;
        await submitPayment.mutateAsync({
          type:        "activacion",
          amount:      pkg.investment,
          receiptFile: receipt,
          packageTo:   selectedPackage,
        });
      } catch {
        // El pago puede fallar si el storage RLS aún no tiene el user_id (auth pendiente)
        toast({
          title: "Comprobante no enviado",
          description: "Tu cuenta fue creada, pero el comprobante no pudo subirse. Súbelo desde Mi Billetera → Recargar.",
          variant: "destructive",
        });
      }
      toast({ title: "¡Cuenta creada!", description: "Tu comprobante está en revisión. Te avisaremos cuando sea aprobado." });
    } else {
      // VIP: cuenta creada, pago se coordina por WhatsApp
      toast({ title: "¡Cuenta VIP creada!", description: "Un asesor te contactará por WhatsApp para coordinar el pago y activar tu cuenta." });
    }

    navigate("/area-afiliado");
    setSubmitting(false);
  };

  const selectedPkg = packages.find((p) => p.name === selectedPackage)!;

  const StepBar = () => (
    <div className="flex items-center mb-8">
      {[{ n: 1, label: "Tus datos" }, { n: 2, label: "Paquete" }, { n: 3, label: "Pago" }].map((s, i) => (
        <div key={s.n} className="flex items-center">
          <div className="flex items-center gap-1.5">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center font-jakarta font-bold text-[11px] shrink-0 ${step > s.n ? "bg-secondary text-background" : step === s.n ? "bg-primary text-primary-foreground" : "bg-wo-carbon text-wo-crema-muted"}`} style={step < s.n ? { border: "0.5px solid rgba(255,255,255,0.12)" } : {}}>
              {step > s.n ? <Check size={10} /> : s.n}
            </div>
            <span className={`font-jakarta text-[11px] ${step === s.n ? "text-wo-crema font-semibold" : step > s.n ? "text-secondary" : "text-wo-crema/30"}`}>{s.label}</span>
          </div>
          {i < 2 && <div className="w-8 h-px mx-2 bg-wo-crema/10" />}
        </div>
      ))}
    </div>
  );

  const InputField = ({ label, k, type = "text", placeholder, maxLength, prefix, icon }: { label: string; k: string; type?: string; placeholder: string; maxLength?: number; prefix?: string; icon?: React.ReactNode }) => (
    <div>
      <label className="block font-jakarta text-xs text-wo-crema-muted font-medium mb-1.5">{label}</label>
      <div className="relative">
        {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-wo-crema-muted">{icon}</span>}
        {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 font-jakarta text-sm text-wo-crema-muted">{prefix}</span>}
        <input
          type={type}
          value={form[k as keyof typeof form]}
          onChange={(e) => k === "referral" ? validateRef(e.target.value) : set(k, e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          className={`w-full bg-wo-carbon font-jakarta text-sm text-wo-crema placeholder:text-wo-crema/30 py-3 rounded-wo-btn outline-none focus:ring-1 focus:ring-primary ${icon || prefix ? "pl-9" : "px-4"} ${!icon && !prefix ? "px-4" : "pr-4"}`}
          style={{ border: k === "referral" && refValid === true ? "0.5px solid hsl(var(--wo-esmeralda))" : k === "referral" && refValid === false ? "0.5px solid hsl(var(--destructive))" : "0.5px solid rgba(255,255,255,0.1)" }}
        />
      </div>
      {k === "referral" && refValid === true && (
        <div className="mt-2 p-3 rounded-wo-btn" style={{ background: "rgba(30,192,213,0.08)", border: "0.5px solid rgba(30,192,213,0.3)" }}>
          <p className="font-jakarta text-xs text-secondary">Con este código serás referido de {refName}</p>
        </div>
      )}
      {k === "referral" && refValid === false && <p className="font-jakarta text-xs text-destructive mt-1">✗ Código no encontrado</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-background pt-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[calc(100vh-64px)]">
        {/* Left - Benefits */}
        <div className="bg-wo-grafito p-8 lg:p-12 flex flex-col justify-center">
          <Link to="/" className="font-syne font-extrabold text-lg mb-2">
            <img src="/logo-winclick.png" alt="Winclick" className="h-8 w-auto" />
          </Link>
          <p className="font-jakarta text-sm text-wo-crema-muted mb-10">Tu éxito a un solo click</p>

          <div className="space-y-6 mb-10">
            {[
              { emoji: "💰", title: "Comisiones hasta 25%", desc: "Gana por tus ventas y las de tu red completa." },
              { emoji: "👥", title: "Red en múltiples niveles", desc: "10 niveles de profundidad para maximizar ganancias." },
              { emoji: "🛡️", title: "Soporte y herramientas", desc: "Tu tienda online, dashboard y soporte dedicado." },
            ].map((b, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-10 h-10 rounded-wo-icon bg-primary/15 flex items-center justify-center text-lg shrink-0">{b.emoji}</div>
                <div>
                  <h3 className="font-jakarta font-semibold text-sm text-wo-crema">{b.title}</h3>
                  <p className="font-jakarta text-xs text-wo-crema-muted mt-0.5">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {step === 3 && (
            <div className="bg-wo-carbon rounded-wo-card p-5 mb-6" style={{ border: "0.5px solid rgba(255,255,255,0.07)" }}>
              <p className="font-jakarta text-[10px] text-wo-crema-muted uppercase font-semibold mb-2">Resumen de tu elección</p>
              <p className="font-jakarta font-bold text-sm text-wo-crema">{selectedPkg.name}</p>
              <p className="font-syne font-extrabold text-xl text-primary mt-1">S/ {selectedPkg.investment.toLocaleString()}</p>
              <p className="font-jakarta text-[11px] text-wo-crema-muted mt-0.5">+ S/ 300/mes reactivación</p>
              <p className="font-jakarta text-[11px] text-secondary mt-1">Niveles 1–{selectedPkg.depthUnlocked} desbloqueados</p>
            </div>
          )}

          <div className="bg-wo-carbon rounded-wo-card p-5" style={{ border: "0.5px solid rgba(255,255,255,0.07)" }}>
            <h4 className="font-jakarta font-semibold text-sm text-wo-crema mb-2">¿Cuánto puedo ganar?</h4>
            <p className="font-jakarta text-xs text-wo-crema-muted leading-relaxed">Con solo 5 referidos directos activos y una red de 50 personas, podrías ganar entre S/ 500 y S/ 2,000 mensuales.</p>
          </div>

          <Link to="/login-afiliado" className="font-jakarta text-sm text-primary hover:underline mt-8">
            ¿Ya tienes cuenta? → Iniciar sesión
          </Link>
        </div>

        {/* Right - Steps */}
        <div className="p-8 lg:p-12 flex items-start lg:items-center overflow-y-auto">
          <div className="w-full max-w-md mx-auto">
            <StepBar />

            {/* ── STEP 1: Datos personales ── */}
            {step === 1 && (
              <form onSubmit={handleStep1} className="space-y-4">
                <h2 className="font-syne font-extrabold text-[26px] text-wo-crema mb-4">Crea tu cuenta de socio</h2>

                {preselectedPkg && (
                  <div className="rounded-wo-btn px-4 py-3 flex items-center gap-3 mb-2" style={{ background: "rgba(232,116,26,0.07)", border: "0.5px solid rgba(232,116,26,0.25)" }}>
                    <span className="font-jakarta font-bold text-[10px] px-2 py-0.5 rounded-wo-pill" style={{ background: "rgba(232,116,26,0.15)", color: "hsl(var(--wo-oro))" }}>
                      {preselectedPkg.name}
                    </span>
                    <p className="font-jakarta text-xs text-wo-crema-muted flex-1">
                      Paquete seleccionado: <strong className="text-wo-crema">S/ {preselectedPkg.investment.toLocaleString()}</strong> + S/300/mes
                    </p>
                    <button type="button" onClick={() => { setStep(2); }} className="font-jakarta text-[11px] text-primary hover:underline shrink-0">
                      Cambiar →
                    </button>
                  </div>
                )}

                <InputField label="Nombre completo" k="name" placeholder="Tu nombre completo" />
                <InputField label="DNI" k="dni" placeholder="12345678" maxLength={8} />
                <InputField label="Email" k="email" type="email" placeholder="tu@email.com" />

                <div>
                  <label className="block font-jakarta text-xs text-wo-crema-muted font-medium mb-1.5">Contraseña</label>
                  <div className="relative">
                    <input type={showPw ? "text" : "password"} value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="Mínimo 6 caracteres" className="w-full bg-wo-carbon font-jakarta text-sm text-wo-crema placeholder:text-wo-crema/30 px-4 py-3 rounded-wo-btn outline-none focus:ring-1 focus:ring-primary" style={{ border: "0.5px solid rgba(255,255,255,0.1)" }} />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-wo-crema-muted">{showPw ? <EyeOff size={14} /> : <Eye size={14} />}</button>
                  </div>
                </div>

                <div>
                  <label className="block font-jakarta text-xs text-wo-crema-muted font-medium mb-1.5">Confirmar contraseña</label>
                  <div className="relative">
                    <input type={showPw2 ? "text" : "password"} value={form.password2} onChange={(e) => set("password2", e.target.value)} placeholder="Repite tu contraseña" className="w-full bg-wo-carbon font-jakarta text-sm text-wo-crema placeholder:text-wo-crema/30 px-4 py-3 rounded-wo-btn outline-none focus:ring-1 focus:ring-primary" style={{ border: form.password2 && form.password !== form.password2 ? "0.5px solid hsl(var(--destructive))" : "0.5px solid rgba(255,255,255,0.1)" }} />
                    <button type="button" onClick={() => setShowPw2(!showPw2)} className="absolute right-3 top-1/2 -translate-y-1/2 text-wo-crema-muted">{showPw2 ? <EyeOff size={14} /> : <Eye size={14} />}</button>
                  </div>
                  {form.password2 && form.password !== form.password2 && <p className="font-jakarta text-xs text-destructive mt-1">Las contraseñas no coinciden</p>}
                </div>

                <InputField label="Número Yape" k="yape" placeholder="987654321" prefix="+51" />
                <InputField label="Código de referido (opcional)" k="referral" placeholder="WIN-XXXXXX" icon={<Gift size={14} />} />

                <button type="submit" className="w-full bg-primary text-primary-foreground font-jakarta font-bold text-sm py-4 rounded-wo-btn hover:bg-wo-oro-dark transition-colors mt-4">
                  Continuar → Elegir paquete
                </button>

                <p className="font-jakarta text-[11px] text-wo-crema/40 text-center">
                  Al registrarte aceptas los <span className="text-primary cursor-pointer">Términos</span> y la <span className="text-primary cursor-pointer">Política de privacidad</span>
                </p>
              </form>
            )}

            {/* ── STEP 2: Selección de paquete ── */}
            {step === 2 && (
              <div>
                <h2 className="font-syne font-extrabold text-[24px] text-wo-crema mb-1">Elige tu paquete</h2>
                <p className="font-jakarta text-sm text-wo-crema-muted mb-6">Todos incluyen S/ 300/mes de reactivación para mantener comisiones activas.</p>

                <div className="space-y-3 mb-6">
                  {packages.map((pkg) => {
                    const isSelected = selectedPackage === pkg.name;
                    const isRecommended = pkg.name === "Intermedio";
                    return (
                      <button
                        key={pkg.name}
                        type="button"
                        onClick={() => setSelectedPackage(pkg.name)}
                        className="w-full text-left rounded-wo-card p-4 transition-all"
                        style={{
                          background: isSelected ? "rgba(232,116,26,0.08)" : "rgba(255,255,255,0.02)",
                          border: isSelected ? "1.5px solid hsl(var(--wo-oro))" : "0.5px solid rgba(255,255,255,0.1)",
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-jakarta font-bold text-sm text-wo-crema">{pkg.name}</span>
                              {isRecommended && (
                                <span className="font-jakarta font-bold text-[9px] px-1.5 py-0.5 rounded-wo-pill bg-secondary/15 text-secondary" style={{ border: "0.5px solid rgba(30,192,213,0.3)" }}>
                                  RECOMENDADO
                                </span>
                              )}
                            </div>
                            <div className="flex items-baseline gap-1.5 mb-2">
                              <span className="font-syne font-extrabold text-xl text-primary">S/ {pkg.investment.toLocaleString()}</span>
                              <span className="font-jakarta text-[11px] text-wo-crema-muted">entrada · + S/300/mes</span>
                            </div>
                            <p className="font-jakarta text-[11px] text-secondary mb-2">Niveles 1–{pkg.depthUnlocked} desbloqueados</p>
                            <ul className="space-y-0.5">
                              {packageFeatures[pkg.name].map((f, i) => (
                                <li key={i} className="flex items-center gap-1.5 font-jakarta text-[11px] text-wo-crema-muted">
                                  <Check size={10} className={isSelected ? "text-primary" : "text-wo-crema/30"} />
                                  {f}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className={`w-5 h-5 rounded-full shrink-0 mt-0.5 flex items-center justify-center ${isSelected ? "bg-primary" : "bg-wo-carbon"}`} style={!isSelected ? { border: "0.5px solid rgba(255,255,255,0.15)" } : {}}>
                            {isSelected && <Check size={10} className="text-primary-foreground" />}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <button onClick={() => setStep(3)} className="w-full bg-primary text-primary-foreground font-jakarta font-bold text-sm py-4 rounded-wo-btn hover:bg-wo-oro-dark transition-colors">
                  Continuar con {selectedPackage} → Pagar S/ {selectedPkg.investment.toLocaleString()}
                </button>
                <button type="button" onClick={() => setStep(1)} className="w-full font-jakarta text-xs text-wo-crema-muted hover:text-wo-crema mt-3 py-2">
                  ← Volver a mis datos
                </button>
              </div>
            )}

            {/* ── STEP 3: Instrucciones de pago ── */}
            {step === 3 && (
              <div>
                <h2 className="font-syne font-extrabold text-[24px] text-wo-crema mb-1">Realiza tu pago</h2>
                <p className="font-jakarta text-sm text-wo-crema-muted mb-6">
                  {selectedPackage === "VIP"
                    ? "Para montos de S/ 10,000 coordinamos el pago directamente contigo."
                    : "Transfiere el monto y sube tu comprobante para activar tu cuenta."}
                </p>

                {/* Monto a pagar */}
                <div className="rounded-wo-card p-4 mb-5" style={{ background: "rgba(232,116,26,0.06)", border: "0.5px solid rgba(232,116,26,0.25)" }}>
                  <p className="font-jakarta text-[11px] text-wo-crema-muted uppercase font-semibold mb-1">Monto de activación</p>
                  <p className="font-syne font-extrabold text-3xl text-primary">S/ {selectedPkg.investment.toLocaleString()}</p>
                  <p className="font-jakarta text-[11px] text-wo-crema-muted mt-0.5">Paquete {selectedPkg.name} · Activación única + S/ 300/mes</p>
                </div>

                {/* ── VIP: flujo WhatsApp ─────────────────────────────── */}
                {selectedPackage === "VIP" && (
                  <div className="space-y-4 mb-6">
                    <div className="rounded-wo-card p-4" style={{ background: "rgba(232,116,26,0.05)", border: "0.5px solid rgba(232,116,26,0.2)" }}>
                      <div className="flex items-start gap-3">
                        <AlertTriangle size={16} className="text-primary shrink-0 mt-0.5" />
                        <div>
                          <p className="font-jakarta font-semibold text-sm text-wo-crema mb-1">Pago coordinado directamente</p>
                          <p className="font-jakarta text-xs text-wo-crema-muted leading-relaxed">
                            Yape y Plin tienen límites diarios que no permiten transferencias de S/ 10,000 en una sola operación.
                            Un asesor Winclick te guiará para completar el pago por transferencia bancaria u otros medios seguros.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="font-jakarta text-xs text-wo-crema-muted font-semibold uppercase">Datos bancarios</p>
                      <div className="flex items-center gap-3 bg-wo-carbon rounded-wo-btn px-4 py-3" style={{ border: "0.5px solid rgba(255,255,255,0.07)" }}>
                        <span className="text-base">🏦</span>
                        <div>
                          <p className="font-jakarta text-[11px] text-wo-crema-muted">{settings?.bank_name ?? "Banco"}</p>
                          <p className="font-jakarta text-sm text-wo-crema font-medium">{settings?.bank_account ?? "—"}</p>
                        </div>
                      </div>
                    </div>

                    <p className="font-jakarta text-xs text-wo-crema-muted">
                      Al hacer click en el botón, un asesor te contactará por WhatsApp para confirmar tu pago y activar tu cuenta VIP en menos de 24h.
                    </p>

                    <a
                      href={`https://wa.me/${(settings?.whatsapp_number ?? "").replace(/\D/g, "")}?text=${encodeURIComponent(
                        `Hola, soy ${form.name}. Quiero activar mi cuenta Winclick Paquete VIP (S/ 10,000). Mi DNI: ${form.dni}. Por favor indíquenme cómo realizar el pago.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={handleFinalSubmit}
                      className="flex items-center justify-center gap-2 w-full bg-[#25D366] text-white font-jakarta font-bold text-sm py-4 rounded-wo-btn hover:bg-[#1ebe5d] transition-colors min-h-[52px]"
                    >
                      <MessageCircle size={18} />
                      Contactar asesor por WhatsApp →
                    </a>
                    <p className="font-jakarta text-[11px] text-wo-crema/30 text-center">
                      Tu cuenta se creará ahora y quedará en revisión hasta confirmar el pago.
                    </p>
                  </div>
                )}

                {/* ── Intermedio: advertencia + flujo normal ─────────── */}
                {selectedPackage === "Intermedio" && (
                  <div className="rounded-wo-card p-4 mb-5" style={{ background: "rgba(255,193,7,0.05)", border: "0.5px solid rgba(255,193,7,0.25)" }}>
                    <div className="flex items-start gap-3">
                      <AlertTriangle size={15} className="text-amber-400 shrink-0 mt-0.5" />
                      <p className="font-jakarta text-xs text-wo-crema-muted leading-relaxed">
                        <span className="text-wo-crema font-semibold">Atención:</span> S/ 2,000 supera el límite diario de Yape (S/ 500–1,000).
                        Te recomendamos usar <span className="text-wo-crema font-semibold">transferencia bancaria</span> o dividir el pago en múltiples operaciones Yape y subir todos los comprobantes en una sola imagen.
                      </p>
                    </div>
                  </div>
                )}

                {/* ── Básico e Intermedio: cuentas + upload ──────────── */}
                {selectedPackage !== "VIP" && (
                  <>
                    <div className="space-y-2 mb-5">
                      <p className="font-jakarta text-xs text-wo-crema-muted font-semibold uppercase">Cuentas de destino</p>
                      {[
                        { icon: "📱", label: "Yape / Plin", value: settings?.yape_number ? `${settings.yape_number}${settings.business_name ? ` — ${settings.business_name}` : ""}` : "—" },
                        { icon: "🏦", label: settings?.bank_name ?? "Banco", value: settings?.bank_account ?? "—" },
                      ].map((acc) => (
                        <div key={acc.label} className="flex items-center gap-3 bg-wo-carbon rounded-wo-btn px-4 py-3" style={{ border: "0.5px solid rgba(255,255,255,0.07)" }}>
                          <span className="text-base">{acc.icon}</span>
                          <div>
                            <p className="font-jakarta text-[11px] text-wo-crema-muted">{acc.label}</p>
                            <p className="font-jakarta text-sm text-wo-crema font-medium">{acc.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mb-6">
                      <p className="font-jakarta text-xs text-wo-crema-muted font-semibold uppercase mb-2">Sube tu comprobante</p>
                      <label className="block cursor-pointer">
                        <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => setReceipt(e.target.files?.[0] ?? null)} />
                        <div
                          className="rounded-wo-card p-5 flex flex-col items-center gap-2 transition-all"
                          style={{
                            border: receipt ? "1px dashed hsl(var(--wo-esmeralda))" : "1px dashed rgba(255,255,255,0.15)",
                            background: receipt ? "rgba(30,192,213,0.04)" : "rgba(255,255,255,0.01)",
                          }}
                        >
                          {receipt ? (
                            <>
                              <Check size={20} className="text-secondary" />
                              <p className="font-jakarta text-sm text-secondary font-semibold">{receipt.name}</p>
                              <p className="font-jakarta text-[11px] text-wo-crema-muted">Toca para cambiar</p>
                            </>
                          ) : (
                            <>
                              <Upload size={20} className="text-wo-crema-muted" />
                              <p className="font-jakarta text-sm text-wo-crema-muted">Arrastra o toca para subir</p>
                              <p className="font-jakarta text-[11px] text-wo-crema/30">JPG · PNG · PDF · Máx. 5 MB</p>
                            </>
                          )}
                        </div>
                      </label>
                    </div>

                    <button
                      onClick={handleFinalSubmit}
                      disabled={!receipt || submitting}
                      className="w-full bg-primary text-primary-foreground font-jakarta font-bold text-sm py-4 rounded-wo-btn hover:bg-wo-oro-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {submitting ? "Creando cuenta..." : "Enviar comprobante y crear cuenta →"}
                    </button>
                    <p className="font-jakarta text-[11px] text-wo-crema/30 text-center mt-2">El admin revisará tu pago y activará tu cuenta en menos de 24h.</p>
                  </>
                )}

                <button type="button" onClick={() => setStep(2)} className="w-full font-jakarta text-xs text-wo-crema-muted hover:text-wo-crema mt-3 py-2">
                  ← Cambiar paquete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
