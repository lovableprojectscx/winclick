import { useState } from "react";
import { Star, Heart, Check } from "lucide-react";
import type { Product } from "@/lib/database.types";
import { useCart } from "@/contexts/CartContext";
import { Link } from "react-router-dom";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Props {
  product:       Product;
  affiliateCode?: string;
}

const CATEGORY_FALLBACK: Record<string, string> = {
  "Detox":     "https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=600&h=600&fit=crop&auto=format&q=82",
  "Vitaminas": "https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=600&h=600&fit=crop&auto=format&q=82",
  "Proteínas": "https://images.unsplash.com/photo-1579722820309-ad7660e21001?w=600&h=600&fit=crop&auto=format&q=82",
  "Colágeno":  "https://images.unsplash.com/photo-1556228852-80b6e5eeff06?w=600&h=600&fit=crop&auto=format&q=82",
  "Naturales": "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&h=600&fit=crop&auto=format&q=82",
};
const IMG_FALLBACK = "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&h=600&fit=crop&auto=format&q=82";

export default function ProductCard({ product, affiliateCode }: Props) {
  const { addItem } = useCart();
  const { session, affiliate } = useAuth();
  const { favoriteIds, toggleFavorite } = useFavorites();

  const { toast } = useToast();
  const [added, setAdded] = useState(false);
  const isFav = favoriteIds.includes(product.id);

  // Precio según contexto:
  // - Con affiliateCode (tienda del afiliado) → public_price (precio cliente final)
  // - Afiliado logueado comprando del catálogo principal → partner_price
  // - Público sin contexto → price (precio estándar)
  const displayPrice = affiliateCode
    ? (product.public_price ?? product.price)
    : affiliate
      ? (product.partner_price ?? product.price)
      : product.price;

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
          src={product.image_url || CATEGORY_FALLBACK[product.category ?? ""] || IMG_FALLBACK}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = CATEGORY_FALLBACK[product.category ?? ""] ?? IMG_FALLBACK;
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
        {affiliateCode && product.public_price && product.price !== product.public_price && (
          <p className="font-jakarta text-[11px] text-wo-crema-muted line-through">S/ {product.price.toFixed(2)}</p>
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
