import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useProducts } from "@/hooks/useProducts";
import {
  useAllAffiliates, useAllOrders, useAllPayments,
  useApprovePayment, useRejectPayment, useBreakageCommissions,
  useUpdateAffiliate, useUpdateProduct, useCreateProduct,
  useUpdateBusinessSettings,
  type OrderWithItems, type PaymentWithAffiliate,
} from "@/hooks/useAdmin";
import { useBusinessSettings } from "@/hooks/useAffiliate";
import type { Affiliate, Product } from "@/lib/database.types";
import {
  Settings, ShoppingBag, Users, Package, BarChart3, Wallet, CreditCard,
  Gamepad2, AlertTriangle, Search, Eye, CheckCircle, XCircle, ArrowUpRight,
  ArrowDownRight, TrendingUp, Trophy, Target,
  DollarSign, Download, MoreHorizontal, Edit2, Trash2, Plus, Star,
} from "lucide-react";

const tabs = [
  { id: "resumen",      label: "Resumen",       icon: <BarChart3 size={14} /> },
  { id: "pedidos",      label: "Pedidos",        icon: <ShoppingBag size={14} /> },
  { id: "afiliados",    label: "Afiliados",      icon: <Users size={14} /> },
  { id: "catalogo",     label: "Catálogo",       icon: <Package size={14} /> },
  { id: "reportes",     label: "Reportes",       icon: <BarChart3 size={14} /> },
  { id: "billetera",    label: "Billetera",      icon: <Wallet size={14} /> },
  { id: "pagos",        label: "Pagos",          icon: <CreditCard size={14} /> },
  { id: "gamificacion", label: "Gamificación",   icon: <Gamepad2 size={14} /> },
  { id: "remanentes",   label: "Remanentes",     icon: <AlertTriangle size={14} /> },
];

const cardStyle = { border: "0.5px solid rgba(255,255,255,0.07)" };
const rowBorder = { borderBottom: "0.5px solid rgba(255,255,255,0.07)" };

// Static gamification data (missions/seasons tables dropped from DB)
const mockSeasons = [
  { name: "Temporada Dorada Q1", startDate: "2026-01-01", endDate: "2026-03-31", active: true, participants: 0, totalPoints: 0 },
];
const mockMissions = [
  { id: "1", name: "Primera venta", points: 50, completedBy: 0, active: true, type: "onboarding" },
  { id: "2", name: "Refiere 3 socios", points: 100, completedBy: 0, active: true, type: "referido" },
];
const mockLeaderboard: { name: string; code: string; points: number; package: string }[] = [];

function statusBadge(status: string) {
  const map: Record<string, string> = {
    aprobado: "bg-secondary/15 text-secondary",
    pendiente: "bg-primary/15 text-primary",
    rechazado: "bg-destructive/15 text-destructive",
    entregado: "bg-secondary/15 text-secondary",
    procesando: "bg-wo-crema/10 text-wo-crema-muted",
    enviado: "bg-wo-crema/10 text-wo-crema-muted",
    cancelado: "bg-destructive/15 text-destructive",
  };
  return map[status] ?? "bg-wo-crema/10 text-wo-crema-muted";
}

