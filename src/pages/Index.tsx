import { Link } from "react-router-dom";
import { Star, TrendingUp, ShoppingBag, Award, Store } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";
import { useProducts } from "@/hooks/useProducts";
import ProductCard from "@/components/ProductCard";
import { motion } from "framer-motion";
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

export default function Index() {
  const { data: products = [], isLoading: loadingProducts, isError: errorProducts } = useProducts();
  const featuredProducts = products.slice(0, 4);

  const refWhy        = useScrollReveal<HTMLElement>();
  const refCommission = useScrollReveal<HTMLElement>();
  const refProducts   = useScrollReveal<HTMLElement>();
  const refTestimonials = useScrollReveal<HTMLElement>();
  const refCta        = useScrollReveal<HTMLElement>();

  useSEO({
    title: "Winclick Perú | Gana Comisiones con Productos Orgánicos",
    description: "Únete a Winclick y gana hasta 25% de comisiones vendiendo productos orgánicos y premium. Red de 10 niveles. Empieza tu negocio desde casa en Perú. ¡Regístrate gratis\!",
    canonical: "https://winclick.online/",
    ogImage: "https://winclick.online/foto-index.webp",
  });

  return (
    <div className="min-h-screen bg-background">
      {/* HERO */}
      <section className="relative min-h-screen flex overflow-hidden bg-wo-obsidiana">

        {/* LEFT — contenido */}
        <div className="flex-1 flex items-center px-6 sm:px-10 lg:px-16 pt-28 pb-16 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="w-full max-w-[540px]"
          >

            <p className="font-jakarta text-[11px] font-bold tracking-[0.22em] uppercase text-primary mb-7">
              Winclick · Perú · Negocio desde casa
            </p>

            <h1 className="font-syne font-extrabold text-[44px] sm:text-[54px] lg:text-[66px] leading-[1.05] tracking-[-0.02em] text-wo-crema mb-6">
              Gana desde casa vendiendo lo que la gente ama.
            </h1>

            <p className="font-jakarta text-[16px] text-wo-crema-muted leading-[1.7] mb-10 max-w-[420px]">
              Productos orgánicos premium con una red de 10 niveles que trabaja para ti. Más de 2,400 socios ya generan ingresos reales en Winclick.
            </p>

            <Link
              to="/registro-afiliado"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-jakarta font-bold text-[15px] px-8 py-4 rounded-wo-btn hover:bg-wo-oro-dark transition-colors min-h-[52px]"
            >
              Quiero ser socio →
            </Link>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 1 }}
              className="flex gap-8 mt-12 pt-8" 
              style={{ borderTop: "0.5px solid rgba(255,255,255,0.1)" }}
            >
              {[
                { num: "+2,400", label: "Socios activos" },
                { num: "25%",    label: "Comisión máxima" },
                { num: "10",     label: "Niveles de red" },
              ].map((s, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + (i * 0.1), duration: 0.5 }}
                >
                  <p className="font-syne font-extrabold text-[28px] text-wo-crema">{s.num}</p>
                  <p className="font-jakarta text-[12px] text-wo-crema-muted mt-1">{s.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* RIGHT — foto lifestyle (desktop) */}
        <div className="hidden lg:block relative w-[46vw] shrink-0 min-h-screen">
          <motion.img
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=960&h=1080&fit=crop&crop=top&auto=format&q=88"
            alt="Socia Winclick exitosa"
            className="w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(90deg, hsl(214,30%,5%) 0%, transparent 22%)" }}
          />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to top, hsl(214,30%,5%) 0%, transparent 18%)" }}
          />

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
            animate={{ y: [0, -8, 0] }}
            transition={{ 
              y: { repeat: Infinity, duration: 4, ease: "easeInOut" },
              default: { delay: 1, duration: 0.8 } 
            }}
            className="absolute bottom-14 left-10 bg-wo-grafito/90 backdrop-blur-md rounded-xl px-5 py-4"
            style={{ border: "0.5px solid rgba(255,255,255,0.1)", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}
          >
            <p className="font-syne font-extrabold text-[22px] text-primary">S/ 3,800</p>
            <p className="font-jakarta text-[12px] text-wo-crema mt-0.5">Daniela Vega · Rango VIP · /mes</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            animate={{ y: [0, 6, 0] }}
            transition={{ 
              y: { repeat: Infinity, duration: 5, ease: "easeInOut" },
              default: { delay: 1.2, duration: 0.6 }
            }}
            className="absolute top-32 right-8 bg-wo-grafito/85 backdrop-blur-md rounded-xl px-4 py-3"
            style={{ border: "0.5px solid rgba(255,255,255,0.08)", boxShadow: "0 8px 24px rgba(0,0,0,0.3)" }}
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-secondary" />
              <p className="font-jakarta text-[12px] font-semibold text-wo-crema">+2,400 socios activos</p>
            </div>
          </motion.div>
        </div>

        {/* Mobile: imagen de fondo */}
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
      <motion.section 
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
        className="bg-wo-grafito overflow-hidden"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[620px]">

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
      <motion.section 
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
        className="bg-background overflow-hidden"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[580px]">

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

          <div className="relative min-h-[320px] lg:min-h-auto overflow-hidden bg-wo-grafito">
            <img
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=900&h=700&fit=crop&crop=center&auto=format&q=85"
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, hsl(214,30%,5%) 0%, transparent 30%)" }} />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, hsl(214,30%,5%) 0%, transparent 20%)" }} />
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
      <motion.section 
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
        className="bg-wo-grafito py-20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="font-jakarta text-[10px] font-bold tracking-[0.16em] uppercase text-primary mb-3">PRODUCTOS DESTACADOS</p>
          <h2 className="font-syne font-extrabold text-[26px] text-wo-crema mb-10">Productos que respaldan tu negocio.</h2>

          <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
            {loadingProducts
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="min-w-[240px] max-w-[240px] h-[320px] bg-wo-carbon rounded-wo-card animate-pulse" />
                ))
              : errorProducts
                ? <p className="font-jakarta text-sm text-wo-crema-muted py-8">No se pudo cargar productos. <button onClick={() => window.location.reload()} className="text-primary underline">Reintentar</button></p>
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
      <motion.section 
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
        className="bg-background py-20 px-4 sm:px-6 lg:px-8"
      >
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
                key={i}
                className="bg-wo-grafito rounded-2xl overflow-hidden flex flex-col"
                style={{ border: "0.5px solid rgba(255,255,255,0.08)" }}
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={t.photo}
                    alt={t.name}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to top, hsl(214,25%,9%) 0%, transparent 55%)" }} />
                  <div
                    className="absolute bottom-3 left-4 bg-wo-carbon/90 backdrop-blur-sm rounded-lg px-3 py-1.5"
                    style={{ border: "0.5px solid rgba(232,116,26,0.3)" }}
                  >
                    <p className="font-syne font-bold text-[16px] text-primary leading-none">
                      {t.earning}
                      <span className="font-jakarta font-normal text-[10px] text-wo-crema-muted ml-1">/mes</span>
                    </p>
                  </div>
                </div>

                <div className="p-5 flex flex-col flex-1">
                  <p className="font-jakarta text-[13px] text-wo-crema-muted leading-relaxed mb-4 flex-1">"{t.text}"</p>
                  <div className="flex items-center justify-between">
                    <p className="font-jakarta font-semibold text-[13px] text-wo-crema">{t.name}</p>
                    <span
                      className="text-[10px] font-jakarta font-bold px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(232,116,26,0.12)", color: "hsl(var(--wo-oro))", border: "0.5px solid rgba(232,116,26,0.25)" }}
                    >
                      {t.rank}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
        className="relative overflow-hidden min-h-[520px] flex items-center"
      >
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1600&h=700&fit=crop&crop=center&auto=format&q=80"
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(105deg, rgba(5,12,28,0.93) 0%, rgba(5,12,28,0.82) 50%, rgba(5,12,28,0.55) 100%)" }} />
        </div>

        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-24 relative z-10 w-full">
          <div className="max-w-[560px]">
            <p className="font-jakarta text-[11px] font-bold tracking-[0.22em] uppercase text-primary mb-6">
              Registro gratuito · Sin costo de entrada
            </p>
            <h2 className="font-syne font-extrabold text-[38px] sm:text-[48px] text-wo-crema leading-[1.05] mb-5">
              Empieza hoy.<br />Tu red empieza contigo.
            </h2>
            <p className="font-jakarta text-[16px] text-wo-crema-muted leading-[1.7] mb-10 max-w-[420px]">
              Crea tu cuenta gratis, comparte tu link y empieza a generar ingresos con productos que la gente ama.
            </p>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Link
                to="/registro-afiliado"
                className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-jakarta font-bold text-[15px] px-8 py-4 rounded-wo-btn hover:bg-wo-oro-dark transition-colors min-h-[52px]"
              >
                <Star size={15} /> Crear mi cuenta gratis
              </Link>
              <p className="font-jakarta text-[12px] text-wo-crema/40">Empieza a ganar desde el día 1</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
