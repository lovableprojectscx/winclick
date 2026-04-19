import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Gift, Check, ShoppingBag, Phone } from "lucide-react";
import { useBusinessSettings } from "@/hooks/useAffiliate";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/lib/supabase";
import type { PackageType } from "@/lib/database.types";
import { useToast } from "@/hooks/use-toast";

const packages = [
  { name: "Básico"     as const, investment: 120,   depthUnlocked: 3  },
  { name: "Intermedio" as const, investment: 2000,  depthUnlocked: 7  },
  { name: "VIP"        as const, investment: 10000, depthUnlocked: 10 },
];

const packageFeatures: Record<PackageType, string[]> = {
  Básico: ["Comisiones niveles 1–3", "Tienda online propia", "Dashboard completo", "Soporte por WhatsApp"],
  Intermedio: ["Comisiones niveles 1–7", "Todo lo de Básico", "Red 7 niveles de profundidad", "Mayor potencial de ingresos"],
  VIP: ["Comisiones niveles 1–10", "Todo lo de Intermedio", "Nivel 8: comisión 3% ★", "Máximo potencial de red"],
};

// ── Componentes auxiliares fuera del componente principal ──────────────────
// IMPORTANTE: deben estar aquí fuera para que React no los desmonte en cada
// re-render (si estuvieran dentro, cada tecla crearía una nueva referencia
// de función y el input perdería el foco).

