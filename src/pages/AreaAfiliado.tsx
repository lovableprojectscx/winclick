import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Copy, Check, LogOut, ExternalLink, TrendingUp, DollarSign, Users, ShoppingBag, AlertTriangle, Clock, Lock, ArrowUpCircle, X, Upload } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { PackageType } from "@/lib/database.types";
import { useAffiliateStats, useMyCommissions, useMyNetwork, useMyPayments, useSubmitPayment, useWallet, useBusinessSettings } from "@/hooks/useAffiliate";

const PACKAGES: { name: PackageType; depthUnlocked: number; investment: number }[] = [
  { name: "Básico",      depthUnlocked: 3,  investment: 100 },
  { name: "Intermedio",  depthUnlocked: 7,  investment: 2000 },
  { name: "VIP",         depthUnlocked: 10, investment: 10000 },
];

const uvRanks = [
  { name: "Socio Activo",  minUV: 0,    maxUV: 499,  minDirectos: 1,  emoji: "🌱" },
  { name: "Emprendedor",   minUV: 500,  maxUV: 999,  minDirectos: 3,  emoji: "🚀" },
  { name: "Líder Plata",   minUV: 1000, maxUV: 2499, minDirectos: 5,  emoji: "🥈" },
  { name: "Líder Oro",     minUV: 2500, maxUV: 4999, minDirectos: 8,  emoji: "🥇" },
  { name: "Rango Élite",   minUV: 5000, maxUV: Infinity, minDirectos: 12, emoji: "👑" },
];

const missions = [
  { name: "Primera venta",       progress: 1,   target: 1,   points: 50,  status: "completada" as const, icon: "🛒" },
  { name: "Refiere 3 socios",    progress: 2,   target: 3,   points: 100, status: "progreso"   as const, icon: "👥" },
  { name: "Alcanza 500 ventas",  progress: 320, target: 500, points: 200, status: "progreso"   as const, icon: "📊" },
  { name: "Vende 10 productos",  progress: 4,   target: 10,  points: 150, status: "progreso"   as const, icon: "📦" },
];

