import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Star, CheckCircle, Zap, TrendingUp, ShoppingBag,
  ArrowRight, Clock, Gift, Users, Shield,
} from "lucide-react";

// ── Fecha límite: 30 de abril 2026 a las 23:59:59 ──────────────────────────
const PROMO_END = new Date("2026-04-30T23:59:59");
const PROMO_PARAM = "?promo=abril";
const DISCOUNT = 0.40; // 40 %
const MIN_ACTIVATION = 120; // S/ 120 antes de descuento
const DISCOUNTED_PRICE = MIN_ACTIVATION * (1 - DISCOUNT); // S/ 72

// ── Contador regresivo ─────────────────────────────────────────────────────
function useCountdown(target: Date) {
  const calc = () => {
    const diff = Math.max(0, target.getTime() - Date.now());
    return {
      days:    Math.floor(diff / 86_400_000),
      hours:   Math.floor((diff % 86_400_000) / 3_600_000),
      minutes: Math.floor((diff % 3_600_000) / 60_000),
      seconds: Math.floor((diff % 60_000) / 1_000),
      expired: diff === 0,
    };
  };
  const [time, setTime] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setTime(calc()), 1_000);
    return () => clearInterval(id);
  }, []);
  return time;
}

function CountdownBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center font-syne font-extrabold text-2xl sm:text-3xl text-wo-crema"
        style={{ background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.12)" }}
      >
        {String(value).padStart(2, "0")}
      </div>
      <span className="font-jakarta text-[10px] text-wo-crema/40 mt-1.5 uppercase tracking-widest">{label}</span>
    </div>
  );
}

// ── Beneficios del programa ────────────────────────────────────────────────
const benefits = [
  { icon: <TrendingUp size={18} />, title: "Comisiones desde el día 1", desc: "Gana por cada venta que realices o que haga tu red directa." },
  { icon: <Users size={18} />, title: "Red de nivel 1", desc: "Construye tu equipo y multiplica tus ingresos mes a mes." },
  { icon: <ShoppingBag size={18} />, title: "Precio de socio permanente", desc: "Accede a productos al precio de afiliado de por vida, no solo en promo." },
  { icon: <Shield size={18} />, title: "Tienda propia online", desc: "Tu URL personalizada lista para compartir en redes sociales." },
];

// ── Pasos ──────────────────────────────────────────────────────────────────
const steps = [
  { n: "01", title: "Regístrate gratis", desc: "Crea tu cuenta en menos de 2 minutos. Sin costo de membresía." },
  { n: "02", title: "Elige tu kit de activación", desc: `Compra S/ ${MIN_ACTIVATION} en productos del catálogo. Con el 40% OFF pagas solo S/ ${DISCOUNTED_PRICE}.` },
  { n: "03", title: "Empieza a ganar", desc: "Tu cuenta queda activa en nivel 1 y empiezas a generar comisiones." },
];

// ── Testimonios ────────────────────────────────────────────────────────────
const testimonials = [
  { name: "Valeria R.", role: "Afiliada nivel 1", quote: "En mi primer mes recuperé la inversión y tuve S/ 400 de ganancia. No esperaba que fuera tan rápido.", avatar: "VR" },
  { name: "Carlos M.", role: "Afiliado nivel 1", quote: "El catálogo de productos se vende solo. Mis clientes repiten cada mes y yo solo me encargo de compartir mi tienda.", avatar: "CM" },
  { name: "Sofía T.", role: "Afiliada activa", quote: "Me uní por el descuento en productos y me quedé por las comisiones. Ya llevo 3 meses y no me arrepiento.", avatar: "ST" },
];

// ── Comparativa de precio ──────────────────────────────────────────────────
const priceItems = [
  { name: "Kit Bienvenida Básico", normal: 168, promo: 101 },
  { name: "Pack Nutrición Esencial", normal: 210, promo: 126 },
  { name: "Combo Bienestar Diario", normal: 195, promo: 117 },
];

