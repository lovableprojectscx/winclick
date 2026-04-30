import { Award, Zap, Target, Crown, CheckCircle2, TrendingUp, Info, ArrowRight, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

const BONUS_DATA = [
  {
    plan: "Básico",
    price: 120,
    levels: 1,
    color: "hsl(var(--primary))",
    bg: "rgba(232,116,26,0.06)",
    border: "rgba(232,116,26,0.25)",
    icon: <Award size={20} />,
    payments: [
      { level: "Nivel 1", role: "Patrocinador Directo", amount: 48.00 },
    ]
  },
  {
    plan: "Ejecutivo",
    price: 600,
    levels: 4,
    color: "#6366f1",
    bg: "rgba(99,102,241,0.06)",
    border: "rgba(99,102,241,0.25)",
    icon: <Target size={20} />,
    payments: [
      { level: "Nivel 1", role: "Patrocinador Directo", amount: 100.00 },
      { level: "Nivel 2", role: "Línea Indirecta 1", amount: 30.00 },
      { level: "Nivel 3", role: "Línea Indirecta 2", amount: 12.00 },
      { level: "Nivel 4", role: "Línea Indirecta 3", amount: 3.00 },
    ]
  },
  {
    plan: "Intermedio",
    price: 2000,
    levels: 4,
    color: "hsl(var(--secondary))",
    bg: "rgba(30,192,213,0.07)",
    border: "rgba(30,192,213,0.35)",
    icon: <Zap size={20} />,
    payments: [
      { level: "Nivel 1", role: "Patrocinador Directo", amount: 300.00 },
      { level: "Nivel 2", role: "Línea Indirecta 1", amount: 100.00 },
      { level: "Nivel 3", role: "Línea Indirecta 2", amount: 40.00 },
      { level: "Nivel 4", role: "Línea Indirecta 3", amount: 10.00 },
    ]
  },
  {
    plan: "VIP",
    price: 10000,
    levels: 4,
    color: "#C9920A",
    bg: "rgba(201,146,10,0.06)",
    border: "rgba(201,146,10,0.30)",
    icon: <Crown size={20} />,
    payments: [
      { level: "Nivel 1", role: "Patrocinador Directo", amount: 1500.00 },
      { level: "Nivel 2", role: "Línea Indirecta 1", amount: 150.00 },
      { level: "Nivel 3", role: "Línea Indirecta 2", amount: 50.00 },
      { level: "Nivel 4", role: "Línea Indirecta 3", amount: 50.00 },
    ]
  }
];

const SUMMARY_ROWS = [
  { pkg: "Básico (S/ 120)", n1: "S/ 48", n2: "-", n3: "-", n4: "-", total: "S/ 48" },
  { pkg: "Ejecutivo (S/ 600)", n1: "S/ 100", n2: "S/ 30", n3: "S/ 12", n4: "S/ 3", total: "S/ 145" },
  { pkg: "Intermedio (S/ 2,000)", n1: "S/ 300", n2: "S/ 100", n3: "S/ 40", n4: "S/ 10", total: "S/ 450" },
  { pkg: "VIP (S/ 10,000)", n1: "S/ 1,500", n2: "S/ 150", n3: "S/ 50", n4: "S/ 50", total: "S/ 1,750" },
];

export default function Bonos() {
  return (
    <div className="min-h-screen bg-background pt-20 pb-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* Header Section */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-jakarta text-[11px] font-bold uppercase tracking-wider mb-5">
            <ShieldCheck size={14} /> Reporte de Comisiones 2024
          </div>
          <h1 className="font-syne font-extrabold text-[36px] sm:text-[48px] text-wo-crema leading-tight mb-4">
            Estructura de Bonos de <br />
            <span className="text-primary">Afiliación y Patrocinio</span>
          </h1>
          <p className="font-jakarta text-wo-crema-muted text-base max-w-2xl leading-relaxed">
            Detalle de las comisiones directas e indirectas generadas cuando un nuevo usuario adquiere su paquete de membresía. Estos bonos recompensan el crecimiento de tu red desde el primer día.
          </p>
        </div>

        {/* Dinámica del Bono */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-16">
          <div className="lg:col-span-2 bg-wo-grafito rounded-2xl p-8 border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -mr-16 -mt-16" />
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary flex-shrink-0">
                <TrendingUp size={24} />
              </div>
              <div>
                <h2 className="font-syne font-bold text-xl text-wo-crema mb-2">Dinámica del Bono</h2>
                <p className="font-jakarta text-sm text-wo-crema-muted leading-relaxed">
                  Estos bonos se pagan <strong className="text-wo-crema">una sola vez</strong> cuando el nuevo usuario se activa en el sistema (primera compra). 
                  El monto a repartir depende exclusivamente del paquete que elija el nuevo afiliado.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <div className="mt-1"><CheckCircle2 size={16} className="text-secondary" /></div>
                <p className="font-jakarta text-[13px] text-wo-crema-muted">Los paquetes Ejecutivo, Intermedio y VIP reparten bonos en <strong className="text-wo-crema">4 niveles</strong> de profundidad ascendente.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1"><CheckCircle2 size={16} className="text-secondary" /></div>
                <p className="font-jakarta text-[13px] text-wo-crema-muted">El pago es inmediato y se deposita directamente en tu billetera virtual al confirmarse el pago.</p>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20 mt-2 sm:col-span-2">
                <div className="mt-1 text-destructive"><ShieldCheck size={16} /></div>
                <p className="font-jakarta text-[12px] text-destructive font-bold">
                  REQUISITO DE CALIFICACIÓN: Solo los afiliados con plan Ejecutivo o superior y con estado ACTIVO (suscripción al día) pueden cobrar estos bonos. Si tu cuenta está pendiente o suspendida, los bonos generados por tu red se perderán.
                </p>
              </div>
            </div>
          </div>
          <div className="bg-wo-carbon rounded-2xl p-8 border border-white/5 flex flex-col justify-center">
            <h3 className="font-syne font-bold text-lg text-wo-crema mb-3 flex items-center gap-2">
              <Info size={18} className="text-primary" /> Recordatorio
            </h3>
            <p className="font-jakarta text-sm text-wo-crema-muted leading-relaxed">
              Para cobrar los bonos indirectos (Niveles 2, 3 y 4), debes contar con una membresía que desbloquee dicha profundidad.
            </p>
            <Link to="/planes" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-primary hover:gap-3 transition-all">
              Ver requisitos por plan <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Repartición por Paquete */}
        <h2 className="font-syne font-bold text-2xl text-wo-crema mb-8 text-center sm:text-left">
          Repartición de Bonos por Paquete Adquirido
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-20">
          {BONUS_DATA.map((item) => (
            <div key={item.plan} className="rounded-2xl overflow-hidden flex flex-col" style={{ border: `0.5px solid ${item.border}`, background: item.bg }}>
              <div className="p-5 border-b border-white/5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${item.color}15`, color: item.color, border: `0.5px solid ${item.color}30` }}>
                    {item.icon}
                  </div>
                  <h3 className="font-syne font-extrabold text-lg text-wo-crema">Plan {item.plan}</h3>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-jakarta text-[10px] uppercase font-bold text-wo-crema-muted opacity-50">Activación:</span>
                  <span className="font-syne font-bold text-xl text-wo-crema">S/ {item.price.toLocaleString()}</span>
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col gap-4">
                <p className="font-jakarta text-[10px] uppercase font-bold text-wo-crema-muted tracking-widest">{item.levels} Nivel{item.levels > 1 ? 'es' : ''} de pago</p>
                <div className="space-y-3">
                  {item.payments.map((p, idx) => (
                    <div key={idx} className="flex justify-between items-center py-2 px-3 rounded-lg bg-black/20 border border-white/5">
                      <div>
                        <p className="font-syne font-bold text-[13px] text-wo-crema leading-none mb-1">{p.level}</p>
                        <p className="font-jakarta text-[10px] text-wo-crema-muted leading-none">{p.role}</p>
                      </div>
                      <span className="font-syne font-extrabold text-sm" style={{ color: item.color }}>S/ {p.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Cuadro Resumen */}
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="font-syne font-bold text-2xl text-wo-crema mb-2">Cuadro Resumen de Pagos</h2>
            <p className="font-jakarta text-sm text-wo-crema-muted">Comparativa de montos totales repartidos por cada activación en tu red.</p>
          </div>
          
          <div className="overflow-x-auto rounded-2xl border border-white/5 bg-wo-carbon">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5">
                  <th className="p-4 font-syne font-bold text-sm text-wo-crema-muted uppercase tracking-wider">Paquete Adquirido</th>
                  <th className="p-4 font-syne font-bold text-sm text-wo-crema-muted uppercase tracking-wider text-center">Nivel 1</th>
                  <th className="p-4 font-syne font-bold text-sm text-wo-crema-muted uppercase tracking-wider text-center">Nivel 2</th>
                  <th className="p-4 font-syne font-bold text-sm text-wo-crema-muted uppercase tracking-wider text-center">Nivel 3</th>
                  <th className="p-4 font-syne font-bold text-sm text-wo-crema-muted uppercase tracking-wider text-center">Nivel 4</th>
                  <th className="p-4 font-syne font-bold text-sm text-primary uppercase tracking-wider text-center">Total Repartido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {SUMMARY_ROWS.map((row, i) => (
                  <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 font-jakarta font-bold text-sm text-wo-crema">{row.pkg}</td>
                    <td className="p-4 font-jakarta text-sm text-wo-crema/70 text-center">{row.n1}</td>
                    <td className="p-4 font-jakarta text-sm text-wo-crema/70 text-center">{row.n2}</td>
                    <td className="p-4 font-jakarta text-sm text-wo-crema/70 text-center">{row.n3}</td>
                    <td className="p-4 font-jakarta text-sm text-wo-crema/70 text-center">{row.n4}</td>
                    <td className="p-4 font-syne font-black text-sm text-primary text-center bg-primary/5">{row.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-6 font-jakarta text-[11px] text-wo-crema-muted/40 text-center italic">
            * Los montos son fijos y se calculan sobre el paquete de activación seleccionado por el nuevo afiliado.
          </p>
        </div>

      </div>
    </div>
  );
}
