import { useState } from "react";
import { Star, Heart, Check } from "lucide-react";
import type { Product } from "@/lib/database.types";
import { useCart } from "@/contexts/CartContext";
import { Link } from "react-router-dom";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import {
  canAddActivationItem,
  getActivationCap,
  ACTIVATION_DISCOUNT_PCT,
  RECOMPRA_DISCOUNT_PCT,
} from "@/lib/activationPrice";
import {
  getDisplayPrice,
  type AffiliateStoreContext,
} from "@/lib/storeContext";

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  product:        Product;
  affiliateCode?: string;
  /**
   * Contexto de tienda.
   * - Sin esta prop → modo WinClick (aplica descuentos de membresía)
   * - Con esta prop → modo Tienda Afiliado (siempre precio público / custom)
   *
   * Uso en tienda afiliado:
   *   <ProductCard product={p} storeCtx={{ mode: "affiliate", customPrices: {...} }} />
   */
  storeCtx?: AffiliateStoreContext;
}

const IMG_FALLBACK = "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&h=600&fit=crop&auto=format&q=82";

// ─────────────────────────────────────────────────────────────────────────────
// Componente
// ─────────────────────────────────────────────────────────────────────────────

export default function ProductCard({ product, affiliateCode, storeCtx }: Props) {
  const { addItem, total } = useCart();
  const { session, affiliate } = useAuth();
  const { favoriteIds, toggleFavorite } = useFavorites();
  const { toast } = useToast();
  const [added, setAdded] = useState(false);

  const isFav        = favoriteIds.includes(product.id);
  const isAffStore   = storeCtx?.mode === "affiliate";
  const isPending    = !isAffStore && affiliate?.account_status === "pending";
  const plan         = !isAffStore ? (affiliate?.package ?? null) : null;

  // ── Precio final ────────────────────────────────────────────────────────────
  // getDisplayPrice garantiza el precio correcto según el tipo de tienda.
  const displayPrice = getDisplayPrice({
    product,
    storeMode:       isAffStore ? "affiliate" : "winclick",
    customPrices:    isAffStore ? storeCtx!.customPrices : {},
    affiliatePlan:   plan,
    affiliateStatus: !isAffStore ? (affiliate?.account_status as any ?? null) : null,
  });

  // ── Badges de descuento (SOLO en tienda WinClick) ──────────────────────────
  const activationDiscountPct =
    !isAffStore && isPending && plan
      ? (ACTIVATION_DISCOUNT_PCT[plan] ?? 0) > 0 ? ACTIVATION_DISCOUNT_PCT[plan] : null
      : null;

  const recompraDiscountPct =
    !isAffStore && !isPending && affiliate && plan
      ? (RECOMPRA_DISCOUNT_PCT[plan] ?? null)
      : null;

  // ── Tope de activación (SOLO en tienda WinClick) ───────────────────────────
  const activationCapBlocked =
    !isAffStore &&
    isPending &&
    plan != null &&
    !canAddActivationItem(
      affiliate?.total_sales ?? 0,
      total,
      displayPrice,
      plan,
    );

  // ── Precio público para tachado (SOLO en tienda WinClick) ──────────────────
  const publicPriceStriked =
    !isAffStore &&
    affiliate &&
    product.public_price &&
    displayPrice < product.public_price
      ? product.public_price
      : null;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (activationCapBlocked) {
      const cap = getActivationCap(plan!);
      toast({
        title: "Límite de activación alcanzado",
        description: `Tu plan ${plan} permite un máximo de S/ ${cap.toLocaleString()} en compras de activación. Retira algún producto del carrito si deseas agregar este.`,
        variant: "destructive",
      });
      return;
    }
    addItem(product, displayPrice);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
    >
      <Link
        to={`/catalogo/${product.slug || product.id}${affiliateCode ? `?ref=${affiliateCode}` : ""}`}
        className="product-card group block bg-wo-grafito rounded-wo-card overflow-hidden"
      >
      {/* Image */}
      <div className="relative h-[160px] sm:h-[180px] bg-wo-carbon overflow-hidden">
        <img
          src={product.image_url || IMG_FALLBACK}
          alt={product.image_alt || product.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = IMG_FALLBACK;
          }}
        />
        {(product.rating ?? 0) >= 4.5 && (
          <span className="absolute top-2 left-2 px-2 py-0.5 text-[11px] font-jakarta font-bold bg-primary text-primary-foreground rounded-wo-pill">
            Premium
          </span>
        )}
        {(product.stock ?? 0) <= 10 && (product.stock ?? 0) > 0 && (
          <span className="absolute top-2 right-2 px-2 py-0.5 text-[11px] font-jakarta font-bold rounded-wo-pill" style={{ background: "rgba(231,76,60,0.9)", color: "#fff" }}>
            Últimas
          </span>
        )}
        {product.organic && (
          <span className="absolute bottom-2 left-2 px-2 py-0.5 text-[11px] font-jakarta font-bold rounded-wo-pill" style={{ background: "rgba(30,192,213,0.9)", color: "#0A1020" }}>
            Orgánico
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-4">
        <p className="font-jakarta font-semibold text-sm text-wo-crema truncate">{product.name}</p>
        <div className="flex items-center gap-1 mt-1.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} size={11} className={i < Math.floor(product.rating ?? 0) ? "text-primary fill-primary" : "text-wo-crema-muted opacity-30"} />
          ))}
          <span className="text-[11px] text-wo-crema-muted font-jakarta ml-1">{product.rating ?? "—"}</span>
        </div>
        <p className="font-syne font-extrabold text-xl text-primary mt-2">S/ {displayPrice.toFixed(2)}</p>

        {/* Precio público tachado — solo en tienda WinClick con descuento */}
        {publicPriceStriked && (
          <p className="font-jakarta text-[11px] text-wo-crema-muted line-through">S/ {publicPriceStriked.toFixed(2)}</p>
        )}

        {/* ── Badges — SOLO en tienda WinClick ────────────────────────────── */}

        {/* Badge membresía — descuento por plan */}
        {activationDiscountPct != null && (
          <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full"
            style={{ background: "rgba(245,200,66,0.14)", border: "0.5px solid rgba(245,200,66,0.45)" }}>
            <span style={{ fontSize: "9px" }}>★</span>
            <span className="font-jakarta font-bold text-[10px]" style={{ color: "#D4A017" }}>
              {activationDiscountPct}% OFF · Membres.
            </span>
          </div>
        )}

        {/* Badge recompra mensual */}
        {recompraDiscountPct != null && (
          <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full"
            style={{ background: "rgba(30,192,213,0.10)", border: "0.5px solid rgba(30,192,213,0.28)" }}>
            <span style={{ color: "hsl(var(--secondary))", fontSize: "9px" }}>✓</span>
            <span className="font-jakarta font-bold text-[10px]" style={{ color: "hsl(var(--secondary))" }}>
              {recompraDiscountPct}% OFF · Precio socio
            </span>
          </div>
        )}

        {/* Badge promo — visitante sin sesión en tienda WinClick */}
        {!isAffStore && !affiliate && (
          <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full"
            style={{ background: "rgba(232,116,26,0.10)", border: "0.5px solid rgba(232,116,26,0.30)" }}>
            <span style={{ color: "hsl(var(--primary))", fontSize: "9px" }}>✦</span>
            <span className="font-jakarta font-bold text-[10px]" style={{ color: "hsl(var(--primary))" }}>
              Promo especial para afiliados
            </span>
          </div>
        )}

        {/* Indicador "precio de la tienda" — en tienda afiliado */}
        {isAffStore && storeCtx!.customPrices[product.id] != null && (
          <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full"
            style={{ background: "rgba(232,116,26,0.10)", border: "0.5px solid rgba(232,116,26,0.30)" }}>
            <span style={{ color: "hsl(var(--primary))", fontSize: "9px" }}>🏷</span>
            <span className="font-jakarta font-bold text-[10px]" style={{ color: "hsl(var(--primary))" }}>
              Precio de esta tienda
            </span>
          </div>
        )}

        <div className="flex items-center justify-between mt-3 gap-2">
          <button
            onClick={handleAdd}
            disabled={activationCapBlocked}
            title={activationCapBlocked ? "Carrito de activación lleno — retira algún producto para agregar este" : undefined}
            className={`btn-bounce flex-1 font-jakarta font-bold text-xs py-2.5 px-3 rounded-wo-btn min-h-[40px] transition-colors ${
              activationCapBlocked
                ? "bg-wo-carbon text-wo-crema-muted cursor-not-allowed opacity-50"
                : added
                  ? "bg-secondary text-secondary-foreground"
                  : "bg-primary text-primary-foreground hover:bg-wo-oro-dark"
            }`}
          >
            {activationCapBlocked
              ? <span>Límite alcanzado</span>
              : added
                ? <span className="flex items-center justify-center gap-1"><Check size={11} /> Agregado</span>
                : <span>★ {affiliateCode ? "Comprar" : "Agregar"}</span>}
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!session) {
                toast({ title: "Inicia sesión", description: "Debes iniciar sesión para guardar favoritos.", variant: "destructive" });
                return;
              }
              toggleFavorite.mutate({ productId: product.id, isFavorited: isFav });
            }}
            className={`w-10 h-10 flex items-center justify-center rounded-wo-btn transition-colors ${isFav ? "text-destructive bg-destructive/10" : "text-wo-crema-muted hover:text-destructive hover:bg-wo-carbon"}`}
            aria-label={isFav ? "Quitar de favoritos" : "Agregar a favoritos"}
          >
            <Heart size={16} fill={isFav ? "currentColor" : "none"} />
          </button>
        </div>
      </div>
      </Link>
    </motion.div>
  );
}
