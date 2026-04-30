import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Gift, Check, ShoppingBag, Phone, Flame } from "lucide-react";
import { useBusinessSettings } from "@/hooks/useAffiliate";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/lib/supabase";
import type { PackageType } from "@/lib/database.types";
import { useToast } from "@/hooks/use-toast";

const packages = [
  { name: "Básico"      as const, investment: 120,   depthUnlocked: 3,  discount: 40, activationDiscount: 0 },
  { name: "Ejecutivo"   as const, investment: 600,   depthUnlocked: 5,  discount: 45, activationDiscount: 45 },
  { name: "Intermedio"  as const, investment: 2000,  depthUnlocked: 7,  discount: 50, activationDiscount: 50 },
  { name: "VIP"         as const, investment: 10000, depthUnlocked: 10, discount: 55, activationDiscount: 55 },
];

const packageFeatures: Record<PackageType, string[]> = {
  Básico:      ["Comisiones niveles 1–3", "Tienda online propia", "Dashboard completo"],
  Ejecutivo:   ["Comisiones niveles 1–5", "50% OFF en recompra", "Mayor expansión de red"],
  Intermedio:  ["Comisiones niveles 1–7", "Red 7 niveles de profundidad", "Mayor potencial de ingresos"],
  VIP:         ["Comisiones niveles 1–10", "Nivel 8: comisión 3% ★", "Máximo potencial de red"],
};