export default function PromoAbril() {
  const { days, hours, minutes, seconds, expired } = useCountdown(PROMO_END);
  const navigate = useNavigate();

  const goRegister = () => navigate(`/registro-afiliado${PROMO_PARAM}`);
  const goCatalog  = () => navigate(`/catalogo${PROMO_PARAM}`);

  return (
    <div className="min-h-screen bg-wo-obsidiana flex flex-col">

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative pt-24 pb-16 sm:pt-32 sm:pb-24 overflow-hidden">
        {/* Fondo degradado decorativo */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full opacity-20"
            style={{ background: "radial-gradient(ellipse, hsl(var(--wo-oro)) 0%, transparent 70%)", filter: "blur(80px)" }}
          />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full font-jakarta text-xs font-bold text-primary mb-6"
            style={{ background: "rgba(232,116,26,0.12)", border: "0.5px solid rgba(232,116,26,0.35)" }}>
            <Zap size={12} className="fill-primary" />
            Oferta de lanzamiento · Solo abril 2026
          </div>

          <h1 className="font-syne font-extrabold text-[38px] sm:text-[54px] lg:text-[64px] leading-[1.05] tracking-[-0.02em] text-wo-crema mb-5">
            Únete hoy con{" "}
            <span className="text-primary">40% OFF</span>
            <br className="hidden sm:block" />
            {" "}y empieza a ganar
          </h1>

          <p className="font-jakarta text-[16px] sm:text-[18px] text-wo-crema-muted leading-[1.7] max-w-xl mx-auto mb-10">
            Activa tu cuenta de afiliado comprando un kit de productos desde{" "}
            <span className="text-wo-crema font-semibold">S/ {MIN_ACTIVATION}</span>{" "}
            de lista. Con el descuento de lanzamiento lo pagas solo{" "}
            <span className="text-primary font-bold">S/ {DISCOUNTED_PRICE}</span>.
          </p>

          {/* Countdown */}
          {!expired ? (
            <div className="mb-10">
              <p className="font-jakarta text-[11px] text-wo-crema/40 uppercase tracking-widest mb-3 flex items-center justify-center gap-1.5">
                <Clock size={11} /> La oferta vence en
              </p>
              <div className="flex items-center justify-center gap-3 sm:gap-4">
                <CountdownBlock value={days}    label="días" />
                <span className="font-syne font-extrabold text-2xl text-wo-crema/30 mb-5">:</span>
                <CountdownBlock value={hours}   label="horas" />
                <span className="font-syne font-extrabold text-2xl text-wo-crema/30 mb-5">:</span>
                <CountdownBlock value={minutes} label="minutos" />
                <span className="font-syne font-extrabold text-2xl text-wo-crema/30 mb-5">:</span>
                <CountdownBlock value={seconds} label="segundos" />
              </div>
            </div>
          ) : (
            <div className="mb-10 py-3 px-5 rounded-xl inline-block font-jakarta text-sm font-bold text-destructive"
              style={{ background: "rgba(239,68,68,0.1)", border: "0.5px solid rgba(239,68,68,0.3)" }}>
              Esta promoción ha vencido
            </div>
          )}

          {/* CTAs */}
          {!expired && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={goRegister}
                className="flex items-center gap-2 bg-primary text-primary-foreground font-jakarta font-bold text-[15px] px-8 py-4 rounded-wo-btn hover:bg-wo-oro-dark transition-colors min-h-[52px] w-full sm:w-auto justify-center"
              >
                <Star size={16} className="fill-primary-foreground" />
                Quiero unirme con 40% OFF
                <ArrowRight size={16} />
              </button>
              <button
                onClick={goCatalog}
                className="flex items-center gap-2 font-jakarta font-semibold text-[14px] text-wo-crema-muted hover:text-wo-crema px-6 py-4 rounded-wo-btn bg-wo-grafito hover:bg-wo-carbon transition-colors min-h-[52px] w-full sm:w-auto justify-center"
                style={{ border: "0.5px solid rgba(255,255,255,0.1)" }}
              >
                Ver productos del kit
              </button>
            </div>
          )}

          {/* Trust badges */}
          <div className="mt-8 flex items-center justify-center gap-6 flex-wrap">
            {["Sin costo de membresía", "Activación inmediata", "Soporte incluido"].map((t) => (
              <div key={t} className="flex items-center gap-1.5 font-jakarta text-[12px] text-wo-crema/50">
                <CheckCircle size={12} className="text-secondary" />
                {t}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRECIO COMPARATIVO ───────────────────────────────────────────── */}
      <section className="py-16 bg-wo-grafito">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <p className="font-jakarta text-[11px] font-bold tracking-[0.22em] uppercase text-secondary mb-3">Tu ahorro real</p>
            <h2 className="font-syne font-extrabold text-[28px] sm:text-[36px] text-wo-crema leading-tight">
              Ve cuánto ahorras en tu kit
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            {priceItems.map((item) => {
              const saving = item.normal - item.promo;
              return (
                <div key={item.name} className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
                  <p className="font-jakarta text-sm font-semibold text-wo-crema mb-4">{item.name}</p>
                  <div className="flex items-end gap-2 mb-1">
                    <span className="font-syne font-extrabold text-2xl text-primary">S/ {item.promo}</span>
                    <span className="font-jakarta text-sm text-wo-crema/30 line-through mb-0.5">S/ {item.normal}</span>
                  </div>
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-jakarta text-[11px] font-bold text-secondary"
                    style={{ background: "rgba(30,192,213,0.1)", border: "0.5px solid rgba(30,192,213,0.25)" }}>
                    <Gift size={10} /> Ahorras S/ {saving}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Resumen del ahorro */}
          <div className="rounded-2xl p-6 text-center"
            style={{ background: "rgba(232,116,26,0.06)", border: "0.5px solid rgba(232,116,26,0.25)" }}>
            <p className="font-jakarta text-sm text-wo-crema-muted mb-1">Kit mínimo de activación (S/ {MIN_ACTIVATION} de lista)</p>
            <div className="flex items-center justify-center gap-3">
              <span className="font-jakarta text-lg text-wo-crema/30 line-through">S/ {MIN_ACTIVATION}</span>
              <span className="font-syne font-extrabold text-3xl text-primary">S/ {DISCOUNTED_PRICE}</span>
            </div>
            <p className="font-jakarta text-[12px] text-secondary mt-2">
              Ahorra S/ {MIN_ACTIVATION - DISCOUNTED_PRICE} · 40% de descuento solo este mes
            </p>
          </div>
        </div>
      </section>

      {/* ── CÓMO FUNCIONA ────────────────────────────────────────────────── */}
      <section className="py-16 bg-wo-obsidiana">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <p className="font-jakarta text-[11px] font-bold tracking-[0.22em] uppercase text-primary mb-3">Simple y rápido</p>
            <h2 className="font-syne font-extrabold text-[28px] sm:text-[36px] text-wo-crema leading-tight">
              3 pasos para empezar a ganar
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {steps.map((s, i) => (
              <div key={s.n} className="relative">
                {/* Conector entre pasos */}
                {i < steps.length - 1 && (
                  <div className="hidden sm:block absolute top-8 left-[calc(100%+0px)] w-6 h-px bg-wo-crema/10 z-10" />
                )}
                <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
                  <span className="font-syne font-extrabold text-[40px] text-primary/20 leading-none block mb-3">{s.n}</span>
                  <h3 className="font-syne font-bold text-[17px] text-wo-crema mb-2">{s.title}</h3>
                  <p className="font-jakarta text-[13px] text-wo-crema-muted leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BENEFICIOS ──────────────────────────────────────────────────── */}
      <section className="py-16 bg-wo-grafito">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <p className="font-jakarta text-[11px] font-bold tracking-[0.22em] uppercase text-secondary mb-3">Por qué unirte</p>
            <h2 className="font-syne font-extrabold text-[28px] sm:text-[36px] text-wo-crema leading-tight">
              Lo que obtienes como afiliado
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {benefits.map((b) => (
              <div key={b.title} className="flex items-start gap-4 rounded-2xl p-5"
                style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-secondary"
                  style={{ background: "rgba(30,192,213,0.1)", border: "0.5px solid rgba(30,192,213,0.2)" }}>
                  {b.icon}
                </div>
                <div>
                  <h3 className="font-jakarta font-bold text-[15px] text-wo-crema mb-1">{b.title}</h3>
                  <p className="font-jakarta text-[13px] text-wo-crema-muted leading-relaxed">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIOS ─────────────────────────────────────────────────── */}
      <section className="py-16 bg-wo-obsidiana">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <p className="font-jakarta text-[11px] font-bold tracking-[0.22em] uppercase text-primary mb-3">Resultados reales</p>
            <h2 className="font-syne font-extrabold text-[28px] sm:text-[36px] text-wo-crema leading-tight">
              Lo que dicen nuestros afiliados
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-5">
            {testimonials.map((t) => (
              <div key={t.name} className="rounded-2xl p-5 flex flex-col gap-4"
                style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
                {/* Estrellas */}
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={12} className="text-primary fill-primary" />
                  ))}
                </div>
                <p className="font-jakarta text-[13px] text-wo-crema-muted leading-relaxed flex-1">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground font-jakarta font-bold text-xs flex items-center justify-center flex-shrink-0">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-jakarta font-bold text-[13px] text-wo-crema">{t.name}</p>
                    <p className="font-jakarta text-[11px] text-wo-crema/40">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ───────────────────────────────────────────────────── */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full opacity-15"
            style={{ background: "radial-gradient(ellipse, hsl(var(--wo-oro)) 0%, transparent 70%)", filter: "blur(70px)" }}
          />
        </div>
        <div className="relative max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full font-jakarta text-xs font-bold text-primary mb-6"
            style={{ background: "rgba(232,116,26,0.12)", border: "0.5px solid rgba(232,116,26,0.35)" }}>
            <Clock size={12} />
            {!expired ? `${days}d ${hours}h ${minutes}m restantes` : "Oferta vencida"}
          </div>

          <h2 className="font-syne font-extrabold text-[32px] sm:text-[44px] text-wo-crema leading-[1.1] mb-5">
            No dejes pasar esta oportunidad
          </h2>
          <p className="font-jakarta text-[15px] text-wo-crema-muted mb-10 max-w-md mx-auto leading-relaxed">
            Esta es la mejor condición de ingreso que ofrecemos. El 40% de descuento solo está disponible durante abril.
          </p>

          {!expired ? (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={goRegister}
                className="flex items-center gap-2 bg-primary text-primary-foreground font-jakarta font-bold text-[15px] px-8 py-4 rounded-wo-btn hover:bg-wo-oro-dark transition-colors min-h-[52px] w-full sm:w-auto justify-center"
              >
                <Star size={16} className="fill-primary-foreground" />
                Activar mi cuenta ahora
                <ArrowRight size={16} />
              </button>
              <Link
                to="/programa-afiliados"
                className="flex items-center gap-2 font-jakarta font-semibold text-[14px] text-wo-crema-muted hover:text-wo-crema px-6 py-4 rounded-wo-btn transition-colors min-h-[52px] w-full sm:w-auto justify-center"
              >
                Más información del programa
              </Link>
            </div>
          ) : (
            <Link
              to="/programa-afiliados"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-jakarta font-bold text-[15px] px-8 py-4 rounded-wo-btn hover:bg-wo-oro-dark transition-colors min-h-[52px]"
            >
              Ver opciones de afiliación
              <ArrowRight size={16} />
            </Link>
          )}
        </div>
      </section>

    </div>
  );
}
