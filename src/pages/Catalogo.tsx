import { useState, useMemo } from "react";
import { Search, X } from "lucide-react";
import { useProducts, useCategories } from "@/hooks/useProducts";
import ProductCard from "@/components/ProductCard";

export default function Catalogo() {
  const [search,         setSearch]         = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState<string | "all">("all");

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

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-syne font-extrabold text-[28px] text-wo-crema mb-2">Catálogo</h1>
        <p className="font-jakarta text-sm text-wo-crema-muted mb-8">Explora nuestros productos orgánicos premium.</p>

        {/* Search */}
        <div className="relative mb-6">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-wo-crema-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar productos..."
            className="w-full bg-wo-grafito font-jakarta text-sm text-wo-crema placeholder:text-wo-crema/30 pl-11 pr-10 py-3 rounded-wo-btn outline-none focus:ring-1 focus:ring-primary"
            style={{ border: "0.5px solid rgba(255,255,255,0.07)" }}
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-wo-crema-muted hover:text-wo-crema">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-8 scrollbar-hide">
          <button
            onClick={() => setActiveCategoryId("all")}
            className={`whitespace-nowrap font-jakarta text-xs font-medium px-4 py-2 rounded-wo-pill transition-colors ${
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
              className={`whitespace-nowrap font-jakarta text-xs font-medium px-4 py-2 rounded-wo-pill transition-colors ${
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-wo-grafito rounded-wo-card h-[240px] animate-pulse" style={{ border: "0.5px solid rgba(255,255,255,0.07)" }} />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Search size={40} className="text-wo-crema-muted opacity-30" />
            <p className="font-jakarta text-sm text-wo-crema-muted">Sin resultados para "{search || "esta categoría"}"</p>
            <button
              onClick={() => { setSearch(""); setActiveCategoryId("all"); }}
              className="font-jakarta text-sm text-wo-crema/80 px-4 py-2 rounded-wo-btn hover:text-wo-crema transition-colors"
              style={{ border: "0.5px solid rgba(248,244,236,0.2)" }}
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
