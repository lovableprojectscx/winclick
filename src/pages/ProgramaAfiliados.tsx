import { Link } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import { Star, ChevronDown, ChevronUp, Check } from "lucide-react";
import { useState } from "react";
import { commissionLevels, packages } from "@/data/affiliates";

const faqs = [
  { q: "¿Cuánto cuesta registrarse?", a: "Puedes empezar con el paquete Básico logrando compras acumuladas desde S/ 100. Recibes productos desde el primer día." },
  { q: "¿Cómo recibo mis comisiones?", a: "Las comisiones se acreditan en tu Billetera Winclick y puedes retirarlas vía Yape, Plin o transferencia bancaria." },
  { q: "¿Qué pasa después del primer mes?", a: "A partir del mes 2 necesitas reactivar tu cuenta realizando compras mensuales en el catálogo por una meta estipulada (ej. S/ 300) para mantener tus niveles activos." },
  { q: "¿Cuántos niveles de comisión hay?", a: "Hay 10 niveles de comisión. La profundidad que desbloqueas depende de tu paquete de activación elegido." },
  { q: "¿Puedo tener mi propia tienda online?", a: "Sí. Cada socio tiene una tienda personalizable con su propio link, branding y productos destacados." },
];

export default function ProgramaAfiliados() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  useSEO({
    title: "Programa de Afiliados Winclick Perú | Gana hasta 25% de Comisiones",
    description: "Únete al programa de afiliados Winclick. Gana hasta 25% de comisiones en 10 niveles de red vendiendo productos orgánicos y premium desde casa en Perú.",
    canonical: "https://winclick.pe/programa-afiliados",
  });

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      {/* Hero */}
      <section className="relative min-h-screen flex overflow-hidden bg-wo-obsidiana">
        {/* LEFT — texto */}
        <div className="flex-1 flex items-center px-6 sm:px-10 lg:px-16 relative z-10" style={{ paddingTop: "96px", paddingBottom: "64px" }}>
          <div className="w-full max-w-[540px]">
            <p className="font-jakarta text-[11px] font-bold tracking-[0.22em] uppercase text-primary mb-7">
              Programa de Afiliados · Winclick Perú
            </p>
            <h1 className="font-syne font-extrabold text-[44px] sm:text-[54px] lg:text-[64px] leading-[1.05] tracking-[-0.02em] text-wo-crema mb-6">
              Sé tu propio jefe.<br /><span className="text-primary">Gana con tu red.</span>
            </h1>
            <p className="font-jakarta text-[16px] text-wo-crema-muted leading-[1.7] mb-10 max-w-[420px]">
              Únete al programa de socios Winclick. Comisiones inmediatas, red de 10 niveles y soporte dedicado desde el día 1.
            </p>
            <Link to="/registro-afiliado" className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-jakarta font-bold text-[15px] px-8 py-4 rounded-wo-btn hover:bg-wo-oro-dark transition-colors min-h-[52px]">
              <Star size={15} /> Registrarme ahora →
            </Link>
            <div className="flex flex-wrap gap-6 mt-12 pt-8" style={{ borderTop: "0.5px solid rgba(255,255,255,0.1)" }}>
              {["Desde S/ 100", "Comisiones inmediatas", "Soporte dedicado"].map((s) => (
                <span key={s} className="font-jakarta text-[12px] text-wo-crema-muted">{s}</span>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT — foto con persona visible (desktop) */}
        <div className="hidden lg:block relative w-[46vw] shrink-0 min-h-screen">
          <img
            src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=960&h=1080&fit=crop&crop=top&auto=format&q=88"
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, hsl(214,30%,5%) 0%, transparent 22%)" }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, hsl(214,30%,5%) 0%, transparent 18%)" }} />
          <div className="absolute bottom-14 left-10 bg-wo-grafito/90 backdrop-blur-md rounded-xl px-5 py-4" style={{ border: "0.5px solid rgba(255,255,255,0.1)" }}>
            <p className="font-syne font-extrabold text-[22px] text-primary">25%</p>
            <p className="font-jakarta text-[12px] text-wo-crema mt-0.5">Comisión máxima acumulada</p>
          </div>
        </div>

        {/* Mobile: imagen de fondo */}
        <div className="absolute inset-0 lg:hidden">
          <img
            src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&h=1000&fit=crop&crop=top&auto=format&q=75"
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(5,12,28,0.88) 0%, rgba(5,12,28,0.75) 50%, rgba(5,12,28,0.95) 100%)" }} />
        </div>
      </section>

      {/* Packages */}
      <section className="bg-wo-grafito py-20">
        <div className="max-w-5xl mx-auto px-4">
          <p className="font-jakarta text-[10px] font-bold tracking-[0.16em] uppercase text-primary mb-3">PAQUETES DE ACTIVACIÓN</p>
          <h2 className="font-syne font-extrabold text-[26px] text-wo-crema mb-4">Elige tu paquete y empieza a ganar.</h2>
          <p className="font-jakarta text-sm text-wo-crema-muted mb-10 max-w-2xl">
            Tu paquete define cuántos niveles de comisión desbloqueas. A mayor inversión, mayor profundidad y mayor potencial de ingresos.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {packages.map((pkg, i) => {
              const isVip = pkg.name === "VIP";
              return (
                <div
                  key={pkg.name}
                  className={`relative rounded-2xl p-6 flex flex-col ${isVip ? "ring-2 ring-primary" : ""}`}
                  style={{
                    background: isVip ? "linear-gradient(180deg, rgba(232,116,26,0.08) 0%, rgba(10,11,9,0.95) 100%)" : "rgba(10,18,40,0.6)",
                    border: isVip ? "1px solid rgba(232,116,26,0.3)" : "0.5px solid rgba(255,255,255,0.07)",
                  }}
                >
                  {isVip && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 font-jakarta text-[10px] font-bold uppercase tracking-wider bg-primary text-primary-foreground px-3 py-1 rounded-wo-pill">
                      Recomendado
                    </span>
                  )}
                  <h3 className="font-syne font-extrabold text-xl text-wo-crema mb-1">{pkg.name}</h3>
                  <p className="font-jakarta text-xs text-wo-crema-muted mb-4">{pkg.description}</p>
                  <div className="mb-6">
                    <span className="font-syne font-extrabold text-[36px] text-primary">S/ {pkg.investment.toLocaleString()}</span>
                    <span className="font-jakarta text-xs text-wo-crema-muted ml-2">inversión inicial</span>
                  </div>

                  <div className="space-y-3 mb-6 flex-1">
                    <div className="flex items-start gap-2">
                      <Check size={14} className="text-secondary mt-0.5 shrink-0" />
                      <span className="font-jakarta text-sm text-wo-crema">
                        Niveles <strong>1 al {pkg.depthUnlocked}</strong> desbloqueados
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check size={14} className="text-secondary mt-0.5 shrink-0" />
                      <span className="font-jakarta text-sm text-wo-crema">Productos incluidos en tu paquete</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check size={14} className="text-secondary mt-0.5 shrink-0" />
                      <span className="font-jakarta text-sm text-wo-crema">Tienda online personalizable</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check size={14} className="text-secondary mt-0.5 shrink-0" />
                      <span className="font-jakarta text-sm text-wo-crema">
                        Reactivación: S/ {pkg.reactivation}/mes ({pkg.reactivationProducts} frascos)
                      </span>
                    </div>
                  </div>

                  <Link
                    to={`/registro-afiliado?package=${pkg.name.toLowerCase()}`}
                    className={`text-center font-jakarta font-bold text-sm py-3 rounded-xl transition-colors ${
                      isVip
                        ? "bg-primary text-primary-foreground hover:bg-wo-oro-dark"
                        : "bg-wo-carbon text-wo-crema hover:bg-wo-carbon/80"
                    }`}
                    style={{ border: isVip ? "none" : "0.5px solid rgba(255,255,255,0.1)" }}
                  >
                    Elegir {pkg.name}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Commission pyramid */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4">
          <p className="font-jakarta text-[10px] font-bold tracking-[0.16em] uppercase text-primary mb-3">COMISIONES MULTINIVEL</p>
          <h2 className="font-syne font-extrabold text-[26px] text-wo-crema mb-4">10 niveles de profundidad.</h2>
          <p className="font-jakarta text-sm text-wo-crema-muted mb-10">
            Ganas comisión por las ventas de toda tu red. La profundidad depende de tu paquete de activación.
          </p>

          <div className="space-y-2">
            {commissionLevels.map((cl, i) => {
              const width = Math.max(20, 100 - i * 8);
              const opacity = 1 - i * 0.07;
              // Show which packages unlock this level
              const unlockedBy = packages.filter(p => p.depthUnlocked >= cl.level);
              return (
                <div key={cl.level} className="flex items-center gap-3 group cursor-default">
                  <span className="font-jakarta text-[11px] text-wo-crema-muted w-12 shrink-0">Niv. {cl.level}</span>
                  <div className="flex-1">
                    <div
                      className="h-10 rounded-md flex items-center justify-between px-3 transition-all group-hover:scale-[1.02]"
                      style={{
                        width: `${width}%`,
                        background: `rgba(232,116,26,${opacity})`,
                      }}
                    >
                      <span className="font-jakarta font-bold text-sm text-primary-foreground">{cl.percentage}%</span>
                      <span className="font-jakarta text-[10px] text-primary-foreground/70 hidden sm:inline">
                        {unlockedBy.map(p => p.name).join(" · ")}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-wo-grafito py-20">
        <div className="max-w-4xl mx-auto px-4">
          <p className="font-jakarta text-[10px] font-bold tracking-[0.16em] uppercase text-primary mb-3">CÓMO FUNCIONA</p>
          <h2 className="font-syne font-extrabold text-[26px] text-wo-crema mb-10">3 pasos para empezar.</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                num: "1",
                title: "Elige tu paquete",
                desc: "Básico (S/100), Intermedio (S/2,000) o VIP (S/10,000).",
                img: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=500&h=280&fit=crop&crop=center&auto=format&q=80",
                alt: "Productos orgánicos",
              },
              {
                num: "2",
                title: "Comparte tu link",
                desc: "Comparte tu tienda y código de afiliado con tu red.",
                img: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=500&h=280&fit=crop&crop=center&auto=format&q=80",
                alt: "Compartir por celular",
              },
              {
                num: "3",
                title: "Gana comisiones",
                desc: "Recibe comisiones por cada venta hasta tu nivel desbloqueado.",
                img: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&h=280&fit=crop&crop=center&auto=format&q=80",
                alt: "Ganancias y éxito",
              },
            ].map((s) => (
              <div key={s.num} className="bg-wo-carbon rounded-wo-card overflow-hidden" style={{ border: "0.5px solid rgba(255,255,255,0.07)" }}>
                <div className="relative h-[160px] overflow-hidden">
                  <img src={s.img} alt={s.alt} loading="lazy" className="w-full h-full object-cover" />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 40%, rgba(10,18,40,0.85) 100%)" }} />
                  <span className="absolute bottom-3 left-4 font-syne font-extrabold text-[42px] leading-none text-primary opacity-80">{s.num}</span>
                </div>
                <div className="p-5">
                  <h3 className="font-jakarta font-bold text-base text-wo-crema mb-1.5">{s.title}</h3>
                  <p className="font-jakarta text-xs text-wo-crema-muted leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4">
          <p className="font-jakarta text-[10px] font-bold tracking-[0.16em] uppercase text-primary mb-3">PREGUNTAS FRECUENTES</p>
          <h2 className="font-syne font-extrabold text-[26px] text-wo-crema mb-10">¿Tienes dudas?</h2>
          <div className="space-y-0">
            {faqs.map((f, i) => (
              <div key={i} style={{ borderBottom: "0.5px solid rgba(255,255,255,0.07)" }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between py-4 text-left">
                  <span className="font-jakarta font-medium text-sm text-wo-crema">{f.q}</span>
                  {openFaq === i ? <ChevronUp size={16} className="text-primary shrink-0" /> : <ChevronDown size={16} className="text-wo-crema-muted shrink-0" />}
                </button>
                {openFaq === i && (
                  <p className="font-jakarta text-sm text-wo-crema-muted pb-4 leading-relaxed">{f.a}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden min-h-[480px] flex items-center">
        <img
          src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1600&h=600&fit=crop&crop=center&auto=format&q=80"
          alt=""
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(105deg, rgba(5,12,28,0.94) 0%, rgba(5,12,28,0.80) 55%, rgba(5,12,28,0.50) 100%)" }} />
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-20 relative z-10 w-full">
          <div className="max-w-[520px]">
            <p className="font-jakarta text-[11px] font-bold tracking-[0.22em] uppercase text-primary mb-5">Registro gratuito</p>
            <h2 className="font-syne font-extrabold text-[38px] sm:text-[48px] text-wo-crema leading-[1.05] mb-5">
              Empieza hoy.<br />Tu red empieza contigo.
            </h2>
            <p className="font-jakarta text-[16px] text-wo-crema-muted leading-[1.7] mb-10 max-w-[400px]">
              Una decisión cambia todo. Regístrate gratis y empieza a construir tu red desde hoy.
            </p>
            <Link to="/registro-afiliado" className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-jakarta font-bold text-[15px] px-8 py-4 rounded-wo-btn hover:bg-wo-oro-dark transition-colors min-h-[52px]">
              <Star size={15} /> Crear mi cuenta gratis
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
