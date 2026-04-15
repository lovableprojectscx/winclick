import { useState, useMemo } from "react";
import { useSEO } from "@/hooks/useSEO";
import { Search, X } from "lucide-react";
import { useProducts, useCategories } from "@/hooks/useProducts";
import ProductCard from "@/components/ProductCard";

export default function Catalogo() {
  const [search,            setSearch]            = useState("");
  const [activeCategoryId,  setActiveCategoryId]  = useState<string | "all">("all");

  const { data: products = [],   isLoading: loadingProducts }   = useProducts();
  const { data: categories = [], isLoading: loadingCategories } = useCategories();

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.tags ?? []).some((t) => t.toLowerCase().includes(search.toLowerCase()));
      const matchCat = activeCategoryId === "all" || p.category_id === activeCategoryId;
      return matchSearch && matchCat && p.is_active;
    });
  }, [search, activeCategoryId, products]);

  const loading = loadingProducts || loadingCategories;
  useSEO({
    title: "Productos Orgánicos y Premium Winclick Perú | Tienda Online",
    description: "Compra productos orgánicos y premium en Winclick Perú. Suplementos, proteínas, colágeno, detox y más. Envíos a Lima y todo el Perú. Gana comisiones revendiendo.",
    canonical: "https://winclick.pe/catalogo",
  });

  return (
    <div className="min-h-screen bg-background pb-16">

      {/* Banner hero */}
      <div className="relative overflow-hidden pt-16" style={{ minHeight: "260px" }}>
        <img
          src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1600&h=400&fit=crop&crop=center&auto=format&q=80"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(105deg, rgba(5,12,28,0.95) 0%, rgba(5,12,28,0.7) 60%, rgba(5,12,28,0.45) 100%)" }} />
        <div className="relative z-10 flex flex-col justify-center h-full px-6 sm:px-12 lg:px-16 py-16">
          <p className="font-jakarta text-[11px] font-bold tracking-[0.22em] uppercase text-primary mb-3">Winclick · Tienda</p>
          <h1 className="font-syne font-extrabold text-[38px] sm:text-[52px] text-wo-crema leading-[1.05] mb-2">
            Productos Premium
          </h1>
          <p className="font-jakarta text-[16px] text-wo-crema-muted max-w-md">
            Orgánicos, naturales y de alta recompra. Vende lo que la gente ama.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">

        {/* Search */}
        <div className="relative mb-5">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-wo-crema-muted pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar productos..."
            className="w-full bg-wo-grafito font-jakarta text-sm text-wo-crema placeholder:text-wo-crema/30 pl-11 pr-10 py-3.5 rounded-wo-btn outline-none focus:ring-1 focus:ring-primary"
            style={{ border: "0.5px solid rgba(255,255,255,0.07)" }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-wo-crema-muted hover:text-wo-crema rounded"
              aria-label="Limpiar búsqueda"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Category tabs — scroll horizontal en mobile */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-hide -mx-4 px-4">
          <button
            onClick={() => setActiveCategoryId("all")}
            className={`shrink-0 whitespace-nowrap font-jakarta text-xs font-medium px-4 py-2.5 rounded-wo-pill transition-colors min-h-[38px] ${
              activeCategoryId === "all" ? "bg-primary text-primary-foreground" : "bg-wo-carbon text-wo-crema-muted hover:text-wo-crema"
            }`}
            style={activeCategoryId !== "all" ? { border: "0.5px solid rgba(255,255,255,0.07)" } : {}}
          >
            Todos
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCategoryId(c.id)}
              className={`shrink-0 whitespace-nowrap font-jakarta text-xs font-medium px-4 py-2.5 rounded-wo-pill transition-colors min-h-[38px] ${
                activeCategoryId === c.id ? "bg-primary text-primary-foreground" : "bg-wo-carbon text-wo-crema-muted hover:text-wo-crema"
              }`}
              style={activeCategoryId !== c.id ? { border: "0.5px solid rgba(255,255,255,0.07)" } : {}}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-wo-grafito rounded-wo-card h-[260px] skeleton-shimmer" style={{ border: "0.5px solid rgba(255,255,255,0.07)" }} />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 