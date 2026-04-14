import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Copy, Check, LogOut, ExternalLink, DollarSign, Users, ShoppingBag, AlertTriangle, Clock, Lock, ArrowUpCircle, X, MessageCircle, Package } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { PackageType } from "@/lib/database.types";
import { useAffiliateStats, useMyCommissions, useMyNetwork, useMyPayments, useSubmitPayment, useWallet, useUpdateProfile, useProfile, useBusinessSettings } from "@/hooks/useAffiliate";
import { useMyOrders } from "@/hooks/useOrders";

const PACKAGES: { name: PackageType; depthUnlocked: number; investment: number }[] = [
  { name: "Básico",      depthUnlocked: 3,  investment: 100 },
  { name: "Intermedio",  depthUnlocked: 7,  investment: 2000 },
  { name: "VIP",         depthUnlocked: 10, investment: 10000 },
];

export default function AreaAfiliado() {
  const { affiliate, logout, loading } = useAuth();
  const navigate = useNavigate();
  const [copied,           setCopied]           = useState(false);
  const [copiedUrl,        setCopiedUrl]        = useState(false);
  const [networkView,      setNetworkView]      = useState<"tree" | "list">("list");
  const [commFilter,       setCommFilter]       = useState("Todo");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileAddress,   setProfileAddress]   = useState("");
  const [profileCity,      setProfileCity]      = useState("");
  const [profilePhone,     setProfilePhone]     = useState("");
  const [profileYape,      setProfileYape]      = useState("");
  const [updatingProfile,  setUpdatingProfile]  = useState(false);
  const [saveSuccess,      setSaveSuccess]      = useState(false);
  const [activeTab,        setActiveTab]        = useState<"inicio" | "mi-red" | "comisiones" | "pagos" | "pedidos">("inicio");

  const submitPayment  = useSubmitPayment();
  const updateProfile  = useUpdateProfile();

  const { data: settings }         = useBusinessSettings();
  const { data: affiliateStats }   = useAffiliateStats();
  const { data: myOrders = [] }    = useMyOrders();
  const { data: liveProfile }      = useProfile();
  const { data: commissions = [] } = useMyCommissions();
  const { data: network = [] }     = useMyNetwork();
  const { data: payments = [] }    = useMyPayments();
  const { data: walletData }       = useWallet();

  if (!affiliate) return null;

  const currentPackageIdx = PACKAGES.findIndex((p) => p.name === affiliate.package);
  const currentPackage    = PACKAGES[Math.max(0, currentPackageIdx)];
  const nextPackage       = PACKAGES[currentPackageIdx + 1];

  const totalSales = affiliateStats?.total_sales       ?? affiliate.total_sales       ?? 0;
  const totalComm     = affiliateStats?.total_commissions ?? affiliate.total_commissions ?? 0;
  const walletBalance = walletData?.balance ?? 0;

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

  const visibleNetwork = network.filter((n) => n.level <= currentPackage.depthUnlocked);


  return (
    <div className="min-h-screen bg-background pt-16 pb-16">
      {/* Header */}
      <div className="bg-wo-grafito" style={{ borderBottom: "0.5px solid rgba(255,255,255,0.07)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="font-jakarta font-semibold text-base text-wo-crema">Hola, {affiliate.name.split(" ")[0]} 👋</span>
              <span className="text-[10px] font-jakarta font-bold px-2 py-0.5 rounded-wo-pill" style={{ background: "rgba(232,116,26,0.12)", color: "hsl(var(--wo-oro))", border: "0.5px solid rgba(232,116,26,0.25)" }}>
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
            {isPending ? (
              <span className="flex items-center gap-1.5 font-jakarta text-xs text-wo-crema/30">
                <Lock size={10} /> Tienda disponible al activar cuenta
              </span>
            ) : (
              <>
                <Link to={`/tienda/${affiliate.affiliate_code}`} className="font-jakarta text-xs text-primary hover:underline flex items-center gap-1">
                  Ver mi tienda → <ExternalLink size={10} />
                </Link>
                <Link to="/editar-tienda" className="font-jakarta text-xs text-secondary hover:underline flex items-center gap-1">
                  Editar tienda ✏️
                </Link>
              </>
            )}
            <span className="flex items-center gap-1 text-secondary font-jakarta text-[11px] ml-2">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" /> En línea
            </span>
          </div>
        </div>
      </div>

      {/* Banner: cuenta pendiente de activación */}
      {isPending && (
        <div className="px-4 sm:px-6 lg:px-8 pt-4 max-w-7xl mx-auto">
          <div className="rounded-wo-card p-4 flex items-start gap-3" style={{ background: "rgba(232,116,26,0.08)", border: "1px solid rgba(232,116,26,0.35)" }}>
            <Clock size={18} className="text-primary shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-jakarta font-bold text-sm text-primary">Cuenta creada — activa tu paquete {affiliate.package}</p>
              <p className="font-jakarta text-xs text-wo-crema-muted mt-0.5">
                Ya estás dentro. Para desbloquear comisiones y todos los beneficios, ve al catálogo y realiza compras por el valor de tu paquete (<strong className="text-wo-crema">S/ {currentPackage.investment.toLocaleString()}</strong>). Una vez que la administración apruebe tus compras, tu cuenta queda activa.
              </p>
            </div>
            <Link to="/catalogo" className="font-jakarta text-[11px] font-bold text-primary hover:underline shrink-0 whitespace-nowrap bg-primary/10 px-3 py-1.5 rounded-wo-btn">
              Ir al catálogo →
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
                Tu cuenta está suspendida{affiliate.suspended_at ? ` desde el ${new Date(affiliate.suspended_at).toLocaleDateString("es-PE")}` : ""}. No estás generando comisiones. Realiza compras acumulables por S/ 300 en el catálogo para reactivar.
              </p>
            </div>
            <Link to="/catalogo" className="font-jakarta font-bold text-[11px] text-destructive hover:underline shrink-0 whitespace-nowrap bg-destructive/10 px-3 py-1.5 rounded-wo-btn">
              Ir al catálogo →
            </Link>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="sticky top-16 z-20 bg-wo-grafito" style={{ borderBottom: "0.5px solid rgba(255,255,255,0.07)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto">
            {([
              { id: "inicio",     label: "Inicio",      icon: "🏠" },
              { id: "pedidos",    label: "Mis Pedidos", icon: "📦" },
              { id: "mi-red",     label: "Mi Red",      icon: "👥" },
              { id: "comisiones", label: "Comisiones",  icon: "💰" },
              { id: "pagos",      label: "Pagos",       icon: "📋" },
            ] as const).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 font-jakarta font-semibold text-xs px-5 py-3.5 whitespace-nowrap transition-colors border-b-2 -mb-px ${
                  activeTab === tab.id
                    ? "text-primary border-primary"
                    : "text-wo-crema-muted border-transparent hover:text-wo-crema"
                }`}
              >
                <span>{tab.icon}</span> {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* ── Tab: Inicio ─────────────────────────────────────────── */}
        {activeTab === "inicio" && <>
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "VENTAS TOTALES",      value: `S/ ${totalSales.toLocaleString()}`,   change: "",    up: true, color: "text-primary",   icon: <ShoppingBag size={16} /> },
            { label: "COMISIONES GANADAS",  value: `S/ ${totalComm.toLocaleString()}`,    change: "",    up: true, color: "text-primary",   icon: <DollarSign size={16} /> },
            { label: "REFERIDOS DIRECTOS",  value: String(affiliate.referral_count ?? 0), change: "",    up: true, color: "text-wo-crema",  icon: <Users size={16} /> },
          ].map((kpi, i) => (
            <div key={i} className="bg-wo-grafito rounded-wo-card p-5 relative overflow-hidden" style={{ border: isSuspended ? "0.5px solid rgba(239,68,68,0.2)" : isPending ? "0.5px solid rgba(232,116,26,0.2)" : "0.5px solid rgba(255,255,255,0.07)" }}>
              {isSuspended && (
                <div className="absolute top-2 right-2">
                  <span className="font-jakarta font-bold text-[9px] px-1.5 py-0.5 rounded-wo-pill" style={{ background: "rgba(239,68,68,0.12)", color: "rgb(239,68,68)", border: "0.5px solid rgba(239,68,68,0.3)" }}>
                    SUSPENDIDO
                  </span>
                </div>
              )}
              {isPending && (
                <div className="absolute top-2 right-2">
                  <span className="font-jakarta font-bold text-[9px] px-1.5 py-0.5 rounded-wo-pill" style={{ background: "rgba(232,116,26,0.12)", color: "hsl(var(--wo-oro))", border: "0.5px solid rgba(232,116,26,0.3)" }}>
                    PENDIENTE
                  </span>
                </div>
              )}
              <p className="font-jakarta text-[11px] text-wo-crema-muted uppercase font-medium">{kpi.label}</p>
              <p className={`font-syne font-extrabold text-[28px] mt-1 ${isSuspended || isPending ? "text-wo-crema/40" : kpi.color}`}>{kpi.value}</p>
              <div className={`font-jakarta text-xs font-medium mt-1 ${isSuspended || isPending ? "text-wo-crema/30" : "text-wo-crema-muted"}`}>
                {kpi.icon}
              </div>
            </div>
          ))}
        </div>

        {/* Pending: instrucciones de activación */}
        {isPending && (
          <div className="rounded-wo-card p-6" style={{ background: "rgba(232,116,26,0.04)", border: "0.5px solid rgba(232,116,26,0.2)" }}>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="font-jakarta font-bold text-sm text-wo-crema">3 pasos para activar tu cuenta</h3>
                <p className="font-jakarta text-xs text-wo-crema-muted mt-0.5">Tu perfil ya está creado. Solo falta completar tu primera compra.</p>
              </div>
              <span className="font-jakarta font-bold text-[10px] px-2 py-1 rounded-wo-pill shrink-0" style={{ background: "rgba(232,116,26,0.12)", color: "hsl(var(--wo-oro))", border: "0.5px solid rgba(232,116,26,0.3)" }}>
                PASO 3/5
              </span>
            </div>
            <div className="space-y-3 mb-5">
              {[
                { n: 1, done: true,  text: "✓ Registro como socio completado" },
                { n: 2, done: true,  text: `✓ Paquete elegido: ${affiliate.package} — meta S/ ${currentPackage.investment.toLocaleString()}` },
                { n: 3, done: false, text: "Ir al catálogo y realizar compras hasta alcanzar la meta de tu paquete" },
                { n: 4, done: false, text: "Administración revisa y aprueba tus compras (menos de 24h)" },
                { n: 5, done: false, text: "¡Cuenta activa! Comisiones, tienda y red desbloqueados" },
              ].map((s) => (
                <div key={s.n} className="flex items-start gap-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center font-jakarta font-bold text-[10px] shrink-0 mt-0.5 ${s.done ? "bg-secondary text-background" : s.n === 3 ? "bg-primary text-primary-foreground" : "bg-wo-carbon text-wo-crema-muted"}`} style={!s.done && s.n !== 3 ? { border: "0.5px solid rgba(255,255,255,0.12)" } : {}}>
                    {s.done ? <Check size={9} /> : s.n}
                  </div>
                  <p className={`font-jakarta text-xs leading-relaxed ${s.done ? "text-secondary line-through opacity-60" : s.n === 3 ? "text-wo-crema font-semibold" : "text-wo-crema-muted"}`}>{s.text}</p>
                </div>
              ))}
            </div>
            <Link to="/catalogo" className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-jakarta font-bold text-xs px-6 py-3 rounded-wo-btn transition-colors hover:bg-wo-oro-dark">
              Ir al catálogo ahora <ShoppingBag size={14} />
            </Link>
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
                    style={{ background: copiedUrl ? "rgba(30,192,213,0.15)" : "rgba(232,116,26,0.1)", color: copiedUrl ? "rgb(30,192,213)" : "hsl(var(--wo-oro))", border: "0.5px solid rgba(232,116,26,0.25)" }}
                  >
                    {copiedUrl ? "✓ Copiado" : "Copiar"}
                  </button>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`Visita mi tienda Winclick: ${window.location.origin}/tienda/${affiliate.affiliate_code}`)}`}
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

        {/* Perfil & Datos de Envío */}
        {!isPending && (
          <div className="bg-wo-grafito rounded-wo-card p-5" style={{ border: "0.5px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-center justify-between mb-4">
              <p className="font-jakarta text-[10px] text-wo-crema-muted uppercase font-semibold">Mi Perfil & Preferencias de Envío</p>
              <button onClick={() => {
                setProfileAddress(liveProfile?.shipping_address ?? affiliate?.shipping_address ?? "");
                setProfileCity(liveProfile?.shipping_city ?? affiliate?.shipping_city ?? "");
                setProfilePhone(liveProfile?.phone ?? affiliate?.phone ?? "");
                setProfileYape(liveProfile?.yape_number ?? affiliate?.yape_number ?? "");
                setShowProfileModal(true);
              }} className="font-jakarta text-xs text-secondary hover:text-wo-oro flex items-center gap-1 transition-colors bg-wo-carbon px-3 py-1.5 rounded-lg" style={{ border: "0.5px solid rgba(255,255,255,0.1)" }}>
                Editar datos ✏️
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="font-jakarta text-[11px] text-wo-crema-muted mb-1">Celular / WhatsApp</p>
                <p className="font-jakarta text-sm text-wo-crema font-medium">{(liveProfile || affiliate).phone || "No configurado"}</p>
              </div>
              <div>
                <p className="font-jakarta text-[11px] text-wo-crema-muted mb-1">Dirección defecto</p>
                <p className="font-jakarta text-sm text-wo-crema font-medium truncate">{(liveProfile || affiliate).shipping_address || "No configurada"}</p>
              </div>
              <div>
                <p className="font-jakarta text-[11px] text-wo-crema-muted mb-1">Ciudad / Distrito</p>
                <p className="font-jakarta text-sm text-wo-crema font-medium truncate">{(liveProfile || affiliate).shipping_city || "No configurada"}</p>
              </div>
              <div>
                <p className="font-jakarta text-[11px] text-wo-crema-muted mb-1">Yape / Plin afiliado</p>
                <p className="font-jakarta text-sm text-wo-crema font-medium">{(liveProfile || affiliate).yape_number || "No configurado"}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tu Paquete */}
        <div className="bg-wo-grafito rounded-wo-card p-5" style={{ border: "0.5px solid rgba(255,255,255,0.07)" }}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-jakarta text-[10px] text-wo-crema-muted uppercase font-semibold mb-2">Tu paquete actual</p>
              <div className="flex items-center gap-3">
                <span className="font-jakarta font-bold text-sm px-3 py-1 rounded-wo-pill bg-primary text-primary-foreground">{currentPackage.name}</span>
                <span className="font-jakarta text-[11px] text-wo-crema-muted">
                  Niveles <strong className="text-primary">1–{currentPackage.depthUnlocked}</strong> de 10 desbloqueados
                </span>
              </div>
            </div>
            {nextPackage && !isPending && (
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="flex items-center gap-2 font-jakarta font-bold text-xs px-4 py-2.5 rounded-wo-btn transition-colors hover:bg-primary hover:text-primary-foreground"
                style={{ border: "0.5px solid rgba(232,116,26,0.35)", color: "hsl(var(--wo-oro))" }}
              >
                <ArrowUpCircle size={13} /> Mejorar a {nextPackage.name}
              </button>
            )}
          </div>
        </div>

        </>}

        {/* ── Tab: Mis Pedidos ────────────────────────────────────── */}
        {activeTab === "pedidos" && <>
        <div>
          <h3 className="font-syne font-bold text-lg text-wo-crema mb-4">Mis Pedidos</h3>
          {myOrders.length === 0 ? (
            <div className="bg-wo-grafito rounded-wo-card p-10 flex flex-col items-center gap-3" style={{ border: "0.5px solid rgba(255,255,255,0.07)" }}>
              <Package size={36} className="text-wo-crema/20" />
              <p className="font-jakarta text-sm text-wo-crema-muted">Aún no tienes pedidos</p>
              <Link to="/catalogo" className="font-jakarta font-bold text-xs text-primary hover:underline mt-1">
                Ir al catálogo →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {myOrders.map((order) => {
                const statusColor =
                  order.status === "entregado"  ? "text-secondary bg-secondary/10 border-secondary/30" :
                  order.status === "aprobado"   ? "text-primary bg-primary/10 border-primary/30" :
                  order.status === "cancelado"  ? "text-destructive bg-destructive/10 border-destructive/30" :
                  "text-wo-crema-muted bg-wo-carbon border-wo-crema/10";
                const statusLabel: Record<string, string> = {
                  pendiente:  "Pendiente",
                  aprobado:   "Aprobado",
                  entregado:  "Entregado",
                  cancelado:  "Cancelado",
                };
                return (
                  <div key={order.id} className="bg-wo-grafito rounded-wo-card p-4" style={{ border: "0.5px solid rgba(255,255,255,0.07)" }}>
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                      <div>
                        <p className="font-jakarta font-bold text-sm text-wo-crema">{order.order_number ?? `#${order.id.slice(0, 8)}`}</p>
                        <p className="font-jakarta text-[11px] text-wo-crema-muted mt-0.5">
                          {new Date(order.created_at).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="font-syne font-bold text-lg text-primary">S/ {order.total.toFixed(2)}</p>
                        <span className={`font-jakarta font-bold text-[10px] px-2 py-0.5 rounded-wo-pill border ${statusColor}`}>
                          {statusLabel[order.status] ?? order.status}
                        </span>
                      </div>
                    </div>
                    {order.order_items && order.order_items.length > 0 && (
                      <div className="border-t pt-3 space-y-1.5" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                        {order.order_items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between">
                            <p className="font-jakarta text-xs text-wo-crema-muted">
                              {item.name} <span className="text-wo-crema/40">× {item.quantity}</span>
                            </p>
                            <p className="font-jakarta text-xs text-wo-crema">S/ {(item.price * item.quantity).toFixed(2)}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="mt-3 flex flex-wrap gap-3 text-[11px] font-jakarta text-wo-crema/40">
                      <span>📦 {order.shipping_address}, {order.shipping_city}</span>
                      <span>💳 {order.payment_method === "wallet" ? "Billetera" : "Transferencia"}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        </>}

        {/* ── Tab: Mi Red ─────────────────────────────────────────── */}
        {activeTab === "mi-red" && <>
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
                      {["Nivel", "Nombre", "Código", "Paquete", "Ventas", "Estado"].map((h) => (
                        <th key={h} className="text-left px-4 py-3 font-jakarta text-[11px] text-wo-crema-muted uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {visibleNetwork.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center font-jakarta text-sm text-wo-crema-muted">Aún no tienes referidos en tu red</td>
                      </tr>
                    ) : visibleNetwork.map(({ level, referred: ref }) => (
                      <tr key={ref.id} style={{ borderBottom: "0.5px solid rgba(255,255,255,0.07)" }}>
                        <td className="px-4 py-3 font-jakarta text-xs text-primary font-bold">Niv. {level}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-wo-carbon flex items-center justify-center font-jakarta text-[10px] font-bold text-wo-crema">
                              {ref.name.split(" ").map((n: string) => n[0]).join("")}
                            </div>
                            <span className="font-jakarta text-sm text-wo-crema">{ref.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-jakarta text-xs text-wo-crema-muted">{ref.affiliate_code}</td>
                        <td className="px-4 py-3">
                          <span className="text-[10px] font-jakarta font-bold px-2 py-0.5 rounded-wo-pill" style={{ background: "rgba(232,116,26,0.12)", color: "hsl(var(--wo-oro))" }}>
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
                <p className="font-jakarta text-xs text-wo-crema-muted mb-6">{affiliate.affiliate_code}</p>
                {visibleNetwork.length === 0 ? (
                  <p className="font-jakarta text-sm text-wo-crema-muted">Aún no tienes referidos en tu red</p>
                ) : (
                  <div className="w-full">
                    {Array.from(new Set(visibleNetwork.map((r) => r.level))).map((lvl) => (
                      <div key={lvl} className="mb-6 flex flex-col items-center">
                        <div className="flex items-center gap-2 mb-4 w-full">
                           <div className="flex-1 h-px bg-primary/20" />
                           <span className="font-jakarta text-[10px] font-bold text-primary uppercase">Nivel {lvl}</span>
                           <div className="flex-1 h-px bg-primary/20" />
                        </div>
                        <div className="flex gap-4 flex-wrap justify-center">
                          {visibleNetwork.filter((r) => r.level === lvl).map(({ level, referred: ref }) => (
                            <div key={ref.id} className="flex flex-col items-center">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-jakarta text-xs font-bold ${ref.account_status === "active" ? "bg-wo-carbon text-wo-crema" : "bg-wo-carbon/50 text-wo-crema-muted"}`}>
                                {ref.name.split(" ").map((n: string) => n[0]).join("").substring(0,2)}
                              </div>
                              <p className="font-jakarta text-[10px] text-wo-crema-muted mt-1">{ref.name.split(" ")[0]}</p>
                              <span className="text-[9px] text-primary font-jakarta">{ref.package}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        </>}

        {/* ── Tab: Comisiones ─────────────────────────────────────── */}
        {activeTab === "comisiones" && <>
        {/* Commission history */}
        {isPending ? (
          <div className="rounded-wo-card p-6 flex items-center gap-4" style={{ background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.07)" }}>
            <div className="w-10 h-10 rounded-wo-icon bg-wo-carbon flex items-center justify-center shrink-0">
              <Lock size={16} className="text-wo-crema/30" />
            </div>
            <div>
              <p className="font-jakarta font-semibold text-sm text-wo-crema/50">Historial de comisiones</p>
              <p className="font-jakarta text-xs text-wo-crema/30 mt-0.5">Disponible cuando tu cuenta esté activa. Activa comprando S/ {currentPackage.investment.toLocaleString()} en el catálogo.</p>
            </div>
          </div>
        ) : (
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
        )}

        </>}

        {/* ── Tab: Pagos ───────────────────────────────────────────── */}
        {activeTab === "pagos" && <>
        {isPending ? (
          <div className="rounded-wo-card p-6 flex items-center gap-4" style={{ background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.07)" }}>
            <div className="w-10 h-10 rounded-wo-icon bg-wo-carbon flex items-center justify-center shrink-0">
              <Lock size={16} className="text-wo-crema/30" />
            </div>
            <div>
              <p className="font-jakarta font-semibold text-sm text-wo-crema/50">Comprobantes enviados</p>
              <p className="font-jakarta text-xs text-wo-crema/30 mt-0.5">Solo disponible para cuentas activas.</p>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-syne font-bold text-lg text-wo-crema">Comprobantes enviados</h3>
              <div className="bg-wo-grafito rounded-wo-btn px-4 py-2" style={{ border: "0.5px solid rgba(255,255,255,0.07)" }}>
                <p className="font-jakarta text-[10px] text-wo-crema-muted">Saldo billetera</p>
                <p className="font-syne font-bold text-base text-primary">S/ {walletBalance.toFixed(2)}</p>
              </div>
            </div>
            <div className="bg-wo-grafito rounded-wo-card overflow-hidden" style={{ border: "0.5px solid rgba(255,255,255,0.07)" }}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: "0.5px solid rgba(255,255,255,0.07)" }}>
                      {["Fecha", "Tipo", "Monto", "Estado"].map((h) => (
                        <th key={h} className="text-left px-4 py-3 font-jakarta text-[11px] text-wo-crema-muted uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {payments.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center font-jakarta text-sm text-wo-crema-muted">No hay comprobantes enviados</td>
                      </tr>
                    ) : payments.map((p) => {
                      const typeLabel: Record<string, string> = {
                        activacion:         "Activación",
                        upgrade:            "Upgrade",
                        retiro:             "Retiro",
                        reactivacion:       "Reactivación",
                        recarga_billetera:  "Recarga",
                      };
                      return (
                        <tr key={p.id} style={{ borderBottom: "0.5px solid rgba(255,255,255,0.07)" }}>
                          <td className="px-4 py-3 font-jakarta text-xs text-wo-crema-muted">{new Date(p.created_at).toLocaleDateString("es-PE")}</td>
                          <td className="px-4 py-3">
                            <span className="font-jakarta text-[10px] font-bold px-2 py-0.5 rounded-wo-pill" style={{ background: "rgba(232,116,26,0.12)", color: "hsl(var(--wo-oro))", border: "0.5px solid rgba(232,116,26,0.2)" }}>
                              {typeLabel[p.type] ?? p.type}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-jakarta text-sm font-bold text-primary">S/ {p.amount.toFixed(2)}</td>
                          <td className="px-4 py-3">
                            <span className={`font-jakarta text-xs font-bold ${p.status === "aprobado" ? "text-secondary" : p.status === "pendiente" ? "text-primary" : "text-destructive"}`}>
                              {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        </>}
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
              <div className="rounded-wo-btn p-3 text-center" style={{ background: "rgba(232,116,26,0.08)", border: "0.5px solid rgba(232,116,26,0.3)" }}>
                <p className="font-jakarta text-[10px] text-primary uppercase mb-1">Nuevo</p>
                <p className="font-jakarta font-bold text-sm text-wo-crema">{nextPackage.name}</p>
                <p className="font-jakarta text-[11px] text-secondary">Niveles 1–{nextPackage.depthUnlocked}</p>
              </div>
            </div>

            <div className="rounded-wo-btn p-4 mb-5 flex items-center justify-between" style={{ background: "rgba(232,116,26,0.05)", border: "0.5px solid rgba(232,116,26,0.2)" }}>
              <div>
                <p className="font-jakarta text-[11px] text-wo-crema-muted">Acumulado requerido</p>
                <p className="font-syne font-extrabold text-2xl text-primary">S/ {(nextPackage.investment - currentPackage.investment).toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="font-jakarta text-[10px] text-wo-crema-muted">{currentPackage.name}: S/ {currentPackage.investment.toLocaleString()}</p>
                <p className="font-jakarta text-[10px] text-wo-crema-muted">{nextPackage.name}: S/ {nextPackage.investment.toLocaleString()}</p>
              </div>
            </div>

            <div className="mb-6 p-4 rounded-xl bg-wo-carbon/50" style={{ border: "0.5px solid rgba(255,255,255,0.05)" }}>
              <p className="font-jakarta text-sm text-wo-crema leading-relaxed mb-2">
                <strong>¿Cómo hago el Upgrade?</strong>
              </p>
              <p className="font-jakarta text-[13px] text-wo-crema-muted leading-relaxed">
                Para ascender a <strong className="text-wo-crema">{nextPackage.name}</strong>, no necesitas enviar una transferencia directa de este monto acá, sino <strong>adquirir esa cantidad en productos</strong> a través de nuestra tienda. 
              </p>
              <ul className="mt-3 space-y-1 ml-4 list-disc font-jakarta text-xs text-wo-crema/60">
                <li>Ve al catálogo y agrega productos a tu carrito.</li>
                <li>Finaliza la compra subiendo el comprobante respectivo allí mismo.</li>
                <li>Una vez que la administración apruebe tus compras, tu paquete será actualizado automáticamente.</li>
              </ul>
            </div>

            <div className="flex flex-col gap-3">
              <Link
                to="/catalogo"
                className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-jakarta font-bold text-sm py-3.5 rounded-wo-btn hover:bg-wo-oro-dark transition-colors"
              >
                <ShoppingBag size={16} /> Ir al Catálogo de Productos
              </Link>
              {settings?.whatsapp_number && (
                <a
                  href={`https://wa.me/${settings.whatsapp_number.replace(/\D/g, "")}?text=${encodeURIComponent(
                    `Hola, soy ${affiliate?.name ?? "socio"} (${affiliate?.affiliate_code ?? ""}). Quiero hacer un upgrade a paquete ${nextPackage?.name}. ¿Me pueden asesorar?`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#25D366] text-white font-jakarta font-bold text-sm py-3.5 rounded-wo-btn hover:bg-[#1ebe5d] transition-colors"
                >
                  <MessageCircle size={16} /> Hablar con un asesor por WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========== MODAL: Mi Perfil ========== */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-wo-grafito rounded-2xl max-w-sm w-full p-6 relative border border-wo-crema/10 shadow-2xl">
            <button onClick={() => setShowProfileModal(false)} className="absolute top-4 right-4 text-wo-crema-muted hover:text-wo-crema">
              <X size={18} />
            </button>
            <h3 className="font-syne font-bold text-lg text-wo-crema mb-1">Mi Perfil</h3>
            <p className="font-jakarta text-xs text-wo-crema-muted mb-5">
              Guarda tu dirección para no tener que escribirla de nuevo al hacer tus compras.
            </p>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <div>
                <label className="block font-jakarta text-xs text-wo-crema-muted font-medium mb-1.5">Número Celular / WhatsApp</label>
                <input
                  type="tel"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  placeholder="Ej: 987 654 321"
                  className="w-full bg-wo-carbon font-jakarta text-sm text-wo-crema placeholder:text-wo-crema/30 px-4 py-3 rounded-wo-btn outline-none focus:ring-1 focus:ring-primary"
                  style={{ border: "0.5px solid rgba(255,255,255,0.1)" }}
                />
              </div>
              <div>
                <label className="block font-jakarta text-xs text-wo-crema-muted font-medium mb-1.5">Dirección de envío por defecto</label>
                <input
                  type="text"
                  value={profileAddress}
                  onChange={(e) => setProfileAddress(e.target.value)}
                  placeholder="Ej: Av. Lima 123"
                  className="w-full bg-wo-carbon font-jakarta text-sm text-wo-crema placeholder:text-wo-crema/30 px-4 py-3 rounded-wo-btn outline-none focus:ring-1 focus:ring-primary"
                  style={{ border: "0.5px solid rgba(255,255,255,0.1)" }}
                />
              </div>
              <div>
                <label className="block font-jakarta text-xs text-wo-crema-muted font-medium mb-1.5">Ciudad / Distrito</label>
                <input
                  type="text"
                  value={profileCity}
                  onChange={(e) => setProfileCity(e.target.value)}
                  placeholder="Ej: Miraflores, Lima"
                  className="w-full bg-wo-carbon font-jakarta text-sm text-wo-crema placeholder:text-wo-crema/30 px-4 py-3 rounded-wo-btn outline-none focus:ring-1 focus:ring-primary"
                  style={{ border: "0.5px solid rgba(255,255,255,0.1)" }}
                />
              </div>
              <div>
                <label className="block font-jakarta text-xs text-wo-crema-muted font-medium mb-1.5">Número Yape / Plin (Opcional)</label>
                <input
                  type="tel"
                  value={profileYape}
                  onChange={(e) => setProfileYape(e.target.value)}
                  placeholder="Ej: 987 654 321"
                  className="w-full bg-wo-carbon font-jakarta text-sm text-wo-crema placeholder:text-wo-crema/30 px-4 py-3 rounded-wo-btn outline-none focus:ring-1 focus:ring-primary"
                  style={{ border: "0.5px solid rgba(255,255,255,0.1)" }}
                />
              </div>
            </div>
            <button
              disabled={updatingProfile || saveSuccess}
              onClick={async () => {
                setUpdatingProfile(true);
                try {
                  await updateProfile.mutateAsync({
                    shipping_address: profileAddress,
                    shipping_city: profileCity,
                    phone: profilePhone,
                    yape_number: profileYape,
                  });
                  setSaveSuccess(true);
                  setTimeout(() => {
                    setShowProfileModal(false);
                    setSaveSuccess(false);
                  }, 1200);
                } finally {
                  setUpdatingProfile(false);
                }
              }}
              className={`w-full font-jakarta font-bold text-sm py-3 mt-6 rounded-wo-btn transition-colors disabled:cursor-not-allowed ${saveSuccess ? "bg-secondary text-white border-transparent" : "bg-primary text-primary-foreground hover:bg-wo-oro-dark disabled:opacity-40"}`}
            >
              {saveSuccess ? "¡Guardado exitosamente!" : updatingProfile ? "Guardando..." : "Guardar mis datos"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
