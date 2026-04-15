import { Link } from "react-router-dom";
import { Star, TrendingUp, ShoppingBag, Award, Store } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";
import { useProducts } from "@/hooks/useProducts";
import ProductCard from "@/components/ProductCard";
import { useScrollReveal } from "@/hooks/useScrollReveal";

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

  const refWhy        = useScrollReveal<HTMLElement>();
  const refCommission = useScrollReveal<HTMLElement>();
  const refProducts   = useScrollReveal<HTMLElement>();
  const refTestimonials = useScrollReveal<HTMLElement>();
  const refCta        = useScrollReveal<HTMLElement>();
  useSEO({
    title: "Winclick Perú | Gana Comisiones con Productos Orgánicos",
    description: "Únete a Winclick y gana hasta 25% de comisiones vendiendo productos orgánicos y premium. Red de 10 niveles. Empieza tu negocio desde casa en Perú. ¡Regístrate gratis!",
    canonical: "https://winclick.pe/",
    ogImage: "https://winclick.pe/foto-index.webp",
  });

  return (
    <div className="min-h-screen bg-background">
      {/* HERO */}
      <section className="relative min-h-screen flex overflow-hidden bg-wo-obsidiana">

        {/* LEFT — contenido */}
        <div className="flex-1 flex items-center px-6 sm:px-10 lg:px-16 pt-28 pb-16 relative z-10">
          <div className="w-full max-w-[540px]">

            {/* Eyebrow */}
            <p className="font-jakarta text-[11px] font-bold tracking-[0.22em] uppercase text-primary mb-7">
              Winclick · Perú · Negocio desde casa
            </p>

            {/* Headline */}
            <h1 className="font-syne font-extrabold text-[44px] sm:text-[54px] lg:text-[66px] leading-[1.05] tracking-[-0.02em] text-wo-crema mb-6">
              Gana desde casa vendiendo lo que la gente ama.
            </h1>

            <p className="font-jakarta text-[16px] text-wo-crema-muted leading-[1.7] mb-10 max-w-[420px]">
              Productos orgánicos premium con una red de 10 niveles que trabaja para ti. Más de 2,400 socios ya generan ingresos reales en Winclick.
            </p>

            {/* Un solo CTA */}
            <Link
              to="/registro-afiliado"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-jakarta font-bold text-[15px] px-8 py-4 rounded-wo-btn hover:bg-wo-oro-dark transition-colors min-h-[52px]"
            >
              Quiero ser socio →
            </Link>

            {/* Stats limpias */}
            <div className="flex gap-8 mt-12 pt-8" style={{ borderTop: "0.5px solid rgba(255,255,255,0.1)" }}>
              {[
                { num: "+2,400", label: "Socios activos" },
                { num: "25%",    label: "Comisión máxima" },
                { num: "10",     label: "Niveles de red" },
              ].map((s, i) => (
                <div key={i}>
                  <p className="font-syne font-extrabold text-[28px] text-wo-crema">{s.num}</p>
                  <p className="font-jakarta text-[12px] text-wo-crema-muted mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT — foto lifestyle (desktop) */}
        <div className="hidden lg:block relative w-[46vw] shrink-0 min-h-screen">
          {/* Foto principal — persona real, aspiracional */}
          <img
            src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=960&h=1080&fit=crop&crop=top&auto=format&q=88"
            alt="Socia Winclick exitosa"
            className="w-full h-full object-cover"
          />
          {/* Fade izquierda para fusionar con el fondo */}
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(90deg, hsl(214,30%,5%) 0%, transparent 22%)" }}
          />
          {/* Fade inferior */}
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to top, hsl(214,30%,5%) 0%, transparent 18%)" }}
          />

          {/* Floating card — testimonio real */}
          <div
            className="absolute bottom-14 left-10 bg-wo-grafito/90 backdrop-blur-md rounded-xl px-5 py-4"
            style={{ border: "0.5px solid rgba(255,255,255,0.1)", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}
          >
            <p className="font-syne font-extrabold text-[22px] text-primary">S/ 3,800</p>
            <p className="font-jakarta text-[12px] text-wo-crema mt-0.5">Daniela Vega · Rango VIP · /mes</p>
          </div>

          {/* Floating card — socios activos */}
          <div
            className="absolute top-32 right-8 bg-wo-grafito/85 backdrop-blur-md rounded-xl px-4 py-3"
            style={{ border: "0.5px solid rgba(255,255,255,0.08)", boxShadow: "0 8px 24px rgba(0,0,0,0.3)" }}
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-secondary" />
              <p className="font-jakarta text-[12px] font-semibold text-wo-crema">+2,400 socios activos</p>
            </div>
          </div>
        </div>

        {/* Mobile: imagen de fondo suave */}
        <div className="absolute inset-0 lg:hidden">
          <img
            src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&h=1000&fit=crop&crop=top&auto=format&q=75"
            alt=""
            className="w-full h-full object-cover object-top"
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(5,12,28,0.88) 0%, rgba(5,12,28,0.75) 50%, rgba(5,12,28,0.95) 100%)" }} />
        </div>

      </section>

      {/* WHY WINCLICK */}
      <section ref={refWhy} className="reveal bg-wo-grafito overflow-hidden">
        {/* Grid full-width — sin max-w para que las imágenes vayan de borde a borde */}
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[620px]">

          {/* Imagen lifestyle — izquierda */}
          <div className="relative min-h-[340px] lg:min-h-full overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=900&h=700&fit=crop&crop=center&auto=format&q=85"
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 hidden lg:block" style={{ background: "linear-gradient(270deg, hsl(214,25%,9%) 0%, transparent 30%)" }} />
            <div
              className="absolute bottom-8 left-8 bg-wo-carbon/90 backdrop-blur-md rounded-xl px-5 py-4"
              style={{ border: "0.5px solid rgba(255,255,255,0.1)" }}
            >
              <p className="font-jakarta text-[11px] text-wo-crema-muted mb-1">Comisión promedio mensual</p>
              <p className="font-syne font-extrabold text-[26px] text-primary">S/ 1,200</p>
            </div>
          </div>

          {/* Contenido — derecha */}
          <div className="flex flex-col justify-center px-8 sm:px-14 lg:px-16 xl:px-20 py-16">
            <p className="font-jakarta text-[11px] font-bold tracking-[0.22em] uppercase text-primary mb-5">Por qué Winclick</p>
            <h2 className="font-syne font-extrabold text-[32px] sm:text-[38px] text-wo-crema leading-[1.1] mb-10">
              No solo vendes.<br />Construyes un negocio.
            </h2>
            <div className="space-y-8">
              {[
                { icon: <TrendingUp size={20} />, color: "primary", title: "Comisiones multinivel", desc: "Gana por tus ventas y las de toda tu red, hasta 10 niveles de profundidad." },
                { icon: <ShoppingBag size={20} />, color: "secondary", title: "Productos que se recompran", desc: "Orgánicos premium que la gente ama. Tus clientes vuelven sin que los llames." },
                { icon: <Award size={20} />, color: "primary", title: "Rangos y bonos exclusivos", desc: "Sube de rango, desbloquea bonos mensuales, viajes y beneficios reales." },
                { icon: <Store size={20} />, color: "secondary", title: "Tu tienda personalizada", desc: "Tienda online con tu nombre. Comparte el link y vende mientras duermes." },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-5">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${item.color === "primary" ? "bg-primary/15 text-primary" : "bg-secondary/15 text-secondary"}`}>
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="font-jakarta font-bold text-[15px] text-wo-crema mb-1">{item.title}</h3>
                    <p className="font-jakarta text-[14px] text-wo-crema-muted leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* COMMISSION STRUCTURE */}
      <section ref={refCommission} className="reveal bg-background overflow-hidden">
        {/* Grid full-width */}
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[580px]">

            {/* Contenido — izquierda */}
            <div className="flex flex-col justify-center px-8 sm:px-14 lg:px-16 xl:px-20 py-16">
              <p className="font-jakarta text-[11px] font-bold tracking-[0.22em] uppercase text-primary mb-5">Estructura de comisiones</p>
              <h2 className="font-syne font-extrabold text-[32px] sm:text-[38px] text-wo-crema leading-[1.1] mb-3">
                Mientras más crece tu red, más ganas tú.
              </h2>
              <p className="font-jakarta text-[15px] text-wo-crema-muted mb-10 max-w-[400px] leading-relaxed">
                10 niveles de comisiones. Hasta 25% acumulado. Cuanto más profunda tu red, más ingresos pasivos recibes.
              </p>

              <div className="space-y-3 max-w-md">
                {COMMISSION_LEVELS.map((cl) => {
                  const maxPct = 10;
                  const barWidth = Math.max(12, (cl.percentage / maxPct) * 100);
                  const isSpike = cl.level === 8;
                  return (
                    <div key={cl.level} className="flex items-center gap-4 group">
                      <span className="font-jakarta text-[12px] text-wo-crema-muted w-12 shrink-0">Niv. {cl.level}</span>
                      <div className="flex-1 h-9 rounded-lg overflow-hidden bg-wo-grafito relative">
                        <div
                          className="h-full rounded-lg flex items-center px-3 transition-all group-hover:brightness-110"
                          style={{
                            width: `${barWidth}%`,
                            background: isSpike
                              ? "hsl(var(--wo-oro))"
                              : cl.level <= 3
                              ? "rgba(232,116,26,0.9)"
                              : cl.level <= 7
                              ? "rgba(232,116,26,0.55)"
                              : "rgba(232,116,26,0.32)",
                          }}
                        >
                          <span className="font-jakarta font-bold text-[12px] text-white whitespace-nowrap">
                            {cl.percentage}%{isSpike && " ★"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div className="flex items-center justify-between pt-3 mt-1" style={{ borderTop: "0.5px solid rgba(255,255,255,0.08)" }}>
                  <p className="font-jakarta text-[11px] text-wo-crema-muted">★ Nivel 8: spike especial para red profunda</p>
                  <p className="font-jakarta text-[12px] text-primary font-bold">25% total</p>
                </div>
              </div>
            </div>

            {/* Imagen — derecha */}
            <div className="relative min-h-[320px] lg:min-h-auto overflow-hidden bg-wo-grafito">
              <img
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=900&h=700&fit=crop&crop=center&auto=format&q=85"
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, hsl(214,30%,5%) 0%, transparent 30%)" }} />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, hsl(214,30%,5%) 0%, transparent 20%)" }} />
              {/* Stat flotante */}
              <div
                className="absolute top-12 left-10 bg-wo-grafito/90 backdrop-blur-md rounded-xl px-5 py-4"
                style={{ border: "0.5px solid rgba(255,255,255,0.1)" }}
              >
                <p className="font-jakarta text-[11px] text-wo-crema-muted mb-1">Comisión acumulada</p>
                <p className="font-syne font-extrabold text-[28px] text-primary">25%</p>
              </div>
            </div>

          </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section ref={refProducts} className="reveal bg-wo-grafito py-20">
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
      <section ref={refTestimonials} className="reveal bg-background py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p className="font-jakarta text-[11px] font-bold tracking-[0.22em] uppercase text-primary mb-4">Socios que ya ganan</p>
            <h2 className="font-syne font-extrabold text-[32px] sm:text-[38px] text-wo-crema leading-[1.1]">
              Historias reales de éxito.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                name: "Lucía Ramírez",
                rank: "VIP",
                text: "En 3 meses ya tengo 8 referidos directos y mis comisiones crecen cada semana. Winclick cambió mi vida.",
                earning: "S/ 1,200",
                photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop&crop=faces&auto=format&q=85",
              },
              {
                name: "Fernando Castillo",
                rank: "Intermedio",
                text: "Los productos se venden solos. Mis clientes recompran cada mes y mi red sigue creciendo.",
                earning: "S/ 650",
                photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=faces&auto=format&q=85",
              },
              {
                name: "Daniela Vega",
                rank: "VIP",
                text: "Empecé como hobby y hoy es mi ingreso principal. La estructura de comisiones es justa y transparente.",
                earning: "S/ 3,800",
                photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&h=120&fit=crop&crop=faces&auto=format&q=85",
              },
              {
                name: "Miguel Torres",
                rank: "Básico",
                text: "Llevo apenas un mes y ya generé mis primeras comisiones. El soporte del equipo es increíble.",
                earning: "S/ 280",
                photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop&crop=faces&auto=format&q=85",
              },
            ].map((t, i) => (
              <div
                key=