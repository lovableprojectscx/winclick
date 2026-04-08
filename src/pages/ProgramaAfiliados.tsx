import { Link } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import { Star, ChevronDown, ChevronUp, Check } from "lucide-react";
import { useState } from "react";
import { commissionLevels, packages } from "@/data/affiliates";

const faqs = [
  { q: "¿Cuánto cuesta registrarse?", a: "Puedes empezar con el paquete Básico desde S/ 100. Recibes productos desde el primer día." },
  { q: "¿Cómo recibo mis comisiones?", a: "Las comisiones se acreditan en tu Billetera Winclick y puedes retirarlas vía Yape, Plin o transferencia bancaria." },
  { q: "¿Qué pasa después del primer mes?", a: "A partir del mes 2 necesitas reactivarte con S/ 300 mensuales (3 frascos) para mantener tus niveles activos." },
  { q: "¿Cuántos niveles de comisión hay?", a: "Hay 10 niveles de comisión. La profundidad que desbloqueas depende de tu paquete de activación." },
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
      <section className="relative min-h-[420px] flex items-center overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1400&h=600&fit=crop&crop=center&auto=format&q=80"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(105deg, rgba(5,12,28,0.95) 0%, rgba(5,12,28,0.82) 60%, rgba(5,12,28,0.55) 100%)" }} />
        <div className="max-w-3xl mx-auto px-4 text-center relative z-10 py-20">
          <h1 className="font-syne font-extrabold text-[36px] md:text-[48px] text-wo-crema leading-tight mb-4">
            Sé tu propio jefe.<br /><span className="text-primary">Gana con tu red.</span>
          </h1>
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {["Desde S/ 100", "Comisiones inmediatas", "Soporte dedicado"].map((s) => (
              <span key={s} className="font-jakarta text-xs text-wo-crema-muted px-3 py-1.5 rounded-wo-pill bg-wo-carbon/70 backdrop-blur-sm" style={{ border: "0.5px solid rgba(255,255,255,0.12)" }}>
                {s}
              </span>
            ))}
          </div>
          <Link to="/registro-afiliado?package=intermedio" className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-jakarta font-bold text-sm px-8 py-4 rounded-wo-btn hover:bg-wo-oro-dark">
            <Star size={14} /> Registrarme ahora
          </Link>
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
      <section className="relative py-24 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1400&h=500&fit=crop&crop=center&auto=format&q=75"
          alt=""
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(5,12,28,0.93) 0%, rgba(5,12,28,0.88) 100%)" }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-[400px] h-[400px] rounded-full" style={{ background: "radial-gradient(circle, rgba(232,116,26,0.1) 0%, transparent 60%)" }} />
        </div>
        <div className="max-w-lg mx-auto px-4 text-center relative z-10">
          <h2 className="font-syne font-extrabold text-[32px] text-wo-crema mb-2">Empieza hoy.</h2>
          <p className="font-jakarta text-sm text-wo-crema-muted mb-8">Tu red empieza con una decisión.</p>
          <Link to="/registro-afiliado" className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-jakarta font-bold text-sm px-9 py-4 rounded-xl hover:bg-wo-oro-dark">
            <Star size={14} /> Crear mi cuenta gratis
          </Link>
        </div>
      </section>
    </div>
  );
}
