import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toN } from "@/lib/utils";

/** Safety wrapper: converts any numeric string from PostgREST to number before .toFixed() */
const n = (v: unknown) => toN(v);
import ProductImageUploader, { type GalleryImage } from "@/components/ProductImageUploader";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useProducts, useCategories } from "@/hooks/useProducts";
import {
  useAllAffiliates, useAllOrders, useAllPayments,
  useApprovePayment, useRejectPayment, useBreakageCommissions,
  useUpdateAffiliate, useUpdateProduct, useCreateProduct,
  useUpdateBusinessSettings, useDeleteAffiliate, useUpdateAffiliateStatus,
  useAffiliateReferralTree, useAffiliatePayments, useUpdateOrderStatus,
  useCreateCategory, useUpdateCategory, useDeleteCategory, useDeleteProduct,
  usePendingCommissions, useTotalWallets,
  useAllWallets, useAllPendingCommissions,
  useLiquidateCommission, useLiquidateAllCommissions,
  type OrderWithItems, type PaymentWithAffiliate,
} from "@/hooks/useAdmin";
import { useBusinessSettings } from "@/hooks/useAffiliate";
import type { Affiliate, Product } from "@/lib/database.types";
import {
  Settings, ShoppingBag, Users, Package, BarChart3, Wallet, CreditCard,
  AlertTriangle, Search, Eye, CheckCircle, XCircle, ArrowUpRight,
  ArrowDownRight, TrendingUp, Target, ArrowRightCircle,
  DollarSign, Download, Edit2, Trash2, Plus, Tag, MessageCircle, Copy
} from "lucide-react";

const tabs = [
  { id: "resumen",      label: "Resumen",             icon: <BarChart3 size={14} /> },
  { id: "pedidos",      label: "Pedidos",             icon: <ShoppingBag size={14} /> },
  { id: "afiliados",    label: "Afiliados",           icon: <Users size={14} /> },
  { id: "catalogo",     label: "Catálogo",            icon: <Package size={14} /> },
  { id: "reportes",     label: "Reportes",            icon: <BarChart3 size={14} /> },
  { id: "billetera",    label: "Billetera",           icon: <Wallet size={14} /> },
  { id: "pagos",        label: "Pagos",               icon: <CreditCard size={14} /> },
  { id: "remanentes",   label: "Remanentes",          icon: <AlertTriangle size={14} /> },
];

const cardStyle = { border: "0.5px solid rgba(255,255,255,0.07)" };
const rowBorder = { borderBottom: "0.5px solid rgba(255,255,255,0.07)" };

function statusBadge(status: string) {
  const map: Record<string, string> = {
    aprobado: "bg-secondary/15 text-secondary",
    pendiente: "bg-primary/15 text-primary",
    rechazado: "bg-destructive/15 text-destructive",
    entregado: "bg-secondary/15 text-secondary",
    procesando: "bg-primary/15 text-primary",
    enviado: "bg-wo-crema/10 text-wo-crema-muted",
    cancelado: "bg-destructive/15 text-destructive",
  };
  return map[status] ?? "bg-wo-crema/10 text-wo-crema-muted";
}

interface PaymentRowProps {
  p: PaymentWithAffiliate;
  extraCols?: React.ReactNode;
  onApprove: (p: PaymentWithAffiliate) => void;
  onReject:  (p: PaymentWithAffiliate) => void;
  onView:    (p: PaymentWithAffiliate) => void;
  isPending: boolean;
}