const StepBar = ({ step }: { step: number }) => (
  <div className="flex items-center mb-8">
    {[{ n: 1, label: "Tus datos" }, { n: 2, label: "Paquete" }, { n: 3, label: "Activación" }].map((s, i) => (
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
      {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-wo-crema-muted">{icon}</span>}
      {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 font-jakarta text-sm text-wo-crema-muted">{prefix}</span>}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(k, e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        {...(sensitive ? { "data-idenza-ignore": true } : {})}
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

// ───────────────────────────────────────────────────────────────────────────

export default function RegistroAfiliado() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { items } = useCart();            // para saber si hay carrito pendiente
  const { data: bizSettings } = useBusinessSettings();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [form, setForm] = useState({ name: "", dni: "", email: "", password: "", password2: "", yape: "", referral: "" });
  const [refValid, setRefValid] = useState<boolean | null>(null);
  const [refName, setRefName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [step1Complete, setStep1Complete] = useState(false);
  const [showInlinePicker, setShowInlinePicker] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<PackageType>(() => {
    const p = searchParams.get("package");
    const found = packages.find((pkg) => pkg.name.toLowerCase() === p?.toLowerCase());
    return found?.name ?? "Intermedio";
  });
  const set =(key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleInputChange = (k: string, value: string) => {
    if (k === "referral") {
      validateRef(value);
    } else {
      set(k, value);
    }
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
    if (form.password !== form.password2) return;
    setStep1Complete(true);
    setStep(2);
  };

  const handleStep2Continue = () => {
    if (!step1Complete) {
      toast({
        title: "Completa tus datos primero",
        description: "Debes llenar nombre, DNI, email, contraseña y Yape antes de continuar.",
        variant: "destructive",
      });
      setStep(1);
      return;
    }
    setStep(3);
  };

  const handleFinalSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);

    // 1. Crear cuenta en Supabase Auth + registro en affiliates
    const { error: regError } = await register({
      name: form.name, email: form.email, password: form.password,
      dni: form.dni, yapeNumber: form.yape,
      referralCode: form.referral || undefined,
      packageType: selectedPackage,
    });

    if (regError) {
      console.error("Registration Error Detail:", regError);
      toast({ 
        title: "No se pudo crear la cuenta", 
        description: regError.includes("database") 
          ? "Error de conexión o datos inválidos. Por favor revisa los campos." 
          : regError, 
        variant: "destructive" 
      });
      setSubmitting(false);
      return;
    }

    if (items.length > 0) {
      // Tiene carrito pendiente → directo al checkout con descuento ya aplicado
      toast({
        title: "¡Bienvenido a Winclick!",
        description: `Cuenta ${selectedPackage} creada. Completa tu pedido con tu descuento de activación.`,
      });
      navigate("/checkout");
    } else {
      // Sin carrito → al catálogo para elegir su kit de activación
      toast({
        title: "¡Bienvenido a Winclick!",
        description: `Cuenta ${selectedPackage} creada. Ahora elige tu kit de activación en el catálogo con tu ${selectedPackage === "Básico" ? "40%" : selectedPackage === "Intermedio" ? "50%" : "55%"} de descuento.`,
      });
      navigate("/catalogo");
    }
    setSubmitting(false);
  };

  const selectedPkg = packages.find((p) => p.name === selectedPackage)!

  return (
    <div className="min-h-screen bg-background pt-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[calc(100vh-64px)]">
        {/* Left - Foto lifestyle + beneficios */}
        <div className="relative overflow-hidden flex flex-col justify-center">
          {/* Foto de fondo */}
          <img
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=900&h=1080&fit=crop&crop=center&auto=format&q=85"
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(160deg, rgba(5,12,28,0.93) 0%, rgba(5,12,28,0.78) 60%, rgba(5,12,28,0.92) 100%)" }} />

          {/* Contenido encima */}
          <div className="relative z-10 p-8 lg:p-12 flex flex-col justify-center min-h-full">
            <Link to="/" className="mb-2 inline-block">
              <img src="/logo-winclick.png" alt="Winclick" className="h-8 w-auto" />
            </Link>
            <p className="font-jakarta text-[13px] text-wo-crema-muted mb-10">Tu éxito a un solo click</p>

            <div className="space-y-7 mb-10">
              {[
                { icon: "💰", title: "Comisiones hasta 25%", desc: "Gana por tus ventas y las de tu red completa." },
                { icon: "👥", title: "Red en múltiples niveles", desc: "10 niveles de profundidad para maximizar ganancias." },
                { icon: "🛡️", title: "Soporte y herramientas", desc: "Tu tienda online, dashboard y soporte dedicado." },
              ].map((b, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center text-xl shrink-0">{b.icon}</div>
                  <div>
                    <h3 className="font-jakarta font-bold text-[14px] text-wo-crema">{b.title}</h3>
                    <p className="font-jakarta text-[13px] text-wo-crema-muted mt-0.5 leading-relaxed">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {step === 3 && (
              <div className="bg-wo-carbon/80 backdrop-blur-sm rounded-wo-card p-5 mb-6" style={{ border: "0.5px solid rgba(232,116,26,0.3)" }}>
                <p className="font-jakarta text-[10px] text-wo-crema-muted uppercase font-semibold mb-2">Resumen de tu elección</p>
                <p className="font-jakarta font-bold text-sm text-wo-crema">{selectedPkg.name}</p>
                <p className="font-syne font-extrabold text-xl text-primary mt-1">Meta: S/ {selectedPkg.investment.toLocaleString()}</p>
                <p className="font-jakarta text-[11px] text-secondary mt-1">Niveles 1–{selectedPkg.depthUnlocked} desbloqueados</p>
              </div>
            )}

            <div className="bg-wo-carbon/80 backdrop-blur-sm rounded-wo-card p-5" style={{ border: "0.5px solid rgba(255,255,255,0.1)" }}>
              <h4 className="font-jakarta font-semibold text-[14px] text-wo-crema mb-2">¿Cuánto puedo ganar?</h4>
              <p className="font-jakarta text-[13px] text-wo-crema-muted leading-relaxed">Con 5 referidos activos y red de 50 personas: entre <span className="text-primary font-semibold">S/ 500 y S/ 2,000/mes</span>.</p>
            </div>

            <Link to="/login-afiliado" className="font-jakarta text-[13px] text-primary hover:underline mt-8 inline-block">
              ¿Ya tienes cuenta? → Iniciar sesión
            </Link>
          </div>
        </div>

        {/* Right - Steps */}
        <div className="p-8 lg:p-12 flex items-start lg:items-center overflow-y-auto">
          <div className="w-full max-w-md mx-auto">
            {/* Banner Promo Abril */}
            <StepBar step={step} />

            {/* ── STEP 1: Datos personales ── */}
            {step === 1 && (
              <form onSubmit={handleStep1} className="space-y-4">
                <h2 className="font-syne font-extrabold text-[26px] text-wo-crema mb-4">Crea tu cuenta de socio</h2>

                <div className="rounded-wo-btn px-4 py-3 flex items-center gap-3 mb-2" style={{ background: "rgba(232,116,26,0.07)", border: "0.5px solid rgba(232,116,26,0.25)" }}>
                  <span className="font-jakarta font-bold text-[10px] px-2 py-0.5 rounded-wo-pill" style={{ background: "rgba(232,116,26,0.15)", color: "hsl(var(--wo-oro))" }}>
                    {selectedPackage}
                  </span>
                  <p className="font-jakarta text-xs text-wo-crema-muted flex-1">
                    Paquete seleccionado: <strong className="text-wo-crema">S/ {selectedPkg.investment.toLocaleString()}</strong> + compras S/ 300/mes
                  </p>
                  <button type="button" onClick={() => setShowInlinePicker((v) => !v)} className="font-jakarta text-[11px] text-primary hover:underline shrink-0">
                    {showInlinePicker ? "Cerrar" : "Cambiar →"}
                  </button>
                </div>

                {showInlinePicker && (
                  <div className="space-y-2 mb-2 p-3 rounded-wo-card" style={{ background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
                    {packages.map((pkg) => {
                      const isSel = selectedPackage === pkg.name;
                      return (
                        <button
                          key={pkg.name}
                          type="button"
                          onClick={() => { setSelectedPackage(pkg.name); setShowInlinePicker(false); }}
                          className="w-full text-left rounded-wo-btn px-4 py-3 flex items-center justify-between transition-all"
                          style={{
                            background: isSel ? "rgba(232,116,26,0.08)" : "rgba(255,255,255,0.02)",
                            border: isSel ? "1.5px solid hsl(var(--wo-oro))" : "0.5px solid rgba(255,255,255,0.1)",
                          }}
                        >
                          <div>
                            <span className="font-jakarta font-bold text-sm text-wo-crema">{pkg.name}</span>
                            <span className="font-jakarta text-[11px] text-wo-crema-muted ml-2">S/ {pkg.investment.toLocaleString()}</span>
                          </div>
                          {isSel && <Check size={14} className="text-primary" />}
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

                <InputField label="Número Yape" k="yape" placeholder="987654321" prefix="+51" value={form.yape} onChange={handleInputChange} sensitive />
                <InputField label="Código de referido (opcional)" k="referral" placeholder="WIN-XXXXXX" icon={<Gift size={14} />} value={form.referral} onChange={handleInputChange} refValid={refValid} refName={refName} />

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
                <p className="font-jakarta text-sm text-wo-crema-muted mb-6">Todos los paquetes requieren cumplir compras mensuales mínimas para mantener comisiones activas.</p>

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
                              <span className="font-jakarta text-[11px] text-wo-crema-muted">entrada · + compras de S/ 300/mes</span>
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

                <button onClick={handleStep2Continue} className="w-full bg-primary text-primary-foreground font-jakarta font-bold text-sm py-4 rounded-wo-btn hover:bg-wo-oro-dark transition-colors">
                  Confirmar paquete {selectedPackage} →
                </button>
                <button type="button" onClick={() => setStep(1)} className="w-full font-jakarta text-xs text-wo-crema-muted hover:text-wo-crema mt-3 py-2">
                  ← Volver a mis datos
                </button>
              </div>
            )}

            {/* ── STEP 3: Instrucciones de activación por compras ── */}
            {step === 3 && (
              <div>
                <h2 className="font-syne font-extrabold text-[24px] text-wo-crema mb-1">¡Casi listo!</h2>
                <p className="font-jakarta text-sm text-wo-crema-muted mb-6">
                  Crea tu cuenta para acceder a tu panel de afiliado. Una vez dentro, deberás dirigirte al catálogo y realizar compras en productos por el valor total de tu paquete para activarlo.
                </p>

                {/* Resumen Final */}
                <div className="rounded-wo-card p-6 mb-8" style={{ background: "rgba(232,116,26,0.06)", border: "0.5px solid rgba(232,116,26,0.25)" }}>
                  <p className="font-jakarta text-[11px] text-wo-crema-muted uppercase font-semibold mb-1">Paquete a activar</p>
                  <p className="font-syne font-extrabold text-3xl text-primary mb-2">{selectedPkg.name}</p>
                  <p className="font-jakarta text-xs text-wo-crema leading-relaxed">
                    Meta de compra inicial para activación: <strong className="text-secondary">S/ {selectedPkg.investment.toLocaleString()}</strong> en productos.
                  </p>
                </div>

                <div className="mb-4 p-4 rounded-wo-btn bg-wo-carbon/50 flex gap-3" style={{ border: "0.5px solid rgba(255,255,255,0.05)" }}>
                  <ShoppingBag size={20} className="text-wo-crema-muted shrink-0 mt-0.5" />
                  <p className="font-jakarta text-[13px] text-wo-crema-muted leading-relaxed">
                    Al finalizar el registro, haz clic en "Ir al Catálogo" desde tu panel para seleccionar los productos que conformarán tu paquete de activación.
                  </p>
                </div>

                {(bizSettings?.yape_number || bizSettings?.plin_number) && (
                  <div className="mb-6 p-4 rounded-wo-btn flex items-center gap-3" style={{ background: "rgba(232,116,26,0.07)", border: "0.5px solid rgba(232,116,26,0.25)" }}>
                    <Phone size={16} className="text-primary shrink-0" />
                    <div>
                      <p className="font-jakarta text-[11px] text-wo-crema-muted">Número de pago (Yape / Plin)</p>
                      <p className="font-syne font-bold text-base text-primary">
                        {bizSettings.yape_number ?? bizSettings.plin_number}
                      </p>
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
