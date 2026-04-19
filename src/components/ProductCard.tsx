import { useState } from "react";
import { Star, Heart, Check } from "lucide-react";
import type { Product } from "@/lib/database.types";
import { useCart } from "@/contexts/CartContext";
import { Link } from "react-router-dom";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getActivationPrice, ACTIVATION_DISCOUNT_PCT } from "@/lib/activationPrice";

interface Props {
  product:        Product;
  affiliateCode?: string;
}

const IMG_FALLBACK = "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&h=600&fit=crop&auto=format&q=82";

export default function ProductCard({ product, affiliateCode }: Props) {
  const { addItem } = useCart();
  const { session, affiliate } = useAuth();
  const { favoriteIds, toggleFavorite } = useFavorites();

  const { toast } = useToast();
  const [added, setAdded] = useState(false);
  const isFav = favoriteIds.includes(product.id);

  // ── Precio según contexto ─────────────────────────────────────────────
  // - Afiliado PENDIENTE (activando membresía) → precio especial de activación
  //   según su plan (40% / 50% / 55% OFF sobre public_price). Solo durante activación.
  // - Afiliado ACTIVO   → partner_price estándar (50% de descuento fijo)
  // - Público / tienda  → public_price (precio al cliente final)
  const isPending     = affiliate?.account_status === "pending";
  const activationPlan = affiliate?.package ?? null;
  const discountPct   = isPending && activationPlan ? (ACTIVATION_DISCOUNT_PCT[activationPlan] ?? null) : null;

  const displayPrice = isPending && activationPlan
    ? getActivationPrice(product, activationPlan)
    : affiliate
      ? (product.partner_price ?? product.public_price ?? product.price)
      : (product.public_price ?? product.price);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, displayPrice);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <Link
      to={`/catalogo/${product.id}${affiliateCode ? `?ref=${affiliateCode}` : ""}`}
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

        {/* Precio público tachado — se muestra cuando hay descuento sobre public_price */}
        {affiliate && product.public_price && displayPrice < product.public_price && (
          <p className="font-jakarta text-[11px] text-wo-crema-muted line-through">S/ {product.public_price.toFixed(2)}</p>
        )}

        {/* Badge activación — solo para afiliados pendientes */}
        {isPending && activationPlan && discountPct && (
          <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full"
            style={{ background: "rgba(232,116,26,0.13)", border: "0.5px solid rgba(232,116,26,0.40)" }}>
            <span style={{ color: "hsl(var(--primary))", fontSize: "9px" }}>🔥</span>
            <span className="font-jakarta font-bold text-[10px]" style={{ color: "hsl(var(--primary))" }}>
              {discountPct}% OFF · Solo activación
            </span>
          </div>
        )}

        {/* Badge partner — afiliado activo */}
        {affiliate && !isPending && product.partner_price && product.public_price && product.partner_price < product.public_price && (
          <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full"
            style={{ background: "rgba(30,192,213,0.10)", border: "0.5px solid rgba(30,192,213,0.28)" }}>
            <span style={{ color: "hsl(var(--secondary))", fontSize: "9px" }}>✓</span>
            <span className="font-jakarta font-bold text-[10px]" style={{ color: "hsl(var(--secondary))" }}>
              Precio socio
            </span>
          </div>
        )}

        {/* Badge promo afiliados — visible sólo para visitantes no afiliados */}
        {!affiliate && (
          <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full"
            style={{ background: "rgba(232,116,26,0.10)", border: "0.5px solid rgba(232,116,26,0.30)" }}>
            <span style={{ color: "hsl(var(--primary))", fontSize: "9px" }}>✦</span>
            <span className="font-jakarta font-bold text-[10px]" style={{ color: "hsl(var(--primary))" }}>
              Promo especial para afiliados
            </span>
          </div>
        )}
        <div className="flex items-center justify-between mt-3 gap-2">
          <button
            onClick={handleAdd}
            className={`btn-bounce flex-1 font-jakarta font-bold text-xs py-2.5 px-3 rounded-wo-btn min-h-[40px] ${
              added ? "bg-secondary text-secondary-foreground" : "bg-primary text-primary-foreground hover:bg-wo-oro-dark"
            }`}
          >
            {added
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
  );
}
