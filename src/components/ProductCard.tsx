import { useState } from "react";
import { Star, Heart, Check } from "lucide-react";
import type { Product } from "@/lib/database.types";
import { useCart } from "@/contexts/CartContext";
import { Link } from "react-router-dom";

interface Props {
  product:       Product;
  affiliateCode?: string;
}

export default function ProductCard({ product, affiliateCode }: Props) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const [fav,   setFav]   = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <Link
      to={`/catalogo/${product.id}`}
      className="group block bg-wo-grafito rounded-wo-card overflow-hidden transition-all hover:shadow-xl active:scale-[0.99]"
      style={{ border: "0.5px solid rgba(255,255,255,0.07)" }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(232,116,26,0.4)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")}
    >
      {/* Image */}
      <div className="relative h-[160px] sm:h-[180px] bg-wo-carbon overflow-hidden">
        <img
          src={product.image_url ?? ""}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src =
              `https://picsum.photos/seed/${encodeURIComponent(product.name)}/600/400`;
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
        <p className="font-syne font-extrabold text-xl text-primary mt-2">S/ {product.price.toFixed(2)}</p>
        <div className="flex items-center justify-between mt-3 gap-2">
          <button
            onClick={handleAdd}
            className={`flex-1 font-jakarta font-bold text-xs py-2.5 px-3 rounded-wo-btn transition-colors min-h-[40px] ${
              added ? "bg-secondary text-secondary-foreground" : "bg-primary text-primary-foreground hover:bg-wo-oro-dark"
            }`}
          >
            {added
              ? <span className="flex items-center justify-center gap-1"><Check size={11} /> Agregado</span>
              : <span>★ {affiliateCode ? "Comprar" : "Agregar"}</span>}
          </button>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setFav(!fav); }}
            className={`w-10 h-10 flex items-center justify-center rounded-wo-btn transition-colors ${fav ? "text-destructive bg-destructive/10" : "text-wo-crema-muted hover:text-destructive hover:bg-wo-carbon"}`}
            aria-label={fav ? "Quitar de favoritos" : "Agregar a favoritos"}
          >
            <Heart size={16} fill={fav ? "currentColor" : "none"} />
          </button>
        </div>
      </div>
    </Link>
  );
}
