import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { useProducts } from "@/hooks/useProducts";
import { useMyStoreConfig, useUpdateStoreConfig } from "@/hooks/useAffiliate";
import {
  ArrowLeft, Save, Eye, Store, Palette, MessageCircle,
  Package, Check, Sparkles, Image as ImageIcon, Upload, Camera, Trash2,
  Tag, AlertTriangle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { DynamicIcon } from "@/components/DynamicIcon";

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

const proIconOptions = [
  "Sparkles", "Diamond", "Star", "Crown", "Flame", "Gem", "Trophy", "Rocket", "Zap", "Shield", "Heart", "Medal"
];

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
  const [bannerType,       setBannerType]       = useState<"color" | "image">("color");
  const [bannerIcon,       setBannerIcon]       = useState("Sparkles");
  const [bannerImageUrl,   setBannerImageUrl]   = useState("");
  const [storeWhatsapp,    setStoreWhatsapp]    = useState("");
  const [storeActive,      setStoreActive]      = useState(true);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [customPrices,     setCustomPrices]     = useState<Record<string, string>>({});
  const [saving,           setSaving]           = useState(false);
  const [uploadingImage,   setUploadingImage]   = useState(false);

  // Populate form from fetched config
  useEffect(() => {
    if (storeConfig) {
      setStoreName(storeConfig.store_name ?? "");
      setStoreTagline(storeConfig.tagline ?? "");
      setStoreColor(storeConfig.accent_color ?? "#F2C94C");
      setBannerType((storeConfig.banner_type as any) ?? "color");
      setBannerIcon(storeConfig.banner_icon ?? "Sparkles");
      setBannerImageUrl(storeConfig.banner_image_url ?? "");
      setStoreWhatsapp(storeConfig.whatsapp ?? "");
      setStoreActive(storeConfig.is_public ?? true);
      setSelectedProducts(storeConfig.featured_product_ids ?? []);
      if (storeConfig.custom_prices) {
        const saved = storeConfig.custom_prices as Record<string, number>;
        const asStrings: Record<string, string> = {};
        Object.entries(saved).forEach(([id, price]) => { asStrings[id] = String(price); });
        setCustomPrices(asStrings);
      }
    }
  }, [storeConfig]);

  const toggleProduct = (id: string) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !affiliate) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Imagen muy pesada",
        description: "El tamaño máximo es 2MB.",
        variant: "destructive",
      });
      return;
    }

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${affiliate.id}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('store-banners')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('store-banners')
        .getPublicUrl(filePath);

      setBannerImageUrl(publicUrl);
      setBannerType("image");
      toast({ title: "✓ Imagen subida" });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error al subir",
        description: "Intenta con otra imagen.",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Convertir precios a números y filtrar entradas vacías
      const pricesAsNumbers: Record<string, number> = {};
      Object.entries(customPrices).forEach(([id, val]) => {
        const n = parseFloat(val);
        if (!isNaN(n) && n > 0) pricesAsNumbers[id] = n;
      });

      await updateConfig.mutateAsync({
        store_name:           storeName,
        tagline:              storeTagline,
        accent_color:         storeColor,
        banner_type:          bannerType,
        banner_icon:          bannerIcon,
        banner_image_url:     bannerImageUrl,
        whatsapp:             storeWhatsapp,
        is_public:            storeActive,
        featured_product_ids: selectedProducts,
        custom_prices:        pricesAsNumbers,
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

  if (!affiliate) return null;

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
          <div 
            className="relative h-[160px] bg-cover bg-center transition-all duration-500" 
            style={{ 
              backgroundColor: storeColor,
              backgroundImage: bannerType === 'image' && bannerImageUrl ? `url(${bannerImageUrl})` : 'none'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/40 to-transparent" />
            <div className="absolute bottom-4 left-6 right-6 flex items-end gap-4 z-10">
              <div className="p-3 bg-wo-carbon/40 backdrop-blur-md rounded-2xl" style={cardStyle}>
                <DynamicIcon name={bannerIcon} size={32} className="text-primary" strokeWidth={2.5} />
              </div>
              <div className="pb-1">
                <h2 className="font-syne font-extrabold text-2xl text-wo-crema leading-tight">{storeName || "Nombre de tu tienda"}</h2>
                <p className="font-jakarta text-sm text-wo-crema-muted mt-0.5">{storeTagline || "Tu slogan aquí"}</p>
              </div>
            </div>
            
            {bannerType === 'image' && (
              <div className="absolute top-4 right-4 z-20">
                <span className="flex items-center gap-1.5 px-2 py-1 bg-black/40 backdrop-blur-md rounded-md text-[10px] text-wo-crema/80 font-bold uppercase tracking-wider">
                  <ImageIcon size={10} /> Fondo personalizado
                </span>
              </div>
            )}
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
        </div>        {/* Appearance & Style */}
        <div className="bg-wo-grafito rounded-wo-card p-6 space-y-7" style={cardStyle}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Palette size={14} className="text-primary" />
              <h3 className="font-jakarta font-semibold text-sm text-wo-crema">Apariencia y Estilo</h3>
            </div>
            <div className="bg-wo-carbon p-1 rounded-lg flex items-center gap-1" style={cardStyle}>
              <button 
                onClick={() => setBannerType("color")}
                className={`text-[10px] uppercase font-bold px-3 py-1.5 rounded-md transition-all ${bannerType === 'color' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-wo-crema-muted hover:text-wo-crema'}`}
              >
                Color
              </button>
              <button 
                onClick={() => setBannerType("image")}
                className={`text-[10px] uppercase font-bold px-3 py-1.5 rounded-md transition-all ${bannerType === 'image' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-wo-crema-muted hover:text-wo-crema'}`}
              >
                Imagen
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Background Control */}
            <div className="space-y-4">
              {bannerType === 'color' ? (
                <div>
                  <label className="font-jakarta text-[10px] text-wo-crema-muted uppercase font-bold tracking-wider block mb-3">Color de fondo</label>
                  <div className="flex flex-wrap gap-2.5">
                    {colorOptions.map((c) => (
                      <button
                        key={c.value}
                        onClick={() => setStoreColor(c.value)}
                        className={`w-9 h-9 rounded-xl transition-all ${storeColor === c.value ? "ring-2 ring-primary ring-offset-2 ring-offset-wo-grafito scale-110" : "hover:scale-105"}`}
                        style={{ background: c.value }}
                        title={c.label}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="font-jakarta text-[10px] text-wo-crema-muted uppercase font-bold tracking-wider block mb-1">Imagen de fondo</label>
                  
                  {bannerImageUrl ? (
                    <div className="relative group rounded-xl overflow-hidden aspect-video bg-wo-carbon" style={cardStyle}>
                      <img src={bannerImageUrl} className="w-full h-full object-cover" alt="Banner" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <label className="cursor-pointer p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-wo-crema">
                          <Camera size={18} />
                          <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} />
                        </label>
                        <button 
                          onClick={() => setBannerImageUrl("")}
                          className="p-2 bg-destructive/20 hover:bg-destructive/40 rounded-full transition-colors text-destructive"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center gap-3 w-full aspect-video rounded-xl bg-wo-carbon border-2 border-dashed border-wo-crema/10 hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer group">
                      <div className="p-3 rounded-full bg-wo-crema/5 group-hover:bg-primary/20 transition-colors">
                        <Upload size={24} className="text-wo-crema-muted group-hover:text-primary transition-colors" />
                      </div>
                      <div className="text-center px-4">
                        <p className="font-jakarta text-xs font-bold text-wo-crema">Subir fondo</p>
                        <p className="font-jakarta text-[10px] text-wo-crema-muted mt-1">Recomendado: 1200x400px (Máx 2MB)</p>
                      </div>
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} />
                    </label>
                  )}
                  {uploadingImage && <div className="text-center animate-pulse py-2 text-[10px] text-primary font-bold uppercase">Subiendo imagen...</div>}
                </div>
              )}
            </div>

            {/* Icon Picker */}
            <div>
              <label className="font-jakarta text-[10px] text-wo-crema-muted uppercase font-bold tracking-wider block mb-3">Icono de marca</label>
              <div className="grid grid-cols-4 gap-2.5">
                {proIconOptions.map((iconName) => (
                  <button
                    key={iconName}
                    onClick={() => setBannerIcon(iconName)}
                    className={`h-11 rounded-xl flex items-center justify-center transition-all ${
                      bannerIcon === iconName ? "bg-primary/20 ring-1 ring-primary scale-105 shadow-lg shadow-primary/10" : "bg-wo-carbon hover:bg-wo-crema/5"
                    }`}
                    style={cardStyle}
                  >
                    <DynamicIcon name={iconName} size={18} className={bannerIcon === iconName ? "text-primary" : "text-wo-crema-muted"} />
                  </button>
                ))}
              </div>
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

        {/* Precios de mis productos */}
        <div className="bg-wo-grafito rounded-wo-card p-6 space-y-5" style={cardStyle}>
          <div className="flex items-center gap-2">
            <Tag size={14} className="text-primary" />
            <h3 className="font-jakarta font-semibold text-sm text-wo-crema">Precios de mis productos</h3>
          </div>
          <p className="font-jakarta text-xs text-wo-crema-muted">
            Define a qué precio vendes cada producto en tu tienda. Winclick te cobra el{" "}
            <span className="text-secondary font-semibold">Precio Socio</span> — la diferencia es tu ganancia directa.
          </p>

          {loadingProducts && (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 bg-wo-carbon rounded-xl animate-pulse" style={cardStyle} />
              ))}
            </div>
          )}

          {!loadingProducts && selectedProducts.length === 0 && (
            <p className="font-jakarta text-xs text-wo-crema-muted py-2">
              Selecciona productos destacados arriba para editar sus precios aquí.
            </p>
          )}

          {!loadingProducts && selectedProducts.length > 0 && (
            <div className="space-y-3">
              {activeProducts.filter((p) => selectedProducts.includes(p.id)).map((product) => {
                const partnerPrice = product.partner_price ?? product.price;
                const suggestedPrice = product.public_price ?? product.price;
                const myPriceStr = customPrices[product.id] ?? String(suggestedPrice.toFixed(2));
                const myPrice = parseFloat(myPriceStr) || 0;
                const margin = myPrice - partnerPrice;
                const pct = partnerPrice > 0 ? (margin / partnerPrice) * 100 : 0;
                const isBelowCost = myPrice > 0 && myPrice < partnerPrice;

                return (
                  <div
                    key={product.id}
                    className="bg-wo-carbon rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4"
                    style={cardStyle}
                  >
                    {/* Product info */}
                    <div className="flex items-center gap-3 sm:w-48 flex-shrink-0">
                      <img
                        src={product.image_url ?? ""}
                        alt=""
                        className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-jakarta text-sm text-wo-crema font-medium truncate">{product.name}</p>
                        <p className="font-jakarta text-[11px] text-secondary mt-0.5">
                          Socio: S/ {partnerPrice.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Price input */}
                    <div className="flex-1">
                      <label className="font-jakarta text-[10px] text-wo-crema-muted uppercase font-bold tracking-wider block mb-1.5">
                        Tú vendes a
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-jakarta text-sm text-wo-crema-muted">S/</span>
                        <input
                          type="number"
                          min="0"
                          step="0.50"
                          value={myPriceStr}
                          onChange={(e) =>
                            setCustomPrices((prev) => ({ ...prev, [product.id]: e.target.value }))
                          }
                          className={`w-full bg-wo-grafito rounded-xl pl-9 pr-4 py-2.5 font-jakarta text-sm text-wo-crema focus:outline-none focus:ring-1 ${
                            isBelowCost ? "ring-1 ring-destructive focus:ring-destructive" : "focus:ring-primary"
                          }`}
                          style={cardStyle}
                        />
                      </div>
                      {isBelowCost && (
                        <div className="flex items-center gap-1 mt-1.5">
                          <AlertTriangle size={10} className="text-destructive flex-shrink-0" />
                          <p className="font-jakarta text-[10px] text-destructive">
                            Por debajo del precio socio — perderías dinero
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Margin display */}
                    <div className="sm:w-36 flex-shrink-0">
                      <p className="font-jakarta text-[10px] text-wo-crema-muted uppercase font-bold tracking-wider mb-1">Tu ganancia</p>
                      {myPrice > 0 && !isBelowCost ? (
                        <div>
                          <p className="font-syne font-bold text-base text-primary">
                            S/ {margin.toFixed(2)}
                          </p>
                          <p className="font-jakarta text-[11px] text-wo-crema-muted">
                            {pct.toFixed(1)}% margen
                          </p>
                        </div>
                      ) : myPrice > 0 && isBelowCost ? (
                        <p className="font-syne font-bold text-base text-destructive">
                          − S/ {Math.abs(margin).toFixed(2)}
                        </p>
                      ) : (
                        <p className="font-jakarta text-xs text-wo-crema-muted">Ingresa precio</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="pt-4 border-t border-wo-crema/5 flex items-center justify-between gap-3">
            <p className="font-jakarta text-[11px] text-wo-crema-muted">
              Los precios se guardan junto con todos los ajustes de tu tienda.
            </p>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 bg-primary text-primary-foreground font-jakarta font-bold text-xs px-5 py-2.5 rounded-wo-btn hover:bg-primary/90 transition-colors disabled:opacity-50 shrink-0"
            >
              {saving ? <span className="animate-spin">⏳</span> : <Save size={12} />}
              {saving ? "Guardando..." : "Guardar precios"}
            </button>
          </div>
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
