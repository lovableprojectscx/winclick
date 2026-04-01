import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import { Star, Check, Shield, Leaf, Truck, ArrowLeft } from "lucide-react";
import { useProduct } from "@/hooks/useProducts";
import { useCart } from "@/contexts/CartContext";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: product, isLoading } = useProduct(id ?? "");
  const { addItem, setIsOpen } = useCart();
  const [added, setAdded] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pt-24 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background pt-24 flex items-center justify-center">
        <p className="text-wo-crema-muted font-jakarta">Producto no encontrado</p>
      </div>
    );
  }

  const handleAdd = () => {
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    addItem(product);
    setIsOpen(true);
  };

  const rating = product.rating ?? 0;

  return (
    <div className="min-h-screen bg-background pt-24 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/catalogo" className="inline-flex items-center gap-1 text-wo-crema-muted hover:text-wo-crema font-jakarta text-xs mb-6">
          <ArrowLeft size={12} /> Volver al catálogo
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Image */}
          <div>
            <div className="relative bg-wo-grafito rounded-wo-card overflow-hidden">
              <img src={product.image_url ?? ""} alt={product.name} className="w-full aspect-square object-cover" />
              {product.organic && (
                <span className="absolute top-3 left-3 px-2.5 py-1 text-[10px] font-jakarta font-bold rounded-wo-pill bg-secondary/90 text-secondary-foreground">
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
            <div className="flex gap-2 mt-3">
              {[
                { icon: <Shield size={12} />, text: "Garantía de calidad" },
                { icon: <Leaf size={12} />,   text: "100% Orgánico" },
                { icon: <Truck size={12} />,  text: "Envíos seguros" },
              ].map((b, i) => (
                <div key={i} className="flex-1 flex items-center gap-1.5 bg-wo-grafito rounded-lg px-2 py-2 text-secondary font-jakarta text-[11px]" style={{ border: "0.5px solid rgba(46,204,113,0.2)" }}>
                  {b.icon}
                  <span className="hidden sm:inline">{b.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Info */}
          <div>
            {/* Tags */}
            <div className="flex gap-2 mb-3 flex-wrap">
              {(product.tags ?? []).map((t) => (
                <span key={t} className="text-[10px] font-jakarta font-bold uppercase tracking-[0.08em] px-2 py-0.5 rounded-wo-pill" style={{ background: "rgba(46,204,113,0.12)", color: "hsl(var(--wo-esmeralda))", border: "0.5px solid rgba(46,204,113,0.25)" }}>
                  {t}
                </span>
              ))}
            </div>

            <h1 className="font-syne font-extrabold text-[30px] text-wo-crema mb-2">{product.name}</h1>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={14} className={i < Math.floor(rating) ? "text-primary fill-primary" : "text-wo-crema-muted/30"} />
                ))}
              </div>
              <span className="font-jakarta font-semibold text-sm text-wo-crema">{rating}</span>
              <span className="font-jakarta text-xs text-wo-crema-muted">({product.reviews_count} reseñas)</span>
            </div>

            {/* Price */}
            <div className="rounded-wo-btn p-3.5 mb-6" style={{ background: "rgba(242,201,76,0.08)", border: "0.5px solid rgba(242,201,76,0.2)" }}>
              <span className="font-syne font-extrabold text-[32px] text-primary">S/ {product.price.toFixed(2)}</span>
            </div>

            {/* Description */}
            <p className="font-jakarta text-sm text-wo-crema-muted leading-[1.7] mb-6 whitespace-pre-line">{product.description}</p>

            {/* Availability */}
            <div className="mb-6">
              {(product.stock ?? 0) > 0 ? (
                <span className="inline-flex items-center gap-1.5 text-secondary font-jakarta text-xs font-medium">
                  <span className="w-2 h-2 rounded-full bg-secondary" /> En stock
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-destructive font-jakarta text-xs font-medium">
                  <span className="w-2 h-2 rounded-full bg-destructive" /> Agotado
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={handleAdd}
                disabled={(product.stock ?? 0) === 0}
                className={`w-full font-jakarta font-bold text-sm py-3 rounded-wo-btn transition-colors ${
                  added ? "bg-secondary text-secondary-foreground" : "text-wo-crema/80 hover:text-wo-crema disabled:opacity-40"
                }`}
                style={!added ? { border: "0.5px solid rgba(248,244,236,0.2)" } : {}}
              >
                {added ? <span className="flex items-center justify-center gap-1"><Check size={14} /> Agregado al carrito</span> : "Añadir al carrito"}
              </button>
              <button
                onClick={handleBuyNow}
                disabled={(product.stock ?? 0) === 0}
                className="w-full bg-primary text-primary-foreground font-jakarta font-bold text-sm py-3 rounded-wo-btn hover:bg-wo-oro-dark transition-colors disabled:opacity-40"
              >
                Comprar ahora
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky mobile bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden bg-wo-grafito/95 backdrop-blur-md p-4 flex items-center gap-3 z-40" style={{ borderTop: "0.5px solid rgba(255,255,255,0.1)" }}>
        <span className="font-syne font-extrabold text-lg text-primary">S/ {product.price.toFixed(2)}</span>
        <div className="flex-1 flex gap-2">
          <button onClick={handleAdd} className="flex-1 font-jakarta font-bold text-xs py-2.5 rounded-wo-btn text-wo-crema/80" style={{ border: "0.5px solid rgba(248,244,236,0.2)" }}>Añadir</button>
          <button onClick={handleBuyNow} className="flex-1 bg-primary text-primary-foreground font-jakarta font-bold text-xs py-2.5 rounded-wo-btn">Comprar</button>
        </div>
      </div>
    </div>
  );
}
