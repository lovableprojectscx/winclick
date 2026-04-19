import { useParams, Link, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { Star, Check, Shield, Leaf, Truck, ArrowLeft } from "lucide-react";
import { useProduct } from "@/hooks/useProducts";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get("ref");
  
  const { data: product, isLoading } = useProduct(id ?? "");
  const { addItem, setIsOpen, setAffiliateCode } = useCart();
  const { affiliate } = useAuth();
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (refCode) setAffiliateCode(refCode.toUpperCase());
  }, [refCode, setAffiliateCode]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pt-20 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background pt-20 flex items-center justify-center px-4">
        <p className="text-wo-crema-muted font-jakarta">Producto no encontrado</p>
      </div>
    );
  }

  // Precio según contexto:
  // - Afiliado logueado → partner_price (precio socio)
  // - Público / tienda afiliado → public_price (precio cliente)
  const displayPrice = affiliate
    ? (product.partner_price ?? product.public_price ?? product.price)
    : (product.public_price ?? product.price);

  const handleAdd = () => {
    addItem(product, displayPrice);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    addItem(product, displayPrice);
    setIsOpen(true);
  };

  const rating = product.rating ?? 0;

  return (
    /* pb-28 en mobile para que el sticky bar no tape el contenido */
    <div className="min-h-screen bg-background pt-20 pb-28 md:pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/catalogo" className="inline-flex items-center gap-1.5 text-wo-crema-muted hover:text-wo-crema font-jakarta text-sm mb-6 py-1 transition-colors">
          <ArrowLeft size={14} /> Volver al catálogo
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
          {/* Image */}
          <div>
            <div className="relative bg-wo-grafito rounded-wo-card overflow-hidden">
              <img
                src={product.image_url || `https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&h=800&fit=crop&auto=format&q=82`}
                alt={product.name}
                className="w-full aspect-square object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&h=800&fit=crop&auto=format&q=82";
                }}
              />
              {product.organic && (
                <span className="absolute top-3 left-3 px-2.5 py-1 text-xs font-jakarta font-bold rounded-wo-pill bg-secondary/90 text-secondary-foreground">
                  🌿 Orgánico
                </span>
              )}
              {(product.stock ?? 0) <= 10 && (product.stock ?? 0) > 0 && (
                <div className="absolute bottom-0 left-0 right-0 py-2 text-center font-jakarta text-xs font-bold" style={{ background: "rgba(231,76,60,0.85)", color: "#fff" }}>
                  ¡Últimas unidades!
                </div>
              )}
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-2 mt-3">
              {[
                { icon: <Shield size={14} />, text: "Calidad garantizada" },
                { icon: <Leaf size={14} />,   text: "100% Orgánico" },
                { icon: <Truck size={14} />,  text: "Envíos seguros" },
              ].map((b, i) => (
                <div key={i} className="flex flex-col sm:flex-row items-center gap-1.5 bg-wo-grafito rounded-lg px-2 py-3 text-secondary font-jakarta text-[11px] text-center sm:text-left" style={{ border: "0.5px solid rgba(30,192,213,0.2)" }}>
                  {b.icon}
                  <span>{b.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Info */}
          <div>
            {/* Tags */}
            {(product.tags ?? []).length > 0 && (
              <div className="flex gap-2 mb-3 flex-wrap">
                {(product.tags ?? []).map((t) => (
                  <span key={t} className="text-[11px] font-jakarta font-bold uppercase tracking-[0.08em] px-2.5 py-1 rounded-wo-pill" style={{ background: "rgba(30,192,213,0.12)", color: "hsl(var(--wo-esmeralda))", border: "0.5px solid rgba(30,192,213,0.25)" }}>
                    {t}
                  </span>
                ))}
              </div>
            )}

            <h1 className="font-syne font-extrabold text-[26px] sm:text-[30px] text-wo-crema mb-2 leading-tight">{product.name}</h1>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-5">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={14} className={i < Math.floor(rating) ? "text-primary fill-primary" : "text-wo-crema-muted/30"} />
                ))}
              </div>
              <span className="font-jakarta font-semibold text-sm text-wo-crema">{rating}</span>
              <span className="font-jakarta text-xs text-wo-crema-muted">({product.reviews_count} reseñas)</span>
            </div>

            {/* Price — precio activo según contexto */}
            <div className="rounded-wo-btn p-4 mb-4" style={{ background: "rgba(232,116,26,0.08)", border: "0.5px solid rgba(232,116,26,0.2)" }}>
              <div className="flex items-end gap-3">
                <span className="font-syne font-extrabold text-[34px] text-primary leading-none">S/ {displayPrice.toFixed(2)}</span>
                {affiliate && product.partner_price && product.public_price && product.partner_price < product.public_price && (
                  <div className="flex flex-col pb-1">
                    <span className="font-jakarta text-xs text-wo-crema-muted line-through">S/ {product.public_price.toFixed(2)}</span>
                    <span className="font-jakarta text-[11px] font-bold" style={{ color: "hsl(var(--secondary))" }}>Precio socio ✓</span>
                  </div>
                )}
              </div>
            </div>

            {/* ── Estructura de precios por membresía ── */}
            {(() => {
              const base = product.public_price ?? product.price;
              const tiers = [
                {
                  key: "publico",
                  icon: "🛒",
                  label: "Precio Público",
                  sublabel: "Clientes finales",
                  price: base,
                  discount: null,
                  bg: "rgba(248,244,236,0.05)",
                  border: "rgba(248,244,236,0.12)",
                  badgeBg: "rgba(248,244,236,0.1)",
                  badgeColor: "rgba(248,244,236,0.5)",
                  priceColor: "hsl(var(--wo-crema))",
                },
                {
                  key: "basica",
                  icon: "⭐",
                  label: "Membresía Básica",
                  sublabel: "1 Esplendor · 3 niveles residual",
                  price: base * 0.60,
                  discount: 40,
                  bg: "rgba(232,116,26,0.07)",
                  border: "rgba(232,116,26,0.22)",
                  badgeBg: "rgba(232,116,26,0.15)",
                  badgeColor: "hsl(var(--primary))",
                  priceColor: "hsl(var(--primary))",
                },
                {
                  key: "pack",
                  icon: "🔵",
                  label: "Pack 2,000",
                  sublabel: "Activación · 7 niveles residual",
                  price: base * 0.50,
                  discount: 50,
                  bg: "rgba(30,192,213,0.07)",
                  border: "rgba(30,192,213,0.22)",
                  badgeBg: "rgba(30,192,213,0.15)",
                  badgeColor: "hsl(var(--secondary))",
                  priceColor: "hsl(var(--secondary))",
                },
                {
                  key: "vip",
                  icon: "👑",
                  label: "Membresía VIP",
                  sublabel: "10,000 pts · 10 niveles · máximo ahorro",
                  price: base * 0.45,
                  discount: 55,
                  bg: "rgba(245,200,66,0.07)",
                  border: "rgba(245,200,66,0.22)",
                  badgeBg: "rgba(245,200,66,0.18)",
                  badgeColor: "#D4A017",
                  priceColor: "#D4A017",
                },
              ];
              return (
                <div className="mb-5">
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
                    <span className="font-jakarta text-[11px] font-bold uppercase tracking-widest text-wo-crema-muted">Precios por membresía</span>
                    <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
                  </div>

                  {/* Tier grid */}
                  <div className="grid grid-cols-2 gap-2">
                    {tiers.map((t) => (
                      <div key={t.key} className="rounded-xl p-3 flex flex-col gap-1" style={{ background: t.bg, border: `0.5px solid ${t.border}` }}>
                        <div className="flex items-center justify-between">
                          <span className="text-base leading-none">{t.icon}</span>
                          {t.discount !== null && (
                            <span className="font-jakarta text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                              style={{ background: t.badgeBg, color: t.badgeColor }}>
                              -{t.discount}%
                            </span>
                          )}
                        </div>
                        <p className="font-jakarta text-[11px] font-semibold text-wo-crema leading-tight">{t.label}</p>
                        <p className="font-syne font-extrabold text-[20px] leading-none" style={{ color: t.priceColor }}>
                          S/ {t.price.toFixed(2)}
                        </p>
                        <p className="font-jakarta text-[10px] text-wo-crema-muted leading-tight">{t.sublabel}</p>
                      </div>
                    ))}
                  </div>

                  {/* Recompra row — para todos los activos */}
                  <div className="rounded-xl px-3 py-2.5 flex items-center justify-between"
                    style={{ background: "rgba(30,192,213,0.05)", border: "0.5px solid rgba(30,192,213,0.18)" }}>
                    <div>
                      <p className="font-jakarta text-[11px] font-semibold text-wo-crema">🔄 Recompra mensual</p>
                      <p className="font-jakarta text-[10px] text-wo-crema-muted">Todos los afiliados activos · genera comisiones</p>
                    </div>
                    <div className="text-right">
                      <p className="font-syne font-extrabold text-[18px] leading-none" style={{ color: "hsl(var(--secondary))" }}>S/ {(base * 0.50).toFixed(2)}</p>
                      <p className="font-jakarta text-[10px] font-bold" style={{ color: "hsl(var(--secondary))" }}>50% off</p>
                    </div>
                  </div>

                  {/* Nota aclaratoria */}
                  <p className="font-jakarta text-[10px] text-wo-crema-muted/50 text-center px-2">
                    Los precios de activación aplican solo en tu primera compra como nuevo afiliado y no generan comisiones.
                  </p>

                  {/* CTA para no afiliados */}
                  {!affiliate && (
                    <div className="mt-3 rounded-xl p-3.5 flex items-center gap-3"
                      style={{ background: "linear-gradient(135deg, rgba(232,116,26,0.08) 0%, rgba(30,192,213,0.06) 100%)", border: "0.5px solid rgba(232,116,26,0.25)" }}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: "rgba(232,116,26,0.15)", border: "0.5px solid rgba(232,116,26,0.3)" }}>
                        <span className="text-sm">🌟</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-jakarta text-xs font-bold text-primary leading-tight">¡Ahorra hasta 55% como afiliado!</p>
                        <p className="font-jakarta text-[10px] text-wo-crema-muted mt-0.5">Accede a precios exclusivos en toda la tienda</p>
                      </div>
                      <Link to="/planes"
                        className="font-jakarta text-[11px] font-bold px-3 py-1.5 rounded-full whitespace-nowrap flex-shrink-0"
                        style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}>
                        Ver planes
                      </Link>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Description */}
            <p className="font-jakarta text-sm text-wo-crema-muted leading-[1.75] mb-5 whitespace-pre-line">{product.description}</p>

            {/* Availability */}
            <div className="mb-6">
              {(product.stock ?? 0) > 0 ? (
                <span className="inline-flex items-center gap-1.5 text-secondary font-jakarta text-sm font-medium">
                  <span className="w-2 h-2 rounded-full bg-secondary" /> En stock
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-destructive font-jakarta text-sm font-medium">
                  <span className="w-2 h-2 rounded-full bg-destructive" /> Agotado
                </span>
              )}
            </div>

            {/* Actions — ocultas en mobile, las maneja el sticky bar */}
            <div className="hidden md:flex flex-col gap-3">
              <button
                onClick={handleAdd}
                disabled={(product.stock ?? 0) === 0}
                className={`w-full font-jakarta font-bold text-sm py-3.5 rounded-wo-btn transition-colors ${
                  added ? "bg-secondary text-secondary-foreground" : "text-wo-crema/80 hover:text-wo-crema disabled:opacity-40"
                }`}
                style={!added ? { border: "0.5px solid rgba(248,244,236,0.2)" } : {}}
              >
                {added ? <span className="flex items-center justify-center gap-1.5"><Check size={14} /> Agregado al carrito</span> : "Añadir al carrito"}
              </button>
              <button
                onClick={handleBuyNow}
                disabled={(product.stock ?? 0) === 0}
                className="w-full bg-primary text-primary-foreground font-jakarta font-bold text-sm py-3.5 rounded-wo-btn hover:bg-wo-oro-dark transition-colors disabled:opacity-40"
              >
                Comprar ahora
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky mobile bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden bg-wo-grafito/95 backdrop-blur-md px-4 py-3 z-40 safe-area-inset-bottom" style={{ borderTop: "0.5px solid rgba(255,255,255,0.1)" }}>
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <span className="font-syne font-extrabold text-xl text-primary shrink-0">S/ {displayPrice.toFixed(2)}</span>
          <button
            onClick={handleAdd}
            disabled={(product.stock ?? 0) === 0}
            className="flex-1 font-jakarta font-bold text-sm py-3.5 rounded-wo-btn text-wo-crema/80 transition-colors disabled:opacity-40 min-h-[48px]"
            style={{ border: "0.5px solid rgba(248,244,236,0.2)" }}
          >
            {added ? <span className="flex items-center justify-center gap-1"><Check size={13} /> Agregado</span> : "Añadir"}
          </button>
          <button
            onClick={handleBuyNow}
            disabled={(product.stock ?? 0) === 0}
            className="flex-1 bg-primary text-primary-foreground font-jakarta font-bold text-sm py-3.5 rounded-wo-btn hover:bg-wo-oro-dark transition-colors disabled:opacity-40 min-h-[48px]"
          >
            Comprar
          </button>
        </div>
      </div>
    </div>
  );
}
