import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Check, CheckCircle2, ChevronRight, ChevronDown, X, HelpCircle,
  Star, Zap, Crown, Target, Share2, Wallet,
  RefreshCw, Award, ShoppingBag, LayoutDashboard,
  MessageCircle, Network, TrendingUp, Gem, ArrowRight,
} from "lucide-react";
import { useProducts } from "@/hooks/useProducts";

/* ─── Tipos ──────────────────────────────────────────────────────────────── */
type PlanKey = "Básico" | "Ejecutivo" | "Intermedio" | "VIP";
interface Plan {
  key: PlanKey; icon: React.ReactNode; label: string; tag: string;
  price: number; discount: number; multiplier: number; levels: number;
  color: string; border: string; bg: string; glow: string; popular: boolean;
  details: { icon: React.ReactNode; text: string }[];
}

const PLANS: Plan[] = [
  {
    key: "Básico", icon: <Star size={20} />, label: "Membresía Básico", tag: "Inicio rápido",
    price: 120, discount: 40, multiplier: 0.60, levels: 3,
    color: "hsl(var(--primary))", border: "rgba(232,116,26,0.30)", bg: "rgba(232,116,26,0.06)", glow: "0 0 0px transparent",
    popular: false,
    details: [
      { icon: <Award size={15} />,          text: "Ganancia: 3 Niveles Residual" },
      { icon: <X size={15} className="text-destructive" />, text: "No cobra Bonos de Patrocinio" },
      { icon: <ShoppingBag size={15} />,    text: "Membresía: Precio Público" },
      { icon: <CheckCircle2 size={15} />,   text: "Ahorro: 40% OFF en Recompra" },
    ],
  },
  {
    key: "Ejecutivo", icon: <Target size={20} />, label: "Membresía Ejecutivo", tag: "Más Niveles",
    price: 600, discount: 45, multiplier: 0.55, levels: 5,
    color: "#6366f1", border: "rgba(99,102,241,0.30)", bg: "rgba(99,102,241,0.06)", glow: "0 0 0px transparent",
    popular: false,
    details: [
      { icon: <Award size={15} />,          text: "Ganancia: 5 Niveles Residual" },
      { icon: <ShoppingBag size={15} />,    text: "Ahorro: 45% Inicial | 50% Recompra" },
      { icon: <LayoutDashboard size={15} />,text: "Soporte Prioritario" },
    ],
  },
  {
    key: "Intermedio", icon: <Zap size={20} />, label: "Membresía 2,000", tag: "El más elegido",
    price: 2000, discount: 50, multiplier: 0.50, levels: 7,
    color: "hsl(var(--secondary))", border: "rgba(30,192,213,0.45)", bg: "rgba(30,192,213,0.07)",
    glow: "0 0 48px rgba(30,192,213,0.18), 0 0 0 1px rgba(30,192,213,0.30)",
    popular: true,
    details: [
      { icon: <Award size={15} />,          text: "Ganancia: 7 Niveles Residual" },
      { icon: <ShoppingBag size={15} />,    text: "Ahorro: 50% OFF Permanente" },
      { icon: <Network size={15} />,        text: "Red de Alta Profundidad" },
    ],
  },
  {
    key: "VIP", icon: <Crown size={20} />, label: "Membresía VIP", tag: "Máximo Ahorro",
    price: 10000, discount: 55, multiplier: 0.45, levels: 10,
    color: "#C9920A", border: "rgba(201,146,10,0.35)", bg: "rgba(201,146,10,0.06)", glow: "0 0 0px transparent",
    popular: false,
    details: [
      { icon: <Award size={15} />,          text: "Ganancia: 10 Niveles Residual" },
      { icon: <Zap size={15} />,            text: "Ahorro: 55% Inicial | 50% Recompra" },
      { icon: <Star size={15} />,           text: "Bono Especial Nivel 8 (3%)" },
    ],
  },
];

const FAQS = [
  { q: "¿La primera membresía genera comisiones para mi red?",  a: "No. La membresía inicial activa tu cuenta con descuentos exclusivos según tu plan, pero no genera comisiones en la red. Las comisiones arrancan desde tu primera recompra mensual." },
  { q: "¿Qué es la recompra mensual?",                          a: "Es la compra mensual que realiza cada afiliado activo. Tendrás entre 40% y 55% de descuento según tu plan, y estas compras sí generan comisiones para toda la red." },
  { q: "¿El descuento aplica a cualquier producto?",            a: "Sí. En membersía y recompras mensuales, el descuento de tu plan aplica a cualquier producto del catálogo, sin mínimo de compra." },
  { q: "¿Puedo subir de plan después?",                         a: "Sí. Puedes hacer upgrade cuando quieras y desbloquear más niveles de comisión y mayor descuento desde ese momento." },
];