// ── Componentes auxiliares fuera del componente principal ─────────────────────
const StepBar = ({ step }: { step: number }) => (
  <div className="flex items-center mb-8">
    {[{ n: 1, label: "Tus datos" }, { n: 2, label: "Confirmación" }].map((s, i, arr) => (
      <div key={s.n} className="flex items-center">
        <div className="flex items-center gap-1.5">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center font-jakarta font-bold text-[11px] shrink-0 ${step > s.n ? "bg-secondary text-background" : step === s.n ? "bg-primary text-primary-foreground" : "bg-wo-carbon text-wo-crema-muted"}`} style={step < s.n ? { border: "0.5px solid rgba(255,255,255,0.12)" } : {}}>
            {step > s.n ? <Check size={10} /> : s.n}
          </div>
          <span className={`font-jakarta text-[11px] ${step === s.n ? "text-wo-crema font-semibold" : step > s.n ? "text-secondary" : "text-wo-crema/30"}`}>{s.label}</span>
        </div>
        {i < arr.length - 1 && <div className="w-8 h-px mx-2 bg-wo-crema/10" />}
      </div>
    ))}
  </div>
);

interface InputFieldProps {
  label: string;
  k: string;
  type?: string;
  placeholder: string;
  maxLength?: number;
  prefix?: string;
  icon?: React.ReactNode;
  value: string;
  onChange: (k: string, value: string) => void;
  refValid?: boolean | null;
  refName?: string;
  sensitive?: boolean;
}

const InputField = ({ label, k, type = "text", placeholder, maxLength, prefix, icon, value, onChange, refValid, refName, sensitive }: InputFieldProps) => (
  <div>
    <label className="block font-jakarta text-xs text-wo-crema-muted font-medium mb-1.5">{label}</label>
    <div className="relative">
      {icon   && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-wo-crema-muted">{icon}</span>}
      {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 font-jakarta text-sm text-wo-crema-muted">{prefix}</span>}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(k, e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        {...(sensitive ? { "data-idenza-ignore": true } : {})}
        className={`w-full bg-wo-carbon font-jakarta text-sm text-wo-crema placeholder:text-wo-crema/30 py-3 rounded-wo-btn outline-none focus:ring-1 focus:ring-primary ${icon || prefix ? "pl-9 pr-4" : "px-4"}`}
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

// ─────────────────────────────────────────────────────────────────────────────

export default function RegistroAfiliado() {
  const { register }                      = useAuth();
  const navigate                          = useNavigate();
  const { toast }                         = useToast();
  const { items }                         = useCart();
  const { data: bizSettings }             = useBusinessSettings();
  const [searchParams]                    = useSearchParams();
  const [step, setStep]                   = useState<1 | 2 | 3>(1);
  const [showPw, setShowPw]               = useState(false);
  const [showPw2, setShowPw2]             = useState(false);
  const [form, setForm]                   = useState({ name: "", dni: "", email: "", password: "", password2: "", yape: "", referral: "" });
  const [refValid, setRefValid]           = useState<boolean | null>(null);
  const [refName, setRefName]             = useState("");
  const [submitting, setSubmitting]       = useState(false);
  const [step1Complete, setStep1Complete] = useState(false);
  const [showInlinePicker, setShowInlinePicker] = useState(false);
  const [selectedPackage, setSelectedPackage]   = useState<PackageType>(() => {
    const p = searchParams.get("package");
    return packages.find((pkg) => pkg.name.toLowerCase() === p?.toLowerCase())?.name ?? "Intermedio";
  });

  const set = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleInputChange = (k: string, value: string) => {
    if (k === "referral") validateRef(value);
    else set(k, value);
  };

  const validateRef = async (code: string) => {
    set("referral", code);
    if (!code) { setRefValid(null); return; }
    const { data } = await supabase
      .from("affiliates")
      .select("id, name")
      .eq("affiliate_code", code.toUpperCase())
      .maybeSingle();
    setRefValid(!!data);
    setRefName(data?.name ?? "");
  };

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones estrictas
    if (!form.name.trim() || !form.dni.trim() || !form.email.trim() || !form.password || !form.yape.trim()) {
      toast({ title: "Faltan datos", description: "Debes completar todos los campos principales para continuar.", variant: "destructive" });
      return;
    }
    if (form.password.length < 6) {
      toast({ title: "Contraseña inválida", description: "La contraseña debe tener un mínimo de 6 caracteres.", variant: "destructive" });
      return;
    }
    if (form.password !== form.password2) {
      toast({ title: "Las contraseñas no coinciden", description: "Asegúrate de repetir la misma contraseña correctamente.", variant: "destructive" });
      return;
    }

    setStep1Complete(true);
    setStep(2);
  };

  const handleFinalSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    const { error: regError } = await register({
      name: form.name, email: form.email, password: form.password,
      dni: form.dni, yapeNumber: form.yape,
      referralCode: form.referral || undefined,
      packageType: selectedPackage,
    });
    if (regError) {
      toast({ title: "No se pudo crear la cuenta", description: regError.includes("database") ? "Error de conexión. Revisa los campos." : regError, variant: "destructive" });
      setSubmitting(false);
      return;
    }
    if (items.length > 0) {
      toast({ title: "¡Bienvenido a Winclick!", description: `Cuenta ${selectedPackage} creada. Completa tu pedido con tu descuento.` });
      navigate("/checkout");
    } else {
      toast({ title: "¡Bienvenido a Winclick!", description: `Cuenta ${selectedPackage} creada. Elige tu primer producto del catálogo con tus bonos de activación.` });
      navigate("/catalogo");
    }
    setSubmitting(false);
  };

  const selectedPkg = packages.find((p) => p.name === selectedPackage)!;

  return (
    <div className="min-h-screen bg-background pt-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[calc(100vh-64px)]">

        {/* ── Panel izquierdo: sólo desktop ─────────────────────────────── */}
        <div className="hidden lg:flex relative overflow-hidden flex-col justify-center">
          <img
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=900&h=1080&fit=crop&crop=center&auto=format&q=85"
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(160deg, rgba(5,12,28,0.95) 0%, rgba(5,12,28,0.80) 60%, rgba(5,12,28,0.94) 100%)" }} />

          <div className="relative z-10 p-12 flex flex-col justify-center">
            {/* Headline compacto */}
            <h2 className="font-syne font-extrabold text-[32px] leading-tight text-wo-crema mb-2">
              Construye tu red.<br />Gana sin límites.
            </h2>
            <p className="font-jakarta text-sm text-wo-crema-muted mb-10">Únete a miles de afiliados en winclick.online</p>

            {/* 3 chips de beneficio — minimal */}
            <div className="space-y-4 mb-10">
              {[
                { icon: "💰", label: "Hasta 25% de comisión por venta" },
                { icon: "👥", label: "Red de hasta 10 niveles de profundidad" },
                { icon: "🛍️", label: "Tienda online propia desde el día 1" },
              ].map((b, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-lg">{b.icon}</span>
                  <span className="font-jakarta text-[13px] text-wo-crema-muted">{b.label}</span>
                </div>
              ))}
            </div>

            {/* Summary indicator */}
            {step === 2 && (
              <div className="rounded-wo-card p-5 mb-6" style={{ background: "rgba(232,116,26,0.07)", border: "0.5px solid rgba(232,116,26,0.3)" }}>
                <p className="font-jakarta text-[10px] text-wo-crema-muted uppercase font-semibold mb-1">Plan elegido</p>
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-syne font-extrabold text-2xl text-primary">{selectedPkg.name}</p>
                  {selectedPkg.activationDiscount > 0 && (
                    <span className="bg-primary/20 text-primary font-jakarta text-[10px] font-bold px-2 py-0.5 rounded-full border border-primary/30">
                      {selectedPkg.activationDiscount}% OFF Activación
                    </span>
                  )}
                </div>
                <p className="font-jakarta text-xs text-secondary mt-1">{selectedPkg.investment.toLocaleString()} soles · {selectedPkg.depthUnlocked} niveles de red</p>
                {selectedPkg.name === "VIP" && (
                  <div className="mt-3 p-3 rounded-lg bg-wo-carbon/50 border border-secondary/20">
                    <p className="font-jakarta text-[10px] text-secondary font-bold uppercase mb-1">Beneficio Exclusivo VIP:</p>
                    <p className="font-jakarta text-xs text-wo-crema-muted">Recibirás un valor de <strong className="text-wo-crema">S/ 22,222</strong> en productos por tu inversión inicial.</p>
                  </div>
                )}
              </div>
            )}

            <Link to="/login-afiliado" className="font-jakarta text-[13px] text-primary hover:underline">
              ¿Ya tienes cuenta? → Iniciar sesión
            </Link>
          </div>
        </div>

        {/* ── Panel derecho: formulario ──────────────────────────────────── */}
        <div className="flex items-start lg:items-center p-6 sm:p-8 lg:p-12 overflow-y-auto">
          <div className="w-full max-w-md mx-auto">

            {/* Link "ya tienes cuenta" visible sólo en mobile */}
            <div className="lg:hidden flex justify-end mb-6">
              <Link to="/login-afiliado" className="font-jakarta text-[13px] text-primary hover:underline">
                ¿Ya tienes cuenta? →
              </Link>
            </div>

            <StepBar step={step} />

            {/* ── STEP 1 ───────────────────────────────────────────────── */}
            {step === 1 && (
              <form onSubmit={handleStep1} className="space-y-4">
                <h2 className="font-syne font-extrabold text-[26px] text-wo-crema mb-4">Crea tu cuenta</h2>

                {/* Selector de paquete compacto */}
                <div className="rounded-wo-btn px-4 py-3 flex items-center gap-3" style={{ background: "rgba(232,116,26,0.06)", border: "0.5px solid rgba(232,116,26,0.2)" }}>
                  <span className="font-jakarta font-bold text-[10px] px-2 py-0.5 rounded-wo-pill shrink-0" style={{ background: "rgba(232,116,26,0.15)", color: "hsl(var(--wo-oro))" }}>
                    {selectedPackage}
                  </span>
                  <p className="font-jakarta text-xs text-wo-crema-muted flex-1">
                    <strong className="text-wo-crema">{selectedPkg.depthUnlocked} niveles</strong> de red · S/ {selectedPkg.investment.toLocaleString()}
                  </p>
                  <button type="button" onClick={() => setShowInlinePicker((v) => !v)} className="font-jakarta text-[11px] text-primary hover:underline shrink-0">
                    {showInlinePicker ? "Cerrar" : "Cambiar →"}
                  </button>
                </div>

                {showInlinePicker && (
                  <div className="space-y-2 p-3 rounded-wo-card" style={{ background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
                    {packages.map((pkg) => {
                      const isSel = selectedPackage === pkg.name;
                      const hasActDisc = (pkg.activationDiscount ?? 0) > 0;
                      
                      return (
                        <button
                          key={pkg.name}
                          type="button"
                          onClick={() => { setSelectedPackage(pkg.name); setShowInlinePicker(false); }}
                          className="w-full text-left rounded-wo-btn px-4 py-3 flex items-center justify-between transition-all group"
                          style={{ 
                            background: isSel ? "rgba(232,116,26,0.08)" : "transparent", 
                            border: isSel ? "1.5px solid hsl(var(--wo-oro))" : "0.5px solid rgba(255,255,255,0.1)" 
                          }}
                        >
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-jakarta font-bold text-sm text-wo-crema">{pkg.name}</span>
                              {hasActDisc && (
                                <span className="bg-primary text-primary-foreground font-jakarta text-[9px] font-extrabold px-1.5 py-0.5 rounded-wo-pill flex items-center gap-1">
                                  <Flame size={8} /> {pkg.activationDiscount}% OFF EN PRODUCTOS
                                </span>
                              )}
                            </div>
                            <span className="font-jakarta text-[11px] text-wo-crema-muted">
                              {pkg.depthUnlocked} niveles · Inversión S/ {pkg.investment.toLocaleString()}
                              {pkg.name === "VIP" && (
                                <span className="text-secondary font-bold block mt-0.5">
                                  ¡Recibes S/ 22,222 en productos!
                                </span>
                              )}
                            </span>
                          </div>
                          {isSel && <Check size={13} className="text-primary" />}
                        </button>
                      );
                    })}
                  </div>
                )}

                <InputField label="Nombre completo" k="name" placeholder="Tu nombre completo" value={form.name} onChange={handleInputChange} />
                <InputField label="DNI" k="dni" placeholder="12345678" maxLength={8} value={form.dni} onChange={handleInputChange} sensitive />
                <InputField label="Email" k="email" type="email" placeholder="tu@email.com" value={form.email} onChange={handleInputChange} />

                <div>
                  <label className="block font-jakarta text-xs text-wo-crema-muted font-medium mb-1.5">Contraseña</label>
                  <div className="relative">
                    <input type={showPw ? "text" : "password"} value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="Mínimo 6 caracteres"
                      className="w-full bg-wo-carbon font-jakarta text-sm text-wo-crema placeholder:text-wo-crema/30 px-4 py-3 rounded-wo-btn outline-none focus:ring-1 focus:ring-primary"
                      style={{ border: "0.5px solid rgba(255,255,255,0.1)" }} />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-wo-crema-muted">{showPw ? <EyeOff size={14} /> : <Eye size={14} />}</button>
                  </div>
                </div>

                <div>
                  <label className="block font-jakarta text-xs text-wo-crema-muted font-medium mb-1.5">Confirmar contraseña</label>
                  <div className="relative">
                    <input type={showPw2 ? "text" : "password"} value={form.password2} onChange={(e) => set("password2", e.target.value)} placeholder="Repite tu contraseña"
                      className="w-full bg-wo-carbon font-jakarta text-sm text-wo-crema placeholder:text-wo-crema/30 px-4 py-3 rounded-wo-btn outline-none focus:ring-1 focus:ring-primary"
                      style={{ border: form.password2 && form.password !== form.password2 ? "0.5px solid hsl(var(--destructive))" : "0.5px solid rgba(255,255,255,0.1)" }} />
                    <button type="button" onClick={() => setShowPw2(!showPw2)} className="absolute right-3 top-1/2 -translate-y-1/2 text-wo-crema-muted">{showPw2 ? <EyeOff size={14} /> : <Eye size={14} />}</button>
                  </div>
                  {form.password2 && form.password !== form.password2 && <p className="font-jakarta text-xs text-destructive mt-1">Las contraseñas no coinciden</p>}
                </div>

                <InputField label="Número Yape" k="yape" placeholder="987654321" prefix="+51" value={form.yape} onChange={handleInputChange} sensitive />
                <InputField label="Código de referido (opcional)" k="referral" placeholder="WIN-XXXXXX" icon={<Gift size={14} />} value={form.referral} onChange={handleInputChange} refValid={refValid} refName={refName} />

                <button type="submit" className="w-full bg-primary text-primary-foreground font-jakarta font-bold text-sm py-4 rounded-wo-btn hover:bg-wo-oro-dark transition-colors mt-2">
                  Continuar → Resumen de la cuenta
                </button>
                <p className="font-jakarta text-[11px] text-wo-crema/40 text-center">
                  Al registrarte aceptas los{" "}
                  <Link to="/terminos" className="text-primary hover:underline">Términos</Link>
                  {" "}y la{" "}
                  <Link to="/privacidad" className="text-primary hover:underline">Política de privacidad</Link>
                </p>
              </form>
            )}

            {/* ── STEP 2 (Confirmación) ───────────────────────────────────────────────── */}
            {step === 2 && (
              <div>
                <h2 className="font-syne font-extrabold text-[24px] text-wo-crema mb-1">¡Casi listo!</h2>
                <p className="font-jakarta text-sm text-wo-crema-muted mb-6">
                  Revisa tu resumen. Al crear la cuenta accederás a tu panel para elegir productos y activar tu plan.
                </p>

                {/* Resumen final compacto */}
                <div className="rounded-wo-card p-5 mb-5" style={{ background: "rgba(232,116,26,0.06)", border: "0.5px solid rgba(232,116,26,0.25)" }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-jakarta text-[10px] text-wo-crema-muted uppercase font-semibold">Plan</p>
                      <p className="font-syne font-extrabold text-2xl text-primary">{selectedPkg.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-jakarta text-[10px] text-wo-crema-muted uppercase font-semibold">Meta de activación</p>
                      <p className="font-syne font-extrabold text-2xl text-secondary">S/ {selectedPkg.investment.toLocaleString()}</p>
                    </div>
                  </div>
                  {selectedPkg.activationDiscount > 0 && (
                    <div className="mt-2">
                      <span className="bg-primary text-primary-foreground font-jakarta text-[10px] font-extrabold px-1.5 py-0.5 rounded-wo-pill">
                        <Flame size={10} className="inline mr-0.5" /> {selectedPkg.activationDiscount}% OFF EN PRODUCTOS
                      </span>
                    </div>
                  )}
                  <p className="font-jakarta text-[11px] text-wo-crema-muted mt-3">
                    {selectedPkg.depthUnlocked} niveles de red desbloqueados · se activa al llegar a tu meta comprando productos.
                  </p>
                  
                  {selectedPkg.name === "VIP" && (
                    <div className="mt-3 p-3 rounded-lg bg-wo-carbon/50 border border-secondary/20">
                      <p className="font-jakarta text-[10px] text-secondary font-bold uppercase mb-1">Valor en Productos VIP:</p>
                      <p className="font-jakarta text-xs text-wo-crema-muted">Con el 55% OFF, recibirás <strong className="text-wo-crema">S/ 22,222</strong> en productos al terminar tu activación de S/ 10,000.</p>
                    </div>
                  )}
                </div>

                <div className="mb-6 p-4 rounded-wo-btn flex gap-3" style={{ background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.06)" }}>
                  <ShoppingBag size={18} className="text-wo-crema-muted shrink-0 mt-0.5" />
                  <p className="font-jakarta text-[13px] text-wo-crema-muted leading-relaxed">
                    Después del registro ve al Catálogo, agrega productos y realiza tu compra de activación. Puedes hacerlo en varias compras — todas se acumulan.
                  </p>
                </div>

                {(bizSettings?.yape_number || bizSettings?.plin_number) && (
                  <div className="mb-5 p-4 rounded-wo-btn flex items-center gap-3" style={{ background: "rgba(232,116,26,0.07)", border: "0.5px solid rgba(232,116,26,0.2)" }}>
                    <Phone size={15} className="text-primary shrink-0" />
                    <div>
                      <p className="font-jakarta text-[11px] text-wo-crema-muted">Pago vía Yape / Plin</p>
                      <p className="font-syne font-bold text-base text-primary">{bizSettings.yape_number ?? bizSettings.plin_number}</p>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleFinalSubmit}
                  disabled={submitting}
                  className="w-full bg-primary text-primary-foreground font-jakarta font-bold text-sm py-4 rounded-wo-btn hover:bg-wo-oro-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {submitting ? "Creando cuenta..." : "Crear mi cuenta ahora →"}
                </button>
                <button type="button" onClick={() => setStep(1)} className="w-full font-jakarta text-xs text-wo-crema-muted hover:text-wo-crema mt-3 py-2">
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