const PaymentRow = ({ p, extraCols, onApprove, onReject, onView, isPending }: PaymentRowProps) => (
  <tr style={rowBorder} className="hover:bg-wo-carbon/30 transition-colors">
    <td className="px-4 py-3 font-jakarta text-xs text-wo-crema">{p.affiliate?.name ?? "—"}</td>
    <td className="px-4 py-3 font-jakarta text-xs text-wo-crema-muted">{p.affiliate?.affiliate_code ?? "—"}</td>
    {extraCols}
    <td className="px-4 py-3 font-syne font-bold text-sm text-primary">S/ {p.amount.toLocaleString()}</td>
    <td className="px-4 py-3">
      <button
        onClick={() => onView(p)}
        className={`flex items-center gap-1 font-jakarta text-xs font-bold px-2 py-1 rounded transition-colors ${
          p.receipt_url
            ? "text-primary hover:bg-primary/10"
            : "text-wo-crema/30 cursor-not-allowed"
        }`}
        disabled={!p.receipt_url}
        title={p.receipt_url ? "Ver comprobante" : "Sin comprobante"}
      >
        <Eye size={11} /> {p.receipt_url ? "Ver" : "—"}
      </button>
    </td>
    <td className="px-4 py-3 font-jakarta text-xs text-wo-crema-muted">{new Date(p.created_at).toLocaleDateString("es-PE")}</td>
    <td className="px-4 py-3">
      <span className={`font-jakarta text-xs font-bold px-2 py-0.5 rounded-wo-pill ${statusBadge(p.status)}`}>
        {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
      </span>
    </td>
    <td className="px-4 py-3">
      <div className="flex gap-1">
        <button
          onClick={() => onView(p)}
          className="flex items-center gap-1 font-jakarta text-[10px] font-bold px-2 py-1 rounded hover:bg-wo-carbon text-wo-crema-muted hover:text-wo-crema transition-colors"
          title="Revisar comprobante y cambiar estado"
        >
          <Eye size={11} /> Revisar
        </button>
        {p.status === "pendiente" && (
          <>
            <button onClick={() => onApprove(p)} disabled={isPending} className="flex items-center gap-1 font-jakarta text-[10px] font-bold px-2 py-1 rounded hover:bg-secondary/15 text-wo-crema-muted hover:text-secondary transition-colors">
              <CheckCircle size={11} /> Aprobar
            </button>
            <button onClick={() => onReject(p)} disabled={isPending} className="flex items-center gap-1 font-jakarta text-[10px] font-bold px-2 py-1 rounded hover:bg-destructive/15 text-wo-crema-muted hover:text-destructive transition-colors">
              <XCircle size={11} /> Rechazar
            </button>
          </>
        )}
      </div>
    </td>
  </tr>
);

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [activeTab,            setActiveTab]            = useState("resumen");
  const [openSettings,         setOpenSettings]         = useState(false);
  const [orderFilter,          setOrderFilter]          = useState("todos");
  const [affiliateSearch,      setAffiliateSearch]      = useState("");
  const [affiliateStatusFilter,setAffiliateStatusFilter]= useState<"todos" | "active" | "suspended" | "pending">("todos");
  const [paymentSubTab,        setPaymentSubTab]        = useState<"activaciones" | "reactivaciones" | "upgrades" | "retiros" | "recargas">("activaciones");
  const [billeraSubTab,        setBilleraSubTab]        = useState<"saldos" | "retiros" | "por_acreditar">("saldos");
  const [remanentFilter,       setRemanentFilter]       = useState("todos");
  const [activeTooltip,        setActiveTooltip]        = useState<string | null>(null);
  const [viewingAffiliate,     setViewingAffiliate]     = useState<any | null>(null);
  const [editingAffiliate,     setEditingAffiliate]     = useState<Affiliate | null>(null);
  const [viewingOrder,         setViewingOrder]         = useState<OrderWithItems | null>(null);
  const [viewingProduct,       setViewingProduct]       = useState<Product | null>(null);
  const [newProductModal,      setNewProductModal]      = useState(false);
  const [viewingPayment,       setViewingPayment]       = useState<PaymentWithAffiliate | null>(null);
  const [confirmDeleteId,      setConfirmDeleteId]      = useState<string | null>(null);
  const [confirmDeleteProductId, setConfirmDeleteProductId] = useState<string | null>(null);
  const [affDetailTab,         setAffDetailTab]         = useState<"info" | "pagos" | "red">("info");

  // Settings form state (métodos de pago)
  const [settingsYape,    setSettingsYape]    = useState("");
  const [settingsPlin,    setSettingsPlin]    = useState("");
  const [settingsHolder,  setSettingsHolder]  = useState("");
  const [settingsBank,    setSettingsBank]    = useState("");
  const [settingsAcct,    setSettingsAcct]    = useState("");
  const [settingsWA,      setSettingsWA]      = useState("");
  const [settingsPhone,   setSettingsPhone]   = useState("");
  const [settingsSaved,   setSettingsSaved]   = useState(false);
  const [settingsQrUrl,   setSettingsQrUrl]   = useState("");
  const [settingsQrFile,  setSettingsQrFile]  = useState<File | null>(null);

  const hasSettingsChanges = 
    settingsYape !== (bizSettings?.yape_number ?? "") ||
    settingsPlin !== (bizSettings?.plin_number ?? "") ||
    settingsHolder !== (bizSettings?.account_holder_name ?? "") ||
    settingsBank !== (bizSettings?.bank_name ?? "") ||
    settingsAcct !== (bizSettings?.bank_account ?? "") ||
    settingsWA !== (bizSettings?.whatsapp_number ?? "") ||
    settingsPhone !== (bizSettings?.contact_phone ?? "");

  // Edit affiliate form state
  const [affName,     setAffName]     = useState("");
  const [affYape,     setAffYape]     = useState("");
  const [affPackage,  setAffPackage]  = useState("");

  // Edit product form state
  const [prodName,         setProdName]         = useState("");
  const [prodPartnerPrice, setProdPartnerPrice] = useState("");
  const [prodPublicPrice,  setProdPublicPrice]  = useState("");
  const [prodStock,        setProdStock]        = useState("");
  const [prodDesc,         setProdDesc]         = useState("");
  const [prodImg,          setProdImg]          = useState("");
  const [prodImgAlt,       setProdImgAlt]       = useState("");
  const [prodGallery,      setProdGallery]      = useState<GalleryImage[]>([]);
  const [prodCategoryId, setProdCategoryId] = useState<string | null>(null);
  const [prodIsActive,   setProdIsActive]   = useState(true);

  // New product form state
  const [newProdName,         setNewProdName]         = useState("");
  const [newProdPartnerPrice, setNewProdPartnerPrice] = useState("");
  const [newProdPublicPrice,  setNewProdPublicPrice]  = useState("");
  const [newProdStock,        setNewProdStock]        = useState("");
  const [newProdDesc,         setNewProdDesc]         = useState("");
  const [newProdImg,          setNewProdImg]          = useState("");
  const [newProdImgAlt,       setNewProdImgAlt]       = useState("");
  const [newProdGallery,      setNewProdGallery]      = useState<GalleryImage[]>([]);
  const [newProdCategoryId, setNewProdCategoryId]  = useState<string | null>(null);

  // Category management state
  const [catalogSubTab,  setCatalogSubTab]  = useState<"productos" | "categorias">("productos");
  const [catModal,       setCatModal]       = useState(false);
  const [editingCat,     setEditingCat]     = useState<{ id: string; name: string; icon: string | null; color: string | null } | null>(null);
  const [catName,        setCatName]        = useState("");
  const [catColor,       setCatColor]       = useState("#F59E0B");
  const [confirmDeleteCatId, setConfirmDeleteCatId] = useState<string | null>(null);
  const [logisticsTab,   setLogisticsTab]   = useState<"por_enviar" | "en_camino" | "entregados">("por_enviar");
  const [logisticsSearch, setLogisticsSearch] = useState("");
  const [trackingModal,  setTrackingModal]  = useState<OrderWithItems | null>(null);
  const [trackingVal,    setTrackingVal]    = useState("");

  // Data hooks
  const { data: affiliates = [], isLoading: loadingAffiliates } = useAllAffiliates();
  const { data: orders = [],     isLoading: loadingOrders }     = useAllOrders();
  const { data: payments = [],   isLoading: loadingPayments }   = useAllPayments();
  const { data: breakage = [] }                                 = useBreakageCommissions();
  const { data: products = [],    isLoading: loadingProducts }   = useProducts(undefined, true);
  const { data: categories = [],  isLoading: loadingCategories } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const approvePayment        = useApprovePayment();
  const rejectPayment         = useRejectPayment();
  const liquidateCommission   = useLiquidateCommission();
  const liquidateAll          = useLiquidateAllCommissions();
  const updateAffiliate       = useUpdateAffiliate();
  const updateProduct         = useUpdateProduct();
  const createProduct         = useCreateProduct();
  const updateBusinessSettings = useUpdateBusinessSettings();
  const deleteProduct          = useDeleteProduct();
  const deleteAffiliate       = useDeleteAffiliate();
  const updateAffiliateStatus = useUpdateAffiliateStatus();
  const updateOrderStatus     = useUpdateOrderStatus();
  const { data: bizSettings }           = useBusinessSettings();
  const { data: pendingComms }          = usePendingCommissions();
  const { data: totalWallets }          = useTotalWallets();
  const { data: allWallets = [] }       = useAllWallets();
  const { data: pendingCommRows = [] }  = useAllPendingCommissions();

  // ─── Datos del afiliado seleccionado ──────────────────────────────────────
  const { data: selectedReferralTree = [] } = useAffiliateReferralTree(viewingAffiliate?.id ?? null);
  const { data: selectedPayments = [] }     = useAffiliatePayments(viewingAffiliate?.id ?? null);

  const packageDepth: Record<string, number> = { "Básico": 3, "Ejecutivo": 5, "Intermedio": 7, "VIP": 10 };
  const depthUnlocked = viewingAffiliate ? packageDepth[viewingAffiliate.package] || 10 : 10;
  const visibleReferralTree = selectedReferralTree.filter(r => r.level <= depthUnlocked);

  // ─── Derived aggregates ───────────────────────────────────────────────────
  const confirmedOrders = orders.filter(o => ["procesando", "enviado", "entregado"].includes(o.status));
  const totalRevenue     = confirmedOrders.reduce((s, o) => s + o.total, 0);
  const totalCommissions = affiliates.reduce((s, a) => s + (a.total_commissions ?? 0), 0);
  const pendingWithdrawals = payments.filter((p) => p.type === "retiro" && p.status === "pendiente").reduce((s, p) => s + p.amount, 0);
  const totalRemanentes  = breakage.filter((r) => r.status === "rejected").reduce((s, r) => s + r.amount, 0);

  // ─── Filtered data ────────────────────────────────────────────────────────
  const filteredOrders = (orderFilter === "todos" ? orders : orders.filter((o) => o.status === orderFilter))
    .filter(o => 
      o.order_number.toLowerCase().includes(logisticsSearch.toLowerCase()) || 
      o.customer_name.toLowerCase().includes(logisticsSearch.toLowerCase())
    );

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
    if (remanentFilter === "pendiente") return r.status === "rejected"; // breakage se crea con status='rejected'
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
    try {
      await approvePayment.mutateAsync(p.id);
      setViewingPayment(null);
      toast({ title: "✓ Pago aprobado", description: `${p.affiliate?.name ?? "Afiliado"} — S/ ${p.amount.toFixed(2)}` });
    } catch (err) {
      toast({ title: "Error al aprobar", description: err instanceof Error ? err.message : "Intenta nuevamente.", variant: "destructive" });
    }
  };
  const handleReject = async (p: PaymentWithAffiliate) => {
    try {
      await rejectPayment.mutateAsync(p.id);
      setViewingPayment(null);
      toast({ title: "Pago rechazado", description: `${p.affiliate?.name ?? "Afiliado"} notificado.` });
    } catch (err) {
      toast({ title: "Error al rechazar", description: err instanceof Error ? err.message : "Intenta nuevamente.", variant: "destructive" });
    }
  };
  const handleView = (p: PaymentWithAffiliate) => {
    setViewingPayment(p);
  };

  const handleDeleteAffiliate = async (id: string) => {
    try {
      await deleteAffiliate.mutateAsync(id);
      setConfirmDeleteId(null);
      setViewingAffiliate(null);
      toast({ title: "Afiliado eliminado" });
    } catch (err) {
      toast({ title: "Error al eliminar", description: err instanceof Error ? err.message : "Intenta nuevamente.", variant: "destructive" });
    }
  };

  const handleStatusChange = async (id: string, status: "active" | "suspended" | "pending") => {
    try {
      await updateAffiliateStatus.mutateAsync({ id, status });
      // Sync modal snapshot so badge + buttons reflect new state immediately
      setViewingAffiliate((prev: any) => prev ? { ...prev, account_status: status } : null);
      const statusLabel = status === "active" ? "Activo" : status === "suspended" ? "Suspendido" : "Pendiente";
      toast({ title: `Estado actualizado: ${statusLabel}` });
    } catch (err) {
      toast({ title: "Error al cambiar estado", description: err instanceof Error ? err.message : "Intenta nuevamente.", variant: "destructive" });
    }
  };

  const handleOpenSettings = () => {
    setSettingsYape(bizSettings?.yape_number ?? "");
    setSettingsPlin(bizSettings?.plin_number ?? "");
    setSettingsHolder(bizSettings?.account_holder_name ?? "");
    setSettingsBank(bizSettings?.bank_name ?? "");
    setSettingsAcct(bizSettings?.bank_account ?? "");
    setSettingsWA(bizSettings?.whatsapp_number ?? "");
    setSettingsPhone(bizSettings?.contact_phone ?? "");
    setSettingsQrUrl(bizSettings?.yape_qr_url ?? "");
    setSettingsQrFile(null);
    setSettingsSaved(false);
    setOpenSettings(true);
  };

  const handleSaveSettings = async () => {
    if (!bizSettings?.id) {
      toast({ title: "Error", description: "No se encontró la configuración del negocio.", variant: "destructive" });
      return;
    }

    try {
      let finalQrUrl = settingsQrUrl;
      if (settingsQrFile) {
        const fileExt = settingsQrFile.name.split('.').pop();
        const fileName = `qr-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from("receipts").upload(`settings/${fileName}`, settingsQrFile);
        if (uploadError) throw new Error("Error al subir QR: " + uploadError.message);
        const { data: { publicUrl } } = supabase.storage.from("receipts").getPublicUrl(`settings/${fileName}`);
        finalQrUrl = publicUrl;
      }

      await updateBusinessSettings.mutateAsync({
        id:                   bizSettings.id,
        yape_number:          settingsYape,
        plin_number:          settingsPlin,
        account_holder_name:  settingsHolder,
        yape_qr_url:          finalQrUrl,
        bank_name:            settingsBank,
        bank_account:         settingsAcct,
        whatsapp_number:      settingsWA,
        contact_phone:        settingsPhone,
        contact_email:        bizSettings.contact_email ?? undefined,
      });
      setSettingsSaved(true);
      toast({ title: "✓ Métodos de pago guardados" });
    } catch (err) {
      toast({ title: "Error al guardar", description: err instanceof Error ? err.message : "Intenta nuevamente.", variant: "destructive" });
    }
  };

  const openEditAffiliate = (a: Affiliate) => {
    setAffName(a.name);
    setAffYape(a.yape_number ?? "");
    setAffPackage(a.package ?? "Básico");
    setEditingAffiliate(a);
  };

  const handleSaveAffiliate = async () => {
    if (!editingAffiliate) return;
    try {
      await updateAffiliate.mutateAsync({ id: editingAffiliate.id, name: affName, yape_number: affYape, pkg: affPackage });
      setEditingAffiliate(null);
      toast({ title: "✓ Afiliado actualizado" });
    } catch (err) {
      toast({ title: "Error al guardar", description: err instanceof Error ? err.message : "Intenta nuevamente.", variant: "destructive" });
    }
  };

  const openEditProduct = (p: Product) => {
    setProdName(p.name);
    setProdPartnerPrice(p.partner_price != null ? n(p.partner_price).toFixed(2) : "");
    setProdPublicPrice(p.public_price   != null ? n(p.public_price).toFixed(2)  : "");
    setProdStock(String(p.stock));
    setProdDesc(p.description ?? "");
    setProdImg(p.image_url ?? "");
    setProdImgAlt((p as any).image_alt ?? "");
    setProdGallery(((p as any).gallery_images as GalleryImage[]) ?? []);
    setProdCategoryId(p.category_id ?? null);
    setProdIsActive(p.is_active);
    setViewingProduct(p);
  };

  const handleSaveProduct = async () => {
    if (!viewingProduct) return;
    const publicVal  = parseFloat(prodPublicPrice)  || 0;
    const partnerVal = prodPartnerPrice !== "" ? parseFloat(prodPartnerPrice) : null;
    try {
      await updateProduct.mutateAsync({
        id:            viewingProduct.id,
        name:          prodName,
        price:         publicVal,          // price = público (para compat. DB)
        partner_price: partnerVal,
        public_price:  publicVal,
        stock:         parseInt(prodStock, 10) || 0,
        description:    prodDesc,
        image_url:      prodImg,
        image_alt:      prodImgAlt || null,
        gallery_images: prodGallery,
        is_active:      prodIsActive,
        category_id: prodCategoryId,
      });
      setViewingProduct(null);
      toast({ title: "✓ Producto actualizado" });
    } catch (err) {
      toast({ title: "Error al guardar producto", description: err instanceof Error ? err.message : "Intenta nuevamente.", variant: "destructive" });
    }
  };

  const handleCreateProduct = async () => {
    const publicVal  = parseFloat(newProdPublicPrice)  || 0;
    const partnerVal = newProdPartnerPrice !== "" ? parseFloat(newProdPartnerPrice) : null;
    try {
      await createProduct.mutateAsync({
        name:          newProdName,
        price:         publicVal,          // price = público (para compat. DB)
        partner_price: partnerVal,
        public_price:  publicVal,
        stock:         parseInt(newProdStock, 10) || 0,
        description:    newProdDesc,
        image_url:      newProdImg,
        image_alt:      newProdImgAlt || null,
        gallery_images: newProdGallery,
        is_active:      true,
        category_id: newProdCategoryId,
      });
      setNewProductModal(false);
      setNewProdName(""); setNewProdStock(""); setNewProdDesc("");
      setNewProdImg(""); setNewProdImgAlt(""); setNewProdGallery([]); setNewProdCategoryId(null);
      setNewProdPartnerPrice(""); setNewProdPublicPrice("");
      toast({ title: "✓ Producto creado" });
    } catch (err) {
      toast({ title: "Error al crear producto", description: err instanceof Error ? err.message : "Intenta nuevamente.", variant: "destructive" });
    }
  };

  const openCatCreate = () => {
    setEditingCat(null);
    setCatName("");
    setCatColor("#F59E0B");
    setCatModal(true);
  };

  const openCatEdit = (c: { id: string; name: string; icon: string | null; color: string | null }) => {
    setEditingCat(c);
    setCatName(c.name);
    setCatColor(c.color ?? "#F59E0B");
    setCatModal(true);
  };

  const handleSaveCategory = async () => {
    if (!catName.trim()) return;
    try {
      if (editingCat) {
        await updateCategory.mutateAsync({ id: editingCat.id, name: catName.trim(), color: catColor });
        toast({ title: "✓ Categoría actualizada" });
      } else {
        await createCategory.mutateAsync({ name: catName.trim(), color: catColor });
        toast({ title: "✓ Categoría creada" });
      }
      setCatModal(false);
    } catch (err) {
      toast({ title: "Error al guardar categoría", description: err instanceof Error ? err.message : "Intenta nuevamente.", variant: "destructive" });
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await deleteCategory.mutateAsync(id);
      setConfirmDeleteCatId(null);
      toast({ title: "Categoría eliminada" });
    } catch (err) {
      toast({ title: "Error al eliminar categoría", description: err instanceof Error ? err.message : "Intenta nuevamente.", variant: "destructive" });
    }
  };


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
          <div className="space-y-6" onClick={() => setActiveTooltip(null)}>

            {/* Helper tooltip inline */}
            {(() => {
              const TT = ({ id, text }: { id: string; text: string }) => (
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setActiveTooltip(activeTooltip === id ? null : id)}
                    className="w-5 h-5 rounded-full flex items-center justify-center font-jakarta text-[10px] font-bold text-wo-crema-muted hover:text-wo-crema transition-colors"
                    style={{ border: "0.5px solid rgba(255,255,255,0.15)" }}
                    title="Ver descripción"
                  >?</button>
                  {activeTooltip === id && (
                    <div className="absolute right-0 top-7 z-50 w-60 rounded-lg p-3 font-jakarta text-xs text-wo-crema leading-relaxed shadow-2xl" style={{ background: "#0a1228", border: "0.5px solid rgba(255,255,255,0.12)" }}>
                      {text}
                    </div>
                  )}
                </div>
              );

              const kpis = [
                { label: "Ventas totales",    value: `S/ ${totalRevenue.toFixed(2)}`,  icon: <DollarSign size={16} />, color: "text-primary",     up: true,  desc: "Suma de pedidos confirmados (procesando, enviado o entregado). No incluye pedidos pendientes de pago o cancelados." },
                { label: "Pedidos",           value: confirmedOrders.length,           icon: <ShoppingBag size={16} />, color: "text-secondary",  up: true,  desc: "Cantidad de pedidos confirmados en el sistema." },
                { label: "Afiliados activos", value: affiliates.filter((a) => a.account_status === "active").length, icon: <Users size={16} />, color: "text-primary", up: true, desc: "Afiliados con cuenta activa que pueden generar comisiones. No incluye cuentas pendientes ni suspendidas." },
                { label: "Inventario bajo",   value: products.filter((p) => p.stock <= 10).length, icon: <AlertTriangle size={16} />, color: "text-destructive", up: false, desc: "Productos con 10 o menos unidades en stock. Requiere reabastecimiento pronto." },
              ];

              return (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {kpis.map((kpi, i) => (
                      <div key={i} className="bg-wo-grafito rounded-wo-card p-5" style={cardStyle}>
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-jakarta text-[11px] text-wo-crema-muted uppercase">{kpi.label}</p>
                          <div className="flex items-center gap-2">
                            <TT id={`kpi-${i}`} text={kpi.desc} />
                            <span className="text-wo-crema-muted">{kpi.icon}</span>
                          </div>
                        </div>
                        <p className={`font-syne font-extrabold text-[28px] ${kpi.color}`}>{kpi.value}</p>
                        <p className={`font-jakarta text-xs font-medium mt-1 ${kpi.up ? "text-secondary" : "text-destructive"}`}>
                          {kpi.up ? <ArrowUpRight size={10} className="inline" /> : <ArrowDownRight size={10} className="inline" />} en tiempo real
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      {
                        label: "Comisiones acumuladas",
                        value: `S/ ${totalCommissions.toFixed(2)}`,
                        color: "text-primary",
                        sub: "Total histórico pagado a red",
                        id: "kpi-comm",
                        desc: "Suma histórica de todas las comisiones acreditadas a afiliados desde el inicio. No representa lo que se debe ahora, sino el total que ya se ha pagado.",
                      },
                      {
                        label: "Retiros pendientes",
                        value: `S/ ${pendingWithdrawals.toFixed(2)}`,
                        color: "text-primary",
                        sub: `${retiros.filter((w) => w.status === "pendiente").length} solicitudes`,
                        id: "kpi-ret",
                        desc: "Monto total de solicitudes de retiro de billetera que los afiliados han enviado y aún no han sido aprobadas ni pagadas.",
                      },
                      {
                        label: "Remanentes sin asignar",
                        value: `S/ ${totalRemanentes.toFixed(2)}`,
                        color: "text-destructive",
                        sub: `${breakage.filter((r) => r.status === "rejected").length} sin asignar`,
                        id: "kpi-rem",
                        desc: "Comisiones generadas que no llegaron al afiliado porque su paquete no alcanzaba ese nivel o su cuenta estaba inactiva. El dinero queda en la empresa como ingreso adicional.",
                      },
                    ].map((c) => (
                      <div key={c.id} className="bg-wo-grafito rounded-wo-card p-5" style={cardStyle}>
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-jakarta text-[11px] text-wo-crema-muted uppercase">{c.label}</p>
                          <TT id={c.id} text={c.desc} />
                        </div>
                        <p className={`font-syne font-extrabold text-xl ${c.color}`}>{c.value}</p>
                        <p className="font-jakarta text-xs text-wo-crema-muted mt-1">{c.sub}</p>
                      </div>
                    ))}
                  </div>

                  {/* Obligaciones financieras pendientes */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-wo-grafito rounded-wo-card p-5" style={{ border: "0.5px solid rgba(231,76,60,0.25)" }}>
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-jakarta text-[11px] text-wo-crema-muted uppercase">Comisiones por pagar</p>
                        <div className="flex items-center gap-2">
                          <TT id="kpi-topay" text="Comisiones reales generadas por ventas ya entregadas, pendientes de acreditar en las billeteras de los afiliados. Esto es deuda real con tu red." />
                          <span className="font-jakarta text-[10px] font-bold px-2 py-0.5 rounded-wo-pill bg-destructive/15 text-destructive">DEBE</span>
                        </div>
                      </div>
                      <p className="font-syne font-extrabold text-2xl text-destructive">S/ {(pendingComms?.total ?? 0).toFixed(2)}</p>
                      <p className="font-jakarta text-xs text-wo-crema-muted mt-1">{pendingComms?.count ?? 0} comisiones pendientes de liquidar a la red</p>
                    </div>
                    <div className="bg-wo-grafito rounded-wo-card p-5" style={{ border: "0.5px solid rgba(255,184,0,0.2)" }}>
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-jakarta text-[11px] text-wo-crema-muted uppercase">Total en billeteras</p>
                        <div className="flex items-center gap-2">
                          <TT id="kpi-wallets" text="Saldo total acumulado en las billeteras digitales de todos los afiliados. Este dinero ya fue acreditado y los afiliados pueden usarlo para comprar o retirarlo." />
                          <span className="font-jakarta text-[10px] font-bold px-2 py-0.5 rounded-wo-pill bg-primary/15 text-primary">BILLETERAS</span>
                        </div>
                      </div>
                      <p className="font-syne font-extrabold text-2xl text-primary">S/ {(totalWallets?.total ?? 0).toFixed(2)}</p>
                      <p className="font-jakarta text-xs text-wo-crema-muted mt-1">{allWallets.filter((w) => w.balance > 0).length} afiliados con saldo activo</p>
                    </div>
                  </div>
                </>
              );
            })()}

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
              <button
                onClick={() => toast({ title: "Exportar — Próximamente", description: "Esta función estará disponible pronto." })}
                className="flex items-center gap-1.5 font-jakarta text-xs text-wo-crema-muted hover:text-wo-crema px-3 py-1.5 rounded-wo-pill bg-wo-carbon"
                style={{ border: "0.5px solid rgba(255,255,255,0.07)" }}
              >
                <Download size={12} /> Exportar
              </button>
            </div>

            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-wo-crema-muted" />
                <input
                  type="text"
                  placeholder="Buscar por # pedido o cliente..."
                  value={logisticsSearch}
                  onChange={(e) => setLogisticsSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-wo-carbon rounded-xl font-jakarta text-xs text-wo-crema placeholder:text-wo-crema-muted w-64 border border-white/5 outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-wo-carbon/40 rounded-wo-card h-[220px] animate-pulse shadow-lg" style={cardStyle} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredAffiliates.map((a) => (
                  <div key={a.id} className="relative bg-wo-carbon rounded-wo-card p-5 group hover:border-primary/40 transition-all duration-300 shadow-xl" style={cardStyle}>
                    <div className="flex items-start gap-4 mb-5">
                      <div className="w-12 h-12 rounded-full bg-wo-grafito flex items-center justify-center font-syne font-bold text-lg text-primary overflow-hidden shrink-0 shadow-inner" style={{ border: "0.5px solid rgba(255,255,255,0.08)" }}>
                        {a.name.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-syne font-bold text-wo-crema text-base truncate pr-6 leading-tight" title={a.name}>{a.name}</h4>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          <span className="text-[9px] font-jakarta font-extrabold px-1.5 py-0.5 rounded bg-primary/10 text-primary uppercase tracking-wider">{a.package}</span>
                          <span className={`font-jakarta text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                            a.account_status === "active"    ? "bg-secondary/10 text-secondary" :
                            a.account_status === "suspended" ? "bg-destructive/10 text-destructive" :
                            "bg-wo-crema/5 text-wo-crema-muted"
                          }`}>
                            {a.account_status === "active" ? "Activo" : a.account_status === "suspended" ? "Suspendido" : "Pendiente"}
                          </span>
                        </div>
                        {a.sponsor?.name && (
                          <div className="mt-2 flex items-center gap-1.5 bg-secondary/5 px-2 py-1 rounded-lg border border-secondary/10 w-fit">
                            <span className="text-[8px] font-jakarta font-bold text-secondary uppercase opacity-70">Sponsor:</span>
                            <span className="text-[10px] font-jakarta font-medium text-wo-crema truncate max-w-[120px]">{a.sponsor.name}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 mb-5">
                      <div className="bg-wo-grafito/40 p-2.5 rounded-xl border border-white/[0.03]">
                        <p className="font-jakarta text-[8px] text-wo-crema-muted uppercase tracking-tighter mb-0.5">Ventas Totales</p>
                        <p className="font-syne font-extrabold text-sm text-primary">S/ {(a.total_sales ?? 0).toFixed(2)}</p>
                      </div>
                      <div className="bg-wo-grafito/40 p-2.5 rounded-xl border border-white/[0.03]">
                        <p className="font-jakarta text-[8px] text-wo-crema-muted uppercase tracking-tighter mb-0.5">Red de Referidos</p>
                        <p className="font-syne font-extrabold text-sm text-wo-crema">{a.referral_count ?? 0} <span className="text-[10px] font-normal opacity-50">ref.</span></p>
                      </div>
                      <div className="bg-wo-grafito/40 p-2.5 rounded-xl border border-white/[0.03]">
                        <p className="font-jakarta text-[8px] text-wo-crema-muted uppercase tracking-tighter mb-0.5">Comisiones</p>
                        <p className="font-syne font-extrabold text-sm text-secondary">S/ {(a.total_commissions ?? 0).toFixed(2)}</p>
                      </div>
                      <div className="bg-wo-grafito/40 p-2.5 rounded-xl border border-white/[0.03]">
                        <p className="font-jakarta text-[8px] text-wo-crema-muted uppercase tracking-tighter mb-0.5">Código Afiliado</p>
                        <p className="font-syne font-extrabold text-[11px] text-wo-crema/40 truncate">{a.affiliate_code}</p>
                      </div>
                    </div>

                    {/* Controles de Estado Rápidos */}
                    <div className="flex items-center justify-between gap-2 mb-5 p-2 bg-wo-grafito/50 rounded-xl border border-white/5">
                      <p className="font-jakarta text-[10px] text-wo-crema-muted uppercase font-bold ml-1">Estado:</p>
                      <div className="flex gap-1">
                        {(["active", "suspended", "pending"] as const).map((s) => (
                          <button
                            key={s}
                            onClick={() => handleStatusChange(a.id, s)}
                            className={`px-2 py-1 rounded-lg font-jakarta text-[9px] font-extrabold uppercase transition-all ${
                              a.account_status === s 
                                ? (s === "active" ? "bg-secondary text-secondary-foreground shadow-lg shadow-secondary/20" : s === "suspended" ? "bg-destructive text-destructive-foreground shadow-lg shadow-destructive/20" : "bg-wo-crema/20 text-wo-crema")
                                : "text-wo-crema/20 hover:bg-white/5"
                            }`}
                          >
                            {s === "active" ? "Activar" : s === "suspended" ? "Suspender" : "Pendiente"}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4 border-t border-white/[0.06]">
                      <button 
                        onClick={() => { setViewingAffiliate(a); setAffDetailTab("info"); }} 
                        className="flex-1 flex items-center justify-center gap-2 font-jakarta font-bold text-xs py-2.5 rounded-xl bg-wo-carbon border border-white/5 hover:bg-wo-grafito hover:border-white/10 transition-all text-wo-crema-muted hover:text-wo-crema shadow-sm"
                      >
                        <Eye size={12} className="text-primary" /> Perfil
                      </button>
                      <a 
                        href={`https://wa.me/${a.contact_phone?.replace(/\D/g, "")}?text=${encodeURIComponent(`Hola ${(a.name || "Afiliado").split(" ")[0]}, te saluda el Admin de WinClick.`)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="p-2.5 rounded-xl bg-wo-carbon border border-white/5 hover:bg-[#25D366]/10 hover:border-[#25D366]/20 transition-all text-wo-crema-muted hover:text-[#25D366] shadow-sm"
                        title="WhatsApp"
                      >
                        <MessageCircle size={13} />
                      </a>
                      <button 
                        onClick={() => openEditAffiliate(a)} 
                        className="p-2.5 rounded-xl bg-wo-carbon border border-white/5 hover:bg-wo-grafito hover:border-white/10 transition-all text-wo-crema-muted hover:text-wo-crema shadow-sm"
                        title="Editar"
                      >
                        <Edit2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
                {filteredAffiliates.length === 0 && (
                  <div className="col-span-full text-center py-24 bg-wo-carbon/20 rounded-wo-card border-2 border-dashed border-white/5">
                    <Users size={40} className="mx-auto text-wo-crema/5 mb-4" />
                    <p className="font-jakarta text-sm text-wo-crema-muted font-medium">No se encontraron afiliados para "{affiliateSearch}"</p>
                    <button onClick={() => {setAffiliateSearch(""); setAffiliateStatusFilter("todos");}} className="mt-4 text-xs font-bold text-primary hover:underline">Limpiar filtros</button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* =================== CATÁLOGO =================== */}
        {activeTab === "catalogo" && (
          <div className="space-y-4">
            {/* Sub-tabs */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCatalogSubTab("productos")}
                className={`flex items-center gap-1.5 font-jakarta font-bold text-xs px-4 py-2 rounded-wo-btn transition-colors ${catalogSubTab === "productos" ? "bg-primary text-primary-foreground" : "bg-wo-grafito text-wo-crema-muted hover:text-wo-crema"}`}
                style={catalogSubTab !== "productos" ? cardStyle : {}}
              >
                <Package size={12} /> Productos ({products.length})
              </button>
              <button
                onClick={() => setCatalogSubTab("categorias")}
                className={`flex items-center gap-1.5 font-jakarta font-bold text-xs px-4 py-2 rounded-wo-btn transition-colors ${catalogSubTab === "categorias" ? "bg-primary text-primary-foreground" : "bg-wo-grafito text-wo-crema-muted hover:text-wo-crema"}`}
                style={catalogSubTab !== "categorias" ? cardStyle : {}}
              >
                <Tag size={12} /> Categorías ({categories.length})
              </button>
            </div>

            {/* ---- Sub-tab: Productos ---- */}
            {catalogSubTab === "productos" && (
              <div className="space-y-3">
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
                        {["Producto", "Categoría", "Precio Socio", "Precio Cliente", "Stock", "Estado", "Acciones"].map((h) => (
                          <th key={h} className="text-left px-4 py-3 font-jakarta text-[11px] text-wo-crema-muted uppercase">{h}</th>
                        ))}
                      </tr></thead>
                      <tbody>
                        {loadingProducts ? (
                          <tr><td colSpan={6} className="px-4 py-8 text-center font-jakarta text-sm text-wo-crema-muted">Cargando...</td></tr>
                        ) : products.map((p) => {
                          const cat = categories.find((c) => c.id === p.category_id);
                          return (
                            <tr key={p.id} style={rowBorder} className="hover:bg-wo-carbon/30 transition-colors">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  {p.image_url ? (
                                  <img src={p.image_url} alt="" className="w-10 h-10 rounded-lg object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                                ) : (
                                  <div className="w-10 h-10 rounded-lg bg-wo-carbon flex items-center justify-center text-wo-crema/20 text-xs">—</div>
                                )}
                                  <div>
                                    <span className="font-jakarta text-sm text-wo-crema font-medium">{p.name}</span>
                                    {p.organic && <span className="ml-2 text-[9px] font-jakarta font-bold px-1.5 py-0.5 rounded-wo-pill bg-secondary/15 text-secondary">ORG</span>}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                {cat ? (
                                  <span
                                    className="font-jakarta text-[10px] font-bold px-2 py-0.5 rounded-wo-pill"
                                    style={{ background: (cat.color ?? "#F59E0B") + "22", color: cat.color ?? "#F59E0B", border: `0.5px solid ${cat.color ?? "#F59E0B"}44` }}
                                  >
                                    {cat.name}
                                  </span>
                                ) : (
                                  <span className="font-jakarta text-[10px] text-wo-crema/30">—</span>
                                )}
                              </td>
                              <td className="px-4 py-3 font-syne font-bold text-sm text-secondary">{p.partner_price != null ? `S/ ${n(p.partner_price).toFixed(2)}` : <span className="text-wo-crema/20 font-jakarta font-normal text-xs">—</span>}</td>
                              <td className="px-4 py-3 font-syne font-bold text-sm text-primary">{p.public_price != null ? `S/ ${n(p.public_price).toFixed(2)}` : `S/ ${n(p.price).toFixed(2)}`}</td>
                              <td className="px-4 py-3">
                                <span className={`font-jakarta text-xs font-bold ${p.stock <= 10 ? "text-destructive" : p.stock <= 30 ? "text-primary" : "text-wo-crema-muted"}`}>
                                  {p.stock} {p.stock <= 10 && "⚠️"}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`font-jakarta text-[10px] font-bold ${p.is_active ? "text-secondary" : "text-destructive"}`}>
                                  {p.is_active ? "Activo" : "Inactivo"}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex gap-1">
                                  <button onClick={() => openEditProduct(p)} className="p-1.5 rounded hover:bg-wo-carbon text-wo-crema-muted hover:text-wo-crema"><Edit2 size={12} /></button>
                                  <button onClick={() => setConfirmDeleteProductId(p.id)} className="p-1.5 rounded hover:bg-destructive/10 text-wo-crema-muted hover:text-destructive"><Trash2 size={12} /></button>
                                </div>
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

            {/* ---- Sub-tab: Categorías ---- */}
            {catalogSubTab === "categorias" && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-jakarta text-sm text-wo-crema-muted">{categories.length} categorías — se usan como filtros en el catálogo público</p>
                  <button onClick={openCatCreate} className="flex items-center gap-1.5 bg-primary text-primary-foreground font-jakarta font-bold text-xs px-4 py-2 rounded-wo-btn hover:bg-primary/90 transition-colors">
                    <Plus size={12} /> Nueva Categoría
                  </button>
                </div>
                <div className="bg-wo-grafito rounded-wo-card overflow-hidden" style={cardStyle}>
                  {loadingCategories ? (
                    <p className="px-4 py-8 text-center font-jakarta text-sm text-wo-crema-muted">Cargando...</p>
                  ) : categories.length === 0 ? (
                    <div className="px-4 py-12 text-center">
                      <Tag size={28} className="mx-auto text-wo-crema/20 mb-3" />
                      <p className="font-jakarta text-sm text-wo-crema-muted">No hay categorías aún</p>
                      <p className="font-jakarta text-xs text-wo-crema/30 mt-1">Crea una categoría y asígnala a los productos</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead><tr style={rowBorder}>
                          {["Categoría", "Color", "Productos", "Acciones"].map((h) => (
                            <th key={h} className="text-left px-4 py-3 font-jakarta text-[11px] text-wo-crema-muted uppercase">{h}</th>
                          ))}
                        </tr></thead>
                        <tbody>
                          {categories.map((c) => {
                            const prodCount = products.filter((p) => p.category_id === c.id).length;
                            return (
                              <tr key={c.id} style={rowBorder} className="hover:bg-wo-carbon/30 transition-colors">
                                <td className="px-4 py-3">
                                  <span className="font-jakarta text-sm text-wo-crema font-medium">{c.name}</span>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full border border-white/10" style={{ background: c.color ?? "#F59E0B" }} />
                                    <span className="font-jakarta text-xs text-wo-crema-muted">{c.color ?? "—"}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="font-jakarta text-xs text-wo-crema-muted">{prodCount} producto{prodCount !== 1 ? "s" : ""}</span>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex gap-1">
                                    <button onClick={() => openCatEdit(c)} className="p-1.5 rounded hover:bg-wo-carbon text-wo-crema-muted hover:text-wo-crema"><Edit2 size={12} /></button>
                                    <button
                                      onClick={() => setConfirmDeleteCatId(c.id)}
                                      className="p-1.5 rounded hover:bg-wo-carbon text-wo-crema-muted hover:text-destructive"
                                      title={prodCount > 0 ? `Desasignará ${prodCount} producto(s)` : "Eliminar"}
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
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
                      {(a.name || "Afiliado").split(" ").map((n) => n[0]).join("").substring(0, 2)}
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
                    {p.image_url ? (
                      <img src={p.image_url} alt="" className="w-8 h-8 rounded object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                    ) : (
                      <div className="w-8 h-8 rounded bg-wo-carbon flex items-center justify-center text-wo-crema/20 text-[10px]">—</div>
                    )}
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
          <div className="space-y-5">

            {/* KPIs billetera */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-wo-grafito rounded-wo-card p-5" style={cardStyle}>
                <p className="font-jakarta text-[11px] text-wo-crema-muted uppercase mb-1">Total en billeteras</p>
                <p className="font-syne font-extrabold text-[26px] text-primary">{(totalWallets?.total ?? 0).toFixed(2) === "0.00" ? "S/ 0.00" : `S/ ${(totalWallets?.total ?? 0).toFixed(2)}`}</p>
                <p className="font-jakarta text-xs text-wo-crema-muted mt-1">{allWallets.filter((w) => w.balance > 0).length} con saldo activo</p>
              </div>
              <div className="bg-wo-grafito rounded-wo-card p-5" style={{ border: "0.5px solid rgba(231,76,60,0.25)" }}>
                <p className="font-jakarta text-[11px] text-wo-crema-muted uppercase mb-1">Por acreditar</p>
                <p className="font-syne font-extrabold text-[26px] text-destructive">S/ {(pendingComms?.total ?? 0).toFixed(2)}</p>
                <p className="font-jakarta text-xs text-wo-crema-muted mt-1">{pendingComms?.count ?? 0} comisiones pendientes</p>
              </div>
              <div className="bg-wo-grafito rounded-wo-card p-5" style={cardStyle}>
                <p className="font-jakarta text-[11px] text-wo-crema-muted uppercase mb-1">Retiros pendientes</p>
                <p className="font-syne font-extrabold text-[26px] text-primary">S/ {pendingWithdrawals.toFixed(2)}</p>
                <p className="font-jakarta text-xs text-wo-crema-muted mt-1">{retiros.filter((w) => w.status === "pendiente").length} solicitudes</p>
              </div>
              <div className="bg-wo-grafito rounded-wo-card p-5" style={cardStyle}>
                <p className="font-jakarta text-[11px] text-wo-crema-muted uppercase mb-1">Total obligaciones</p>
                <p className="font-syne font-extrabold text-[26px] text-destructive">
                  S/ {((pendingComms?.total ?? 0) + (totalWallets?.total ?? 0) + pendingWithdrawals).toFixed(2)}
                </p>
                <p className="font-jakarta text-xs text-wo-crema-muted mt-1">Por acreditar + billeteras + retiros</p>
              </div>
            </div>

            {/* Sub-tabs */}
            <div className="flex gap-2 border-b pb-3" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
              {([
                { id: "saldos",        label: "Saldos por afiliado",   badge: allWallets.filter((w) => w.balance > 0).length },
                { id: "retiros",       label: "Solicitudes de retiro", badge: retiros.filter((w) => w.status === "pendiente").length },
                { id: "por_acreditar", label: "Por acreditar",         badge: pendingComms?.count ?? 0 },
              ] as const).map((st) => (
                <button
                  key={st.id}
                  onClick={() => setBilleraSubTab(st.id)}
                  className={`flex items-center gap-1.5 font-jakarta text-xs font-medium px-4 py-2 rounded-wo-pill transition-colors ${billeraSubTab === st.id ? "bg-primary text-primary-foreground" : "bg-wo-carbon text-wo-crema-muted hover:text-wo-crema"}`}
                >
                  {st.label}
                  {st.badge > 0 && (
                    <span className={`font-bold text-[10px] px-1.5 py-0.5 rounded-full ${billeraSubTab === st.id ? "bg-primary-foreground/20 text-primary-foreground" : "bg-destructive/20 text-destructive"}`}>
                      {st.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* ── Saldos por afiliado ── */}
            {billeraSubTab === "saldos" && (() => {
              // user_credits.user_id → affiliates.user_id (join client-side, sin FK en DB)
              const walletsWithAffiliate = allWallets.map((w) => ({
                ...w,
                aff: affiliates.find((a) => a.user_id === w.user_id) ?? null,
              }));
              return (
                <div className="bg-wo-grafito rounded-wo-card overflow-hidden" style={cardStyle}>
                  <p className="px-5 pt-4 font-jakarta text-xs text-wo-crema-muted">
                    Saldo disponible en billetera de cada afiliado — monto que puede retirar.
                  </p>
                  <div className="overflow-x-auto mt-3">
                    <table className="w-full">
                      <thead><tr style={rowBorder}>
                        {["Afiliado", "Código", "Email", "Paquete", "Saldo disponible", "Actualizado"].map((h) => (
                          <th key={h} className="text-left px-4 py-3 font-jakarta text-[11px] text-wo-crema-muted uppercase">{h}</th>
                        ))}
                      </tr></thead>
                      <tbody>
                        {walletsWithAffiliate.map((w) => (
                          <tr key={w.id} style={rowBorder} className="hover:bg-wo-carbon/30 transition-colors">
                            <td className="px-4 py-3 font-jakarta text-xs text-wo-crema">{w.aff?.name ?? "—"}</td>
                            <td className="px-4 py-3 font-jakarta text-xs text-wo-crema-muted">{w.aff?.affiliate_code ?? "—"}</td>
                            <td className="px-4 py-3 font-jakarta text-xs text-wo-crema-muted">{w.email}</td>
                            <td className="px-4 py-3">
                              <span className="font-jakarta text-[10px] font-bold px-2 py-0.5 rounded-wo-pill" style={{ background: "rgba(232,116,26,0.12)", color: "hsl(var(--wo-oro))" }}>
                                {w.aff?.package ?? "—"}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`font-syne font-bold text-sm ${w.balance > 0 ? "text-secondary" : "text-wo-crema-muted"}`}>
                                S/ {w.balance.toFixed(2)}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-jakarta text-xs text-wo-crema-muted">
                              {new Date(w.updated_at).toLocaleDateString("es-PE")}
                            </td>
                          </tr>
                        ))}
                        {allWallets.length === 0 && (
                          <tr><td colSpan={6} className="px-4 py-8 text-center font-jakarta text-sm text-wo-crema-muted">Sin registros de billetera aún</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}

            {/* ── Solicitudes de retiro ── */}
            {billeraSubTab === "retiros" && (
              <div className="bg-wo-grafito rounded-wo-card overflow-hidden" style={cardStyle}>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead><tr style={rowBorder}>
                      {["Afiliado", "Código", "Monto", "Método", "Cuenta", "Fecha", "Estado", "Acciones"].map((h) => (
                        <th key={h} className="text-left px-4 py-3 font-jakarta text-[11px] text-wo-crema-muted uppercase">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {retiros.map((w) => (
                        <tr key={w.id} style={rowBorder} className="hover:bg-wo-carbon/30 transition-colors">
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
            )}

            {/* ── Por acreditar (comisiones pendientes a liquidar) ── */}
            {billeraSubTab === "por_acreditar" && (
              <div className="bg-wo-grafito rounded-wo-card overflow-hidden" style={cardStyle}>
                <div className="px-5 pt-4 pb-2 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-jakarta text-xs text-wo-crema-muted">
                      Comisiones generadas por ventas entregadas que aún no se han acreditado en las billeteras de los afiliados.
                    </p>
                  </div>
                  {pendingCommRows.length > 0 && (
                    <button
                      onClick={() => {
                        if (confirm("¿Estás seguro de acreditar TODAS las comisiones pendientes? Esta acción moverá el saldo a las billeteras de los afiliados.")) {
                          liquidateAll.mutate();
                        }
                      }}
                      disabled={liquidateAll.isPending}
                      className="px-4 py-2 bg-secondary text-secondary-foreground font-jakarta font-bold text-[11px] rounded-wo-pill hover:brightness-110 transition-all flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {liquidateAll.isPending ? "Procesando..." : "Liquidar todas"} <ArrowRightCircle size={14} />
                    </button>
                  )}
                </div>
                <div className="overflow-x-auto mt-3">
                  <table className="w-full">
                    <thead><tr style={rowBorder}>
                      {["Afiliado", "Código", "Nivel", "Pedido", "Monto", "Fecha", "Acciones"].map((h) => (
                        <th key={h} className="text-left px-4 py-3 font-jakarta text-[11px] text-wo-crema-muted uppercase">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {pendingCommRows.map((c) => (
                        <tr key={c.id} style={rowBorder} className="hover:bg-wo-carbon/30 transition-colors">
                          <td className="px-4 py-3 font-jakarta text-xs text-wo-crema">{c.affiliate?.name ?? "—"}</td>
                          <td className="px-4 py-3 font-jakarta text-xs text-wo-crema-muted">{c.affiliate?.affiliate_code ?? "—"}</td>
                          <td className="px-4 py-3">
                            <span className="font-jakarta text-[10px] font-bold px-2 py-0.5 rounded-wo-pill bg-secondary/10 text-secondary">
                              Niv. {c.level}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-jakarta text-xs text-wo-crema-muted font-mono">{c.order_id?.slice(0, 8) ?? "—"}…</td>
                          <td className="px-4 py-3 font-syne font-bold text-sm text-destructive">S/ {c.amount.toFixed(2)}</td>
                          <td className="px-4 py-3 font-jakarta text-xs text-wo-crema-muted">{new Date(c.created_at).toLocaleDateString("es-PE")}</td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => {
                                if (confirm(`¿Acreditar S/ ${c.amount.toFixed(2)} a la billetera de ${c.affiliate?.name}?`)) {
                                  liquidateCommission.mutate(c.id);
                                }
                              }}
                              disabled={liquidateCommission.isPending}
                              className="p-2 rounded bg-secondary/10 text-secondary hover:bg-secondary/20 transition-colors disabled:opacity-50"
                              title="Acreditar saldo"
                            >
                              {liquidateCommission.isPending ? <div className="w-4 h-4 border-2 border-secondary border-t-transparent rounded-full animate-spin" /> : <CheckCircle size={14} />}
                            </button>
                          </td>
                        </tr>
                      ))}
                      {pendingCommRows.length === 0 && (
                        <tr><td colSpan={7} className="px-4 py-8 text-center font-jakarta text-sm text-wo-crema-muted">No hay comisiones pendientes de acreditar</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

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
                        <PaymentRow key={p.id} p={p} onApprove={handleApprove} onReject={handleReject} onView={handleView} isPending={approvePayment.isPending || rejectPayment.isPending} extraCols={
                          <td className="px-4 py-3">
                            <span className="font-jakarta text-[10px] font-bold px-2 py-0.5 rounded-wo-pill" style={{ background: "rgba(232,116,26,0.12)", color: "hsl(var(--wo-oro))" }}>
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
                <p className="px-4 pt-4 font-jakarta text-xs text-wo-crema-muted">Reactivaciones (Compras mensuales de S/ 300 acumulables).</p>
                <div className="overflow-x-auto mt-3">
                  <table className="w-full">
                    <thead><tr style={rowBorder}>
                      {["Afiliado", "Código", "Mes", "Monto", "Comprobante", "Fecha", "Estado", "Acciones"].map((h) => (
                        <th key={h} className="text-left px-4 py-3 font-jakarta text-[11px] text-wo-crema-muted uppercase">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {reactivaciones.map((p) => (
                        <PaymentRow key={p.id} p={p} onApprove={handleApprove} onReject={handleReject} onView={handleView} isPending={approvePayment.isPending || rejectPayment.isPending} extraCols={
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
                        <PaymentRow key={p.id} p={p} onApprove={handleApprove} onReject={handleReject} onView={handleView} isPending={approvePayment.isPending || rejectPayment.isPending} extraCols={
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
                        <PaymentRow key={p.id} p={p} onApprove={handleApprove} onReject={handleReject} onView={handleView} isPending={approvePayment.isPending || rejectPayment.isPending} extraCols={
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
                        <PaymentRow key={p.id} p={p} onApprove={handleApprove} onReject={handleReject} onView={handleView} isPending={approvePayment.isPending || rejectPayment.isPending} extraCols={
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


      {/* ========== MODAL: Detalle completo del Afiliado ========== */}
      {viewingAffiliate && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setViewingAffiliate(null)}>
          <div className="bg-wo-grafito rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col relative" style={cardStyle} onClick={(e) => e.stopPropagation()}>

            {/* Header */}
            <div className="px-6 py-4 flex items-center gap-4" style={{ borderBottom: "0.5px solid rgba(255,255,255,0.07)" }}>
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-jakarta font-bold text-sm shrink-0">
                {(viewingAffiliate.name || "Afiliado").split(" ").map((n) => n[0]).join("").substring(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-syne font-bold text-lg text-wo-crema truncate">{viewingAffiliate.name}</h3>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="font-jakarta text-[10px] font-bold px-2 py-0.5 rounded-wo-pill" style={{ background: "rgba(232,116,26,0.12)", color: "hsl(var(--wo-oro))" }}>{viewingAffiliate.package}</span>
                  <span className={`font-jakarta text-[10px] font-bold px-2 py-0.5 rounded-wo-pill ${
                    viewingAffiliate.account_status === "active"    ? "bg-secondary/12 text-secondary" :
                    viewingAffiliate.account_status === "suspended" ? "bg-destructive/12 text-destructive" :
                    "bg-primary/12 text-primary"
                  }`}>
                    {viewingAffiliate.account_status === "active" ? "● Activo" : viewingAffiliate.account_status === "suspended" ? "● Suspendido" : "⏳ Pendiente"}
                  </span>
                  <span className="font-jakarta text-[10px] text-wo-crema-muted">{viewingAffiliate.affiliate_code}</span>
                </div>
              </div>
              {/* Cambiar estado rápido */}
              <div className="flex gap-1 shrink-0">
                {(["active","suspended","pending"] as const).map((s) => (
                  <button
                    key={s}
                    disabled={viewingAffiliate.account_status === s || updateAffiliateStatus.isPending}
                    onClick={() => handleStatusChange(viewingAffiliate.id, s)}
                    className={`font-jakarta text-[9px] font-bold px-2 py-1 rounded transition-colors disabled:opacity-40 ${
                      s === "active"    ? "hover:bg-secondary/15 hover:text-secondary text-wo-crema-muted" :
                      s === "suspended" ? "hover:bg-destructive/15 hover:text-destructive text-wo-crema-muted" :
                      "hover:bg-primary/15 hover:text-primary text-wo-crema-muted"
                    } ${viewingAffiliate.account_status === s ? (
                      s === "active" ? "bg-secondary/15 text-secondary" :
                      s === "suspended" ? "bg-destructive/15 text-destructive" :
                      "bg-primary/15 text-primary"
                    ) : ""}`}
                  >
                    {s === "active" ? "Activo" : s === "suspended" ? "Suspender" : "Pendiente"}
                  </button>
                ))}
              </div>
              <button onClick={() => setViewingAffiliate(null)} className="text-wo-crema-muted hover:text-wo-crema text-xl leading-none ml-2">✕</button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 px-6 pt-3 pb-0" style={{ borderBottom: "0.5px solid rgba(255,255,255,0.07)" }}>
              {([
                { id: "info",  label: "Información" },
                { id: "pagos", label: `Pagos (${selectedPayments.length})` },
                { id: "red",   label: `Red de referidos (${visibleReferralTree.length})` },
              ] as const).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setAffDetailTab(t.id)}
                  className={`font-jakarta text-xs font-medium px-4 py-2.5 border-b-2 transition-colors -mb-px ${
                    affDetailTab === t.id
                      ? "border-primary text-primary"
                      : "border-transparent text-wo-crema-muted hover:text-wo-crema"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 p-6">

              {/* ── Tab: Información ── */}
              {affDetailTab === "info" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      { label: "Email",       value: viewingAffiliate.email ?? "—" },
                      { label: "DNI",         value: viewingAffiliate.dni ?? "—" },
                      { label: "Número Yape",  value: viewingAffiliate.yape_number ?? "—" },
                      { label: "Referidos",   value: viewingAffiliate.referral_count ?? 0 },
                      { label: "Ventas",      value: `S/ ${(viewingAffiliate.total_sales ?? 0).toFixed(2)}` },
                      { label: "Comisiones",  value: `S/ ${(viewingAffiliate.total_commissions ?? 0).toFixed(2)}` },
                      { label: "Patrocinador", value: viewingAffiliate.sponsor?.name ?? "Sin patrocinador" },
                      { label: "Registro",    value: new Date(viewingAffiliate.created_at).toLocaleDateString("es-PE") },
                      { label: "Últ. Activa", value: viewingAffiliate.last_reactivation_at ? new Date(viewingAffiliate.last_reactivation_at).toLocaleDateString("es-PE") : "—" },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-wo-carbon rounded-xl p-3" style={{ border: "0.5px solid rgba(255,255,255,0.07)" }}>
                        <p className="font-jakarta text-[10px] text-wo-crema-muted uppercase mb-1">{label}</p>
                        <p className="font-jakarta text-sm font-bold text-wo-crema truncate" title={String(value)}>{value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => { setViewingAffiliate(null); openEditAffiliate(viewingAffiliate); }}
                      className="flex-1 flex items-center justify-center gap-1.5 font-jakarta font-bold text-sm py-2.5 rounded-xl transition-colors"
                      style={{ background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.1)", color: "hsl(var(--wo-crema))" }}
                    >
                      <Edit2 size={13} /> Editar datos
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(viewingAffiliate.id)}
                      className="flex items-center justify-center gap-1.5 font-jakarta font-bold text-sm px-5 py-2.5 rounded-xl transition-colors"
                      style={{ background: "rgba(231,76,60,0.1)", color: "rgb(231,76,60)", border: "0.5px solid rgba(231,76,60,0.3)" }}
                    >
                      <Trash2 size={13} /> Eliminar
                    </button>
                  </div>
                </div>
              )}

              {/* ── Tab: Pagos ── */}
              {affDetailTab === "pagos" && (
                <div className="space-y-3">
                  {selectedPayments.length === 0 ? (
                    <div className="py-12 text-center">
                      <p className="font-jakarta text-sm text-wo-crema-muted">Sin comprobantes registrados</p>
                    </div>
                  ) : selectedPayments.map((pago) => (
                    <div key={pago.id} className="bg-wo-carbon rounded-xl p-4 flex items-start gap-4" style={{ border: "0.5px solid rgba(255,255,255,0.07)" }}>
                      {/* Miniatura boucher */}
                      <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 flex items-center justify-center bg-wo-grafito">
                        {pago.receipt_url ? (
                          <img src={pago.receipt_url} alt="boucher" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display="none"; }} />
                        ) : (
                          <span className="text-2xl opacity-30">📷</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-jakarta text-xs font-bold text-wo-crema">
                            {{ activacion: "Activación", upgrade: "Upgrade", retiro: "Retiro", reactivacion: "Reactivación", recarga_billetera: "Recarga" }[pago.type] ?? pago.type}
                          </span>
                          <span className={`font-jakarta text-[10px] font-bold px-2 py-0.5 rounded-wo-pill ${statusBadge(pago.status)}`}>
                            {pago.status.charAt(0).toUpperCase() + pago.status.slice(1)}
                          </span>
                        </div>
                        <p className="font-syne font-bold text-base text-primary">S/ {pago.amount.toFixed(2)}</p>
                        <p className="font-jakarta text-[10px] text-wo-crema-muted mt-0.5">{new Date(pago.created_at).toLocaleString("es-PE")}</p>
                        {/* Acciones inline */}
                        {pago.status === "pendiente" && (
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => handleApprove({ ...pago, affiliate: { name: viewingAffiliate.name, affiliate_code: viewingAffiliate.affiliate_code } } as any)}
                              disabled={approvePayment.isPending}
                              className="flex items-center gap-1 font-jakarta text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors"
                              style={{ background: "rgba(30,192,213,0.12)", color: "rgb(30,192,213)", border: "0.5px solid rgba(30,192,213,0.3)" }}
                            >
                              <CheckCircle size={10} /> Aprobar
                            </button>
                            <button
                              onClick={() => handleReject({ ...pago, affiliate: { name: viewingAffiliate.name, affiliate_code: viewingAffiliate.affiliate_code } } as any)}
                              disabled={rejectPayment.isPending}
                              className="flex items-center gap-1 font-jakarta text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors"
                              style={{ background: "rgba(231,76,60,0.1)", color: "rgb(231,76,60)", border: "0.5px solid rgba(231,76,60,0.3)" }}
                            >
                              <XCircle size={10} /> Rechazar
                            </button>
                            {pago.receipt_url && (
                              <a href={pago.receipt_url} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1 font-jakarta text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors text-wo-crema-muted hover:text-primary"
                                style={{ border: "0.5px solid rgba(255,255,255,0.1)" }}
                              >
                                <Eye size={10} /> Ver boucher
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Tab: Red de referidos ── */}
              {affDetailTab === "red" && (
                <div className="space-y-2">
                  {visibleReferralTree.length === 0 ? (
                    <div className="py-12 text-center">
                      <p className="font-jakarta text-sm text-wo-crema-muted">Sin referidos en los niveles de su paquete</p>
                    </div>
                  ) : (
                    <>
                      {/* Agrupar por nivel */}
                      {Array.from(new Set(visibleReferralTree.map((r) => r.level))).map((lvl) => (
                        <div key={lvl}>
                          <div className="flex items-center gap-2 mb-2 mt-3">
                            <span className="font-jakarta text-[10px] font-bold text-primary uppercase">Nivel {lvl}</span>
                            <div className="flex-1 h-px bg-primary/20" />
                            <span className="font-jakarta text-[10px] text-wo-crema-muted">
                              {visibleReferralTree.filter((r) => r.level === lvl).length} persona(s)
                            </span>
                          </div>
                          <div className="space-y-1.5">
                            {visibleReferralTree.filter((r) => r.level === lvl).map((r) => (
                              <div key={r.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.06)" }}>
                                <div className="w-8 h-8 rounded-full bg-wo-grafito flex items-center justify-center font-jakarta text-[10px] font-bold text-primary shrink-0">
                                  {(r.referred?.name || "?").split(" ").map((n) => n[0]).join("").substring(0, 2)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-jakarta text-xs font-bold text-wo-crema truncate">{r.referred?.name ?? "—"}</p>
                                  <p className="font-jakarta text-[10px] text-wo-crema-muted">{r.referred?.affiliate_code ?? "—"} · {r.referred?.package ?? "—"}</p>
                                </div>
                                <span className={`font-jakarta text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                                  r.referred?.account_status === "active"    ? "bg-secondary/15 text-secondary" :
                                  r.referred?.account_status === "suspended" ? "bg-destructive/15 text-destructive" :
                                  "bg-primary/15 text-primary"
                                }`}>
                                  {r.referred?.account_status ?? "—"}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========== MODAL: Confirmar borrado ========== */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-wo-grafito rounded-2xl max-w-sm w-full p-6" style={cardStyle}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-destructive/15 flex items-center justify-center">
                <Trash2 size={16} className="text-destructive" />
              </div>
              <div>
                <h3 className="font-syne font-bold text-base text-wo-crema">Eliminar afiliado</h3>
                <p className="font-jakarta text-xs text-wo-crema-muted mt-0.5">Esta acción no se puede deshacer</p>
              </div>
            </div>
            <p className="font-jakarta text-sm text-wo-crema-muted mb-6">
              Se eliminarán también todos sus referidos, pagos y vínculos de red.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDeleteAffiliate(confirmDeleteId)}
                disabled={deleteAffiliate.isPending}
                className="flex-1 font-jakarta font-bold text-sm py-3 rounded-xl transition-colors disabled:opacity-60"
                style={{ background: "rgba(231,76,60,0.15)", color: "rgb(231,76,60)", border: "0.5px solid rgba(231,76,60,0.4)" }}
              >
                {deleteAffiliate.isPending ? "Eliminando..." : "Sí, eliminar"}
              </button>
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 font-jakarta font-bold text-sm py-3 rounded-xl transition-colors"
                style={{ background: "rgba(255,255,255,0.05)", color: "hsl(var(--wo-crema))", border: "0.5px solid rgba(255,255,255,0.1)" }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== MODAL: Configuración ========== */}
      {openSettings && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => {
          if (hasSettingsChanges && !confirm("Tienes cambios sin guardar en los métodos de pago. ¿Cerrar de todas formas?")) return;
          setOpenSettings(false);
        }}>
          <div className="bg-wo-grafito rounded-2xl max-w-3xl w-full p-6 relative max-h-[90vh] overflow-y-auto" style={cardStyle} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => {
              if (hasSettingsChanges && !confirm("Tienes cambios sin guardar. ¿Cerrar de todas formas?")) return;
              setOpenSettings(false);
            }} className="absolute top-4 right-4 text-wo-crema-muted hover:text-wo-crema text-lg">✕</button>
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
                    {["Nivel", "Comisión", "Básico (1–3)", "Ejecutivo (1–5)", "Intermedio (1–7)", "VIP (1–10)"].map((h) => (
                      <th key={h} className="text-left px-3 py-2 font-jakarta text-[10px] text-wo-crema-muted uppercase">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {[
                      { level: 1,  pct: "10%",   basico: true,  ejecu: true,  inter: true,  vip: true },
                      { level: 2,  pct: "4%",    basico: true,  ejecu: true,  inter: true,  vip: true },
                      { level: 3,  pct: "2%",    basico: true,  ejecu: true,  inter: true,  vip: true },
                      { level: 4,  pct: "2%",    basico: false, ejecu: true,  inter: true,  vip: true },
                      { level: 5,  pct: "1%",    basico: false, ejecu: true,  inter: true,  vip: true },
                      { level: 6,  pct: "1%",    basico: false, ejecu: false, inter: true,  vip: true },
                      { level: 7,  pct: "1%",    basico: false, ejecu: false, inter: true,  vip: true },
                      { level: 8,  pct: "3% ★",  basico: false, ejecu: false, inter: false, vip: true },
                      { level: 9,  pct: "0.5%",  basico: false, ejecu: false, inter: false, vip: true },
                      { level: 10, pct: "0.5%",  basico: false, ejecu: false, inter: false, vip: true },
                    ].map((row) => (
                      <tr key={row.level} style={rowBorder}>
                        <td className="px-3 py-2 font-jakarta text-xs text-wo-crema-muted">Nivel {row.level}</td>
                        <td className="px-3 py-2 font-syne font-bold text-sm text-primary">{row.pct}</td>
                        <td className="px-3 py-2 font-jakarta text-xs">{row.basico ? <span className="text-secondary">✓</span> : <span className="text-wo-crema/20">breakage</span>}</td>
                        <td className="px-3 py-2 font-jakarta text-xs">{row.ejecu ? <span className="text-secondary">✓</span> : <span className="text-wo-crema/20">breakage</span>}</td>
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
                    "Básico: activación S/ 120 · niveles 1 al 3",
                    "Ejecutivo: activación S/ 600 · niveles 1 al 5",
                    "Intermedio: activación S/ 2,000 · niveles 1 al 7",
                    "VIP / Élite: activación S/ 10,000 · niveles 1 al 10",
                    "Reactivación mensual: Compras acumuladas S/ 300 desde el mes 2",
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
                  { label: "Nombre del titular", value: settingsHolder, setter: setSettingsHolder, placeholder: "Juan Pérez / Winclick SAC" },
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
                      onChange={(e) => { field.setter(e.target.value); setSettingsSaved(false); }}
                      placeholder={field.placeholder}
                      className="w-full bg-wo-grafito text-wo-crema font-jakarta text-sm px-3 py-2 rounded-xl outline-none focus:ring-1 focus:ring-primary"
                      style={{ border: "0.5px solid rgba(255,255,255,0.1)" }}
                    />
                  </div>
                ))}
                
                <div className="sm:col-span-2 mt-2">
                  <label className="font-jakarta text-[11px] text-wo-crema-muted mb-2 block">
                    Código QR de cobro (Yape / Plin / cualquier billetera)
                  </label>
                  <div className="flex items-start gap-4">
                    {settingsQrUrl ? (
                      <div className="relative shrink-0">
                        <img src={settingsQrUrl} alt="QR pago" className="w-28 h-28 rounded-xl object-contain bg-white p-1.5" style={{ border: "0.5px solid rgba(255,255,255,0.1)" }} />
                        <button
                          type="button"
                          onClick={() => { setSettingsQrUrl(""); setSettingsQrFile(null); setSettingsSaved(false); }}
                          className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center text-[10px] font-bold hover:bg-destructive/80"
                          title="Quitar QR"
                        >✕</button>
                      </div>
                    ) : (
                      <div className="w-28 h-28 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.12)" }}>
                        <span className="font-jakarta text-[10px] text-wo-crema/30 text-center px-2">Sin QR</span>
                      </div>
                    )}
                    <div className="flex-1 space-y-2">
                      <p className="font-jakarta text-xs text-wo-crema-muted leading-relaxed">
                        Sube la imagen QR de tu cuenta Yape, Plin o cualquier billetera digital. Se mostrará automáticamente a los clientes en el checkout y en la billetera de afiliados.
                      </p>
                      <label className="inline-flex items-center gap-2 bg-wo-grafito text-wo-crema font-jakarta font-semibold text-xs px-4 py-2 rounded-wo-btn hover:bg-wo-carbon cursor-pointer transition-colors" style={{ border: "0.5px solid rgba(255,255,255,0.1)" }}>
                        {settingsQrUrl ? "Cambiar QR" : "Subir QR"}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) {
                              setSettingsQrFile(f);
                              setSettingsQrUrl(URL.createObjectURL(f));
                              setSettingsSaved(false);
                            }
                          }}
                        />
                      </label>
                      {settingsQrFile && (
                        <p className="font-jakarta text-[10px] text-secondary">✓ Nueva imagen seleccionada — guarda para aplicar</p>
                      )}
                    </div>
                  </div>
                </div>

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

            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-between items-center border-t border-white/5 pt-6">
              <button 
                onClick={() => { 
                  if (hasSettingsChanges && !confirm("Tienes cambios sin guardar en los métodos de pago. ¿Deseas salir a revisar pagos sin guardar?")) return;
                  setActiveTab("pagos"); 
                  setOpenSettings(false); 
                }} 
                className="flex items-center gap-2 text-wo-crema-muted hover:text-primary font-jakarta text-[11px] font-bold transition-colors group"
              >
                <div className="w-8 h-8 rounded-full bg-wo-carbon flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <CreditCard size={14} className="group-hover:text-primary" />
                </div>
                Ir a revisar pagos recibidos
              </button>
              
              <button 
                onClick={() => {
                  if (hasSettingsChanges && !confirm("Tienes cambios sin guardar. ¿Cerrar de todas formas?")) return;
                  setOpenSettings(false);
                }} 
                className="w-full sm:w-auto bg-wo-carbon text-wo-crema-muted font-jakarta font-bold text-xs px-8 py-2.5 rounded-xl hover:text-wo-crema transition-colors" 
                style={cardStyle}
              >
                Cerrar configuración
              </button>
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
                  <option value="Ejecutivo">Ejecutivo</option>
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
              <div>
                <p className="font-jakarta text-[10px] text-wo-crema-muted uppercase">Cliente</p>
                <p className="font-jakarta text-sm text-wo-crema">{viewingOrder.customer_name}</p>
                {viewingOrder.customer_phone && (
                  <a
                    href={`https://wa.me/${viewingOrder.customer_phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hola ${viewingOrder.customer_name}, te contactamos por tu pedido ${viewingOrder.order_number} de S/ ${viewingOrder.total.toFixed(2)}.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-1.5 font-jakarta font-bold text-[11px] px-2.5 py-1 rounded-wo-pill transition-colors hover:brightness-110"
                    style={{ background: "rgba(37,211,102,0.12)", color: "rgb(37,211,102)", border: "0.5px solid rgba(37,211,102,0.3)" }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    {viewingOrder.customer_phone}
                  </a>
                )}
              </div>
              <div><p className="font-jakarta text-[10px] text-wo-crema-muted uppercase">Email</p><p className="font-jakarta text-sm text-wo-crema">{viewingOrder.customer_email ?? "—"}</p></div>
              <div><p className="font-jakarta text-[10px] text-wo-crema-muted uppercase">Método</p><p className="font-jakarta text-sm text-wo-crema">{viewingOrder.payment_method === "wallet" ? "Billetera" : "Efectivo"}</p></div>
              <div><p className="font-jakarta text-[10px] text-wo-crema-muted uppercase">Estado</p><p className="font-jakarta text-sm text-primary">{viewingOrder.status}</p></div>
              {viewingOrder.shipping_address && (
                <div className="col-span-2">
                  <p className="font-jakarta text-[10px] text-wo-crema-muted uppercase">Dirección de envío</p>
                  <p className="font-jakarta text-sm text-wo-crema">{viewingOrder.shipping_address} {viewingOrder.shipping_city ? `(${viewingOrder.shipping_city})` : ""}</p>
                </div>
              )}
              {viewingOrder.shipping_voucher_url && (
                <div className="col-span-2">
                  <p className="font-jakarta text-[10px] text-wo-crema-muted uppercase mb-1">Comprobante</p>
                  <a href={viewingOrder.shipping_voucher_url} target="_blank" rel="noreferrer" className="text-secondary text-sm hover:underline font-jakarta font-medium flex items-center gap-1.5 bg-secondary/10 w-fit px-3 py-1.5 rounded-lg">
                    <span>Ver Imagen / PDF</span>
                  </a>
                </div>
              )}
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

            {/* ── Acciones de Logística y Estado ── */}
            <div className="mt-5 pt-4" style={{ borderTop: "0.5px solid rgba(255,255,255,0.07)" }}>
              <p className="font-jakarta text-[10px] text-wo-crema-muted uppercase mb-3">Gestión Logística</p>
              
              <div className="flex flex-col gap-3">
                {/* Botones de Tracking y Comunicación */}
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => { setTrackingModal(viewingOrder); setTrackingVal(viewingOrder.tracking_number || ""); }} 
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-wo-carbon text-wo-crema hover:bg-white/5 transition-colors font-jakarta text-xs font-bold border border-white/5"
                  >
                    <Edit2 size={12} /> {viewingOrder.tracking_number ? `Tracking: ${viewingOrder.tracking_number}` : "Asignar Tracking"}
                  </button>
                  
                  {viewingOrder.shipping_address && (
                    <button 
                      onClick={() => { navigator.clipboard.writeText(viewingOrder.shipping_address!); toast({ title: "✓ Dirección copiada" }); }}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-wo-carbon text-wo-crema hover:bg-white/5 transition-colors font-jakarta text-xs font-bold border border-white/5"
                    >
                      <Copy size={12} /> Copiar Dirección
                    </button>
                  )}

                  {viewingOrder.customer_phone && viewingOrder.status === "enviado" && (
                    <a 
                      href={`https://wa.me/${viewingOrder.customer_phone?.replace(/\D/g, "")}?text=${encodeURIComponent(`Hola ${(viewingOrder.customer_name || "Cliente").split(" ")[0]}, te saluda WinClick. Tu pedido ${viewingOrder.order_number} ya está en camino. Tracking: ${viewingOrder.tracking_number}`)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#25D366] text-white hover:brightness-110 transition-all font-jakarta text-xs font-bold"
                    >
                      <MessageCircle size={12} /> Avisar Envío
                    </a>
                  )}
                </div>

                {/* Selector de Cambio de Estado */}
                <div className="flex items-center gap-3 mt-3 p-3 bg-wo-carbon/50 rounded-xl border border-white/5">
                  <p className="font-jakarta text-xs text-wo-crema-muted font-bold">Estado actual:</p>
                  <select
                    value={viewingOrder.status}
                    onChange={async (e) => {
                      const s = e.target.value as any;
                      await updateOrderStatus.mutateAsync({ orderId: viewingOrder.id, status: s });
                      setViewingOrder({ ...viewingOrder, status: s });
                    }}
                    disabled={updateOrderStatus.isPending}
                    className={`font-jakarta text-xs font-bold px-3 py-1.5 rounded-lg outline-none cursor-pointer transition-colors ${
                      viewingOrder.status === "entregado" ? "bg-secondary/15 text-secondary" :
                      viewingOrder.status === "cancelado" ? "bg-destructive/15 text-destructive" :
                      "bg-primary/15 text-primary"
                    }`}
                  >
                    <option value="pendiente" className="bg-wo-grafito text-wo-crema">Pendiente</option>
                    <option value="procesando" className="bg-wo-grafito text-wo-crema">Procesando</option>
                    <option value="enviado" className="bg-wo-grafito text-wo-crema">Enviado</option>
                    <option value="entregado" className="bg-wo-grafito text-wo-crema">Entregado</option>
                    <option value="cancelado" className="bg-wo-grafito text-wo-crema">Cancelado</option>
                  </select>
                  {updateOrderStatus.isPending && <span className="font-jakarta text-[10px] text-wo-crema-muted animate-pulse">Guardando...</span>}
                </div>
              </div>

              {viewingOrder.status === "entregado" && (
                <p className="font-jakarta text-[11px] text-secondary mt-3 flex items-center gap-1.5 p-2 bg-secondary/10 rounded-lg">
                  <CheckCircle size={12} /> Pedido aprobado — el sistema procesó la activación/reactivación del afiliado automáticamente.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========== MODAL: Ver/Editar Producto ========== */}
      {viewingProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setViewingProduct(null)}>
          <div className="bg-wo-grafito w-full sm:max-w-xl sm:rounded-2xl rounded-t-2xl relative flex flex-col max-h-[92vh]" style={cardStyle} onClick={(e) => e.stopPropagation()}>
            {/* Header fijo */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 flex-shrink-0" style={{ borderBottom: "0.5px solid rgba(255,255,255,0.07)" }}>
              <div>
                <h3 className="font-syne font-bold text-base text-wo-crema leading-tight">{prodName}</h3>
                <p className={`font-jakarta text-[10px] font-bold mt-0.5 ${prodIsActive ? "text-secondary" : "text-destructive"}`}>{prodIsActive ? "● Activo" : "● Inactivo"}</p>
              </div>
              <button onClick={() => setViewingProduct(null)} className="p-2 text-wo-crema-muted hover:text-wo-crema rounded-lg hover:bg-wo-carbon transition-colors">✕</button>
            </div>
            {/* Cuerpo con scroll */}
            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
              <div>
                <label className="font-jakarta text-xs text-wo-crema-muted mb-1 block">Nombre</label>
                <input value={prodName} onChange={(e) => setProdName(e.target.value)} className="w-full bg-wo-carbon text-wo-crema font-jakarta text-sm px-3 py-2.5 rounded-xl outline-none focus:ring-1 focus:ring-primary" style={{ border: "0.5px solid rgba(255,255,255,0.1)" }} />
              </div>
              {/* ── Precios ── */}
              <div className="space-y-3">
                {/* Precio Cliente — fuente de verdad */}
                <div>
                  <label className="font-jakarta text-xs text-wo-crema-muted mb-1 block">Precio Cliente (S/) <span className="text-primary font-bold">*</span></label>
                  <input
                    value={prodPublicPrice}
                    onChange={(e) => {
                      const v = e.target.value;
                      setProdPublicPrice(v);
                      const num = parseFloat(v) || 0;
                      if (num > 0) setProdPartnerPrice((num * 0.50).toFixed(2));
                      else setProdPartnerPrice("");
                    }}
                    type="number" step="0.01" placeholder="0.00"
                    className="w-full bg-wo-carbon text-wo-crema font-jakarta text-sm px-3 py-2.5 rounded-xl outline-none focus:ring-1 focus:ring-primary"
                    style={{ border: "0.5px solid rgba(232,116,26,0.35)" }}
                  />
                  <p className="font-jakarta text-[10px] text-wo-crema/40 mt-1">Precio visible en catálogo público. Todos los demás precios se calculan automáticamente.</p>
                </div>
                {/* Precio Socio — auto calculado, editable */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-jakarta text-xs text-wo-crema-muted">Precio Socio / Recompra (S/)</label>
                    <span className="font-jakarta text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(30,192,213,0.12)", color: "hsl(var(--secondary))", border: "0.5px solid rgba(30,192,213,0.25)" }}>
                      Auto · 50% dto
                    </span>
                  </div>
                  <input
                    value={prodPartnerPrice}
                    onChange={(e) => setProdPartnerPrice(e.target.value)}
                    type="number" step="0.01" placeholder="0.00"
                    className="w-full bg-wo-carbon text-wo-crema font-jakarta text-sm px-3 py-2.5 rounded-xl outline-none focus:ring-1 focus:ring-secondary"
                    style={{ border: "0.5px solid rgba(30,192,213,0.25)" }}
                  />
                  <p className="font-jakarta text-[10px] text-wo-crema/40 mt-1">Precio de recompra para todos los afiliados. Puedes ajustarlo manualmente.</p>
                </div>
                {/* Vista previa de todos los niveles */}
                {parseFloat(prodPublicPrice) > 0 && (() => {
                  const base = parseFloat(prodPublicPrice);
                  return (
                    <div className="rounded-xl p-3" style={{ background: "rgba(30,192,213,0.04)", border: "0.5px solid rgba(30,192,213,0.15)" }}>
                      <p className="font-jakarta text-[10px] text-wo-crema-muted uppercase tracking-widest mb-2.5">Vista previa · precios por membresía</p>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        {[
                          { label: "Público", pct: 1.00, color: "rgba(248,244,236,0.6)" },
                          { label: "Básico", pct: 0.60, color: "hsl(var(--primary))" },
                          { label: "Ejecutivo+", pct: 0.50, color: "hsl(var(--secondary))" },
                        ].map((t) => (
                          <div key={t.label}>
                            <p className="font-jakarta text-[10px] text-wo-crema-muted mb-0.5">{t.label}</p>
                            <p className="font-syne font-bold text-sm" style={{ color: t.color }}>S/ {(base * t.pct).toFixed(2)}</p>
                            {t.pct < 1 && <p className="font-jakarta text-[9px] text-wo-crema-muted/60">{Math.round((1 - t.pct) * 100)}% dto</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
              <div>
                  <label className="font-jakarta text-xs text-wo-crema-muted mb-1 block">Stock</label>
                  <input value={prodStock} onChange={(e) => setProdStock(e.target.value)} type="number" className="w-full bg-wo-carbon text-wo-crema font-jakarta text-sm px-3 py-2.5 rounded-xl outline-none focus:ring-1 focus:ring-primary" style={{ border: "0.5px solid rgba(255,255,255,0.1)" }} />
              </div>
              <ProductImageUploader
                mainUrl={prodImg}
                mainAlt={prodImgAlt}
                onMainChange={(url, alt) => { setProdImg(url); setProdImgAlt(alt); }}
                gallery={prodGallery}
                onGalleryChange={setProdGallery}
              />
              <div>
                <label className="font-jakarta text-xs text-wo-crema-muted mb-1 block">Categoría</label>
                <select
                  value={prodCategoryId ?? ""}
                  onChange={(e) => setProdCategoryId(e.target.value || null)}
                  className="w-full bg-wo-carbon text-wo-crema font-jakarta text-sm px-3 py-2.5 rounded-xl outline-none focus:ring-1 focus:ring-primary"
                  style={{ border: "0.5px solid rgba(255,255,255,0.1)" }}
                >
                  <option value="">Sin categoría</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-jakarta text-xs text-wo-crema-muted mb-1 block">Descripción</label>
                <textarea value={prodDesc} onChange={(e) => setProdDesc(e.target.value)} rows={3} className="w-full bg-wo-carbon text-wo-crema font-jakarta text-sm px-3 py-2.5 rounded-xl outline-none focus:ring-1 focus:ring-primary resize-none" style={{ border: "0.5px solid rgba(255,255,255,0.1)" }} />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="prodIsActive" checked={prodIsActive} onChange={(e) => setProdIsActive(e.target.checked)} className="rounded" />
                <label htmlFor="prodIsActive" className="font-jakarta text-xs text-wo-crema-muted cursor-pointer">Producto activo (visible en catálogo)</label>
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setNewProductModal(false)}>
          <div className="bg-wo-grafito w-full sm:max-w-xl sm:rounded-2xl rounded-t-2xl relative flex flex-col max-h-[92vh]" style={cardStyle} onClick={(e) => e.stopPropagation()}>
            {/* Header fijo */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 flex-shrink-0" style={{ borderBottom: "0.5px solid rgba(255,255,255,0.07)" }}>
              <div>
                <h3 className="font-syne font-bold text-base text-wo-crema leading-tight">Nuevo Producto</h3>
                <p className="font-jakarta text-[10px] text-wo-crema/40 mt-0.5">Completa los datos para crear el producto</p>
              </div>
              <button onClick={() => setNewProductModal(false)} className="p-2 text-wo-crema-muted hover:text-wo-crema rounded-lg hover:bg-wo-carbon transition-colors">✕</button>
            </div>
            {/* Cuerpo con scroll */}
            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
              <div>
                <label className="font-jakarta text-xs text-wo-crema-muted mb-1 block">Nombre</label>
                <input value={newProdName} onChange={(e) => setNewProdName(e.target.value)} placeholder="Ej: Clorófila Líquida" className="w-full bg-wo-carbon text-wo-crema font-jakarta text-sm px-3 py-2.5 rounded-xl outline-none focus:ring-1 focus:ring-primary" style={{ border: "0.5px solid rgba(255,255,255,0.1)" }} />
              </div>
              {/* ── Precios ── */}
              <div className="space-y-3">
                {/* Precio Cliente — fuente de verdad */}
                <div>
                  <label className="font-jakarta text-xs text-wo-crema-muted mb-1 block">Precio Cliente (S/) <span className="text-primary font-bold">*</span></label>
                  <input
                    value={newProdPublicPrice}
                    onChange={(e) => {
                      const v = e.target.value;
                      setNewProdPublicPrice(v);
                      const num = parseFloat(v) || 0;
                      if (num > 0) setNewProdPartnerPrice((num * 0.50).toFixed(2));
                      else setNewProdPartnerPrice("");
                    }}
                    type="number" step="0.01" placeholder="0.00"
                    className="w-full bg-wo-carbon text-wo-crema font-jakarta text-sm px-3 py-2.5 rounded-xl outline-none focus:ring-1 focus:ring-primary"
                    style={{ border: "0.5px solid rgba(232,116,26,0.35)" }}
                  />
                  <p className="font-jakarta text-[10px] text-wo-crema/40 mt-1">Precio visible en catálogo público. Todos los demás precios se calculan automáticamente.</p>
                </div>
                {/* Precio Socio — auto calculado, editable */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-jakarta text-xs text-wo-crema-muted">Precio Socio / Recompra (S/)</label>
                    <span className="font-jakarta text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(30,192,213,0.12)", color: "hsl(var(--secondary))", border: "0.5px solid rgba(30,192,213,0.25)" }}>
                      Auto · 50% dto
                    </span>
                  </div>
                  <input
                    value={newProdPartnerPrice}
                    onChange={(e) => setNewProdPartnerPrice(e.target.value)}
                    type="number" step="0.01" placeholder="0.00"
                    className="w-full bg-wo-carbon text-wo-crema font-jakarta text-sm px-3 py-2.5 rounded-xl outline-none focus:ring-1 focus:ring-secondary"
                    style={{ border: "0.5px solid rgba(30,192,213,0.25)" }}
                  />
                  <p className="font-jakarta text-[10px] text-wo-crema/40 mt-1">Precio de recompra para todos los afiliados. Puedes ajustarlo manualmente.</p>
                </div>
                {/* Vista previa de todos los niveles */}
                {parseFloat(newProdPublicPrice) > 0 && (() => {
                  const base = parseFloat(newProdPublicPrice);
                  return (
                    <div className="rounded-xl p-3" style={{ background: "rgba(30,192,213,0.04)", border: "0.5px solid rgba(30,192,213,0.15)" }}>
                      <p className="font-jakarta text-[10px] text-wo-crema-muted uppercase tracking-widest mb-2.5">Vista previa · precios por membresía</p>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        {[
                          { label: "Público", pct: 1.00, color: "rgba(248,244,236,0.6)" },
                          { label: "Básico", pct: 0.60, color: "hsl(var(--primary))" },
                          { label: "Ejecutivo+", pct: 0.50, color: "hsl(var(--secondary))" },
                        ].map((t) => (
                          <div key={t.label}>
                            <p className="font-jakarta text-[10px] text-wo-crema-muted mb-0.5">{t.label}</p>
                            <p className="font-syne font-bold text-sm" style={{ color: t.color }}>S/ {(base * t.pct).toFixed(2)}</p>
                            {t.pct < 1 && <p className="font-jakarta text-[9px] text-wo-crema-muted/60">{Math.round((1 - t.pct) * 100)}% dto</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
              <div>
                <label className="font-jakarta text-xs text-wo-crema-muted mb-1 block">Stock</label>
                <input value={newProdStock} onChange={(e) => setNewProdStock(e.target.value)} type="number" placeholder="0" className="w-full bg-wo-carbon text-wo-crema font-jakarta text-sm px-3 py-2.5 rounded-xl outline-none focus:ring-1 focus:ring-primary" style={{ border: "0.5px solid rgba(255,255,255,0.1)" }} />
              </div>
              <ProductImageUploader
                mainUrl={newProdImg}
                mainAlt={newProdImgAlt}
                onMainChange={(url, alt) => { setNewProdImg(url); setNewProdImgAlt(alt); }}
                gallery={newProdGallery}
                onGalleryChange={setNewProdGallery}
              />
              <div>
                <label className="font-jakarta text-xs text-wo-crema-muted mb-1 block">Categoría</label>
                <select
                  value={newProdCategoryId ?? ""}
                  onChange={(e) => setNewProdCategoryId(e.target.value || null)}
                  className="w-full bg-wo-carbon text-wo-crema font-jakarta text-sm px-3 py-2.5 rounded-xl outline-none focus:ring-1 focus:ring-primary"
                  style={{ border: "0.5px solid rgba(255,255,255,0.1)" }}
                >
                  <option value="">Sin categoría</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-jakarta text-xs text-wo-crema-muted mb-1 block">Descripción</label>
                <textarea value={newProdDesc} onChange={(e) => setNewProdDesc(e.target.value)} rows={3} placeholder="Descripción del producto..." className="w-full bg-wo-carbon text-wo-crema font-jakarta text-sm px-3 py-2.5 rounded-xl outline-none focus:ring-1 focus:ring-primary resize-none" style={{ border: "0.5px solid rgba(255,255,255,0.1)" }} />
              </div>
              <div className="flex gap-3 pt-2 pb-2">
                <button onClick={handleCreateProduct} disabled={createProduct.isPending || !newProdName} className="flex-1 bg-primary text-primary-foreground font-jakarta font-bold text-sm py-2.5 rounded-xl hover:bg-wo-oro-dark disabled:opacity-50">
                  {createProduct.isPending ? "Creando..." : "Crear producto"}
                </button>
                <button onClick={() => setNewProductModal(false)} className="px-4 font-jakarta text-sm text-wo-crema-muted hover:text-wo-crema py-2.5 rounded-xl bg-wo-carbon" style={{ border: "0.5px solid rgba(255,255,255,0.1)" }}>Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========== MODAL: Crear / Editar Categoría ========== */}
      {catModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setCatModal(false)}>
          <div className="bg-wo-grafito rounded-2xl max-w-sm w-full p-6 relative" style={cardStyle} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setCatModal(false)} className="absolute top-4 right-4 text-wo-crema-muted hover:text-wo-crema text-lg">✕</button>
            <h3 className="font-syne font-bold text-lg text-wo-crema mb-6">{editingCat ? "Editar Categoría" : "Nueva Categoría"}</h3>
            <div className="space-y-4">
              <div>
                <label className="font-jakarta text-xs text-wo-crema-muted mb-1 block">Nombre</label>
                <input
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="Ej: Vitaminas"
                  className="w-full bg-wo-carbon text-wo-crema font-jakarta text-sm px-3 py-2.5 rounded-xl outline-none focus:ring-1 focus:ring-primary"
                  style={{ border: "0.5px solid rgba(255,255,255,0.1)" }}
                />
              </div>
              <div>
                <label className="font-jakarta text-xs text-wo-crema-muted mb-1 block">Color (usado en etiquetas y filtros)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={catColor}
                    onChange={(e) => setCatColor(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                  />
                  <span className="font-jakarta text-sm text-wo-crema-muted">{catColor}</span>
                  <span
                    className="font-jakarta text-xs font-bold px-3 py-1 rounded-wo-pill"
                    style={{ background: catColor + "22", color: catColor, border: `0.5px solid ${catColor}44` }}
                  >
                    {catName || "Vista previa"}
                  </span>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSaveCategory}
                  disabled={createCategory.isPending || updateCategory.isPending || !catName.trim()}
                  className="flex-1 bg-primary text-primary-foreground font-jakarta font-bold text-sm py-2.5 rounded-xl hover:bg-wo-oro-dark disabled:opacity-50"
                >
                  {(createCategory.isPending || updateCategory.isPending) ? "Guardando..." : editingCat ? "Guardar cambios" : "Crear categoría"}
                </button>
                <button onClick={() => setCatModal(false)} className="px-4 font-jakarta text-sm text-wo-crema-muted hover:text-wo-crema py-2.5 rounded-xl bg-wo-carbon" style={{ border: "0.5px solid rgba(255,255,255,0.1)" }}>Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========== MODAL: Confirmar eliminar producto ========== */}
      {confirmDeleteProductId && (() => {
        const prod = products.find((p) => p.id === confirmDeleteProductId);
        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setConfirmDeleteProductId(null)}>
            <div className="bg-wo-grafito rounded-2xl max-w-sm w-full p-6 relative" style={{ border: "0.5px solid rgba(239,68,68,0.3)" }} onClick={(e) => e.stopPropagation()}>
              <h3 className="font-syne font-bold text-lg text-wo-crema mb-2">¿Eliminar producto?</h3>
              <p className="font-jakarta text-sm text-wo-crema-muted mb-1">
                Vas a eliminar <span className="text-wo-crema font-semibold">"{prod?.name}"</span>.
              </p>
              <p className="font-jakarta text-xs text-destructive/80 mb-5">Esta acción no se puede deshacer.</p>
              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    try {
                      const result = await deleteProduct.mutateAsync(confirmDeleteProductId);
                      setConfirmDeleteProductId(null);
                      if ((result as any)?.deactivated) {
                        toast({ title: "Producto desactivado", description: "Tiene pedidos asociados, así que fue desactivado en lugar de eliminado." });
                      } else {
                        toast({ title: "Producto eliminado" });
                      }
                    } catch (err) {
                      toast({ title: "Error al eliminar", description: err instanceof Error ? err.message : "Intenta nuevamente.", variant: "destructive" });
                    }
                  }}
                  disabled={deleteProduct.isPending}
                  className="flex-1 bg-destructive text-white font-jakarta font-bold text-sm py-2.5 rounded-xl hover:bg-destructive/80 disabled:opacity-50"
                >
                  {deleteProduct.isPending ? "Eliminando..." : "Sí, eliminar"}
                </button>
                <button onClick={() => setConfirmDeleteProductId(null)} className="px-4 font-jakarta text-sm text-wo-crema-muted hover:text-wo-crema py-2.5 rounded-xl bg-wo-carbon" style={{ border: "0.5px solid rgba(255,255,255,0.1)" }}>Cancelar</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========== MODAL: Confirmar eliminar categoría ========== */}
      {confirmDeleteCatId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setConfirmDeleteCatId(null)}>
          <div className="bg-wo-grafito rounded-2xl max-w-sm w-full p-6 relative" style={cardStyle} onClick={(e) => e.stopPropagation()}>
            <h3 className="font-syne font-bold text-lg text-wo-crema mb-2">¿Eliminar categoría?</h3>
            {(() => {
              const cat = categories.find((c) => c.id === confirmDeleteCatId);
              const count = products.filter((p) => p.category_id === confirmDeleteCatId).length;
              return (
                <div className="space-y-4">
                  <p className="font-jakarta text-sm text-wo-crema-muted">
                    Vas a eliminar <span className="text-wo-crema font-bold">"{cat?.name}"</span>.
                    {count > 0 && (
                      <span className="text-primary"> Los {count} producto(s) asignados quedarán sin categoría.</span>
                    )}
                  </p>
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => handleDeleteCategory(confirmDeleteCatId)}
                      disabled={deleteCategory.isPending}
                      className="flex-1 bg-destructive text-white font-jakarta font-bold text-sm py-2.5 rounded-xl hover:bg-destructive/80 disabled:opacity-50"
                    >
                      {deleteCategory.isPending ? "Eliminando..." : "Sí, eliminar"}
                    </button>
                    <button onClick={() => setConfirmDeleteCatId(null)} className="px-4 font-jakarta text-sm text-wo-crema-muted hover:text-wo-crema py-2.5 rounded-xl bg-wo-carbon" style={{ border: "0.5px solid rgba(255,255,255,0.1)" }}>Cancelar</button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ========== MODAL: Revisar Comprobante de Pago ========== */}
      {viewingPayment && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[70] flex items-center justify-center p-4 overflow-y-auto" onClick={() => setViewingPayment(null)}>
          <div className="bg-wo-grafito rounded-[2rem] w-full max-w-4xl relative overflow-hidden shadow-2xl flex flex-col md:flex-row min-h-[500px]" 
               style={{ ...cardStyle, background: "linear-gradient(145deg, #1A1A1A 0%, #0D0D0D 100%)" }} 
               onClick={(e) => e.stopPropagation()}>
            
            {/* Cerrar mobile */}
            <button onClick={() => setViewingPayment(null)} className="absolute top-6 right-6 z-10 p-2 rounded-full bg-white/5 text-wo-crema-muted hover:text-wo-crema transition-colors md:hidden">✕</button>

            {/* Panel Izquierdo: Visor de Comprobante */}
            <div className="flex-1 bg-black/40 flex flex-col items-center justify-center p-8 relative min-h-[400px]" style={{ borderRight: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="absolute top-6 left-8 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="font-jakarta text-[10px] font-bold text-wo-crema/40 uppercase tracking-[0.2em]">Visor de Validación</span>
              </div>
              
              {viewingPayment.receipt_url ? (
                <div className="relative group w-full h-full flex items-center justify-center">
                  <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full" />
                  <img
                    src={viewingPayment.receipt_url}
                    alt="Boucher de pago"
                    className="max-h-[500px] w-auto max-w-full object-contain rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 relative z-0 transition-transform hover:scale-[1.02]"
                  />
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-md px-4 py-2 rounded-wo-pill border border-white/10">
                    <a href={viewingPayment.receipt_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 font-jakarta text-[11px] font-bold text-wo-crema">
                      <ArrowUpRight size={14} className="text-primary" /> Abrir imagen completa
                    </a>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 text-center opacity-30">
                  <Package size={48} className="text-wo-crema-muted" />
                  <p className="font-jakarta text-sm text-wo-crema-muted">No se adjuntó comprobante para este {viewingPayment.type}</p>
                </div>
              )}
            </div>

            {/* Panel Derecho: Detalles y Decisión */}
            <div className="w-full md:w-[380px] p-10 flex flex-col">
              <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-jakarta text-[10px] font-bold px-2 py-0.5 rounded-wo-pill uppercase tracking-wider ${statusBadge(viewingPayment.status)}`}>
                    {viewingPayment.status}
                  </span>
                  <button onClick={() => setViewingPayment(null)} className="hidden md:block text-wo-crema-muted hover:text-wo-crema text-xl leading-none">✕</button>
                </div>
                <h3 className="font-syne font-bold text-2xl text-wo-crema mb-1">Revisar Pago</h3>
                <p className="font-jakarta text-sm text-wo-crema-muted">{viewingPayment.affiliate?.name ?? "Afiliado no identificado"}</p>
                <p className="font-syne font-bold text-primary text-xs tracking-widest mt-1 opacity-70">{viewingPayment.affiliate?.affiliate_code ?? "—"}</p>
              </div>

              <div className="space-y-6 flex-1">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/[0.03]">
                    <p className="font-jakarta text-[9px] text-wo-crema-muted uppercase mb-1">Monto Enviado</p>
                    <p className="font-syne font-bold text-xl text-primary">S/ {viewingPayment.amount.toFixed(2)}</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/[0.03]">
                    <p className="font-jakarta text-[9px] text-wo-crema-muted uppercase mb-1">Transacción</p>
                    <p className="font-syne font-bold text-sm text-wo-crema capitalize">
                      {{ activacion: "Activación", upgrade: "Upgrade", retiro: "Retiro", reactivacion: "Reactivación", recarga_billetera: "Recarga" }[viewingPayment.type] ?? viewingPayment.type}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 bg-white/[0.02] p-5 rounded-2xl border border-white/[0.02]">
                  {[
                    { label: "Fecha Registro", value: new Date(viewingPayment.created_at).toLocaleString("es-PE", { dateStyle: 'medium', timeStyle: 'short' }) },
                    ...(viewingPayment.package_to ? [{ label: "Destino Package", value: viewingPayment.package_to }] : []),
                    ...(viewingPayment.withdrawal_method ? [{ label: "Método de Pago", value: viewingPayment.withdrawal_method }] : []),
                    ...(viewingPayment.withdrawal_account ? [{ label: "Cuenta Destino", value: viewingPayment.withdrawal_account }] : []),
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between items-center text-[11px] font-jakarta">
                      <span className="text-wo-crema-muted opacity-60">{item.label}</span>
                      <span className="text-wo-crema font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Acciones */}
              <div className="mt-10 space-y-3">
                {viewingPayment.status === "pendiente" ? (
                  <>
                    <button
                      onClick={() => handleApprove(viewingPayment)}
                      disabled={approvePayment.isPending}
                      className="w-full group relative flex items-center justify-center gap-3 bg-secondary text-secondary-foreground font-jakarta font-extrabold text-sm py-4 rounded-2xl transition-all hover:shadow-[0_0_30px_rgba(30,192,213,0.3)] disabled:opacity-50 overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-white/10 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300" />
                      <CheckCircle size={18} className="relative z-10" />
                      <span className="relative z-10">{approvePayment.isPending ? "Procesando..." : "Confirmar y Aprobar"}</span>
                    </button>
                    <button
                      onClick={() => handleReject(viewingPayment)}
                      disabled={rejectPayment.isPending}
                      className="w-full flex items-center justify-center gap-3 bg-destructive/10 text-destructive border border-destructive/20 font-jakarta font-bold text-sm py-4 rounded-2xl transition-all hover:bg-destructive/20 disabled:opacity-50"
                    >
                      <XCircle size={18} />
                      {rejectPayment.isPending ? "Rechazando..." : "Rechazar Comprobante"}
                    </button>
                  </>
                ) : (
                  <div className={`flex flex-col items-center gap-2 p-6 rounded-2xl border ${statusBadge(viewingPayment.status)}`}>
                    <p className="font-jakarta text-[10px] font-bold uppercase opacity-50">Estado de la transacción</p>
                    <div className="flex items-center gap-2 font-syne font-bold text-lg">
                      {viewingPayment.status === "aprobado" ? <CheckCircle size={20} /> : <XCircle size={20} />}
                      {viewingPayment.status.toUpperCase()}
                    </div>
                  </div>
                )}
                <p className="font-jakarta text-[10px] text-center text-wo-crema-muted mt-4 opacity-40">
                  ID Transacción: {viewingPayment.id}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modal: Tracking Number */}
      {trackingModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-wo-grafito rounded-3xl p-6 w-full max-w-sm border border-white/10 shadow-2xl">
            <h3 className="font-syne font-bold text-lg text-wo-crema mb-4">Actualizar Tracking</h3>
            <p className="font-jakarta text-xs text-wo-crema-muted mb-4">Ingresa el código de seguimiento de Olva, Shalom u otro courier para el pedido <strong className="text-primary">{trackingModal.order_number}</strong>.</p>
            
            <input 
              type="text" 
              value={trackingVal}
              onChange={(e) => setTrackingVal(e.target.value)}
              placeholder="Ej: OLVA-98234123"
              className="w-full bg-wo-carbon rounded-xl px-4 py-3 font-jakarta text-sm text-wo-crema border border-white/5 mb-6 focus:ring-2 ring-primary/20 outline-none"
            />

            <div className="flex gap-3">
              <button onClick={() => setTrackingModal(null)} className="flex-1 py-3 rounded-xl font-jakarta text-xs font-bold text-wo-crema-muted hover:bg-white/5 transition-colors">Cancelar</button>
              <button 
                onClick={async () => {
                  try {
                    const { error } = await supabase.from("orders").update({ tracking_number: trackingVal }).eq("id", trackingModal.id);
                    if (error) throw error;
                    toast({ title: "✓ Tracking actualizado" });
                    setTrackingModal(null);
                    // Refresh orders manually if needed or let hooks do it
                  } catch (err) {
                    toast({ title: "Error", description: "No se pudo actualizar", variant: "destructive" });
                  }
                }}
                className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-jakarta text-xs font-bold shadow-lg shadow-primary/20 hover:brightness-110 transition-all"
              >
                Guardar Tracking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
