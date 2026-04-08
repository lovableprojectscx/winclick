import { Link } from "react-router-dom";
import { Star, TrendingUp, ShoppingBag, Award, Store } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";
import { useProducts } from "@/hooks/useProducts";
import ProductCard from "@/components/ProductCard";

const COMMISSION_LEVELS = [
  { level: 1, percentage: 10 },
  { level: 2, percentage: 4 },
  { level: 3, percentage: 2 },
  { level: 4, percentage: 2 },
  { level: 5, percentage: 1 },
  { level: 6, percentage: 1 },
  { level: 7, percentage: 1 },
  { level: 8, percentage: 3 },
  { level: 9, percentage: 0.5 },
  { level: 10, percentage: 0.5 },
];

const testimonials = [
  { name: "Lucía Ramírez", rank: "VIP", initials: "LR", text: "En 3 meses ya tengo 8 referidos directos y mis comisiones crecen cada semana. Winclick cambió mi vida.", earning: "S/ 1,200" },
  { name: "Fernando Castillo", rank: "Intermedio", initials: "FC", text: "Los productos se venden solos. Mis clientes recompran cada mes y mi red sigue creciendo.", earning: "S/ 650" },
  { name: "Daniela Vega", rank: "VIP", initials: "DV", text: "Empecé como hobby y hoy es mi ingreso principal. La estructura de comisiones es justa y transparente.", earning: "S/ 3,800" },
  { name: "Miguel Torres", rank: "Básico", initials: "MT", text: "Llevo apenas un mes y ya generé mis primeras comisiones. El soporte del equipo es increíble.", earning: "S/ 280" },
];

