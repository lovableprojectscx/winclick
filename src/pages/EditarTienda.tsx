import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { useProducts } from "@/hooks/useProducts";
import { useMyStoreConfig, useUpdateStoreConfig } from "@/hooks/useAffiliate";
import {
  ArrowLeft, Save, Eye, Store, Palette, MessageCircle,
  Package, Check, Sparkles
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const colorOptions = [
  { value: "#F2C94C", label: "Dorado" },
  { value: "#2ECC71", label: "Esmeralda" },
  { value: "#3498DB", label: "Azul" },
  { value: "#E74C3C", label: "Rojo" },
  { value: "#9B59B6", label: "Púrpura" },
  { value: "#1ABC9C", label: "Turquesa" },
  { value: "#E67E22", label: "Naranja" },
  { value: "#34495E", label: "Oscuro" },
];

const emojiOptions = ["🌿", "💪", "🌱", "✨", "🍃", "💎", "🔥", "⭐", "🌸", "🏆", "💚", "🌻"];

const cardStyle = { border: "0.5px solid rgba(255,255,255,0.07)" };

export default function EditarTienda() {
  const { affiliate } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: storeConfig, isLoading: loadingConfig } = useMyStoreConfig();
  const { data: products = [], isLoading: loadingProducts } = useProducts();
  const updateConfig = useUpdateStoreConfig();

  const [storeName,        setStoreName]        = useState("");
  const [storeTagline,     setStoreTagline]     = useState("");
  const [storeColor,       setStoreColor]       = useState("#F2C94C");
  const [storeEmoji,       setStoreEmoji]       = useState("🌿");
  const [storeWhatsapp,    setStoreWhatsapp]    = useState("");
  const [storeActive,      setStoreActive]      = useState(true);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [saving,           setSaving]           = useState(false);

  // Populate form from fetched config
  useEffect(() => {
    if (storeConfig) {
      setStoreName(storeConfig.store_name ?? "");
      setStoreTagline(storeConfig.tagline ?? "");
      setStoreColor(storeConfig.accent_color ?? "#F2C94C");
      setStoreEmoji(storeConfig.banner_emoji ?? "🌿");
      setStoreWhatsapp(storeConfig.whatsapp ?? "");
      setStoreActive(storeConfig.is_public ?? true);
      setSelectedProducts(storeConfig.featured_product_ids ?? []);
    }
  }, [storeConfig]);

  if (!affiliate) { navigate("/login-afiliado"); return null; }

  const toggleProduct = (id: string) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateConfig.mutateAsync({
        store_name:           storeName,
        tagline:              storeTagline,
        accent_color:         storeColor,
        banner_emoji:         storeEmoji,
        whatsapp:             storeWhatsapp,
        is_public:            storeActive,
        featured_product_ids: selectedProducts,
      });
      toast({
        title: "✓ Tienda actualizada",
        description: "Los cambios se guardaron correctamente.",
      });
    } catch {
      toast({
        title: "Error al guardar",
        description: "Intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const activeProducts = products.filter((p) => p.is_active);

  return (
    <div className="min-h-screen bg-background pt-16 pb-16">
      {/* Header */}
      <div className="bg-wo-grafito" style={{ borderBottom: "0.5px solid rgba(255,255,255,0.07)" }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/area-afiliado")} className="p-2 text-wo-crema-muted hover:text-wo-crema">
              <ArrowLeft size={16} />
            </button>
            <div className="flex items-center gap-2">
              <Store size={16} className="text-primary" />
              <h1 className="font-syne font-extrabold text-lg text-wo-crema">Editar Mi Tienda</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to={`/tienda/${affiliate.affiliate_code}`}
              target="_blank"
              className="flex items-center gap-1.5 font-jakarta text-xs text-wo-crema-muted hover:text-wo-crema px-3 py-1.5 rounded-wo-pill bg-wo-carbon"
              style={cardStyle}
            >
              <Eye size={12} /> Vista previa
            </Link>
            <button
              onClick={handleSave}
              disabled={saving || loadingConfig}
              className="flex items-center gap-1.5 bg-primary text-primary-foreground font-jakarta font-bold text-xs px-4 py-2 rounded-wo-btn hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {saving ? <span className="animate-spin">⏳</span> : <Save size={12} />}
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Preview banner */}
        <div className="rounded-wo-card overflow-hidden" style={cardStyle}>
          <div className="relative h-[140px]" style={{ background: storeColor }}>
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 flex items-end gap-3 z-10">
              <div className="text-4xl">{storeEmoji}</div>
              <div>
                <h2 className="font-syne font-extrabold text-xl text-wo-crema">{storeName || "Nombre de tu tienda"}</h2>
                <p className="font-jakarta text-sm text-wo-crema-muted">{storeTagline || "Tu slogan aquí"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Store info */}
        <div className="bg-wo-grafito rounded-wo-card p-6 space-y-5" style={cardStyle}>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={14} className="text-primary" />
            <h3 className="font-jakarta font-semibold text-sm text-wo-crema">Información de la tienda</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="font-jakarta text-xs text-wo-crema-muted uppercase block mb-1.5">Nombre de la tienda</label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full bg-wo-carbon rounded-xl px-4 py-3 font-jakarta text-sm text-wo-crema placeholder:text-wo-crema-muted focus:outline-none focus:ring-1 focus:ring-primary"
                style={cardStyle}
                placeholder="Ej: Natural Life María"
              />
            </div>
            <div>
              <label className="font-jakarta text-xs text-wo-crema-muted uppercase block mb-1.5">Slogan / Tagline</label>
              <input
                type="text"
                value={storeTagline}
                onChange={(e) => setStoreTagline(e.target.value)}
                className="w-full bg-wo-carbon rounded-xl px-4 py-3 font-jakarta text-sm text-wo-crema placeholder:text-wo-crema-muted focus:outline-none focus:ring-1 focus:ring-primary"
                style={cardStyle}
                placeholder="Ej: Tu bienestar es mi misión"
              />
            </div>
            <div>
              <label className="font-jakarta text-xs text-wo-crema-muted uppercase block mb-1.5">
                <MessageCircle size={10} className="inline mr-1" /> WhatsApp (número sin código de país)
              </label>
              <input
                type="tel"
                value={storeWhatsapp}
                onChange={(e) => setStoreWhatsapp(e.target.value)}
                className="w-full bg-wo-carbon rounded-xl px-4 py-3 font-jakarta text-sm text-wo-crema placeholder:text-wo-crema-muted focus:outline-none focus:ring-1 focus:ring-primary"
                style={cardStyle}
                placeholder="987654321"
              />
            </div>

            {/* Active toggle */}
            <div className="flex items-center justify-between p-3 bg-wo-carbon rounded-xl" style={cardStyle}>
              <div>
                <p className="font-jakarta text-sm text-wo-crema font-medium">Tienda activa</p>
                <p className="font-jakarta text-[11px] text-wo-crema-muted">Cuando está activa, los clientes pueden ver tu tienda</p>
              </div>
              <button
                onClick={() => setStoreActive(!storeActive)}
                className={`w-11 h-6 rounded-full transition-colors relative ${storeActive ? "bg-secondary" : "bg-wo-crema/20"}`}
              >
                <div className={`rounded-full bg-white absolute top-[3px] transition-transform ${storeActive ? "translate-x-[22px]" : "translate-x-[3px]"}`} style={{ width: 18, height: 18 }} />
              </button>
            </div>
          </div>
        </div>

        {/* Color & Emoji */}
        <div className="bg-wo-grafito rounded-wo-card p-6 space-y-5" style={cardStyle}>
          <div className="flex items-center gap-2 mb-1">
            <Palette size={14} className="text-primary" />
            <h3 className="font-jakarta font-semibold text-sm text-wo-crema">Apariencia</h3>
          </div>

          <div>
            <label className="font-jakarta text-xs text-wo-crema-muted uppercase block mb-2">Color del banner</label>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setStoreColor(c.value)}
                  className={`w-10 h-10 rounded-xl transition-all ${storeColor === c.value ? "ring-2 ring-wo-crema ring-offset-2 ring-offset-wo-grafito scale-110" : "hover:scale-105"}`}
                  style={{ background: c.value }}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="font-jakarta text-xs text-wo-crema-muted uppercase block mb-2">Emoji de la tienda</label>
            <div className="flex flex-wrap gap-2">
              {emojiOptions.map((e) => (
                <button
                  key={e}
                  onClick={() => setStoreEmoji(e)}
                  className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${
                    storeEmoji === e ? "bg-primary/20 ring-2 ring-primary scale-110" : "bg-wo-carbon hover:bg-wo-carbon/80"
                  }`}
                  style={cardStyle}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Product selection */}
        <div className="bg-wo-grafito rounded-wo-card p-6 space-y-5" style={cardStyle}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package size={14} className="text-primary" />
              <h3 className="font-jakarta font-semibold text-sm text-wo-crema">Productos destacados</h3>
            </div>
            <span className="font-jakarta text-xs text-wo-crema-muted">
              {selectedProducts.length} seleccionados
            </span>
          </div>
          <p className="font-jakarta text-xs text-wo-crema-muted">
            Selecciona los productos que quieres mostrar en tu tienda. Si no seleccionas ninguno, se mostrarán todos los productos activos.
          </p>

          {loadingProducts ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-[68px] bg-wo-carbon rounded-xl animate-pulse" style={cardStyle} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeProducts.map((p) => {
                const selected = selectedProducts.includes(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => toggleProduct(p.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                      selected ? "bg-primary/10 ring-1 ring-primary/40" : "bg-wo-carbon hover:bg-wo-carbon/80"
                    }`}
                    style={cardStyle}
                  >
                    <div className="relative">
                      <img src={p.image_url ?? ""} alt="" className="w-12 h-12 rounded-lg object-cover" />
                      {selected && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                          <Check size={10} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-jakarta text-sm text-wo-crema font-medium truncate">{p.name}</p>
                      <span className="font-syne font-bold text-xs text-primary">S/ {p.price.toFixed(2)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom save bar (mobile) */}
        <div className="fixed bottom-0 left-0 right-0 bg-wo-grafito p-4 md:hidden z-40" style={{ borderTop: "0.5px solid rgba(255,255,255,0.07)" }}>
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-jakarta font-bold text-sm py-3 rounded-wo-btn disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}