const IMG_FALLBACK = "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&h=600&fit=crop&auto=format&q=82";

/* ─── Hook reveal ────────────────────────────────────────────────────────── */
function useReveal(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setV(true); obs.disconnect(); } }, { threshold });
    obs.observe(el); return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible: v };
}

/* ─── Barra de niveles ───────────────────────────────────────────────────── */
function LevelBar({ levels, color, animate }: { levels: number; color: string; animate: boolean }) {
  return (
    <div className="flex gap-[3px] items-end h-5">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="rounded-sm flex-shrink-0" style={{
          width: 12, height: i < levels ? `${9 + (i / 9) * 11}px` : "4px",
          background: i < levels ? color : "rgba(255,255,255,0.06)",
          opacity: animate ? 1 : 0, transform: animate ? "scaleY(1)" : "scaleY(0)",
          transformOrigin: "bottom",
          transition: `opacity 0.3s ${i * 40}ms, transform 0.4s ${i * 40}ms cubic-bezier(0.34,1.56,0.64,1)`,
        }} />
      ))}
    </div>
  );
}

/* ─── PlanIcon ───────────────────────────────────────────────────────────── */
function PlanIcon({ plan, size = 36 }: { plan: Plan; size?: number }) {
  return (
    <div className="flex items-center justify-center flex-shrink-0" style={{
      width: size, height: size, borderRadius: size * 0.28,
      background: plan.bg, border: `0.5px solid ${plan.border}`, color: plan.color,
    }}>{plan.icon}</div>
  );
}

/* ─── Modal ──────────────────────────────────────────────────────────────── */
function PlanModal({ plan, onClose }: { plan: Plan; onClose: () => void }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6"
      style={{ background: "rgba(5,10,20,0.88)", backdropFilter: "blur(8px)" }} onClick={onClose}>
      <div className="w-full sm:max-w-[340px] bg-wo-grafito rounded-t-3xl sm:rounded-2xl p-6 relative animate-in slide-in-from-bottom sm:zoom-in-95 duration-300"
        style={{ borderTop: `1px solid ${plan.border}`, borderLeft: `0.5px solid ${plan.border}`, borderRight: `0.5px solid ${plan.border}`, borderBottom: `0.5px solid ${plan.border}`, boxShadow: plan.glow }}
        onClick={e => e.stopPropagation()}>
        
        {/* Mobile handle */}
        <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-6 sm:hidden" />
        
        <button onClick={onClose}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 text-wo-crema-muted/50 hover:text-wo-crema transition-colors">
          <X size={20} />
        </button>
        <div className="flex items-center gap-3 mb-5">
          <PlanIcon plan={plan} size={48} />
          <div>
            <h3 className="font-syne font-extrabold text-lg text-wo-crema">{plan.label}</h3>
            <p className="font-jakarta text-[11px] text-wo-crema-muted">{plan.tag}</p>
          </div>
        </div>
        <div className="space-y-2 mb-6">
          {plan.details.map((d, i) => (
            <div key={i} className="flex items-center gap-3 py-2.5 px-3 rounded-xl"
              style={{ background: plan.bg, border: `0.5px solid ${plan.border}` }}>
              <span style={{ color: plan.color }}>{d.icon}</span>
              <span className="font-jakarta text-[13px] text-wo-crema">{d.text}</span>
            </div>
          ))}
        </div>
        <Link to={`/registro-afiliado?package=${plan.key}`} onClick={onClose}
          className="block w-full text-center font-jakarta font-bold text-sm py-3.5 rounded-xl"
          style={plan.popular ? { background: "hsl(var(--secondary))", color: "hsl(var(--background))" }
            : { background: plan.bg, color: plan.color, border: `0.5px solid ${plan.border}` }}>
          Comenzar con {plan.label} →
        </Link>
      </div>
    </div>
  );
}