export default function Index() {
  const { data: products = [], isLoading: loadingProducts } = useProducts();
  const featuredProducts = products.slice(0, 4);
  useSEO({
    title: "Winclick Perú | Gana Comisiones con Productos Orgánicos",
    description: "Únete a Winclick y gana hasta 25% de comisiones vendiendo productos orgánicos y premium. Red de 10 niveles. Empieza tu negocio desde casa en Perú. ¡Regístrate gratis!",
    canonical: "https://winclick.pe/",
    ogImage: "https://winclick.pe/foto-index.webp",
  });

  return (
    <div className="min-h-screen bg-background">
      {/* HERO */}
      <section
        className="relative min-h-[90vh] flex items-center overflow-hidden"
        style={{
          backgroundImage: "url('/foto-index.webp')",
          backgroundSize: "cover",
          backgroundPosition: "center 30%",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Overlay oscuro para que el texto sea legible */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(105deg, rgba(5,12,28,0.92) 0%, rgba(5,12,28,0.80) 45%, rgba(5,12,28,0.35) 100%)" }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 relative z-10 w-full">
          <div className="max-w-[560px]">
            {/* Pill badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-wo-pill mb-8" style={{ background: "rgba(232,116,26,0.12)", border: "0.5px solid rgba(232,116,26,0.35)" }}>
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
              <span className="font-jakarta text-xs font-medium text-primary">Oportunidad de negocio real</span>
            </div>

            <h1 className="font-syne font-extrabold text-[40px] sm:text-[52px] md:text-[64px] leading-[1.1] tracking-[-0.01em] mb-6">
              <span className="block text-wo-crema">Tu red.</span>
              <span className="block text-primary">Tus ingresos.</span>
              <span className="block text-secondary">Tu libertad.</span>
            </h1>

            <p className="font-jakarta text-[15px] text-wo-crema-muted max-w-[400px] leading-[1.65] mb-8">
              Únete a la comunidad de socios que generan ingresos vendiendo productos premium y construyendo su propia red de éxito.
            </p>

            <div className="flex flex-wrap gap-3 mb-10">
              <Link to="/registro-afiliado" className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-jakarta font-bold text-sm px-6 py-3.5 rounded-wo-btn hover:bg-wo-oro-dark transition-colors min-h-[48px]">
                <Star size={14} /> Quiero ser socio
              </Link>
              <Link to="/catalogo" className="inline-flex items-center gap-2 text-wo-crema/80 font-jakarta font-bold text-sm px-6 py-3.5 rounded-wo-btn hover:text-wo-crema transition-colors min-h-[48px]" style={{ border: "0.5px solid rgba(248,244,236,0.25)" }}>
                Ver productos →
              </Link>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-0 pt-8" style={{ borderTop: "0.5px solid rgba(255,255,255,0.1)" }}>
              {[
                { num: "+2,400", label: "Socios activos" },
                { num: "25%", label: "Comisión máxima" },
                { num: "10", label: "Niveles de red" },
              ].map((s, i) => (
                <div key={i} className={`flex-1 ${i > 0 ? "pl-4 sm:pl-6 md:pl-8" : ""}`} style={i > 0 ? { borderLeft: "0.5px solid rgba(255,255,255,0.1)" } : {}}>
                  <p className="font-syne font-extrabold text-[24px] sm:text-[28px] text-primary">{s.num}</p>
                  <p className="font-jakarta text-[11px] text-wo-crema-muted mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* WHY WINCLICK */}
      <section className="bg-wo-grafito py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="font-jakarta text-[10px] font-bold tracking-[0.16em] uppercase text-primary mb-3">POR QUÉ WINCLICK</p>
          <h2 className="font-syne font-extrabold text-[26px] text-wo-crema mb-10">No solo vendes. Construyes un negocio.</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {[
              { icon: <TrendingUp size={18} />, color: "primary", title: "Comisiones multinivel", desc: "Gana por tus ventas y las de toda tu red hasta 10 niveles." },
              { icon: <ShoppingBag size={18} />, color: "secondary", title: "Productos que se venden solos", desc: "Orgánicos premium con alta recompra. Tus clientes regresan." },
              { icon: <Award size={18} />, color: "primary", title: "Rangos y bonos exclusivos", desc: "Sube de rango y accede a bonos mensuales, viajes y más." },
              { icon: <Store size={18} />, color: "secondary", title: "Tu tienda personalizada", desc: "Tienda online con tu branding. Comparte el link y vende." },
            ].map((card, i) => (
              <div key={i} className="bg-wo-carbon rounded-xl p-5" style={{ border: "0.5px solid rgba(255,255,255,0.07)" }}>
                <div className={`w-9 h-9 rounded-wo-icon flex items-center justify-center mb-3 ${card.color === "primary" ? "bg-primary/15 text-primary" : "bg-secondary/15 text-secondary"}`}>
                  {card.icon}
                </div>
                <h3 className="font-jakarta font-semibold text-sm text-wo-crema mb-1">{card.title}</h3>
                <p className="font-jakarta text-xs text-wo-crema-muted leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMMISSION STRUCTURE */}
      <section className="bg-background py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="font-jakarta text-[10px] font-bold tracking-[0.16em] uppercase text-primary mb-3">ESTRUCTURA DE COMISIONES</p>
          <h2 className="font-syne font-extrabold text-[26px] text-wo-crema mb-10">Mientras más crece tu red, más ganas tú.</h2>

          <div className="space-y-2 max-w-2xl">
            {COMMISSION_LEVELS.map((cl) => {
              const maxPct = 10;
              const barWidth = Math.max(15, (cl.percentage / maxPct) * 100);
              const unlockedBy = cl.level <= 3 ? "Básico · Intermedio · VIP" : cl.level <= 7 ? "Intermedio · VIP" : "VIP";
              const isSpike = cl.level === 8;
              return (
                <div key={cl.level} className="flex items-center gap-3 group">
                  <span className="font-jakarta text-[11px] text-wo-crema-muted w-14 shrink-0">Niv. {cl.level}</span>
                  <div className="flex-1 h-8 rounded-md overflow-hidden bg-wo-carbon relative">
                    <div
                      className="h-full rounded-md flex items-center px-3 transition-all group-hover:brightness-110"
                      style={{ width: `${barWidth}%`, background: isSpike ? "hsl(var(--wo-oro))" : cl.level <= 3 ? "rgba(232,116,26,0.85)" : cl.level <= 7 ? "rgba(232,116,26,0.55)" : "rgba(232,116,26,0.35)" }}
                    >
                      <span className="font-jakarta font-bold text-xs text-primary-foreground whitespace-nowrap">
                        {cl.percentage}% {isSpike && "★"}
                      </span>
                    </div>
                  </div>
                  <span className="font-jakarta text-[9px] text-wo-crema/30 w-32 shrink-0 hidden sm:block">{unlockedBy}</span>
                </div>
              );
            })}
            <div className="flex items-center justify-between mt-3 pt-2" style={{ borderTop: "0.5px solid rgba(255,255,255,0.07)" }}>
              <p className="font-jakarta text-[10px] text-wo-crema-muted">★ Nivel 8 tiene spike de 3% para incentivar red profunda</p>
              <p className="font-jakarta text-[10px] text-primary font-semibold">25% acumulado total</p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="bg-wo-grafito py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="font-jakarta text-[10px] font-bold tracking-[0.16em] uppercase text-primary mb-3">PRODUCTOS DESTACADOS</p>
          <h2 className="font-syne font-extrabold text-[26px] text-wo-crema mb-10">Productos que respaldan tu negocio.</h2>

          <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
            {loadingProducts
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="min-w-[240px] max-w-[240px] h-[320px] bg-wo-carbon rounded-wo-card animate-pulse" />
                ))
              : featuredProducts.map((p) => (
                  <div key={p.id} className="min-w-[240px] max-w-[240px]">
                    <ProductCard product={p} />
                  </div>
                ))
            }
          </div>

          <div className="text-center mt-8">
            <Link to="/catalogo" className="inline-flex items-center gap-2 text-wo-crema/80 font-jakarta font-bold text-sm px-6 py-3 rounded-wo-btn hover:text-wo-crema transition-colors" style={{ border: "0.5px solid rgba(248,244,236,0.2)" }}>
              Ver catálogo completo →
            </Link>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="bg-background py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="font-jakarta text-[10px] font-bold tracking-[0.16em] uppercase text-primary mb-3">SOCIOS QUE YA GANAN</p>
          <h2 className="font-syne font-extrabold text-[26px] text-wo-crema mb-10">Historias reales de éxito.</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-wo-grafito rounded-wo-card p-5" style={{ border: "0.5px solid hsl(var(--wo-oro-muted) / 0.3)" }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground font-jakarta font-bold text-xs flex items-center justify-center">
                    {t.initials}
                  </div>
                  <div>
                    <p className="font-jakarta font-semibold text-sm text-wo-crema">{t.name}</p>
                    <span className="text-[10px] font-jakarta font-bold px-2 py-0.5 rounded-wo-pill" style={{ background: "rgba(232,116,26,0.12)", color: "hsl(var(--wo-oro))", border: "0.5px solid rgba(232,116,26,0.25)" }}>
                      {t.rank}
                    </span>
                  </div>
                </div>
                <span className="text-primary text-3xl font-syne leading-none opacity-30">"</span>
                <p className="font-jakarta text-sm text-wo-crema-muted leading-relaxed -mt-4 ml-6">{t.text}</p>
                <p className="font-syne font-bold text-primary mt-4 ml-6">{t.earning} / mes</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-background py-24 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-[500px] h-[500px] rounded-full" style={{ background: "radial-gradient(circle, rgba(232,116,26,0.08) 0%, transparent 60%)" }} />
        </div>
        <div className="max-w-lg mx-auto px-4 text-center relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-wo-pill bg-secondary/10 text-secondary font-jakarta text-xs font-bold mb-6" style={{ border: "0.5px solid rgba(30,192,213,0.25)" }}>
            <Star size={10} /> Registro gratuito
          </span>
          <h2 className="font-syne font-extrabold text-[32px] text-wo-crema leading-tight mb-4">
            Empieza hoy. Tu red empieza contigo.
          </h2>
          <p className="font-jakarta text-sm text-wo-crema-muted mb-8">
            Crea tu cuenta gratis, comparte tu link y empieza a generar ingresos con productos que la gente ama.
          </p>
          <Link to="/registro-afiliado" className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-jakarta font-bold text-sm px-8 py-4 rounded-xl hover:bg-wo-oro-dark transition-colors min-h-[52px] w-full sm:w-auto">
            <Star size={14} /> Crear mi cuenta gratis
          </Link>
          <p className="font-jakarta text-[11px] text-wo-crema/30 mt-4">Sin costo de entrada · Empieza a ganar desde el día 1</p>
        </div>
      </section>
    </div>
  );
}
