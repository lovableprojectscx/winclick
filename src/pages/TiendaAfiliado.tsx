import { useParams, Link } from "react-router-dom";
import { useEffect } from "react";
import { useStoreProducts } from "@/hooks/useProducts";
import { useCart } from "@/contexts/CartContext";
import ProductCard from "@/components/ProductCard";
import { MessageCircle } from "lucide-react";

export default function TiendaAfiliado() {
  const { codigo = "" } = useParams<{ codigo: string }>();
  const { setAffiliateCode } = useCart();
  const { data, isLoading } = useStoreProducts(codigo);

  // Registrar el código de afiliado en el carrito para comisiones
  useEffect(() => {
    if (codigo) setAffiliateCode(codigo.toUpperCase());
    return () => setAffiliateCode(null);
  }, [codigo, setAffiliateCode]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pt-24 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!data?.store) {
    return (
      <div className="min-h-screen bg-background pt-24 flex flex-col items-center justify-center gap-4">
        <p className="font-syne font-bold text-xl text-wo-crema">Tienda no encontrada</p>
        <Link to="/" className="bg-primary text-primary-foreground font-jakarta font-bold text-sm px-6 py-3 rounded-wo-btn">Ir al inicio</Link>
      </div>
    );
  }

  const { store, products } = data;
  const affiliateInitials = (store.store_name ?? codigo).substring(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-background pt-16">
      {/* Banner */}
      <div className="relative h-[180px] overflow-hidden" style={{ background: store.accent_color ?? "hsl(var(--wo-grafito))" }}>
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4 flex items-end gap-3 z-10">
          <div className="text-4xl">{store.banner_emoji ?? "🌿"}</div>
          <div>
            <h1 className="font-syne font-extrabold text-2xl text-wo-crema">{store.store_name}</h1>
            <p className="font-jakarta text-sm text-wo-crema-muted">{store.tagline}</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Affiliate info */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-syne font-bold text-lg">
              {affiliateInitials}
            </div>
            <div>
              <p className="font-jakarta font-semibold text-sm text-wo-crema">{store.store_name}</p>
              <span className="text-[10px] font-jakarta font-bold px-2 py-0.5 rounded-wo-pill" style={{ background: "rgba(242,201,76,0.12)", color: "hsl(var(--wo-oro))" }}>
                {codigo.toUpperCase()}
              </span>
            </div>
          </div>
          {store.whatsapp && (
            <a
              href={`https://wa.me/51${store.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground font-jakarta font-bold text-sm px-5 py-2.5 rounded-wo-btn hover:bg-wo-esmeralda-dark transition-colors"
            >
              <MessageCircle size={14} /> Contactar por WhatsApp
            </a>
          )}
        </div>

        <p className="font-jakarta text-[11px] text-wo-crema-muted mb-6">Powered by Winner Organa</p>

        {/* Products */}
        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} affiliateCode={codigo.toUpperCase()} />
            ))}
          </div>
        ) : (
          <p className="font-jakarta text-sm text-wo-crema-muted text-center py-12">Esta tienda no tiene productos destacados aún.</p>
        )}
      </div>

      {/* Store footer */}
      <div className="bg-wo-grafito py-8 text-center" style={{ borderTop: "0.5px solid rgba(255,255,255,0.07)" }}>
        <p className="font-jakarta text-xs text-wo-crema-muted">
          Tienda oficial — Afiliado Winner Organa
        </p>
        <Link to="/registro-afiliado" className="inline-block font-jakarta text-xs text-primary hover:underline mt-2">
          ¿Quieres tu propia tienda? → Regístrate gratis
        </Link>
      </div>
    </div>
  );
}