function PlanCard({ plan, index, onShowDetails }: { plan: any; index: number; onShowDetails: () => void }) {
  const { ref, visible } = useReveal(0.1 + index * 0.05);
  return (
    <div ref={ref}
      className={`relative group rounded-2xl p-[1px] transition-all duration-300 ${plan.popular ? "scale-105 z-10" : "hover:scale-[1.02]"}`}
      style={{
        background: plan.popular ? `linear-gradient(135deg, ${plan.color}, transparent)` : "rgba(255,255,255,0.05)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)"
      }}>
      <div className="h-full bg-wo-carbon rounded-2xl p-6 flex flex-col gap-6 relative overflow-hidden">
        {/* Glow corner */}
        <div className="absolute -top-12 -right-12 w-24 h-24 blur-[40px] opacity-20" style={{ background: plan.color }} />

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <PlanIcon plan={plan} size={36} />
            <div>
              <p className="font-syne font-extrabold text-[15px] text-wo-crema leading-tight">{plan.label}</p>
              <p className="font-jakarta text-[11px] text-wo-crema-muted">{plan.tag}</p>
            </div>
          </div>
          <button onClick={onShowDetails}
            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 hover:scale-110 transition-transform"
            style={{ background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.10)", color: "rgba(248,244,236,0.35)" }}>
            <HelpCircle size={13} />
          </button>
        </div>

        <div className="rounded-xl py-5 text-center mb-1" style={{ background: `${plan.color}10`, border: `0.5px solid ${plan.border}` }}>
          <p className="font-jakarta text-[10px] uppercase tracking-widest text-wo-crema-muted/50 mb-1">Membresía Mínima</p>
          <div className="flex items-start justify-center">
            <span className="font-syne font-bold text-[18px] mr-1 mt-1.5" style={{ color: plan.color }}>S/</span>
            <span className="font-syne font-extrabold leading-none" style={{ fontSize: 48, color: plan.color }}>{plan.price.toLocaleString()}</span>
          </div>
          
          <div className="flex flex-col gap-2 mt-4 px-3">
            <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-black/20 border border-white/5">
              <span className="font-jakarta text-[9px] uppercase font-bold text-wo-crema-muted/60">Desc. Inicial</span>
              <span className="font-syne font-bold text-[12px]" style={{ color: plan.color }}>
                {plan.key === "Básico" ? "Público" : `${plan.discount}% OFF`}
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-black/20 border border-white/5">
              <span className="font-jakarta text-[9px] uppercase font-bold text-wo-crema-muted/60">Desc. Recompra</span>
              <span className="font-syne font-bold text-[12px] text-secondary">
                {plan.key === "Básico" ? "40%" : "50%"} OFF
              </span>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="font-jakarta text-[10px] uppercase tracking-widest text-wo-crema-muted/40">Residual</span>
            <span className="font-syne font-bold text-sm" style={{ color: plan.color }}>{plan.levels} / 10 niveles</span>
          </div>
          <LevelBar levels={plan.levels} color={plan.color} animate={visible} />
        </div>

        <Link to={`/registro-afiliado?package=${plan.key}`}
          className="mt-auto block w-full text-center font-jakarta font-bold text-[13px] py-4 rounded-xl transition-all duration-150 hover:opacity-90 active:scale-[0.98] uppercase tracking-wide"
          style={plan.popular ? { background: "hsl(var(--secondary))", color: "hsl(var(--background))" }
            : { background: `${plan.color}18`, color: plan.color, border: `0.5px solid ${plan.border}` }}>
          Seleccionar Plan →
        </Link>
      </div>
    </div>
  );
}

/* ─── Sección catálogo real ──────────────────────────────────────────────── */
function CatalogPrices() {
  const { data: products, isLoading } = useProducts();
  const { ref, visible } = useReveal(0.05);
  const [activePlan, setActivePlan] = useState<PlanKey>("Intermedio");
  const plan = PLANS.find(p => p.key === activePlan)!;
  const items = (products ?? []).filter(p => (p.public_price ?? p.price) > 0).slice(0, 8);

  return (
    <section ref={ref} className="max-w-4xl mx-auto px-4 sm:px-6 mb-16"
      style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(28px)", transition: "opacity 0.6s ease, transform 0.6s ease" }}>
      <div className="text-center mb-6">
        <p className="font-jakarta text-[11px] font-bold uppercase tracking-[0.12em] text-wo-crema-muted/35 mb-2">Precios reales en recompra</p>
        <h2 className="font-syne font-extrabold text-[22px] sm:text-[28px] text-wo-crema mb-1">¿Cuánto pagas en recompra?</h2>
        <p className="font-jakarta text-[13px] text-wo-crema-muted max-w-lg mx-auto">Selecciona un plan para ver tus precios y descuentos exclusivos en las compras mensuales de toda la tienda.</p>
      </div>
      <div className="flex justify-center gap-2 mb-6 flex-wrap">
        {PLANS.map(p => (
          <button key={p.key} onClick={() => setActivePlan(p.key)}
            className="flex items-center gap-2 px-4 py-2 rounded-full font-jakarta text-[12px] font-bold transition-all duration-150"
            style={activePlan === p.key
              ? { background: p.color, color: "hsl(var(--background))" }
              : { background: "rgba(255,255,255,0.04)", color: "rgba(248,244,236,0.45)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
            <span style={{ color: activePlan === p.key ? "hsl(var(--background))" : p.color }}>{p.icon}</span>
            {p.label} <span className="opacity-75">{p.key === "Básico" ? "0%" : p.key === "Ejecutivo" ? "45%" : "50%+"} OFF</span>
          </button>
        ))}
      </div>
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {items.map(product => {
            const pub = product.public_price ?? product.price;
            const factor = plan.key === "Básico" ? 1.00 : plan.key === "Ejecutivo" ? 0.55 : 0.50;
            const act = pub * factor;
            return (
              <Link key={product.id} to={`/catalogo/${product.slug || product.id}`}
                className="group rounded-2xl overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-0.5"
                style={{ background: "rgba(255,255,255,0.02)", border: `0.5px solid ${plan.border}` }}>
                <div className="relative h-[120px] sm:h-[140px] overflow-hidden bg-wo-carbon">
                  <img src={product.image_url || IMG_FALLBACK} alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={e => { (e.currentTarget as HTMLImageElement).src = IMG_FALLBACK; }} />
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full font-jakarta text-[10px] font-extrabold"
                    style={{ background: plan.color, color: "hsl(var(--background))" }}>{plan.key === "Básico" ? "PÚBLICO" : `-${plan.discount}%`}</div>
                </div>
                <div className="p-3 flex flex-col gap-2 flex-1">
                  <p className="font-jakarta font-semibold text-[12px] text-wo-crema leading-tight line-clamp-2">{product.name}</p>
                  <div className="flex items-baseline gap-1.5 mt-auto">
                    <span className="font-syne font-extrabold text-[18px] leading-none" style={{ color: plan.color }}>S/ {act.toFixed(2)}</span>
                    <span className="font-jakarta text-[11px] text-wo-crema-muted/50 line-through">S/ {pub.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background: `${plan.color}12` }}>
                    <Check size={9} style={{ color: plan.color }} />
                    <span className="font-jakarta text-[10px] font-bold" style={{ color: plan.color }}>Ahorras S/ {(pub - act).toFixed(2)}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
      <div className="flex justify-center mt-6">
        <Link to="/catalogo"
          className="inline-flex items-center gap-2 font-jakarta text-sm font-semibold px-5 py-2.5 rounded-full transition-all hover:opacity-90"
          style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.10)", color: "rgba(248,244,236,0.6)" }}>
          Ver catálogo completo <ArrowRight size={13} />
        </Link>
      </div>
    </section>
  );
}

/* ─── FAQ ────────────────────────────────────────────────────────────────── */
function FaqItem({ q, a, delay }: { q: string; a: string; delay: number }) {
  const [open, setOpen] = useState(false);
  const { ref, visible } = useReveal();
  return (
    <div ref={ref} className="rounded-xl overflow-hidden"
      style={{
        border: `0.5px solid ${open ? "rgba(30,192,213,0.25)" : "rgba(255,255,255,0.07)"}`,
        opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(12px)",
        transition: `opacity 0.4s ${delay}ms, transform 0.4s ${delay}ms ease-out`,
      }}>
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-4 text-left gap-3 transition-colors"
        style={{ background: open ? "rgba(30,192,213,0.05)" : "rgba(255,255,255,0.02)" }}>
        <span className="font-jakarta text-[13px] font-semibold text-wo-crema">{q}</span>
        <ChevronDown size={14} className="flex-shrink-0 text-wo-crema-muted/50 transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0)" }} />
      </button>
      {open && <div className="px-4 pb-4 animate-in slide-in-from-top-1 duration-150">
        <p className="font-jakarta text-[13px] text-wo-crema-muted leading-relaxed">{a}</p>
      </div>}
    </div>
  );
}

/* ─── Página ─────────────────────────────────────────────────────────────── */
export default function Planes() {
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const plansRef  = useReveal();
  const stepsRef  = useReveal();
  const diffRef   = useReveal();
  const recompRef = useReveal();

  return (
    <div className="min-h-screen bg-background pt-20 pb-24 overflow-x-hidden">

      {/* ══ HERO — split layout con imagen ════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">

          {/* Texto */}
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-jakarta text-[11px] font-bold uppercase tracking-[0.1em] mb-6"
              style={{ background: "rgba(30,192,213,0.09)", border: "0.5px solid rgba(30,192,213,0.28)", color: "hsl(var(--secondary))" }}>
              Sistema de membresías · Winclick
            </span>
            <h1 className="font-syne font-extrabold text-[38px] sm:text-[52px] leading-[1.06] text-wo-crema mb-5">
              Activa tu red.<br />
              <span style={{ color: "hsl(var(--primary))" }}>Empieza a ganar residual.</span>
            </h1>
            <p className="font-jakarta text-base text-wo-crema-muted mb-8 max-w-sm leading-relaxed">
              Elige tu plan, activa tu cuenta con el producto que quieras y empieza a construir tu red de ingresos residuales.
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <a href="#planes"
                className="font-jakarta font-bold text-sm px-6 py-3 rounded-full transition-all hover:scale-105 active:scale-95"
                style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}>
                Ver planes
              </a>
              <a href="#precios"
                className="font-jakarta text-sm font-medium px-6 py-3 rounded-full transition-colors text-wo-crema-muted hover:text-wo-crema"
                style={{ border: "0.5px solid rgba(255,255,255,0.1)" }}>
                Ver precios reales →
              </a>
            </div>

            {/* Mini stats bajo los botones */}
            <div className="flex gap-6 mt-8">
              {[
                { v: "Hasta 55%", l: "desc. membresía",  c: "hsl(var(--primary))" },
                { v: "10",  l: "niveles de red",  c: "hsl(var(--secondary))" },
                { v: "+ Bonos", l: "en activación", c: "#C9920A" },
              ].map(s => (
                <div key={s.l}>
                  <p className="font-syne font-extrabold text-[22px] leading-none" style={{ color: s.c }}>{s.v}</p>
                  <p className="font-jakarta text-[11px] text-wo-crema-muted mt-0.5">{s.l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Imagen hero */}
          <div className="relative hidden lg:block">
            {/* Glow detrás */}
            <div className="absolute inset-0 rounded-3xl"
              style={{ background: "radial-gradient(ellipse at center, rgba(30,192,213,0.15) 0%, transparent 70%)", filter: "blur(24px)" }} />
            <div className="relative rounded-3xl overflow-hidden" style={{ height: 460 }}>
              <img
                src="https://images.unsplash.com/photo-1556761175-b413da4baf72?w=900&h=920&fit=crop&q=82"
                alt="Equipo Winclick"
                className="w-full h-full object-cover"
              />
              {/* Overlay oscuro en bordes */}
              <div className="absolute inset-0"
                style={{ background: "linear-gradient(to right, hsl(var(--background)) 0%, transparent 18%, transparent 82%, hsl(var(--background)) 100%)" }} />
              <div className="absolute inset-0"
                style={{ background: "linear-gradient(to top, hsl(var(--background)) 0%, transparent 30%)" }} />

              {/* Floating badge */}
              <div className="absolute bottom-6 left-6 right-6 rounded-2xl p-4 flex items-center gap-3"
                style={{ background: "rgba(10,16,32,0.85)", backdropFilter: "blur(12px)", border: "0.5px solid rgba(30,192,213,0.25)" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(30,192,213,0.15)", border: "0.5px solid rgba(30,192,213,0.3)", color: "hsl(var(--secondary))" }}>
                  <TrendingUp size={18} />
                </div>
                <div>
                  <p className="font-syne font-bold text-[13px] text-wo-crema">Ingresos residuales reales</p>
                  <p className="font-jakarta text-[11px] text-wo-crema-muted">Gana aunque no trabajes ese día</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ PLANES ════════════════════════════════════════════════════════ */}
      <section id="planes" className="max-w-4xl mx-auto px-4 sm:px-6 mb-5 scroll-mt-24">
        <p className="font-jakarta text-[11px] font-bold uppercase tracking-[0.12em] text-wo-crema-muted/35 text-center mb-2">Elige tu membresía</p>
        <p className="font-jakarta text-[12px] text-wo-crema-muted/40 text-center mb-7 flex items-center justify-center gap-1">
          Toca <HelpCircle size={11} className="inline mx-0.5" /> para ver los beneficios completos
        </p>
        <div ref={plansRef.ref}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          style={{ opacity: plansRef.visible ? 1 : 0, transform: plansRef.visible ? "translateY(0)" : "translateY(20px)", transition: "opacity 0.5s ease, transform 0.5s ease" }}>
          {PLANS.map((plan, i) => <PlanCard key={plan.key} plan={plan} index={i} onShowDetails={() => setSelectedPlan(plan)} />)}
        </div>
      </section>

      {selectedPlan && <PlanModal plan={selectedPlan} onClose={() => setSelectedPlan(null)} />}

      {/* ══ PRECIOS REALES DEL CATÁLOGO ═══════════════════════════════════ */}
      <div id="precios" className="scroll-mt-24 mt-12">
        <CatalogPrices />
      </div>

      {/* ══ TABLA COMPARATIVA ═════════════════════════════════════════════ */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 mb-16">
        <p className="font-jakarta text-[11px] font-bold uppercase tracking-[0.12em] text-wo-crema-muted/35 text-center mb-5">Comparativa rápida</p>
        <div className="overflow-x-auto pb-4 custom-scrollbar">
          <div className="min-w-[640px] rounded-2xl overflow-hidden" style={{ border: "0.5px solid rgba(255,255,255,0.07)" }}>
            <div className="grid grid-cols-5" style={{ background: "rgba(255,255,255,0.03)", borderBottom: "0.5px solid rgba(255,255,255,0.07)" }}>
            <div className="p-3" />
            {PLANS.map(p => (
              <div key={p.key} className="p-3 flex flex-col items-center gap-2" style={{ borderLeft: "0.5px solid rgba(255,255,255,0.06)" }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: p.bg, border: `0.5px solid ${p.border}`, color: p.color }}>{p.icon}</div>
                <span className="font-jakarta text-[10px] text-wo-crema-muted hidden sm:block text-center leading-tight">{p.label}</span>
              </div>
            ))}
          </div>
          {[
            { label: "Desc. membresía", vals: ["0% (Público)", "45% OFF", "50% OFF", "55% OFF"], colors: PLANS.map(p => p.color) },
            { label: "Desc. recompra",  vals: ["40% OFF", "50% OFF", "50% OFF", "50% OFF"], colors: PLANS.map(p => p.color) },
            { label: "Niveles red",   vals: ["3", "5", "7", "10"], colors: PLANS.map(p => p.color) },
            { label: "Comisiones",    vals: ["1–3", "1–5", "1–7", "1–10"], colors: PLANS.map(p => p.color) },
          ].map((row, ri, arr) => (
            <div key={row.label} className="grid grid-cols-5" style={{ borderBottom: ri < arr.length - 1 ? "0.5px solid rgba(255,255,255,0.05)" : "none" }}>
              <div className="px-3 py-3.5 flex items-center"><span className="font-jakarta text-[12px] text-wo-crema-muted">{row.label}</span></div>
              {row.vals.map((v, i) => (
                <div key={i} className="px-3 py-3.5 flex items-center justify-center" style={{ borderLeft: "0.5px solid rgba(255,255,255,0.05)" }}>
                  <span className="font-syne font-bold text-[13px]" style={{ color: row.colors[i] }}>{v}</span>
                </div>
              ))}
            </div>
          ))}
          </div>
        </div>
      </section>

      {/* ══ CÓMO FUNCIONA — con imágenes ══════════════════════════════════ */}
      <section id="como-funciona" className="max-w-4xl mx-auto px-4 sm:px-6 mb-16 scroll-mt-24">
        <p className="font-jakarta text-[11px] font-bold uppercase tracking-[0.12em] text-wo-crema-muted/35 text-center mb-8">Cómo funciona</p>
        <div ref={stepsRef.ref} className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          style={{ opacity: stepsRef.visible ? 1 : 0, transform: stepsRef.visible ? "translateY(0)" : "translateY(20px)", transition: "opacity 0.5s ease, transform 0.5s ease" }}>
          {([
            {
              img:  "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=500&h=280&fit=crop&q=80",
              icon: <Target size={18} />, iconBg: "rgba(232,116,26,0.15)", iconBorder: "rgba(232,116,26,0.3)", iconColor: "hsl(var(--primary))",
              n: "01", title: "Activa", desc: "Elige tu membresía. Obtendrás bonos especiales de bienvenida con tu paquete de inicio.",
              note: "Sin comisiones en este paso", noteColor: "rgba(232,116,26,0.8)",
            },
            {
              img:  "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=500&h=280&fit=crop&q=80",
              icon: <Share2 size={18} />, iconBg: "rgba(30,192,213,0.15)", iconBorder: "rgba(30,192,213,0.3)", iconColor: "hsl(var(--secondary))",
              n: "02", title: "Comparte", desc: "Comparte tu enlace. Cada persona que se una entra a tu red y la activa.",
              note: "Tu red crece automáticamente", noteColor: "hsl(var(--secondary))",
            },
            {
              img:  "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=500&h=280&fit=crop&q=80",
              icon: <Wallet size={18} />, iconBg: "rgba(201,146,10,0.15)", iconBorder: "rgba(201,146,10,0.3)", iconColor: "#C9920A",
              n: "03", title: "Cobra", desc: "Cada recompra mensual de tu red genera comisiones hasta tus niveles activos.",
              note: "Residual desde la 1ª recompra ✓", noteColor: "#C9920A",
            },
          ] as const).map((s, idx) => (
            <div key={s.n} className="rounded-2xl overflow-hidden flex flex-col"
              style={{
                background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.07)",
                opacity: stepsRef.visible ? 1 : 0, transform: stepsRef.visible ? "translateY(0)" : "translateY(20px)",
                transition: `opacity 0.5s ${idx * 120}ms, transform 0.5s ${idx * 120}ms ease-out`,
              }}>
              {/* Imagen */}
              <div className="relative h-36 overflow-hidden">
                <img src={s.img} alt={s.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(10,16,32,0.85) 0%, transparent 50%)" }} />
                {/* Step number */}
                <span className="absolute top-3 left-3 font-syne font-bold text-[11px] px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(10,16,32,0.7)", color: "rgba(248,244,236,0.4)", border: "0.5px solid rgba(255,255,255,0.1)" }}>{s.n}</span>
                {/* Icon chip sobre la imagen */}
                <div className="absolute bottom-3 left-3 flex items-center gap-2 px-2.5 py-1.5 rounded-xl"
                  style={{ background: "rgba(10,16,32,0.75)", backdropFilter: "blur(8px)", border: `0.5px solid ${s.iconBorder}` }}>
                  <span style={{ color: s.iconColor }}>{s.icon}</span>
                  <span className="font-syne font-extrabold text-[15px] text-wo-crema">{s.title}</span>
                </div>
              </div>
              {/* Texto */}
              <div className="p-4 flex flex-col gap-2 flex-1">
                <p className="font-jakarta text-[13px] text-wo-crema-muted leading-relaxed">{s.desc}</p>
                <span className="font-jakarta text-[11px] font-bold mt-auto" style={{ color: s.noteColor }}>{s.note}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ DIFERENCIA CLAVE — con imágenes ═══════════════════════════════ */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 mb-16">
        <div ref={diffRef.ref} className="grid grid-cols-1 sm:grid-cols-2 gap-3"
          style={{ opacity: diffRef.visible ? 1 : 0, transform: diffRef.visible ? "translateY(0)" : "translateY(20px)", transition: "opacity 0.5s ease, transform 0.5s ease" }}>

          {/* Primera compra */}
          <div className="rounded-2xl overflow-hidden" style={{ border: "0.5px solid rgba(232,116,26,0.22)" }}>
            <div className="relative h-36">
              <img src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=280&fit=crop&q=80"
                alt="Primera compra" className="w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(10,16,32,1) 0%, rgba(10,16,32,0.3) 60%, transparent 100%)" }} />
            </div>
            <div className="p-5 flex flex-col gap-2" style={{ background: "rgba(232,116,26,0.05)" }}>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(232,116,26,0.15)", color: "hsl(var(--primary))" }}><Target size={14} /></div>
                <p className="font-syne font-extrabold text-[15px] text-wo-crema">Primera compra</p>
              </div>
              <p className="font-jakarta text-[12px] text-wo-crema-muted leading-relaxed">
                Activa tu red adquiriendo el plan de tu preferencia y recibe bonos especiales de bienvenida.
              </p>
              <span className="self-start font-jakarta text-[11px] font-bold px-3 py-1 rounded-full mt-1"
                style={{ background: "rgba(232,116,26,0.12)", color: "hsl(var(--primary))", border: "0.5px solid rgba(232,116,26,0.25)" }}>
                Sin comisiones
              </span>
            </div>
          </div>

          {/* Recompra mensual */}
          <div className="rounded-2xl overflow-hidden" style={{ border: "0.5px solid rgba(30,192,213,0.22)" }}>
            <div className="relative h-36">
              <img src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=600&h=280&fit=crop&q=80"
                alt="Recompra mensual" className="w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(10,16,32,1) 0%, rgba(10,16,32,0.3) 60%, transparent 100%)" }} />
            </div>
            <div className="p-5 flex flex-col gap-2" style={{ background: "rgba(30,192,213,0.05)" }}>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(30,192,213,0.15)", color: "hsl(var(--secondary))" }}><RefreshCw size={14} /></div>
                <p className="font-syne font-extrabold text-[15px] text-wo-crema">Recompra mensual</p>
              </div>
              <p className="font-jakarta text-[12px] text-wo-crema-muted leading-relaxed">
                50% off para todos los activos. Estas compras sí generan comisiones en tu red.
              </p>
              <span className="self-start font-jakarta text-[11px] font-bold px-3 py-1 rounded-full mt-1"
                style={{ background: "rgba(30,192,213,0.12)", color: "hsl(var(--secondary))", border: "0.5px solid rgba(30,192,213,0.25)" }}>
                Genera comisiones ✓
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ══ RECOMPRA STRIP ════════════════════════════════════════════════ */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 mb-16">
        <div ref={recompRef.ref} className="rounded-2xl overflow-hidden"
          style={{
            border: "0.5px solid rgba(30,192,213,0.18)",
            opacity: recompRef.visible ? 1 : 0, transform: recompRef.visible ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.5s ease, transform 0.5s ease",
          }}>
          {/* Banner image top */}
          <div className="relative h-32 overflow-hidden">
            <img src="https://images.unsplash.com/photo-1556742044-3c52d6e88c62?w=1200&h=300&fit=crop&q=80"
              alt="Recompra" className="w-full h-full object-cover object-top" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(10,16,32,0.3) 0%, rgba(10,16,32,0.85) 100%)" }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="font-jakarta text-[10px] font-bold uppercase tracking-widest text-wo-crema/50 mb-1">Beneficios para afiliados activos</p>
                <span className="font-syne font-extrabold leading-none" style={{ fontSize: "clamp(36px,7vw,48px)", color: "hsl(var(--secondary))" }}>Hasta 55% OFF</span>
                <p className="font-jakarta text-sm text-wo-crema-muted">en membresía y recompras mensuales según tu plan</p>
              </div>
            </div>
          </div>
          {/* Checks */}
          <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-3" style={{ background: "rgba(30,192,213,0.04)" }}>
            {["Sin importar tu plan de membresía", "Aplica a toda la tienda, sin mínimo", "Genera comisiones para tu red ✓"].map(t => (
              <div key={t} className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(30,192,213,0.15)" }}>
                  <Check size={10} style={{ color: "hsl(var(--secondary))" }} />
                </div>
                <span className="font-jakarta text-[13px] text-wo-crema-muted">{t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FAQ ═══════════════════════════════════════════════════════════ */}
      <section className="max-w-2xl mx-auto px-4 sm:px-6 mb-14">
        <p className="font-jakarta text-[11px] font-bold uppercase tracking-[0.12em] text-wo-crema-muted/35 text-center mb-6">Preguntas frecuentes</p>
        <div className="space-y-2">
          {FAQS.map((f, i) => <FaqItem key={f.q} q={f.q} a={f.a} delay={i * 80} />)}
        </div>
      </section>

      {/* ══ BOTTOM CTA ════════════════════════════════════════════════════ */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <p className="font-jakarta text-sm text-wo-crema-muted mb-3">¿Ya tienes una cuenta?</p>
        <Link to="/login-afiliado"
          className="inline-flex items-center gap-1.5 font-jakarta font-semibold text-sm transition-colors hover:text-wo-crema"
          style={{ color: "hsl(var(--secondary))" }}>
          Inicia sesión en tu área de afiliado <ChevronRight size={14} />
        </Link>
      </section>

    </div>
  );
}
