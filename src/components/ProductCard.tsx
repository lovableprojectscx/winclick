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
      className="group block bg-wo-grafito rounded-wo-card overflow-hidden transition-all hover:shadow-lg"
      style={{ border: "0.5px solid rgba(255,255,255,0.07)" }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(242,201,76,0.4)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")}
    >
      {/* Image */}
      <div className="relative h-[140px] bg-wo-carbon overflow-hidden">
        <img
          src={product.image_url ?? ""}
          alt={product.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src =
              `https://picsum.photos/seed/${encodeURIComponent(product.name)}/600/400`;
          }}
        />
        {(product.rating ?? 0) >= 4.5 && (
          <span className="absolute top-2 left-2 px-2 py-0.5 text-[10px] font-jakarta font-bold bg-primary text-primary-foreground rounded-wo-pill">
            Premium
          </span>
        )}
        {(product.stock ?? 0) <= 10 && (product.stock ?? 0) > 0 && (
          <span className="absolute top-2 right-2 px-2 py-0.5 text-[10px] font-jakarta font-bold rounded-wo-pill" style={{ background: "rgba(231,76,60,0.85)", color: "#fff" }}>
            Últimas unidades
          </span>
        )}
        {product.organic && (
          <span className="absolute bottom-2 left-2 px-2 py-0.5 text-[10px] font-jakarta font-bold rounded-wo-pill" style={{ background: "rgba(46,204,113,0.85)", color: "#0A0B09" }}>
            Orgánico
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-3.5">
        <p className="font-jakarta font-semibold text-sm text-wo-crema truncate">{product.name}</p>
        <div className="flex items-center gap-1 mt-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} size={10} className={i < Math.floor(product.rating ?? 0) ? "text-primary fill-primary" : "text-wo-crema-muted opacity-30"} />
          ))}
          <span className="text-[11px] text-wo-crema-muted font-jakarta ml-1">{product.rating ?? "—"}</span>
        </div>
        <p className="font-syne font-extrabold text-lg text-primary mt-1.5">S/ {product.price.toFixed(2)}</p>
        <div className="flex items-center justify-between mt-2">
          <button
            onClick={handleAdd}
            className={`font-jakarta font-bold text-[11px] px-3 py-1.5 rounded-wo-btn transition-colors ${
              added ? "bg-secondary text-secondary-foreground" : "bg-primary text-primary-foreground hover:bg-wo-oro-dark"
            }`}
          >
            {added
              ? <span className="flex items-center gap-1"><Check size={10} /> Agregado</span>
              : <span>★ {affiliateCode ? `Comprar con ${affiliateCode.split("-")[1]}` : "Agregar"}</span>}
          </button>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setFav(!fav); }}
            className={`p-1.5 transition-colors ${fav ? "text-destructive" : "text-wo-crema-muted hover:text-destructive"}`}
          >
            <Heart size={14} fill={fav ? "currentColor" : "none"} />
          </button>
        </div>
      </div>
    </Link>
  );
}
