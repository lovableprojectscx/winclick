/**
 * TiendaAfiliado — Vitrina pública del socio WinClick
 *
 * REGLA FUNDAMENTAL:
 *  Esta tienda es para los CLIENTES FINALES del socio, no para otros socios.
 *  → Los precios mostrados son SIEMPRE el precio público (o precio custom del socio).
 *  → Nunca se aplican descuentos de membresía WinClick, sin importar quién esté logueado.
 *  → El contexto `storeCtx` de tipo AffiliateStoreContext es lo que garantiza este blindaje.
 */

import { useParams, Link } from "react-router-dom";
import { useEffect, useMemo } from "react";
import { useStoreProducts } from "@/hooks/useProducts";
import { useCart } from "@/contexts/CartContext";
import ProductCard from "@/components/ProductCard";
import { MessageCircle } from "lucide-react";
import { DynamicIcon } from "@/components/DynamicIcon";
import { parseCustomPrices, type AffiliateStoreContext } from "@/lib/storeContext";

export default function TiendaAfiliado() {
  const { codigo = "" } = useParams<{ codigo: string }>();
  const { setAffiliateCode } = useCart();
  const { data, isLoading } = useStoreProducts(codigo);

  // Registrar el código de afiliado en el carrito para comisiones
  useEffect(() => {
    if (codigo) setAffiliateCode(codigo.toUpperCase());
  }, [codigo, setAffiliateCode]);

  /**
   * Contexto de tienda afiliado — se construye una sola vez y se pasa a TODOS los ProductCard.
   * Al recibir este contexto, ProductCard sabe que debe usar siempre el precio público / custom,
   * NUNCA el precio de membresía WinClick.
   */
  const storeCtx = useMemo<AffiliateStoreContext | undefined>(() => {
    if (!data?.store) return undefined;
    return {
      mode: "affiliate",
      customPrices: parseCustomPrices(data.store.custom_prices),
    };
  }, [data?.store]);

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

  const bannerBgStyle = store.banner_type === 'image' && store.banner_image_url
    ? { backgroundImage: `url(${store.banner_image_url})`, backgroundColor: store.accent_color ?? "hsl(var(--wo-grafito))" }
    : { backgroundColor: store.accent_color ?? "hsl(var(--wo-grafito))" };

  return (
    <div className="min-h-screen bg-background pt-16">
      {/* Banner */}
      <div className="relative h-[220px] overflow-hidden bg-cover bg-center" style={bannerBgStyle}>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        <div className="absolute bottom-6 left-6 right-6 flex items-end gap-5 z-10 max-w-7xl mx-auto">
          <div className="p-4 bg-wo-carbon/40 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl">
            {store.banner_icon ? (
              <DynamicIcon name={store.banner_icon} size={42} className="text-primary" strokeWidth={2.5} />
            ) : (
              <div className="text-5xl">{store.banner_emoji ?? "🌿"}</div>
            )}
          </div>
          <div className="pb-2">
            <h1 className="font-syne font-extrabold text-3xl sm:text-4xl text-wo-crema leading-none mb-1">{store.store_name}</h1>
            <p className="font-jakarta text-sm sm:text-base text-wo-crema-muted opacity-80">{store.tagline}</p>
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
              <span className="text-[10px] font-jakarta font-bold px-2 py-0.5 rounded-wo-pill" style={{ background: "rgba(232,116,26,0.12)", color: "hsl(var(--wo-oro))" }}>
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

        <p className="font-jakarta text-[11px] text-wo-crema-muted mb-6">Powered by Winclick</p>

        {/* Products — con contexto de tienda afiliado garantizado */}
        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                affiliateCode={codigo.toUpperCase()}
                storeCtx={storeCtx}   // ← BLINDAJE: fuerza precio público / custom
              />
            ))}
          </div>
        ) : (
          <p className="font-jakarta text-sm text-wo-crema-muted text-center py-12">Esta tienda no tiene productos destacados aún.</p>
        )}
      </div>

      {/* Store footer */}
      <div className="bg-wo-grafito py-8 text-center" style={{ borderTop: "0.5px solid rgba(255,255,255,0.07)" }}>
        <p className="font-jakarta text-xs text-wo-crema-muted">
          Tienda oficial — Afiliado Winclick
        </p>
        <Link to="/registro-afiliado" className="inline-block font-jakarta text-xs text-primary hover:underline mt-2">
          ¿Quieres tu propia tienda? → Regístrate gratis
        </Link>
      </div>
    </div>
  );
}