export default function AreaAfiliado() {
  const { affiliate, logout } = useAuth();
  const navigate = useNavigate();
  const [copied,           setCopied]           = useState(false);
  const [copiedUrl,        setCopiedUrl]        = useState(false);
  const [networkView,      setNetworkView]      = useState<"tree" | "list">("list");
  const [commFilter,       setCommFilter]       = useState("Todo");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeReceipt,   setUpgradeReceipt]   = useState<File | null>(null);
  const [upgrading,        setUpgrading]        = useState(false);

  const { data: affiliateStats }   = useAffiliateStats();
  const { data: commissions = [] } = useMyCommissions();
  const { data: network = [] }     = useMyNetwork();
  const { data: payments = [] }    = useMyPayments();
  const { data: walletData }       = useWallet();
  const { data: settings }         = useBusinessSettings();
  const submitPayment              = useSubmitPayment();

  if (!affiliate) { navigate("/login-afiliado"); return null; }

  const currentPackageIdx = PACKAGES.findIndex((p) => p.name === affiliate.package);
  const currentPackage    = PACKAGES[Math.max(0, currentPackageIdx)];
  const nextPackage       = PACKAGES[currentPackageIdx + 1];

  const uvAmount      = affiliateStats?.uv_amount_month  ?? affiliate.uv_amount_month  ?? 0;
  const activeDirectos= affiliateStats?.active_directos  ?? affiliate.active_directos  ?? 0;
  const totalSales    = affiliateStats?.total_sales       ?? affiliate.total_sales       ?? 0;
  const totalComm     = affiliateStats?.total_commissions ?? affiliate.total_commissions ?? 0;
  const walletBalance = walletData?.balance ?? 0;

  const currentRankIdx = uvRanks.reduce((best, rank, i) =>
    uvAmount >= rank.minUV && activeDirectos >= rank.minDirectos ? i : best, 0);
  const currentRank = uvRanks[currentRankIdx];
  const nextRank    = uvRanks[currentRankIdx + 1];
  const rankProgress = nextRank
    ? Math.min(100, Math.round(((uvAmount - currentRank.minUV) / (nextRank.minUV - currentRank.minUV)) * 100))
    : 100;

  const isPending   = affiliate.account_status === "pending";
  const isSuspended = affiliate.account_status === "suspended";

  const copyCode = () => {
    navigator.clipboard.writeText(affiliate.affiliate_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredComm = commissions.filter((c) => {
    if (commFilter === "Todo")      return true;
    if (commFilter === "Pendiente") return c.status === "pending";
    if (commFilter === "Pagada")    return c.status === "paid";
    return true;
  });

  // Level-1 referrals for network view
  const directRefs = network
    .filter((n) => n.level === 1)
    .map((n) => n.referred as { id: string; name: string; affiliate_code: string; package: PackageType | null; account_status: string; total_sales: number; rank: string });

  // Payments of type "retiro" for the withdrawals table
  const withdrawals = payments.filter((p) => p.type === "retiro");

  const handleUpgradeSubmit = async () => {
    if (!upgradeReceipt || !nextPackage) return;
    setUpgrading(true);
    try {
      await submitPayment.mutateAsync({
        type:        "upgrade",
        amount:      nextPackage.investment - currentPackage.investment,
        receiptFile: upgradeReceipt,
        packageFrom: currentPackage.name,
        packageTo:   nextPackage.name,
      });
      setShowUpgradeModal(false);
      setUpgradeReceipt(null);
    } finally {
      setUpgrading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-16 pb-16">
      {/* Header */}
      <div className="bg-wo-grafito" style={{ borderBottom: "0.5px solid rgba(255,255,255,0.07)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="font-jakarta font-semibold text-base text-wo-crema">Hola, {affiliate.name.split(" ")[0]} 👋</span>
              <span className="text-[10px] font-jakarta font-bold px-2 py-0.5 rounded-wo-pill" style={{ background: "rgba(242,201,76,0.12)", color: "hsl(var(--wo-oro))", border: "0.5px solid rgba(242,201,76,0.25)" }}>
                {affiliate.package}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={copyCode} className="flex items-center gap-2 bg-wo-carbon px-3 py-1.5 rounded-lg font-jakarta text-xs text-wo-crema" style={{ border: "0.5px solid rgba(255,255,255,0.07)" }}>
                {affiliate.affiliate_code} {copied ? <Check size={12} className="text-secondary" /> : <Copy size={12} />}
              </button>
              <button onClick={() => { logout(); navigate("/"); }} className="font-jakarta text-xs text-wo-crema-muted hover:text-wo-crema px-3 py-1.5 rounded-lg" style={{ border: "0.5px solid rgba(248,244,236,0.2)" }}>
                <LogOut size={12} />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-2">
            <Link to={`/tienda/${affiliate.affiliate_code}`} className="font-jakarta text-xs text-primary hover:underline flex items-center gap-1">
              Ver mi tienda → <ExternalLink size={10} />
            </Link>
            <Link to="/editar-tienda" className="font-jakarta text-xs text-secondary hover:underline flex items-center gap-1">
              Editar tienda ✏️
            </Link>
            <span className="flex items-center gap-1 text-secondary font-jakarta text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" /> En línea
            </span>
          </div>
        </div>
      </div>

      {/* Banner: cuenta en revisión */}
      {isPending && (
        <div className="px-4 sm:px-6 lg:px-8 pt-4 max-w-7xl mx-auto">
          <div className="rounded-wo-card p-4 flex items-start gap-3" style={{ background: "rgba(242,201,76,0.08)", border: "1px solid rgba(242,201,76,0.35)" }}>
            <Clock size={18} className="text-primary shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-jakarta font-bold text-sm text-primary">Tu pago está en revisión</p>
              <p className="font-jakarta text-xs text-wo-crema-muted mt-0.5">
                Hemos recibido tu solicitud para el paquete <strong className="text-wo-crema">{affiliate.package}</strong>. El administrador revisará tu comprobante y activará tu cuenta en menos de 24h. Las comisiones se habilitarán cuando sea aprobado.
              </p>
            </div>
            <Link to="/mi-billetera" className="font-jakarta text-[11px] text-primary hover:underline shrink-0 whitespace-nowrap">
              Ver billetera →
            </Link>
          </div>
        </div>
      )}

      {/* Banner: cuenta suspendida */}
      {isSuspended && (
        <div className="px-4 sm:px-6 lg:px-8 pt-4 max-w-7xl mx-auto">
          <div className="rounded-wo-card p-4 flex items-start gap-3" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.35)" }}>
            <AlertTriangle size={18} className="text-destructive shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-jakarta font-bold text-sm text-destructive">Cuenta suspendida</p>
              <p className="font-jakarta text-xs text-wo-crema-muted mt-0.5">
                Tu cuenta está suspendida{affiliate.suspended_at ? ` desde el ${new Date(affiliate.suspended_at).toLocaleDateString("es-PE")}` : ""}. No estás generando comisiones. Paga tu reactivación mensual de S/ 300 para reactivar.
              </p>
            </div>
            <Link to="/mi-billetera" className="font-jakarta font-bold text-[11px] text-destructive hover:underline shrink-0 whitespace-nowrap bg-destructive/10 px-3 py-1.5 rounded-wo-btn">
              Reactivar ahora →
            </Link>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "VENTAS TOTALES",      value: `S/ ${totalSales.toLocaleString()}`,   change: "",    up: true, color: "text-primary",    icon: <ShoppingBag size={16} /> },
            { label: "COMISIONES GANADAS",  value: `S/ ${totalComm.toLocaleString()}`,    change: "",    up: true, color: "text-primary",    icon: <DollarSign size={16} /> },
            { label: "UV DEL MES",          value: uvAmount.toLocaleString(),              change: "",    up: true, color: "text-secondary",  icon: <TrendingUp size={16} /> },
            { label: "REFERIDOS DIRECTOS",  value: String(affiliate.referral_count ?? 0), change: "",    up: true, color: "text-wo-crema",   icon: <Users size={16} /> },
          ].map((kpi, i) => (
            <div key={i} className="bg-wo-grafito rounded-wo-card p-5 relative overflow-hidden" style={{ border: isSuspended ? "0.5px solid rgba(239,68,68,0.2)" : "0.5px solid rgba(255,255,255,0.07)" }}>
              {isSuspended && (
                <div className="absolute top-2 right-2">
                  <span className="font-jakarta font-bold text-[9px] px-1.5 py-0.5 rounded-wo-pill" style={{ background: "rgba(239,68,68,0.12)", color: "rgb(239,68,68)", border: "0.5px solid rgba(239,68,68,0.3)" }}>
                    SUSPENDIDO
                  </span>
                </div>
              )}
              <p className="font-jakarta text-[11px] text-wo-crema-muted uppercase font-medium">{kpi.label}</p>
              <p className={`font-syne font-extrabold text-[28px] mt-1 ${isSuspended ? "text-wo-crema/40" : kpi.color}`}>{kpi.value}</p>
              <div className={`font-jakarta text-xs font-medium mt-1 ${isSuspended ? "text-wo-crema/30" : "text-wo-crema-muted"}`}>
                {kpi.icon}
              </div>
            </div>
          ))}
        </div>

        {/* Pending: instrucciones de activación */}
        {isPending && (
          <div className="rounded-wo-card p-6" style={{ background: "rgba(242,201,76,0.04)", border: "0.5px solid rgba(242,201,76,0.2)" }}>
            <h3 className="font-jakarta font-bold text-sm text-wo-crema mb-3">Pasos para activar tu cuenta</h3>
            <div className="space-y-3">
              {[
                { n: 1, done: true,  text: "Formulario de registro completado" },
                { n: 2, done: true,  text: `Paquete seleccionado: ${affiliate.package} (S/ ${currentPackage.investment.toLocaleString()})` },
                { n: 3, done: true,  text: "Comprobante de pago enviado" },
                { n: 4, done: false, text: "Admin aprueba tu pago (menos de 24h)" },
                { n: 5, done: false, text: "Cuenta activa — comisiones habilitadas" },
              ].map((step) => (
                <div key={step.n} className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center font-jakarta font-bold text-[10px] shrink-0 ${step.done ? "bg-secondary text-background" : "bg-wo-carbon text-wo-crema-muted"}`} style={!step.done ? { border: "0.5px solid rgba(255,255,255,0.12)" } : {}}>
                    {step.done ? <Check size={9} /> : step.n}
                  </div>
                  <p className={`font-jakarta text-xs ${step.done ? "text-wo-crema" : "text-wo-crema-muted"}`}>{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mi Tienda */}
        {!isPending && (
          <div className="bg-wo-grafito rounded-wo-card p-5" style={{ border: "0.5px solid rgba(255,255,255,0.07)" }}>
            <p className="font-jakarta text-[10px] text-wo-crema-muted uppercase font-semibold mb-3">Mi Tienda</p>
            <div className="flex flex-wrap items-start gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-jakarta text-[11px] text-wo-crema-muted mb-1.5">Tu link de tienda</p>
                <div className="flex items-center gap-2 bg-wo-carbon rounded-wo-btn px-3 py-2.5 mb-3" style={{ border: "0.5px solid rgba(255,255,255,0.07)" }}>
                  <span className="font-jakarta text-xs text-wo-crema truncate flex-1">
                    {window.location.origin}/tienda/{affiliate.affiliate_code}
                  </span>
                  <button
                    onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/tienda/${affiliate.affiliate_code}`); setCopiedUrl(true); setTimeout(() => setCopiedUrl(false), 2000); }}
                    className="shrink-0 font-jakarta font-bold text-[10px] px-2.5 py-1 rounded-wo-pill transition-colors"
                    style={{ background: copiedUrl ? "rgba(46,204,113,0.15)" : "rgba(242,201,76,0.1)", color: copiedUrl ? "rgb(46,204,113)" : "hsl(var(--wo-oro))", border: "0.5px solid rgba(242,201,76,0.25)" }}
                  >
                    {copiedUrl ? "✓ Copiado" : "Copiar"}
                  </button>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`Visita mi tienda Winner Organa: ${window.location.origin}/tienda/${affiliate.affiliate_code}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 font-jakarta font-bold text-xs px-3 py-2 rounded-wo-btn transition-colors hover:brightness-110"
                    style={{ background: "rgba(37,211,102,0.12)", color: "rgb(37,211,102)", border: "0.5px solid rgba(37,211,102,0.3)" }}
                  >
                    <span>📱</span> Compartir WhatsApp
                  </a>
                  <Link to={`/tienda/${affiliate.affiliate_code}`} className="flex items-center gap-1.5 font-jakarta font-bold text-xs px-3 py-2 rounded-wo-btn text-wo-crema-muted hover:text-wo-crema transition-colors" style={{ border: "0.5px solid rgba(255,255,255,0.1)" }}>
                    <ExternalLink size={11} /> Ver tienda
                  </Link>
                </div>
              </div>
              <div className="flex flex-col items-center gap-1.5 shrink-0">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&bgcolor=0a0b09&color=f2c94c&data=${encodeURIComponent(`${window.location.origin}/tienda/${affiliate.affiliate_code}`)}`}
                  alt="QR mi tienda"
                  className="w-24 h-24 rounded-lg"
                  style={{ border: "0.5px solid rgba(255,255,255,0.1)" }}
                />
                <p className="font-jakarta text-[10px] text-wo-crema-muted">Escanea para visitar</p>
              </div>
            </div>
          </div>
        )}

        {/* Progreso de Rango UV */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-wo-grafito rounded-wo-card p-5" style={{ border: "0.5px solid rgba(255,255,255,0.07)" }}>
            <p className="font-jakarta text-[10px] text-wo-crema-muted uppercase font-semibold mb-3">Progreso de Rango</p>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{currentRank.emoji}</span>
              <div>
                <p className="font-syne font-extrabold text-lg text-wo-crema">{currentRank.name}</p>
                {nextRank && <p className="font-jakarta text-[11px] text-wo-crema-muted">Hacia {nextRank.emoji} {nextRank.name}</p>}
              </div>
              {!nextRank && <span className="ml-auto font-jakarta font-bold text-[10px] px-2 py-0.5 rounded-wo-pill bg-primary/15 text-primary">RANGO MÁXIMO</span>}
            </div>
            {nextRank && (
              <>
                <div className="h-2 rounded-wo-pill bg-wo-crema/10 overflow-hidden mb-2">
                  <div className="h-full rounded-wo-pill bg-primary transition-all" style={{ width: `${rankProgress}%` }} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-jakarta text-[11px] text-wo-crema-muted">{rankProgress}% completado</span>
                  <span className="font-jakarta text-[11px] text-wo-crema-muted">Faltan {nextRank.minUV - uvAmount} UV</span>
                </div>
              </>
            )}
            <div className="flex gap-4 mt-3 pt-3" style={{ borderTop: "0.5px solid rgba(255,255,255,0.07)" }}>
              <div>
                <p className="font-jakarta text-[10px] text-wo-crema-muted uppercase">UV este mes</p>
                <p className="font-syne font-bold text-base text-primary">{uvAmount.toLocaleString()} {nextRank && <span className="font-jakarta text-[10px] text-wo-crema-muted">/ {nextRank.minUV.toLocaleString()}</span>}</p>
              </div>
              <div>
                <p className="font-jakarta text-[10px] text-wo-crema-muted uppercase">Directos activos</p>
                <p className="font-syne font-bold text-base text-secondary">{activeDirectos} {nextRank && <span className="font-jakarta text-[10px] text-wo-crema-muted">/ {nextRank.minDirectos} req.</span>}</p>
              </div>
            </div>
          </div>

          <div className="bg-wo-grafito rounded-wo-card p-5 flex flex-col justify-between" style={{ border: "0.5px solid rgba(255,255,255,0.07)" }}>
            <div>
              <p className="font-jakarta text-[10px] text-wo-crema-muted uppercase font-semibold mb-2">Tu paquete</p>
              <span className="font-jakarta font-bold text-sm px-3 py-1 rounded-wo-pill bg-primary text-primary-foreground">{currentPackage.name}</span>
              <p className="font-jakarta text-xs text-wo-crema-muted mt-2">
                Niveles <strong className="text-primary">1–{currentPackage.depthUnlocked}</strong> de 10 desbloqueados
              </p>
            </div>
            {nextPackage && !isPending && (
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="mt-4 w-full flex items-center justify-center gap-2 font-jakarta font-bold text-xs py-2.5 rounded-wo-btn transition-colors hover:bg-primary hover:text-primary-foreground"
                style={{ border: "0.5px solid rgba(242,201,76,0.35)", color: "hsl(var(--wo-oro))" }}
              >
                <ArrowUpCircle size={13} /> Mejorar a {nextPackage.name}
              </button>
            )}
          </div>
        </div>

        {/* Missions */}
        <div className="relative">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="font-syne font-bold text-lg text-wo-crema">Misiones activas</h3>
            {!isSuspended && (
              <span className="font-jakarta font-bold text-[10px] px-2 py-0.5 rounded-wo-pill bg-primary/12 text-primary" style={{ border: "0.5px solid rgba(242,201,76,0.25)" }}>
                {missions.length}
              </span>
            )}
          </div>
          {isSuspended && (
            <div className="absolute inset-0 z-10 rounded-wo-card flex flex-col items-center justify-center gap-2" style={{ background: "rgba(10,10,10,0.75)", backdropFilter: "blur(2px)" }}>
              <Lock size={22} className="text-wo-crema-muted" />
              <p className="font-jakarta font-semibold text-sm text-wo-crema">Misiones bloqueadas</p>
              <p className="font-jakarta text-xs text-wo-crema-muted text-center max-w-xs">Reactiva tu cuenta para seguir progresando en tus misiones.</p>
              <Link to="/mi-billetera" className="mt-2 font-jakarta font-bold text-xs px-4 py-2 rounded-wo-btn" style={{ background: "rgba(239,68,68,0.15)", color: "rgb(239,68,68)", border: "0.5px solid rgba(239,68,68,0.4)" }}>
                Reactivar ahora →
              </Link>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {missions.map((m, i) => (
              <div key={i} className="bg-wo-carbon rounded-xl p-4" style={{ border: "0.5px solid rgba(255,255,255,0.07)" }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{m.icon}</span>
                    <span className="font-jakarta font-semibold text-sm text-wo-crema">{m.name}</span>
                  </div>
                  <span className="font-jakarta font-bold text-[10px] px-2 py-0.5 rounded-wo-pill" style={{ background: "rgba(242,201,76,0.12)", color: "hsl(var(--wo-oro))", border: "0.5px solid rgba(242,201,76,0.25)" }}>
                    +{m.points} pts
                  </span>
                </div>
                <div className="h-1.5 rounded-wo-pill bg-wo-crema/10 overflow-hidden mb-1">
                  <div className="h-full rounded-wo-pill bg-primary transition-all" style={{ width: `${(m.progress / m.target) * 100}%` }} />
                </div>
                <div className="flex justify-between">
                  <span className="font-jakarta text-[11px] text-wo-crema-muted">{m.progress}/{m.target}</span>
                  <span className={`font-jakarta text-[11px] font-bold ${m.status === "completada" ? "text-secondary" : "text-primary"}`}>
                    {m.status === "completada" ? "✓ Completada" : "En progreso"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Network */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-syne font-bold text-lg text-wo-crema">Red de referidos</h3>
            <div className="flex gap-1">
              {(["list", "tree"] as const).map((v) => (
                <button key={v} onClick={() => setNetworkView(v)} className={`font-jakarta text-xs px-3 py-1.5 rounded-wo-pill transition-colors ${networkView === v ? "bg-primary text-primary-foreground" : "text-wo-crema-muted bg-wo-carbon"}`}>
                  {v === "tree" ? "Vista árbol" : "Vista lista"}
                </button>
              ))}
            </div>
          </div>

          {networkView === "list" ? (
            <div className="bg-wo-grafito rounded-wo-card overflow-hidden" style={{ border: "0.5px solid rgba(255,255,255,0.07)" }}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: "0.5px solid rgba(255,255,255,0.07)" }}>
                      {["Nombre", "Código", "Paquete", "Ventas", "Estado"].map((h) => (
                        <th key={h} className="text-left px-4 py-3 font-jakarta text-[11px] text-wo-crema-muted uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {directRefs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center font-jakarta text-sm text-wo-crema-muted">Aún no tienes referidos directos</td>
                      </tr>
                    ) : directRefs.map((ref) => (
                      <tr key={ref.id} style={{ borderBottom: "0.5px solid rgba(255,255,255,0.07)" }}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-wo-carbon flex items-center justify-center font-jakarta text-[10px] font-bold text-wo-crema">
                              {ref.name.split(" ").map((n) => n[0]).join("")}
                            </div>
                            <span className="font-jakarta text-sm text-wo-crema">{ref.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-jakarta text-xs text-wo-crema-muted">{ref.affiliate_code}</td>
                        <td className="px-4 py-3">
                          <span className="text-[10px] font-jakarta font-bold px-2 py-0.5 rounded-wo-pill" style={{ background: "rgba(242,201,76,0.12)", color: "hsl(var(--wo-oro))" }}>
                            {ref.package ?? "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-jakarta text-sm text-primary">S/ {(ref.total_sales ?? 0).toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <span className={`font-jakarta text-xs ${ref.account_status === "active" ? "text-secondary" : "text-destructive"}`}>
                            {ref.account_status === "active" ? "● Activo" : "● Inactivo"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-wo-grafito rounded-wo-card p-6" style={{ border: "0.5px solid rgba(255,255,255,0.07)" }}>
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-syne font-bold text-lg mb-2">Tú</div>
                <p className="font-jakarta text-xs text-wo-crema-muted mb-4">{affiliate.affiliate_code}</p>
                {directRefs.length === 0 ? (
                  <p className="font-jakarta text-sm text-wo-crema-muted">Aún no tienes referidos directos</p>
                ) : (
                  <div className="flex gap-6 flex-wrap justify-center">
                    {directRefs.map((ref) => (
                      <div key={ref.id} className="flex flex-col items-center">
                        <div className="w-px h-6 bg-wo-crema/10 mb-2" />
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-jakarta text-xs font-bold ${ref.account_status === "active" ? "bg-wo-carbon text-wo-crema" : "bg-wo-carbon/50 text-wo-crema-muted"}`}>
                          {ref.name.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <p className="font-jakarta text-[10px] text-wo-crema-muted mt-1">{ref.name.split(" ")[0]}</p>
                        <span className="text-[9px] text-primary font-jakarta">{ref.package}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Commission history */}
        <div>
          <h3 className="font-syne font-bold text-lg text-wo-crema mb-4">Historial de comisiones</h3>
          <div className="flex gap-2 mb-4">
            {["Todo", "Pendiente", "Pagada"].map((f) => (
              <button key={f} onClick={() => setCommFilter(f)} className={`font-jakarta text-xs px-3 py-1.5 rounded-wo-pill ${commFilter === f ? "bg-primary text-primary-foreground" : "bg-wo-carbon text-wo-crema-muted"}`}>
                {f}
              </button>
            ))}
          </div>
          <div className="bg-wo-grafito rounded-wo-card overflow-hidden" style={{ border: "0.5px solid rgba(255,255,255,0.07)" }}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: "0.5px solid rgba(255,255,255,0.07)" }}>
                    {["Pedido", "Comisión", "Nivel", "Estado", "Fecha"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 font-jakarta text-[11px] text-wo-crema-muted uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredComm.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center font-jakarta text-sm text-wo-crema-muted">No hay comisiones aún</td>
                    </tr>
                  ) : filteredComm.map((c) => {
                    const statusLabel = c.status === "paid" ? "Pagada" : c.status === "pending" ? "Pendiente" : "Rechazada";
                    const statusColor = c.status === "paid" ? "text-secondary" : c.status === "pending" ? "text-primary" : "text-destructive";
                    return (
                      <tr key={c.id} style={{ borderBottom: "0.5px solid rgba(255,255,255,0.07)" }}>
                        <td className="px-4 py-3 font-jakarta text-xs text-wo-crema">{c.order_id?.slice(0, 8) ?? "—"}</td>
                        <td className="px-4 py-3 font-jakarta text-sm font-bold text-primary">S/ {c.amount.toFixed(2)}</td>
                        <td className="px-4 py-3 font-jakarta text-xs text-wo-crema-muted">Niv. {c.level}</td>
                        <td className="px-4 py-3">
                          <span className={`font-jakarta text-xs font-bold ${statusColor}`}>{statusLabel}</span>
                        </td>
                        <td className="px-4 py-3 font-jakarta text-xs text-wo-crema-muted">
                          {new Date(c.created_at).toLocaleDateString("es-PE")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Withdrawals */}
        <div>
          <h3 className="font-syne font-bold text-lg text-wo-crema mb-4">Solicitudes de retiro</h3>
          <div className="bg-wo-grafito rounded-wo-card p-5 mb-4" style={{ border: "0.5px solid rgba(255,255,255,0.07)" }}>
            <p className="font-jakarta text-xs text-wo-crema-muted mb-1">Saldo disponible</p>
            <p className="font-syne font-extrabold text-2xl text-primary">S/ {walletBalance.toFixed(2)}</p>
          </div>
          <div className="bg-wo-grafito rounded-wo-card overflow-hidden" style={{ border: "0.5px solid rgba(255,255,255,0.07)" }}>
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "0.5px solid rgba(255,255,255,0.07)" }}>
                  {["Fecha", "Monto", "Método", "Estado"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-jakarta text-[11px] text-wo-crema-muted uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {withdrawals.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center font-jakarta text-sm text-wo-crema-muted">No hay solicitudes de retiro</td>
                  </tr>
                ) : withdrawals.map((w) => (
                  <tr key={w.id} style={{ borderBottom: "0.5px solid rgba(255,255,255,0.07)" }}>
                    <td className="px-4 py-3 font-jakarta text-xs text-wo-crema-muted">{new Date(w.created_at).toLocaleDateString("es-PE")}</td>
                    <td className="px-4 py-3 font-jakarta text-sm font-bold text-primary">S/ {w.amount.toFixed(2)}</td>
                    <td className="px-4 py-3 font-jakarta text-xs text-wo-crema-muted">{w.withdrawal_method ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`font-jakarta text-xs font-bold ${w.status === "aprobado" ? "text-secondary" : w.status === "pendiente" ? "text-primary" : "text-destructive"}`}>
                        {w.status.charAt(0).toUpperCase() + w.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal: Upgrade de paquete */}
      {showUpgradeModal && nextPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-md bg-wo-grafito rounded-wo-card p-6 relative" style={{ border: "0.5px solid rgba(255,255,255,0.1)" }}>
            <button onClick={() => { setShowUpgradeModal(false); setUpgradeReceipt(null); }} className="absolute top-4 right-4 text-wo-crema-muted hover:text-wo-crema">
              <X size={16} />
            </button>

            <p className="font-jakarta text-[10px] text-wo-crema-muted uppercase font-semibold mb-1">Mejorar paquete</p>
            <h3 className="font-syne font-bold text-xl text-wo-crema mb-4">{currentPackage.name} → {nextPackage.name}</h3>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-wo-carbon rounded-wo-btn p-3 text-center" style={{ border: "0.5px solid rgba(255,255,255,0.07)" }}>
                <p className="font-jakarta text-[10px] text-wo-crema-muted uppercase mb-1">Actual</p>
                <p className="font-jakarta font-bold text-sm text-wo-crema">{currentPackage.name}</p>
                <p className="font-jakarta text-[11px] text-wo-crema-muted">Niveles 1–{currentPackage.depthUnlocked}</p>
              </div>
              <div className="rounded-wo-btn p-3 text-center" style={{ background: "rgba(242,201,76,0.08)", border: "0.5px solid rgba(242,201,76,0.3)" }}>
                <p className="font-jakarta text-[10px] text-primary uppercase mb-1">Nuevo</p>
                <p className="font-jakarta font-bold text-sm text-wo-crema">{nextPackage.name}</p>
                <p className="font-jakarta text-[11px] text-secondary">Niveles 1–{nextPackage.depthUnlocked}</p>
              </div>
            </div>

            <div className="rounded-wo-btn p-4 mb-5 flex items-center justify-between" style={{ background: "rgba(242,201,76,0.05)", border: "0.5px solid rgba(242,201,76,0.2)" }}>
              <div>
                <p className="font-jakarta text-[11px] text-wo-crema-muted">Diferencia a pagar</p>
                <p className="font-syne font-extrabold text-2xl text-primary">S/ {(nextPackage.investment - currentPackage.investment).toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="font-jakarta text-[10px] text-wo-crema-muted">{currentPackage.name}: S/ {currentPackage.investment.toLocaleString()}</p>
                <p className="font-jakarta text-[10px] text-wo-crema-muted">{nextPackage.name}: S/ {nextPackage.investment.toLocaleString()}</p>
              </div>
            </div>

            <p className="font-jakarta text-[11px] text-wo-crema-muted mb-2 font-semibold uppercase">Transferir a</p>
            {[
              { icon: "📱", label: "Yape / Plin", value: settings?.yape_number ? `${settings.yape_number}${settings.business_name ? ` — ${settings.business_name}` : ""}` : "—" },
              { icon: "🏦", label: settings?.bank_name ?? "Banco", value: settings?.bank_account ?? "—" },
            ].map((acc) => (
              <div key={acc.label} className="flex items-center gap-2 bg-wo-carbon rounded-wo-btn px-3 py-2 mb-2" style={{ border: "0.5px solid rgba(255,255,255,0.07)" }}>
                <span>{acc.icon}</span>
                <div>
                  <p className="font-jakarta text-[10px] text-wo-crema-muted">{acc.label}</p>
                  <p className="font-jakarta text-xs text-wo-crema font-medium">{acc.value}</p>
                </div>
              </div>
            ))}

            <div className="mt-4 mb-4">
              <p className="font-jakarta text-[11px] text-wo-crema-muted mb-2 font-semibold uppercase">Comprobante de pago</p>
              <label className="block cursor-pointer">
                <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => setUpgradeReceipt(e.target.files?.[0] ?? null)} />
                <div className="rounded-wo-card p-4 flex items-center gap-3 transition-all" style={{ border: upgradeReceipt ? "1px dashed hsl(var(--wo-esmeralda))" : "1px dashed rgba(255,255,255,0.15)", background: upgradeReceipt ? "rgba(46,204,113,0.04)" : "transparent" }}>
                  {upgradeReceipt ? <Check size={16} className="text-secondary" /> : <Upload size={16} className="text-wo-crema-muted" />}
                  <p className="font-jakarta text-xs text-wo-crema-muted">{upgradeReceipt ? upgradeReceipt.name : "Subir comprobante (JPG · PNG · PDF)"}</p>
                </div>
              </label>
            </div>

            <button
              disabled={!upgradeReceipt || upgrading}
              onClick={handleUpgradeSubmit}
              className="w-full bg-primary text-primary-foreground font-jakarta font-bold text-sm py-3 rounded-wo-btn hover:bg-wo-oro-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {upgrading ? "Enviando..." : "Enviar solicitud de upgrade →"}
            </button>
            <p className="font-jakarta text-[11px] text-wo-crema/30 text-center mt-2">El admin revisará tu comprobante y actualizará tu paquete.</p>
          </div>
        </div>
      )}
    </div>
  );
}