export default function AdminDashboard() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const [activeTab,            setActiveTab]            = useState("resumen");
  const [openSettings,         setOpenSettings]         = useState(false);
  const [orderFilter,          setOrderFilter]          = useState("todos");
  const [affiliateSearch,      setAffiliateSearch]      = useState("");
  const [affiliateStatusFilter,setAffiliateStatusFilter]= useState<"todos" | "active" | "suspended" | "pending">("todos");
  const [paymentSubTab,        setPaymentSubTab]        = useState<"activaciones" | "reactivaciones" | "upgrades" | "retiros" | "recargas">("activaciones");
  const [remanentFilter,       setRemanentFilter]       = useState("todos");
  const [viewingAffiliate,     setViewingAffiliate]     = useState<Affiliate | null>(null);
  const [editingAffiliate,     setEditingAffiliate]     = useState<Affiliate | null>(null);
  const [viewingOrder,         setViewingOrder]         = useState<OrderWithItems | null>(null);
  const [viewingProduct,       setViewingProduct]       = useState<Product | null>(null);
  const [newProductModal,      setNewProductModal]      = useState(false);

  // Settings form state (métodos de pago)
  const [settingsYape,  setSettingsYape]  = useState("");
  const [settingsPlin,  setSettingsPlin]  = useState("");
  const [settingsBank,  setSettingsBank]  = useState("");
  const [settingsAcct,  setSettingsAcct]  = useState("");
  const [settingsWA,    setSettingsWA]    = useState("");
  const [settingsPhone, setSettingsPhone] = useState("");
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Edit affiliate form state
  const [affName,     setAffName]     = useState("");
  const [affYape,     setAffYape]     = useState("");
  const [affPackage,  setAffPackage]  = useState("");

  // Edit product form state
  const [prodName,    setProdName]    = useState("");
  const [prodPrice,   setProdPrice]   = useState("");
  const [prodStock,   setProdStock]   = useState("");
  const [prodDesc,    setProdDesc]    = useState("");

  // New product form state
  const [newProdName,  setNewProdName]  = useState("");
  const [newProdPrice, setNewProdPrice] = useState("");
  const [newProdStock, setNewProdStock] = useState("");
  const [newProdDesc,  setNewProdDesc]  = useState("");
  const [newProdImg,   setNewProdImg]   = useState("");

  // Data hooks
  const { data: affiliates = [], isLoading: loadingAffiliates } = useAllAffiliates();
  const { data: orders = [],     isLoading: loadingOrders }     = useAllOrders();
  const { data: payments = [],   isLoading: loadingPayments }   = useAllPayments();
  const { data: breakage = [] }                                 = useBreakageCommissions();
  const { data: products = [],   isLoading: loadingProducts }   = useProducts(undefined, true);
  const approvePayment        = useApprovePayment();
  const rejectPayment         = useRejectPayment();
  const updateAffiliate       = useUpdateAffiliate();
  const updateProduct         = useUpdateProduct();
  const createProduct         = useCreateProduct();
  const updateBusinessSettings = useUpdateBusinessSettings();
  const { data: bizSettings } = useBusinessSettings();

  if (!isAdmin) { navigate("/login-afiliado"); return null; }

  // ─── Derived aggregates ───────────────────────────────────────────────────
  const totalRevenue     = orders.reduce((s, o) => s + o.total, 0);
  const totalCommissions = affiliates.reduce((s, a) => s + (a.total_commissions ?? 0), 0);
  const pendingWithdrawals = payments.filter((p) => p.type === "retiro" && p.status === "pendiente").reduce((s, p) => s + p.amount, 0);
  const totalRemanentes  = breakage.filter((r) => r.status === "pending").reduce((s, r) => s + r.amount, 0);

  // ─── Filtered data ────────────────────────────────────────────────────────
  const filteredOrders = orderFilter === "todos" ? orders : orders.filter((o) => o.status === orderFilter);

  const filteredAffiliates = affiliates.filter((a) => {
    const matchSearch = a.name.toLowerCase().includes(affiliateSearch.toLowerCase()) ||
      a.affiliate_code.toLowerCase().includes(affiliateSearch.toLowerCase());
    const matchStatus = affiliateStatusFilter === "todos" || a.account_status === affiliateStatusFilter;
    return matchSearch && matchStatus;
  });

  const activaciones   = payments.filter((p) => p.type === "activacion");
  const reactivaciones = payments.filter((p) => p.type === "reactivacion");
  const upgrades       = payments.filter((p) => p.type === "upgrade");
  const retiros        = payments.filter((p) => p.type === "retiro");
  const recargas       = payments.filter((p) => p.type === "recarga_billetera");

  const filteredRemanentes = breakage.filter((r) => {
    if (remanentFilter === "todos")     return true;
    if (remanentFilter === "pendiente") return r.status === "pending";
    if (remanentFilter === "resuelto")  return r.status === "paid";
    return true;
  });

  const totalPendingPayments =
    activaciones.filter((x) => x.status === "pendiente").length +
    reactivaciones.filter((x) => x.status === "pendiente").length +
    upgrades.filter((x) => x.status === "pendiente").length +
    retiros.filter((x) => x.status === "pendiente").length +
    recargas.filter((x) => x.status === "pendiente").length;

  const handleApprove = async (p: PaymentWithAffiliate) => {
    await approvePayment.mutateAsync(p.id);
  };
  const handleReject = async (p: PaymentWithAffiliate) => {
    await rejectPayment.mutateAsync(p.id);
  };

  const handleOpenSettings = () => {
    setSettingsYape(bizSettings?.yape_number ?? "");
    setSettingsPlin(bizSettings?.plin_number ?? "");
    setSettingsBank(bizSettings?.bank_name ?? "");
    setSettingsAcct(bizSettings?.bank_account ?? "");
    setSettingsWA(bizSettings?.whatsapp_number ?? "");
    setSettingsPhone(bizSettings?.contact_phone ?? "");
    setSettingsSaved(false);
    setOpenSettings(true);
  };

  const handleSaveSettings = async () => {
    if (!bizSettings?.id) return;
    await updateBusinessSettings.mutateAsync({
      id:               bizSettings.id,
      yape_number:      settingsYape,
      plin_number:      settingsPlin,
      bank_name:        settingsBank,
      bank_account:     settingsAcct,
      whatsapp_number:  settingsWA,
      contact_phone:    settingsPhone,
      contact_email:    bizSettings.contact_email ?? undefined,
    });
    setSettingsSaved(true);
  };

  const openEditAffiliate = (a: Affiliate) => {
    setAffName(a.name);
    setAffYape(a.yape_number ?? "");
    setAffPackage(a.package ?? "Básico");
    setEditingAffiliate(a);
  };

  const handleSaveAffiliate = async () => {
    if (!editingAffiliate) return;
    await updateAffiliate.mutateAsync({ id: editingAffiliate.id, name: affName, yape_number: affYape, pkg: affPackage });
    setEditingAffiliate(null);
  };

  const openEditProduct = (p: Product) => {
    setProdName(p.name);
    setProdPrice(p.price.toFixed(2));
    setProdStock(String(p.stock));
    setProdDesc(p.description ?? "");
    setViewingProduct(p);
  };

  const handleSaveProduct = async () => {
    if (!viewingProduct) return;
    await updateProduct.mutateAsync({
      id:          viewingProduct.id,
      name:        prodName,
      price:       parseFloat(prodPrice) || 0,
      stock:       parseInt(prodStock, 10) || 0,
      description: prodDesc,
    });
    setViewingProduct(null);
  };

  const handleCreateProduct = async () => {
    await createProduct.mutateAsync({
      name:        newProdName,
      price:       parseFloat(newProdPrice) || 0,
      stock:       parseInt(newProdStock, 10) || 0,
      description: newProdDesc,
      image_url:   newProdImg,
      is_active:   true,
    });
    setNewProductModal(false);
    setNewProdName(""); setNewProdPrice(""); setNewProdStock(""); setNewProdDesc(""); setNewProdImg("");
  };

  // Payment approval table row
  const PaymentRow = ({ p, extraCols }: { p: PaymentWithAffiliate; extraCols?: React.ReactNode }) => (
    <tr style={rowBorder} className="hover:bg-wo-carbon/30 transition-colors">
      <td className="px-4 py-3 font-jakarta text-xs text-wo-crema">{p.affiliate?.name ?? "—"}</td>
      <td className="px-4 py-3 font-jakarta text-xs text-wo-crema-muted">{p.affiliate?.affiliate_code ?? "—"}</td>
      {extraCols}
      <td className="px-4 py-3 font-syne font-bold text-sm text-primary">S/ {p.amount.toLocaleString()}</td>
      <td className="px-4 py-3">
        {p.receipt_url ? (
          <a href={p.receipt_url} target="_blank" rel="noopener noreferrer" className="font-jakarta text-xs text-primary hover:underline flex items-center gap-1">
            <Eye size={11} /> Ver
          </a>
        ) : <span className="font-jakarta text-xs text-wo-crema-muted">—</span>}
      </td>
      <td className="px-4 py-3 font-jakarta text-xs text-wo-crema-muted">{new Date(p.created_at).toLocaleDateString("es-PE")}</td>
      <td className="px-4 py-3">
        <span className={`font-jakarta text-xs font-bold px-2 py-0.5 rounded-wo-pill ${statusBadge(p.status)}`}>
          {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
        </span>
      </td>
      <td className="px-4 py-3">
        {p.status === "pendiente" && (
          <div className="flex gap-1">
            <button onClick={() => handleApprove(p)} disabled={approvePayment.isPending} className="flex items-center gap-1 font-jakarta text-[10px] font-bold px-2 py-1 rounded hover:bg-secondary/15 text-wo-crema-muted hover:text-secondary transition-colors">
              <CheckCircle size={11} /> Aprobar
            </button>
            <button onClick={() => handleReject(p)} disabled={rejectPayment.isPending} className="flex items-center gap-1 font-jakarta text-[10px] font-bold px-2 py-1 rounded hover:bg-destructive/15 text-wo-crema-muted hover:text-destructive transition-colors">
              <XCircle size={11} /> Rechazar
            </button>
          </div>
        )}
      </td>
    </tr>
  );

  return (
    <div className="min-h-screen bg-background pt-16 pb-16">
      {/* Header */}
      <div className="bg-wo-grafito" style={rowBorder}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-jakarta font-bold px-2 py-0.5 rounded-wo-pill bg-destructive/15 text-destructive" style={{ border: "0.5px solid rgba(231,76,60,0.3)" }}>ADMIN</span>
            <h1 className="font-syne font-extrabold text-xl text-wo-crema">Panel de Control</h1>
          </div>
          <button onClick={handleOpenSettings} className="p-2 text-wo-crema-muted hover:text-wo-crema transition-colors">
            <Settings size={16} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-wo-grafito/50" style={rowBorder}>
        <div className="max-w-7xl mx-auto px-4 overflow-x-auto scrollbar-hide">
          <div className="flex gap-1 py-2">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-1.5 whitespace-nowrap font-jakarta text-xs font-medium px-3 py-2 rounded-wo-pill transition-colors ${
                  activeTab === t.id ? "bg-primary text-primary-foreground" : "text-wo-crema-muted hover:text-wo-crema"
                }`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* =================== RESUMEN =================== */}
        {activeTab === "resumen" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Ventas totales",    value: `S/ ${totalRevenue.toFixed(2)}`,  icon: <DollarSign size={16} />, color: "text-primary",    up: true },
                { label: "Pedidos",           value: orders.length,                    icon: <ShoppingBag size={16} />, color: "text-secondary",  up: true },
                { label: "Afiliados activos", value: affiliates.filter((a) => a.account_status === "active").length, icon: <Users size={16} />, color: "text-primary", up: true },
                { label: "Inventario bajo",   value: products.filter((p) => p.stock <= 10).length, icon: <AlertTriangle size={16} />, color: "text-destructive", up: false },
              ].map((kpi, i) => (
                <div key={i} className="bg-wo-grafito rounded-wo-card p-5" style={cardStyle}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-jakarta text-[11px] text-wo-crema-muted uppercase">{kpi.label}</p>
                    <span className="text-wo-crema-muted">{kpi.icon}</span>
                  </div>
                  <p className={`font-syne font-extrabold text-[28px] ${kpi.color}`}>{kpi.value}</p>
                  <p className={`font-jakarta text-xs font-medium mt-1 ${kpi.up ? "text-secondary" : "text-destructive"}`}>
                    {kpi.up ? <ArrowUpRight size={10} className="inline" /> : <ArrowDownRight size={10} className="inline" />} en tiempo real
                  </p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-wo-grafito rounded-wo-card p-5" style={cardStyle}>
                <p className="font-jakarta text-[11px] text-wo-crema-muted uppercase mb-1">Comisiones acumuladas</p>
                <p className="font-syne font-extrabold text-xl text-primary">S/ {totalCommissions.toFixed(2)}</p>
                <p className="font-jakarta text-xs text-wo-crema-muted mt-1">Total pagado a red</p>
              </div>
              <div className="bg-wo-grafito rounded-wo-card p-5" style={cardStyle}>
                <p className="font-jakarta text-[11px] text-wo-crema-muted uppercase mb-1">Retiros pendientes</p>
                <p className="font-syne font-extrabold text-xl text-primary">S/ {pendingWithdrawals.toFixed(2)}</p>
                <p className="font-jakarta text-xs text-wo-crema-muted mt-1">{retiros.filter((w) => w.status === "pendiente").length} solicitudes</p>
              </div>
              <div className="bg-wo-grafito rounded-wo-card p-5" style={cardStyle}>
                <p className="font-jakarta text-[11px] text-wo-crema-muted uppercase mb-1">Remanentes sin asignar</p>
                <p className="font-syne font-extrabold text-xl text-destructive">S/ {totalRemanentes.toFixed(2)}</p>
                <p className="font-jakarta text-xs text-wo-crema-muted mt-1">{breakage.filter((r) => r.status === "pending").length} pendientes</p>
              </div>
            </div>

            {/* Last orders */}
            <div className="bg-wo-grafito rounded-wo-card p-5" style={cardStyle}>
              <h3 className="font-jakarta font-semibold text-sm text-wo-crema mb-4">Últimos pedidos</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr style={rowBorder}>
                    {["#", "Cliente", "Total", "Estado", "Fecha"].map((h) => (
                      <th key={h} className="text-left px-3 py-2 font-jakarta text-[11px] text-wo-crema-muted uppercase">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {orders.slice(0, 10).map((o) => (
                      <tr key={o.id} style={rowBorder}>
                        <td className="px-3 py-2 font-jakarta text-xs text-wo-crema">{o.order_number}</td>
                        <td className="px-3 py-2 font-jakarta text-xs text-wo-crema-muted">{o.customer_name}</td>
                        <td className="px-3 py-2 font-jakarta text-sm text-primary font-bold">S/ {o.total.toFixed(2)}</td>
                        <td className="px-3 py-2">
                          <span className={`font-jakarta text-xs font-bold px-2 py-0.5 rounded-wo-pill ${statusBadge(o.status)}`}>
                            {o.status.charAt(0).toUpperCase() + o.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-jakarta text-xs text-wo-crema-muted">{new Date(o.created_at).toLocaleDateString("es-PE")}</td>
                      </tr>
                    ))}
                    {orders.length === 0 && !loadingOrders && (
                      <tr><td colSpan={5} className="px-3 py-8 text-center font-jakarta text-sm text-wo-crema-muted">No hay pedidos aún</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =================== PEDIDOS =================== */}
        {activeTab === "pedidos" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-2 flex-wrap">
                {["todos", "pendiente", "procesando", "enviado", "entregado", "cancelado"].map((f) => (
                  <button key={f} onClick={() => setOrderFilter(f)} className={`font-jakarta text-xs px-3 py-1.5 rounded-wo-pill transition-colors ${
                    orderFilter === f ? "bg-primary text-primary-foreground" : "bg-wo-carbon text-wo-crema-muted hover:text-wo-crema"
                  }`}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
                ))}
              </div>
              <button className="flex items-center gap-1.5 font-jakarta text-xs text-wo-crema-muted hover:text-wo-crema px-3 py-1.5 rounded-wo-pill bg-wo-carbon">
                <Download size={12} /> Exportar
              </button>
            </div>

            <div className="bg-wo-grafito rounded-wo-card overflow-hidden" style={cardStyle}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr style={rowBorder}>
                    {["# Pedido", "Cliente", "Items", "Total", "Método", "Estado", "Fecha", "Acciones"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 font-jakarta text-[11px] text-wo-crema-muted uppercase">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {filteredOrders.map((o) => (
                      <tr key={o.id} style={rowBorder} className="hover:bg-wo-carbon/30 transition-colors">
                        <td className="px-4 py-3 font-jakarta text-xs text-wo-crema font-medium">{o.order_number}</td>
                        <td className="px-4 py-3">
                          <p className="font-jakarta text-xs text-wo-crema">{o.customer_name}</p>
                          <p className="font-jakarta text-[10px] text-wo-crema-muted">{o.customer_email}</p>
                        </td>
                        <td className="px-4 py-3 font-jakarta text-xs text-wo-crema-muted">{o.order_items?.length ?? 0}</td>
                        <td className="px-4 py-3 font-syne font-bold text-sm text-primary">S/ {o.total.toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <span className="font-jakarta text-[10px] font-bold px-2 py-0.5 rounded-wo-pill bg-wo-crema/10 text-wo-crema-muted">
                            {o.payment_method === "wallet" ? "Billetera" : "Efectivo"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`font-jakarta text-xs font-bold px-2 py-0.5 rounded-wo-pill ${statusBadge(o.status)}`}>
                            {o.status.charAt(0).toUpperCase() + o.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-jakarta text-xs text-wo-crema-muted">{new Date(o.created_at).toLocaleDateString("es-PE")}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => setViewingOrder(o)} className="p-1.5 rounded hover:bg-wo-carbon text-wo-crema-muted hover:text-wo-crema"><Eye size={12} /></button>
                        </td>
                      </tr>
                    ))}
                    {filteredOrders.length === 0 && !loadingOrders && (
                      <tr><td colSpan={8} className="px-4 py-8 text-center font-jakarta text-sm text-wo-crema-muted">No hay pedidos</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =================== AFILIADOS =================== */}
        {activeTab === "afiliados" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-wo-crema-muted" />
                <input
                  type="text"
                  placeholder="Buscar afiliado..."
                  value={affiliateSearch}
                  onChange={(e) => setAffiliateSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-wo-carbon rounded-wo-pill font-jakarta text-xs text-wo-crema placeholder:text-wo-crema-muted w-64"
                  style={cardStyle}
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {([
                  { id: "todos",     label: "Todos" },
                  { id: "active",    label: "Activos" },
                  { id: "suspended", label: "Suspendidos" },
                  { id: "pending",   label: "Pendientes" },
                ] as const).map((f) => (
                  <button key={f.id} onClick={() => setAffiliateStatusFilter(f.id)} className={`font-jakarta text-xs px-3 py-1.5 rounded-wo-pill transition-colors ${affiliateStatusFilter === f.id ? "bg-primary text-primary-foreground" : "bg-wo-carbon text-wo-crema-muted hover:text-wo-crema"}`}>
                    {f.label}
                    {f.id !== "todos" && (
                      <span className="ml-1.5 font-bold text-[9px]">
                        {affiliates.filter((a) => a.account_status === f.id).length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {loadingAffiliates ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-wo-grafito rounded-wo-card h-[200px] animate-pulse" style={cardStyle} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAffiliates.map((a) => (
                  <div key={a.id} className="bg-wo-grafito rounded-wo-card p-5 hover:border-primary/30 transition-colors" style={cardStyle}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-jakarta font-bold text-xs">
                        {a.name.split(" ").map((n) => n[0]).join("").substring(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-jakarta font-semibold text-sm text-wo-crema truncate">{a.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-jakarta font-bold px-2 py-0.5 rounded-wo-pill" style={{ background: "rgba(242,201,76,0.12)", color: "hsl(var(--wo-oro))" }}>{a.package}</span>
                          <span className={`font-jakarta text-[10px] font-bold px-2 py-0.5 rounded-wo-pill ${
                            a.account_status === "active"    ? "bg-secondary/12 text-secondary" :
                            a.account_status === "suspended" ? "bg-destructive/12 text-destructive" :
                            "bg-primary/12 text-primary"
                          }`}>
                            {a.account_status === "active" ? "● Activo" : a.account_status === "suspended" ? "● Suspendido" : "⏳ Pendiente"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <p className="font-jakarta text-[10px] text-wo-crema-muted uppercase">Ventas</p>
                        <p className="font-syne font-bold text-sm text-primary">S/ {(a.total_sales ?? 0).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="font-jakarta text-[10px] text-wo-crema-muted uppercase">Paquete</p>
                        <p className="font-syne font-bold text-sm text-wo-crema">{a.package ?? "—"}</p>
                      </div>
                      <div>
                        <p className="font-jakarta text-[10px] text-wo-crema-muted uppercase">Comisiones</p>
                        <p className="font-syne font-bold text-sm text-secondary">S/ {(a.total_commissions ?? 0).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="font-jakarta text-[10px] text-wo-crema-muted uppercase">Referidos</p>
                        <p className="font-syne font-bold text-sm text-wo-crema">{a.referral_count ?? 0}</p>
                      </div>
                    </div>
                    <div className="pt-3 flex items-center justify-between" style={{ borderTop: "0.5px solid rgba(255,255,255,0.07)" }}>
                      <span className="font-jakarta text-[10px] text-wo-crema-muted">{a.affiliate_code}</span>
                      <div className="flex gap-1">
                        <button onClick={() => setViewingAffiliate(a)} className="p-1.5 rounded hover:bg-wo-carbon text-wo-crema-muted hover:text-wo-crema"><Eye size={12} /></button>
                        <button onClick={() => openEditAffiliate(a)} className="p-1.5 rounded hover:bg-wo-carbon text-wo-crema-muted hover:text-wo-crema"><Edit2 size={12} /></button>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredAffiliates.length === 0 && (
                  <div className="col-span-3 text-center py-12 font-jakarta text-sm text-wo-crema-muted">No hay afiliados</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* =================== CATÁLOGO =================== */}
        {activeTab === "catalogo" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-jakarta text-sm text-wo-crema-muted">{products.length} productos</p>
              <button onClick={() => setNewProductModal(true)} className="flex items-center gap-1.5 bg-primary text-primary-foreground font-jakarta font-bold text-xs px-4 py-2 rounded-wo-btn hover:bg-primary/90 transition-colors">
                <Plus size={12} /> Nuevo Producto
              </button>
            </div>
            <div className="bg-wo-grafito rounded-wo-card overflow-hidden" style={cardStyle}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr style={rowBorder}>
                    {["Producto", "Precio", "Stock", "Rating", "Estado", "Acciones"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 font-jakarta text-[11px] text-wo-crema-muted uppercase">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {loadingProducts ? (
                      <tr><td colSpan={6} className="px-4 py-8 text-center font-jakarta text-sm text-wo-crema-muted">Cargando...</td></tr>
                    ) : products.map((p) => (
                      <tr key={p.id} style={rowBorder} className="hover:bg-wo-carbon/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <img src={p.image_url ?? ""} alt="" className="w-10 h-10 rounded-lg object-cover" />
                            <div>
                              <span className="font-jakarta text-sm text-wo-crema font-medium">{p.name}</span>
                              {p.organic && <span className="ml-2 text-[9px] font-jakarta font-bold px-1.5 py-0.5 rounded-wo-pill bg-secondary/15 text-secondary">ORG</span>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-syne font-bold text-sm text-primary">S/ {p.price.toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <span className={`font-jakarta text-xs font-bold ${p.stock <= 10 ? "text-destructive" : p.stock <= 30 ? "text-primary" : "text-wo-crema-muted"}`}>
                            {p.stock} {p.stock <= 10 && "⚠️"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-jakarta text-xs text-primary flex items-center gap-1"><Star size={10} className="fill-primary" /> {p.rating ?? 0}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`font-jakarta text-[10px] font-bold ${p.is_active ? "text-secondary" : "text-destructive"}`}>
                            {p.is_active ? "Activo" : "Inactivo"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <button onClick={() => openEditProduct(p)} className="p-1.5 rounded hover:bg-wo-carbon text-wo-crema-muted hover:text-wo-crema"><Edit2 size={12} /></button>
                            <button className="p-1.5 rounded hover:bg-wo-carbon text-wo-crema-muted hover:text-destructive"><Trash2 size={12} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =================== REPORTES =================== */}
        {activeTab === "reportes" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-syne font-bold text-lg text-wo-crema">Reportes y Analíticas</h2>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Ingresos totales",    value: `S/ ${totalRevenue.toFixed(2)}` },
                { label: "Ticket promedio",     value: orders.length ? `S/ ${(totalRevenue / orders.length).toFixed(2)}` : "—" },
                { label: "Afiliados activos",   value: affiliates.filter((a) => a.account_status === "active").length },
                { label: "Productos vendidos",  value: orders.reduce((s, o) => s + (o.order_items?.reduce((a, i) => a + i.quantity, 0) ?? 0), 0) },
              ].map((kpi, i) => (
                <div key={i} className="bg-wo-grafito rounded-wo-card p-4" style={cardStyle}>
                  <p className="font-jakarta text-[10px] text-wo-crema-muted uppercase">{kpi.label}</p>
                  <p className="font-syne font-extrabold text-xl text-wo-crema mt-1">{kpi.value}</p>
                </div>
              ))}
            </div>

            <div className="bg-wo-grafito rounded-wo-card p-5" style={cardStyle}>
              <h3 className="font-jakarta font-semibold text-sm text-wo-crema mb-4">Top afiliados por ventas</h3>
              <div className="space-y-3">
                {[...affiliates].sort((a, b) => (b.total_sales ?? 0) - (a.total_sales ?? 0)).slice(0, 5).map((a, i) => (
                  <div key={a.id} className="flex items-center gap-3">
                    <span className="font-syne font-bold text-sm w-8 text-center">
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : <span className="text-wo-crema-muted text-sm">{i + 1}</span>}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-wo-carbon flex items-center justify-center font-jakarta text-[10px] font-bold text-wo-crema">
                      {a.name.split(" ").map((n) => n[0]).join("").substring(0, 2)}
                    </div>
                    <div className="flex-1">
                      <p className="font-jakarta text-xs text-wo-crema">{a.name}</p>
                      <p className="font-jakarta text-[10px] text-wo-crema-muted">{a.affiliate_code}</p>
                    </div>
                    <span className="font-syne font-bold text-sm text-primary">S/ {(a.total_sales ?? 0).toFixed(2)}</span>
                  </div>
                ))}
                {affiliates.length === 0 && <p className="text-center font-jakarta text-sm text-wo-crema-muted py-4">Sin datos aún</p>}
              </div>
            </div>

            <div className="bg-wo-grafito rounded-wo-card p-5" style={cardStyle}>
              <h3 className="font-jakarta font-semibold text-sm text-wo-crema mb-4">Top productos por stock bajo</h3>
              <div className="space-y-3">
                {[...products].sort((a, b) => a.stock - b.stock).slice(0, 5).map((p, i) => (
                  <div key={p.id} className="flex items-center gap-3">
                    <span className="font-syne font-bold text-sm text-wo-crema-muted w-5">{i + 1}</span>
                    <img src={p.image_url ?? ""} alt="" className="w-8 h-8 rounded object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="font-jakarta text-xs text-wo-crema truncate">{p.name}</p>
                    </div>
                    <span className={`font-jakarta text-xs font-bold ${p.stock <= 10 ? "text-destructive" : "text-primary"}`}>{p.stock} uds</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =================== BILLETERA =================== */}
        {activeTab === "billetera" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-wo-grafito rounded-wo-card p-5" style={cardStyle}>
                <p className="font-jakarta text-[11px] text-wo-crema-muted uppercase">Retiros pendientes</p>
                <p className="font-syne font-extrabold text-[28px] text-primary mt-1">S/ {pendingWithdrawals.toFixed(2)}</p>
              </div>
              <div className="bg-wo-grafito rounded-wo-card p-5" style={cardStyle}>
                <p className="font-jakarta text-[11px] text-wo-crema-muted uppercase">Solicitudes retiro</p>
                <p className="font-syne font-extrabold text-[28px] text-secondary mt-1">{retiros.length}</p>
              </div>
              <div className="bg-wo-grafito rounded-wo-card p-5" style={cardStyle}>
                <p className="font-jakarta text-[11px] text-wo-crema-muted uppercase">Recargas totales</p>
                <p className="font-syne font-extrabold text-[28px] text-wo-crema mt-1">{recargas.length}</p>
              </div>
            </div>

            <div className="bg-wo-grafito rounded-wo-card p-5" style={cardStyle}>
              <h3 className="font-jakarta font-semibold text-sm text-wo-crema mb-4">Solicitudes de retiro</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr style={rowBorder}>
                    {["Afiliado", "Código", "Monto", "Método", "Cuenta", "Fecha", "Estado", "Acciones"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 font-jakarta text-[11px] text-wo-crema-muted uppercase">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {retiros.map((w) => (
                      <tr key={w.id} style={rowBorder}>
                        <td className="px-4 py-3 font-jakarta text-xs text-wo-crema">{w.affiliate?.name ?? "—"}</td>
                        <td className="px-4 py-3 font-jakarta text-xs text-wo-crema-muted">{w.affiliate?.affiliate_code ?? "—"}</td>
                        <td className="px-4 py-3 font-syne font-bold text-sm text-primary">S/ {w.amount.toFixed(2)}</td>
                        <td className="px-4 py-3 font-jakarta text-xs text-wo-crema-muted">{w.withdrawal_method ?? "—"}</td>
                        <td className="px-4 py-3 font-jakarta text-xs text-wo-crema-muted">{w.withdrawal_account ?? "—"}</td>
                        <td className="px-4 py-3 font-jakarta text-xs text-wo-crema-muted">{new Date(w.created_at).toLocaleDateString("es-PE")}</td>
                        <td className="px-4 py-3">
                          <span className={`font-jakarta text-xs font-bold px-2 py-0.5 rounded-wo-pill ${statusBadge(w.status)}`}>
                            {w.status.charAt(0).toUpperCase() + w.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {w.status === "pendiente" && (
                            <div className="flex gap-1">
                              <button onClick={() => handleApprove(w)} className="p-1.5 rounded hover:bg-secondary/15 text-wo-crema-muted hover:text-secondary"><CheckCircle size={12} /></button>
                              <button onClick={() => handleReject(w)} className="p-1.5 rounded hover:bg-destructive/15 text-wo-crema-muted hover:text-destructive"><XCircle size={12} /></button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                    {retiros.length === 0 && (
                      <tr><td colSpan={8} className="px-4 py-8 text-center font-jakarta text-sm text-wo-crema-muted">Sin solicitudes de retiro</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =================== PAGOS =================== */}
        {activeTab === "pagos" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
              <h2 className="font-syne font-bold text-lg text-wo-crema">Aprobación de Pagos</h2>
              <div className="flex items-center gap-3 text-[11px] font-jakarta">
                <span className="text-wo-crema-muted">Pendientes totales:</span>
                <span className="font-bold text-primary">{totalPendingPayments}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 border-b pb-3" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
              {([
                { id: "activaciones",   label: "Activaciones",   count: activaciones.filter((x) => x.status === "pendiente").length },
                { id: "reactivaciones", label: "Reactivaciones", count: reactivaciones.filter((x) => x.status === "pendiente").length },
                { id: "upgrades",       label: "Upgrades",       count: upgrades.filter((x) => x.status === "pendiente").length },
                { id: "retiros",        label: "Retiros",        count: retiros.filter((x) => x.status === "pendiente").length },
                { id: "recargas",       label: "Recargas",       count: recargas.filter((x) => x.status === "pendiente").length },
              ] as const).map((st) => (
                <button
                  key={st.id}
                  onClick={() => setPaymentSubTab(st.id)}
                  className={`flex items-center gap-1.5 font-jakarta text-xs font-medium px-4 py-2 rounded-wo-pill transition-colors ${paymentSubTab === st.id ? "bg-primary text-primary-foreground" : "bg-wo-carbon text-wo-crema-muted hover:text-wo-crema"}`}
                >
                  {st.label}
                  {st.count > 0 && (
                    <span className={`font-bold text-[10px] px-1.5 py-0.5 rounded-full ${paymentSubTab === st.id ? "bg-primary-foreground/20 text-primary-foreground" : "bg-destructive/20 text-destructive"}`}>
                      {st.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Activaciones */}
            {paymentSubTab === "activaciones" && (
              <div className="bg-wo-grafito rounded-wo-card overflow-hidden" style={cardStyle}>
                <p className="px-4 pt-4 font-jakarta text-xs text-wo-crema-muted">Comprobantes de paquete inicial pendientes de aprobar.</p>
                <div className="overflow-x-auto mt-3">
                  <table className="w-full">
                    <thead><tr style={rowBorder}>
                      {["Afiliado", "Código", "Paquete", "Monto", "Comprobante", "Fecha", "Estado", "Acciones"].map((h) => (
                        <th key={h} className="text-left px-4 py-3 font-jakarta text-[11px] text-wo-crema-muted uppercase">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {activaciones.map((p) => (
                        <PaymentRow key={p.id} p={p} extraCols={
                          <td className="px-4 py-3">
                            <span className="font-jakarta text-[10px] font-bold px-2 py-0.5 rounded-wo-pill" style={{ background: "rgba(242,201,76,0.12)", color: "hsl(var(--wo-oro))" }}>
                              {p.package_to ?? "—"}
                            </span>
                          </td>
                        } />
                      ))}
                      {activaciones.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center font-jakarta text-sm text-wo-crema-muted">Sin solicitudes</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Reactivaciones */}
            {paymentSubTab === "reactivaciones" && (
              <div className="bg-wo-grafito rounded-wo-card overflow-hidden" style={cardStyle}>
                <p className="px-4 pt-4 font-jakarta text-xs text-wo-crema-muted">Reactivaciones S/ 300 mensuales.</p>
                <div className="overflow-x-auto mt-3">
                  <table className="w-full">
                    <thead><tr style={rowBorder}>
                      {["Afiliado", "Código", "Mes", "Monto", "Comprobante", "Fecha", "Estado", "Acciones"].map((h) => (
                        <th key={h} className="text-left px-4 py-3 font-jakarta text-[11px] text-wo-crema-muted uppercase">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {reactivaciones.map((p) => (
                        <PaymentRow key={p.id} p={p} extraCols={
                          <td className="px-4 py-3 font-jakarta text-xs text-wo-crema font-semibold">{p.reactivation_month ?? "—"}</td>
                        } />
                      ))}
                      {reactivaciones.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center font-jakarta text-sm text-wo-crema-muted">Sin solicitudes</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Upgrades */}
            {paymentSubTab === "upgrades" && (
              <div className="bg-wo-grafito rounded-wo-card overflow-hidden" style={cardStyle}>
                <p className="px-4 pt-4 font-jakarta text-xs text-wo-crema-muted">Solicitudes de cambio de paquete.</p>
                <div className="overflow-x-auto mt-3">
                  <table className="w-full">
                    <thead><tr style={rowBorder}>
                      {["Afiliado", "Código", "De → A", "Monto", "Comprobante", "Fecha", "Estado", "Acciones"].map((h) => (
                        <th key={h} className="text-left px-4 py-3 font-jakarta text-[11px] text-wo-crema-muted uppercase">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {upgrades.map((p) => (
                        <PaymentRow key={p.id} p={p} extraCols={
                          <td className="px-4 py-3 font-jakarta text-xs text-wo-crema">
                            <span className="text-wo-crema-muted">{p.package_from}</span> → <span className="font-bold text-primary">{p.package_to}</span>
                          </td>
                        } />
                      ))}
                      {upgrades.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center font-jakarta text-sm text-wo-crema-muted">Sin solicitudes</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Retiros */}
            {paymentSubTab === "retiros" && (
              <div className="bg-wo-grafito rounded-wo-card overflow-hidden" style={cardStyle}>
                <p className="px-4 pt-4 font-jakarta text-xs text-wo-crema-muted">Solicitudes de retiro de billetera.</p>
                <div className="overflow-x-auto mt-3">
                  <table className="w-full">
                    <thead><tr style={rowBorder}>
                      {["Afiliado", "Código", "Método", "Monto", "Comprobante", "Fecha", "Estado", "Acciones"].map((h) => (
                        <th key={h} className="text-left px-4 py-3 font-jakarta text-[11px] text-wo-crema-muted uppercase">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {retiros.map((p) => (
                        <PaymentRow key={p.id} p={p} extraCols={
                          <td className="px-4 py-3 font-jakarta text-xs text-wo-crema-muted">{p.withdrawal_method ?? "—"}</td>
                        } />
                      ))}
                      {retiros.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center font-jakarta text-sm text-wo-crema-muted">Sin solicitudes</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Recargas */}
            {paymentSubTab === "recargas" && (
              <div className="bg-wo-grafito rounded-wo-card overflow-hidden" style={cardStyle}>
                <p className="px-4 pt-4 font-jakarta text-xs text-wo-crema-muted">Recargas de crédito a billetera.</p>
                <div className="overflow-x-auto mt-3">
                  <table className="w-full">
                    <thead><tr style={rowBorder}>
                      {["Afiliado", "Código", "Crédito", "Monto", "Comprobante", "Fecha", "Estado", "Acciones"].map((h) => (
                        <th key={h} className="text-left px-4 py-3 font-jakarta text-[11px] text-wo-crema-muted uppercase">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {recargas.map((p) => (
                        <PaymentRow key={p.id} p={p} extraCols={
                          <td className="px-4 py-3 font-syne font-bold text-sm text-secondary">S/ {p.wallet_credit_amount ?? p.amount}</td>
                        } />
                      ))}
                      {recargas.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center font-jakarta text-sm text-wo-crema-muted">Sin solicitudes</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =================== GAMIFICACIÓN =================== */}
        {activeTab === "gamificacion" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-syne font-bold text-lg text-wo-crema">Sistema de Gamificación</h2>
              <button className="flex items-center gap-1.5 bg-primary text-primary-foreground font-jakarta font-bold text-xs px-4 py-2 rounded-wo-btn">
                <Plus size={12} /> Nueva Misión
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mockSeasons.map((s, i) => (
                <div key={i} className="bg-wo-grafito rounded-wo-card p-5" style={cardStyle}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Trophy size={16} className={s.active ? "text-primary" : "text-wo-crema-muted"} />
                      <h3 className="font-jakarta font-semibold text-sm text-wo-crema">{s.name}</h3>
                    </div>
                    <span className={`font-jakarta text-[10px] font-bold px-2 py-0.5 rounded-wo-pill ${s.active ? "bg-secondary/15 text-secondary" : "bg-wo-crema/10 text-wo-crema-muted"}`}>
                      {s.active ? "Activa" : "Finalizada"}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div><p className="font-jakarta text-[10px] text-wo-crema-muted uppercase">Participantes</p><p className="font-syne font-bold text-sm text-wo-crema">{s.participants}</p></div>
                    <div><p className="font-jakarta text-[10px] text-wo-crema-muted uppercase">Puntos</p><p className="font-syne font-bold text-sm text-primary">{s.totalPoints.toLocaleString()}</p></div>
                    <div><p className="font-jakarta text-[10px] text-wo-crema-muted uppercase">Período</p><p className="font-jakarta text-[10px] text-wo-crema-muted">{s.startDate} — {s.endDate}</p></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-wo-grafito rounded-wo-card p-5" style={cardStyle}>
              <h3 className="font-jakarta font-semibold text-sm text-wo-crema mb-4">Misiones configuradas</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr style={rowBorder}>
                    {["Misión", "Tipo", "Puntos", "Completada por", "Estado", "Acciones"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 font-jakarta text-[11px] text-wo-crema-muted uppercase">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {mockMissions.map((m) => (
                      <tr key={m.id} style={rowBorder}>
                        <td className="px-4 py-3 font-jakarta text-sm text-wo-crema">{m.name}</td>
                        <td className="px-4 py-3"><span className="font-jakarta text-[10px] font-bold px-2 py-0.5 rounded-wo-pill bg-wo-crema/10 text-wo-crema-muted">{m.type}</span></td>
                        <td className="px-4 py-3"><span className="font-jakarta text-xs font-bold px-2 py-0.5 rounded-wo-pill" style={{ background: "rgba(242,201,76,0.12)", color: "hsl(var(--wo-oro))" }}>+{m.points} pts</span></td>
                        <td className="px-4 py-3 font-jakarta text-xs text-wo-crema-muted">{m.completedBy} afiliados</td>
                        <td className="px-4 py-3"><span className={`font-jakarta text-xs font-bold ${m.active ? "text-secondary" : "text-wo-crema-muted"}`}>{m.active ? "● Activa" : "● Inactiva"}</span></td>
                        <td className="px-4 py-3"><div className="flex gap-1"><button className="p-1.5 rounded hover:bg-wo-carbon text-wo-crema-muted hover:text-wo-crema"><Edit2 size={12} /></button></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-wo-grafito rounded-wo-card p-5" style={cardStyle}>
              <h3 className="font-jakarta font-semibold text-sm text-wo-crema mb-4">Leaderboard — Temporada actual</h3>
              {mockLeaderboard.length === 0 ? (
                <p className="text-center font-jakarta text-sm text-wo-crema-muted py-8">Sin datos de gamificación aún</p>
              ) : mockLeaderboard.map((l, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-wo-carbon/50 transition-colors">
                  <span className="font-syne font-bold text-lg w-8 text-center">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}</span>
                  <div className="flex-1"><p className="font-jakarta text-sm text-wo-crema font-medium">{l.name}</p></div>
                  <span className="font-syne font-bold text-sm text-primary">{l.points.toLocaleString()} pts</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =================== REMANENTES =================== */}
        {activeTab === "remanentes" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-syne font-bold text-lg text-wo-crema">Remanentes</h2>
                <p className="font-jakarta text-xs text-wo-crema-muted mt-1">Comisiones no distribuidas por niveles vacíos (breakage)</p>
              </div>
              <div className="flex gap-2">
                {["todos", "pendiente", "resuelto"].map((f) => (
                  <button key={f} onClick={() => setRemanentFilter(f)} className={`font-jakarta text-xs px-3 py-1.5 rounded-wo-pill transition-colors ${
                    remanentFilter === f ? "bg-primary text-primary-foreground" : "bg-wo-carbon text-wo-crema-muted hover:text-wo-crema"
                  }`}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-wo-grafito rounded-wo-card p-5" style={cardStyle}>
                <p className="font-jakarta text-[11px] text-wo-crema-muted uppercase">Total remanentes</p>
                <p className="font-syne font-extrabold text-2xl text-destructive mt-1">S/ {breakage.reduce((s, r) => s + r.amount, 0).toFixed(2)}</p>
              </div>
              <div className="bg-wo-grafito rounded-wo-card p-5" style={cardStyle}>
                <p className="font-jakarta text-[11px] text-wo-crema-muted uppercase">Pendientes</p>
                <p className="font-syne font-extrabold text-2xl text-primary mt-1">{breakage.filter((r) => r.status === "pending").length}</p>
              </div>
              <div className="bg-wo-grafito rounded-wo-card p-5" style={cardStyle}>
                <p className="font-jakarta text-[11px] text-wo-crema-muted uppercase">Resueltos</p>
                <p className="font-syne font-extrabold text-2xl text-secondary mt-1">{breakage.filter((r) => r.status === "paid").length}</p>
              </div>
            </div>

            <div className="bg-wo-grafito rounded-wo-card overflow-hidden" style={cardStyle}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr style={rowBorder}>
                    {["Afiliado", "Código", "Monto", "Nivel", "Fecha", "Estado"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 font-jakarta text-[11px] text-wo-crema-muted uppercase">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {filteredRemanentes.length === 0 ? (
                      <tr><td colSpan={6} className="px-4 py-8 text-center font-jakarta text-sm text-wo-crema-muted">Sin remanentes</td></tr>
                    ) : filteredRemanentes.map((r) => (
                      <tr key={r.id} style={rowBorder}>
                        <td className="px-4 py-3 font-jakarta text-xs text-wo-crema">{r.affiliate?.name ?? "—"}</td>
                        <td className="px-4 py-3 font-jakarta text-xs text-wo-crema-muted">{r.affiliate?.affiliate_code ?? "—"}</td>
                        <td className="px-4 py-3 font-syne font-bold text-sm text-destructive">S/ {r.amount.toFixed(2)}</td>
                        <td className="px-4 py-3 font-jakarta text-xs text-wo-crema-muted">Niv. {r.level}</td>
                        <td className="px-4 py-3 font-jakarta text-xs text-wo-crema-muted">{new Date(r.created_at).toLocaleDateString("es-PE")}</td>
                        <td className="px-4 py-3">
                          <span className={`font-jakarta text-xs font-bold px-2 py-0.5 rounded-wo-pill ${
                            r.status === "paid" ? "bg-secondary/15 text-secondary" : "bg-primary/15 text-primary"
                          }`}>{r.status === "paid" ? "Resuelto" : "Pendiente"}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========== MODAL: Configuración ========== */}
      {openSettings && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setOpenSettings(false)}>
          <div className="bg-wo-grafito rounded-2xl max-w-3xl w-full p-6 relative max-h-[90vh] overflow-y-auto" style={cardStyle} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setOpenSettings(false)} className="absolute top-4 right-4 text-wo-crema-muted hover:text-wo-crema text-lg">✕</button>
            <div className="mb-6 pr-8">
              <p className="font-jakarta text-[10px] uppercase tracking-[0.2em] text-wo-crema-muted mb-2">Configuración</p>
              <h3 className="font-syne font-bold text-2xl text-wo-crema">Centro de control del admin</h3>
            </div>

            <div className="bg-wo-carbon rounded-wo-card p-5 mb-6" style={cardStyle}>
              <h4 className="font-syne font-bold text-base text-wo-crema mb-4">Estructura de comisiones por nivel</h4>
              <p className="font-jakarta text-xs text-wo-crema-muted mb-3">25% acumulado · Nivel 8 tiene spike de 3% para incentivar red profunda</p>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr style={rowBorder}>
                    {["Nivel", "Comisión", "Básico (1–3)", "Intermedio (1–7)", "VIP (1–10)"].map((h) => (
                      <th key={h} className="text-left px-3 py-2 font-jakarta text-[10px] text-wo-crema-muted uppercase">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {[
                      { level: 1,  pct: "10%",   basico: true,  inter: true,  vip: true },
                      { level: 2,  pct: "4%",    basico: true,  inter: true,  vip: true },
                      { level: 3,  pct: "2%",    basico: true,  inter: true,  vip: true },
                      { level: 4,  pct: "2%",    basico: false, inter: true,  vip: true },
                      { level: 5,  pct: "1%",    basico: false, inter: true,  vip: true },
                      { level: 6,  pct: "1%",    basico: false, inter: true,  vip: true },
                      { level: 7,  pct: "1%",    basico: false, inter: true,  vip: true },
                      { level: 8,  pct: "3% ★",  basico: false, inter: false, vip: true },
                      { level: 9,  pct: "0.5%",  basico: false, inter: false, vip: true },
                      { level: 10, pct: "0.5%",  basico: false, inter: false, vip: true },
                    ].map((row) => (
                      <tr key={row.level} style={rowBorder}>
                        <td className="px-3 py-2 font-jakarta text-xs text-wo-crema-muted">Nivel {row.level}</td>
                        <td className="px-3 py-2 font-syne font-bold text-sm text-primary">{row.pct}</td>
                        <td className="px-3 py-2 font-jakarta text-xs">{row.basico ? <span className="text-secondary">✓</span> : <span className="text-wo-crema/20">breakage</span>}</td>
                        <td className="px-3 py-2 font-jakarta text-xs">{row.inter ? <span className="text-secondary">✓</span> : <span className="text-wo-crema/20">breakage</span>}</td>
                        <td className="px-3 py-2 font-jakarta text-xs">{row.vip ? <span className="text-secondary">✓</span> : <span className="text-wo-crema/20">breakage</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-wo-carbon rounded-wo-card p-5" style={cardStyle}>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <h4 className="font-syne font-bold text-lg text-wo-crema">Reglas comerciales</h4>
                  <Target size={16} className="text-primary" />
                </div>
                <div className="space-y-3">
                  {[
                    "Básico: activación S/ 100 · niveles 1 al 3",
                    "Intermedio: activación S/ 2,000 · niveles 1 al 7",
                    "VIP / Élite: activación S/ 10,000 · niveles 1 al 10",
                    "Reactivación mensual: S/ 300 desde el mes 2",
                  ].map((rule) => (
                    <div key={rule} className="flex gap-2 items-start py-2" style={rowBorder}>
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      <p className="font-jakarta text-sm text-wo-crema-muted">{rule}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-wo-carbon rounded-wo-card p-5" style={cardStyle}>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <h4 className="font-syne font-bold text-lg text-wo-crema">Métricas rápidas</h4>
                  <TrendingUp size={16} className="text-primary" />
                </div>
                <div className="space-y-3">
                  {[
                    { label: "Total afiliados", value: affiliates.length },
                    { label: "Activos", value: affiliates.filter((a) => a.account_status === "active").length },
                    { label: "Pendientes aprobación", value: affiliates.filter((a) => a.account_status === "pending").length },
                    { label: "Suspendidos", value: affiliates.filter((a) => a.account_status === "suspended").length },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between py-2" style={rowBorder}>
                      <span className="font-jakarta text-sm text-wo-crema-muted">{item.label}</span>
                      <span className="font-syne font-bold text-sm text-primary">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Métodos de pago */}
            <div className="bg-wo-carbon rounded-wo-card p-5 mt-4" style={cardStyle}>
              <h4 className="font-syne font-bold text-base text-wo-crema mb-4">Métodos de pago del negocio</h4>
              <p className="font-jakarta text-xs text-wo-crema-muted mb-4">Estos datos se muestran a los afiliados cuando realizan pagos.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: "Yape (número)", value: settingsYape, setter: setSettingsYape, placeholder: "987654321" },
                  { label: "Plin (número)", value: settingsPlin, setter: setSettingsPlin, placeholder: "987654321" },
                  { label: "Banco", value: settingsBank, setter: setSettingsBank, placeholder: "BCP, Interbank..." },
                  { label: "N° de cuenta bancaria", value: settingsAcct, setter: setSettingsAcct, placeholder: "000-12345678-0-12" },
                  { label: "WhatsApp soporte", value: settingsWA, setter: setSettingsWA, placeholder: "51987654321" },
                  { label: "Teléfono contacto", value: settingsPhone, setter: setSettingsPhone, placeholder: "01-234-5678" },
                ].map((field) => (
                  <div key={field.label}>
                    <label className="font-jakarta text-[11px] text-wo-crema-muted mb-1 block">{field.label}</label>
                    <input
                      value={field.value}
                      onChange={(e) => field.setter(e.target.value)}
                      placeholder={field.placeholder}
                      className="w-full bg-wo-grafito text-wo-crema font-jakarta text-sm px-3 py-2 rounded-xl outline-none focus:ring-1 focus:ring-primary"
                      style={{ border: "0.5px solid rgba(255,255,255,0.1)" }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3 mt-4">
                <button
                  onClick={handleSaveSettings}
                  disabled={updateBusinessSettings.isPending}
                  className="bg-primary text-primary-foreground font-jakarta font-bold text-xs px-4 py-2 rounded-wo-btn hover:bg-primary/90 disabled:opacity-50"
                >
                  {updateBusinessSettings.isPending ? "Guardando..." : "Guardar métodos de pago"}
                </button>
                {settingsSaved && <span className="font-jakarta text-xs text-secondary">✓ Guardado</span>}
              </div>
            </div>

            <div className="mt-4 flex gap-3 justify-end">
              <button onClick={() => { setActiveTab("pagos"); setOpenSettings(false); }} className="bg-primary text-primary-foreground font-jakarta font-bold text-xs px-4 py-2 rounded-wo-btn hover:bg-primary/90">
                Revisar pagos
              </button>
              <button onClick={() => setOpenSettings(false)} className="bg-wo-carbon text-wo-crema-muted font-jakarta font-bold text-xs px-4 py-2 rounded-wo-btn hover:text-wo-crema" style={cardStyle}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== MODAL: Ver Afiliado ========== */}
      {viewingAffiliate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setViewingAffiliate(null)}>
          <div className="bg-wo-grafito rounded-2xl max-w-lg w-full p-6 relative" style={cardStyle} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setViewingAffiliate(null)} className="absolute top-4 right-4 text-wo-crema-muted hover:text-wo-crema text-lg">✕</button>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-syne font-bold text-lg">
                {viewingAffiliate.name.split(" ").map((n) => n[0]).join("").substring(0, 2)}
              </div>
              <div>
                <h3 className="font-syne font-bold text-lg text-wo-crema">{viewingAffiliate.name}</h3>
                <p className="font-jakarta text-xs text-wo-crema-muted">{viewingAffiliate.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Código",      value: viewingAffiliate.affiliate_code },
                { label: "Paquete",     value: viewingAffiliate.package ?? "—" },
                { label: "Ventas",      value: `S/ ${(viewingAffiliate.total_sales ?? 0).toFixed(2)}` },
                { label: "Comisiones",  value: `S/ ${(viewingAffiliate.total_commissions ?? 0).toFixed(2)}` },
                { label: "Referidos",   value: viewingAffiliate.referral_count ?? 0 },
                { label: "Yape",        value: viewingAffiliate.yape_number ?? "—" },
                { label: "Estado",      value: viewingAffiliate.account_status === "active" ? "✅ Activo" : viewingAffiliate.account_status === "suspended" ? "⛔ Suspendido" : "⏳ Pendiente" },
                { label: "Registro",    value: new Date(viewingAffiliate.created_at).toLocaleDateString("es-PE") },
              ].map((item) => (
                <div key={item.label}>
                  <p className="font-jakarta text-[10px] text-wo-crema-muted uppercase">{item.label}</p>
                  <p className="font-jakarta text-sm text-wo-crema font-medium">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========== MODAL: Editar Afiliado ========== */}
      {editingAffiliate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setEditingAffiliate(null)}>
          <div className="bg-wo-grafito rounded-2xl max-w-lg w-full p-6 relative" style={cardStyle} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setEditingAffiliate(null)} className="absolute top-4 right-4 text-wo-crema-muted hover:text-wo-crema text-lg">✕</button>
            <h3 className="font-syne font-bold text-lg text-wo-crema mb-6">Editar Afiliado</h3>
            <div className="space-y-4">
              <div>
                <label className="font-jakarta text-xs text-wo-crema-muted mb-1 block">Nombre</label>
                <input value={affName} onChange={(e) => setAffName(e.target.value)} className="w-full bg-wo-carbon text-wo-crema font-jakarta text-sm px-3 py-2.5 rounded-xl outline-none focus:ring-1 focus:ring-primary" style={{ border: "0.5px solid rgba(255,255,255,0.1)" }} />
              </div>
              <div>
                <label className="font-jakarta text-xs text-wo-crema-muted mb-1 block">Email</label>
                <input value={editingAffiliate.email} readOnly className="w-full bg-wo-carbon/50 text-wo-crema-muted font-jakarta text-sm px-3 py-2.5 rounded-xl outline-none cursor-not-allowed" style={{ border: "0.5px solid rgba(255,255,255,0.1)" }} />
              </div>
              <div>
                <label className="font-jakarta text-xs text-wo-crema-muted mb-1 block">Yape</label>
                <input value={affYape} onChange={(e) => setAffYape(e.target.value)} className="w-full bg-wo-carbon text-wo-crema font-jakarta text-sm px-3 py-2.5 rounded-xl outline-none focus:ring-1 focus:ring-primary" style={{ border: "0.5px solid rgba(255,255,255,0.1)" }} />
              </div>
              <div>
                <label className="font-jakarta text-xs text-wo-crema-muted mb-1 block">Paquete</label>
                <select value={affPackage} onChange={(e) => setAffPackage(e.target.value)} className="w-full bg-wo-carbon text-wo-crema font-jakarta text-sm px-3 py-2.5 rounded-xl outline-none focus:ring-1 focus:ring-primary" style={{ border: "0.5px solid rgba(255,255,255,0.1)" }}>
                  <option value="Básico">Básico</option>
                  <option value="Intermedio">Intermedio</option>
                  <option value="VIP">VIP</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleSaveAffiliate} disabled={updateAffiliate.isPending} className="flex-1 bg-primary text-primary-foreground font-jakarta font-bold text-sm py-2.5 rounded-xl hover:bg-wo-oro-dark disabled:opacity-50">
                  {updateAffiliate.isPending ? "Guardando..." : "Guardar cambios"}
                </button>
                <button onClick={() => setEditingAffiliate(null)} className="px-4 font-jakarta text-sm text-wo-crema-muted hover:text-wo-crema py-2.5 rounded-xl bg-wo-carbon" style={{ border: "0.5px solid rgba(255,255,255,0.1)" }}>Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========== MODAL: Ver Pedido ========== */}
      {viewingOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setViewingOrder(null)}>
          <div className="bg-wo-grafito rounded-2xl max-w-lg w-full p-6 relative" style={cardStyle} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setViewingOrder(null)} className="absolute top-4 right-4 text-wo-crema-muted hover:text-wo-crema text-lg">✕</button>
            <h3 className="font-syne font-bold text-lg text-wo-crema mb-1">Pedido {viewingOrder.order_number}</h3>
            <p className="font-jakarta text-xs text-wo-crema-muted mb-6">{new Date(viewingOrder.created_at).toLocaleDateString("es-PE")}</p>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div><p className="font-jakarta text-[10px] text-wo-crema-muted uppercase">Cliente</p><p className="font-jakarta text-sm text-wo-crema">{viewingOrder.customer_name}</p></div>
              <div><p className="font-jakarta text-[10px] text-wo-crema-muted uppercase">Email</p><p className="font-jakarta text-sm text-wo-crema">{viewingOrder.customer_email ?? "—"}</p></div>
              <div><p className="font-jakarta text-[10px] text-wo-crema-muted uppercase">Método</p><p className="font-jakarta text-sm text-wo-crema">{viewingOrder.payment_method === "wallet" ? "Billetera" : "Efectivo"}</p></div>
              <div><p className="font-jakarta text-[10px] text-wo-crema-muted uppercase">Estado</p><p className="font-jakarta text-sm text-primary">{viewingOrder.status}</p></div>
            </div>
            <div style={{ borderTop: "0.5px solid rgba(255,255,255,0.07)" }} className="pt-4">
              <p className="font-jakarta text-[10px] text-wo-crema-muted uppercase mb-2">Productos</p>
              {(viewingOrder.order_items ?? []).map((item, i) => (
                <div key={i} className="flex justify-between py-2" style={{ borderBottom: "0.5px solid rgba(255,255,255,0.05)" }}>
                  <span className="font-jakarta text-sm text-wo-crema">{item.name} × {item.quantity}</span>
                  <span className="font-jakarta text-sm text-primary">S/ {(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="flex justify-between pt-3 mt-2" style={{ borderTop: "0.5px solid rgba(255,255,255,0.15)" }}>
                <span className="font-syne font-bold text-wo-crema">Total</span>
                <span className="font-syne font-bold text-primary">S/ {viewingOrder.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========== MODAL: Ver/Editar Producto ========== */}
      {viewingProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setViewingProduct(null)}>
          <div className="bg-wo-grafito rounded-2xl max-w-lg w-full p-6 relative" style={cardStyle} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setViewingProduct(null)} className="absolute top-4 right-4 text-wo-crema-muted hover:text-wo-crema text-lg">✕</button>
            <div className="flex gap-4 mb-6">
              <img src={viewingProduct.image_url ?? ""} alt="" className="w-20 h-20 rounded-xl object-cover" />
              <div>
                <h3 className="font-syne font-bold text-lg text-wo-crema">{prodName}</h3>
                <p className="font-jakarta text-xs text-wo-crema-muted">Stock: {prodStock}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="font-jakarta text-xs text-wo-crema-muted mb-1 block">Nombre</label>
                <input value={prodName} onChange={(e) => setProdName(e.target.value)} className="w-full bg-wo-carbon text-wo-crema font-jakarta text-sm px-3 py-2.5 rounded-xl outline-none focus:ring-1 focus:ring-primary" style={{ border: "0.5px solid rgba(255,255,255,0.1)" }} />
              </div>
              <div>
                <label className="font-jakarta text-xs text-wo-crema-muted mb-1 block">Precio (S/)</label>
                <input value={prodPrice} onChange={(e) => setProdPrice(e.target.value)} type="number" step="0.01" className="w-full bg-wo-carbon text-wo-crema font-jakarta text-sm px-3 py-2.5 rounded-xl outline-none focus:ring-1 focus:ring-primary" style={{ border: "0.5px solid rgba(255,255,255,0.1)" }} />
              </div>
              <div>
                <label className="font-jakarta text-xs text-wo-crema-muted mb-1 block">Stock</label>
                <input value={prodStock} onChange={(e) => setProdStock(e.target.value)} type="number" className="w-full bg-wo-carbon text-wo-crema font-jakarta text-sm px-3 py-2.5 rounded-xl outline-none focus:ring-1 focus:ring-primary" style={{ border: "0.5px solid rgba(255,255,255,0.1)" }} />
              </div>
              <div>
                <label className="font-jakarta text-xs text-wo-crema-muted mb-1 block">Descripción</label>
                <textarea value={prodDesc} onChange={(e) => setProdDesc(e.target.value)} rows={3} className="w-full bg-wo-carbon text-wo-crema font-jakarta text-sm px-3 py-2.5 rounded-xl outline-none focus:ring-1 focus:ring-primary resize-none" style={{ border: "0.5px solid rgba(255,255,255,0.1)" }} />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleSaveProduct} disabled={updateProduct.isPending} className="flex-1 bg-primary text-primary-foreground font-jakarta font-bold text-sm py-2.5 rounded-xl hover:bg-wo-oro-dark disabled:opacity-50">
                  {updateProduct.isPending ? "Guardando..." : "Guardar cambios"}
                </button>
                <button onClick={() => setViewingProduct(null)} className="px-4 font-jakarta text-sm text-wo-crema-muted hover:text-wo-crema py-2.5 rounded-xl bg-wo-carbon" style={{ border: "0.5px solid rgba(255,255,255,0.1)" }}>Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ========== MODAL: Nuevo Producto ========== */}
      {newProductModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setNewProductModal(false)}>
          <div className="bg-wo-grafito rounded-2xl max-w-lg w-full p-6 relative" style={cardStyle} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setNewProductModal(false)} className="absolute top-4 right-4 text-wo-crema-muted hover:text-wo-crema text-lg">✕</button>
            <h3 className="font-syne font-bold text-lg text-wo-crema mb-6">Nuevo Producto</h3>
            <div className="space-y-4">
              <div>
                <label className="font-jakarta text-xs text-wo-crema-muted mb-1 block">Nombre</label>
                <input value={newProdName} onChange={(e) => setNewProdName(e.target.value)} placeholder="Ej: Clorófila Líquida" className="w-full bg-wo-carbon text-wo-crema font-jakarta text-sm px-3 py-2.5 rounded-xl outline-none focus:ring-1 focus:ring-primary" style={{ border: "0.5px solid rgba(255,255,255,0.1)" }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-jakarta text-xs text-wo-crema-muted mb-1 block">Precio (S/)</label>
                  <input value={newProdPrice} onChange={(e) => setNewProdPrice(e.target.value)} type="number" step="0.01" placeholder="0.00" className="w-full bg-wo-carbon text-wo-crema font-jakarta text-sm px-3 py-2.5 rounded-xl outline-none focus:ring-1 focus:ring-primary" style={{ border: "0.5px solid rgba(255,255,255,0.1)" }} />
                </div>
                <div>
                  <label className="font-jakarta text-xs text-wo-crema-muted mb-1 block">Stock</label>
                  <input value={newProdStock} onChange={(e) => setNewProdStock(e.target.value)} type="number" placeholder="0" className="w-full bg-wo-carbon text-wo-crema font-jakarta text-sm px-3 py-2.5 rounded-xl outline-none focus:ring-1 focus:ring-primary" style={{ border: "0.5px solid rgba(255,255,255,0.1)" }} />
                </div>
              </div>
              <div>
                <label className="font-jakarta text-xs text-wo-crema-muted mb-1 block">URL de imagen</label>
                <input value={newProdImg} onChange={(e) => setNewProdImg(e.target.value)} placeholder="https://..." className="w-full bg-wo-carbon text-wo-crema font-jakarta text-sm px-3 py-2.5 rounded-xl outline-none focus:ring-1 focus:ring-primary" style={{ border: "0.5px solid rgba(255,255,255,0.1)" }} />
              </div>
              <div>
                <label className="font-jakarta text-xs text-wo-crema-muted mb-1 block">Descripción</label>
                <textarea value={newProdDesc} onChange={(e) => setNewProdDesc(e.target.value)} rows={3} placeholder="Descripción del producto..." className="w-full bg-wo-carbon text-wo-crema font-jakarta text-sm px-3 py-2.5 rounded-xl outline-none focus:ring-1 focus:ring-primary resize-none" style={{ border: "0.5px solid rgba(255,255,255,0.1)" }} />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleCreateProduct} disabled={createProduct.isPending || !newProdName} className="flex-1 bg-primary text-primary-foreground font-jakarta font-bold text-sm py-2.5 rounded-xl hover:bg-wo-oro-dark disabled:opacity-50">
                  {createProduct.isPending ? "Creando..." : "Crear producto"}
                </button>
                <button onClick={() => setNewProductModal(false)} className="px-4 font-jakarta text-sm text-wo-crema-muted hover:text-wo-crema py-2.5 rounded-xl bg-wo-carbon" style={{ border: "0.5px solid rgba(255,255,255,0.1)" }}>Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
