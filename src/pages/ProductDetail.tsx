import { useParams, Link, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { Star, Check, Shield, Leaf, Truck, ArrowLeft, Flame, ShoppingBag, Crown, Zap, RefreshCw, AlertTriangle, Sparkles, Target } from "lucide-react";
import { useProduct } from "@/hooks/useProducts";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  getActivationPrice,
  getRecompraPrice,
  hasActivationDiscount,
  ACTIVATION_DISCOUNT_PCT,
  RECOMPRA_DISCOUNT_PCT,
  canAddActivationItem,
  getActivationCap,
} from "@/lib/activationPrice";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get("ref");
  
  const { data: product, isLoading } = useProduct(id ?? "");
  const { addItem, setIsOpen, setAffiliateCode, total } = useCart();
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

  // ── Precio según contexto ─────────────────────────────────────────────
  // - Afiliado PENDIENTE (activación):
  //     • VIP        → 50% OFF sobre public_price
  //     • Básico/Int → precio público (sin descuento durante activación)
  // - Afiliado ACTIVO (recompra mensual, genera comisiones):
  //     • Básico 40% OFF | Intermedio 50% OFF | VIP 50% OFF
  // - Público → public_price
  const isPending      = affiliate?.account_status === "pending";
  const activationPlan = affiliate?.package ?? null;

  const displayPrice = isPending && activationPlan
    ? getActivationPrice(product, activationPlan)
    : affiliate
      ? getRecompraPrice(product, affiliate.package)
      : (product.public_price ?? product.price);

  // Badge de descuento visible (solo VIP en activación / todos en recompra)
  const activationDiscountPct = isPending && activationPlan && hasActivationDiscount(activationPlan)
    ? ACTIVATION_DISCOUNT_PCT[activationPlan]
    : null;
  const recompraDiscountPct = !isPending && affiliate && activationPlan
    ? (RECOMPRA_DISCOUNT_PCT[activationPlan] ?? null)
    : null;

  // ── Tope de activación ────────────────────────────────────────────────
  const activationCapBlocked =
    isPending &&
    activationPlan != null &&
    !canAddActivationItem(
      affiliate?.total_sales ?? 0,
      total,
      displayPrice,
      activationPlan,
    );

  const handleAdd = () => {
    if (activationCapBlocked) return;
    addItem(product, displayPrice);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    if (activationCapBlocked) return;
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
                <span className="absolute top-3 left-3 px-2.5 py-1 flex items-center gap-1 text-xs font-jakarta font-bold rounded-wo-pill bg-secondary/90 text-secondary-foreground">
                  <Leaf size={12} /> Orgánico
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
            <div className="rounded-wo-btn p-4 mb-4"
              style={{
                background: isPending ? "rgba(232,116,26,0.10)" : "rgba(232,116,26,0.08)",
                border: isPending ? "0.5px solid rgba(232,116,26,0.35)" : "0.5px solid rgba(232,116,26,0.2)",
              }}>
              <div className="flex items-end gap-3">
                <span className="font-syne font-extrabold text-[34px] text-primary leading-none">S/ {displayPrice.toFixed(2)}</span>
                <div className="flex flex-col pb-1 gap-0.5">
                  {/* Precio público tachado */}
                  {affiliate && product.public_price && displayPrice < product.public_price && (
                    <span className="font-jakarta text-xs text-wo-crema-muted line-through">S/ {product.public_price.toFixed(2)}</span>
                  )}
                  {/* Etiqueta contextual */}
                  {isPending ? (
                    <span className="font-jakarta text-[11px] font-bold flex items-center gap-1" style={{ color: "hsl(var(--primary))" }}>
                      {activationDiscountPct ? <><Flame size={12} /> {activationDiscountPct}% OFF ·</> : <><ShoppingBag size={12} /></>} Activa tu cuenta ahora comprando esta meta
                    </span>
                  ) : affiliate && !isPending && product.partner_price && product.public_price && product.partner_price < product.public_price ? (
                    <span className="font-jakarta text-[11px] font-bold" style={{ color: "hsl(var(--secondary))" }}>Precio socio ✓</span>
                  ) : null}
                </div>
              </div>
              {isPending && (
                <p className="font-jakarta text-[10px] text-wo-crema-muted/60 mt-1.5">
                  Precio promocional exclusivo para tu activación. Luego de activar se aplica el precio socio estándar.
                </p>
              )}
            </div>

            {/* ── Estructura de precios por membresía ── */}
            {(() => {
              const base = product.public_price ?? product.price;

              // ─── Activación: solo VIP tiene precio especial ───────────────
              const activationTiers = [
                {
                  key: "pub-act",
                  icon: <ShoppingBag size={18} />,
                  label: "Básico / Ejec. / Inter.",
                  sublabel: "Activación al precio público",
                  price: base,
                  badge: null,
                  bg: "rgba(248,244,236,0.05)",
                  border: "rgba(248,244,236,0.12)",
                  priceColor: "hsl(var(--wo-crema))",
                },
                {
                  key: "vip-act",
                  icon: <Crown size={18} />,
                  label: "Activación VIP",
                  sublabel: "50% OFF — beneficio exclusivo del plan VIP",
                  price: base * 0.50,
                  badge: "-50%",
                  badgeBg: "rgba(245,200,66,0.18)",
                  badgeColor: "#D4A017",
                  bg: "rgba(245,200,66,0.07)",
                  border: "rgba(245,200,66,0.28)",
                  priceColor: "#D4A017",
                },
              ];

              // ─── Recompra mensual (afiliados activos, genera comisiones) ──
              const recompraTiers = [
                {
                  key: "rc-basico",
                  icon: <Star size={16} />,
                  label: "Básico",
                  sublabel: "3 niveles residual",
                  price: base * 0.60,
                  badge: "-40%",
                  badgeBg: "rgba(232,116,26,0.15)",
                  badgeColor: "hsl(var(--primary))",
                  bg: "rgba(232,116,26,0.06)",
                  border: "rgba(232,116,26,0.20)",
                  priceColor: "hsl(var(--primary))",
                },
                {
                  key: "rc-ejecutivo",
                  icon: <Target size={16} />,
                  label: "Ejecutivo",
                  sublabel: "5 niveles residual",
                  price: base * 0.50,
                  badge: "-50%",
                  badgeBg: "rgba(99,102,241,0.15)",
                  badgeColor: "#6366f1",
                  bg: "rgba(99,102,241,0.06)",
                  border: "rgba(99,102,241,0.20)",
                  priceColor: "#6366f1",
                },
                {
                  key: "rc-inter",
                  icon: <Zap size={16} />,
                  label: "Intermedio",
                  sublabel: "7 niveles residual",
                  price: base * 0.50,
                  badge: "-50%",
                  badgeBg: "rgba(30,192,213,0.15)",
                  badgeColor: "hsl(var(--secondary))",
                  bg: "rgba(30,192,213,0.06)",
                  border: "rgba(30,192,213,0.20)",
                  priceColor: "hsl(var(--secondary))",
                },
                {
                  key: "rc-vip",
                  icon: <Crown size={16} />,
                  label: "VIP",
                  sublabel: "10 niveles · máximo ahorro",
                  price: base * 0.50,
                  badge: "-50%",
                  badgeBg: "rgba(245,200,66,0.18)",
                  badgeColor: "#D4A017",
                  bg: "rgba(245,200,66,0.07)",
                  border: "rgba(245,200,66,0.28)",
                  priceColor: "#D4A017",
                },
              ];

              return (
                <div className="mb-5 space-y-3">
                  {/* ── Activación ── */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
                      <span className="font-jakarta text-[10px] font-bold uppercase tracking-widest text-wo-crema-muted">Primera compra · Activación</span>
                      <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {activationTiers.map((t) => (
                        <div key={t.key} className="rounded-xl p-3 flex flex-col gap-1" style={{ background: t.bg, border: `0.5px solid ${t.border}` }}>
                          <div className="flex items-center justify-between">
                            <span className="text-base leading-none">{t.icon}</span>
                            {t.badge && (
                              <span className="font-jakarta text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                                style={{ background: t.badgeBg, color: t.badgeColor }}>
                                {t.badge}
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
                    <p className="font-jakarta text-[10px] text-wo-crema-muted/45 text-center mt-1.5 px-2">
                      La compra de activación no genera comisiones de red.
                    </p>
                  </div>

                  {/* ── Recompra mensual ── */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
                      <span className="flex items-center gap-1.5 font-jakarta text-[10px] font-bold uppercase tracking-widest text-wo-crema-muted">
                        <RefreshCw size={12} /> Recompra mensual · genera comisiones
                      </span>
                      <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {recompraTiers.map((t) => (
                        <div key={t.key} className="rounded-xl p-2.5 flex flex-col gap-1" style={{ background: t.bg, border: `0.5px solid ${t.border}` }}>
                          <div className="flex items-center justify-between">
                            <span className="text-sm leading-none">{t.icon}</span>
                            <span className="font-jakarta text-[9px] font-bold px-1 py-0.5 rounded-full"
                              style={{ background: t.badgeBg, color: t.badgeColor }}>
                              {t.badge}
                            </span>
                          </div>
                          <p className="font-jakarta text-[10px] font-semibold text-wo-crema leading-tight">{t.label}</p>
                          <p className="font-syne font-extrabold text-[16px] leading-none" style={{ color: t.priceColor }}>
                            S/ {t.price.toFixed(2)}
                          </p>
                          <p className="font-jakarta text-[9px] text-wo-crema-muted leading-tight">{t.sublabel}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CTA para no afiliados */}
                  {!affiliate && (
                    <div className="rounded-xl p-3.5 flex items-center gap-3"
                      style={{ background: "linear-gradient(135deg, rgba(232,116,26,0.08) 0%, rgba(30,192,213,0.06) 100%)", border: "0.5px solid rgba(232,116,26,0.25)" }}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: "rgba(232,116,26,0.15)", border: "0.5px solid rgba(232,116,26,0.3)", color: "hsl(var(--primary))" }}>
                        <Sparkles size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-jakarta text-xs font-bold text-primary leading-tight">¡Ahorra hasta 55% como afiliado VIP!</p>
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

            {/* Aviso de tope de activación */}
            {activationCapBlocked && (
              <div className="rounded-xl px-4 py-3 mb-3 flex items-center gap-2.5"
                style={{ background: "rgba(232,116,26,0.08)", border: "0.5px solid rgba(232,116,26,0.35)" }}>
                <span className="text-primary shrink-0"><AlertTriangle size={18} /></span>
                <p className="font-jakarta text-[12px] text-wo-crema-muted leading-snug">
                  Tu carrito ha llegado al tope de activación{" "}
                  <strong className="text-wo-crema">{activationPlan}</strong> (máx.{" "}
                  <strong style={{ color: "hsl(var(--primary))" }}>
                    S/ {getActivationCap(activationPlan!).toLocaleString()}
                  </strong>). Retira algún producto para agregar este.
                </p>
              </div>
            )}

            {/* Actions — ocultas en mobile, las maneja el sticky bar */}
            <div className="hidden md:flex flex-col gap-3">
              <button
                onClick={handleAdd}
                disabled={(product.stock ?? 0) === 0 || activationCapBlocked}
                className={`w-full font-jakarta font-bold text-sm py-3.5 rounded-wo-btn transition-colors ${
                  added ? "bg-secondary text-secondary-foreground" : "text-wo-crema/80 hover:text-wo-crema disabled:opacity-40"
                }`}
                style={!added ? { border: "0.5px solid rgba(248,244,236,0.2)" } : {}}
              >
                {added ? <span className="flex items-center justify-center gap-1.5"><Check size={14} /> Agregado al carrito</span> : "Añadir al carrito"}
              </button>
              <button
                onClick={handleBuyNow}
                disabled={(product.stock ?? 0) === 0 || activationCapBlocked}
                className="w-full bg-primary text-primary-foreground font-jakarta font-bold text-sm py-3.5 rounded-wo-btn hover:bg-wo-oro-dark transition-colors disabled:opacity-40"
              >
                {activationCapBlocked ? "Tope de activación alcanzado" : "Comprar ahora"}
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
            disabled={(product.stock ?? 0) === 0 || activationCapBlocked}
            className="flex-1 font-jakarta font-bold text-sm py-3.5 rounded-wo-btn text-wo-crema/80 transition-colors disabled:opacity-40 min-h-[48px]"
            style={{ border: "0.5px solid rgba(248,244,236,0.2)" }}
          >
            {added ? <span className="flex items-center justify-center gap-1"><Check size={13} /> Agregado</span> : "Añadir"}
          </button>
          <button
            onClick={handleBuyNow}
            disabled={(product.stock ?? 0) === 0 || activationCapBlocked}
            className="flex-1 bg-primary text-primary-foreground font-jakarta font-bold text-sm py-3.5 rounded-wo-btn hover:bg-wo-oro-dark transition-colors disabled:opacity-40 min-h-[48px]"
          >
            Comprar
          </button>
        </div>
      </div>
    </div>
  );
}
